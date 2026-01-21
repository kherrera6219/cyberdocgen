import { initTelemetry } from "./monitoring/telemetry";

// Initialize OpenTelemetry
initTelemetry();

import express from "express";
import crypto from "crypto";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";

import { validateEnvironment } from "./utils/validation";
import { logger } from "./utils/logger";
import { healthCheckHandler, readinessCheckHandler, livenessCheckHandler } from "./utils/health";
import { getRuntimeConfig, logRuntimeConfig } from "./config/runtime";
import { getProviders } from "./providers";

// Validate environment variables before starting
validateEnvironment();

// Log runtime configuration
logRuntimeConfig();

const app = express();

// Trust proxy for rate limiting in Replit environment
app.set('trust proxy', true);

// Basic health checks (should be registered before other things)
app.get('/health', healthCheckHandler);
app.get('/ready', readinessCheckHandler);
app.get('/live', livenessCheckHandler);

// Request ID assignment for lifecycle logging
app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  req.requestId = requestId;
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      logger.info(`${req.method} ${path} ${res.statusCode} ${duration}ms`, {
        requestId,
        method: req.method,
        path,
        statusCode: res.statusCode,
        durationMs: duration
      });
    }
  });

  next();
});

(async () => {
  // Initialize providers (database, storage, auth, secrets)
  let providers;
  try {
    logger.info('Initializing providers...');
    providers = await getProviders();

    // Connect to database
    await providers.db.connect();
    logger.info('Database connection established');

    // Run database migrations
    await providers.db.migrate();
    logger.info('Database migrations complete');

    // Verify database health
    const isHealthy = await providers.db.healthCheck();
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }
    logger.info('Database health check passed');

    // Initialize auth provider if needed
    if (providers.auth.initialize) {
      await providers.auth.initialize();
      logger.info('Auth provider initialized');
    }

    logger.info('All providers initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize providers', { error });
    process.exit(1);
  }

  // Initialize MCP (Model Context Protocol) system
  try {
    const { initializeMCP } = await import('./mcp/initialize.js');
    initializeMCP();
    logger.info('MCP system initialized');
  } catch (error) {
    logger.error('Failed to initialize MCP system', { error });
  }

  const server = await registerRoutes(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const config = getRuntimeConfig();
  const port = config.server.port;
  const host = config.server.host;

  // SECURITY: In local mode, ENFORCE localhost-only binding
  if (config.mode === 'local' && host !== '127.0.0.1') {
    const error = new Error(
      `SECURITY VIOLATION: Local mode MUST bind to 127.0.0.1 only. ` +
      `Attempted to bind to: ${host}`
    );
    logger.error('Security violation: Invalid host binding in local mode', {
      attemptedHost: host,
      requiredHost: '127.0.0.1',
      mode: config.mode
    });
    throw error;
  }

  server.listen({
    port,
    host,
    reusePort: true,
  }, () => {
    logger.info(`Server started on ${host}:${port}`, {
      port,
      host,
      mode: config.mode,
      environment: process.env.NODE_ENV
    });

    // Additional security log for local mode
    if (config.mode === 'local') {
      logger.info('Local mode security: Server bound to localhost only', {
        host,
        message: 'External network access blocked'
      });
    }
  });

  // Graceful shutdown handling for autoscale deployments
  let isShuttingDown = false;
  
  const gracefulShutdown = (signal: string, exitCode: number = 0) => {
    if (isShuttingDown) {
      logger.warn(`${signal} received during shutdown, ignoring duplicate signal`);
      return;
    }
    isShuttingDown = true;
    
    logger.info(`${signal} received, starting graceful shutdown...`);
    
    // Stop accepting new connections
    server.close(async (err) => {
      if (err) {
        logger.error('Error during server close', { error: err.message });
        process.exit(1);
      }

      logger.info('HTTP server closed, cleaning up resources...');

      // Close database connection
      try {
        if (providers && providers.db) {
          await providers.db.close();
          logger.info('Database connection closed');
        }
      } catch (error) {
        logger.error('Error closing database', { error });
      }

      // Give time for ongoing requests to complete
      setTimeout(() => {
        logger.info('Graceful shutdown complete');
        process.exit(exitCode);
      }, 5000);
    });
    
    // Force exit after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  // Handle shutdown signals from autoscale infrastructure
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM', 0));
  process.on('SIGINT', () => gracefulShutdown('SIGINT', 0));
  
  // Handle uncaught errors - exit with non-zero code to signal failure to autoscale
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    gracefulShutdown('uncaughtException', 1);
  });
  
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason: String(reason) });
  });
})();
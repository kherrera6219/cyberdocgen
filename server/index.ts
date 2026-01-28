import express from "express";
import crypto from "crypto";
import { registerRoutes } from "./routes";
import { validateEnvironment } from "./utils/validation";
import { logger } from "./utils/logger";
import { healthCheckHandler, readinessCheckHandler, livenessCheckHandler } from "./utils/health";
import { getRuntimeConfig, logRuntimeConfig } from "./config/runtime";
import { getProviders } from "./providers";
import { serveStatic } from "./static";

(async () => {
  // Initialize OpenTelemetry with error handling
  // In local mode, telemetry may not be critical - allow server to start anyway
  try {
    const { initTelemetry } = await import("./monitoring/telemetry.js");
    initTelemetry();
    logger.debug('[Server] Telemetry initialized');
  } catch (error) {
    console.warn('[Server] Telemetry initialization failed (non-critical):', error);
  }

  // Initialize Sentry error monitoring
  try {
    const { initializeSentry } = await import("./monitoring/sentry.js");
    initializeSentry();
    logger.debug('[Server] Sentry error monitoring initialized');
  } catch (error) {
    console.warn('[Server] Sentry initialization failed (non-critical):', error);
  }

  // Log startup phase
  logger.debug('==================================================');
  logger.debug('[Server] Starting CyberDocGen Backend Server');
  logger.debug(`[Server] Node version: ${process.version}`);
  logger.debug(`[Server] Platform: ${process.platform}`);
  logger.debug(`[Server] PID: ${process.pid}`);
  logger.debug(`[Server] Working directory: ${process.cwd()}`);
  logger.debug(`[Server] Environment: ${process.env.NODE_ENV || 'not set'}`);
  logger.debug(`[Server] Deployment mode: ${process.env.DEPLOYMENT_MODE || 'not set'}`);
  logger.debug('==================================================');

  // Validate environment variables before starting
  logger.debug('[Server] Validating environment variables...');
  try {
    validateEnvironment();
    logger.debug('[Server] Environment validation passed');
  } catch (error) {
    logger.error('[Server] FATAL: Environment validation failed:', error);
    throw error;
  }

  // Log runtime configuration
  logger.debug('[Server] Logging runtime configuration...');
  logRuntimeConfig();

  const app = express();

  // Trust proxy for rate limiting in Replit environment
  app.set('trust proxy', true);

  // Basic health checks (should be registered before other things)
  app.get('/health', healthCheckHandler);
  app.get('/ready', readinessCheckHandler);
  app.get('/live', livenessCheckHandler);

  // Request ID assignment for lifecycle logging
  app.use((req: any, res: any, next: any) => {
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

  logger.debug('[Server] === STARTING ASYNC INITIALIZATION ===');
  
  // Initialize providers (database, storage, auth, secrets)
  let providers;
  try {
    logger.debug('[Server] Step 1: Initializing providers...');
    logger.info('Initializing providers...');
    providers = await getProviders();
    logger.debug('[Server] Step 1: Providers initialized successfully');

    // Connect to database
    logger.debug('[Server] Step 2: Connecting to database...');
    await providers.db.connect();
    logger.info('Database connection established');
    logger.debug('[Server] Step 2: Database connected successfully');

    // Run database migrations
    logger.debug('[Server] Step 3: Running database migrations...');
    await providers.db.migrate();
    logger.info('Database migrations complete');
    logger.debug('[Server] Step 3: Migrations completed successfully');

    // Verify database health
    logger.debug('[Server] Step 4: Running database health check...');
    const isHealthy = await providers.db.healthCheck();
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }
    logger.info('Database health check passed');
    logger.debug('[Server] Step 4: Health check passed');

    // Initialize auth provider if needed
    logger.debug('[Server] Step 5: Initializing auth provider...');
    if (providers.auth.initialize) {
      await providers.auth.initialize();
      logger.info('Auth provider initialized');
      logger.debug('[Server] Step 5: Auth provider initialized');
    } else {
      logger.debug('[Server] Step 5: Auth provider does not need initialization');
    }

    logger.info('All providers initialized successfully');
    logger.debug('[Server] === ALL PROVIDERS INITIALIZED ===');
  } catch (error) {
    logger.error('[Server] FATAL ERROR during provider initialization:', error);
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

  logger.debug('[Server] Step 6: Registering routes...');
  const server = await registerRoutes(app);
  logger.debug('[Server] Step 6: Routes registered successfully');

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  logger.debug(`[Server] Step 7: Setting up static/vite. Env: ${app.get("env")}`);
  if (app.get("env") === "development") {
    const { setupVite } = await import("./vite.js");
    await setupVite(app, server);
  } else {
    logger.debug('[Server] Production mode: Configuring static file server');
    serveStatic(app);
  }
  logger.debug('[Server] Step 7: Static/Vite setup complete');

  // ALWAYS serve the app on the port specified in the environment variable PORT
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

  logger.debug(`[Server] Step 8: Preparing to listen on ${host}:${port}`);
  server.listen({
    port,
    host,
    // CRITICAL: reusePort is not supported on all platforms (like Windows)
    // and can cause startup failures. Disable for local/desktop mode.
    reusePort: config.mode !== 'local',
  }, () => {
    logger.debug(`[Server] SUCCESS: Listening on http://${host}:${port}`);
    logger.info(`Server started on ${host}:${port}`, {
      port,
      host,
      mode: config.mode,
      environment: process.env.NODE_ENV
    });

    if (config.mode === 'local') {
      logger.info('Local mode security: Server bound to localhost only', {
        host,
        message: 'External network access blocked'
      });
    }
  });

  // Graceful shutdown handling
  let isShuttingDown = false;
  
  const gracefulShutdown = (signal: string, exitCode: number = 0) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    logger.info(`${signal} received, starting graceful shutdown...`);
    
    server.close(async (err) => {
      if (err) {
        logger.error('Error during server close', { error: err.message });
        process.exit(1);
      }

      logger.info('HTTP server closed, cleaning up resources...');

      try {
        if (providers && providers.db) {
          await providers.db.close();
          logger.info('Database connection closed');
        }
      } catch (error) {
        logger.error('Error closing database', { error });
      }

      setTimeout(() => {
        logger.info('Graceful shutdown complete');
        process.exit(exitCode);
      }, 5000);
    });
    
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM', 0));
  process.on('SIGINT', () => gracefulShutdown('SIGINT', 0));
  
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    gracefulShutdown('uncaughtException', 1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    const errorMsg = reason instanceof Error ? reason.message : String(reason);
    const errorStack = reason instanceof Error ? reason.stack : 'No stack trace';
    logger.error('Unhandled rejection', { 
      reason: errorMsg, 
      stack: errorStack 
    });
    logger.error(`[Server] FATAL: Unhandled Rejection: ${errorMsg}`);
    logger.error(errorStack);
    gracefulShutdown('unhandledRejection', 1);
  });
})();

import express, { type Request, Response, NextFunction } from "express";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";
import { getSession } from "./replitAuth";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
import {
  generalLimiter,
  validateRequest,
  securityHeaders,
  errorHandler,
  threatDetection,
  auditLogger,
  requireMFA,
  requireMFAForHighRisk,
  csrfProtection
} from "./middleware/security";
import { validateRouteAccess, logRoutePerformance } from "./middleware/routeValidation";
import { validateEnvironment } from "./utils/validation";
import { logger } from "./utils/logger";
import { healthCheckHandler, readinessCheckHandler, livenessCheckHandler } from "./utils/health";
import { performanceService } from './services/performanceService';
import { alertingService } from './services/alertingService';
import { threatDetectionService } from './services/threatDetectionService';


// Validate environment variables before starting
validateEnvironment();

const app = express();

// Trust proxy for rate limiting in Replit environment
app.set('trust proxy', true);

// Health check endpoints (no auth required)
app.get('/health', healthCheckHandler);
app.get('/ready', readinessCheckHandler);
app.get('/live', livenessCheckHandler);

// Production environment detection
const isProduction = process.env.NODE_ENV === 'production';

// CORS configuration with secure production defaults
const getAllowedOrigins = () => {
  if (!isProduction) return true;
  
  const origins = process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean);
  
  // Use configured origins if provided and non-empty, otherwise fallback to Replit domains
  if (origins && origins.length > 0) {
    return origins;
  }
  
  // Default whitelist for Replit platform domains
  return [/\.replit\.dev$/, /\.repl\.co$/, /\.replit\.app$/];
};

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-ID']
};

// Compression middleware for production performance
if (isProduction) {
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));
}

// Security middleware - only apply to API routes
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(cookieParser());

// Session middleware MUST be initialized BEFORE CSRF protection
// CSRF requires session to store and validate tokens
app.use(getSession());

// CSRF protection middleware - now has access to session
app.use(csrfProtection);

// Security and performance monitoring
app.use(threatDetection);

// Comprehensive audit logging for compliance
app.use(auditLogger);

// Request logging and validation
app.use('/api', validateRouteAccess);
app.use('/api', logRoutePerformance);
app.use('/api', generalLimiter);

// MFA enforcement for high-risk operations
app.use('/api', requireMFAForHighRisk);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use('/api', validateRequest);

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
  // Initialize MCP (Model Context Protocol) system
  try {
    const { initializeMCP } = await import('./mcp/initialize.js');
    initializeMCP();
    logger.info('MCP system initialized');
  } catch (error) {
    logger.error('Failed to initialize MCP system', { error });
  }

  const server = await registerRoutes(app);

  // Use the enhanced error handler
  app.use(errorHandler);

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
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    logger.info(`Server started on port ${port}`, { port, environment: process.env.NODE_ENV });
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
    server.close((err) => {
      if (err) {
        logger.error('Error during server close', { error: err.message });
        process.exit(1);
      }
      
      logger.info('HTTP server closed, cleaning up resources...');
      
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
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', { reason: String(reason) });
  });
})();
import express, { type Request, Response, NextFunction } from "express";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";

declare global {
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

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || []
    : true,
  credentials: true,
  optionsSuccessStatus: 200
};

// Security middleware - only apply to API routes
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(cookieParser());

// CSRF token endpoint - returns session-bound token
// Note: This must come after session middleware is initialized in registerRoutes
// For now, provide a temporary endpoint that will be overridden after auth setup

// CSRF protection middleware
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
})();
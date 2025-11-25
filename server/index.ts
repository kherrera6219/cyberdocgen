import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";
import {
  generalLimiter,
  sanitizeInput,
  validateRequest,
  securityHeaders,
  errorHandler,
  threatDetection,
  auditLogger,
  requireMFA,
  requireMFAForHighRisk
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
app.use('/api', sanitizeInput);
app.use('/api', validateRequest);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
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
    console.log(`serving on port ${port}`);
  });
})();
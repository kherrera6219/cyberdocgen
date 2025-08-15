import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Error sanitization for production
export function sanitizeError(error: any): { message: string; code?: string } {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    return {
      message: error.message || 'Internal server error',
      code: error.code,
    };
  }

  // In production, only expose safe error messages
  const safeErrors: Record<string, string> = {
    'ValidationError': 'Invalid input data',
    'UnauthorizedError': 'Authentication required',
    'ForbiddenError': 'Access denied',
    'NotFoundError': 'Resource not found',
    'ConflictError': 'Resource already exists',
    'RateLimitError': 'Too many requests',
  };

  const errorType = error.constructor.name;
  return {
    message: safeErrors[errorType] || 'Internal server error',
    code: error.code && ['VALIDATION_ERROR', 'AUTH_ERROR'].includes(error.code) ? error.code : undefined,
  };
}

// Global error handler
export function globalErrorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string;
  const userId = (req as any)?.user?.claims?.sub;

  // Log the full error for internal tracking
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    requestId,
    userId,
    url: req.url,
    method: req.method,
    body: req.body,
    headers: req.headers,
  }, req);

  // Send sanitized error to client
  const sanitized = sanitizeError(error);
  const statusCode = error.statusCode || error.status || 500;

  res.status(statusCode).json({
    success: false,
    error: sanitized.message,
    code: sanitized.code,
    requestId,
    timestamp: new Date().toISOString(),
  });
}

// Request ID middleware
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
}

// Response caching middleware
export function cacheMiddleware(duration: number = 300) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${req.originalUrl}_${(req as any)?.user?.claims?.sub || 'anonymous'}`;
    
    // Simple in-memory cache (in production, use Redis)
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedResponse);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data: any) {
      if (res.statusCode === 200) {
        cache.set(cacheKey, data, duration);
        res.setHeader('X-Cache', 'MISS');
      }
      return originalJson.call(this, data);
    };

    next();
  };
}

// Simple in-memory cache (replace with Redis in production)
class SimpleCache {
  private store = new Map<string, { data: any; expires: number }>();

  get(key: string): any {
    const item = this.store.get(key);
    if (!item || item.expires < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.data;
  }

  set(key: string, data: any, ttlSeconds: number): void {
    this.store.set(key, {
      data,
      expires: Date.now() + (ttlSeconds * 1000),
    });
  }

  clear(): void {
    this.store.clear();
  }
}

const cache = new SimpleCache();

// Health check endpoint
export function healthCheck(req: Request, res: Response): void {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: 'connected', // Add actual database health check
    objectStorage: 'connected', // Add actual object storage health check
  };

  res.json(health);
}

// Graceful shutdown handler
export function setupGracefulShutdown(server: any): void {
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
}
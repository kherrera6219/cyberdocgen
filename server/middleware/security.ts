// @ts-nocheck
import { Request, Response, NextFunction } from "express";
import { rateLimit } from "express-rate-limit";
import { logger } from "../utils/logger";
import { performanceService } from '../services/performanceService';
import { threatDetectionService } from '../services/threatDetectionService';

// Audit logging middleware
export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  const auditData = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  };

  logger.info('audit', `${req.method} ${req.url}`, auditData);
  next();
};

// Rate limiting configurations
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 generation requests per hour
  message: "Generation limit exceeded. Please wait before generating more documents.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Input sanitization middleware
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Basic input sanitization
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .trim();
    } else if (Array.isArray(obj)) {
      return obj.map(item => sanitize(item));
    } else if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }

  next();
}

// Request validation middleware
export function validateRequest(req: Request, res: Response, next: NextFunction) {
  // Check Content-Type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (!req.is('application/json')) {
      return res.status(400).json({
        message: "Content-Type must be application/json"
      });
    }
  }

  // Validate request size (already handled by express.json() limit)
  // Additional custom validations can be added here

  next();
}

// Enhanced security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Skip security headers for development static assets
  if (req.path.startsWith('/@') || req.path.includes('.')) {
    return next();
  }

  // Core security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy for enhanced security
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.openai.com https://api.anthropic.com",
    "font-src 'self' https://fonts.gstatic.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'"
  ];
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  // HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
}

// Threat detection middleware
export const threatDetection = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Analyze request for security threats
  const threat = threatDetectionService.analyzeRequest(req);

  if (threat && threatDetectionService.shouldBlockRequest(threat)) {
    logger.error('Request blocked due to security threat', {
      ip: req.ip,
      url: req.url,
      threat: threat.type,
      severity: threat.severity
    });

    return res.status(403).json({
      success: false,
      message: 'Request blocked for security reasons',
      code: 'SECURITY_THREAT_DETECTED'
    });
  }

  // Record performance metrics
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const isError = res.statusCode >= 400;
    performanceService.recordRequest(responseTime, isError);
  });

  next();
};

// Error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Skip if response already sent
  if (res.headersSent) {
    return next(err);
  }

  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.claims?.sub || 'anonymous'
  }, req);

  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request entity too large' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Validation failed', details: err.details });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${new Date().toISOString()} - ${req.method} ${req.url} ${res.statusCode} - ${duration}ms - ${req.ip}`);
  });

  next();
}

// MFA enforcement middleware
export function requireMFA(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Check if MFA is required for this user/organization
  const mfaRequired = user.organization?.requireMFA || 
    ['admin', 'compliance_officer'].includes(user.role);

  if (mfaRequired && !user.mfaVerified) {
    return res.status(403).json({ 
      message: 'MFA verification required',
      code: 'MFA_REQUIRED',
      mfaChallenge: true
    });
  }

  next();
}

// High-risk operation middleware
export function requireMFAForHighRisk(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  const highRiskOperations = [
    '/api/documents/generate',
    '/api/company-profile',
    '/api/organizations',
    '/api/admin'
  ];

  const isHighRisk = highRiskOperations.some(path => req.path.startsWith(path));

  if (isHighRisk && (!user?.mfaVerified || 
      (Date.now() - user.mfaVerifiedAt) > 30 * 60 * 1000)) { // 30 minutes
    return res.status(403).json({
      message: 'Recent MFA verification required for this operation',
      code: 'MFA_VERIFICATION_EXPIRED'
    });
  }

  next();
}

// @ts-nocheck

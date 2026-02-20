import { Request, Response, NextFunction } from "express";
import { rateLimit } from "express-rate-limit";
import crypto from "crypto";
import { logger } from "../utils/logger";
import { performanceService } from '../services/performanceService';
import { threatDetectionService } from '../services/threatDetectionService';
import { isLocalMode } from '../config/runtime';
import { 
  ForbiddenError, 
  UnauthorizedError, 
  RateLimitError,
  ValidationError
} from '../utils/errorHandling';

interface SessionWithCsrf extends Record<string, any> {
  csrfToken?: string;
  mfaVerified?: boolean;
}

// Use standard Request instead of conflicting RequestWithSession

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

const CSRF_EXEMPT_PATHS = [
  '/health',
  '/ready',
  '/live',
  '/api/csrf-token',
  '/api/auth/callback',
  '/api/callback',
  '/api/login',
  '/api/logout',
  '/api/__replit',
  '/api/auth/enterprise/login',
  '/api/auth/enterprise/signup',
  '/api/auth/enterprise/forgot-password',
  '/api/auth/enterprise/reset-password',
  '/api/auth/enterprise/verify-email',
  '/api/auth/enterprise/logout',
  '/api/enterprise-auth/login',
  '/api/enterprise-auth/signup',
  '/api/enterprise-auth/forgot-password',
  '/api/enterprise-auth/reset-password',
  '/api/enterprise-auth/verify-email',
  '/api/enterprise-auth/logout',
  '/api/auth/replit',
  '/api/auth/temp-login',
  '/api/auth/temp-logout'
];

function isCsrfExemptPath(pathname: string): boolean {
  return CSRF_EXEMPT_PATHS.some((exemptPath) =>
    pathname === exemptPath || pathname.startsWith(`${exemptPath}/`)
  );
}

// Generate cryptographically secure CSRF token
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Session-bound CSRF token management
export function getOrCreateSessionCsrfToken(req: Request): string {
  const session = req.session;
  if (session && session.csrfToken) {
    return session.csrfToken;
  }
  const token = generateCsrfToken();
  if (session) {
    session.csrfToken = token;
  }
  return token;
}
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for test environment and non-API static asset requests.
  const isStaticAssetRequest =
    req.path.startsWith('/@')
    || req.path.startsWith('/src/')
    || req.path.startsWith('/assets/')
    || req.path.startsWith('/node_modules/')
    || (!req.path.startsWith('/api') && /\.[A-Za-z0-9]+$/.test(req.path));

  if (process.env.NODE_ENV === 'test' || isStaticAssetRequest) {
    return next();
  }

  if (isCsrfExemptPath(req.path)) {
    return next();
  }


  // For GET requests, ensure CSRF cookie is set with session-bound token
  if (req.method === 'GET') {
    const session = (req as any).session;
    if (session) {
      const token = getOrCreateSessionCsrfToken(req);
      res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
    }
    return next();
  }

  // Validate CSRF for ALL state-changing requests (POST, PUT, PATCH, DELETE)
  // This applies regardless of authentication state to prevent attacks
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const session = (req as any).session;
    const sessionToken = session?.csrfToken;
    const csrfCookieEntry = Object.entries(req.cookies ?? {}).find(([name]) => name === CSRF_COOKIE_NAME);
    const cookieToken = typeof csrfCookieEntry?.[1] === 'string' ? csrfCookieEntry[1] : undefined;
    const headerToken = req.get(CSRF_HEADER_NAME);

    // Require all three tokens for validation
    if (!sessionToken || !cookieToken || !headerToken) {
      logger.warn('CSRF token missing', {
        path: req.path,
        method: req.method,
        hasSession: !!sessionToken,
        hasCookie: !!cookieToken,
        hasHeader: !!headerToken,
        ip: req.ip
      });
      return next(new ForbiddenError('CSRF token missing', 'CSRF_TOKEN_MISSING'));
    }

    // Validate using timing-safe comparison to prevent timing attacks
    const sessionTokenBuffer = Buffer.from(sessionToken, 'utf8');
    const headerTokenBuffer = Buffer.from(headerToken, 'utf8');
    const cookieTokenBuffer = Buffer.from(cookieToken, 'utf8');

    const headerMatchesSession = sessionTokenBuffer.length === headerTokenBuffer.length &&
      crypto.timingSafeEqual(sessionTokenBuffer, headerTokenBuffer);
    const cookieMatchesSession = sessionTokenBuffer.length === cookieTokenBuffer.length &&
      crypto.timingSafeEqual(sessionTokenBuffer, cookieTokenBuffer);

    if (!headerMatchesSession || !cookieMatchesSession) {
      logger.warn('CSRF token mismatch', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return next(new ForbiddenError('CSRF token invalid', 'CSRF_TOKEN_INVALID'));
    }
  }

  next();
}

// Audit logging middleware
export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  const auditData = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  };

  logger.info(`${req.method} ${req.url}`, auditData);
  next();
};

// User-based rate limiting key generator
// Combines IP and user ID for more accurate rate limiting
function getRateLimitKey(req: Request): string {
  const user = (req as any).user;
  const userId = user?.claims?.sub || user?.id;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  // For authenticated users, use user ID + IP
  // For anonymous users, use IP only
  return userId ? `user:${userId}:${ip}` : `ip:${ip}`;
}

// Rate limiting configurations with user-based keys
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit per user+IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator: getRateLimitKey,
  validate: false,
  // E2E and Vite dev asset loading generate high request fan-out.
  // Skip limiter for test mode and non-API/static asset requests.
  skip: (req) =>
    process.env.NODE_ENV === 'test'
    || req.path.startsWith('/@')
    || req.path.startsWith('/src/')
    || req.path.startsWith('/assets/')
    || req.path.startsWith('/node_modules/')
    || req.path.includes('.'),
  handler: (req: Request, res: Response, next: NextFunction) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userId: (req as any).user?.claims?.sub || 'anonymous',
      path: req.path,
      method: req.method,
    });
    next(new RateLimitError('Too many requests, please try again later', {
      retryAfter: res.getHeader('Retry-After')
    }));
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit per IP to 5 auth attempts per windowMs
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: true,
  // Auth endpoints use IP only (users aren't authenticated yet)
  keyGenerator: (req) => req.ip || 'unknown',
  validate: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  handler: (req: Request, res: Response, next: NextFunction) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    next(new RateLimitError('Too many authentication attempts, please try again later', {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: res.getHeader('Retry-After')
    }));
  },
});

export const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit per user+IP to 10 generation requests per hour
  message: "Generation limit exceeded. Please wait before generating more documents.",
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator: getRateLimitKey,
  validate: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    logger.warn('Generation rate limit exceeded', {
      ip: req.ip,
      userId: (req as any).user?.claims?.sub || 'anonymous',
      path: req.path,
    });
    next(new RateLimitError('Generation limit exceeded. Please wait before generating more documents.', {
      code: 'GENERATION_LIMIT_EXCEEDED',
      retryAfter: res.getHeader('Retry-After'),
      remainingQuota: 0
    }));
  },
});

// AI operations rate limiter (stricter limits for expensive operations)
export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per user
  message: "Too many AI requests, please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
  validate: false,
  handler: (req, res) => {
    logger.warn('AI rate limit exceeded', {
      ip: req.ip,
      userId: (req as any).user?.claims?.sub || 'anonymous',
      path: req.path,
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'AI_RATE_LIMIT_EXCEEDED',
        message: "Too many AI requests, please slow down.",
        details: {
          retryAfter: res.getHeader('Retry-After')
        }
      }
    });
  },
});

/**
 * @deprecated This middleware is deprecated in favor of route-specific Zod validation.
 * Use validateBody() and validateQuery() from './routeValidation' with schemas from
 * 'server/validation/schemas.ts' instead. This provides type-safe validation with
 * better error messages and automatic data transformation.
 * 
 * This middleware will be removed in a future version.
 * Migration: Replace sanitizeInput with validateBody(yourSchema) in route definitions.
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Basic input sanitization
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters
      return obj
        // eslint-disable-next-line security/detect-unsafe-regex -- bounded scrub pattern for input sanitization
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // eslint-disable-next-line security/detect-unsafe-regex -- bounded scrub pattern for input sanitization
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .trim();
    } else if (Array.isArray(obj)) {
      return obj.map(item => sanitize(item));
    } else if (typeof obj === 'object' && obj !== null) {
      const sanitizedEntries: Array<[string, unknown]> = [];
      for (const [key, value] of Object.entries(obj)) {
        sanitizedEntries.push([key, sanitize(value)]);
      }
      return Object.fromEntries(sanitizedEntries);
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
  // Check Content-Type for state-changing requests.
  // Allow JSON, multipart uploads, and URL-encoded forms.
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const hasContentType = typeof req.headers['content-type'] === 'string';
    const isAllowedContentType =
      req.is('application/json')
      || req.is('application/*+json')
      || req.is('multipart/form-data')
      || req.is('application/x-www-form-urlencoded');

    if (hasContentType && !isAllowedContentType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: 'Content-Type must be JSON, multipart/form-data, or application/x-www-form-urlencoded'
        }
      });
    }
  }

  // Validate request size (already handled by express.json() limit)
  // Additional custom validations can be added here

  next();
}

// Enhanced security headers middleware with nonce-based CSP
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Skip security headers for development static assets
  if (req.path.startsWith('/@') || req.path.includes('.')) {
    return next();
  }

  // Generate nonce for inline scripts and styles
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.cspNonce = nonce;

  // Core security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  // Legacy header retained for compatibility with older clients/scanners.
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Enhanced Permissions Policy
  const permissionsPolicy = [
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'battery=()',
    'camera=()',
    'display-capture=()',
    'document-domain=()',
    'encrypted-media=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'payment=()',
    'picture-in-picture=()',
    'usb=()',
    'web-share=()',
  ].join(', ');
  res.setHeader('Permissions-Policy', permissionsPolicy);

  // Cross-Origin policies for enhanced security
  // Use credentialless COEP to allow fonts and external resources
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  } else {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }

  // Content Security Policy configuration
  // Production: Strict CSP with external scripts only (no inline scripts in Vite build)
  // Development: Relaxed for HMR and development tools
  const isProduction = process.env.NODE_ENV === 'production';
  
  const cspDirectives = [
    "default-src 'self'",
    // Production: External scripts only (Vite build has no inline scripts)
    // Development: Allow inline for HMR and dev tools
    isProduction
      ? "script-src 'self' https://apis.google.com"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://replit.com",
    // Styles: unsafe-inline needed for Tailwind/CSS-in-JS runtime styles
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    "img-src 'self' data: https:",
    isProduction
      ? "connect-src 'self' https://api.openai.com https://api.anthropic.com"
      : "connect-src 'self' ws: wss: https://api.openai.com https://api.anthropic.com https://*.replit.dev https://*.replit.app",
    "font-src 'self' https://fonts.gstatic.com data:",
    // Production: Restrict framing to prevent clickjacking
    // Development: Allow Replit domains for iframe preview
    isProduction
      ? "frame-ancestors 'none'"
      : "frame-ancestors 'self' https://*.replit.dev https://*.replit.app https://*.repl.co",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    isProduction ? "upgrade-insecure-requests" : ""
  ].filter(Boolean);
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  // HSTS in production with preload
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Clear-Site-Data header for logout endpoints
  if (req.path.includes('/logout')) {
    res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
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
      error: {
        code: 'SECURITY_THREAT_DETECTED',
        message: 'Request blocked for security reasons'
      }
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

// Enhanced error handling middleware with production sanitization
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Skip if response already sent
  if (res.headersSent) {
    return next(err);
  }

  // Generate unique error ID for tracking
  const errorId = crypto.randomBytes(8).toString('hex');

  // Log full error details (including sensitive data) securely
  logger.error('Error occurred', {
    errorId,
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.claims?.sub || 'anonymous',
    // Include request body for debugging (be careful with sensitive data)
    ...(process.env.NODE_ENV !== 'production' && {
      body: req.body,
      query: req.query,
      params: req.params,
    }),
  }, req);

  // Handle specific error types
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      message: 'Invalid CSRF token',
      code: 'CSRF_INVALID',
      errorId,
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'Request entity too large',
      code: 'PAYLOAD_TOO_LARGE',
      maxSize: '10MB',
      errorId,
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      // Sanitize validation details in production
      ...(process.env.NODE_ENV === 'production'
        ? { fields: err.fields?.map((f: any) => f.field) }
        : { details: err.details }),
      errorId,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      message: 'Authentication required',
      code: 'UNAUTHORIZED',
      errorId,
    });
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      message: 'Insufficient permissions',
      code: 'FORBIDDEN',
      errorId,
    });
  }

  // Database errors
  if (err.code && err.code.startsWith('23')) { // PostgreSQL constraint errors
    return res.status(400).json({
      message: process.env.NODE_ENV === 'production'
        ? 'Invalid request data'
        : `Database constraint violation: ${err.message}`,
      code: 'DATABASE_CONSTRAINT',
      errorId,
    });
  }

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Sanitize error messages in production
  let message: string;
  if (process.env.NODE_ENV === 'production') {
    // Generic error messages for production
    const sanitizedMessages = new Map<number, string>([
      [400, 'Bad request'],
      [401, 'Authentication required'],
      [403, 'Access denied'],
      [404, 'Resource not found'],
      [409, 'Conflict with existing resource'],
      [422, 'Invalid input data'],
      [429, 'Too many requests'],
      [500, 'Internal server error'],
      [502, 'Bad gateway'],
      [503, 'Service temporarily unavailable'],
    ]);
    message = sanitizedMessages.get(statusCode) || 'An error occurred';
  } else {
    // Include detailed error messages in development
    message = err.message || 'An error occurred';
  }

  // Send error response
  res.status(statusCode).json({
    message,
    code: err.code || 'INTERNAL_ERROR',
    errorId,
    timestamp: new Date().toISOString(),
    // Include stack trace only in development
    ...(process.env.NODE_ENV !== 'production' && {
      stack: err.stack,
      details: err.details,
    }),
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
      success: false,
      error: {
        code: 'MFA_REQUIRED',
        message: 'MFA verification required',
        details: { mfaChallenge: true }
      }
    });
  }

  next();
}

// High-risk operation middleware
export function requireMFAForHighRisk(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  const session = req.session as SessionWithCsrf | undefined;
  if (isLocalMode()) {
    return next();
  }

  const normalizedPath = req.path.startsWith('/api')
    ? req.path.slice('/api'.length)
    : req.path;
  const highRiskOperations = [
    '/documents/generate',
    '/company-profile',
    '/organizations',
    '/admin'
  ];
  const isHighRisk = highRiskOperations.some(path => normalizedPath.startsWith(path));

  // Let downstream auth middleware handle unauthenticated requests with 401.
  const sessionUserId = typeof session?.userId === 'string' ? session.userId : undefined;
  const userId = sessionUserId || user?.claims?.sub || user?.id;
  if (!isHighRisk || !userId) {
    return next();
  }

  const mfaVerified = session?.mfaVerified === true || user?.mfaVerified === true;
  const rawVerifiedAt = session?.mfaVerifiedAt || user?.mfaVerifiedAt;
  const mfaVerifiedAt = rawVerifiedAt ? Date.parse(String(rawVerifiedAt)) : NaN;
  const hasRecentMfa =
    mfaVerified
    && Number.isFinite(mfaVerifiedAt)
    && (Date.now() - mfaVerifiedAt) <= 30 * 60 * 1000;

  if (!hasRecentMfa) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'MFA_VERIFICATION_EXPIRED',
        message: 'Recent MFA verification required for this operation'
      }
    });
  }

  next();
}


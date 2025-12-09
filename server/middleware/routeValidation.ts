
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { logger } from '../utils/logger';

export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        message: 'Invalid query parameters',
        errors: result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    req.query = result.data;
    next();
  };
}

export interface RouteInfo {
  path: string;
  method: string;
  requiresAuth: boolean;
  requiresMfa: boolean;
  rateLimitTier: 'low' | 'medium' | 'high' | 'critical';
  validationSchema?: any;
}

// Define all API routes with their security requirements
export const API_ROUTES: RouteInfo[] = [
  // Health endpoints
  { path: '/health', method: 'GET', requiresAuth: false, requiresMfa: false, rateLimitTier: 'low' },
  { path: '/ready', method: 'GET', requiresAuth: false, requiresMfa: false, rateLimitTier: 'low' },
  { path: '/live', method: 'GET', requiresAuth: false, requiresMfa: false, rateLimitTier: 'low' },
  
  // Authentication
  { path: '/api/auth/user', method: 'GET', requiresAuth: true, requiresMfa: false, rateLimitTier: 'medium' },
  { path: '/api/auth/mfa/*', method: 'ALL', requiresAuth: true, requiresMfa: false, rateLimitTier: 'high' },
  
  // Organizations
  { path: '/api/organizations', method: 'GET', requiresAuth: true, requiresMfa: false, rateLimitTier: 'medium' },
  { path: '/api/organizations', method: 'POST', requiresAuth: true, requiresMfa: true, rateLimitTier: 'high' },
  
  // Company Profiles
  { path: '/api/company-profiles', method: 'GET', requiresAuth: true, requiresMfa: false, rateLimitTier: 'medium' },
  { path: '/api/company-profiles', method: 'POST', requiresAuth: true, requiresMfa: true, rateLimitTier: 'high' },
  { path: '/api/company-profiles/*', method: 'PUT', requiresAuth: true, requiresMfa: true, rateLimitTier: 'high' },
  
  // Documents
  { path: '/api/documents', method: 'GET', requiresAuth: true, requiresMfa: false, rateLimitTier: 'medium' },
  { path: '/api/documents', method: 'POST', requiresAuth: true, requiresMfa: false, rateLimitTier: 'medium' },
  { path: '/api/documents/generate', method: 'POST', requiresAuth: true, requiresMfa: true, rateLimitTier: 'critical' },
  { path: '/api/documents/generate-single', method: 'POST', requiresAuth: true, requiresMfa: true, rateLimitTier: 'high' },
  
  // AI Services
  { path: '/api/ai/*', method: 'POST', requiresAuth: true, requiresMfa: false, rateLimitTier: 'high' },
  { path: '/api/ai/health', method: 'GET', requiresAuth: false, requiresMfa: false, rateLimitTier: 'low' },
  
  // Object Storage
  { path: '/api/storage/*', method: 'ALL', requiresAuth: true, requiresMfa: false, rateLimitTier: 'medium' },
  { path: '/api/storage/backups/*', method: 'ALL', requiresAuth: true, requiresMfa: true, rateLimitTier: 'high' },
  
  // Admin
  { path: '/api/admin/*', method: 'ALL', requiresAuth: true, requiresMfa: true, rateLimitTier: 'critical' },
  
  // Audit Trail
  { path: '/api/audit-trail/*', method: 'ALL', requiresAuth: true, requiresMfa: true, rateLimitTier: 'high' },
  
  // Gap Analysis
  { path: '/api/gap-analysis/*', method: 'ALL', requiresAuth: true, requiresMfa: false, rateLimitTier: 'high' }
];

export const validateRouteAccess = (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;
  const method = req.method.toUpperCase();
  
  // Find matching route
  const route = API_ROUTES.find(r => {
    if (r.method === 'ALL' || r.method === method) {
      return path.startsWith(r.path.replace('*', ''));
    }
    return false;
  });
  
  if (!route) {
    logger.warn('Unknown API route accessed', { path, method, ip: req.ip });
    return next();
  }
  
  // Log route access for monitoring
  logger.info('API route accessed', {
    path,
    method,
    requiresAuth: route.requiresAuth,
    requiresMfa: route.requiresMfa,
    rateLimitTier: route.rateLimitTier,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Add route info to request for downstream middleware
  (req as any).routeInfo = route;
  
  next();
};

export const logRoutePerformance = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = (req as any).routeInfo;
    
    if (route && duration > 1000) {
      logger.warn('Slow API response', {
        path: req.path,
        method: req.method,
        duration,
        statusCode: res.statusCode,
        rateLimitTier: route.rateLimitTier
      });
    }
  });
  
  next();
};

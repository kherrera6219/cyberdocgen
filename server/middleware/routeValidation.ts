import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { logger } from '../utils/logger';

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export function formatZodErrors(error: ZodError): ValidationError[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}

export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        logger.warn('Request body validation failed', {
          path: req.path,
          method: req.method,
          errors,
          ip: req.ip,
        });
        return res.status(400).json({
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors,
        });
      }
      req.body = result.data;
      next();
    } catch (error) {
      logger.error('Unexpected validation error', { error, path: req.path });
      return res.status(500).json({
        message: 'Internal validation error',
        code: 'INTERNAL_ERROR',
      });
    }
  };
}

export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        logger.warn('Request query validation failed', {
          path: req.path,
          method: req.method,
          errors,
          ip: req.ip,
        });
        return res.status(400).json({
          message: 'Query validation failed',
          code: 'VALIDATION_ERROR',
          errors,
        });
      }
      req.query = result.data;
      next();
    } catch (error) {
      logger.error('Unexpected query validation error', { error, path: req.path });
      return res.status(500).json({
        message: 'Internal validation error',
        code: 'INTERNAL_ERROR',
      });
    }
  };
}

export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        logger.warn('Request params validation failed', {
          path: req.path,
          method: req.method,
          errors,
          ip: req.ip,
        });
        return res.status(400).json({
          message: 'Parameter validation failed',
          code: 'VALIDATION_ERROR',
          errors,
        });
      }
      req.params = result.data;
      next();
    } catch (error) {
      logger.error('Unexpected params validation error', { error, path: req.path });
      return res.status(500).json({
        message: 'Internal validation error',
        code: 'INTERNAL_ERROR',
      });
    }
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

export const API_ROUTES: RouteInfo[] = [
  { path: '/health', method: 'GET', requiresAuth: false, requiresMfa: false, rateLimitTier: 'low' },
  { path: '/ready', method: 'GET', requiresAuth: false, requiresMfa: false, rateLimitTier: 'low' },
  { path: '/live', method: 'GET', requiresAuth: false, requiresMfa: false, rateLimitTier: 'low' },
  { path: '/api/auth/user', method: 'GET', requiresAuth: true, requiresMfa: false, rateLimitTier: 'medium' },
  { path: '/api/auth/mfa/*', method: 'ALL', requiresAuth: true, requiresMfa: false, rateLimitTier: 'high' },
  { path: '/auth/temp-login', method: 'POST', requiresAuth: false, requiresMfa: false, rateLimitTier: 'high' },
  { path: '/auth/temp-logout', method: 'POST', requiresAuth: false, requiresMfa: false, rateLimitTier: 'low' },
  { path: '/auth/user', method: 'GET', requiresAuth: true, requiresMfa: false, rateLimitTier: 'medium' },
  { path: '/api/organizations', method: 'GET', requiresAuth: true, requiresMfa: false, rateLimitTier: 'medium' },
  { path: '/api/organizations', method: 'POST', requiresAuth: true, requiresMfa: true, rateLimitTier: 'high' },
  { path: '/api/company-profiles', method: 'GET', requiresAuth: true, requiresMfa: false, rateLimitTier: 'medium' },
  { path: '/api/company-profiles', method: 'POST', requiresAuth: true, requiresMfa: true, rateLimitTier: 'high' },
  { path: '/api/company-profiles/*', method: 'PUT', requiresAuth: true, requiresMfa: true, rateLimitTier: 'high' },
  { path: '/api/documents', method: 'GET', requiresAuth: true, requiresMfa: false, rateLimitTier: 'medium' },
  { path: '/api/documents', method: 'POST', requiresAuth: true, requiresMfa: false, rateLimitTier: 'medium' },
  { path: '/api/documents/generate', method: 'POST', requiresAuth: true, requiresMfa: true, rateLimitTier: 'critical' },
  { path: '/api/documents/generate-single', method: 'POST', requiresAuth: true, requiresMfa: true, rateLimitTier: 'high' },
  { path: '/api/ai/*', method: 'POST', requiresAuth: true, requiresMfa: false, rateLimitTier: 'high' },
  { path: '/api/ai/health', method: 'GET', requiresAuth: false, requiresMfa: false, rateLimitTier: 'low' },
  { path: '/api/storage/*', method: 'ALL', requiresAuth: true, requiresMfa: false, rateLimitTier: 'medium' },
  { path: '/api/storage/backups/*', method: 'ALL', requiresAuth: true, requiresMfa: true, rateLimitTier: 'high' },
  { path: '/api/admin/*', method: 'ALL', requiresAuth: true, requiresMfa: true, rateLimitTier: 'critical' },
  { path: '/api/audit-trail/*', method: 'ALL', requiresAuth: true, requiresMfa: true, rateLimitTier: 'high' },
  { path: '/api/gap-analysis/*', method: 'ALL', requiresAuth: true, requiresMfa: false, rateLimitTier: 'high' }
];

export const validateRouteAccess = (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;
  const method = req.method.toUpperCase();
  
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
  
  logger.info('API route accessed', {
    path,
    method,
    requiresAuth: route.requiresAuth,
    requiresMfa: route.requiresMfa,
    rateLimitTier: route.rateLimitTier,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
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

/**
 * Enhanced Error Handling Utilities
 * 
 * Provides standardized error handling, request validation, and audit logging
 * for all API endpoints with security-first design.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { logger } from './logger';
import { auditService } from '../services/auditService';
import { getUserId } from '../replitAuth';
import { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError 
} from './routeHelpers';

/**
 * Standard error response format
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}

/**
 * Standard success response format
 */
interface SuccessResponse<T> {
  success: true;
  data: T;
  requestId?: string;
}

/**
 * Handler options for secureHandler
 */
interface SecureHandlerOptions {
  /** Log this action to audit trail */
  audit?: {
    action: 'create' | 'read' | 'update' | 'delete' | 'view';
    entityType: string;
    getEntityId?: (req: Request) => string;
  };
  /** Rate limit identifier */
  rateLimit?: string;
  /** Skip authentication (for public endpoints) */
  skipAuth?: boolean;
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: Error | AppError,
  requestId?: string
): ErrorResponse {
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let statusCode = 500;
  let details: unknown = undefined;

  if (error instanceof AppError) {
    code = error.code || error.name.toUpperCase().replace(/ERROR$/, '_ERROR');
    message = error.message;
    statusCode = error.statusCode;
    details = error.details;
  } else if (error instanceof ZodError) {
    code = 'VALIDATION_ERROR';
    message = 'Invalid request data';
    statusCode = 400;
    details = error.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    }));
  }

  return {
    success: false,
    error: {
      code,
      message,
      requestId,
      ...(details ? { details } : {}),
    },
  };
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  requestId?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(requestId ? { requestId } : {}),
  };
}

/**
 * Secure async handler wrapper
 * 
 * Features:
 * - Automatic error catching and formatting
 * - Request ID tracking
 * - Optional audit logging
 * - Consistent response format
 */
export function secureHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  options: SecureHandlerOptions = {}
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.requestId || req.headers['x-request-id'] as string;
    const startTime = Date.now();

    try {
      // Execute handler
      await fn(req, res, next);

      // Audit logging for state-changing operations
      if (options.audit && !res.headersSent) {
        const userId = getUserId(req);
        const entityId = options.audit.getEntityId?.(req) || req.params.id;
        
        await auditService.logAction({
          action: options.audit.action,
          entityType: options.audit.entityType,
          entityId,
          userId,
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          sessionId: req.sessionID,
          metadata: {
            duration: Date.now() - startTime,
            requestId,
          },
        }).catch(err => {
          logger.warn('Failed to write audit log', { error: err.message });
        });
      }
    } catch (error) {
      // Log the error
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isClientError = error instanceof AppError && error.statusCode < 500;

      if (!isClientError) {
        logger.error('Request failed', {
          requestId,
          path: req.path,
          method: req.method,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          userId: getUserId(req),
          duration: Date.now() - startTime,
        });
      }

      // Send error response
      if (!res.headersSent) {
        const statusCode = error instanceof AppError ? error.statusCode : 500;
        const response = createErrorResponse(error as Error, requestId);
        res.status(statusCode).json(response);
      }
    }
  };
}

/**
 * Input validation middleware factory
 * 
 * Validates request body against a Zod schema and throws
 * ValidationError with detailed field errors on failure.
 */
export function validateInput<T extends ZodSchema>(
  schema: T,
  options: { source?: 'body' | 'query' | 'params' } = {}
): RequestHandler {
  const { source = 'body' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.requestId || req.headers['x-request-id'] as string;
    
    try {
      const data = source === 'body' ? req.body 
        : source === 'query' ? req.query 
        : req.params;
      
      const parsed = schema.parse(data);
      
      // Attach validated data back to request
      if (source === 'body') {
        req.body = parsed;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const response = createErrorResponse(error, requestId);
        return res.status(400).json(response);
      }
      next(error);
    }
  };
}

/**
 * Validate path parameters
 */
export function validateParams<T extends ZodSchema>(schema: T): RequestHandler {
  return validateInput(schema, { source: 'params' });
}

/**
 * Validate query parameters
 */
export function validateQuery<T extends ZodSchema>(schema: T): RequestHandler {
  return validateInput(schema, { source: 'query' });
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  /** UUID parameter validation */
  uuid: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
  
  /** Pagination query parameters */
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
  
  /** Search query */
  search: z.object({
    q: z.string().min(1).max(200).optional(),
    filters: z.record(z.string()).optional(),
  }),
};

/**
 * Ensure user is authenticated - throws UnauthorizedError if not
 */
export function requireAuth(req: Request): string {
  const userId = getUserId(req);
  if (!userId) {
    throw new UnauthorizedError('Authentication required');
  }
  return userId;
}

/**
 * Ensure resource exists - throws NotFoundError if not
 */
export function requireResource<T>(
  resource: T | null | undefined,
  resourceName: string = 'Resource'
): asserts resource is T {
  if (!resource) {
    throw new NotFoundError(`${resourceName} not found`);
  }
}

/**
 * Ensure user has permission - throws ForbiddenError if not
 */
export function requirePermission(
  hasPermission: boolean,
  message: string = 'Access denied'
): asserts hasPermission is true {
  if (!hasPermission) {
    throw new ForbiddenError(message);
  }
}

/**
 * Wrap existing handler to use secureHandler pattern
 */
export function wrapHandler(
  handler: (req: Request, res: Response) => Promise<void>,
  options: SecureHandlerOptions = {}
): RequestHandler {
  return secureHandler(async (req, res, next) => {
    await handler(req, res);
  }, options);
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: unknown) {
    super(message, 409, 'CONFLICT', details);
  }
}

/**
 * Service unavailable error (503)
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable', details?: unknown) {
    super(message, 503, 'SERVICE_UNAVAILABLE', details);
  }
}

/**
 * Bad gateway error (502) - for upstream failures
 */
export class BadGatewayError extends AppError {
  constructor(message: string = 'Upstream service error', details?: unknown) {
    super(message, 502, 'BAD_GATEWAY', details);
  }
}

// Re-export base error classes for convenience
export { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError 
};

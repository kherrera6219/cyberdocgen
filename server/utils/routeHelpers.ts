import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Base Application Error class
 * Extends standard Error with statusCode and code for API responses
 */
export class AppError extends Error {
  public statusCode: number;
  public code?: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

/**
 * 400 Validation Error
 * Matches the name expected by security.ts errorHandler
 */
export class ValidationError extends AppError {
  public fields?: any[]; // For compatibility with some validation libraries

  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    if (Array.isArray(details)) {
        this.fields = details;
    }
  }
}

/**
 * 401 Authentication Error
 * Matches the name UnauthorizedError expected by security.ts (if renamed)
 * or we usage AuthError and map it.
 * security.ts checks for err.name === 'UnauthorizedError'
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * 403 Forbidden Error
 * Matches err.name === 'ForbiddenError' in security.ts
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied', details?: any) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

/**
 * Async Handler Wrapper
 * Automatically catches errors in async route handlers and passes them to next()
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

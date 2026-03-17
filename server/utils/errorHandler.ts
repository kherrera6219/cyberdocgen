import { Request, Response } from 'express';
import { logger } from './logger';
import crypto from 'crypto';

export function handleError(error: unknown, req: Request, res: Response, operation: string): void {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorContext = { 
    error: errorMessage, 
    operation,
    url: req.url,
    method: req.method,
    userId: (req as any)?.user?.claims?.sub 
  };

  logger.error(`Error in ${operation}`, errorContext, req);

  const errorId = crypto.randomBytes(8).toString('hex');
  const isProduction = process.env.NODE_ENV === 'production';

  // Send sanitized error response
  res.status(500).json({ 
    success: false,
    message: isProduction ? `Failed to ${operation}` : `Failed to ${operation}: ${errorMessage}`,
    errorId,
    timestamp: new Date().toISOString()
  });
}

export function createErrorHandler(operation: string) {
  return (error: unknown, req: Request, res: Response) => {
    handleError(error, req, res, operation);
  };
}
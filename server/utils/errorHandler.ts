import { Request, Response } from 'express';
import { logger } from './logger';

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

  // Send sanitized error response
  res.status(500).json({ 
    success: false,
    message: `Failed to ${operation}`,
    timestamp: new Date().toISOString()
  });
}

export function createErrorHandler(operation: string) {
  return (error: unknown, req: Request, res: Response) => {
    handleError(error, req, res, operation);
  };
}
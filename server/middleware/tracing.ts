import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Tracing Middleware
 * 
 * Adds correlation/trace IDs to all requests for distributed tracing.
 * The trace ID is:
 * 1. Extracted from incoming X-Request-ID or X-Trace-ID header (if present)
 * 2. Generated as a new UUID if not present
 * 3. Added to all log statements via res.locals
 * 4. Returned in response headers for debugging
 */

// Extend Express Request to include trace context
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      traceId?: string;
      spanId?: string;
      parentSpanId?: string;
    }
  }
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  startTime: number;
}

/**
 * Generate a new span ID (shorter than trace ID)
 */
function generateSpanId(): string {
  return randomUUID().split('-')[0];
}

/**
 * Create tracing middleware
 */
export function tracingMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Extract or generate trace ID
    const traceId = 
      (req.headers['x-trace-id'] as string) ||
      (req.headers['x-request-id'] as string) ||
      randomUUID();

    // Generate span ID for this request
    const spanId = generateSpanId();

    // Extract parent span ID if present
    const parentSpanId = req.headers['x-parent-span-id'] as string | undefined;

    // Attach to request
    req.traceId = traceId;
    req.spanId = spanId;
    req.parentSpanId = parentSpanId;

    // Create trace context for logging
    const traceContext: TraceContext = {
      traceId,
      spanId,
      parentSpanId,
      startTime: Date.now(),
    };

    // Store in res.locals for access by other middleware and routes
    res.locals.traceContext = traceContext;

    // Add trace headers to response
    res.setHeader('X-Trace-ID', traceId);
    res.setHeader('X-Span-ID', spanId);
    if (parentSpanId) {
      res.setHeader('X-Parent-Span-ID', parentSpanId);
    }

    // Log request start
    const requestLog = {
      type: 'request_start',
      traceId,
      spanId,
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      timestamp: new Date().toISOString(),
    };

    // Don't log health check endpoints to reduce noise
    if (!req.path.includes('/health') && !req.path.includes('/ready') && !req.path.includes('/live')) {
      logger.debug(JSON.stringify(requestLog));
    }

    // Track response for logging
    res.on('finish', () => {
      const duration = Date.now() - traceContext.startTime;
      
      const responseLog = {
        type: 'request_end',
        traceId,
        spanId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        timestamp: new Date().toISOString(),
      };

      // Don't log health check endpoints to reduce noise
      if (!req.path.includes('/health') && !req.path.includes('/ready') && !req.path.includes('/live')) {
        logger.debug(JSON.stringify(responseLog));
      }
    });

    next();
  };
}

/**
 * Get trace context from request
 */
export function getTraceContext(res: Response): TraceContext | undefined {
  return res.locals.traceContext;
}

/**
 * Create a child span for nested operations
 */
export function createChildSpan(parentContext: TraceContext): TraceContext {
  return {
    traceId: parentContext.traceId,
    spanId: generateSpanId(),
    parentSpanId: parentContext.spanId,
    startTime: Date.now(),
  };
}

/**
 * Log with trace context
 */
export function logWithTrace(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  context: TraceContext,
  data?: Record<string, unknown>
) {
  const logEntry = {
    level,
    message,
    traceId: context.traceId,
    spanId: context.spanId,
    parentSpanId: context.parentSpanId,
    timestamp: new Date().toISOString(),
    ...data,
  };

  logger.debug(JSON.stringify(logEntry));
}

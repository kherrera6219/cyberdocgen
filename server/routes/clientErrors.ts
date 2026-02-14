import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { apiLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/routeValidation';
import { getUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { secureHandler } from '../utils/errorHandling';

const clientErrorSchema = z.object({
  message: z.string().min(1, 'Error message required'),
  stack: z.string().optional().nullable(),
  componentStack: z.string().optional().nullable(),
  errorId: z.string().optional().nullable(),
  timestamp: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
});

function truncate(value: string | null | undefined, maxLength: number): string | undefined {
  if (!value) {
    return undefined;
  }
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function sanitizeUrl(rawUrl: string | null | undefined): string | undefined {
  if (!rawUrl) {
    return undefined;
  }
  try {
    const parsed = new URL(rawUrl);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return truncate(rawUrl, 512);
  }
}

export function registerClientErrorRoutes(router: Router) {
  /**
   * Report client-side error for logging
   */
  router.post(
    '/',
    apiLimiter,
    validateBody(clientErrorSchema),
    secureHandler(async (req: Request, res: Response) => {
      const userId = getUserId(req);
      const { message, stack, componentStack, errorId, timestamp, userAgent, url } = req.body;
      const sanitizedMessage = truncate(message, 1000) || 'Unknown client error';
      const sanitizedStack = truncate(stack, 4000);
      const sanitizedComponentStack = truncate(componentStack, 2000);
      const sanitizedUrl = sanitizeUrl(url);
      const sanitizedUserAgent = truncate(userAgent, 512);

      logger.error('Client error report', {
        userId,
        errorId: truncate(errorId, 128),
        message: sanitizedMessage,
        stack: process.env.NODE_ENV === 'production' ? undefined : sanitizedStack,
        componentStack: process.env.NODE_ENV === 'production' ? undefined : sanitizedComponentStack,
        timestamp: truncate(timestamp, 128),
        userAgent: sanitizedUserAgent,
        url: sanitizedUrl,
        ip: req.ip,
      });

      res.json({ success: true, message: 'Error reported' });
    })
  );
}

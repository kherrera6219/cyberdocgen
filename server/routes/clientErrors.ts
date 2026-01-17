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

      logger.error('Client error report', {
        userId,
        errorId,
        message,
        stack,
        componentStack,
        timestamp,
        userAgent,
        url,
        ip: req.ip,
      });

      res.json({ success: true, message: 'Error reported' });
    })
  );
}

import { Router } from 'express';
import { z } from 'zod';
import { apiLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/routeValidation';
import { getUserId } from '../replitAuth';
import { logger } from '../utils/logger';

const clientErrorSchema = z.object({
  message: z.string().min(1),
  stack: z.string().optional().nullable(),
  componentStack: z.string().optional().nullable(),
  errorId: z.string().optional().nullable(),
  timestamp: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
});

export function registerClientErrorRoutes(router: Router) {
  router.post(
    '/',
    apiLimiter,
    validateBody(clientErrorSchema),
    async (req, res) => {
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
      });

      res.json({ success: true });
    }
  );
}

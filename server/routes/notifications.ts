import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { isAuthenticated, getRequiredUserId } from '../replitAuth';
import { 
  secureHandler,
  validateInput,
  requireAuth,
  requireResource
} from '../utils/errorHandling';

// Validation schemas
const limitQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const notificationIdSchema = z.object({
  id: z.string().min(1, 'Notification ID required'),
});

export function registerNotificationRoutes(router: Router) {
  /**
   * Get user notifications
   */
  router.get("/", isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req);
    const limit = parseInt(req.query.limit as string) || 50;
    
    const notifications = await storage.getNotifications(userId, limit);
    res.json({ success: true, data: notifications });
  }));

  /**
   * Get unread notification count
   */
  router.get("/unread-count", isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req);
    const count = await storage.getUnreadNotificationCount(userId);
    res.json({ success: true, data: { count } });
  }));

  /**
   * Mark single notification as read
   */
  router.patch("/:id/read", isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req);
    const { id } = req.params;
    
    const notification = await storage.markNotificationAsRead(id, userId);
    requireResource(notification, 'Notification');
    
    res.json({ success: true, data: notification });
  }, { audit: { action: 'update', entityType: 'notification', getEntityId: (req) => req.params.id } }));

  /**
   * Mark all notifications as read
   */
  router.patch("/mark-all-read", isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req);
    const count = await storage.markAllNotificationsAsRead(userId);
    res.json({ success: true, data: { marked: count } });
  }, { audit: { action: 'update', entityType: 'notifications' } }));

  /**
   * Delete notification
   */
  router.delete("/:id", isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req);
    const { id } = req.params;
    
    const deleted = await storage.deleteNotification(id, userId);
    requireResource(deleted ? { id } : null, 'Notification');
    
    res.json({ success: true, message: 'Notification deleted' });
  }, { audit: { action: 'delete', entityType: 'notification', getEntityId: (req) => req.params.id } }));
}

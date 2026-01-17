import { Router, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { isAuthenticated, getRequiredUserId } from '../replitAuth';
import { 
  secureHandler,
  NotFoundError
} from '../utils/errorHandling';
import { type MultiTenantRequest } from '../middleware/multiTenant';


export function registerNotificationRoutes(router: Router) {
  /**
   * Get user notifications
   */
  router.get("/", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const limit = parseInt(req.query.limit as string) || 50;
    
    const notifications = await storage.getNotifications(userId, limit);
    res.json({ success: true, data: notifications });
  }));

  /**
   * Get unread notification count
   */
  router.get("/unread-count", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const count = await storage.getUnreadNotificationCount(userId);
    res.json({ success: true, data: { count } });
  }));

  /**
   * Mark single notification as read
   */
  router.patch("/:id/read", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const { id } = req.params;
    
    const notification = await storage.markNotificationAsRead(id, userId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }
    
    res.json({ success: true, data: notification });
  }, { audit: { action: 'update', entityType: 'notification', getEntityId: (req) => req.params.id } }));

  /**
   * Mark all notifications as read
   */
  router.patch("/mark-all-read", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const count = await storage.markAllNotificationsAsRead(userId);
    res.json({ success: true, data: { marked: count } });
  }, { audit: { action: 'update', entityType: 'notifications' } }));

  /**
   * Delete notification
   */
  router.delete("/:id", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const { id } = req.params;
    
    const deleted = await storage.deleteNotification(id, userId);
    if (!deleted) {
      throw new NotFoundError('Notification not found');
    }
    
    res.json({ success: true, data: { message: 'Notification deleted' } });
  }, { audit: { action: 'delete', entityType: 'notification', getEntityId: (req) => req.params.id } }));
}

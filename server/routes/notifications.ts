import { Router } from 'express';
import { storage } from '../storage';
import { isAuthenticated, getRequiredUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { z } from 'zod';

export function registerNotificationRoutes(router: Router) {
  router.get("/", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getRequiredUserId(req);
      const limit = parseInt(req.query.limit as string) || 50;
      
      const notifications = await storage.getNotifications(userId, limit);
      res.json(notifications);
    } catch (error) {
      logger.error('Failed to fetch notifications', { error });
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  router.get("/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getRequiredUserId(req);
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      logger.error('Failed to fetch unread notification count', { error });
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  router.patch("/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getRequiredUserId(req);
      const { id } = req.params;
      
      const notification = await storage.markNotificationAsRead(id, userId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      logger.error('Failed to mark notification as read', { error });
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  router.patch("/mark-all-read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getRequiredUserId(req);
      const count = await storage.markAllNotificationsAsRead(userId);
      res.json({ marked: count });
    } catch (error) {
      logger.error('Failed to mark all notifications as read', { error });
      res.status(500).json({ message: "Failed to mark all as read" });
    }
  });

  router.delete("/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getRequiredUserId(req);
      const { id } = req.params;
      
      const deleted = await storage.deleteNotification(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to delete notification', { error });
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });
}

import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '@shared/schema';
import { isAuthenticated, getUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

const profilePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  dashboardLayout: z.enum(['compact', 'standard', 'expanded']).optional(),
  defaultFramework: z.string().optional(),
  aiAssistantEnabled: z.boolean().optional(),
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  documentUpdates: z.boolean().optional(),
  complianceAlerts: z.boolean().optional(),
  teamActivity: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  securityAlerts: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  profilePreferences: profilePreferencesSchema.optional(),
  notificationSettings: notificationSettingsSchema.optional(),
});

router.get('/me', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        phoneNumber: users.phoneNumber,
        emailVerified: users.emailVerified,
        phoneVerified: users.phoneVerified,
        twoFactorEnabled: users.twoFactorEnabled,
        profilePreferences: users.profilePreferences,
        notificationSettings: users.notificationSettings,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Failed to fetch user profile', { error });
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

router.patch('/me', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid request body', errors: parsed.error.flatten() });
    }

    const updates: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (parsed.data.firstName !== undefined) updates.firstName = parsed.data.firstName;
    if (parsed.data.lastName !== undefined) updates.lastName = parsed.data.lastName;
    if (parsed.data.phoneNumber !== undefined) updates.phoneNumber = parsed.data.phoneNumber;
    if (parsed.data.profilePreferences !== undefined) updates.profilePreferences = parsed.data.profilePreferences;
    if (parsed.data.notificationSettings !== undefined) updates.notificationSettings = parsed.data.notificationSettings;

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    logger.info('User profile updated', { userId });
    res.json(updated);
  } catch (error) {
    logger.error('Failed to update user profile', { error });
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

router.patch('/me/preferences', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const parsed = profilePreferencesSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid preferences', errors: parsed.error.flatten() });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const currentPrefs = user?.profilePreferences || {};
    const newPrefs = { ...currentPrefs, ...parsed.data };

    const [updated] = await db
      .update(users)
      .set({ profilePreferences: newPrefs, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    res.json({ profilePreferences: updated.profilePreferences });
  } catch (error) {
    logger.error('Failed to update preferences', { error });
    res.status(500).json({ message: 'Failed to update preferences' });
  }
});

router.patch('/me/notifications', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const parsed = notificationSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid notification settings', errors: parsed.error.flatten() });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const currentSettings = user?.notificationSettings || {};
    const newSettings = { ...currentSettings, ...parsed.data };

    const [updated] = await db
      .update(users)
      .set({ notificationSettings: newSettings, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    res.json({ notificationSettings: updated.notificationSettings });
  } catch (error) {
    logger.error('Failed to update notification settings', { error });
    res.status(500).json({ message: 'Failed to update notification settings' });
  }
});

export default router;

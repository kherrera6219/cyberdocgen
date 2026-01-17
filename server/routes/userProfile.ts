import { Router, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { users } from '@shared/schema';
import { isAuthenticated, getRequiredUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { 
  secureHandler, 
  validateInput,
  NotFoundError 
} from '../utils/errorHandling';
import { type MultiTenantRequest } from '../middleware/multiTenant';

const router = Router();

// Validation schemas
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

/**
 * Get current user profile
 */
router.get('/me', isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);

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
    throw new NotFoundError("User not found");
  }
  res.json({ success: true, data: user });
}));

/**
 * Update user profile
 */
router.patch('/me', isAuthenticated, validateInput(updateProfileSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  const { firstName, lastName, phoneNumber, profilePreferences, notificationSettings } = req.body;

  if (firstName !== undefined) updates.firstName = firstName;
  if (lastName !== undefined) updates.lastName = lastName;
  if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
  if (profilePreferences !== undefined) updates.profilePreferences = profilePreferences;
  if (notificationSettings !== undefined) updates.notificationSettings = notificationSettings;

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning();

  if (!updated) {
    throw new NotFoundError("User not found");
  }
  logger.info('User profile updated', { userId });
  res.json({ success: true, data: updated });
}, { audit: { action: 'update', entityType: 'userProfile' } }));

/**
 * Update user preferences only
 */
router.patch('/me/preferences', isAuthenticated, validateInput(profilePreferencesSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const currentPrefs = user.profilePreferences || {};
  const newPrefs = { ...currentPrefs, ...req.body };

  const [updated] = await db
    .update(users)
    .set({ profilePreferences: newPrefs, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  res.json({ success: true, data: { profilePreferences: updated.profilePreferences } });
}, { audit: { action: 'update', entityType: 'userPreferences' } }));

/**
 * Update notification settings only
 */
router.patch('/me/notifications', isAuthenticated, validateInput(notificationSettingsSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const currentSettings = user.notificationSettings || {};
  const newSettings = { ...currentSettings, ...req.body };

  const [updated] = await db
    .update(users)
    .set({ notificationSettings: newSettings, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  res.json({ success: true, data: { notificationSettings: updated.notificationSettings } });
}, { audit: { action: 'update', entityType: 'notificationSettings' } }));

export default router;

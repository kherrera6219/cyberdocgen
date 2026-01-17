import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { cloudIntegrations, users } from '@shared/schema';
import { encryptionService, DataClassification } from '../services/encryption';
import { auditService, AuditAction, RiskLevel } from '../services/auditService';
import { systemConfigService } from '../services/systemConfigService';
import { isAuthenticated, getRequiredUserId, getUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { asyncHandler, AppError, ForbiddenError, UnauthorizedError, ValidationError, NotFoundError } from '../utils/routeHelpers';

const router = Router();

// Validation schemas
const oauthSettingsSchema = z.object({
  googleClientId: z.string().optional(),
  googleClientSecret: z.string().optional(),
  microsoftClientId: z.string().optional(),
  microsoftClientSecret: z.string().optional(),
});

const pdfDefaultsSchema = z.object({
  defaultEncryptionLevel: z.enum(['RC4_40', 'RC4_128', 'AES128', 'AES256']).default('AES256'),
  defaultAllowPrinting: z.boolean().default(false),
  defaultAllowCopying: z.boolean().default(false),
  defaultAllowModifying: z.boolean().default(false),
  defaultAllowAnnotations: z.boolean().default(false),
  defaultWatermarkText: z.string().default('CONFIDENTIAL'),
  defaultWatermarkOpacity: z.number().min(0).max(1).default(0.3),
});

// Admin authorization middleware
const isAdmin = asyncHandler(async (req, res, next) => {
  const userId = getUserId(req);
  if (!userId) {
    throw new UnauthorizedError('Authentication required');
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || user.role !== 'admin') {
    throw new ForbiddenError('Administrator privileges required');
  }

  next();
});

/**
 * Get OAuth settings (masked for security)
 */
/**
 * Get OAuth settings (masked for security)
 */
router.get('/oauth-settings', isAuthenticated, isAdmin, asyncHandler(async (req, res) => {
  const settings = await systemConfigService.getOAuthSettingsForUI();

  res.json({
    success: true,
    ...settings,
  });
}));

/**
 * Save OAuth settings
 */
/**
 * Save OAuth settings
 */
router.post('/oauth-settings', isAuthenticated, isAdmin, asyncHandler(async (req, res) => {
  const settings = oauthSettingsSchema.parse(req.body);
  const userId = getRequiredUserId(req);
  const ipAddress = req.ip || '127.0.0.1';

  const configUpdates: string[] = [];
  let hasUpdates = false;
  
  // Update Google OAuth credentials if provided
  if (settings.googleClientId && settings.googleClientSecret) {
    const success = await systemConfigService.setOAuthCredentials(
      'google',
      {
        clientId: settings.googleClientId,
        clientSecret: settings.googleClientSecret,
      },
      userId,
      ipAddress
    );
    
    if (success) {
      configUpdates.push('Google OAuth credentials updated');
      hasUpdates = true;
    }
  }
  
  // Update Microsoft OAuth credentials if provided
  if (settings.microsoftClientId && settings.microsoftClientSecret) {
    const success = await systemConfigService.setOAuthCredentials(
      'microsoft',
      {
        clientId: settings.microsoftClientId,
        clientSecret: settings.microsoftClientSecret,
      },
      userId,
      ipAddress
    );
    
    if (success) {
      configUpdates.push('Microsoft OAuth credentials updated');
      hasUpdates = true;
    }
  }

  if (!hasUpdates) {
    throw new ValidationError('No valid OAuth credentials provided for update');
  }

  logger.info('OAuth settings updated by admin', {
    userId,
    configUpdates,
  });

  res.json({
    success: true,
    message: 'OAuth settings updated successfully',
    configUpdates,
  });
}));

/**
 * Get PDF security defaults
 */
/**
 * Get PDF security defaults
 */
router.get('/pdf-defaults', isAuthenticated, isAdmin, asyncHandler(async (req, res) => {
  const defaults = await systemConfigService.getPDFDefaults();

  res.json({
    success: true,
    defaults,
  });
}));

/**
 * Save PDF security defaults
 */
/**
 * Save PDF security defaults
 */
router.post('/pdf-defaults', isAuthenticated, isAdmin, asyncHandler(async (req, res) => {
  const defaults = pdfDefaultsSchema.parse(req.body);
  const userId = getRequiredUserId(req);
  const ipAddress = req.ip || '127.0.0.1';

  const success = await systemConfigService.setPDFDefaults(defaults, userId, ipAddress);

  if (!success) {
    throw new AppError('Failed to save PDF defaults');
  }

  logger.info('PDF defaults updated by admin', {
    userId,
    defaults,
  });

  res.json({
    success: true,
    message: 'PDF defaults updated successfully',
    note: 'New defaults will apply to future PDF security operations',
  });
}));

/**
 * Get all cloud integrations across organization
 */
/**
 * Get all cloud integrations across organization
 */
router.get('/cloud-integrations', isAuthenticated, isAdmin, asyncHandler(async (req, res) => {
  const integrations = await db.query.cloudIntegrations.findMany({
    orderBy: [cloudIntegrations.createdAt],
    with: {
      user: {
        columns: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Remove sensitive data before sending
  const sanitizedIntegrations = integrations.map(integration => ({
    id: integration.id,
    provider: integration.provider,
    displayName: integration.displayName,
    email: integration.email,
    isActive: integration.isActive,
    lastSyncAt: integration.lastSyncAt,
    syncStatus: integration.syncStatus,
    createdAt: integration.createdAt,
    user: integration.user,
  }));

  res.json({
    success: true,
    integrations: sanitizedIntegrations,
  });
}));

/**
 * Delete cloud integration (admin)
 */
/**
 * Delete cloud integration (admin)
 */
router.delete('/cloud-integrations/:integrationId', isAuthenticated, isAdmin, asyncHandler(async (req, res) => {
  const { integrationId } = req.params;
  const userId = getRequiredUserId(req);

  const integration = await db.query.cloudIntegrations.findFirst({
    where: eq(cloudIntegrations.id, integrationId),
  });

  if (!integration) {
    throw new NotFoundError('Integration not found');
  }

  await db.delete(cloudIntegrations)
    .where(eq(cloudIntegrations.id, integrationId));

  // Audit log
  await auditService.logAuditEvent({
    userId,
    action: AuditAction.DELETE,
    resourceType: 'cloud_integration',
    resourceId: integrationId,
    ipAddress: req.ip || '127.0.0.1',
    riskLevel: RiskLevel.HIGH,
    additionalContext: {
      provider: integration.provider,
      targetUser: integration.userId,
      adminAction: true,
    },
  });

  logger.info('Cloud integration deleted by admin', {
    integrationId,
    provider: integration.provider,
    adminUserId: userId,
    targetUser: integration.userId,
  });

  res.json({
    success: true,
    message: 'Integration deleted successfully',
  });
}));

/**
 * Get comprehensive system monitoring dashboard
 */
/**
 * Get comprehensive system monitoring dashboard
 */
router.get('/monitoring', isAuthenticated, isAdmin, asyncHandler(async (req, res) => {
  const { performanceService } = await import('../services/performanceService');
  const { alertingService } = await import('../services/alertingService');
  const { threatDetectionService } = await import('../services/threatDetectionService');

  const [performance, alerts, security] = await Promise.all([
    performanceService.getMetrics(),
    alertingService.getAlertMetrics(),
    threatDetectionService.getSecurityMetrics()
  ]);

  res.json({
    success: true,
    monitoring: {
      performance,
      alerts,
      security,
      health: {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    }
  });
}));

/**
 * Get system statistics (admin dashboard)
 */
/**
 * Get system statistics (admin dashboard)
 */
router.get('/stats', isAuthenticated, isAdmin, asyncHandler(async (req, res) => {
  // Get various system statistics
  const [
    totalUsers,
    activeIntegrations,
    totalCloudFiles,
    recentAudits,
  ] = await Promise.all([
    db.query.users.findMany(),
    db.query.cloudIntegrations.findMany({ where: eq(cloudIntegrations.isActive, true) }),
    db.query.cloudFiles.findMany(),
    // Get recent audit logs (simplified)
    db.query.auditLogs?.findMany({ 
      limit: 10,
      orderBy: (table) => [table.timestamp],
    }) || [],
  ]);

  const stats = {
    users: {
      total: totalUsers.length,
      admins: totalUsers.filter(u => u.role === 'admin').length,
      active: totalUsers.filter(u => u.isActive).length,
    },
    integrations: {
      total: activeIntegrations.length,
      google: activeIntegrations.filter(i => i.provider === 'google_drive').length,
      microsoft: activeIntegrations.filter(i => i.provider === 'onedrive').length,
    },
    files: {
      total: totalCloudFiles.length,
      secured: totalCloudFiles.filter(f => f.isSecurityLocked).length,
      byType: {
        pdf: totalCloudFiles.filter(f => f.fileType === 'pdf').length,
        docx: totalCloudFiles.filter(f => f.fileType === 'docx').length,
        xlsx: totalCloudFiles.filter(f => f.fileType === 'xlsx').length,
      },
    },
    security: {
      mfaEnabled: totalUsers.filter(u => u.twoFactorEnabled).length,
      recentAudits: recentAudits.length,
    },
  };

  res.json({
    success: true,
    stats,
  });
}));

export default router;
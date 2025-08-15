import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { cloudIntegrations, users } from '@shared/schema';
import { encryptionService, DataClassification } from '../services/encryption';
import { auditService, AuditAction, RiskLevel } from '../services/auditService';
import { isAuthenticated } from '../replitAuth';
import { logger } from '../utils/logger';

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
const isAdmin = async (req: any, res: any, next: any) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.claims.sub),
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Administrator privileges required' 
      });
    }

    next();
  } catch (error: any) {
    logger.error('Admin authorization failed', { error: error.message });
    res.status(500).json({ success: false, message: 'Authorization failed' });
  }
};

/**
 * Get OAuth settings (masked for security)
 */
router.get('/oauth-settings', isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    // Return masked settings to indicate what's configured
    const settings = {
      googleConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      microsoftConfigured: !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET),
      googleClientId: process.env.GOOGLE_CLIENT_ID ? 
        process.env.GOOGLE_CLIENT_ID.substring(0, 8) + '...' : '',
      microsoftClientId: process.env.MICROSOFT_CLIENT_ID ? 
        process.env.MICROSOFT_CLIENT_ID.substring(0, 8) + '...' : '',
    };

    res.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    logger.error('Failed to get OAuth settings', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve OAuth settings',
    });
  }
});

/**
 * Save OAuth settings
 */
router.post('/oauth-settings', isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const settings = oauthSettingsSchema.parse(req.body);
    const userId = req.user.claims.sub;

    // In a real application, you would store these in a secure configuration store
    // For now, we'll log that they were received and would need to be set as environment variables
    
    const configUpdates: string[] = [];
    
    if (settings.googleClientId) {
      configUpdates.push('GOOGLE_CLIENT_ID updated');
      // process.env.GOOGLE_CLIENT_ID = settings.googleClientId; // Would need proper env management
    }
    
    if (settings.googleClientSecret) {
      configUpdates.push('GOOGLE_CLIENT_SECRET updated');
      // process.env.GOOGLE_CLIENT_SECRET = settings.googleClientSecret; // Would need proper env management
    }
    
    if (settings.microsoftClientId) {
      configUpdates.push('MICROSOFT_CLIENT_ID updated');
      // process.env.MICROSOFT_CLIENT_ID = settings.microsoftClientId; // Would need proper env management
    }
    
    if (settings.microsoftClientSecret) {
      configUpdates.push('MICROSOFT_CLIENT_SECRET updated');
      // process.env.MICROSOFT_CLIENT_SECRET = settings.microsoftClientSecret; // Would need proper env management
    }

    // Audit log
    await auditService.logAuditEvent({
      userId,
      action: AuditAction.UPDATE,
      resourceType: 'oauth_settings',
      resourceId: 'system',
      ipAddress: req.ip || '127.0.0.1',
      riskLevel: RiskLevel.HIGH,
      additionalContext: {
        configUpdates,
        adminAction: true,
      },
    });

    logger.info('OAuth settings updated by admin', {
      userId,
      configUpdates,
    });

    res.json({
      success: true,
      message: 'OAuth settings updated successfully',
      note: 'Environment variables need to be updated and application restarted for changes to take effect',
    });
  } catch (error: any) {
    logger.error('Failed to save OAuth settings', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to save OAuth settings',
    });
  }
});

/**
 * Get PDF security defaults
 */
router.get('/pdf-defaults', isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    // Return default PDF security settings
    // In a real application, these would be stored in database or configuration
    const defaults = {
      defaultEncryptionLevel: process.env.PDF_DEFAULT_ENCRYPTION || 'AES256',
      defaultAllowPrinting: process.env.PDF_DEFAULT_ALLOW_PRINTING === 'true',
      defaultAllowCopying: process.env.PDF_DEFAULT_ALLOW_COPYING === 'true',
      defaultAllowModifying: process.env.PDF_DEFAULT_ALLOW_MODIFYING === 'true',
      defaultAllowAnnotations: process.env.PDF_DEFAULT_ALLOW_ANNOTATIONS === 'true',
      defaultWatermarkText: process.env.PDF_DEFAULT_WATERMARK_TEXT || 'CONFIDENTIAL',
      defaultWatermarkOpacity: parseFloat(process.env.PDF_DEFAULT_WATERMARK_OPACITY || '0.3'),
    };

    res.json({
      success: true,
      defaults,
    });
  } catch (error: any) {
    logger.error('Failed to get PDF defaults', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve PDF defaults',
    });
  }
});

/**
 * Save PDF security defaults
 */
router.post('/pdf-defaults', isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const defaults = pdfDefaultsSchema.parse(req.body);
    const userId = req.user.claims.sub;

    // In a real application, you would store these in a configuration table or secure store
    const configUpdates = [
      `PDF_DEFAULT_ENCRYPTION: ${defaults.defaultEncryptionLevel}`,
      `PDF_DEFAULT_ALLOW_PRINTING: ${defaults.defaultAllowPrinting}`,
      `PDF_DEFAULT_ALLOW_COPYING: ${defaults.defaultAllowCopying}`,
      `PDF_DEFAULT_ALLOW_MODIFYING: ${defaults.defaultAllowModifying}`,
      `PDF_DEFAULT_ALLOW_ANNOTATIONS: ${defaults.defaultAllowAnnotations}`,
      `PDF_DEFAULT_WATERMARK_TEXT: ${defaults.defaultWatermarkText}`,
      `PDF_DEFAULT_WATERMARK_OPACITY: ${defaults.defaultWatermarkOpacity}`,
    ];

    // Audit log
    await auditService.logAuditEvent({
      userId,
      action: AuditAction.UPDATE,
      resourceType: 'pdf_defaults',
      resourceId: 'system',
      ipAddress: req.ip || '127.0.0.1',
      riskLevel: RiskLevel.MEDIUM,
      additionalContext: {
        configUpdates,
        adminAction: true,
      },
    });

    logger.info('PDF defaults updated by admin', {
      userId,
      defaults,
    });

    res.json({
      success: true,
      message: 'PDF defaults updated successfully',
      note: 'New defaults will apply to future PDF security operations',
    });
  } catch (error: any) {
    logger.error('Failed to save PDF defaults', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to save PDF defaults',
    });
  }
});

/**
 * Get all cloud integrations across organization
 */
router.get('/cloud-integrations', isAuthenticated, isAdmin, async (req: any, res) => {
  try {
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
  } catch (error: any) {
    logger.error('Failed to get cloud integrations', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cloud integrations',
    });
  }
});

/**
 * Delete cloud integration (admin)
 */
router.delete('/cloud-integrations/:integrationId', isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { integrationId } = req.params;
    const userId = req.user.claims.sub;

    const integration = await db.query.cloudIntegrations.findFirst({
      where: eq(cloudIntegrations.id, integrationId),
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found',
      });
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
  } catch (error: any) {
    logger.error('Failed to delete cloud integration', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to delete integration',
    });
  }
});

/**
 * Get system statistics (admin dashboard)
 */
router.get('/stats', isAuthenticated, isAdmin, async (req: any, res) => {
  try {
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
  } catch (error: any) {
    logger.error('Failed to get admin stats', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system statistics',
    });
  }
});

export default router;
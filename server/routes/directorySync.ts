import { Router, Response, NextFunction } from 'express';
import { isAuthenticated } from '../replitAuth';
import { MultiTenantRequest, requireOrganization } from '../middleware/multiTenant';
import { secureHandler, ValidationError } from '../utils/errorHandling';
import { directorySyncService, DirectoryProvider } from '../services/directorySyncService';
import { logger } from '../utils/logger';

export async function registerDirectorySyncRoutes(router: Router) {
  /**
   * @swagger
   * /api/admin/directory-sync/config/{provider}:
   *   get:
   *     summary: Get directory synchronization configuration
   *     tags: [DirectorySync]
   *     security:
   *       - cookieAuth: []
   */
  router.get('/config/:provider', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const provider = req.params.provider as DirectoryProvider;

    if (!['okta', 'entra-id', 'gusto', 'rippling'].includes(provider)) {
      throw new ValidationError('Invalid directory sync provider');
    }

    const config = await directorySyncService.getConfig(organizationId, provider);
    
    // Return a default config representation if none exists to simplify UI state
    if (!config) {
      res.json({
        success: true,
        data: {
          organizationId,
          provider,
          tenantUrl: '',
          mfaEnforcementPolicy: true,
          autoProvision: false,
          enabled: false
        }
      });
      return;
    }

    res.json({ success: true, data: config });
  }));

  /**
   * @swagger
   * /api/admin/directory-sync/config:
   *   post:
   *     summary: Create or update directory sync configuration
   *     tags: [DirectorySync]
   *     security:
   *       - cookieAuth: []
   */
  router.post('/config', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const { provider, tenantUrl, clientId, clientSecret, mfaEnforcementPolicy, autoProvision, enabled } = req.body;

    if (!provider || !tenantUrl) {
      throw new ValidationError('Provider and Tenant URL are required');
    }

    if (!['okta', 'entra-id', 'gusto', 'rippling'].includes(provider)) {
      throw new ValidationError('Invalid directory sync provider');
    }

    const config = await directorySyncService.saveConfig({
      id: `${organizationId}:${provider}`,
      organizationId,
      provider,
      tenantUrl,
      clientId,
      clientSecretEncrypted: clientSecret, // Simulated secret encryption
      mfaEnforcementPolicy: !!mfaEnforcementPolicy,
      autoProvision: !!autoProvision,
      enabled: !!enabled
    });

    res.json({ success: true, data: config });
  }, { audit: { action: 'update', entityType: 'directory_sync_config' } }));

  /**
   * @swagger
   * /api/admin/directory-sync/sync/{provider}:
   *   post:
   *     summary: Trigger manual audit sync reconciliation run
   *     tags: [DirectorySync]
   *     security:
   *       - cookieAuth: []
   */
  router.post('/sync/:provider', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const provider = req.params.provider as DirectoryProvider;

    if (!['okta', 'entra-id', 'gusto', 'rippling'].includes(provider)) {
      throw new ValidationError('Invalid directory sync provider');
    }

    logger.info(`Manually triggering directory sync audit for provider: ${provider}`);
    const results = await directorySyncService.runSync(organizationId, provider);
    
    res.json({ success: true, data: results });
  }, { audit: { action: 'update', entityType: 'directory_sync_run' } }));
}

import { Router, Response } from 'express';
import { isAuthenticated, getRequiredUserId } from '../replitAuth';
import { secureHandler } from '../utils/errorHandling';
import { requireOrganization, type MultiTenantRequest } from '../middleware/multiTenant';
import { cloudIntegrationService } from '../services/cloudIntegrationService';
import { microsoftGraphService } from '../services/microsoftGraphService';
import { adobeIntegrationService } from '../services/adobeIntegrationService';
import { encryptionService, DataClassification } from '../services/encryption';
import { getRuntimeConfig } from '../config/runtime';
import crypto from 'crypto';

const router = Router();

/**
 * Get trusted redirect URI for a provider
 */
function getRedirectUri(req: MultiTenantRequest, provider: 'google' | 'microsoft'): string {
  const configuredBaseUrl = getRuntimeConfig().server.baseUrl?.trim();
  const baseUrl = configuredBaseUrl || `${req.protocol}://${req.get('host')}`;
  const normalized = baseUrl.replace(/\/+$/, '');
  return `${normalized}/api/cloud/auth/${provider}/callback`;
}

function validateOAuthState(
  req: MultiTenantRequest,
  provider: 'google' | 'microsoft',
  stateFromQuery: unknown
): boolean {
  const state = typeof stateFromQuery === 'string' ? stateFromQuery.trim() : '';
  const sessionState = (req.session as any)?.cloudOAuthState?.[provider];
  if (!state || !sessionState?.state || typeof sessionState.createdAt !== 'number') {
    return false;
  }

  const ageMs = Date.now() - sessionState.createdAt;
  if (ageMs > 10 * 60 * 1000) {
    return false;
  }

  const expected = String(sessionState.state);
  if (expected.length !== state.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(state), Buffer.from(expected));
}

/**
 * Initiate Google Drive OAuth
 */
router.get('/auth/google', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
  const redirectUri = getRedirectUri(req, 'google');
  const state = crypto.randomBytes(24).toString('hex');
  if (!req.session) {
    throw new Error('Session unavailable for OAuth state management');
  }
  (req.session as any).cloudOAuthState = {
    ...(req.session as any).cloudOAuthState,
    google: { state, createdAt: Date.now() },
  };
  const authUrl = await cloudIntegrationService.getGoogleAuthUrl(redirectUri, state);
  res.redirect(authUrl);
}));

/**
 * Google Drive OAuth callback
 */
router.get('/auth/google/callback', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
  const { code, state } = req.query;
  if (!code || !state || !validateOAuthState(req, 'google', state)) {
    return res.redirect('/cloud-integrations?error=invalid_oauth_state');
  }
  if (req.session && (req.session as any).cloudOAuthState) {
    delete (req.session as any).cloudOAuthState.google;
  }

  const redirectUri = getRedirectUri(req, 'google');
  const userId = getRequiredUserId(req);
  await cloudIntegrationService.handleGoogleCallback(
    code as string,
    redirectUri,
    userId,
    req.organizationId!
  );

  res.redirect('/cloud-integrations?success=google_connected');
}));

/**
 * Initiate Microsoft OneDrive OAuth
 */
router.get('/auth/microsoft', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
  const redirectUri = getRedirectUri(req, 'microsoft');
  const state = crypto.randomBytes(24).toString('hex');
  if (!req.session) {
    throw new Error('Session unavailable for OAuth state management');
  }
  (req.session as any).cloudOAuthState = {
    ...(req.session as any).cloudOAuthState,
    microsoft: { state, createdAt: Date.now() },
  };
  const authUrl = await cloudIntegrationService.getMicrosoftAuthUrl(redirectUri, state);
  res.redirect(authUrl);
}));

/**
 * Microsoft OneDrive OAuth callback
 */
router.get('/auth/microsoft/callback', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
  const { code, state } = req.query;
  if (!code || !state || !validateOAuthState(req, 'microsoft', state)) {
    return res.redirect('/cloud-integrations?error=invalid_oauth_state');
  }
  if (req.session && (req.session as any).cloudOAuthState) {
    delete (req.session as any).cloudOAuthState.microsoft;
  }

  const redirectUri = getRedirectUri(req, 'microsoft');
  const userId = getRequiredUserId(req);
  await cloudIntegrationService.handleMicrosoftCallback(
    code as string,
    redirectUri,
    userId,
    req.organizationId!
  );

  res.redirect('/cloud-integrations?success=microsoft_connected');
}));

/**
 * Get user's cloud integrations
 */
router.get('/integrations', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
  const userId = getRequiredUserId(req);
  const integrations = await cloudIntegrationService.getUserIntegrations(userId);
  res.json({
    success: true,
    data: {
      integrations
    }
  });
}));

/**
 * Sync files from cloud provider
 */
router.post('/sync/:integrationId', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
  const { integrationId } = req.params;
  const userId = getRequiredUserId(req);
  const integrations = await cloudIntegrationService.getUserIntegrations(userId);
  const integration = integrations.find(
    (item) => item.id === integrationId && item.organizationId === req.organizationId
  );
  if (!integration) {
    res.status(404).json({ success: false, message: 'Integration not found' });
    return;
  }
  const result = await cloudIntegrationService.syncFiles(integrationId, userId, req.organizationId!);
  res.json({
    success: true,
    data: result
  });
}));

/**
 * Get organization files
 */
router.get('/files', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
  const files = await cloudIntegrationService.getOrganizationFiles(req.organizationId!, req.query as any);
  res.json({
    success: true,
    data: {
      files
    }
  });
}));

/**
 * Apply PDF security settings
 */
router.post('/pdf/secure/:fileId', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
  const { fileId } = req.params;
  const userId = getRequiredUserId(req);
  const result = await cloudIntegrationService.applyPDFSecurity(fileId, req.body, userId, req.organizationId!);
  res.json({
    success: true,
    data: { result }
  });
}));

/**
 * Delete cloud integration
 */
router.delete('/integrations/:integrationId', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
  const { integrationId } = req.params;
  const userId = getRequiredUserId(req);
  const success = await cloudIntegrationService.deleteIntegration(integrationId, userId);
  res.json({
    success,
    message: success ? 'Integration deleted' : 'Integration not found'
  });
}));

/**
 * SharePoint Site Discovery
 */
router.get('/microsoft/sharepoint/sites', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
  const { q = 'compliance' } = req.query;
  const userId = getRequiredUserId(req);
  
  // Get integration to get access token
  const integrations = await cloudIntegrationService.getUserIntegrations(userId);
  const microsoftIntegration = integrations.find(i => i.provider === 'onedrive');
  
  if (!microsoftIntegration) {
    res.status(400).json({ success: false, message: 'Microsoft integration not found' });
    return;
  }

  const encryptedData = typeof microsoftIntegration.accessTokenEncrypted === 'string' 
    ? JSON.parse(microsoftIntegration.accessTokenEncrypted)
    : microsoftIntegration.accessTokenEncrypted;
  const accessToken = await encryptionService.decryptSensitiveField(encryptedData, DataClassification.RESTRICTED);

  const sites = await microsoftGraphService.searchSites(accessToken, q as string);
  res.json({ success: true, data: { sites } });
}));

/**
 * Teams Channel Discovery
 */
router.get('/microsoft/teams/channels', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
  const userId = getRequiredUserId(req);
  
  const integrations = await cloudIntegrationService.getUserIntegrations(userId);
  const microsoftIntegration = integrations.find(i => i.provider === 'onedrive');
  
  if (!microsoftIntegration) {
    res.status(400).json({ success: false, message: 'Microsoft integration not found' });
    return;
  }

  const encryptedData = typeof microsoftIntegration.accessTokenEncrypted === 'string' 
    ? JSON.parse(microsoftIntegration.accessTokenEncrypted)
    : microsoftIntegration.accessTokenEncrypted;
  const accessToken = await encryptionService.decryptSensitiveField(encryptedData, DataClassification.RESTRICTED);

  const teams = await microsoftGraphService.getJoinedTeams(accessToken);
  // For simplicity, we'll return teams and expect another call for channels, 
  // or we could map them here.
  res.json({ success: true, data: { teams } });
}));

/**
 * Adobe Sign Request
 */
router.post('/adobe/sign', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
  const { documentId, recipientEmail, recipientName, message } = req.body;
  
  if (!documentId || !recipientEmail) {
    res.status(400).json({ success: false, message: 'Missing required fields' });
    return;
  }

  const agreementId = await adobeIntegrationService.requestSignature({
    documentId,
    recipientEmail,
    recipientName,
    message
  });

  res.json({ 
    success: true, 
    data: { 
      agreementId,
      message: 'Signature request sent via Adobe Sign' 
    } 
  });
}));

export default router;

import { Router } from 'express';
import { z } from 'zod';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { cloudIntegrationService } from '../services/cloudIntegrationService';
import { pdfSecurityService } from '../services/pdfSecurityService';
import { isAuthenticated } from '../replitAuth';
import { logger } from '../utils/logger';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.xlsx', '.pptx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'));
    }
  },
});

// Validation schemas
const syncFilesSchema = z.object({
  integrationId: z.string().min(1, 'Integration ID required'),
});

const pdfSecuritySchema = z.object({
  fileId: z.string().min(1, 'File ID required'),
  organizationId: z.string().min(1, 'Organization ID required'),
  userPassword: z.string().optional(),
  ownerPassword: z.string().optional(),
  allowPrinting: z.boolean().default(false),
  allowCopying: z.boolean().default(false),
  allowModifying: z.boolean().default(false),
  allowAnnotations: z.boolean().default(false),
  allowFormFilling: z.boolean().default(true),
  allowAssembly: z.boolean().default(false),
  allowDegradedPrinting: z.boolean().default(false),
  encryptionLevel: z.enum(['RC4_40', 'RC4_128', 'AES128', 'AES256']).default('AES256'),
  keyLength: z.number().default(256),
  watermark: z.object({
    enabled: z.boolean(),
    text: z.string(),
    opacity: z.number().min(0).max(1),
    position: z.enum(['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right']).default('center'),
  }).optional(),
});

// Configure OAuth strategies
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use('google-drive', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/cloud/auth/google/callback',
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.readonly'],
  }, async (accessToken, refreshToken, profile, done) => {
    return done(null, {
      provider: 'google_drive',
      accessToken,
      refreshToken,
      profile: {
        id: profile.id,
        email: profile.emails?.[0]?.value || '',
        displayName: profile.displayName || '',
      },
    });
  }));
}

if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use('microsoft-onedrive', new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: '/api/cloud/auth/microsoft/callback',
    scope: ['user.read', 'files.read'],
  }, async (accessToken, refreshToken, profile, done) => {
    return done(null, {
      provider: 'onedrive',
      accessToken,
      refreshToken,
      profile: {
        id: profile.id,
        email: profile.emails?.[0]?.value || '',
        displayName: profile.displayName || '',
      },
    });
  }));
}

/**
 * Initiate Google Drive OAuth
 */
router.get('/auth/google', isAuthenticated, (req, res, next) => {
  // Store user info in session for callback
  req.session.authUser = { 
    id: req.user?.claims?.sub,
    organizationId: req.query.organizationId as string || 'default',
  };
  
  passport.authenticate('google-drive', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.readonly'],
    accessType: 'offline',
    prompt: 'consent',
  })(req, res, next);
});

/**
 * Google Drive OAuth callback
 */
router.get('/auth/google/callback', (req, res, next) => {
  passport.authenticate('google-drive', async (err, authData) => {
    try {
      if (err || !authData) {
        logger.error('Google OAuth authentication failed', { err });
        return res.redirect('/dashboard?error=google_auth_failed');
      }

      const userId = req.session.authUser?.id;
      const organizationId = req.session.authUser?.organizationId || 'default';

      if (!userId) {
        return res.redirect('/dashboard?error=session_expired');
      }

      // Create cloud integration
      const integrationId = await cloudIntegrationService.createIntegration({
        userId,
        organizationId,
        provider: 'google_drive',
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        userProfile: authData.profile,
      });

      // Start file sync
      cloudIntegrationService.syncFiles(integrationId).catch(error => {
        logger.error('Background file sync failed', { integrationId, error });
      });

      res.redirect('/dashboard?success=google_connected');
    } catch (error: any) {
      logger.error('Google integration setup failed', { error: error.message });
      res.redirect('/dashboard?error=integration_failed');
    }
  })(req, res, next);
});

/**
 * Initiate Microsoft OneDrive OAuth
 */
router.get('/auth/microsoft', isAuthenticated, (req, res, next) => {
  // Store user info in session for callback
  req.session.authUser = { 
    id: req.user?.claims?.sub,
    organizationId: req.query.organizationId as string || 'default',
  };
  
  passport.authenticate('microsoft-onedrive')(req, res, next);
});

/**
 * Microsoft OneDrive OAuth callback
 */
router.get('/auth/microsoft/callback', (req, res, next) => {
  passport.authenticate('microsoft-onedrive', async (err, authData) => {
    try {
      if (err || !authData) {
        logger.error('Microsoft OAuth authentication failed', { err });
        return res.redirect('/dashboard?error=microsoft_auth_failed');
      }

      const userId = req.session.authUser?.id;
      const organizationId = req.session.authUser?.organizationId || 'default';

      if (!userId) {
        return res.redirect('/dashboard?error=session_expired');
      }

      // Create cloud integration
      const integrationId = await cloudIntegrationService.createIntegration({
        userId,
        organizationId,
        provider: 'onedrive',
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        userProfile: authData.profile,
      });

      // Start file sync
      cloudIntegrationService.syncFiles(integrationId).catch(error => {
        logger.error('Background file sync failed', { integrationId, error });
      });

      res.redirect('/dashboard?success=microsoft_connected');
    } catch (error: any) {
      logger.error('Microsoft integration setup failed', { error: error.message });
      res.redirect('/dashboard?error=integration_failed');
    }
  })(req, res, next);
});

/**
 * Get user's cloud integrations
 */
router.get('/integrations', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const integrations = await cloudIntegrationService.getUserIntegrations(userId);
    
    res.json({
      success: true,
      integrations,
    });
  } catch (error: any) {
    logger.error('Failed to get integrations', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve integrations',
    });
  }
});

/**
 * Sync files from cloud provider
 */
router.post('/sync', isAuthenticated, async (req: any, res) => {
  try {
    const { integrationId } = syncFilesSchema.parse(req.body);
    
    const result = await cloudIntegrationService.syncFiles(integrationId);
    
    res.json({
      success: true,
      message: 'File sync completed',
      result,
    });
  } catch (error: any) {
    logger.error('File sync failed', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message || 'File sync failed',
    });
  }
});

/**
 * Get organization files
 */
router.get('/files', isAuthenticated, async (req: any, res) => {
  try {
    const organizationId = req.query.organizationId || 'default';
    const filters = {
      provider: req.query.provider,
      fileType: req.query.fileType,
      securityLevel: req.query.securityLevel,
    };
    
    const files = await cloudIntegrationService.getOrganizationFiles(organizationId, filters);
    
    res.json({
      success: true,
      files,
    });
  } catch (error: any) {
    logger.error('Failed to get files', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve files',
    });
  }
});

/**
 * Apply PDF security settings
 */
router.post('/pdf/secure', isAuthenticated, upload.single('pdfFile'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required',
      });
    }

    const config = pdfSecuritySchema.parse(JSON.parse(req.body.config || '{}'));
    config.createdBy = req.user.claims.sub;

    const result = await pdfSecurityService.securePDF(req.file.buffer, config);
    
    res.json({
      success: result.success,
      result,
    });
  } catch (error: any) {
    logger.error('PDF security application failed', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to apply PDF security',
    });
  }
});

/**
 * Get PDF security settings
 */
router.get('/pdf/security/:fileId', isAuthenticated, async (req, res) => {
  try {
    const { fileId } = req.params;
    const settings = await pdfSecurityService.getPDFSecuritySettings(fileId);
    
    res.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    logger.error('Failed to get PDF security settings', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve PDF security settings',
    });
  }
});

/**
 * Delete cloud integration
 */
router.delete('/integrations/:integrationId', isAuthenticated, async (req: any, res) => {
  try {
    const { integrationId } = req.params;
    const userId = req.user.claims.sub;
    
    const deleted = await cloudIntegrationService.deleteIntegration(integrationId, userId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found',
      });
    }

    res.json({
      success: true,
      message: 'Integration deleted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to delete integration', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to delete integration',
    });
  }
});

/**
 * Remove PDF security
 */
router.delete('/pdf/security/:fileId', isAuthenticated, async (req: any, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.claims.sub;
    
    const removed = await pdfSecurityService.removePDFSecurity(fileId, userId);
    
    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'PDF security settings not found',
      });
    }

    res.json({
      success: true,
      message: 'PDF security settings removed successfully',
    });
  } catch (error: any) {
    logger.error('Failed to remove PDF security', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to remove PDF security settings',
    });
  }
});

export default router;
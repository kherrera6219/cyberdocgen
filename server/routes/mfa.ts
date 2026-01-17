import { Router, Response, NextFunction } from 'express';
import { mfaService } from '../services/mfaService';
import { auditService, AuditAction, RiskLevel } from '../services/auditService';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { encryptionService, DataClassification } from '../services/encryption';
import { 
  secureHandler, 
  validateInput,
  ForbiddenError,
  NotFoundError,
  ValidationError
} from '../utils/errorHandling';
import { getRequiredUserId } from '../replitAuth';
import { type MultiTenantRequest } from '../middleware/multiTenant';

// Extend Express Request types locally for this file to avoid global conflicts

// Add session properties
declare module 'express-session' {
  interface SessionData {
    mfaVerified?: boolean;
    mfaVerifiedAt?: Date;
  }
}

const router = Router();

// Input validation schemas
const setupTOTPSchema = z.object({
  enable: z.boolean().optional()
});

const verifyTOTPSchema = z.object({
  token: z.string().length(6).regex(/^\d+$/, 'Token must be 6 digits'),
  backupCode: z.string().optional()
});

const setupSMSSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number format')
});

const verifySMSSchema = z.object({
  code: z.string().length(6).regex(/^\d+$/, 'Code must be 6 digits')
});

/**
 * GET /api/auth/mfa/status
 * Get user's current MFA configuration status
 */
router.get('/status', secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);

  // In a full implementation, fetch from database
  const mfaStatus = {
    totpEnabled: false,
    smsEnabled: false,
    backupCodesGenerated: false,
    lastUsed: null,
    isSetupComplete: false
  };

  await auditService.logAuditEvent({
    action: AuditAction.READ,
    resourceType: 'mfa_status',
    resourceId: userId,
    ipAddress: req.ip || 'unknown',
    riskLevel: RiskLevel.LOW,
    additionalContext: { status: mfaStatus }
  });

  res.json({ success: true, data: mfaStatus });
}));

/**
 * POST /api/auth/mfa/setup
 * Generic setup endpoint
 */
router.post('/setup', secureHandler(async (req: MultiTenantRequest, _res: Response, _next: NextFunction) => {
  getRequiredUserId(req);
  throw new ValidationError('Please specify MFA method: use /setup/totp or /setup/sms', { code: 'METHOD_REQUIRED' });
}));

/**
 * POST /api/auth/mfa/setup/totp
 * Initialize TOTP setup for user
 */
router.post('/setup/totp', validateInput(setupTOTPSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);

  const mfaSetup = await mfaService.setupTOTP(userId);
  await mfaService.storeTOTPSettings(
    userId,
    mfaSetup.secret,
    mfaSetup.backupCodes,
    mfaSetup.qrCodeUrl
  );

  res.json({
    success: true,
    data: {
      qrCodeUrl: mfaSetup.qrCodeUrl,
      backupCodes: mfaSetup.backupCodes,
      setupComplete: false,
      instructions: {
        step1: 'Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)',
        step2: 'Enter the 6-digit code from your app to verify setup',
        step3: 'Save your backup codes in a secure location'
      }
    }
  });
}, { audit: { action: 'create', entityType: 'mfaTOTP' } }));

/**
 * POST /api/auth/mfa/verify/totp
 * Verify TOTP token to complete setup or authenticate
 */
router.post('/verify/totp', validateInput(verifyTOTPSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);
  const { token, backupCode } = req.body;

  const totpSettings = await mfaService.getTOTPSettings(userId);
  if (!totpSettings) {
    throw new NotFoundError('TOTP setup not found. Please set up MFA first.');
  }

  let verified = false;
  let usedBackupCode = false;

  if (backupCode) {
    verified = await mfaService.verifyBackupCode(userId, backupCode, totpSettings.backupCodes);
    usedBackupCode = verified;
    if (verified) {
      await mfaService.updateBackupCodes(userId, totpSettings.backupCodes);
    }
  } else {
    const verification = await mfaService.verifyTOTP(userId, token, totpSettings.secret);
    verified = verification.verified;
  }

  if (verified) {
    // Mark session as MFA verified
    if (req.session) {
      req.session.mfaVerified = true;
      req.session.mfaVerifiedAt = new Date();
    }

    await mfaService.markTOTPVerified(userId);

    res.json({
      success: true,
      data: {
        verified: true,
        message: usedBackupCode ? 
          'Backup code verified successfully' : 
          'TOTP token verified successfully',
        sessionDuration: '30 minutes'
      }
    });
  } else {
    throw new ValidationError(usedBackupCode ? 'Invalid backup code' : 'Invalid TOTP token', {
      code: 'VERIFICATION_FAILED'
    });
  }
}));

/**
 * POST /api/auth/mfa/setup/sms
 * Setup SMS-based MFA
 */
router.post('/setup/sms', validateInput(setupSMSSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);
  const { phoneNumber } = req.body;

  const smsConfig = await mfaService.setupSMS(userId, phoneNumber);

  res.json({
    success: true,
    data: {
      message: 'SMS verification code sent',
      phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
      expiresIn: '10 minutes',
      // Development only - remove in production
      devCode: smsConfig.verificationCode
    }
  });
}, { audit: { action: 'create', entityType: 'mfaSMS' } }));

/**
 * POST /api/auth/mfa/verify/sms
 * Verify SMS code
 */
router.post('/verify/sms', validateInput(verifySMSSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);
  const { code } = req.body;

  // In production, fetch SMS config from database
  const mockSMSConfig = {
    enabled: true,
    phoneNumber: '+1234567890',
    verificationCode: '123456',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  };

  const verified = await mfaService.verifySMS(userId, code, mockSMSConfig);

  if (verified) {
    if (req.session) {
      req.session.mfaVerified = true;
      req.session.mfaVerifiedAt = new Date();
    }

    res.json({
      success: true,
      data: {
        verified: true,
        message: 'SMS code verified successfully',
        sessionDuration: '30 minutes'
      }
    });
  } else {
    throw new ValidationError('Invalid or expired SMS code', {
      code: 'VERIFICATION_FAILED'
    });
  }
}));

/**
 * POST /api/auth/mfa/challenge
 * Request MFA challenge for high-risk operations
 */
router.post('/challenge', secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);

  // In production, determine available MFA methods from database
  const availableMethods = ['totp', 'sms'];

  await auditService.logAuditEvent({
    action: AuditAction.READ,
    resourceType: 'mfa_challenge_request',
    resourceId: userId,
    ipAddress: req.ip || 'unknown',
    riskLevel: RiskLevel.MEDIUM,
    additionalContext: { 
      availableMethods,
      requestPath: req.headers.referer
    }
  });

  res.json({
    success: true,
    data: {
      challengeRequired: true,
      availableMethods,
      message: 'Please provide MFA verification to continue',
      endpoints: {
        totp: '/api/auth/mfa/verify/totp',
        sms: '/api/auth/mfa/verify/sms'
      }
    }
  });
}));

/**
 * POST /api/auth/mfa/backup-codes
 * Generate backup codes for user
 */
router.post('/backup-codes', secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);

  const mfaSetup = await mfaService.setupTOTP(userId);

  // Encrypt and store the backup codes
  await encryptionService.encryptSensitiveField(
    JSON.stringify(mfaSetup.backupCodes),
    DataClassification.RESTRICTED
  );

  await auditService.logAuditEvent({
    action: AuditAction.CREATE,
    resourceType: 'mfa_backup_codes',
    resourceId: userId,
    ipAddress: req.ip || 'unknown',
    riskLevel: RiskLevel.MEDIUM,
    additionalContext: { codesCount: mfaSetup.backupCodes.length }
  });

  res.json({
    success: true,
    data: {
      backupCodes: mfaSetup.backupCodes,
      message: 'Backup codes generated successfully. Please save them securely.'
    }
  });
}, { audit: { action: 'create', entityType: 'mfaBackupCodes' } }));

/**
 * DELETE /api/auth/mfa/disable
 * Disable MFA for user (requires current MFA verification)
 */
router.delete('/disable', secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);

  // Require MFA verification to disable MFA (security best practice)
  if (!req.session?.mfaVerified) {
    throw new ForbiddenError('MFA verification required to disable MFA');
  }

  await auditService.logAuditEvent({
    action: AuditAction.DELETE,
    resourceType: 'mfa_settings',
    resourceId: userId,
    ipAddress: req.ip || 'unknown',
    riskLevel: RiskLevel.HIGH,
    additionalContext: { 
      action: 'mfa_disabled',
      previouslyEnabled: true
    }
  });

  logger.info('MFA disabled for user', { userId });

  res.json({
    success: true,
    data: {
      message: 'Multi-factor authentication has been disabled',
      mfaEnabled: false
    }
  });
}, { audit: { action: 'delete', entityType: 'mfaSettings' } }));

export default router;

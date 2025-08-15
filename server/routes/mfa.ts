import { Router } from 'express';
import { mfaService } from '../services/mfaService';
import { encryptionService, DataClassification } from '../services/encryption';
import { auditService, AuditAction, RiskLevel } from '../services/auditService';
import { logger } from '../utils/logger';
import { z } from 'zod';

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
  phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
});

const verifySMSSchema = z.object({
  code: z.string().length(6).regex(/^\d+$/, 'Code must be 6 digits')
});

/**
 * GET /api/auth/mfa/status
 * Get user's current MFA configuration status
 */
router.get('/status', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

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
      ipAddress: req.ip,
      riskLevel: RiskLevel.LOW,
      additionalContext: { status: mfaStatus }
    });

    res.json(mfaStatus);

  } catch (error: any) {
    logger.error('MFA status check failed', { error: error.message, userId: req.user?.claims?.sub });
    res.status(500).json({ message: 'Failed to retrieve MFA status' });
  }
});

/**
 * POST /api/auth/mfa/setup/totp
 * Initialize TOTP setup for user
 */
router.post('/setup/totp', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { enable } = setupTOTPSchema.parse(req.body);

    const mfaSetup = await mfaService.setupTOTP(userId);

    // Encrypt and store the secret (in production implementation)
    const encryptedSecret = await encryptionService.encryptSensitiveField(
      mfaSetup.secret,
      DataClassification.RESTRICTED
    );

    const encryptedBackupCodes = await encryptionService.encryptSensitiveField(
      JSON.stringify(mfaSetup.backupCodes),
      DataClassification.RESTRICTED
    );

    // Response includes QR code URL for setup but not the raw secret
    res.json({
      qrCodeUrl: mfaSetup.qrCodeUrl,
      backupCodes: mfaSetup.backupCodes, // Show once during setup
      setupComplete: false,
      instructions: {
        step1: 'Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)',
        step2: 'Enter the 6-digit code from your app to verify setup',
        step3: 'Save your backup codes in a secure location'
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid input', 
        errors: error.errors 
      });
    }

    logger.error('TOTP setup failed', { error: error.message, userId: req.user?.claims?.sub });
    res.status(500).json({ message: 'Failed to setup TOTP MFA' });
  }
});

/**
 * POST /api/auth/mfa/verify/totp
 * Verify TOTP token to complete setup or authenticate
 */
router.post('/verify/totp', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { token, backupCode } = verifyTOTPSchema.parse(req.body);

    // In production, fetch encrypted secret from database
    const mockSecret = 'JBSWY3DPEHPK3PXP'; // Development only

    let verified = false;
    let usedBackupCode = false;

    if (backupCode) {
      // Verify backup code
      const mockBackupCodes = ['ABC123', 'DEF456', 'GHI789']; // From database
      verified = await mfaService.verifyBackupCode(userId, backupCode, mockBackupCodes);
      usedBackupCode = verified;
    } else {
      // Verify TOTP token
      const verification = await mfaService.verifyTOTP(userId, token, mockSecret);
      verified = verification.verified;
    }

    if (verified) {
      // Mark session as MFA verified
      req.session.mfaVerified = true;
      req.session.mfaVerifiedAt = new Date();

      res.json({
        verified: true,
        message: usedBackupCode ? 
          'Backup code verified successfully' : 
          'TOTP token verified successfully',
        sessionDuration: '30 minutes'
      });
    } else {
      res.status(400).json({
        verified: false,
        message: usedBackupCode ? 
          'Invalid backup code' : 
          'Invalid TOTP token'
      });
    }

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid input', 
        errors: error.errors 
      });
    }

    logger.error('TOTP verification failed', { error: error.message, userId: req.user?.claims?.sub });
    res.status(500).json({ message: 'Failed to verify TOTP token' });
  }
});

/**
 * POST /api/auth/mfa/setup/sms
 * Setup SMS-based MFA
 */
router.post('/setup/sms', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { phoneNumber } = setupSMSSchema.parse(req.body);

    const smsConfig = await mfaService.setupSMS(userId, phoneNumber);

    // In production, the verification code would be sent via SMS
    res.json({
      message: 'SMS verification code sent',
      phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'), // Masked for security
      expiresIn: '10 minutes',
      // Development only - remove in production
      devCode: smsConfig.verificationCode
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid phone number format', 
        errors: error.errors 
      });
    }

    logger.error('SMS MFA setup failed', { error: error.message, userId: req.user?.claims?.sub });
    res.status(500).json({ message: 'Failed to setup SMS MFA' });
  }
});

/**
 * POST /api/auth/mfa/verify/sms
 * Verify SMS code
 */
router.post('/verify/sms', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { code } = verifySMSSchema.parse(req.body);

    // In production, fetch SMS config from database
    const mockSMSConfig = {
      enabled: true,
      phoneNumber: '+1234567890',
      verificationCode: '123456', // From database
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };

    const verified = await mfaService.verifySMS(userId, code, mockSMSConfig);

    if (verified) {
      req.session.mfaVerified = true;
      req.session.mfaVerifiedAt = new Date();

      res.json({
        verified: true,
        message: 'SMS code verified successfully',
        sessionDuration: '30 minutes'
      });
    } else {
      res.status(400).json({
        verified: false,
        message: 'Invalid or expired SMS code'
      });
    }

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid input', 
        errors: error.errors 
      });
    }

    logger.error('SMS verification failed', { error: error.message, userId: req.user?.claims?.sub });
    res.status(500).json({ message: 'Failed to verify SMS code' });
  }
});

/**
 * POST /api/auth/mfa/challenge
 * Request MFA challenge for high-risk operations
 */
router.post('/challenge', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // In production, determine available MFA methods from database
    const availableMethods = ['totp', 'sms'];
    
    await auditService.logAuditEvent({
      action: AuditAction.READ,
      resourceType: 'mfa_challenge_request',
      resourceId: userId,
      ipAddress: req.ip,
      riskLevel: RiskLevel.MEDIUM,
      additionalContext: { 
        availableMethods,
        requestPath: req.headers.referer
      }
    });

    res.json({
      challengeRequired: true,
      availableMethods,
      message: 'Please provide MFA verification to continue',
      endpoints: {
        totp: '/api/auth/mfa/verify/totp',
        sms: '/api/auth/mfa/verify/sms'
      }
    });

  } catch (error: any) {
    logger.error('MFA challenge request failed', { error: error.message, userId: req.user?.claims?.sub });
    res.status(500).json({ message: 'Failed to create MFA challenge' });
  }
});

/**
 * DELETE /api/auth/mfa/disable
 * Disable MFA for user (requires current MFA verification)
 */
router.delete('/disable', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Require MFA verification to disable MFA (security best practice)
    if (!req.session.mfaVerified) {
      return res.status(403).json({
        message: 'MFA verification required to disable MFA',
        mfaRequired: true
      });
    }

    // In production, disable MFA in database
    await auditService.logAuditEvent({
      action: AuditAction.DELETE,
      resourceType: 'mfa_settings',
      resourceId: userId,
      ipAddress: req.ip,
      riskLevel: RiskLevel.HIGH,
      additionalContext: { 
        action: 'mfa_disabled',
        previouslyEnabled: true
      }
    });

    logger.info('MFA disabled for user', { userId });

    res.json({
      message: 'Multi-factor authentication has been disabled',
      mfaEnabled: false
    });

  } catch (error: any) {
    logger.error('MFA disable failed', { error: error.message, userId: req.user?.claims?.sub });
    res.status(500).json({ message: 'Failed to disable MFA' });
  }
});

export default router;
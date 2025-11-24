// @ts-nocheck
import { Router } from 'express';
import { z } from 'zod';
import { enterpriseAuthService } from '../services/enterpriseAuthService';
import { mfaService } from '../services/mfaService';
import { logger } from '../utils/logger';
import { auditService, AuditAction, RiskLevel } from '../services/auditService';

const router = Router();

// Account creation schema
const createAccountSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number, and special character'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
});

// Password reset request schema
const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Password reset confirm schema
const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token required'),
  newPassword: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number, and special character'),
});

// Email verification schema
const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token required'),
});

// Google Authenticator setup schema
const googleAuthSetupSchema = z.object({
  userId: z.string().min(1, 'User ID required'),
});

// Passkey registration schema
const passkeyRegistrationSchema = z.object({
  userId: z.string().min(1, 'User ID required'),
  credentialId: z.string().min(1, 'Credential ID required'),
  publicKey: z.string().min(1, 'Public key required'),
  deviceName: z.string().min(1, 'Device name required'),
  deviceType: z.enum(['platform', 'cross-platform']),
  transports: z.array(z.string()),
});

/**
 * Create enterprise user account
 */
router.post('/signup', async (req, res) => {
  try {
    const validatedData = createAccountSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;
    
    const result = await enterpriseAuthService.createAccount(validatedData, ipAddress);
    
    // In production, send email verification here
    // await emailService.sendVerificationEmail(result.user.email, result.emailToken);
    
    logger.info('Enterprise account creation initiated', {
      userId: result.user.id,
      email: result.user.email,
      requiresEmailVerification: true,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email for verification.',
      user: result.user,
      // Don't send token in production - it should be emailed
      emailVerificationToken: result.emailToken, // DEV ONLY
    });
  } catch (error: any) {
    logger.error('Account creation failed', { error: error.message });
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    res.status(400).json({
      success: false,
      message: 'Account creation failed',
      errors: error.issues || [{ message: error.message }],
    });
  }
});

/**
 * Verify email address
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = emailVerificationSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;
    
    const verified = await enterpriseAuthService.verifyEmail(token, ipAddress);
    
    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    res.json({
      success: true,
      message: 'Email verified successfully. Your account is now active.',
    });
  } catch (error: any) {
    logger.error('Email verification failed', { error: error.message });
    res.status(400).json({
      success: false,
      message: 'Email verification failed',
      errors: error.issues || [{ message: error.message }],
    });
  }
});

/**
 * Request password reset
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = passwordResetRequestSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;
    
    const resetToken = await enterpriseAuthService.initiatePasswordReset({
      email,
      resetUrl: `${req.protocol}://${req.get('host')}/reset-password`,
    }, ipAddress);
    
    // In production, send reset email here
    // await emailService.sendPasswordResetEmail(email, resetToken);
    
    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      // Don't send token in production - it should be emailed
      resetToken: resetToken, // DEV ONLY
    });
  } catch (error: any) {
    logger.error('Password reset request failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Password reset request failed',
    });
  }
});

/**
 * Confirm password reset
 */
router.post('/reset-password', async (req, res) => {
  try {
    const validatedData = passwordResetConfirmSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;
    
    const reset = await enterpriseAuthService.confirmPasswordReset(validatedData, ipAddress);
    
    if (!reset) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error: any) {
    logger.error('Password reset failed', { error: error.message });
    res.status(400).json({
      success: false,
      message: 'Password reset failed',
      errors: error.issues || [{ message: error.message }],
    });
  }
});

/**
 * Setup Google Authenticator
 */
router.post('/setup-google-authenticator', async (req, res) => {
  try {
    const { userId } = googleAuthSetupSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;
    
    const setup = await enterpriseAuthService.setupGoogleAuthenticator(userId, ipAddress);
    
    res.json({
      success: true,
      message: 'Google Authenticator setup initiated',
      setup: {
        qrCodeUrl: setup.qrCodeUrl,
        secret: setup.secret, // For manual entry
        backupCodes: setup.backupCodes,
      },
    });
  } catch (error: any) {
    logger.error('Google Authenticator setup failed', { error: error.message });
    res.status(400).json({
      success: false,
      message: 'Google Authenticator setup failed',
      errors: error.issues || [{ message: error.message }],
    });
  }
});

/**
 * Verify Google Authenticator setup
 */
router.post('/verify-google-authenticator', async (req, res) => {
  try {
    const { userId, token } = z.object({
      userId: z.string(),
      token: z.string().length(6, 'TOTP code must be 6 digits'),
    }).parse(req.body);
    
    const ipAddress = req.ip || req.socket.remoteAddress;
    
    // Get the user's TOTP secret for verification
    const mfaSetting = await mfaService.getMFASettings(userId, 'totp');
    if (!mfaSetting || !mfaSetting.secretEncrypted) {
      return res.status(400).json({
        success: false,
        message: 'Google Authenticator not set up for this user',
      });
    }

    const verified = await mfaService.verifyTOTP(userId, token, mfaSetting.secretEncrypted);
    
    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid TOTP code',
      });
    }

    // Enable MFA for the user
    await mfaService.enableMFA(userId, 'totp');

    // Audit log
    await auditService.logAuditEvent({
      userId,
      action: AuditAction.UPDATE,
      resourceType: 'mfa_verification',
      resourceId: userId,
      ipAddress: ipAddress || '127.0.0.1',
      riskLevel: RiskLevel.MEDIUM,
      additionalContext: {
        mfaType: 'totp',
        verified: true,
        authenticatorApp: 'Google Authenticator',
      },
    });

    res.json({
      success: true,
      message: 'Google Authenticator verified and enabled successfully',
    });
  } catch (error: any) {
    logger.error('Google Authenticator verification failed', { error: error.message });
    res.status(400).json({
      success: false,
      message: 'Google Authenticator verification failed',
      errors: error.issues || [{ message: error.message }],
    });
  }
});

/**
 * Register passkey
 */
router.post('/register-passkey', async (req, res) => {
  try {
    const validatedData = passkeyRegistrationSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;
    
    const registered = await enterpriseAuthService.registerPasskey(validatedData, ipAddress);
    
    if (!registered) {
      return res.status(400).json({
        success: false,
        message: 'Passkey registration failed',
      });
    }

    res.json({
      success: true,
      message: 'Passkey registered successfully',
    });
  } catch (error: any) {
    logger.error('Passkey registration failed', { error: error.message });
    res.status(400).json({
      success: false,
      message: 'Passkey registration failed',
      errors: error.issues || [{ message: error.message }],
    });
  }
});

/**
 * Get authentication methods available for user
 */
router.get('/methods/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's authentication methods
    const mfaSettings = await mfaService.getAllMFASettings(userId);
    const passkeyCount = await mfaService.getPasskeyCount(userId);
    
    const methods = {
      password: true, // Always available for enterprise accounts
      totp: mfaSettings.some(m => m.mfaType === 'totp' && m.isEnabled),
      sms: mfaSettings.some(m => m.mfaType === 'sms' && m.isEnabled),
      backupCodes: mfaSettings.some(m => m.mfaType === 'backup_codes' && m.isEnabled),
      passkey: passkeyCount > 0,
    };

    res.json({
      success: true,
      methods,
      mfaEnabled: methods.totp || methods.sms || methods.passkey,
    });
  } catch (error: any) {
    logger.error('Failed to get authentication methods', { error: error.message });
    res.status(400).json({
      success: false,
      message: 'Failed to get authentication methods',
    });
  }
});

export default router;
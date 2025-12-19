import { Router } from 'express';
import { z } from 'zod';
import { enterpriseAuthService } from '../services/enterpriseAuthService';
import { mfaService } from '../services/mfaService';
import { logger } from '../utils/logger';
import { auditService, AuditAction, RiskLevel } from '../services/auditService';
import { authStrictLimiter, authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Login schema - accepts email or username
const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

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
 * Login with email/username and password
 * Strict rate limiting: 5 attempts per hour to prevent brute force
 */
router.post('/login', authStrictLimiter, async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await enterpriseAuthService.authenticateUser(
      validatedData.identifier,
      validatedData.password,
      ipAddress
    );

    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.error || 'Authentication failed',
      });
    }

    // Regenerate session to prevent session fixation attacks
    // This creates a new session ID while preserving session data
    const regenerateSession = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!req.session) {
          resolve();
          return;
        }
        
        req.session.regenerate((err) => {
          if (err) {
            logger.error('Session regeneration failed', { error: err.message });
            reject(err);
            return;
          }
          
          // Set user data on the new session
          req.session.userId = result.user?.id;
          req.session.email = result.user?.email;
          req.session.loginTime = new Date().toISOString();
          
          // Save the new session
          req.session.save((saveErr) => {
            if (saveErr) {
              logger.error('Session save failed', { error: saveErr.message });
              reject(saveErr);
              return;
            }
            resolve();
          });
        });
      });
    };

    try {
      await regenerateSession();
    } catch (sessionError: any) {
      logger.error('Session management failed during login', { error: sessionError.message });
      return res.status(500).json({
        success: false,
        message: 'Session creation failed',
      });
    }

    logger.info('User logged in successfully with session regeneration', {
      userId: result.user?.id,
      email: result.user?.email,
      mfaEnabled: result.user?.twoFactorEnabled,
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: result.user,
      requiresMFA: result.user?.twoFactorEnabled || false,
    });
  } catch (error: any) {
    logger.error('Login failed', { error: error.message });
    res.status(400).json({
      success: false,
      message: 'Login failed',
      errors: error.issues || [{ message: error.message }],
    });
  }
});

/**
 * Create enterprise user account
 * Strict rate limiting to prevent account enumeration
 */
router.post('/signup', authStrictLimiter, async (req, res) => {
  try {
    const validatedData = createAccountSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;
    
    const result = await enterpriseAuthService.createAccount(validatedData, ipAddress);
    
    // TODO: Integrate email service (SendGrid/Resend) for production email sending
    // await emailService.sendVerificationEmail(result.user.email, result.emailToken);
    
    logger.info('Enterprise account creation initiated', {
      userId: result.user.id,
      email: result.user.email,
      requiresEmailVerification: true,
    });

    // In development, provide the token directly for testing
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    res.status(201).json({
      success: true,
      message: isDevelopment 
        ? 'Account created! Use the verification token below to verify your email (development mode).'
        : 'Account created successfully. Please check your email for verification.',
      user: result.user,
      // Include token in development for testing
      ...(isDevelopment && { 
        emailVerificationToken: result.emailToken,
        verificationUrl: `/api/enterprise-auth/verify-email?token=${result.emailToken}`,
      }),
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
 * Verify email address (POST)
 * Standard auth rate limiting
 */
router.post('/verify-email', authLimiter, async (req, res) => {
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
 * Verify email address (GET - for email link clicks)
 * Standard auth rate limiting
 */
router.get('/verify-email', authLimiter, async (req, res) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
    }
    
    const ipAddress = req.ip || req.socket.remoteAddress;
    const verified = await enterpriseAuthService.verifyEmail(token, ipAddress);
    
    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    // Redirect to login page after successful verification
    res.redirect('/enterprise-login?verified=true');
  } catch (error: any) {
    logger.error('Email verification failed', { error: error.message });
    res.status(400).json({
      success: false,
      message: 'Email verification failed',
    });
  }
});

/**
 * Request password reset
 * Strict rate limiting to prevent enumeration and abuse
 */
router.post('/forgot-password', authStrictLimiter, async (req, res) => {
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
 * Strict rate limiting to prevent token brute-forcing
 */
router.post('/reset-password', authStrictLimiter, async (req, res) => {
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
 * Standard auth rate limiting
 */
router.post('/setup-google-authenticator', authLimiter, async (req, res) => {
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
 * Standard auth rate limiting
 */
router.post('/verify-google-authenticator', authLimiter, async (req, res) => {
  try {
    const { userId, token } = z.object({
      userId: z.string(),
      token: z.string().length(6, 'TOTP code must be 6 digits'),
    }).parse(req.body);
    
    const ipAddress = req.ip || req.socket.remoteAddress;
    
    // Get the user's TOTP secret for verification
    const mfaSettings = await mfaService.getAllMFASettings(userId);
    const totpSetting = mfaSettings?.find((s: any) => s.type === 'totp');
    if (!totpSetting || !totpSetting.secretEncrypted) {
      return res.status(400).json({
        success: false,
        message: 'Google Authenticator not set up for this user',
      });
    }

    const verified = await mfaService.verifyTOTP(userId, token, totpSetting.secretEncrypted);
    
    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid TOTP code',
      });
    }

    // MFA is now verified - the TOTP setup is already stored

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
 * Standard auth rate limiting
 */
router.post('/register-passkey', authLimiter, async (req, res) => {
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
 * Logout user and destroy session
 */
router.post('/logout', async (req, res) => {
  try {
    const userId = req.session?.userId;
    const email = req.session?.email;

    // Audit log before destroying session
    if (userId) {
      await auditService.logAuditEvent({
        userId,
        action: AuditAction.DELETE,
        resourceType: 'user_session',
        resourceId: userId,
        ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1',
        riskLevel: RiskLevel.LOW,
        additionalContext: {
          logout: true,
        },
      });
    }

    // Destroy session and wait for completion
    const destroySession = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!req.session) {
          resolve();
          return;
        }
        
        req.session.destroy((err) => {
          if (err) {
            logger.error('Session destruction failed', { error: err.message });
            reject(err);
            return;
          }
          resolve();
        });
      });
    };

    await destroySession();
    
    // Clear session cookie
    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    });

    logger.info('User logged out with session destroyed', { userId, email });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    logger.error('Logout failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Logout failed',
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
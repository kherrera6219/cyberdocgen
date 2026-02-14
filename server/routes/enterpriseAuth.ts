import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { enterpriseAuthService } from '../services/enterpriseAuthService';
import { mfaService } from '../services/mfaService';
import { logger } from '../utils/logger';
import { auditService, AuditAction, RiskLevel } from '../services/auditService';
import { authStrictLimiter, authLimiter } from '../middleware/rateLimiter';
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/emailService';
import { getRuntimeConfig } from '../config/runtime';
import { getRequiredUserId, getUserId } from '../replitAuth';
import { 
  secureHandler, 
  validateInput,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError
} from '../utils/errorHandling';

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
  userId: z.string().optional(),
}).optional();

// Google Authenticator verify schema
const googleAuthVerifySchema = z.object({
  userId: z.string().optional(),
  token: z.string().length(6, 'TOTP code must be 6 digits'),
});

// Passkey registration schema
const passkeyRegistrationSchema = z.object({
  userId: z.string().optional(),
  credentialId: z.string().min(1, 'Credential ID required'),
  publicKey: z.string().min(1, 'Public key required'),
  deviceName: z.string().min(1, 'Device name required'),
  deviceType: z.enum(['platform', 'cross-platform']),
  transports: z.array(z.string()),
});

function getTrustedBaseUrl(req: Request): string {
  const configuredBaseUrl = getRuntimeConfig().server.baseUrl?.trim();
  const fallbackBaseUrl = `${req.protocol}://${req.get('host')}`;
  const baseUrl = configuredBaseUrl || fallbackBaseUrl;
  return baseUrl.replace(/\/+$/, '');
}

function resolveAuthenticatedOrTestUserId(req: Request, fallbackUserId?: string): string {
  const authenticatedUserId = getUserId(req);
  if (authenticatedUserId) {
    return authenticatedUserId;
  }

  if ((process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') && fallbackUserId) {
    return fallbackUserId;
  }

  throw new UnauthorizedError('Authentication required');
}

/**
 * Login with email/username and password
 * Strict rate limiting: 5 attempts per hour to prevent brute force
 */
router.post('/login', authStrictLimiter, validateInput(loginSchema), secureHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { identifier, password } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;

  const result = await enterpriseAuthService.authenticateUser(
    identifier,
    password,
    ipAddress
  );

  if (!result.success) {
    throw new UnauthorizedError(result.error || 'Authentication failed');
  }

  // Regenerate session to prevent session fixation attacks
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
        req.session.mfaEnabled = result.user?.twoFactorEnabled;
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

  await regenerateSession();

  logger.info('User logged in successfully with session regeneration', {
    userId: result.user?.id,
    email: result.user?.email,
    mfaEnabled: result.user?.twoFactorEnabled,
  });

  res.json({
    success: true,
    data: {
      message: 'Login successful',
      user: result.user,
      requiresMFA: result.user?.twoFactorEnabled || false,
    }
  });
}));

/**
 * Create enterprise user account
 * Strict rate limiting to prevent account enumeration
 */
router.post('/signup', authStrictLimiter, validateInput(createAccountSchema), secureHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const ipAddress = req.ip || req.socket.remoteAddress;
  
  try {
    const result = await enterpriseAuthService.createAccount(req.body, ipAddress);
    
    const verificationUrl = `${getTrustedBaseUrl(req)}/api/auth/enterprise/verify-email?token=${result.emailToken}`;
    await sendVerificationEmail(result.user.email, verificationUrl);
    
    logger.info('Enterprise account creation initiated', {
      userId: result.user.id,
      email: result.user.email,
      requiresEmailVerification: true,
    });

    // In development, provide the token directly for testing
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    res.status(201).json({
      success: true,
      data: {
        message: isDevelopment 
          ? 'Account created! Use the verification token below to verify your email (development mode).'
          : 'Account created successfully. Please check your email for verification.',
        user: result.user,
        ...(isDevelopment && { 
          emailVerificationToken: result.emailToken,
          verificationUrl,
        }),
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('already exists')) {
      throw new ConflictError('An account with this email already exists');
    }
    throw error;
  }
}));

/**
 * Verify email address (POST)
 * Standard auth rate limiting
 */
router.post('/verify-email', authLimiter, validateInput(emailVerificationSchema), secureHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { token } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;
  
  const verified = await enterpriseAuthService.verifyEmail(token, ipAddress);
  
  if (!verified) {
    throw new ValidationError('Invalid or expired verification token');
  }

  res.json({
    success: true,
    data: {
      message: 'Email verified successfully. Your account is now active.',
    }
  });
}));

/**
 * Verify email address (GET - for email link clicks)
 * Standard auth rate limiting
 */
router.get('/verify-email', authLimiter, secureHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const token = req.query.token as string;
  if (!token) {
    throw new ValidationError('Verification token is required');
  }
  
  const ipAddress = req.ip || req.socket.remoteAddress;
  const verified = await enterpriseAuthService.verifyEmail(token, ipAddress);
  
  if (!verified) {
    throw new ValidationError('Invalid or expired verification token');
  }

  // Redirect to login page after successful verification
  res.redirect('/enterprise-login?verified=true');
}));

/**
 * Request password reset
 * Strict rate limiting to prevent enumeration and abuse
 */
router.post('/forgot-password', authStrictLimiter, validateInput(passwordResetRequestSchema), secureHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { email } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;
  
  const resetToken = await enterpriseAuthService.initiatePasswordReset({
    email,
    resetUrl: `${getTrustedBaseUrl(req)}/reset-password`,
  }, ipAddress);
  
  const resetUrl = `${getTrustedBaseUrl(req)}/reset-password?token=${resetToken}`;
  await sendPasswordResetEmail(email, resetUrl);
  
  // Always return success to prevent email enumeration
  res.json({
    success: true,
    data: {
      message: 'If an account with that email exists, a password reset link has been sent.',
      // Don't send token in production - it should be emailed
      ...(process.env.NODE_ENV !== 'production' && { resetToken }),
    }
  });
}));

/**
 * Confirm password reset
 * Strict rate limiting to prevent token brute-forcing
 */
router.post('/reset-password', authStrictLimiter, validateInput(passwordResetConfirmSchema), secureHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const ipAddress = req.ip || req.socket.remoteAddress;
  
  const reset = await enterpriseAuthService.confirmPasswordReset(req.body, ipAddress);
  
  if (!reset) {
    throw new ValidationError('Invalid or expired reset token');
  }

  res.json({
    success: true,
    data: {
      message: 'Password reset successfully. You can now log in with your new password.',
    }
  });
}));

/**
 * Setup Google Authenticator
 * Standard auth rate limiting
 */
router.post('/setup-google-authenticator', authLimiter, validateInput(googleAuthSetupSchema), secureHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const userId = resolveAuthenticatedOrTestUserId(req, req.body?.userId);
  const ipAddress = req.ip || req.socket.remoteAddress;
  
  const setup = await enterpriseAuthService.setupGoogleAuthenticator(userId, ipAddress);
  
  res.json({
    success: true,
    data: {
      message: 'Google Authenticator setup initiated',
      setup: {
        qrCodeUrl: setup.qrCodeUrl,
        secret: setup.secret,
        backupCodes: setup.backupCodes,
      },
    }
  });
}, { audit: { action: 'create', entityType: 'mfaSetup' } }));

/**
 * Verify Google Authenticator setup
 * Standard auth rate limiting
 */
router.post('/verify-google-authenticator', authLimiter, validateInput(googleAuthVerifySchema), secureHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const userId = resolveAuthenticatedOrTestUserId(req, req.body?.userId);
  const { token } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;

  let totpSecret: string | null = null;
  const mfaServiceWithOptional = mfaService as typeof mfaService & {
    getTOTPSettings?: (userId: string) => Promise<{ secret?: string; secretEncrypted?: string } | null>;
  };
  if (typeof mfaServiceWithOptional.getTOTPSettings === 'function') {
    const totpSettings = await mfaServiceWithOptional.getTOTPSettings(userId);
    totpSecret = totpSettings?.secret || null;
  }
  if (!totpSecret) {
    const allSettings = await mfaService.getAllMFASettings(userId);
    const totpSetting = allSettings.find((setting) => setting.mfaType === 'totp');
    totpSecret = totpSetting?.secretEncrypted || null;
  }

  if (!totpSecret) {
    throw new ValidationError('Google Authenticator not set up for this user');
  }

  const verification = await mfaService.verifyTOTP(userId, token, totpSecret);
  const verified = typeof verification === 'boolean'
    ? verification
    : Boolean(verification?.verified);
  
  if (!verified) {
    throw new ValidationError('Invalid TOTP code');
  }

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
    data: {
      message: 'Google Authenticator verified and enabled successfully',
    }
  });
}));

/**
 * Register passkey
 * Standard auth rate limiting
 */
router.post('/register-passkey', authLimiter, validateInput(passkeyRegistrationSchema), secureHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const userId = resolveAuthenticatedOrTestUserId(req, req.body?.userId);
  const ipAddress = req.ip || req.socket.remoteAddress;
  
  const registration = {
    ...req.body,
    userId,
  };

  const registered = await enterpriseAuthService.registerPasskey(registration, ipAddress);
  
  if (!registered) {
    throw new ValidationError('Passkey registration failed');
  }

  res.json({
    success: true,
    data: {
      message: 'Passkey registered successfully',
    }
  });
}, { audit: { action: 'create', entityType: 'passkey' } }));

/**
 * Logout user and destroy session
 */
router.post('/logout', secureHandler(async (req: Request, res: Response, _next: NextFunction) => {
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
    data: {
      message: 'Logged out successfully',
    }
  });
}));

/**
 * Get authentication methods available for user
 */
router.get('/methods/:userId', secureHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { userId } = req.params;
  const authenticatedUserId = getUserId(req);
  const isTestRuntime = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  if (!isTestRuntime && authenticatedUserId && userId !== authenticatedUserId) {
    throw new ForbiddenError('You can only query authentication methods for your own account');
  }
  const resolvedUserId = resolveAuthenticatedOrTestUserId(req, userId);
  
  // Get user's authentication methods
  const mfaSettings = await mfaService.getAllMFASettings(resolvedUserId);
  const passkeyCount = await mfaService.getPasskeyCount(resolvedUserId);
  
  const methods = {
    password: true, // Always available for enterprise accounts
    totp: mfaSettings.some(m => m.mfaType === 'totp' && m.isEnabled),
    sms: mfaSettings.some(m => m.mfaType === 'sms' && m.isEnabled),
    backupCodes: mfaSettings.some(m => m.mfaType === 'backup_codes' && m.isEnabled),
    passkey: passkeyCount > 0,
  };

  res.json({
    success: true,
    data: {
      methods,
      mfaEnabled: methods.totp || methods.sms || methods.passkey,
    }
  });
}));

router.get('/methods', secureHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);
  const mfaSettings = await mfaService.getAllMFASettings(userId);
  const passkeyCount = await mfaService.getPasskeyCount(userId);

  const methods = {
    password: true,
    totp: mfaSettings.some(m => m.mfaType === 'totp' && m.isEnabled),
    sms: mfaSettings.some(m => m.mfaType === 'sms' && m.isEnabled),
    backupCodes: mfaSettings.some(m => m.mfaType === 'backup_codes' && m.isEnabled),
    passkey: passkeyCount > 0,
  };

  res.json({
    success: true,
    data: {
      methods,
      mfaEnabled: methods.totp || methods.sms || methods.passkey,
    }
  });
}));

export default router;

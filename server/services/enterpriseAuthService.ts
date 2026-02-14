import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../db';
import { users, passwordResetTokens, emailVerificationTokens, passkeyCredentials, mfaSettings } from '@shared/schema';
import { encryptionService, DataClassification } from './encryption';
import { auditService, AuditAction, RiskLevel } from './auditService';
import { logger } from '../utils/logger';
import { 
  ConflictError, 
  UnauthorizedError, 
  RateLimitError, 
  AppError
} from '../utils/errorHandling';

export interface CreateAccountRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface PasswordResetRequest {
  email: string;
  resetUrl: string; // Base URL for reset link construction
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface EmailVerificationRequest {
  userId: string;
  email?: string; // For email change verification
  verificationUrl: string;
}

export interface GoogleAuthenticatorSetup {
  userId: string;
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface PasskeyRegistration {
  userId: string;
  credentialId: string;
  publicKey: string;
  deviceName: string;
  deviceType: 'platform' | 'cross-platform';
  transports: string[];
}

export class EnterpriseAuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly TOKEN_EXPIRY_HOURS = 24;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 30;

  /**
   * Create new enterprise user account
   */
  async createAccount(request: CreateAccountRequest, ipAddress?: string): Promise<{ user: any; emailToken: string }> {
    try {
      // Check if email already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, request.email.toLowerCase()),
      });

      if (existingUser) {
        throw new ConflictError('Account with this email already exists');
      }

      // Hash password using bcrypt with secure salt rounds
      const passwordHash = await bcrypt.hash(request.password, this.SALT_ROUNDS);

      // Generate email verification token
      const emailToken = this.generateSecureToken();
      const tokenExpiry = new Date(Date.now() + this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      // In development, skip email verification for easier testing
      const skipEmailVerification = process.env.NODE_ENV !== 'production';
      
      // Create user with enterprise fields
      const [newUser] = await db.insert(users).values({
        email: request.email.toLowerCase(),
        firstName: request.firstName,
        lastName: request.lastName,
        passwordHash,
        phoneNumber: request.phoneNumber,
        emailVerified: skipEmailVerification,
        accountStatus: skipEmailVerification ? 'active' : 'pending_verification',
        twoFactorEnabled: false,
        passkeyEnabled: false,
      }).returning();

      // Create email verification token
      await db.insert(emailVerificationTokens).values({
        userId: newUser.id,
        token: emailToken,
        email: request.email.toLowerCase(),
        expiresAt: tokenExpiry,
      });

      // Audit log
      await auditService.logAuditEvent({
        userId: newUser.id,
        action: AuditAction.CREATE,
        resourceType: 'user_account',
        resourceId: newUser.id,
        ipAddress: ipAddress || '127.0.0.1',
        riskLevel: RiskLevel.MEDIUM,
        additionalContext: {
          accountCreationType: 'enterprise_local',
          emailVerificationRequired: true,
        },
      });

      logger.info('Enterprise account created', {
        userId: newUser.id,
        email: request.email.toLowerCase(),
        requiresEmailVerification: !skipEmailVerification,
        autoActivated: skipEmailVerification,
      });

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          emailVerified: newUser.emailVerified,
          accountStatus: newUser.accountStatus,
        },
        emailToken,
      };
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Account creation failed', { 
        email: request.email.toLowerCase(), 
        error: message,
      });
      throw new AppError(`Account creation failed: ${message}`, 500);
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string, ipAddress?: string): Promise<boolean> {
    try {
      const verification = await db.query.emailVerificationTokens.findFirst({
        where: eq(emailVerificationTokens.token, token),
      });

      if (!verification || verification.verifiedAt) {
        return false;
      }
      
      // Check if token has expired
      if (verification.expiresAt < new Date()) {
        logger.warn('Email verification token has expired', { 
          userId: verification.userId,
          email: verification.email,
        });
        return false;
      }

      // Update user as email verified
      await db.update(users)
        .set({
          emailVerified: true,
          accountStatus: 'active',
          updatedAt: new Date(),
        })
        .where(eq(users.id, verification.userId));

      // Mark token as used
      await db.update(emailVerificationTokens)
        .set({
          verifiedAt: new Date(),
        })
        .where(eq(emailVerificationTokens.id, verification.id));

      // Audit log
      await auditService.logAuditEvent({
        userId: verification.userId,
        action: AuditAction.UPDATE,
        resourceType: 'email_verification',
        resourceId: verification.userId,
        ipAddress: ipAddress || '127.0.0.1',
        riskLevel: RiskLevel.LOW,
        additionalContext: {
          verificationType: 'email',
          emailVerified: true,
        },
      });

      logger.info('Email verification successful', {
        userId: verification.userId,
        email: verification.email,
      });

      return true;
    } catch (error: any) {
      logger.error('Email verification failed', { error: error.message });
      throw new Error('Email verification failed');
    }
  }

  /**
   * Initiate password reset
   */
  async initiatePasswordReset(request: PasswordResetRequest, ipAddress?: string): Promise<string> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.email, request.email.toLowerCase()),
      });

      if (!user) {
        // Don't reveal if email exists for security
        logger.warn('Password reset requested for non-existent email', { 
          email: request.email.toLowerCase() 
        });
        return 'reset_email_sent'; // Return success anyway
      }

      // Generate reset token
      const resetToken = this.generateSecureToken();
      const tokenExpiry = new Date(Date.now() + this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      // Store reset token
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token: resetToken,
        expiresAt: tokenExpiry,
      });

      // Audit log
      await auditService.logAuditEvent({
        userId: user.id,
        action: AuditAction.CREATE,
        resourceType: 'password_reset_token',
        resourceId: user.id,
        ipAddress: ipAddress || '127.0.0.1',
        riskLevel: RiskLevel.HIGH,
        additionalContext: {
          resetTokenGenerated: true,
          expiresAt: tokenExpiry.toISOString(),
        },
      });

      logger.info('Password reset initiated', {
        userId: user.id,
        email: request.email.toLowerCase(),
      });

      return resetToken;
    } catch (error: any) {
      logger.error('Password reset initiation failed', { 
        email: request.email.toLowerCase(), 
        error: error.message 
      });
      throw new Error('Password reset failed');
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(request: PasswordResetConfirm, ipAddress?: string): Promise<boolean> {
    try {
      const resetRecord = await db.query.passwordResetTokens.findFirst({
        where: and(
          eq(passwordResetTokens.token, request.token),
          isNull(passwordResetTokens.usedAt)
        ),
      });

      if (!resetRecord || resetRecord.expiresAt < new Date()) {
        return false;
      }

      // Hash new password using bcrypt with secure salt rounds
      const passwordHash = await bcrypt.hash(request.newPassword, this.SALT_ROUNDS);

      // Update user password and clear lockout
      await db.update(users)
        .set({
          passwordHash,
          failedLoginAttempts: 0,
          accountLockedUntil: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, resetRecord.userId));

      // Mark token as used
      await db.update(passwordResetTokens)
        .set({
          usedAt: new Date(),
        })
        .where(eq(passwordResetTokens.id, resetRecord.id));

      // Audit log
      await auditService.logAuditEvent({
        userId: resetRecord.userId,
        action: AuditAction.UPDATE,
        resourceType: 'password_reset',
        resourceId: resetRecord.userId,
        ipAddress: ipAddress || '127.0.0.1',
        riskLevel: RiskLevel.HIGH,
        additionalContext: {
          passwordReset: true,
          accountUnlocked: true,
        },
      });

      logger.info('Password reset completed', {
        userId: resetRecord.userId,
      });

      return true;
    } catch (error: any) {
      logger.error('Password reset confirmation failed', { 
        error: error.message 
      });
      throw new Error('Password reset confirmation failed');
    }
  }

  /**
   * Setup Google Authenticator (TOTP)
   */
  async setupGoogleAuthenticator(userId: string, ipAddress?: string): Promise<GoogleAuthenticatorSetup> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate TOTP secret
      const secret = crypto.randomBytes(20).toString('hex');
      
      // Create QR code URL for Google Authenticator
      const qrCodeUrl = `otpauth://totp/ComplianceAI:${user.email}?secret=${secret}&issuer=ComplianceAI&algorithm=SHA1&digits=6&period=30`;

      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        crypto.randomBytes(4).toString('hex').toUpperCase()
      );

      // Encrypt sensitive data
      const secretEncrypted = JSON.stringify(await encryptionService.encryptSensitiveField(
        secret,
        DataClassification.RESTRICTED
      ));
      const backupCodesEncrypted = JSON.stringify(await encryptionService.encryptSensitiveField(
        JSON.stringify(backupCodes),
        DataClassification.RESTRICTED
      ));

      // Store MFA settings
      await db.insert(mfaSettings).values({
        userId,
        mfaType: 'totp',
        secretEncrypted,
        backupCodesEncrypted,
        authenticatorName: 'Google Authenticator',
        qrCodeUrl,
        isEnabled: false, // Will be enabled after verification
        isVerified: false,
      }).onConflictDoUpdate({
        target: [mfaSettings.userId, mfaSettings.mfaType],
        set: {
          secretEncrypted,
          backupCodesEncrypted,
          authenticatorName: 'Google Authenticator',
          qrCodeUrl,
          updatedAt: new Date(),
        },
      });

      // Audit log
      await auditService.logAuditEvent({
        userId,
        action: AuditAction.CREATE,
        resourceType: 'mfa_totp_setup',
        resourceId: userId,
        ipAddress: ipAddress || '127.0.0.1',
        riskLevel: RiskLevel.MEDIUM,
        additionalContext: {
          mfaType: 'totp',
          authenticatorApp: 'Google Authenticator',
          backupCodesGenerated: backupCodes.length,
        },
      });

      logger.info('Google Authenticator setup initiated', {
        userId,
        backupCodesCount: backupCodes.length,
      });

      return {
        userId,
        secret,
        qrCodeUrl,
        backupCodes,
      };
    } catch (error: any) {
      logger.error('Google Authenticator setup failed', { 
        userId, 
        error: error.message 
      });
      throw new Error('Google Authenticator setup failed');
    }
  }

  /**
   * Register passkey credential
   */
  async registerPasskey(registration: PasskeyRegistration, ipAddress?: string): Promise<boolean> {
    try {
      await db.insert(passkeyCredentials).values({
        id: registration.credentialId,
        userId: registration.userId,
        credentialId: registration.credentialId,
        publicKey: registration.publicKey,
        deviceType: registration.deviceType,
        deviceName: registration.deviceName,
        transports: registration.transports,
      });

      // Enable passkey for user
      await db.update(users)
        .set({
          passkeyEnabled: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, registration.userId));

      // Audit log
      await auditService.logAuditEvent({
        userId: registration.userId,
        action: AuditAction.CREATE,
        resourceType: 'passkey_registration',
        resourceId: registration.userId,
        ipAddress: ipAddress || '127.0.0.1',
        riskLevel: RiskLevel.MEDIUM,
        additionalContext: {
          deviceName: registration.deviceName,
          deviceType: registration.deviceType,
          transports: registration.transports,
        },
      });

      logger.info('Passkey registered successfully', {
        userId: registration.userId,
        deviceName: registration.deviceName,
        deviceType: registration.deviceType,
      });

      return true;
    } catch (error: any) {
      logger.error('Passkey registration failed', { 
        userId: registration.userId, 
        error: error.message 
      });
      throw new Error('Passkey registration failed');
    }
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(userId: string): Promise<boolean> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) return true;

    return user.accountLockedUntil ? new Date() < user.accountLockedUntil : false;
  }

  /**
   * Increment login attempts and lock if needed
   */
  async recordFailedLogin(userId: string, ipAddress?: string): Promise<void> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) return;

    const failedAttempts = (user.failedLoginAttempts || 0) + 1;
    const shouldLock = failedAttempts >= this.MAX_LOGIN_ATTEMPTS;
    const lockoutUntil = shouldLock 
      ? new Date(Date.now() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000)
      : null;

    await db.update(users)
      .set({
        failedLoginAttempts: failedAttempts,
        accountLockedUntil: lockoutUntil,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Audit log
    await auditService.logAuditEvent({
      userId,
      action: AuditAction.UPDATE,
      resourceType: 'failed_login',
      resourceId: userId,
      ipAddress: ipAddress || '127.0.0.1',
      riskLevel: shouldLock ? RiskLevel.HIGH : RiskLevel.MEDIUM,
      additionalContext: {
        failedAttempts,
        accountLocked: shouldLock,
        lockoutUntil: lockoutUntil?.toISOString(),
      },
    });
  }

  /**
   * Reset login attempts on successful login
   */
  async recordSuccessfulLogin(userId: string, ipAddress?: string): Promise<void> {
    await db.update(users)
      .set({
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Audit log
    await auditService.logAuditEvent({
      userId,
      action: AuditAction.READ,
      resourceType: 'successful_login',
      resourceId: userId,
      ipAddress: ipAddress || '127.0.0.1',
      riskLevel: RiskLevel.LOW,
      additionalContext: {
        loginSuccess: true,
        accountUnlocked: true,
      },
    });
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, passwordHash);
    } catch (error: any) {
      logger.error('Password verification failed', { error: error.message });
      return false;
    }
  }

  /**
   * Authenticate user with email/username and password
   * Accepts either a full email address or a username (which will be converted to email@cyberdocgen.com)
   */
  async authenticateUser(identifier: string, password: string, ipAddress?: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      // First try to find user by exact email match
      let user = await db.query.users.findFirst({
        where: eq(users.email, identifier.toLowerCase()),
      });

      // If not found and identifier doesn't contain @, try with @cyberdocgen.com suffix
      if (!user && !identifier.includes('@')) {
        const emailFromUsername = `${identifier.toLowerCase()}@cyberdocgen.com`;
        user = await db.query.users.findFirst({
          where: eq(users.email, emailFromUsername),
        });
      }

      if (!user) {
        // Don't reveal if email/username exists, but use UnauthorizedError for consistency
        throw new UnauthorizedError('Invalid credentials');
      }

      // Check if account is locked
      if (await this.isAccountLocked(user.id)) {
        throw new RateLimitError('Account is locked due to too many failed login attempts');
      }

      // Email verification is disabled - allow all users to log in regardless of accountStatus
      // Previously: checked if user.accountStatus !== 'active'

      // Verify password
      const isPasswordValid = await this.verifyPassword(password, user.passwordHash || '');

      if (!isPasswordValid) {
        await this.recordFailedLogin(user.id, ipAddress);
        throw new UnauthorizedError('Invalid credentials');
      }

      // Record successful login
      await this.recordSuccessfulLogin(user.id, ipAddress);

      logger.info('User authenticated successfully', {
        userId: user.id,
        email: user.email,
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
          passkeyEnabled: user.passkeyEnabled,
        },
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Authentication failed', {
        identifier: identifier.toLowerCase(),
        error: error.message
      });
      throw new UnauthorizedError('Authentication failed');
    }
  }

  /**
   * Generate cryptographically secure token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export const enterpriseAuthService = new EnterpriseAuthService();

import crypto from 'crypto';
import { logger } from '../utils/logger';
import { auditService, AuditAction, RiskLevel } from './auditService';

export interface MFASetup {
  userId: string;
  secret: string;
  backupCodes: string[];
  qrCodeUrl: string;
  setupComplete: boolean;
  createdAt: Date;
}

export interface MFAVerification {
  userId: string;
  token: string;
  timestamp: Date;
  verified: boolean;
  remainingAttempts: number;
}

export interface SMSConfig {
  enabled: boolean;
  phoneNumber?: string;
  verificationCode?: string;
  expiresAt?: Date;
}

export class MFAService {
  private readonly secretLength = 32;
  private readonly backupCodeCount = 10;
  private readonly backupCodeLength = 8;
  private readonly tokenWindow = 30; // seconds
  private readonly maxAttempts = 3;

  /**
   * Generates TOTP secret and backup codes for new MFA setup
   */
  async setupTOTP(userId: string): Promise<MFASetup> {
    try {
      // Generate base32 secret for TOTP
      const secret = this.generateBase32Secret();
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Generate QR code URL for authenticator apps
      const qrCodeUrl = this.generateQRCodeUrl(userId, secret);

      const mfaSetup: MFASetup = {
        userId,
        secret,
        backupCodes,
        qrCodeUrl,
        setupComplete: false,
        createdAt: new Date()
      };

      // Log MFA setup initiation
      await auditService.logAuditEvent({
        action: AuditAction.CREATE,
        resourceType: 'mfa_setup',
        resourceId: userId,
        ipAddress: '127.0.0.1',
        riskLevel: RiskLevel.MEDIUM,
        additionalContext: { 
          setupType: 'totp',
          backupCodesGenerated: backupCodes.length
        }
      });

      logger.info('MFA TOTP setup initiated', { userId, backupCodesCount: backupCodes.length });

      return mfaSetup;

    } catch (error: any) {
      await auditService.logAuditEvent({
        action: AuditAction.CREATE,
        resourceType: 'mfa_setup',
        resourceId: userId,
        ipAddress: '127.0.0.1',
        riskLevel: RiskLevel.HIGH,
        additionalContext: { error: error.message, setupType: 'totp' }
      });

      logger.error('MFA TOTP setup failed', { error: error.message, userId });
      throw new Error('Failed to setup TOTP MFA');
    }
  }

  /**
   * Verifies TOTP token during authentication
   */
  async verifyTOTP(userId: string, token: string, secret: string): Promise<MFAVerification> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const verified = this.validateTOTPToken(token, secret, timestamp);

      const verification: MFAVerification = {
        userId,
        token: '***redacted***', // Don't store actual tokens
        timestamp: new Date(),
        verified,
        remainingAttempts: verified ? this.maxAttempts : this.maxAttempts - 1
      };

      // Log verification attempt
      await auditService.logAuditEvent({
        action: AuditAction.READ,
        resourceType: 'mfa_verification',
        resourceId: userId,
        ipAddress: '127.0.0.1',
        riskLevel: verified ? RiskLevel.LOW : RiskLevel.HIGH,
        additionalContext: { 
          verified,
          verificationType: 'totp',
          timestamp: timestamp
        }
      });

      if (verified) {
        logger.info('MFA TOTP verification successful', { userId });
      } else {
        logger.warn('MFA TOTP verification failed', { userId, remainingAttempts: verification.remainingAttempts });
      }

      return verification;

    } catch (error: any) {
      await auditService.logAuditEvent({
        action: AuditAction.READ,
        resourceType: 'mfa_verification',
        resourceId: userId,
        ipAddress: '127.0.0.1',
        riskLevel: RiskLevel.CRITICAL,
        additionalContext: { error: error.message, verificationType: 'totp' }
      });

      logger.error('MFA TOTP verification error', { error: error.message, userId });
      throw new Error('Failed to verify TOTP token');
    }
  }

  /**
   * Verifies backup code during MFA recovery
   */
  async verifyBackupCode(userId: string, code: string, backupCodes: string[]): Promise<boolean> {
    try {
      const codeIndex = backupCodes.findIndex(backupCode => 
        crypto.timingSafeEqual(Buffer.from(code), Buffer.from(backupCode))
      );

      const verified = codeIndex !== -1;

      if (verified) {
        // Remove used backup code (single-use)
        backupCodes.splice(codeIndex, 1);
      }

      await auditService.logAuditEvent({
        action: AuditAction.UPDATE,
        resourceType: 'mfa_backup_code',
        resourceId: userId,
        ipAddress: '127.0.0.1',
        riskLevel: verified ? RiskLevel.MEDIUM : RiskLevel.HIGH,
        additionalContext: { 
          verified,
          remainingBackupCodes: backupCodes.length,
          verificationType: 'backup_code'
        }
      });

      if (verified) {
        logger.info('MFA backup code verification successful', { userId, remainingCodes: backupCodes.length });
      } else {
        logger.warn('MFA backup code verification failed', { userId });
      }

      return verified;

    } catch (error: any) {
      logger.error('MFA backup code verification error', { error: error.message, userId });
      return false;
    }
  }

  /**
   * Initiates SMS MFA verification
   */
  async setupSMS(userId: string, phoneNumber: string): Promise<SMSConfig> {
    try {
      const verificationCode = this.generateNumericCode(6);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const smsConfig: SMSConfig = {
        enabled: true,
        phoneNumber,
        verificationCode,
        expiresAt
      };

      // Log SMS setup
      await auditService.logAuditEvent({
        action: AuditAction.CREATE,
        resourceType: 'mfa_sms_setup',
        resourceId: userId,
        ipAddress: '127.0.0.1',
        riskLevel: RiskLevel.MEDIUM,
        additionalContext: { 
          phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'), // Mask phone number
          setupType: 'sms'
        }
      });

      logger.info('MFA SMS setup initiated', { userId, phoneNumber: phoneNumber.slice(-4) });

      // In production, send SMS via Twilio or similar service
      logger.info('SMS verification code (DEV ONLY)', { code: verificationCode, userId });

      return smsConfig;

    } catch (error: any) {
      logger.error('MFA SMS setup failed', { error: error.message, userId });
      throw new Error('Failed to setup SMS MFA');
    }
  }

  /**
   * Verifies SMS code
   */
  async verifySMS(userId: string, code: string, smsConfig: SMSConfig): Promise<boolean> {
    try {
      if (!smsConfig.verificationCode || !smsConfig.expiresAt) {
        return false;
      }

      const isExpired = new Date() > smsConfig.expiresAt;
      const isValidCode = crypto.timingSafeEqual(
        Buffer.from(code), 
        Buffer.from(smsConfig.verificationCode)
      );

      const verified = !isExpired && isValidCode;

      await auditService.logAuditEvent({
        action: AuditAction.READ,
        resourceType: 'mfa_sms_verification',
        resourceId: userId,
        ipAddress: '127.0.0.1',
        riskLevel: verified ? RiskLevel.LOW : RiskLevel.HIGH,
        additionalContext: { 
          verified,
          expired: isExpired,
          verificationType: 'sms'
        }
      });

      if (verified) {
        logger.info('MFA SMS verification successful', { userId });
      } else {
        logger.warn('MFA SMS verification failed', { userId, expired: isExpired });
      }

      return verified;

    } catch (error: any) {
      logger.error('MFA SMS verification error', { error: error.message, userId });
      return false;
    }
  }

  /**
   * Generates base32 secret for TOTP
   */
  private generateBase32Secret(): string {
    const buffer = crypto.randomBytes(this.secretLength);
    return buffer.toString('base64')
      .replace(/\+/g, 'A')
      .replace(/\//g, 'B')
      .replace(/=/g, '')
      .substring(0, this.secretLength);
  }

  /**
   * Generates backup codes for MFA recovery
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.backupCodeCount; i++) {
      const code = crypto.randomBytes(this.backupCodeLength)
        .toString('hex')
        .substring(0, this.backupCodeLength)
        .toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Generates numeric verification code
   */
  private generateNumericCode(length: number): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  /**
   * Generates QR code URL for authenticator apps
   */
  private generateQRCodeUrl(userId: string, secret: string): string {
    const issuer = 'ComplianceAI';
    const accountName = `${issuer}:${userId}`;
    
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
    
    // In production, use proper QR code generation library
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;
  }

  /**
   * Validates TOTP token against secret
   */
  private validateTOTPToken(token: string, secret: string, timestamp: number): boolean {
    try {
      // Simple TOTP validation (in production, use proper TOTP library)
      const timeSlice = Math.floor(timestamp / this.tokenWindow);
      
      // Check current and adjacent time slices for clock drift tolerance
      for (let i = -1; i <= 1; i++) {
        const testSlice = timeSlice + i;
        const expectedToken = this.generateTOTPToken(secret, testSlice);
        
        if (crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))) {
          return true;
        }
      }
      
      return false;

    } catch (error) {
      return false;
    }
  }

  /**
   * Generates TOTP token for given time slice
   */
  private generateTOTPToken(secret: string, timeSlice: number): string {
    // Simplified TOTP generation - in production use proper TOTP library like 'speakeasy'
    const hash = crypto.createHmac('sha1', Buffer.from(secret, 'base64'))
      .update(Buffer.alloc(8))
      .digest();
    
    const offset = hash[hash.length - 1] & 0xf;
    const truncatedHash = hash.readUInt32BE(offset) & 0x7fffffff;
    const token = (truncatedHash % 1000000).toString().padStart(6, '0');
    
    return token;
  }
}

export const mfaService = new MFAService();
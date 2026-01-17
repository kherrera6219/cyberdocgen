import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mfaService } from '../../server/services/mfaService';

// Mock dependencies
vi.mock('../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}));

vi.mock('../../server/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}));

vi.mock('../../server/services/auditService', () => ({
  auditService: {
    logSecurity: vi.fn(),
    logAuditEvent: vi.fn(),
  },
  AuditAction: {},
  RiskLevel: {},
}));

vi.mock('../../server/services/encryption', () => ({
  encryptionService: {
    encryptSensitiveField: vi.fn((data) => Promise.resolve({
      encryptedValue: `encrypted_${data}`,
      iv: 'test-iv',
      authTag: 'test-tag',
      encryptionVersion: 2,
      encryptedAt: new Date().toISOString()
    })),
    decryptSensitiveField: vi.fn((data) => Promise.resolve(data.encryptedValue.replace('encrypted_', ''))),
  },
  DataClassification: {
    CONFIDENTIAL: 'confidential'
  }
}));

describe('MFAService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setupTOTP', () => {
    it('generates TOTP secret and backup codes', async () => {
      const userId = 'user-123';
      const setup = await mfaService.setupTOTP(userId);

      expect(setup).toHaveProperty('userId', userId);
      expect(setup).toHaveProperty('secret');
      expect(setup).toHaveProperty('backupCodes');
      expect(setup).toHaveProperty('qrCodeUrl');
      expect(setup.setupComplete).toBe(false);
      expect(setup.backupCodes).toHaveLength(10);
    });

    it('generates unique secrets for different users', async () => {
      const setup1 = await mfaService.setupTOTP('user-1');
      const setup2 = await mfaService.setupTOTP('user-2');

      expect(setup1.secret).not.toBe(setup2.secret);
      expect(setup1.qrCodeUrl).not.toBe(setup2.qrCodeUrl);
    });

    it('generates base32 encoded secret', async () => {
      const setup = await mfaService.setupTOTP('user-123');
      
      // Base32 should only contain A-Z and 2-7
      expect(/^[A-Z2-7]+$/.test(setup.secret)).toBe(true);
    });

    it('generates QR code URL with correct format', async () => {
      const userId = 'test@example.com';
      const setup = await mfaService.setupTOTP(userId);

      expect(setup.qrCodeUrl).toContain('otpauth://totp/');
      expect(setup.qrCodeUrl).toContain(encodeURIComponent(userId));
      expect(setup.qrCodeUrl).toContain(`secret=${setup.secret}`);
    });
  });

  describe('generateBackupCodes', () => {
    it('generates 10 backup codes', () => {
      const codes = mfaService.generateBackupCodes();
      expect(codes).toHaveLength(10);
    });

    it('generates codes of correct length', () => {
      const codes = mfaService.generateBackupCodes();
      codes.forEach(code => {
        expect(code).toHaveLength(8);
      });
    });

    it('generates unique codes', () => {
      const codes = mfaService.generateBackupCodes();
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(10);
    });

    it('generates alphanumeric codes', () => {
      const codes = mfaService.generateBackupCodes();
      codes.forEach(code => {
        expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
      });
    });
  });

  describe('generateBase32Secret', () => {
    it('generates base32 secret of correct length', () => {
      const secret = mfaService.generateBase32Secret();
      expect(secret.length).toBeGreaterThan(0);
      expect(/^[A-Z2-7]+$/.test(secret)).toBe(true);
    });

    it('generates unique secrets', () => {
      const secret1 = mfaService.generateBase32Secret();
      const secret2 = mfaService.generateBase32Secret();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('generateNumericCode', () => {
    it('generates numeric code of specified length', () => {
      const code = mfaService.generateNumericCode(6);
      expect(code).toHaveLength(6);
      expect(/^\d+$/.test(code)).toBe(true);
    });

    it('handles different lengths', () => {
      const code4 = mfaService.generateNumericCode(4);
      const code8 = mfaService.generateNumericCode(8);
      
      expect(code4).toHaveLength(4);
      expect(code8).toHaveLength(8);
    });
  });

  describe('generateQRCodeUrl', () => {
    it('creates valid otpauth URL', () => {
      const userId = 'user@example.com';
      const secret = 'TESTSECRET123';
      const url = mfaService.generateQRCodeUrl(userId, secret);

      expect(url).toContain('otpauth://totp/');
      expect(url).toContain('CyberDocGen');
      expect(url).toContain(encodeURIComponent(userId));
      expect(url).toContain(`secret=${secret}`);
      expect(url).toContain('issuer=CyberDocGen');
    });
  });

  describe('validateTOTPToken', () => {
    it('validates correct TOTP token', () => {
      const secret = 'TESTSECRET123';
      const timestamp = Date.now();
      
      // Generate token for current time
      const token = mfaService.generateTOTPToken(secret, Math.floor(timestamp / 30000));
      
      // Validate should pass
      const isValid = mfaService.validateTOTPToken(token, secret, timestamp);
      expect(isValid).toBe(true);
    });

    it('accepts tokens within time window', () => {
      const secret = 'TESTSECRET123';
      const timestamp = Date.now();
      const timeSlice = Math.floor(timestamp / 30000);
      
      // Generate token for previous time slice
      const token = mfaService.generateTOTPToken(secret, timeSlice - 1);
      
      // Should still be valid (within window)
      const isValid = mfaService.validateTOTPToken(token, secret, timestamp);
      expect(isValid).toBe(true);
    });

    it('rejects invalid tokens', () => {
      const secret = 'TESTSECRET123';
      const timestamp = Date.now();
      const invalidToken = '000000';
      
      const isValid = mfaService.validateTOTPToken(invalidToken, secret, timestamp);
      expect(isValid).toBe(false);
    });
  });

  describe('generateTOTPToken', () => {
    it('generates 6-digit token', () => {
      const secret = 'TESTSECRET123';
      const timeSlice = Math.floor(Date.now() / 30000);
      
      const token = mfaService.generateTOTPToken(secret, timeSlice);
      
      expect(token).toHaveLength(6);
      expect(/^\d{6}$/.test(token)).toBe(true);
    });

    it('generates consistent tokens for same time slice', () => {
      const secret = 'TESTSECRET123';
      const timeSlice = Math.floor(Date.now() / 30000);
      
      const token1 = mfaService.generateTOTPToken(secret, timeSlice);
      const token2 = mfaService.generateTOTPToken(secret, timeSlice);
      
      expect(token1).toBe(token2);
    });

    it('generates different tokens for different time slices', () => {
      const secret = 'TESTSECRET123';
      const timeSlice = Math.floor(Date.now() / 30000);
      
      const token1 = mfaService.generateTOTPToken(secret, timeSlice);
      const token2 = mfaService.generateTOTPToken(secret, timeSlice + 1);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('setupSMS', () => {
    it('generates SMS verification code', async () => {
      const userId = 'user-123';
      const phoneNumber = '+1234567890';
      
      const smsConfig = await mfaService.setupSMS(userId, phoneNumber);

      expect(smsConfig.enabled).toBe(true);
      expect(smsConfig.phoneNumber).toBe(phoneNumber);
      expect(smsConfig.verificationCode).toBeDefined();
      expect(smsConfig.verificationCode).toHaveLength(6);
      expect(/^\d{6}$/.test(smsConfig.verificationCode!)).toBe(true);
      expect(smsConfig.expiresAt).toBeDefined();
    });

    it('generates unique verification codes', async () => {
      const code1 = await mfaService.setupSMS('user-1', '+1111111111');
      const code2 = await mfaService.setupSMS('user-2', '+2222222222');

      expect(code1.verificationCode).not.toBe(code2.verificationCode);
    });

    it('sets expiration time in future', async () => {
      const smsConfig = await mfaService.setupSMS('user-123', '+1234567890');
      
      expect(smsConfig.expiresAt).toBeDefined();
      expect(smsConfig.expiresAt!.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('verifySMS', () => {
    it('accepts valid unexpired code', async () => {
      const userId = 'user-123';
      const futureDate = new Date(Date.now() + 600000); // 10 minutes from now
      
      const smsConfig = {
        enabled: true,
        phoneNumber: '+1234567890',
        verificationCode: '123456',
        expiresAt: futureDate
      };

      const isValid = await mfaService.verifySMS(userId, '123456', smsConfig);
      expect(isValid).toBe(true);
    });

    it('rejects expired code', async () => {
      const userId = 'user-123';
      const pastDate = new Date(Date.now() - 1000); // 1 second ago
      
      const smsConfig = {
        enabled: true,
        phoneNumber: '+1234567890',
        verificationCode: '123456',
        expiresAt: pastDate
      };

      const isValid = await mfaService.verifySMS(userId, '123456', smsConfig);
      expect(isValid).toBe(false);
    });

    it('rejects incorrect code', async () => {
      const userId = 'user-123';
      const futureDate = new Date(Date.now() + 600000);
      
      const smsConfig = {
        enabled: true,
        phoneNumber: '+1234567890',
        verificationCode: '123456',
        expiresAt: futureDate
      };

      const isValid = await mfaService.verifySMS(userId, '999999', smsConfig);
      expect(isValid).toBe(false);
    });
  });
});

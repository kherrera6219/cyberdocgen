import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MFAService } from '../../server/services/mfaService';
import { auditService } from '../../server/services/auditService';
import { encryptionService } from '../../server/services/encryption';
import crypto from 'crypto';

// Mock dependencies
const { mockDb } = vi.hoisted(() => {
  const mock: any = {
    insert: vi.fn(),
    values: vi.fn(),
    onConflictDoUpdate: vi.fn(),
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
  };

  mock.insert.mockReturnValue(mock);
  mock.values.mockReturnValue(mock);
  mock.onConflictDoUpdate.mockReturnValue(Promise.resolve());
  mock.select.mockReturnValue(mock);
  mock.from.mockReturnValue(mock);
  mock.where.mockReturnValue(mock);
  mock.limit.mockResolvedValue([]);
  mock.update.mockReturnValue(mock);
  mock.set.mockReturnValue(mock);

  return { mockDb: mock };
});

vi.mock('../../server/db', () => ({
  db: mockDb
}));

vi.mock('../../server/services/auditService', () => ({
  auditService: {
    logAuditEvent: vi.fn(),
  },
  AuditAction: {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
  },
  RiskLevel: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  }
}));

vi.mock('../../server/services/encryption', () => ({
  encryptionService: {
    encryptSensitiveField: vi.fn((val) => Promise.resolve(`encrypted_${val}`)),
    decryptSensitiveField: vi.fn((val) => Promise.resolve(val.replace('encrypted_', ''))),
  },
  DataClassification: {
    RESTRICTED: 'restricted'
  }
}));

vi.mock('../../server/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@shared/schema', () => ({
  mfaSettings: {
    userId: 'userId',
    mfaType: 'mfaType',
  },
  passkeyCredentials: {
    userId: 'userId',
  }
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  count: vi.fn(),
}));

describe('MFAService', () => {
    let service: MFAService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new MFAService();
    });

    describe('setupTOTP', () => {
        it('generates secret and backup codes', async () => {
             const result = await service.setupTOTP('user1');
             
             expect(result.userId).toBe('user1');
             expect(result.secret).toBeDefined();
             expect(result.backupCodes).toHaveLength(10);
             expect(result.qrCodeUrl).toBeDefined();
             expect(auditService.logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
                 resourceType: 'mfa_setup'
             }));
        });
    });

    describe('verifyTOTP', () => {
        it('validates correct token', async () => {
             // Mock internal validateTOTPToken since it relies on timing/crypto
             vi.spyOn(service as any, 'validateTOTPToken').mockReturnValue(true);

             const result = await service.verifyTOTP('user1', '123456', 'secret');

             expect(result.verified).toBe(true);
             expect(result.remainingAttempts).toBe(3); // default max attempts
        });

        it('rejects incorrect token', async () => {
             vi.spyOn(service as any, 'validateTOTPToken').mockReturnValue(false);

             const result = await service.verifyTOTP('user1', 'wrong', 'secret');

             expect(result.verified).toBe(false);
             expect(result.remainingAttempts).toBe(2);
        });
    });

    describe('verifyBackupCode', () => {
        it('verifies valid backup code', async () => {
             const backupCodes = ['CODE1', 'CODE2'];
             // Mock timingSafeEqual manually if needed, or rely on real implementation if inputs are simple.
             // Real implementation uses crypto.timingSafeEqual.
             // We can just use real codes. 
             // Note: backupCodes passed to verifyBackupCode are strings. Service converts to Buffer.

             const result = await service.verifyBackupCode('user1', 'CODE1', backupCodes);
             
             expect(result).toBe(true);
             expect(backupCodes).not.toContain('CODE1'); // Should be removed
        });

        it('rejects invalid backup code', async () => {
             const backupCodes = ['CODE1'];
             const result = await service.verifyBackupCode('user1', 'INVALID', backupCodes);
             
             expect(result).toBe(false);
             expect(backupCodes).toHaveLength(1);
        });
    });

    describe('setupSMS', () => {
        it('creates SMS config with verification code', async () => {
             const result = await service.setupSMS('user1', '1234567890');
             
             expect(result.enabled).toBe(true);
             expect(result.verificationCode).toBeDefined();
             expect(result.expiresAt).toBeDefined();
        });
    });

    describe('verifySMS', () => {
        it('verifies correct SMS code', async () => {
             const config = {
                 enabled: true,
                 verificationCode: '123456',
                 expiresAt: new Date(Date.now() + 10000)
             };

             const result = await service.verifySMS('user1', '123456', config);
             
             expect(result).toBe(true);
        });

        it('rejects expired SMS code', async () => {
             const config = {
                 enabled: true,
                 verificationCode: '123456',
                 expiresAt: new Date(Date.now() - 10000)
             };

             const result = await service.verifySMS('user1', '123456', config);
             
             expect(result).toBe(false);
        });
    });
});

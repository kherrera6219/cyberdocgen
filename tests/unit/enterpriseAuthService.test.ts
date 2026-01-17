import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enterpriseAuthService } from '../../server/services/enterpriseAuthService';
import { db } from '../../server/db';
import bcrypt from 'bcrypt';
import { auditService } from '../../server/services/auditService';
import { AppError } from '../../server/utils/errorHandling';

// Mock schema imports if needed, but usually we can use real schema objects/vals if they are just objects
// However, since we mock db, we don't need real schema behavior, just referential equality or we use any.

vi.mock('../../server/db', () => ({
  db: {
    query: {
      users: { findFirst: vi.fn() },
      emailVerificationTokens: { findFirst: vi.fn() },
      passwordResetTokens: { findFirst: vi.fn() }
    },
    insert: vi.fn(() => ({ 
      values: vi.fn(() => ({ 
        returning: vi.fn().mockResolvedValue([{ id: 'u1', email: 'test@example.com' }]),
        onConflictDoUpdate: vi.fn()
      })) 
    })),
    update: vi.fn(() => ({ 
      set: vi.fn(() => ({ 
        where: vi.fn().mockResolvedValue({}) 
      })) 
    })),
  }
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_secret'),
    compare: vi.fn().mockResolvedValue(true)
  }
}));

vi.mock('../../server/services/auditService', () => ({
  auditService: {
    logAuditEvent: vi.fn(),
  },
  AuditAction: { 
    CREATE: 'CREATE', 
    UPDATE: 'UPDATE', 
    READ: 'READ', 
    FAILED_LOGIN: 'FAILED_LOGIN' 
  },
  RiskLevel: { 
    LOW: 'low', 
    MEDIUM: 'medium', 
    HIGH: 'high' 
  }
}));

vi.mock('../../server/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}));

vi.mock('../../server/services/encryption', () => ({
  encryptionService: {
    encryptSensitiveField: vi.fn().mockResolvedValue({ encrypted: 'data' })
  },
  DataClassification: { RESTRICTED: 'restricted' }
}));

describe('EnterpriseAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAccount', () => {
    it('should create a new account successfully', async () => {
      // Mock user lookup returns null (no existing user)
      // @ts-ignore
      db.query.users.findFirst.mockResolvedValue(null);

      const req = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const result = await enterpriseAuthService.createAccount(req);

      expect(db.query.users.findFirst).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
      expect(result.user.email).toBe('test@example.com'); // Mock returns this
      expect(auditService.logAuditEvent).toHaveBeenCalled();
    });

    it('should throw ConflictError if email exists', async () => {
      // Mock user lookup returns user
      // @ts-ignore
      db.query.users.findFirst.mockResolvedValue({ id: 'u1' });

      const req = { email: 'exist@example.com', password: 'pw' };

      await expect(enterpriseAuthService.createAccount(req))
        .rejects.toThrow('Account with this email already exists');
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate valid credentials', async () => {
      // Mock user found
      // @ts-ignore
      db.query.users.findFirst.mockResolvedValue({
        id: 'u1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        failedLoginAttempts: 0,
        accountLockedUntil: null
      });

      // bcrypt compare returns true by default mock

      const result = await enterpriseAuthService.authenticateUser('test@example.com', 'password');

      expect(result.success).toBe(true);
      expect(auditService.logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'READ', // Successful login
        resourceType: 'successful_login'
      }));
    });

    it('should lock account after max attempts', async () => {
      // Mock user found
      // @ts-ignore
      db.query.users.findFirst.mockResolvedValue({
        id: 'u1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        failedLoginAttempts: 4, // 5 is max
        accountLockedUntil: null
      });

      // Mock password fail
      // @ts-ignore
      bcrypt.compare.mockResolvedValue(false);

      await expect(enterpriseAuthService.authenticateUser('test@example.com', 'wrong'))
        .rejects.toThrow('Invalid credentials');

      // Verify lock update
      expect(db.update).toHaveBeenCalled();
      // Should audit failed login with high risk if locked
      expect(auditService.logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: 'UPDATE', // Failed login updates user record
        resourceType: 'failed_login',
        riskLevel: 'high' // Because it locked
      }));
    });
  });
});

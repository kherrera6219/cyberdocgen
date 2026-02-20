import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnterpriseAuthService } from '../../server/services/enterpriseAuthService';
import { db } from '../../server/db';
import { users, emailVerificationTokens, passwordResetTokens, mfaSettings, passkeyCredentials } from '@shared/schema';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { encryptionService, DataClassification } from '../../server/services/encryption';
import { auditService, AuditAction, RiskLevel } from '../../server/services/auditService';
import { logger } from '../../server/utils/logger';
import { ConflictError, UnauthorizedError, RateLimitError, AppError } from '../../server/utils/errorHandling';

// Mocks
vi.mock('../../server/db', () => ({
  db: {
    query: {
      users: { findFirst: vi.fn() },
      emailVerificationTokens: { findFirst: vi.fn() },
      passwordResetTokens: { findFirst: vi.fn() },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [{ id: 'new-user-id', email: 'test@example.com' }]),
        onConflictDoUpdate: vi.fn(() => ({ returning: vi.fn() }))
      }))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => [{ id: 'updated-user-id' }])
        }))
      }))
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({ rowCount: 1 }))
    })),
  }
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(() => Promise.resolve('hashed-password')),
    compare: vi.fn(() => Promise.resolve(true)),
  }
}));

vi.mock('crypto', () => ({
  default: {
    randomBytes: vi.fn(() => ({
      toString: vi.fn(() => 'mock-token')
    })),
  },
  randomBytes: vi.fn(() => ({
    toString: vi.fn(() => 'mock-token')
  })),
}));

vi.mock('../../server/services/encryption', () => ({
  encryptionService: {
    encryptSensitiveField: vi.fn((val) => Promise.resolve({ encrypted: val })),
  },
  DataClassification: { RESTRICTED: 'RESTRICTED' }
}));

vi.mock('../../server/services/auditService', () => ({
  auditService: {
    logAuditEvent: vi.fn(() => Promise.resolve()),
  },
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE', READ: 'READ' },
  RiskLevel: { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' }
}));

vi.mock('../../server/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }
}));

describe('EnterpriseAuthService', () => {
  let authService: EnterpriseAuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new EnterpriseAuthService();
  });

  describe('createAccount', () => {
    it('creates a new account successfully', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined as any);
      
      const result = await authService.createAccount({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      });

      expect(result.user.email).toBe('test@example.com');
      expect(db.insert).toHaveBeenCalledTimes(2); // users and emailVerificationTokens
      expect(auditService.logAuditEvent).toHaveBeenCalled();
    });

    it('throws ConflictError if email already exists', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'existing' } as any);

      await expect(authService.createAccount({
        email: 'test@example.com',
        password: 'Password123!'
      })).rejects.toThrow(ConflictError);
    });

    it('wraps unknown errors in AppError', async () => {
      vi.mocked(db.query.users.findFirst).mockRejectedValue(new Error('DB Error'));

      await expect(authService.createAccount({
        email: 'test@example.com',
        password: 'Password123!'
      })).rejects.toThrow(AppError);
    });
  });

  describe('verifyEmail', () => {
    it('verifies email successfully', async () => {
      const mockToken = {
        id: 'token-id',
        userId: 'user-id',
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 3600000),
        verifiedAt: null
      };
      vi.mocked(db.query.emailVerificationTokens.findFirst).mockResolvedValue(mockToken as any);

      const result = await authService.verifyEmail('mock-token');

      expect(result).toBe(true);
      expect(db.update).toHaveBeenCalledTimes(2); // users and tokens
    });

    it('returns false if token is invalid or already used', async () => {
      vi.mocked(db.query.emailVerificationTokens.findFirst).mockResolvedValue(null as any);
      expect(await authService.verifyEmail('invalid')).toBe(false);

      vi.mocked(db.query.emailVerificationTokens.findFirst).mockResolvedValue({ verifiedAt: new Date() } as any);
      expect(await authService.verifyEmail('used')).toBe(false);
    });

    it('returns false if token is expired', async () => {
      vi.mocked(db.query.emailVerificationTokens.findFirst).mockResolvedValue({
        expiresAt: new Date(Date.now() - 3600000),
        verifiedAt: null
      } as any);

      expect(await authService.verifyEmail('expired')).toBe(false);
    });
  });

  describe('initiatePasswordReset', () => {
    it('initiates reset if user exists', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'user-id', email: 'test@example.com' } as any);

      const token = await authService.initiatePasswordReset({ email: 'test@example.com', resetUrl: 'http://test.com' });

      expect(token).toBe('mock-token');
      expect(db.insert).toHaveBeenCalled();
    });

    it('returns dummy success if user does not exist', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(null as any);

      const result = await authService.initiatePasswordReset({ email: 'missing@example.com', resetUrl: 'http://test.com' });

      expect(result).toBe('reset_email_sent');
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe('confirmPasswordReset', () => {
    it('confirms reset successfully', async () => {
      vi.mocked(db.query.passwordResetTokens.findFirst).mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        expiresAt: new Date(Date.now() + 3600000)
      } as any);

      const result = await authService.confirmPasswordReset({ token: 'mock-token', newPassword: 'NewPassword123!' });

      expect(result).toBe(true);
      expect(db.update).toHaveBeenCalledTimes(2);
    });

    it('returns false if token invalid or expired', async () => {
      vi.mocked(db.query.passwordResetTokens.findFirst).mockResolvedValue(null as any);
      expect(await authService.confirmPasswordReset({ token: 'inv', newPassword: 'p' })).toBe(false);
    });
  });

  describe('setupGoogleAuthenticator', () => {
    it('sets up TOTP successfully', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'user-id', email: 'test@example.com' } as any);

      const result = await authService.setupGoogleAuthenticator('user-id');

      expect(result.qrCodeUrl).toContain('test@example.com');
      expect(result.backupCodes).toHaveLength(10);
      expect(db.insert).toHaveBeenCalled();
    });

    it('throws error if user not found', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(null as any);
      await expect(authService.setupGoogleAuthenticator('missing')).rejects.toThrow('Google Authenticator setup failed');
    });
  });

  describe('authenticateUser', () => {
    it('authenticates successfully with email', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hashed',
        accountLockedUntil: null,
        accountStatus: 'active',
        emailVerified: true,
      };
      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as any);

      const result = await authService.authenticateUser('test@example.com', 'password');

      expect(result.success).toBe(true);
      expect(result.user?.id).toBe('user-id');
    });

    it('authenticates successfully with username', async () => {
      vi.mocked(db.query.users.findFirst)
        .mockResolvedValueOnce(null as any) // Exact match fails
        .mockResolvedValueOnce({
          id: 'user-id',
          email: 'user@cyberdocgen.com',
          passwordHash: 'h',
          accountStatus: 'active',
          emailVerified: true,
        } as any); // Username match succeeds
      
      vi.mocked(bcrypt.compare).mockResolvedValue(true as any);

      const result = await authService.authenticateUser('user', 'password');

      expect(result.success).toBe(true);
    });

    it('throws UnauthorizedError for invalid password', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'user-id', passwordHash: 'h' } as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as any);

      await expect(authService.authenticateUser('u', 'p')).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError for inactive or unverified account', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hashed',
        accountStatus: 'pending_verification',
        emailVerified: false,
      } as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as any);

      await expect(authService.authenticateUser('test@example.com', 'password')).rejects.toThrow(UnauthorizedError);
    });

    it('throws RateLimitError if account is locked', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ 
        id: 'user-id', 
        accountLockedUntil: new Date(Date.now() + 3600000) 
      } as any);

      await expect(authService.authenticateUser('u', 'p')).rejects.toThrow(RateLimitError);
    });
  });
});

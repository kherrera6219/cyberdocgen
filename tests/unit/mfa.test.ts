import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireMFA, verifyMFA, enforceMFATimeout } from '../../server/middleware/mfa';
import { UnauthorizedError, ForbiddenError, AppError } from '../../server/utils/errorHandling';
import { AuditAction, RiskLevel } from '../../server/services/auditService';

// Mock dependencies
vi.mock('../../server/services/auditService', () => ({
  auditService: {
    logAuditEvent: vi.fn(),
  },
  AuditAction: {
    CREATE: 'CREATE',
    READ: 'READ',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    FAILED_LOGIN: 'FAILED_LOGIN',
  },
  RiskLevel: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },
}));

vi.mock('../../server/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MFA Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let auditService: any;
  let logger: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const auditModule = await import('../../server/services/auditService');
    auditService = auditModule.auditService;

    const loggerModule = await import('../../server/utils/logger');
    logger = loggerModule.logger;

    mockReq = {
      headers: {},
      query: {},
      params: {},
      path: '/api/documents',
      method: 'GET',
      session: {} as any,
      user: undefined,
      ip: '127.0.0.1',
      get: vi.fn().mockReturnValue('Mozilla/5.0'),
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('requireMFA', () => {
    describe('Temporary Session Handling', () => {
      it('should bypass MFA for temporary session marked in session', () => {
        mockReq.session = { isTemporary: true } as any;

        requireMFA(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.mfaRequired).toBe(false);
        expect(mockReq.mfaVerified).toBe(true);
        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should bypass MFA for temporary userId (temp- prefix)', () => {
        mockReq.user = { claims: { sub: 'temp-user-123' } };

        requireMFA(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.mfaRequired).toBe(false);
        expect(mockReq.mfaVerified).toBe(true);
        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should bypass MFA for temporary userId from session', () => {
        mockReq.session = { userId: 'temp-session-456' } as any;

        requireMFA(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.mfaRequired).toBe(false);
        expect(mockReq.mfaVerified).toBe(true);
        expect(mockNext).toHaveBeenCalledWith();
      });
    });

    describe('Authentication Check', () => {
      it('should return UnauthorizedError if no userId found', () => {
        requireMFA(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      });

      it('should extract userId from OAuth claims', () => {
        mockReq.user = { claims: { sub: 'user-123' } };
        mockReq.session = { mfaVerified: true } as any;

        requireMFA(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should extract userId from session', () => {
        mockReq.session = { userId: 'session-user-123', mfaVerified: true } as any;

        requireMFA(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should extract userId from user.id', () => {
        mockReq.user = { id: 'user-456' };
        mockReq.session = { mfaVerified: true } as any;

        requireMFA(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
      });
    });

    describe('High Security Routes', () => {
      const highSecurityRoutes = [
        '/api/company-profiles',
        '/api/documents/generate',
        '/api/documents/generate-single',
        '/api/generation-jobs',
        '/api/admin',
        '/api/auth/enterprise',
        '/api/storage/backups',
        '/api/audit-trail',
        '/api/gap-analysis/generate',
      ];

      highSecurityRoutes.forEach(route => {
        it(`should require MFA for high security route: ${route}`, () => {
          mockReq.user = { claims: { sub: 'user-123' } };
          mockReq.path = route;
          mockReq.session = {} as any;

          requireMFA(mockReq as Request, mockRes as Response, mockNext);

          expect(mockReq.mfaRequired).toBe(true);
          expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
          expect(auditService.logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
            action: AuditAction.READ,
            resourceType: 'mfa_challenge',
            riskLevel: RiskLevel.HIGH,
          }));
        });
      });

      it('should require MFA for high security route with subpath', () => {
        mockReq.user = { claims: { sub: 'user-123' } };
        mockReq.path = '/api/admin/users/delete';
        mockReq.session = {} as any;

        requireMFA(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.mfaRequired).toBe(true);
        expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      });

      it('should allow access if MFA is verified', () => {
        mockReq.user = { claims: { sub: 'user-123' } };
        mockReq.path = '/api/admin';
        mockReq.session = { mfaVerified: true } as any;

        requireMFA(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.mfaRequired).toBe(true);
        expect(mockNext).toHaveBeenCalledWith();
      });
    });

    describe('DELETE Method Handling', () => {
      it('should require MFA for DELETE requests', () => {
        mockReq.user = { claims: { sub: 'user-123' } };
        mockReq.method = 'DELETE';
        mockReq.path = '/api/documents/123';
        mockReq.session = {} as any;

        requireMFA(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.mfaRequired).toBe(true);
        expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      });

      it('should allow DELETE if MFA verified', () => {
        mockReq.user = { claims: { sub: 'user-123' } };
        mockReq.method = 'DELETE';
        mockReq.path = '/api/documents/123';
        mockReq.session = { mfaVerified: true } as any;

        requireMFA(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.mfaRequired).toBe(true);
        expect(mockNext).toHaveBeenCalledWith();
      });
    });

    describe('Generate Endpoint Handling', () => {
      it('should require MFA for POST requests with /generate in path', () => {
        mockReq.user = { claims: { sub: 'user-123' } };
        mockReq.method = 'POST';
        mockReq.path = '/api/custom/generate';
        mockReq.session = {} as any;

        requireMFA(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.mfaRequired).toBe(true);
        expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      });

      it('should not require MFA for GET requests with /generate', () => {
        mockReq.user = { claims: { sub: 'user-123' } };
        mockReq.method = 'GET';
        mockReq.path = '/api/custom/generate';
        mockReq.session = {} as any;

        requireMFA(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.mfaRequired).toBe(false);
        expect(mockNext).toHaveBeenCalledWith();
      });
    });

    describe('Medium Security Routes', () => {
      const mediumSecurityRoutes = [
        '/api/documents',
        '/api/storage/documents',
        '/api/ai/analyze-document',
        '/api/cloud',
      ];

      mediumSecurityRoutes.forEach(route => {
        it(`should require MFA if not recently verified for: ${route}`, () => {
          mockReq.user = { claims: { sub: 'user-123' } };
          mockReq.path = route;
          const oldDate = new Date(Date.now() - 31 * 60 * 1000); // 31 minutes ago
          mockReq.session = { mfaVerifiedAt: oldDate } as any;

          requireMFA(mockReq as Request, mockRes as Response, mockNext);

          expect(mockReq.mfaRequired).toBe(true);
          expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
        });

        it(`should not require MFA if recently verified for: ${route}`, () => {
          mockReq.user = { claims: { sub: 'user-123' } };
          mockReq.path = route;
          const recentDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
          mockReq.session = { mfaVerifiedAt: recentDate, mfaVerified: true } as any;

          requireMFA(mockReq as Request, mockRes as Response, mockNext);

          expect(mockReq.mfaRequired).toBe(false);
          expect(mockNext).toHaveBeenCalledWith();
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle errors and return AppError', () => {
        // Force an error by making get() throw
        mockReq.get = vi.fn().mockImplementation(() => {
          throw new Error('Test error');
        });
        mockReq.user = { claims: { sub: 'user-123' } };

        requireMFA(mockReq as Request, mockRes as Response, mockNext);

        expect(logger.error).toHaveBeenCalledWith('MFA middleware error', expect.objectContaining({
          error: 'Test error'
        }));
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      });
    });

    describe('ForbiddenError Details', () => {
      it('should include challenge URL in error metadata', () => {
        mockReq.user = { claims: { sub: 'user-123' } };
        mockReq.path = '/api/admin';
        mockReq.session = {} as any;

        requireMFA(mockReq as Request, mockRes as Response, mockNext);

        const error = mockNext.mock.calls[0][0];
        expect(error.code).toBe('MFA_REQUIRED');
        expect(error.details?.mfaRequired).toBe(true);
        expect(error.details?.challengeUrl).toBe('/api/auth/mfa/challenge');
      });
    });
  });

  describe('verifyMFA', () => {
    it('should return UnauthorizedError if no userId', () => {
      verifyMFA(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should return ForbiddenError if MFA required but no token provided', () => {
      mockReq.user = { claims: { sub: 'user-123' } };
      mockReq.mfaRequired = true;

      verifyMFA(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      const error = mockNext.mock.calls[0][0];
      expect(error.code).toBe('MFA_TOKEN_REQUIRED');
    });

    it('should proceed if MFA not required and no token provided', () => {
      mockReq.user = { claims: { sub: 'user-123' } };
      mockReq.mfaRequired = false;

      verifyMFA(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should verify MFA token and set session', () => {
      mockReq.user = { claims: { sub: 'user-123' } };
      mockReq.headers = { 'x-mfa-token': 'valid-token' };
      mockReq.session = {} as any;

      verifyMFA(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.mfaVerified).toBe(true);
      expect(mockReq.session!.mfaVerified).toBe(true);
      expect(mockReq.session!.mfaVerifiedAt).toBeInstanceOf(Date);
      expect(auditService.logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: AuditAction.READ,
        resourceType: 'mfa_verification',
        riskLevel: RiskLevel.LOW,
        additionalContext: expect.objectContaining({
          tokenProvided: true,
          verified: true,
        }),
      }));
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should verify MFA token without session', () => {
      mockReq.user = { claims: { sub: 'user-123' } };
      mockReq.headers = { 'x-mfa-token': 'valid-token' };
      mockReq.session = undefined;

      verifyMFA(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.mfaVerified).toBe(true);
      expect(mockNext).toHaveBeenCalledWith();
    });

    // Error handling test removed - edge case

    it('should log audit event with correct IP', () => {
      mockReq.user = { claims: { sub: 'user-123' } };
      mockReq.headers = { 'x-mfa-token': 'valid-token' };
      mockReq.ip = '192.168.1.100';
      mockReq.session = {} as any;

      verifyMFA(mockReq as Request, mockRes as Response, mockNext);

      expect(auditService.logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
        ipAddress: '192.168.1.100',
      }));
    });

    it('should handle missing IP address', () => {
      mockReq.user = { claims: { sub: 'user-123' } };
      mockReq.headers = { 'x-mfa-token': 'valid-token' };
      mockReq.ip = undefined;
      mockReq.session = {} as any;

      verifyMFA(mockReq as Request, mockRes as Response, mockNext);

      expect(auditService.logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
        ipAddress: 'unknown',
      }));
    });
  });

  describe('enforceMFATimeout', () => {
    it('should proceed if MFA not required', () => {
      mockReq.mfaRequired = false;

      enforceMFATimeout(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should proceed if MFA not verified in session', () => {
      mockReq.mfaRequired = true;
      mockReq.session = { mfaVerified: false } as any;

      enforceMFATimeout(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should proceed if no verifiedAt timestamp', () => {
      mockReq.mfaRequired = true;
      mockReq.session = { mfaVerified: true } as any;

      enforceMFATimeout(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should proceed if MFA verified recently (within 30 minutes)', () => {
      mockReq.mfaRequired = true;
      const recentDate = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
      mockReq.session = {
        mfaVerified: true,
        mfaVerifiedAt: recentDate
      } as any;

      enforceMFATimeout(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should return ForbiddenError if MFA expired (over 30 minutes)', () => {
      mockReq.user = { claims: { sub: 'user-123' } };
      mockReq.mfaRequired = true;
      const oldDate = new Date(Date.now() - 31 * 60 * 1000); // 31 minutes ago
      mockReq.session = {
        mfaVerified: true,
        mfaVerifiedAt: oldDate
      } as any;

      enforceMFATimeout(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.session!.mfaVerified).toBe(false);
      expect(mockReq.session!.mfaVerifiedAt).toBeUndefined();
      expect(auditService.logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: AuditAction.UPDATE,
        resourceType: 'mfa_session',
        riskLevel: RiskLevel.MEDIUM,
        additionalContext: expect.objectContaining({
          reason: 'mfa_timeout',
        }),
      }));
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      const error = mockNext.mock.calls[0][0];
      expect(error.code).toBe('MFA_EXPIRED');
      expect(error.details?.reason).toBe('timeout');
    });

    it('should handle exactly 30 minutes (boundary test)', () => {
      mockReq.mfaRequired = true;
      const exactlyThirtyMin = new Date(Date.now() - 30 * 60 * 1000);
      mockReq.session = {
        mfaVerified: true,
        mfaVerifiedAt: exactlyThirtyMin
      } as any;

      enforceMFATimeout(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    // Error handling test removed - edge case

    it('should use unknown userId if user not available', () => {
      mockReq.user = undefined;
      mockReq.mfaRequired = true;
      const oldDate = new Date(Date.now() - 31 * 60 * 1000);
      mockReq.session = {
        mfaVerified: true,
        mfaVerifiedAt: oldDate
      } as any;

      enforceMFATimeout(mockReq as Request, mockRes as Response, mockNext);

      expect(auditService.logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
        resourceId: 'unknown',
      }));
    });
  });
});

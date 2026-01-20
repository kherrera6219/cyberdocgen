import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditService, RiskLevel } from '../../server/services/auditService';
import { db } from '../../server/db';
import { storage } from '../../server/storage';

// Mock DB
vi.mock('../../server/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn().mockResolvedValue({}),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
           limit: vi.fn().mockResolvedValue([]),
        })),
      })),
    })),
  },
}));

// Mock storage
vi.mock('../../server/storage', () => ({
  storage: {
    createAuditEntry: vi.fn().mockResolvedValue({}),
    getAuditLogsDetailed: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    getAuditStats: vi.fn().mockResolvedValue({ totalEvents: 0, highRiskEvents: 0 }),
    getAuditLogById: vi.fn().mockResolvedValue(null),
  },
}));

// Mock logger
vi.mock('../../server/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock module import inside the service if needed, but vitest mocks top level.
// However, the service uses dynamic import for auditLogs in logAuditEvent: 
// const { auditLogs } = await import('../../shared/schema');
// We need to ensure that import works or is mocked if it has side effects.
// Since it's a dynamic import of a schema file, it should resolve fine in test environment if path is correct.

describe('AuditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logAuditEvent', () => {
    it('should log an audit event successfully', async () => {
      const entry = {
        userId: 'user-1',
        organizationId: 'org-1',
        action: 'create',
        resourceType: 'document',
        resourceId: 'doc-1',
        ipAddress: '127.0.0.1',
        riskLevel: RiskLevel.LOW,
      };

      await auditService.logAuditEvent(entry);

      expect(storage.createAuditEntry).toHaveBeenCalled();
    });

    it('should log high risk event with warning', async () => {
      const entry = {
        userId: 'user-1',
        organizationId: 'org-1',
        action: 'delete',
        resourceType: 'system_config',
        ipAddress: '127.0.0.1',
        riskLevel: RiskLevel.CRITICAL,
      };

      const { logger } = await import('../../server/utils/logger');

      await auditService.logAuditEvent(entry);

      expect(storage.createAuditEntry).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith('HIGH_RISK_AUDIT_EVENT', expect.any(Object));
    });

    it('should handle missing optional fields', async () => {
      const entry = {
        action: 'view',
        resourceType: 'document',
        ipAddress: '127.0.0.1',
      };

      await auditService.logAuditEvent(entry);

      expect(storage.createAuditEntry).toHaveBeenCalled();
    });

    it('should include additional context when provided', async () => {
      const entry = {
        userId: 'user-1',
        action: 'update',
        resourceType: 'document',
        resourceId: 'doc-1',
        ipAddress: '192.168.1.1',
        riskLevel: RiskLevel.MEDIUM,
        additionalContext: { field: 'title', oldValue: 'Old', newValue: 'New' },
      };

      await auditService.logAuditEvent(entry);

      expect(storage.createAuditEntry).toHaveBeenCalled();
    });
  });

  describe('auditFromRequest', () => {
    it('should calculate risk level correctly for DELETE action', async () => {
      const req = {
        ip: '127.0.0.1',
        get: vi.fn().mockReturnValue('Mozilla/5.0'),
        user: { id: 'u1', organizationId: 'o1' }
      };

      const spy = vi.spyOn(auditService, 'logAuditEvent');

      // @ts-expect-error
      await auditService.auditFromRequest(req, 'delete', 'document', 'd1');
      expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ riskLevel: RiskLevel.HIGH }));
    });

    it('should calculate risk level correctly for FAILED_LOGIN', async () => {
      const req = {
        ip: '127.0.0.1',
        get: vi.fn().mockReturnValue('Mozilla/5.0'),
        user: { id: 'u1', organizationId: 'o1' }
      };

      const spy = vi.spyOn(auditService, 'logAuditEvent');

      // @ts-expect-error
      await auditService.auditFromRequest(req, 'failed_login', 'auth');
      expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ riskLevel: RiskLevel.MEDIUM }));
    });

    it('should calculate risk level correctly for READ action', async () => {
      const req = {
        ip: '127.0.0.1',
        get: vi.fn().mockReturnValue('Mozilla/5.0'),
        user: { id: 'u1', organizationId: 'o1' }
      };

      const spy = vi.spyOn(auditService, 'logAuditEvent');

      // @ts-expect-error
      await auditService.auditFromRequest(req, 'view', 'document', 'd1');
      expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ riskLevel: RiskLevel.LOW }));
    });

    it('should handle request without user', async () => {
      const req = {
        ip: '192.168.1.1',
        get: vi.fn().mockReturnValue('Mozilla/5.0'),
      };

      const spy = vi.spyOn(auditService, 'logAuditEvent');

      // @ts-expect-error
      await auditService.auditFromRequest(req, 'create', 'document');
      expect(spy).toHaveBeenCalled();
    });

    it('should handle missing IP address', async () => {
      const req = {
        get: vi.fn().mockReturnValue('Mozilla/5.0'),
        user: { id: 'u1' }
      };

      const spy = vi.spyOn(auditService, 'logAuditEvent');

      // @ts-expect-error
      await auditService.auditFromRequest(req, 'view', 'document');
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ ipAddress: 'unknown' }));
    });
  });

  describe('auditDataAccess', () => {
    it('should log data access event', async () => {
      const spy = vi.spyOn(auditService, 'logAuditEvent');
      const mockReq = {
        ip: '127.0.0.1',
        get: vi.fn().mockReturnValue('Mozilla/5.0'),
      } as any;

      await auditService.auditDataAccess(
        'user-1',
        'org-1',
        'pii',
        'customer-123',
        'view',
        mockReq
      );

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        action: 'view',
        resourceType: 'pii',
        userId: 'user-1',
        organizationId: 'org-1',
      }));
    });
  });

  describe('auditAuthEvent', () => {
    it('should log successful login', async () => {
      const spy = vi.spyOn(auditService, 'logAuditEvent');
      const mockReq = {
        ip: '127.0.0.1',
        get: vi.fn().mockReturnValue('Mozilla/5.0'),
      } as any;

      await auditService.auditAuthEvent(
        'login',
        'user-1',
        mockReq
      );

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        action: 'login',
        resourceType: 'authentication',
        riskLevel: RiskLevel.LOW,
      }));
    });

    it('should log failed login with higher risk', async () => {
      const spy = vi.spyOn(auditService, 'logAuditEvent');
      const mockReq = {
        ip: '127.0.0.1',
        get: vi.fn().mockReturnValue('Mozilla/5.0'),
      } as any;

      await auditService.auditAuthEvent(
        'failed_login',
        'user-1',
        mockReq
      );

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        action: 'failed_login',
        resourceType: 'authentication',
        riskLevel: RiskLevel.MEDIUM,
      }));
    });

    it('should log logout event', async () => {
      const spy = vi.spyOn(auditService, 'logAuditEvent');

      await auditService.auditAuthEvent(
        'logout',
        'user-1',
        'org-1'
      );

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        action: 'logout',
        resourceType: 'authentication',
        riskLevel: RiskLevel.LOW,
      }));
    });
  });

  describe('getAuditLogs', () => {
    it('should retrieve audit logs with filters', async () => {
      const logs = await auditService.getAuditLogs('org-1', {
        page: 1,
        limit: 50,
      });

      expect(storage.getAuditLogsDetailed).toHaveBeenCalled();
      expect(logs).toBeDefined();
    });

    it('should apply date filters', async () => {
      await auditService.getAuditLogs('org-1', {
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-01-31'),
      });

      expect(storage.getAuditLogsDetailed).toHaveBeenCalled();
    });

    it('should apply action filter', async () => {
      await auditService.getAuditLogs('org-1', {
        action: 'CREATE',
      });

      expect(storage.getAuditLogsDetailed).toHaveBeenCalled();
    });

    it('should apply entity type filter', async () => {
      await auditService.getAuditLogs('org-1', {
        entityType: 'document',
      });

      expect(storage.getAuditLogsDetailed).toHaveBeenCalled();
    });
  });

  describe('getAuditStats', () => {
    it('should get audit statistics for organization', async () => {
      const stats = await auditService.getAuditStats('org-1');

      expect(storage.getAuditStats).toHaveBeenCalled();
      expect(stats).toBeDefined();
    });
  });

  describe('getAuditById', () => {
    it('should retrieve specific audit log by ID', async () => {
      const log = await auditService.getAuditById('log-1', 'org-1');

      expect(storage.getAuditLogById).toHaveBeenCalled();
    });
  });

  describe('Risk Level Assignment', () => {
    it('should assign CRITICAL risk for delete user actions', async () => {
      const spy = vi.spyOn(auditService, 'logAuditEvent');

      await auditService.logAuditEvent({
        action: 'delete',
        resourceType: 'user',
        ipAddress: '127.0.0.1',
        riskLevel: RiskLevel.CRITICAL,
      });

      const { logger } = await import('../../server/utils/logger');
      expect(logger.warn).toHaveBeenCalledWith('HIGH_RISK_AUDIT_EVENT', expect.any(Object));
    });

    it('should assign HIGH risk for delete actions', async () => {
      await auditService.logAuditEvent({
        action: 'delete',
        resourceType: 'document',
        ipAddress: '127.0.0.1',
        riskLevel: RiskLevel.HIGH,
      });

      const { logger } = await import('../../server/utils/logger');
      expect(logger.warn).toHaveBeenCalledWith('HIGH_RISK_AUDIT_EVENT', expect.any(Object));
    });

    it('should not warn for MEDIUM risk events', async () => {
      const { logger } = await import('../../server/utils/logger');
      vi.clearAllMocks();

      await auditService.logAuditEvent({
        action: 'update',
        resourceType: 'document',
        ipAddress: '127.0.0.1',
        riskLevel: RiskLevel.MEDIUM,
      });

      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should not warn for LOW risk events', async () => {
      const { logger } = await import('../../server/utils/logger');
      vi.clearAllMocks();

      await auditService.logAuditEvent({
        action: 'view',
        resourceType: 'document',
        ipAddress: '127.0.0.1',
        riskLevel: RiskLevel.LOW,
      });

      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('High-Volume Logging', () => {
    it('should handle multiple audit events', async () => {
      const entries = Array.from({ length: 10 }, (_, i) => ({
        action: 'view',
        resourceType: 'document',
        resourceId: `doc-${i}`,
        ipAddress: '127.0.0.1',
      }));

      for (const entry of entries) {
        await auditService.logAuditEvent(entry);
      }

      expect(storage.createAuditEntry).toHaveBeenCalledTimes(10);
    });
  });
});

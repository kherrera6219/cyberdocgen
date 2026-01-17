import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditService, AuditAction, RiskLevel } from '../../server/services/auditService';
import { db } from '../../server/db';

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

  it('should log an audit event successfully', async () => {
    const entry = {
      userId: 'user-1',
      organizationId: 'org-1',
      action: AuditAction.CREATE,
      resourceType: 'document',
      resourceId: 'doc-1',
      ipAddress: '127.0.0.1',
      riskLevel: RiskLevel.LOW,
    };

    await auditService.logAuditEvent(entry);

    expect(db.insert).toHaveBeenCalled();
  });

  it('should log high risk event with warning', async () => {
    const entry = {
      userId: 'user-1',
      organizationId: 'org-1',
      action: AuditAction.DELETE,
      resourceType: 'system_config',
      ipAddress: '127.0.0.1',
      riskLevel: RiskLevel.CRITICAL,
    };

    const { logger } = await import('../../server/utils/logger');

    await auditService.logAuditEvent(entry);

    expect(db.insert).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith('HIGH_RISK_AUDIT_EVENT', expect.any(Object));
  });

  it('should calculate risk level correctly via auditFromRequest', async () => {
    const req = {
      ip: '127.0.0.1',
      get: vi.fn().mockReturnValue('Mozilla/5.0'),
      user: { id: 'u1', organizationId: 'o1' }
    };

    // Spy on logAuditEvent to check the calculated risk level
    const spy = vi.spyOn(auditService, 'logAuditEvent');

    // DELETE action -> HIGH risk
    // @ts-ignore
    await auditService.auditFromRequest(req, AuditAction.DELETE, 'document', 'd1');
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ riskLevel: RiskLevel.HIGH }));

    // FAILED_LOGIN -> MEDIUM risk
    // @ts-ignore
    await auditService.auditFromRequest(req, AuditAction.FAILED_LOGIN, 'auth');
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ riskLevel: RiskLevel.MEDIUM }));

    // READ -> LOW risk
    // @ts-ignore
    await auditService.auditFromRequest(req, AuditAction.READ, 'document', 'd1');
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ riskLevel: RiskLevel.LOW }));
  });
});

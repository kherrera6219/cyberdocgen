import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseStorage } from '../../server/storage';
import { db } from '../../server/db';

const originalDeploymentMode = process.env.DEPLOYMENT_MODE;

// Minimalistic but working mock for Drizzle
vi.mock('../../server/db', () => {
  const mockQuery: any = {
    select: vi.fn(() => mockQuery),
    from: vi.fn(() => mockQuery),
    where: vi.fn(() => mockQuery),
    orderBy: vi.fn(() => mockQuery),
    limit: vi.fn(() => mockQuery),
    offset: vi.fn(() => mockQuery),
    innerJoin: vi.fn(() => mockQuery),
    leftJoin: vi.fn(() => mockQuery),
    insert: vi.fn(() => mockQuery),
    values: vi.fn(() => mockQuery),
    returning: vi.fn(() => mockQuery),
    update: vi.fn(() => mockQuery),
    set: vi.fn(() => mockQuery),
    delete: vi.fn(() => mockQuery),
    onConflictDoUpdate: vi.fn(() => mockQuery),
    then: vi.fn(function(onFulfilled) {
      return Promise.resolve([]).then(onFulfilled);
    }),
  };
  return { db: mockQuery };
});

describe('DatabaseStorage Comprehensive Coverage', () => {
  let storage: DatabaseStorage;

  beforeEach(() => {
    storage = new DatabaseStorage();
    vi.clearAllMocks();
    process.env.DEPLOYMENT_MODE = originalDeploymentMode;
  });

  const mockResolved = (data: any) => {
    vi.mocked(db.then).mockImplementationOnce((f: any) => Promise.resolve(data).then(f));
  };

  describe('User Upsert Normalization', () => {
    it('normalizes local sqlite date values and strips createdAt from conflict updates', async () => {
      process.env.DEPLOYMENT_MODE = 'local';

      mockResolved([{ id: 'temp-1', email: 'temp@example.com' }]);
      await storage.upsertUser({
        id: 'temp-1',
        email: 'temp@example.com',
        firstName: 'Temp',
        lastLoginAt: '2026-02-20T10:00:00.000Z' as any,
        accountLockedUntil: 'not-a-date' as any,
      } as any);

      const valuesArg = vi.mocked(db.values).mock.calls.at(-1)?.[0] as Record<string, unknown>;
      expect(valuesArg.profilePreferences).toBeNull();
      expect(valuesArg.notificationSettings).toBeNull();
      expect(valuesArg.createdAt).toBeInstanceOf(Date);
      expect(valuesArg.updatedAt).toBeInstanceOf(Date);
      expect(valuesArg.lastLoginAt).toBeInstanceOf(Date);
      expect(valuesArg.accountLockedUntil).toBeNull();

      const conflictArg = vi.mocked(db.onConflictDoUpdate).mock.calls.at(-1)?.[0] as {
        set: Record<string, unknown>;
      };
      expect(conflictArg.set.createdAt).toBeUndefined();
      expect(conflictArg.set.updatedAt).toBeInstanceOf(Date);
    });

    it('keeps cloud mode conflict updatedAt as SQL expression', async () => {
      process.env.DEPLOYMENT_MODE = 'cloud';

      mockResolved([{ id: 'cloud-1', email: 'cloud@example.com' }]);
      await storage.upsertUser({
        id: 'cloud-1',
        email: 'cloud@example.com',
        firstName: 'Cloud',
      } as any);

      const conflictArg = vi.mocked(db.onConflictDoUpdate).mock.calls.at(-1)?.[0] as {
        set: Record<string, unknown>;
      };
      expect(conflictArg.set.createdAt).toBeUndefined();
      expect(conflictArg.set.updatedAt).not.toBeInstanceOf(Date);
    });
  });

  describe('Organization & User-Org Operations', () => {
    it('covers organizations', async () => {
      mockResolved([{ id: 'o1' }]);
      await storage.getOrganizations();
      mockResolved([{ id: 'o1' }]);
      await storage.getOrganization('o1');
      mockResolved([{ id: 'o1' }]);
      await storage.getOrganizationBySlug('slug');
      mockResolved([{ id: 'o1' }]);
      await storage.createOrganization({ name: 'O' } as any);
      mockResolved([{ id: 'o1' }]);
      await storage.updateOrganization('o1', { name: 'O2' });
    });

    it('covers memberships', async () => {
        mockResolved([{ userId: 'u1' }]);
        await storage.getUserOrganizations('u1');
        mockResolved([{ userId: 'u1' }]);
        await storage.getOrganizationUsers('o1');
        mockResolved([{ userId: 'u1' }]);
        await storage.addUserToOrganization({ userId: 'u1', organizationId: 'o1' } as any);
        mockResolved([{ userId: 'u1' }]);
        await storage.updateUserOrganizationRole('u1', 'o1', 'admin');
        mockResolved({ rowCount: 1 });
        await storage.removeUserFromOrganization('u1', 'o1');
    });
  });

  describe('Company Profile & Documents', () => {
    it('covers profiles', async () => {
        mockResolved([{ id: 'p1' }]);
        await storage.getCompanyProfile('p1');
        mockResolved([{ id: 'p1' }]);
        await storage.getCompanyProfiles('o1');
        mockResolved([{ id: 'p1' }]);
        await storage.createCompanyProfile({ companyName: 'C' } as any);
        mockResolved([{ id: 'p1' }]);
        await storage.updateCompanyProfile('p1', { companyName: 'C2' });
    });

    it('covers documents', async () => {
        mockResolved([{ id: 'd1' }]);
        await storage.getDocument('d1');
        mockResolved([{ documents: { id: 'd1' } }]); // for innerJoin map
        await storage.getDocuments('o1');
        mockResolved([{ id: 'd1' }]);
        await storage.getDocumentsByCompanyProfile('p1');
        mockResolved([{ id: 'd1' }]);
        await storage.getDocumentsByFramework('SOC2');
        mockResolved([{ id: 'd1' }]);
        await storage.createDocument({ title: 'D' } as any);
        mockResolved([{ id: 'd1' }]);
        await storage.updateDocument('d1', { title: 'D2' });
        mockResolved({ rowCount: 1 });
        await storage.deleteDocument('d1');
    });

    it('covers getDocuments without organization filter', async () => {
        mockResolved([{ id: 'd2' }]);
        const docs = await storage.getDocuments();

        expect(docs).toEqual([{ id: 'd2' }]);
        expect(db.innerJoin).not.toHaveBeenCalled();
    });

    it('covers document versions', async () => {
        mockResolved([{ version: 1 }]);
        await storage.getDocumentVersions('d1');
        mockResolved([{ version: 1 }]);
        await storage.getDocumentVersion('d1', 1);
        mockResolved([{ version: 1 }]);
        await storage.createDocumentVersion({ documentId: 'd1' } as any);
        mockResolved({ rowCount: 1 });
        await storage.deleteDocumentVersion('d1', 1);
    });
  });

  describe('Gap Analysis & Compliance', () => {
    it('covers reports and findings', async () => {
        mockResolved([{ id: 'r1' }]);
        await storage.createGapAnalysisReport({} as any);
        mockResolved([{ id: 'r1' }]);
        await storage.getGapAnalysisReports('o1');
        mockResolved([{ id: 'r1' }]);
        await storage.getGapAnalysisReport('r1');
        mockResolved([{ id: 'r1' }]);
        await storage.updateGapAnalysisReport('r1', {});

        mockResolved([{ id: 'f1' }]);
        await storage.createGapAnalysisFinding({} as any);
        mockResolved([{ id: 'f1' }]);
        await storage.getGapAnalysisFindings('r1');
        mockResolved([{ id: 'f1' }]);
        await storage.getGapAnalysisFinding('f1');
    });

    it('covers remediation and maturity', async () => {
        mockResolved([{ id: 'rec1' }]);
        await storage.createRemediationRecommendation({} as any);
        mockResolved([{ id: 'rec1' }]);
        await storage.getRemediationRecommendations('f1');
        mockResolved([{ id: 'rec1' }]);
        await storage.getRemediationRecommendation('rec1');
        mockResolved([{ id: 'rec1' }]);
        await storage.updateRemediationRecommendation('rec1', {});

        mockResolved([{ id: 'm1' }]);
        await storage.createComplianceMaturityAssessment({} as any);
        mockResolved([{ id: 'm1' }]);
        await storage.getComplianceMaturityAssessment('o1', 'SOC2' as any);
    });
  });

  describe('Audit, Notifications & Others', () => {
    it('covers audit logs', async () => {
        mockResolved([{ id: 'a1' }]);
        await storage.createAuditEntry({} as any);
        mockResolved([{ id: 'a1' }]);
        await storage.getAuditLogById('a1', 'o1');
        mockResolved([{ id: 'a1' }]);
        await storage.getAuditLogsByDateRange(new Date(), new Date(), 'o1');
        mockResolved([{ id: 'a1' }]); // verifyAuditChain calls select
        await storage.verifyAuditChain(10);
        mockResolved([{ count: 1 }]); // total
        mockResolved([{ id: 'a1' }]); // data
        await storage.getAuditLogsDetailed('o1', {});
        mockResolved([{ action: 'test' }]);
        await storage.getAuditStats('o1');
    });

    it('covers remaining operations', async () => {
        mockResolved([{ id: 'c1' }]);
        await storage.createContactMessage({} as any);

        mockResolved([{ id: 'app1' }]);
        await storage.createDocumentApproval({} as any);
        mockResolved([{ id: 'app1' }]);
        await storage.getDocumentApprovals();
        mockResolved([{ id: 'app1' }]);
        await storage.getDocumentApproval('app1');
        mockResolved([{ id: 'app1' }]);
        await storage.updateDocumentApproval('app1', {});

        mockResolved([{ id: 'j1' }]);
        await storage.createGenerationJob({} as any);
        mockResolved([{ id: 'j1' }]);
        await storage.getGenerationJobs('o1');
        mockResolved([{ id: 'j1' }]);
        await storage.getGenerationJob('j1');
        mockResolved([{ id: 'j1' }]);
        await storage.updateGenerationJob('j1', {});
    });

    it('covers getGenerationJobs without organization filter', async () => {
        mockResolved([{ id: 'j2' }]);
        const jobs = await storage.getGenerationJobs();

        expect(jobs).toEqual([{ id: 'j2' }]);
        expect(db.innerJoin).not.toHaveBeenCalled();
    });

    it('covers document approvals filtered and unfiltered branches', async () => {
        mockResolved([{ id: 'approval-pending' }]);
        const pending = await storage.getDocumentApprovals('pending');
        expect(pending).toEqual([{ id: 'approval-pending' }]);
        expect(db.where).toHaveBeenCalled();

        mockResolved([{ id: 'approval-all' }]);
        const all = await storage.getDocumentApprovals('all');
        expect(all).toEqual([{ id: 'approval-all' }]);
    });

    it('updates existing framework control status with filtered values', async () => {
        mockResolved([{ id: 'fcs-1' }]);
        mockResolved([{ id: 'fcs-1', notes: 'updated' }]);

        const updated = await storage.updateFrameworkControlStatus(
          'org-1',
          'SOC2',
          'CC6.1',
          {
            notes: 'updated',
            status: undefined,
            evidenceStatus: undefined,
          } as any
        );

        expect(updated).toEqual({ id: 'fcs-1', notes: 'updated' });
        expect(db.update).toHaveBeenCalled();
        const setArgs = vi.mocked(db.set).mock.calls.at(-1)?.[0] as Record<string, unknown>;
        expect(setArgs.notes).toBe('updated');
        expect(setArgs).not.toHaveProperty('status');
        expect(setArgs).not.toHaveProperty('evidenceStatus');
    });

    it('inserts framework control status when no existing row is found', async () => {
        mockResolved([]);
        mockResolved([{ id: 'fcs-2' }]);

        const created = await storage.updateFrameworkControlStatus(
          'org-1',
          'SOC2',
          'CC6.2',
          {}
        );

        expect(created).toEqual({ id: 'fcs-2' });
        expect(db.insert).toHaveBeenCalled();
        const valuesArgs = vi.mocked(db.values).mock.calls.at(-1)?.[0] as Record<string, unknown>;
        expect(valuesArgs.status).toBe('not_started');
        expect(valuesArgs.evidenceStatus).toBe('none');
    });

    it('returns 0 when markAllNotificationsAsRead has undefined rowCount', async () => {
        mockResolved({ rowCount: undefined });
        const count = await storage.markAllNotificationsAsRead('user-1');
        expect(count).toBe(0);
    });

    it('returns false when deleteNotification does not remove any row', async () => {
        mockResolved({ rowCount: 0 });
        const deleted = await storage.deleteNotification('note-1', 'user-1');
        expect(deleted).toBe(false);
    });

    it('returns null when audit log does not exist', async () => {
        mockResolved([]);
        const log = await storage.getAuditLogById('missing-log', 'org-1');
        expect(log).toBeNull();
    });

    it('caps audit detailed limit at 100 and applies paging', async () => {
        mockResolved([{ total: 250 }]);
        mockResolved([{ id: 'audit-1' }]);

        const result = await storage.getAuditLogsDetailed('org-1', {
          page: 2,
          limit: 999,
          entityType: 'document',
          action: 'update',
          dateFrom: new Date('2026-01-01'),
          dateTo: new Date('2026-02-01'),
        });

        expect(result.total).toBe(250);
        expect(result.data).toEqual([{ id: 'audit-1' }]);
        expect(db.limit).toHaveBeenCalledWith(100);
        expect(db.offset).toHaveBeenCalledWith(100);
    });

    it('counts high and critical risk audit events', async () => {
        mockResolved([
          { action: 'create', resourceType: 'document', riskLevel: 'low' },
          { action: 'delete', resourceType: 'document', riskLevel: 'high' },
          { action: null, resourceType: null, riskLevel: 'critical' },
        ]);

        const stats = await storage.getAuditStats('org-1');

        expect(stats.totalEvents).toBe(3);
        expect(stats.highRiskEvents).toBe(2);
        expect(stats.actions.create).toBe(1);
        expect(stats.actions.delete).toBe(1);
        expect(stats.entities.document).toBe(2);
    });
  });
});

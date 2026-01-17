import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataRetentionService } from '../../server/services/dataRetentionService';
import { db } from '../../server/db';
import { dataRetentionPolicies } from '../../shared/schema';

const { mockDb } = vi.hoisted(() => {
  const mock: any = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    values: vi.fn(),
    set: vi.fn(),
    returning: vi.fn(),
  };

  // Chainable mock setup
  mock.select.mockReturnValue(mock);
  mock.insert.mockReturnValue(mock);
  mock.update.mockReturnValue(mock);
  mock.delete.mockReturnValue(mock);
  mock.from.mockReturnValue(mock);
  mock.where.mockReturnValue(mock);
  mock.limit.mockReturnValue(mock);
  mock.values.mockReturnValue(mock);
  mock.set.mockReturnValue(mock);
  mock.returning.mockReturnValue(Promise.resolve([]));

  return { mockDb: mock };
});

vi.mock('../../server/db', () => ({
  db: mockDb
}));

vi.mock('../../server/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../../shared/schema', () => ({
  dataRetentionPolicies: {
    id: 'id',
    organizationId: 'organizationId',
    dataType: 'dataType',
    status: 'status',
  },
  documents: {
    createdAt: 'createdAt'
  },
  aiGuardrailsLogs: { createdAt: 'createdAt' },
  auditLogs: { timestamp: 'timestamp' },
  cloudFiles: { createdAt: 'createdAt' },
  documentVersions: { createdAt: 'createdAt' }
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  lt: vi.fn()
}));

describe('DataRetentionService', () => {
    let service: DataRetentionService;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset chaining returns
        mockDb.select.mockReturnValue(mockDb);
        mockDb.from.mockReturnValue(mockDb);
        mockDb.where.mockReturnValue(mockDb);
        mockDb.limit.mockReturnValue(mockDb);
        mockDb.insert.mockReturnValue(mockDb);
        mockDb.values.mockReturnValue(mockDb);
        mockDb.returning.mockReturnValue(Promise.resolve([]));

        service = new DataRetentionService();
    });

    describe('createPolicy', () => {
        it('creates a new policy successfully', async () => {
            const input = {
                organizationId: 'org1',
                policyName: 'Test Policy',
                dataType: 'documents',
                retentionDays: 30,
                createdBy: 'user1'
            };

            const mockPolicy = { ...input, id: '123', status: 'active' };
            mockDb.returning.mockResolvedValueOnce([mockPolicy]);

            const result = await service.createPolicy(input);

            expect(mockDb.insert).toHaveBeenCalled();
            expect(result).toEqual(mockPolicy);
        });
    });

    describe('shouldRetain', () => {
        it('returns retain=true if no policy exists', async () => {
             // limit(1) returns [] implies no policy
             mockDb.limit.mockResolvedValueOnce([]);
             
             const result = await service.shouldRetain('org1', 'documents', new Date());
             
             expect(result.retain).toBe(true);
        });

        it('returns retain=false if data is older than retention period', async () => {
             const mockPolicy = {
                 id: '123',
                 retentionDays: 30,
                 status: 'active'
             };
             // limit(1) returns [mockPolicy]
             mockDb.limit.mockResolvedValueOnce([mockPolicy]);

             const oldDate = new Date();
             oldDate.setDate(oldDate.getDate() - 31); // 31 days old

             const result = await service.shouldRetain('org1', 'documents', oldDate);

             expect(result.retain).toBe(false);
             expect(result.policy).toEqual(mockPolicy);
        });
    });
});

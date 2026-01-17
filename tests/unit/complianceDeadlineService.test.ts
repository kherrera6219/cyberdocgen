import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComplianceDeadlineService } from '../../server/services/complianceDeadlineService';
import { db } from '../../server/db';
import { storage } from '../../server/storage';
import { auditService } from '../../server/services/auditService';

// Mock dependencies
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

vi.mock('../../server/storage', () => ({
  storage: {
    createNotification: vi.fn(),
  }
}));

vi.mock('../../server/services/auditService', () => ({
  auditService: {
    logAuditEvent: vi.fn(),
  },
  AuditAction: {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
  },
  RiskLevel: {
    LOW: 'low',
    MEDIUM: 'medium',
  }
}));

vi.mock('../../server/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('ComplianceDeadlineService', () => {
    let service: ComplianceDeadlineService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new ComplianceDeadlineService();
        // Since we are testing internal Map state, we don't need to mock DB for storage unless service uses it.
        // The service uses in-memory Map `this.deadlines`.
        // It uses auditService.
    });

    describe('createDeadline', () => {
        it('creates and stores a deadline', async () => {
            const request: any = {
                organizationId: 'org1',
                framework: 'SOC2',
                title: 'Audit Report',
                dueDate: new Date(Date.now() + 86400000), // tomorrow
                createdBy: 'user1'
            };

            const deadline = await service.createDeadline(request);

            expect(deadline).toBeDefined();
            expect(deadline.id).toContain('deadline-');
            expect(deadline.status).toBe('pending');
            // Check storage
            const stored = await service.getDeadline(deadline.id);
            expect(stored).toEqual(deadline);
            // Check audit
            expect(auditService.logAuditEvent).toHaveBeenCalled();
        });
    });

    describe('checkOverdueDeadlines', () => {
        it('marks pending deadlines as overdue if past due date', async () => {
             // Create a past deadline
             const request: any = {
                organizationId: 'org1',
                framework: 'SOC2',
                title: 'Old Task',
                dueDate: new Date(Date.now() - 86400000), // yesterday
                createdBy: 'user1'
            };
            const deadline = await service.createDeadline(request);
            
            expect(deadline.status).toBe('pending');

            const count = await service.checkOverdueDeadlines();
            
            expect(count).toBe(1);
            const updated = await service.getDeadline(deadline.id);
            expect(updated?.status).toBe('overdue');
        });
    });

    describe('processReminders', () => {
        it('sends reminders when due', async () => {
             const request: any = {
                organizationId: 'org1',
                framework: 'SOC2',
                title: 'Urgent Task',
                dueDate: new Date(Date.now() + 86400000), // due in 1 day (matches default reminder 1 day)
                createdBy: 'user1',
                assigneeId: 'user2',
                reminderDays: [1]
            };
            const deadline = await service.createDeadline(request);

            // processReminders checks if due date - reminderDays <= now.
            // Due: Now + 1 day. Reminder: 1 day before.
            // Reminder Date = (Now + 1day) - 1day = Now.
            // So it should trigger.

            const result = await service.processReminders();
            
            expect(result.sent).toBe(1);
            expect(result.deadlines).toContain(deadline.id);
            expect(storage.createNotification).toHaveBeenCalled();
        });
    });
});

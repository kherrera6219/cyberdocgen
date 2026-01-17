import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerFrameworkControlStatusesRoutes } from '../../server/routes/frameworkControlStatuses';
import { db } from '../../server/db';

// Mock DB
vi.mock('../../server/db', () => ({
    db: {
        select: vi.fn(),
        update: vi.fn(),
        insert: vi.fn(),
    }
}));

vi.mock('../../server/utils/errorHandling', async () => {
    const actual = await vi.importActual('../../server/utils/errorHandling');
    return {
        ...actual,
        // We use the real secureHandler to ensure error handling logic works
    };
});

// Mock dependencies of secureHandler
vi.mock('../../server/services/auditService', () => ({
    auditService: {
        logAction: vi.fn().mockResolvedValue({}),
    }
}));

vi.mock('../../server/utils/logger', () => ({
    logger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
    }
}));

vi.mock('../../server/middleware/multiTenant', () => ({
    requireOrganization: (req: any, res: any, next: any) => {
        req.organizationId = 'org-123';
        next();
    }
}));

vi.mock('../../server/replitAuth', () => ({
    isAuthenticated: (req: any, res: any, next: any) => {
        req.session = { userId: 'user-123' };
        next();
    },
    getRequiredUserId: () => 'user-123',
    getUserId: () => 'user-123'
}));

// Import globalErrorHandler to use it in the test app
import { globalErrorHandler } from '../../server/utils/errorHandling';

describe('FrameworkControlStatuses Routes', () => {
    let app: express.Express;

    beforeEach(() => {
        vi.clearAllMocks();
        app = express();
        app.use(express.json());
        registerFrameworkControlStatusesRoutes(app);
        // Add global error handler to catch throws from routes
        app.use(globalErrorHandler);
    });

    describe('GET /api/framework-control-statuses', () => {
        it('returns statuses for a framework', async () => {
            const mockStatuses = [
                { id: 1, controlId: 'ctrl-1', status: 'implemented' }
            ];

            const mockWhere = vi.fn().mockImplementation(() => ({
                orderBy: vi.fn().mockResolvedValue(mockStatuses)
            }));
            const mockFrom = vi.fn().mockImplementation(() => ({
                where: mockWhere
            }));
            (db.select as any).mockImplementation(() => ({
                from: mockFrom
            }));

            const response = await request(app)
                .get('/api/framework-control-statuses?framework=iso27001')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.statuses['ctrl-1']).toBeDefined();
            expect(db.select).toHaveBeenCalled();
        });

        it('returns 400 if framework is missing', async () => {
            await request(app)
                .get('/api/framework-control-statuses')
                .expect(400);
        });
    });

    describe('PUT /api/framework-control-statuses/:controlId', () => {
        it('updates existing status', async () => {
            // Mock check for existing
            const mockWhereExisting = vi.fn().mockImplementation(() => ({
                limit: vi.fn().mockResolvedValue([{ id: 1, controlId: 'ctrl-1' }])
            }));
            const mockFromExisting = vi.fn().mockImplementation(() => ({
                where: mockWhereExisting
            }));

            // Mock update
            const mockReturning = vi.fn().mockResolvedValue([{ id: 1, controlId: 'ctrl-1', status: 'implemented' }]);
            const mockWhereUpdate = vi.fn().mockImplementation(() => ({
                returning: mockReturning
            }));
            const mockSet = vi.fn().mockImplementation(() => ({
                where: mockWhereUpdate
            }));

            (db.select as any).mockImplementation(() => ({ from: mockFromExisting }));
            (db.update as any).mockImplementation(() => ({ set: mockSet }));

            const response = await request(app)
                .put('/api/framework-control-statuses/ctrl-1')
                .send({ framework: 'iso27001', status: 'implemented' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(db.update).toHaveBeenCalled();
        });
    });

    describe('GET /api/framework-control-statuses/summary', () => {
        it('returns summary statistics', async () => {
            const mockStatuses = [
                { framework: 'iso27001', status: 'implemented' },
                { framework: 'iso27001', status: 'in_progress' }
            ];

            const mockWhere = vi.fn().mockResolvedValue(mockStatuses);
            const mockFrom = vi.fn().mockImplementation(() => ({
                where: mockWhere
            }));
            (db.select as any).mockImplementation(() => ({
                from: mockFrom
            }));

            const response = await request(app)
                .get('/api/framework-control-statuses/summary')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.summary.iso27001).toBeDefined();
            expect(response.body.data.summary.iso27001.total).toBe(2);
        });
    });
});

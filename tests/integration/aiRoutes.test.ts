import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerAIRoutes } from '../../server/routes/ai/index';
import { storage } from '../../server/storage';
import { aiOrchestrator } from '../../services/aiOrchestrator';
import { globalErrorHandler } from '../../server/utils/errorHandling';

// Mock Dependencies
vi.mock('../../server/storage', () => ({
    storage: {
        getCompanyProfiles: vi.fn(),
        createCompanyProfile: vi.fn(),
        getCompanyProfile: vi.fn(),
        createGenerationJob: vi.fn(),
        updateGenerationJob: vi.fn(),
        getGenerationJob: vi.fn(),
        createDocument: vi.fn(),
    }
}));

vi.mock('../../server/services/aiOrchestrator', () => ({
    aiOrchestrator: {
        generateComplianceDocuments: vi.fn(),
        analyzeComplianceGap: vi.fn(),
        chatWithAI: vi.fn(),
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

vi.mock('../../server/middleware/multiTenant', () => ({
    requireOrganization: (req: any, res: any, next: any) => {
        req.organizationId = 'org-123';
        next();
    }
}));

vi.mock('../../server/middleware/rateLimiter', () => ({
    validateAIRequestSize: (req: any, res: any, next: any) => next(),
    aiLimiter: (req: any, res: any, next: any) => next(),
}));

vi.mock('../../server/middleware/security', () => ({
    generationLimiter: (req: any, res: any, next: any) => next(),
}));

vi.mock('../../server/services/auditService', () => ({
    auditService: {
        logAction: vi.fn().mockResolvedValue({}),
    }
}));

vi.mock('../../server/monitoring/metrics', () => ({
    metricsCollector: {
        record: vi.fn(),
    }
}));

vi.mock('../../server/services/aiGuardrailsService', () => ({
    aiGuardrailsService: {
        checkPrompt: vi.fn().mockResolvedValue({ allowed: true }),
    }
}));

describe('AI Routes', () => {
    let app: express.Express;

    beforeEach(() => {
        vi.clearAllMocks();
        app = express();
        app.use(express.json());
        const aiRouter = express.Router();
        registerAIRoutes(aiRouter);
        app.use('/api/ai', aiRouter);
        app.use(globalErrorHandler);
    });

    describe('POST /api/ai/generate-compliance-docs', () => {
        it('starts a generation job', async () => {
            (storage.getCompanyProfiles as any).mockResolvedValue([{ id: 'cp-1' }]);
            (storage.createGenerationJob as any).mockResolvedValue({ id: 'job-1' });

            const response = await request(app)
                .post('/api/ai/generate-compliance-docs')
                .send({
                    companyInfo: { companyName: 'Test' },
                    frameworks: ['iso27001']
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.jobId).toBe('job-1');
        });
    });

    describe('GET /api/ai/generation-jobs/:id', () => {
        it('returns job status', async () => {
            (storage.getGenerationJob as any).mockResolvedValue({ id: 'job-1', companyProfileId: 'cp-1' });
            (storage.getCompanyProfile as any).mockResolvedValue({ id: 'cp-1', organizationId: 'org-123' });

            const response = await request(app)
                .get('/api/ai/generation-jobs/job-1')
                .expect(200);

            expect(response.body.data.id).toBe('job-1');
        });

        it('returns 404 for non-existent job', async () => {
            (storage.getGenerationJob as any).mockResolvedValue(null);

            await request(app)
                .get('/api/ai/generation-jobs/job-none')
                .expect(404);
        });
    });
});

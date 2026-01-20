
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerGapAnalysisRoutes } from '../../server/routes/gapAnalysis';
import { storage } from '../../server/storage';
import { globalErrorHandler } from '../../server/utils/errorHandling';

// Mock Dependencies
vi.mock('../../server/storage', () => ({
    storage: {
        getRemediationRecommendation: vi.fn(),
        getGapAnalysisFinding: vi.fn(),
        getGapAnalysisReport: vi.fn(),
        getGapAnalysisReports: vi.fn(),
        getGapAnalysisFindings: vi.fn(),
        getRemediationRecommendations: vi.fn(),
        getComplianceMaturityAssessment: vi.fn(),
        createGapAnalysisReport: vi.fn(),
        createGapAnalysisFinding: vi.fn(),
        createRemediationRecommendation: vi.fn(),
        updateGapAnalysisReport: vi.fn(),
        updateRemediationRecommendation: vi.fn(),
        createComplianceMaturityAssessment: vi.fn(),
        getCompanyProfiles: vi.fn(),
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
    },
}));

// Mock logger
vi.mock('../../server/utils/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    }
}));

describe('Gap Analysis Routes', () => {
    let app: express.Express;

    beforeEach(async () => {
        vi.clearAllMocks();
        app = express();
        app.use(express.json());
        const router = express.Router();
        registerGapAnalysisRoutes(router);
        app.use('/api/gap-analysis', router);
        app.use(globalErrorHandler);
    });

    describe('GET /api/gap-analysis', () => {
        it('returns all reports for an organization', async () => {
            const mockReports = [{ id: 'rep-1', framework: 'nist' }];
            (storage.getGapAnalysisReports as any).mockResolvedValue(mockReports);

            const response = await request(app)
                .get('/api/gap-analysis')
                .expect(200);

            expect(response.body.data).toEqual(mockReports);
        });
    });

    describe('GET /api/gap-analysis/:framework', () => {
        it('filters reports by framework', async () => {
            const mockReports = [
                { id: 'rep-1', framework: 'nist' },
                { id: 'rep-2', framework: 'iso' }
            ];
            (storage.getGapAnalysisReports as any).mockResolvedValue(mockReports);

            const response = await request(app)
                .get('/api/gap-analysis/nist')
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].id).toBe('rep-1');
        });
    });

    describe('GET /api/gap-analysis/reports/:id', () => {
        it('returns detailed report with findings and recommendations', async () => {
            const mockReport = { id: 'rep-1', organizationId: 'org-123', framework: 'nist', overallScore: 80 };
            const mockFindings = [{ id: 'f1', riskLevel: 'high', controlTitle: 'Title' }];
            const mockRecs = [{ id: 'r1', priority: 5 }];
            
            (storage.getGapAnalysisReport as any).mockResolvedValue(mockReport);
            (storage.getGapAnalysisFindings as any).mockResolvedValue(mockFindings);
            (storage.getRemediationRecommendations as any).mockResolvedValue(mockRecs);
            (storage.getComplianceMaturityAssessment as any).mockResolvedValue({ level: 3 });

            const response = await request(app)
                .get('/api/gap-analysis/reports/rep-1')
                .expect(200);

            expect(response.body.data.report.id).toBe('rep-1');
            expect(response.body.data.executiveSummary.highPriorityActions).toBe(1);
        });

        it('returns 404 if report belongs to another org', async () => {
            (storage.getGapAnalysisReport as any).mockResolvedValue({ id: 'rep-other', organizationId: 'other-org' });

            await request(app)
                .get('/api/gap-analysis/reports/rep-other')
                .expect(404);
        });
    });

    describe('POST /api/gap-analysis/generate', () => {
        it('starts gap analysis generation', async () => {
            (storage.getCompanyProfiles as any).mockResolvedValue([{ id: 'cp-1' }]);
            (storage.createGapAnalysisReport as any).mockResolvedValue({ id: 'rep-new' });

            const response = await request(app)
                .post('/api/gap-analysis/generate')
                .send({ framework: 'nist' })
                .expect(200);

            expect(response.body.data.reportId).toBe('rep-new');
            expect(response.body.data.message).toContain('started');
        });

        it('returns 400 if no company profile exists', async () => {
            (storage.getCompanyProfiles as any).mockResolvedValue([]);

            const response = await request(app)
                .post('/api/gap-analysis/generate')
                .send({ framework: 'nist' })
                .expect(400);

            expect(response.body.error.message).toContain('No company profile found');
        });
    });

    describe('PATCH /api/gap-analysis/recommendations/:id', () => {
        it('updates recommendation status if authorized', async () => {
            const mockRec = { id: 'rec-1', findingId: 'f1' };
            const mockFinding = { id: 'f1', reportId: 'rep-1' };
            const mockReport = { id: 'rep-1', organizationId: 'org-123' };

            (storage.getRemediationRecommendation as any).mockResolvedValue(mockRec);
            (storage.getGapAnalysisFinding as any).mockResolvedValue(mockFinding);
            (storage.getGapAnalysisReport as any).mockResolvedValue(mockReport);
            (storage.updateRemediationRecommendation as any).mockResolvedValue({ ...mockRec, status: 'completed' });

            const response = await request(app)
                .patch('/api/gap-analysis/recommendations/rec-1')
                .send({ status: 'completed' })
                .expect(200);

            expect(response.body.data.status).toBe('completed');
        });

        it('returns 404 if recommendation doesn\'t exist', async () => {
            (storage.getRemediationRecommendation as any).mockResolvedValue(null);

            await request(app)
                .patch('/api/gap-analysis/recommendations/rec-none')
                .send({ status: 'completed' })
                .expect(404);
        });
    });
});

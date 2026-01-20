
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

    describe("GET /api/gap-analysis/:framework", () => {
        it("filters reports by framework", async () => {
            (storage.getGapAnalysisReports as any).mockResolvedValue([
                { id: "1", framework: "NIST", organizationId: "org-1" },
                { id: "2", framework: "SOC2", organizationId: "org-1" }
            ]);

            const response = await request(app).get("/api/gap-analysis/NIST");

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].framework).toBe("NIST");
        });
    });

    describe("POST /api/gap-analysis", () => {
        it("returns 501 for the generic creation endpoint", async () => {
            const response = await request(app)
                .post("/api/gap-analysis")
                .send({ framework: "SOC2" });

            expect(response.status).toBe(501);
            expect(response.body.error.code).toBe("NOT_IMPLEMENTED");
        });

        it("returns 400 if framework is missing", async () => {
            const response = await request(app).post("/api/gap-analysis").send({});
            expect(response.status).toBe(400);
        });
    });

    describe("GET /api/gap-analysis/reports", () => {
        it("returns reports (alias route)", async () => {
            (storage.getGapAnalysisReports as any).mockResolvedValue([{ id: "1" }]);
            const response = await request(app).get("/api/gap-analysis/reports");
            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(1);
        });
    });

    describe("GET /api/gap-analysis/reports/:id", () => {
        it("returns detailed report with maturity assessment and executive summary", async () => {
            (storage.getGapAnalysisReport as any).mockResolvedValue({ 
                id: "rep-1", 
                organizationId: "org-123", 
                framework: "NIST",
                overallScore: 85
            });
            (storage.getGapAnalysisFindings as any).mockResolvedValue([
                { id: "f-1", riskLevel: "critical", controlTitle: "Access Control" }
            ]);
            (storage.getRemediationRecommendations as any).mockResolvedValue([
                { id: "r-1", priority: 5 }
            ]);
            (storage.getComplianceMaturityAssessment as any).mockResolvedValue({ level: 3 });

            const response = await request(app).get("/api/gap-analysis/reports/rep-1");

            expect(response.status).toBe(200);
            expect(response.body.data.executiveSummary.criticalGaps).toBe(1);
            expect(response.body.data.executiveSummary.highPriorityActions).toBe(1);
            expect(response.body.data.maturityAssessment).toBeDefined();
        });

        it("returns 404 if report belongs to another org", async () => {
            (storage.getGapAnalysisReport as any).mockResolvedValue({ id: "rep-1", organizationId: "org-other" });

            const response = await request(app).get("/api/gap-analysis/reports/rep-1");

            expect(response.status).toBe(404);
        });
    });

    describe("POST /api/gap-analysis/generate", () => {
        it("starts gap analysis generation and completes background processing", async () => {
            vi.useFakeTimers();
            (storage.getCompanyProfiles as any).mockResolvedValue([{ id: "cp-1" }]);
            (storage.createGapAnalysisReport as any).mockResolvedValue({ id: "rep-1", status: "in_progress", framework: "SOC2" });
            (storage.createGapAnalysisFinding as any).mockResolvedValue({ id: "f-1" });

            const response = await request(app)
                .post("/api/gap-analysis/generate")
                .send({ framework: "SOC2", includeMaturityAssessment: true });

            expect(response.status).toBe(200);
            expect(response.body.data.message).toContain("started");

            // Run timers to trigger background processing
            await vi.runAllTimersAsync();
            
            // Verify background calls were made
            expect(storage.createGapAnalysisFinding).toHaveBeenCalled();
            expect(storage.updateGapAnalysisReport).toHaveBeenCalledWith("rep-1", expect.objectContaining({
                status: 'completed'
            }));
            
            vi.useRealTimers();
        });

        it("returns 400 if no company profile exists", async () => {
            (storage.getCompanyProfiles as any).mockResolvedValue([]);

            const response = await request(app)
                .post("/api/gap-analysis/generate")
                .send({ framework: "SOC2" });

            expect(response.status).toBe(400);
            expect(response.body.error.message).toContain("No company profile found");
        });
    });

    describe("PATCH /api/gap-analysis/recommendations/:id", () => {
        it("updates recommendation status to completed and sets date", async () => {
            (storage.getRemediationRecommendation as any).mockResolvedValue({ id: "r-1", findingId: "f-1" });
            (storage.getGapAnalysisFinding as any).mockResolvedValue({ id: "f-1", reportId: "rep-1" });
            (storage.getGapAnalysisReport as any).mockResolvedValue({ id: "rep-1", organizationId: "org-123" });
            (storage.updateRemediationRecommendation as any).mockResolvedValue({ id: "r-1", status: "completed" });

            const response = await request(app)
                .patch("/api/gap-analysis/recommendations/r-1")
                .send({ status: "completed" });

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe("completed");
        });

        it("returns 404 if recommendation doesn't exist", async () => {
            (storage.getRemediationRecommendation as any).mockResolvedValue(null);

            const response = await request(app)
                .patch("/api/gap-analysis/recommendations/r-1")
                .send({ status: "in_progress" });

            expect(response.status).toBe(404);
        });

        it("returns 404 if finding doesn't exist", async () => {
            (storage.getRemediationRecommendation as any).mockResolvedValue({ id: "r-1", findingId: "f-1" });
            (storage.getGapAnalysisFinding as any).mockResolvedValue(null);

            const response = await request(app)
                .patch("/api/gap-analysis/recommendations/r-1")
                .send({ status: "in_progress" });

            expect(response.status).toBe(404);
        });
    });
});

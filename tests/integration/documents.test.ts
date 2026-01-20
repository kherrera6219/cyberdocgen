import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerDocumentsRoutes } from '../../server/routes/documents';
import { storage } from '../../server/storage';
import { versionService } from '../../server/services/versionService';
import { aiOrchestrator } from '../../server/services/aiOrchestrator';
import * as multiTenantMock from '../../server/middleware/multiTenant';
import { globalErrorHandler } from '../../server/utils/errorHandling';

// Mock Dependencies
vi.mock('../../server/storage', () => ({
    storage: {
        getDocuments: vi.fn(),
        getDocumentsByCompanyProfile: vi.fn(),
        getDocumentsByFramework: vi.fn(),
        getDocument: vi.fn(),
        getCompanyProfile: vi.fn(),
        getCompanyProfiles: vi.fn(),
        getDocumentVersions: vi.fn(),
        createDocument: vi.fn(),
        updateDocument: vi.fn(),
        deleteDocument: vi.fn(),
    }
}));

vi.mock('../../server/db', () => ({
    db: {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
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
    getDocumentWithOrgCheck: vi.fn(),
    getCompanyProfileWithOrgCheck: vi.fn(),
}));

vi.mock('../../server/middleware/mfa', () => ({
    requireMFA: (req: any, res: any, next: any) => next(),
    enforceMFATimeout: (req: any, res: any, next: any) => next(),
}));

vi.mock('../../server/services/versionService', () => ({
    versionService: {
        getVersionHistory: vi.fn(),
        createVersion: vi.fn(),
        restoreVersion: vi.fn(),
        compareVersions: vi.fn(),
    }
}));

vi.mock('../../server/services/aiOrchestrator', () => ({
    aiOrchestrator: {
        generateDocument: vi.fn(),
    }
}));

// Mock logger
vi.mock('../../server/utils/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    }
}));

describe('Documents Routes', () => {
    let app: express.Express;

    beforeEach(async () => {
        vi.clearAllMocks();
        app = express();
        app.use(express.json());
        // Mount at /api/documents to match the real application structure
        const documentsRouter = express.Router();
        await registerDocumentsRoutes(documentsRouter);
        app.use('/api/documents', documentsRouter);
        app.use(globalErrorHandler);
    });

    describe('GET /api/documents', () => {
        it('returns all documents for an organization', async () => {
            const mockDocs = [{ id: 'doc-1', title: 'Doc 1' }];
            (storage.getDocuments as any).mockResolvedValue(mockDocs);

            const response = await request(app)
                .get('/api/documents')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockDocs);
        });

        it('filters by companyProfileId with check', async () => {
            const { getCompanyProfileWithOrgCheck } = await import('../../server/middleware/multiTenant');
            (getCompanyProfileWithOrgCheck as any).mockResolvedValue({ authorized: true });
            (storage.getDocumentsByCompanyProfile as any).mockResolvedValue([{ id: 'doc-1' }]);

            await request(app)
                .get('/api/documents?companyProfileId=cp-1')
                .expect(200);

            expect(getCompanyProfileWithOrgCheck).toHaveBeenCalledWith('cp-1', 'org-123');
        });

        it('returns 404 if company profile is not authorized', async () => {
            const { getCompanyProfileWithOrgCheck } = await import('../../server/middleware/multiTenant');
            (getCompanyProfileWithOrgCheck as any).mockResolvedValue({ authorized: false });

            await request(app)
                .get('/api/documents?companyProfileId=cp-1')
                .expect(404);
        });
    });

    describe('GET /api/documents/:id', () => {
        it('returns document if authorized', async () => {
            const { getDocumentWithOrgCheck } = await import('../../server/middleware/multiTenant');
            (getDocumentWithOrgCheck as any).mockResolvedValue({ 
                authorized: true, 
                document: { id: 'doc-1', title: 'Doc 1' } 
            });

            const response = await request(app)
                .get('/api/documents/doc-1')
                .expect(200);

            expect(response.body.data.id).toBe('doc-1');
        });

        it('returns 404 if not authorized', async () => {
            const { getDocumentWithOrgCheck } = await import('../../server/middleware/multiTenant');
            (getDocumentWithOrgCheck as any).mockResolvedValue({ authorized: false });

            await request(app)
                .get('/api/documents/doc-1')
                .expect(404);
        });
    });

    describe('POST /api/documents', () => {
        it('creates a new document', async () => {
            const docData = {
                title: 'New Doc',
                content: 'Content',
                framework: 'iso27001',
                category: 'policy',
                companyProfileId: 'cp-1',
                createdBy: 'user-123'
            };
            const { getCompanyProfileWithOrgCheck } = await import('../../server/middleware/multiTenant');
            (getCompanyProfileWithOrgCheck as any).mockResolvedValue({ authorized: true });
            (storage.createDocument as any).mockResolvedValue({ id: 'doc-new', ...docData });

            const response = await request(app)
                .post('/api/documents')
                .send(docData)
                .expect(201);

            expect(response.body.data.id).toBe('doc-new');
        });
    });

    describe('POST /api/documents/generate', () => {
        it('generates a document content', async () => {
            (multiTenantMock.getCompanyProfileWithOrgCheck as any).mockResolvedValue({ authorized: true });
            (storage.createDocument as any).mockResolvedValue({ id: 'doc-gen' });

            const response = await request(app)
                .post('/api/documents/generate')
                .send({
                    framework: 'iso27001',
                    category: 'policy',
                    title: 'Policy',
                    companyProfileId: 'cp-1'
                })
                .expect(200);

            expect(response.body.data.id).toBe('doc-gen');
        });

        it('returns 400 if required fields are missing', async () => {
            await request(app)
                .post('/api/documents/generate')
                .send({ framework: 'iso27001' })
                .expect(400);
        });
    });

    describe('GET /api/documents/:id/versions', () => {
        it('returns versions if authorized', async () => {
            (multiTenantMock.getDocumentWithOrgCheck as any).mockResolvedValue({ authorized: true, document: { id: 'doc-1' } });
            (versionService.getVersionHistory as any).mockResolvedValue([{ versionNumber: 1 }]);

            const response = await request(app)
                .get('/api/documents/doc-1/versions')
                .expect(200);

            expect(response.body.data).toHaveLength(1);
        });
    });

    describe('POST /api/documents/:id/versions/:versionId/restore', () => {
        it('restores a version and returns success', async () => {
            (multiTenantMock.getDocumentWithOrgCheck as any).mockResolvedValue({ authorized: true, document: { id: 'doc-1' } });
            (versionService.restoreVersion as any).mockResolvedValue({ id: 'ver-1' });

            const response = await request(app)
                .post('/api/documents/doc-1/versions/1/restore')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.version).toBeDefined();
        });
    });

    describe('GET /api/documents/:id/approvals', () => {
        it('returns mock approvals for a document', async () => {
            (multiTenantMock.getDocumentWithOrgCheck as any).mockResolvedValue({ authorized: true, document: { id: 'doc-1' } });

            const response = await request(app)
                .get('/api/documents/doc-1/approvals')
                .expect(200);

            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data[0].id).toContain('approval');
        });
    });

    describe('POST /api/documents/generate-single', () => {
        it('generates a single document using AI orchestrator', async () => {
            (multiTenantMock.getCompanyProfileWithOrgCheck as any).mockResolvedValue({ authorized: true });
            (storage.getCompanyProfile as any).mockResolvedValue({ id: 'cp-1' });
            (aiOrchestrator.generateDocument as any).mockResolvedValue({ content: 'AI Content', model: 'gpt-4' });
            (storage.createDocument as any).mockResolvedValue({ id: 'doc-ai' });

            const response = await request(app)
                .post('/api/documents/generate-single')
                .send({
                    companyProfileId: 'cp-1',
                    framework: 'nist',
                    template: { title: 'T', category: 'C' }
                })
                .expect(200);

            expect(response.body.data.document.id).toBe('doc-ai');
        });
    });

    describe('GET /api/documents/:id/history', () => {
        it('returns version history if authorized', async () => {
            (multiTenantMock.getDocumentWithOrgCheck as any).mockResolvedValue({ authorized: true, document: { id: 'doc-1' } });
            (storage.getDocumentVersions as any).mockResolvedValue([{ id: 'v1' }]);

            const response = await request(app)
                .get('/api/documents/doc-1/history')
                .expect(200);

            expect(response.body.data.versions).toHaveLength(1);
        });

        it('returns success message if no history found', async () => {
            (multiTenantMock.getDocumentWithOrgCheck as any).mockResolvedValue({ authorized: true, document: { id: 'doc-empty' } });
            (storage.getDocumentVersions as any).mockResolvedValue([]);

            const response = await request(app)
                .get('/api/documents/doc-empty/history')
                .expect(200);

            expect(response.body.data.message).toContain('No version history');
        });
    });

    describe("PUT /api/documents/:id", () => {
        it("updates document if authorized", async () => {
            const mockDoc = { id: "doc-1", companyProfileId: "cp-1" };
            (multiTenantMock.getDocumentWithOrgCheck as any).mockResolvedValue({
                authorized: true,
                document: mockDoc
            });
            (storage.updateDocument as any).mockResolvedValue({ ...mockDoc, title: "Updated" });

            const response = await request(app)
                .put("/api/documents/doc-1")
                .send({ title: "Updated", category: "policy", framework: "nist" });

            expect(response.status).toBe(200);
            expect(response.body.data.title).toBe("Updated");
        });

        it("returns 404 for cross-tenant update attempt", async () => {
            (multiTenantMock.getDocumentWithOrgCheck as any).mockResolvedValue({
                authorized: false
            });

            const response = await request(app)
                .put("/api/documents/doc-1")
                .send({ title: "Updated" });

            expect(response.status).toBe(404);
        });

        it("returns 400 for invalid company profile reassignment", async () => {
            const mockDoc = { id: "doc-1", companyProfileId: "cp-1" };
            (multiTenantMock.getDocumentWithOrgCheck as any).mockResolvedValue({
                authorized: true,
                document: mockDoc
            });
            (multiTenantMock.getCompanyProfileWithOrgCheck as any).mockResolvedValue({
                authorized: false
            });

            const response = await request(app)
                .put("/api/documents/doc-1")
                .send({ companyProfileId: "cp-other", title: "Updated" });

            expect(response.status).toBe(400);
            expect(response.body.error.message).toContain("Invalid company profile");
        });
    });

    describe("DELETE /api/documents/:id", () => {
        it("deletes document if authorized", async () => {
            (multiTenantMock.getDocumentWithOrgCheck as any).mockResolvedValue({
                authorized: true,
                document: { id: "doc-1" }
            });
            (storage.deleteDocument as any).mockResolvedValue(true);

            const response = await request(app).delete("/api/documents/doc-1");

            expect(response.status).toBe(204);
        });

        it("returns 404 if deletion fails (not found in storage)", async () => {
            (multiTenantMock.getDocumentWithOrgCheck as any).mockResolvedValue({
                authorized: true,
                document: { id: "doc-1" }
            });
            (storage.deleteDocument as any).mockResolvedValue(false);

            const response = await request(app).delete("/api/documents/doc-1");

            expect(response.status).toBe(404);
        });
    });

    describe("POST /api/documents/upload-and-extract", () => {
        it("successfully extracts data from mock upload", async () => {
            const response = await request(app).post("/api/documents/upload-and-extract");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.extractedData).toBeDefined();
        });
    });

    describe("POST /api/documents/:id/versions", () => {
        it("creates a new version successfully", async () => {
            (multiTenantMock.getDocumentWithOrgCheck as any).mockResolvedValue({
                authorized: true,
                document: { id: "doc-1" }
            });
            (versionService.createVersion as any).mockResolvedValue({ id: 1, version: 1 });

            const response = await request(app)
                .post("/api/documents/doc-1/versions")
                .send({ title: "V2", content: "New Content", changes: "Bugfix" });

            expect(response.status).toBe(200);
            expect(response.body.data.message).toContain("successfully");
        });

        it("returns 400 if title or content is missing", async () => {
            const response = await request(app)
                .post("/api/documents/doc-1/versions")
                .send({ changes: "Missing fields" });

            expect(response.status).toBe(400);
        });
    });

    describe("GET /api/documents/:id/versions/:v1/compare/:v2", () => {
        it("compares two versions successfully", async () => {
            (multiTenantMock.getDocumentWithOrgCheck as any).mockResolvedValue({
                authorized: true,
                document: { id: "doc-1" }
            });
            (versionService.compareVersions as any).mockResolvedValue({ diff: "Mock Diff" });

            const response = await request(app).get("/api/documents/doc-1/versions/1/compare/2");

            expect(response.status).toBe(200);
            expect(response.body.data.diff).toBe("Mock Diff");
        });
    });

    describe("POST /api/documents/:id/approvals", () => {
        it("submits an approval request", async () => {
            (multiTenantMock.getDocumentWithOrgCheck as any).mockResolvedValue({
                authorized: true,
                document: { id: "doc-1" }
            });

            const response = await request(app)
                .post("/api/documents/doc-1/approvals")
                .send({ approverRole: "ciso" });

            expect(response.status).toBe(200);
            expect(response.body.data.message).toContain("submitted successfully");
        });
    });
});

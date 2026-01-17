import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerDocumentsRoutes } from '../../server/routes/documents';
import { storage } from '../../server/storage';
import { globalErrorHandler } from '../../server/utils/errorHandling';

// Mock Dependencies
vi.mock('../../server/storage', () => ({
    storage: {
        getDocuments: vi.fn(),
        getDocumentsByCompanyProfile: vi.fn(),
        getDocumentsByFramework: vi.fn(),
        getDocument: vi.fn(),
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
            const { getCompanyProfileWithOrgCheck } = await import('../../server/middleware/multiTenant');
            (getCompanyProfileWithOrgCheck as any).mockResolvedValue({ authorized: true });
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
    });

    describe('GET /api/documents/:id/versions', () => {
        it('returns versions if authorized', async () => {
            const { getDocumentWithOrgCheck } = await import('../../server/middleware/multiTenant');
            const { versionService } = await import('../../server/services/versionService');
            
            (getDocumentWithOrgCheck as any).mockResolvedValue({ authorized: true, document: { id: 'doc-1' } });
            (versionService.getVersionHistory as any).mockResolvedValue([{ versionNumber: 1 }]);

            const response = await request(app)
                .get('/api/documents/doc-1/versions')
                .expect(200);

            expect(response.body.data).toHaveLength(1);
        });
    });
});

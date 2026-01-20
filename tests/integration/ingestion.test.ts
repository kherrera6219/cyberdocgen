import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { registerEvidenceRoutes } from '../../server/routes/evidence';

const { mockSnapshotService, mockIngestionService, mockAuditService } = vi.hoisted(() => {
  return {
    mockSnapshotService: {
      createSnapshot: vi.fn(),
      getSnapshots: vi.fn(),
      lockSnapshot: vi.fn(),
    },
    mockIngestionService: {
      ingestFile: vi.fn(),
    },
    mockAuditService: {
      logAction: vi.fn(),
    }
  }
});

// Mock Dependencies
vi.mock('../../server/services/snapshotService', () => ({
  snapshotService: mockSnapshotService
}));

vi.mock('../../server/services/ingestionService', () => ({
  ingestionService: mockIngestionService
}));

vi.mock('../../server/services/auditService', () => ({
  auditService: mockAuditService,
  AuditAction: { CREATE: 'CREATE' }
}));

// Mock Middleware
vi.mock('../../server/replitAuth', () => ({
  isAuthenticated: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id' };
    next();
  },
  getRequiredUserId: () => 'test-user-id'
}));

vi.mock('../../server/middleware/multiTenant', () => ({
  requireOrganization: (req: any, res: any, next: any) => {
    req.organizationId = 'test-org-id';
    next();
  }
}));

// Mock Error Handling to avoid complex imports
vi.mock('../../server/utils/errorHandling', () => ({
  secureHandler: (fn: any) => async (req: any, res: any, next: any) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  },
  validateInput: (schema: any) => (req: any, res: any, next: any) => next(),
  ValidationError: class extends Error { constructor(msg: string) { super(msg); (this as any).status = 400; } },
  AppError: class extends Error { constructor(msg: string, status: number) { super(msg); (this as any).status = status; } },
  NotFoundError: class extends Error { constructor(msg: string) { super(msg); (this as any).status = 404; } }
}));

describe('Evidence Ingestion Integration', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    registerEvidenceRoutes(app);
    vi.clearAllMocks();
  });

  describe('POST /api/evidence/snapshots', () => {
    it('creates a new snapshot successfully', async () => {
      mockSnapshotService.createSnapshot.mockResolvedValue({
        id: 'snap-123',
        name: 'Q1 Audit',
        status: 'open'
      });

      const response = await request(app)
        .post('/api/evidence/snapshots')
        .send({ name: 'Q1 Audit' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('snap-123');
      expect(mockSnapshotService.createSnapshot).toHaveBeenCalledWith('test-org-id', 'Q1 Audit');
    });

    it('returns 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/evidence/snapshots')
        .send({});

      expect(response.status).toBe(400); // Handled by secureHandler -> error handling mock
    });
  });

  describe('POST /api/evidence/upload', () => {
    it('uploads evidence successfully with snapshot context', async () => {
      mockIngestionService.ingestFile.mockResolvedValue({
        id: 'file-123',
        fileName: 'policy.pdf',
        snapshotId: 'snap-123',
        status: 'pending'
      });

      const response = await request(app)
        .post('/api/evidence/upload')
        .send({
          fileName: 'policy.pdf',
          fileData: 'base64data',
          snapshotId: 'snap-123',
          category: 'Company Profile'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockIngestionService.ingestFile).toHaveBeenCalledWith(expect.objectContaining({
        fileName: 'policy.pdf',
        snapshotId: 'snap-123',
        organizationId: 'test-org-id',
        userId: 'test-user-id'
      }));
      expect(mockAuditService.logAction).toHaveBeenCalled();
    });

    it('fails if snapshotId is missing', async () => {
      const response = await request(app)
        .post('/api/evidence/upload')
        .send({
            fileName: 'policy.pdf',
            fileData: 'base64data',
            // snapshotId missing
        });

        expect(response.status).toBe(400);
    });
  });

  describe('POST /api/evidence/snapshots/:id/lock', () => {
      it('locks a snapshot', async () => {
          mockSnapshotService.lockSnapshot.mockResolvedValue({
              id: 'snap-123',
              status: 'locked'
          });

          const response = await request(app)
            .post('/api/evidence/snapshots/snap-123/lock');

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          expect(mockSnapshotService.lockSnapshot).toHaveBeenCalledWith('snap-123', 'test-org-id');
      });
  });
});

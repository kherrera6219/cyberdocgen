/**
 * Repository Analysis API Routes
 * 
 * Endpoints:
 * POST   /api/repository/upload - Upload and extract repository ZIP
 * GET    /api/repository/:id - Get snapshot details
 * GET    /api/repository - List snapshots
 * DELETE /api/repository/:id - Delete snapshot
 * 
 * POST   /api/repository/:id/analyze - Start analysis
 * GET    /api/repository/:id/analysis - Get analysis status
 * 
 * GET    /api/repository/:id/findings - List findings
 * PATCH  /api/repository/:id/findings/:findingId - Review finding
 * 
 * GET    /api/repository/:id/tasks - List tasks
 * PATCH  /api/repository/:id/tasks/:taskId - Update task
 */

import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { db } from '../db';
import { repositoryAnalysisRuns, repositorySnapshots, repositoryTasks } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { MultiTenantRequest } from '../middleware/multiTenant';
import {
  secureHandler,
  validateInput,
  validateParams,
  requireAuth,
  requireResource,
  createSuccessResponse,
  commonSchemas,
  ForbiddenError,
} from '../utils/errorHandling';
import { repoParserService } from '../services/repoParserService';
import { repoAnalysisService } from '../services/repoAnalysisService';
import { repositoryFindingsService } from '../services/repositoryFindingsService';

const router = Router();

function requireOrganizationContext(req: MultiTenantRequest): string {
  if (!req.organizationId) {
    throw new ForbiddenError('Organization context required', 'ORG_CONTEXT_REQUIRED');
  }
  return req.organizationId;
}

// Configure multer for file uploads using disk storage to avoid large in-memory buffers.
const MAX_REPOSITORY_UPLOAD_SIZE = 200 * 1024 * 1024; // 200MB
const uploadTempDir = path.join(os.tmpdir(), 'cyberdocgen', 'repository-uploads');

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdir(uploadTempDir, { recursive: true })
        .then(() => cb(null, uploadTempDir))
        .catch((error) => cb(error as Error, uploadTempDir));
    },
    filename: (_req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase() || '.zip';
      cb(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
    },
  }),
  limits: {
    fileSize: MAX_REPOSITORY_UPLOAD_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only .zip files are allowed'));
    }
  },
});

// Validation schemas
const uploadSchema = z.object({
  organizationId: z.string().uuid(),
  companyProfileId: z.string().uuid(),
  name: z.string().min(1).max(200),
});

const analyzeSchema = z.object({
  frameworks: z.array(z.enum(['SOC2', 'ISO27001', 'NIST80053', 'FedRAMP'])).min(1),
  depth: z.enum(['structure_only', 'security_relevant', 'full']).default('security_relevant'),
});

const reviewFindingSchema = z.object({
  status: z.enum(['pass', 'partial', 'fail', 'not_observed', 'needs_human']).optional(),
  humanOverride: z.object({
    originalStatus: z.string(),
    newStatus: z.string(),
    reason: z.string(),
    evidence: z.string().optional(),
  }).optional(),
});

const updateTaskSchema = z.object({
  status: z.enum(['open', 'in_progress', 'completed', 'dismissed']).optional(),
  assignedToRole: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

/**
 * POST /api/repository/upload
 * Upload and extract a repository ZIP file
 */
router.post(
  '/upload',
  upload.single('file'),
  validateInput(uploadSchema),
  secureHandler(async (req: MultiTenantRequest, res) => {
    const userId = requireAuth(req);
    const organizationId = requireOrganizationContext(req);
    const { organizationId: bodyOrganizationId, companyProfileId, name } = req.body;
    const file = req.file;

    requireResource(file, 'File');

    if (bodyOrganizationId !== organizationId) {
      throw new ForbiddenError('Cross-organization snapshot upload is not allowed', 'CROSS_TENANT_ACCESS');
    }

    const uploadedFilePath = file.path;
    try {
      // Upload and extract
      const result = await repoParserService.uploadAndExtract(
        { filePath: uploadedFilePath, fileSize: file.size },
        file.originalname,
        organizationId,
        companyProfileId,
        userId,
        name
      );

      // Generate manifest
      const manifest = await repoParserService.generateManifest(
        result.snapshotId,
        result.extractedPath
      );

      // Detect technologies
      await repoParserService.detectTechnologies(result.snapshotId, manifest.files);

      // Index files into database
      await repoParserService.indexFiles(result.snapshotId, manifest.files);

      res.status(201).json(createSuccessResponse({
        snapshotId: result.snapshotId,
        extractedPath: result.extractedPath,
        fileCount: result.fileCount,
        manifestHash: manifest.manifestHash,
      }, req.requestId));
    } finally {
      // Best-effort cleanup of uploaded archive from temp storage.
      await fs.unlink(uploadedFilePath).catch(() => undefined);
    }
  }, {
    audit: {
      action: 'create',
      entityType: 'repository_snapshot',
      getEntityId: (req) => req.body.snapshotId,
    },
  })
);

/**
 * GET /api/repository
 * List repository snapshots
 */
router.get(
  '/',
  secureHandler(async (req: MultiTenantRequest, res) => {
    requireAuth(req);
    const organizationId = requireOrganizationContext(req);
    
    const snapshots = await db.select()
      .from(repositorySnapshots)
      .where(eq(repositorySnapshots.organizationId, organizationId))
      .orderBy(desc(repositorySnapshots.createdAt))
      .limit(50);

    res.json(createSuccessResponse({ snapshots }, req.requestId));
  })
);

/**
 * GET /api/repository/:id
 * Get snapshot details
 */
router.get(
  '/:id',
  validateParams(commonSchemas.uuid),
  secureHandler(async (req: MultiTenantRequest, res) => {
    requireAuth(req);
    const organizationId = requireOrganizationContext(req);
    const { id } = req.params;

    const [snapshot] = await db.select()
      .from(repositorySnapshots)
      .where(and(
        eq(repositorySnapshots.id, id),
        eq(repositorySnapshots.organizationId, organizationId)
      ));

    requireResource(snapshot, 'Repository snapshot');

    res.json(createSuccessResponse({ snapshot }, req.requestId));
  })
);

/**
 * POST /api/repository/:id/analyze
 * Start repository analysis
 */
router.post(
  '/:id/analyze',
  validateParams(commonSchemas.uuid),
  validateInput(analyzeSchema),
  secureHandler(async (req: MultiTenantRequest, res) => {
    const userId = requireAuth(req);
    const organizationId = requireOrganizationContext(req);
    const { id: snapshotId } = req.params;
    const { frameworks, depth } = req.body;

    // Get snapshot to verify org ID
    const [snapshot] = await db.select()
      .from(repositorySnapshots)
      .where(and(
        eq(repositorySnapshots.id, snapshotId),
        eq(repositorySnapshots.organizationId, organizationId)
      ));

    requireResource(snapshot, 'Repository snapshot');

    const result = await repoAnalysisService.startAnalysis(
      snapshotId,
      frameworks,
      depth,
      snapshot.organizationId,
      userId
    );

    res.status(202).json(createSuccessResponse({
      runId: result.runId,
      message: 'Analysis started',
    }, req.requestId));
  }, {
    audit: {
      action: 'create',
      entityType: 'repository_analysis',
      getEntityId: (req) => req.params.id,
    },
  })
);

/**
 * GET /api/repository/:id/analysis
 * Get analysis status
 */
router.get(
  '/:id/analysis',
  validateParams(commonSchemas.uuid),
  secureHandler(async (req: MultiTenantRequest, res) => {
    requireAuth(req);
    const organizationId = requireOrganizationContext(req);
    const { id: snapshotId } = req.params;

    // Get snapshot for org ID
    const [snapshot] = await db.select()
      .from(repositorySnapshots)
      .where(and(
        eq(repositorySnapshots.id, snapshotId),
        eq(repositorySnapshots.organizationId, organizationId)
      ));

    requireResource(snapshot, 'Repository snapshot');

    // Get latest analysis run
    const [run] = await db.select()
      .from(repositoryAnalysisRuns)
      .where(eq(repositoryAnalysisRuns.snapshotId, snapshotId))
      .orderBy(desc(repositoryAnalysisRuns.createdAt))
      .limit(1);

    res.json(createSuccessResponse({
      analysisRun: run || null,
      snapshot: {
        status: snapshot.status,
        analysisPhase: snapshot.analysisPhase,
      },
    }, req.requestId));
  })
);

/**
 * GET /api/repository/:id/findings
 * List findings for a snapshot
 */
router.get(
  '/:id/findings',
  validateParams(commonSchemas.uuid),
  secureHandler(async (req: MultiTenantRequest, res) => {
    requireAuth(req);
    const organizationId = requireOrganizationContext(req);
    const { id: snapshotId } = req.params;

    // Get snapshot for org ID
    const [snapshot] = await db.select()
      .from(repositorySnapshots)
      .where(and(
        eq(repositorySnapshots.id, snapshotId),
        eq(repositorySnapshots.organizationId, organizationId)
      ));

    requireResource(snapshot, 'Repository snapshot');

    const filters = {
      framework: req.query.framework as string | undefined,
      status: req.query.status as string | undefined,
      confidenceLevel: req.query.confidenceLevel as string | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };

    const result = await repositoryFindingsService.getFindings(
      snapshotId,
      snapshot.organizationId,
      filters
    );

    const summary = await repositoryFindingsService.getFindingsSummary(
      snapshotId,
      snapshot.organizationId
    );

    res.json(createSuccessResponse({
      ...result,
      summary,
    }, req.requestId));
  })
);

/**
 * PATCH /api/repository/:id/findings/:findingId
 * Review/override a finding
 */
router.patch(
  '/:id/findings/:findingId',
  validateParams(z.object({
    id: z.string().uuid(),
    findingId: z.string().uuid(),
  })),
  validateInput(reviewFindingSchema),
  secureHandler(async (req: MultiTenantRequest, res) => {
    const userId = requireAuth(req);
    const organizationId = requireOrganizationContext(req);
    const { id: snapshotId, findingId } = req.params;

    // Get snapshot for org ID
    const [snapshot] = await db.select()
      .from(repositorySnapshots)
      .where(and(
        eq(repositorySnapshots.id, snapshotId),
        eq(repositorySnapshots.organizationId, organizationId)
      ));

    requireResource(snapshot, 'Repository snapshot');

    const updated = await repositoryFindingsService.reviewFinding(
      findingId,
      snapshot.organizationId,
      userId,
      req.body
    );

    res.json(createSuccessResponse({ finding: updated }, req.requestId));
  }, {
    audit: {
      action: 'update',
      entityType: 'repository_finding',
      getEntityId: (req) => req.params.findingId,
    },
  })
);

/**
 * GET /api/repository/:id/tasks
 * List tasks for a snapshot
 */
router.get(
  '/:id/tasks',
  validateParams(commonSchemas.uuid),
  secureHandler(async (req: MultiTenantRequest, res) => {
    requireAuth(req);
    const organizationId = requireOrganizationContext(req);
    const { id: snapshotId } = req.params;

    const [snapshot] = await db.select()
      .from(repositorySnapshots)
      .where(and(
        eq(repositorySnapshots.id, snapshotId),
        eq(repositorySnapshots.organizationId, organizationId)
      ));

    requireResource(snapshot, 'Repository snapshot');

    const tasks = await db.select()
      .from(repositoryTasks)
      .where(eq(repositoryTasks.snapshotId, snapshotId))
      .orderBy(desc(repositoryTasks.createdAt));

    res.json(createSuccessResponse({ tasks }, req.requestId));
  })
);

/**
 * PATCH /api/repository/:id/tasks/:taskId
 * Update task status
 */
router.patch(
  '/:id/tasks/:taskId',
  validateParams(z.object({
    id: z.string().uuid(),
    taskId: z.string().uuid(),
  })),
  validateInput(updateTaskSchema),
  secureHandler(async (req: MultiTenantRequest, res) => {
    const userId = requireAuth(req);
    const organizationId = requireOrganizationContext(req);
    const { id: snapshotId, taskId } = req.params;

    const [snapshot] = await db.select()
      .from(repositorySnapshots)
      .where(and(
        eq(repositorySnapshots.id, snapshotId),
        eq(repositorySnapshots.organizationId, organizationId)
      ));

    requireResource(snapshot, 'Repository snapshot');

    const updates: any = { ...req.body, updatedAt: new Date() };

    if (req.body.status === 'completed') {
      updates.completedAt = new Date();
      updates.completedBy = userId;
    }

    const [updated] = await db.update(repositoryTasks)
      .set(updates)
      .where(and(
        eq(repositoryTasks.id, taskId),
        eq(repositoryTasks.snapshotId, snapshotId)
      ))
      .returning();

    requireResource(updated, 'Repository task');

    res.json(createSuccessResponse({ task: updated }, req.requestId));
  }, {
    audit: {
      action: 'update',
      entityType: 'repository_task',
      getEntityId: (req) => req.params.taskId,
    },
  })
);

/**
 * DELETE /api/repository/:id
 * Delete a repository snapshot
 */
router.delete(
  '/:id',
  validateParams(commonSchemas.uuid),
  secureHandler(async (req: MultiTenantRequest, res) => {
    const userId = requireAuth(req);
    const organizationId = requireOrganizationContext(req);
    const { id: snapshotId } = req.params;

    const [snapshot] = await db.select()
      .from(repositorySnapshots)
      .where(and(
        eq(repositorySnapshots.id, snapshotId),
        eq(repositorySnapshots.organizationId, organizationId)
      ));

    requireResource(snapshot, 'Repository snapshot');

    // Delete findings (cascade will handle tasks)
    await repositoryFindingsService.deleteSnapshotFindings(
      snapshotId,
      snapshot.organizationId,
      userId
    );

    // Delete snapshot (cascade will handle files, runs, docs)
    await db.delete(repositorySnapshots)
      .where(and(
        eq(repositorySnapshots.id, snapshotId),
        eq(repositorySnapshots.organizationId, organizationId)
      ));

    res.json(createSuccessResponse({
      message: 'Repository snapshot deleted',
    }, req.requestId));
  }, {
    audit: {
      action: 'delete',
      entityType: 'repository_snapshot',
      getEntityId: (req) => req.params.id,
    },
  })
);

export default router;

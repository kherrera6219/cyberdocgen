import { Router, Response, NextFunction } from 'express';
import { isAuthenticated, getRequiredUserId } from '../replitAuth';
import { db } from '../db';
import { cloudFiles, evidenceControlMappings, insertEvidenceControlMappingSchema } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { objectStorageService } from '../services/objectStorageService';
import { auditService, AuditAction } from '../services/auditService';
import { snapshotService } from '../services/snapshotService';
import { ingestionService } from '../services/ingestionService';
import { 
  secureHandler, 
  validateInput,
  ValidationError,
  AppError,
  NotFoundError
} from '../utils/errorHandling';
import { 
  type MultiTenantRequest, 
  requireOrganization 
} from '../middleware/multiTenant';

// Helper function to get content type from file extension
function getContentType(extension: string | undefined): string {
  const contentTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'txt': 'text/plain',
    'json': 'application/json',
    'xml': 'application/xml',
    'csv': 'text/csv',
    'html': 'text/html',
    'zip': 'application/zip',
    'tar': 'application/x-tar',
    'gz': 'application/gzip'
  };

  return contentTypes[extension || ''] || 'application/octet-stream';
}

export function registerEvidenceRoutes(app: Router) {
  const router = Router();

  /**
   * SNAPSHOT ROUTES
   */

  // Create Snapshot
  router.post('/snapshots', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const organizationId = req.organizationId!;
    const { name } = req.body;
    
    if (!name) throw new ValidationError('Snapshot name is required');

    const result = await snapshotService.createSnapshot(organizationId, name);
    res.status(201).json({ success: true, data: result });
  }));

  // List Snapshots
  router.get('/snapshots', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const organizationId = req.organizationId!;
    const result = await snapshotService.getSnapshots(organizationId);
    res.json({ success: true, data: result });
  }));

  // Lock Snapshot
  router.post('/snapshots/:id/lock', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const organizationId = req.organizationId!;
    const { id } = req.params;
    
    const result = await snapshotService.lockSnapshot(id, organizationId);
    res.json({ success: true, data: result });
  }));

  // Get Snapshot Manifest
  router.get('/snapshots/:id/manifest', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    const manifest = await snapshotService.getManifest(id, organizationId);
    res.json({ success: true, data: manifest });
  }));

  // Verify Snapshot Manifest + file hashes
  router.post('/snapshots/:id/verify', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    const verification = await snapshotService.verifyManifest(id, organizationId);
    res.status(verification.valid ? 200 : 409).json({
      success: verification.valid,
      data: verification,
    });
  }));

  // Package Snapshot Evidence
  router.post('/snapshots/:id/package', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const organizationId = req.organizationId!;
    const { id } = req.params;
    const includeSourceFiles = req.body?.includeSourceFiles === true;

    const result = await snapshotService.packageSnapshotEvidence(id, organizationId, {
      includeSourceFiles,
    });

    res.json({
      success: true,
      data: result,
    });
  }));

  /**
   * INGESTION ROUTES
   */

  // Upload Evidence (Enhanced)
  router.post('/upload', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;
    const {
      fileName,
      fileData, // Base64
      snapshotId,
      category = 'Evidence'
    } = req.body;

    if (!fileName || !fileData || !snapshotId) {
      throw new ValidationError('Missing required fields: fileName, fileData, snapshotId');
    }

    const fileBuffer = Buffer.from(fileData, 'base64');

    const result = await ingestionService.ingestFile({
      organizationId,
      userId,
      snapshotId,
      file: fileBuffer,
      fileName,
      category
    });

    // Log audit trail
    await auditService.logAction({
      action: AuditAction.CREATE,
      entityType: 'evidence',
      entityId: result.id,
      userId,
      organizationId,
      ipAddress: req.ip || '',
      metadata: {
        action: 'evidence_ingestion',
        fileName,
        snapshotId,
        category
      }
    });

    res.status(201).json({ success: true, data: result });
  }));

  /**
   * LEGACY / COMPATIBILITY ROUTES (Keep existing listing logic for now)
   */
  
  // List all evidence (Legacy + New)
  router.get('/', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const organizationId = req.organizationId!;
    const { limit = '50', offset = '0', snapshotId } = req.query;

    const filters = [eq(cloudFiles.organizationId, organizationId)];
    if (typeof snapshotId === 'string' && snapshotId.trim().length > 0) {
      filters.push(eq(cloudFiles.snapshotId, snapshotId));
    }

    const evidenceFiles = await db.select()
      .from(cloudFiles)
      .where(and(...filters))
      .orderBy(desc(cloudFiles.createdAt))
      .limit(parseInt(limit as string, 10))
      .offset(parseInt(offset as string, 10));

    res.json({
      success: true,
      data: {
        evidence: evidenceFiles,
        count: evidenceFiles.length
      }
    });
  }));

  /**
   * EVIDENCE-TO-CONTROL MAPPING ROUTES (CODE-02)
   */

  // Map Evidence to a Framework Control
  router.post('/mappings', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const organizationId = req.organizationId!;
    const userId = getRequiredUserId(req);
    
    // Validate request body against schema (omitting server-set fields)
    const payload = insertEvidenceControlMappingSchema.parse(req.body);

    if (payload.organizationId !== organizationId) {
      throw new AppError("Cross-organization mapping is not allowed", 403, "FORBIDDEN");
    }

    // Check if mapping already exists
    const existing = await db.query.evidenceControlMappings.findFirst({
      where: and(
        eq(evidenceControlMappings.organizationId, organizationId),
        eq(evidenceControlMappings.evidenceId, payload.evidenceId),
        eq(evidenceControlMappings.framework, payload.framework),
        eq(evidenceControlMappings.controlId, payload.controlId)
      )
    });

    if (existing) {
      res.status(200).json({ success: true, data: existing, message: "Mapping already exists" });
      return;
    }

    const [mapping] = await db.insert(evidenceControlMappings).values({
      ...payload,
      mappedBy: userId,
    }).returning();

    await auditService.logAction({
      action: AuditAction.CREATE,
      entityType: 'evidence_mapping',
      entityId: mapping.id,
      userId,
      organizationId,
      ipAddress: req.ip || '',
      metadata: { evidenceId: mapping.evidenceId, controlId: mapping.controlId }
    });

    res.status(201).json({ success: true, data: mapping });
  }));

  // List Evidence Mappings
  router.get('/mappings', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const organizationId = req.organizationId!;
    const { framework, controlId, evidenceId } = req.query;

    const filters = [eq(evidenceControlMappings.organizationId, organizationId)];
    if (typeof framework === 'string') filters.push(eq(evidenceControlMappings.framework, framework));
    if (typeof controlId === 'string') filters.push(eq(evidenceControlMappings.controlId, controlId));
    if (typeof evidenceId === 'string') filters.push(eq(evidenceControlMappings.evidenceId, evidenceId));

    const mappings = await db.query.evidenceControlMappings.findMany({
      where: and(...filters),
      with: { evidence: true },
      orderBy: (m, { desc }) => [desc(m.createdAt)]
    });

    res.json({ success: true, data: mappings });
  }));

  // Delete Evidence Mapping
  router.delete('/mappings/:id', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const organizationId = req.organizationId!;
    const userId = getRequiredUserId(req);
    const { id } = req.params;

    const [deleted] = await db.delete(evidenceControlMappings)
      .where(and(
        eq(evidenceControlMappings.id, id),
        eq(evidenceControlMappings.organizationId, organizationId)
      ))
      .returning();

    if (!deleted) throw new NotFoundError("Mapping not found");

    await auditService.logAction({
      action: AuditAction.DELETE,
      entityType: 'evidence_mapping',
      entityId: id,
      userId,
      organizationId,
      ipAddress: req.ip || '',
    });

    res.json({ success: true, message: "Mapping deleted successfully" });
  }));

  app.use('/api/evidence', router);
}

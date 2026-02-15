import { Router, Response, NextFunction } from 'express';
import { isAuthenticated, getRequiredUserId } from '../replitAuth';
import { db } from '../db';
import { cloudFiles } from '@shared/schema';
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

  app.use('/api/evidence', router);
}

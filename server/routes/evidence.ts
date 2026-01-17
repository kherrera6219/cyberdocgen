import { Router, Response, NextFunction } from 'express';
import { isAuthenticated, getRequiredUserId } from '../replitAuth';
import { db } from '../db';
import { cloudFiles } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { objectStorageService } from '../services/objectStorageService';
import { auditService, AuditAction } from '../services/auditService';
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
   * Upload evidence for compliance controls
   */
  router.post('/', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;
    const {
      fileName,
      fileType,
      fileData,
      integrationId,
      description,
      controlIds,
      framework,
      securityLevel = 'standard'
    } = req.body;

    if (!fileName || !fileData || !organizationId) {
      throw new ValidationError('Missing required fields: fileName, fileData, organizationId');
    }

    // Upload file to object storage
    const buffer = Buffer.from(fileData, 'base64');
    const folder = `evidence/${organizationId}`;
    const uploadResult = await objectStorageService.uploadFileFromBytes(
      fileName,
      buffer,
      folder
    );

    if (!uploadResult.success) {
      throw new AppError(uploadResult.error || 'Failed to upload file to storage', 500, 'STORAGE_ERROR');
    }

    // Create cloudFiles record
    const fileSize = buffer.length;
    const mimeType = getContentType(fileType || fileName.split('.').pop());

    const [evidenceRecord] = await db.insert(cloudFiles).values({
      integrationId: integrationId || 'manual-upload',
      organizationId,
      providerFileId: uploadResult.path || fileName,
      fileName,
      filePath: uploadResult.path || `${folder}/${fileName}`,
      fileType: fileType || fileName.split('.').pop() || 'unknown',
      fileSize,
      mimeType,
      securityLevel,
      permissions: {
        canView: true,
        canEdit: false,
        canDownload: true,
        canShare: false
      },
      metadata: {
        createdBy: userId,
        tags: ['evidence', ...(controlIds || []).map((cid: string) => `control:${cid}`), framework ? `framework:${framework}` : ''].filter(Boolean),
        description: description || `Evidence file: ${fileName}`,
        version: '1.0'
      } as any,
      downloadUrl: uploadResult.path,
      lastModified: new Date(),
      syncedAt: new Date()
    }).returning();

    // Log audit trail
    await auditService.logAction({
      action: AuditAction.CREATE,
      entityType: 'evidence',
      entityId: evidenceRecord.id,
      userId,
      organizationId,
      ipAddress: req.ip || '',
      metadata: {
        action: 'evidence_upload',
        fileName,
        fileSize,
        framework,
        controlIds
      }
    });

    res.status(201).json({
      success: true,
      data: {
        evidence: evidenceRecord,
        message: 'Evidence uploaded successfully'
      }
    });
  }));

  /**
   * List all evidence documents
   */
  router.get('/', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const {
      framework,
      controlId,
      limit = '50',
      offset = '0'
    } = req.query;

    // Build query with filters
    const query = db.select().from(cloudFiles).where(eq(cloudFiles.organizationId, organizationId));

    // Get evidence files with pagination
    const evidenceFiles = await query
      .orderBy(desc(cloudFiles.createdAt))
      .limit(parseInt(limit as string, 10))
      .offset(parseInt(offset as string, 10));

    // Post-filter by framework or controlId using tags
    let filteredFiles = evidenceFiles;

    if (framework) {
      filteredFiles = filteredFiles.filter(file =>
        file.metadata &&
        typeof file.metadata === 'object' &&
        'tags' in file.metadata &&
        Array.isArray(file.metadata.tags) &&
        file.metadata.tags.includes(`framework:${framework}`)
      );
    }

    if (controlId) {
      filteredFiles = filteredFiles.filter(file =>
        file.metadata &&
        typeof file.metadata === 'object' &&
        'tags' in file.metadata &&
        Array.isArray(file.metadata.tags) &&
        file.metadata.tags.includes(`control:${controlId}`)
      );
    }

    res.json({
      success: true,
      data: {
        evidence: filteredFiles,
        count: filteredFiles.length,
        pagination: {
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10),
          hasMore: evidenceFiles.length === parseInt(limit as string, 10)
        }
      }
    });
  }));

  /**
   * Map evidence to controls
   */
  router.post('/:id/controls', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;
    const { controlIds, framework, action = 'add' } = req.body;

    if (!controlIds || !Array.isArray(controlIds)) {
      throw new ValidationError('controlIds must be an array');
    }

    // Get current evidence record
    const [evidenceFile] = await db
      .select()
      .from(cloudFiles)
      .where(and(
        eq(cloudFiles.id, id),
        eq(cloudFiles.organizationId, organizationId)
      ));

    if (!evidenceFile) {
      throw new NotFoundError("Evidence file not found");
    }

    // Update metadata with control mappings using tags
    const currentMetadata = (evidenceFile.metadata as any) || {};
    const currentTags = currentMetadata.tags || [];

    // Extract current control tags
    const currentControlTags = currentTags.filter((tag: string) => tag.startsWith('control:'));
    const currentControlIds = currentControlTags.map((tag: string) => tag.replace('control:', ''));
    const otherTags = currentTags.filter((tag: string) => !tag.startsWith('control:') && !tag.startsWith('framework:'));

    let updatedControlIds: string[];

    if (action === 'add') {
      const newControlIds = controlIds.filter(
        (cid: string) => !currentControlIds.includes(cid)
      );
      updatedControlIds = [...currentControlIds, ...newControlIds];
    } else if (action === 'remove') {
      updatedControlIds = currentControlIds.filter(
        (cid: string) => !controlIds.includes(cid)
      );
    } else if (action === 'replace') {
      updatedControlIds = controlIds;
    } else {
      throw new ValidationError('Invalid action. Must be "add", "remove", or "replace"');
    }

    // Rebuild tags array
    const controlTags = updatedControlIds.map((cid: string) => `control:${cid}`);
    const frameworkTag = framework ? [`framework:${framework}`] :
                        currentTags.find((tag: string) => tag.startsWith('framework:')) ?
                        [currentTags.find((tag: string) => tag.startsWith('framework:'))] : [];

    const updatedMetadata = {
      ...currentMetadata,
      tags: [...otherTags, ...controlTags, ...frameworkTag].filter(Boolean)
    };

    // Update the cloudFiles record
    const [updatedEvidence] = await db
      .update(cloudFiles)
      .set({
        metadata: updatedMetadata,
        lastModified: new Date()
      })
      .where(eq(cloudFiles.id, id))
      .returning();

    // Log audit trail
    await auditService.logAction({
      action: AuditAction.UPDATE,
      entityType: 'evidence',
      entityId: id,
      userId,
      organizationId,
      ipAddress: req.ip || '',
      metadata: {
        action: 'evidence_control_mapping',
        mappingAction: action,
        controlIds,
        fileName: evidenceFile.fileName
      }
    });

    res.json({
      success: true,
      data: {
        evidence: updatedEvidence,
        message: `Evidence ${action === 'add' ? 'mapped to' : action === 'remove' ? 'unmapped from' : 'updated with'} controls successfully`,
        mappedControls: updatedControlIds
      }
    });
  }, { audit: { action: 'update', entityType: 'evidenceControlMapping' } }));

  app.use('/api/evidence', router);
}

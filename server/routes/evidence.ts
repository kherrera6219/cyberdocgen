import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { db } from '../db';
import { cloudFiles } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { objectStorageService } from '../services/objectStorageService';
import { auditService, AuditAction } from '../services/auditService';

export function registerEvidenceRoutes(app: Router) {
  const router = Router();

  /**
   * @openapi
   * /api/evidence:
   *   post:
   *     tags: [Evidence]
   *     summary: Upload evidence for compliance controls
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       201:
   *         description: Evidence uploaded successfully
   *       401:
   *         description: Unauthorized
   */
  router.post('/', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const {
        fileName,
        fileType,
        fileData,
        organizationId,
        integrationId,
        description,
        controlIds,
        framework,
        securityLevel = 'standard'
      } = req.body;

      if (!fileName || !fileData || !organizationId) {
        return res.status(400).json({
          message: 'Missing required fields: fileName, fileData, organizationId'
        });
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
        return res.status(500).json({
          message: 'Failed to upload file to storage',
          error: uploadResult.error
        });
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
          createdBy: user?.id?.toString() || user?.claims?.sub,
          tags: ['evidence', ...(controlIds || []).map((cid: string) => `control:${cid}`), framework ? `framework:${framework}` : ''].filter(Boolean),
          description: description || `Evidence file: ${fileName}`,
          version: '1.0'
        } as any,
        downloadUrl: uploadResult.path,
        lastModified: new Date(),
        syncedAt: new Date()
      }).returning();

      // Log audit trail
      await auditService.logAudit({
        entityType: 'document',
        entityId: evidenceRecord.id,
        action: AuditAction.CREATE,
        userId: user?.id?.toString() || user?.claims?.sub,
        ipAddress: req.ip,
        metadata: {
          action: 'evidence_upload',
          fileName,
          fileSize,
          organizationId,
          framework,
          controlIds
        }
      });

      res.status(201).json({
        success: true,
        evidence: evidenceRecord,
        message: 'Evidence uploaded successfully'
      });
    } catch (error) {
      logger.error('Failed to upload evidence', {
        error: error instanceof Error ? error.message : String(error)
      });
      res.status(500).json({ message: 'Failed to upload evidence' });
    }
  });

  /**
   * @openapi
   * /api/evidence:
   *   get:
   *     tags: [Evidence]
   *     summary: List all evidence documents
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: List of evidence documents
   *       401:
   *         description: Unauthorized
   */
  router.get('/', isAuthenticated, async (req: any, res) => {
    try {
      const {
        organizationId,
        framework,
        controlId,
        limit = 50,
        offset = 0
      } = req.query;

      // Build query with filters
      let query = db.select().from(cloudFiles);

      const conditions = [];

      // Filter by organization if provided
      if (organizationId) {
        conditions.push(eq(cloudFiles.organizationId, organizationId as string));
      }

      // Filter for evidence files (has 'evidence' tag in metadata)
      // This is a simplified approach - in production you'd use a JSON query
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

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
        evidence: filteredFiles,
        count: filteredFiles.length,
        pagination: {
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10),
          hasMore: evidenceFiles.length === parseInt(limit as string, 10)
        }
      });
    } catch (error) {
      logger.error('Failed to list evidence', {
        error: error instanceof Error ? error.message : String(error)
      });
      res.status(500).json({ message: 'Failed to retrieve evidence' });
    }
  });

  /**
   * @openapi
   * /api/evidence/{id}/controls:
   *   post:
   *     tags: [Evidence]
   *     summary: Map evidence to controls
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Evidence mapped to controls
   *       401:
   *         description: Unauthorized
   */
  router.post('/:id/controls', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const { controlIds, framework, action = 'add' } = req.body;

      if (!controlIds || !Array.isArray(controlIds)) {
        return res.status(400).json({
          message: 'controlIds must be an array'
        });
      }

      // Get current evidence record
      const [evidenceFile] = await db
        .select()
        .from(cloudFiles)
        .where(eq(cloudFiles.id, id));

      if (!evidenceFile) {
        return res.status(404).json({
          message: 'Evidence file not found'
        });
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
        // Add new control IDs (avoid duplicates)
        const newControlIds = controlIds.filter(
          (id: string) => !currentControlIds.includes(id)
        );
        updatedControlIds = [...currentControlIds, ...newControlIds];
      } else if (action === 'remove') {
        // Remove specified control IDs
        updatedControlIds = currentControlIds.filter(
          (id: string) => !controlIds.includes(id)
        );
      } else if (action === 'replace') {
        // Replace all control IDs
        updatedControlIds = controlIds;
      } else {
        return res.status(400).json({
          message: 'Invalid action. Must be "add", "remove", or "replace"'
        });
      }

      // Rebuild tags array
      const controlTags = updatedControlIds.map((id: string) => `control:${id}`);
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
      await auditService.logAudit({
        entityType: 'document',
        entityId: id,
        action: AuditAction.UPDATE,
        userId: user?.id?.toString() || user?.claims?.sub,
        ipAddress: req.ip,
        metadata: {
          action: 'evidence_control_mapping',
          mappingAction: action,
          controlIds,
          fileName: evidenceFile.fileName
        }
      });

      res.json({
        success: true,
        evidence: updatedEvidence,
        message: `Evidence ${action === 'add' ? 'mapped to' : action === 'remove' ? 'unmapped from' : 'updated with'} controls successfully`,
        mappedControls: updatedControlIds
      });
    } catch (error) {
      logger.error('Failed to map evidence to controls', {
        error: error instanceof Error ? error.message : String(error)
      });
      res.status(500).json({ message: 'Failed to map evidence to controls' });
    }
  });

  app.use('/api/evidence', router);
}

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

import { Router, Response } from 'express';
import { isAuthenticated } from '../replitAuth';
import { objectStorageService } from '../services/objectStorageService';
import { auditService, AuditAction } from '../services/auditService';
import { metricsCollector } from '../monitoring/metrics';
import {
  type MultiTenantRequest,
  getCompanyProfileWithOrgCheck,
  getDocumentWithOrgCheck,
  requireOrganization,
} from '../middleware/multiTenant';
import {
  secureHandler,
  requireAuth,
  AppError,
} from '../utils/errorHandling';

function getContentType(extension: string | undefined): string {
  const contentTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    txt: 'text/plain',
    json: 'application/json',
    xml: 'application/xml',
    csv: 'text/csv',
    html: 'text/html',
  };

  return contentTypes[extension || ''] || 'application/octet-stream';
}

class StorageError extends AppError {
  constructor(message: string) {
    super(message, 500, 'STORAGE_ERROR');
  }
}

const STORAGE_PATH_ERROR_CODE = 'INVALID_STORAGE_PATH';

function getOrganizationIdOrThrow(req: MultiTenantRequest): string {
  if (!req.organizationId) {
    throw new AppError('Organization context required', 403, 'ORG_CONTEXT_REQUIRED');
  }
  return req.organizationId;
}

function normalizeStoragePath(value: string, fieldName: string, allowNested: boolean): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new AppError(`${fieldName} is required`, 400, STORAGE_PATH_ERROR_CODE);
  }

  const normalized = trimmed
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+/g, '/');

  if (!allowNested && normalized.includes('/')) {
    throw new AppError(`${fieldName} must not contain path separators`, 400, STORAGE_PATH_ERROR_CODE);
  }

  if (normalized === '.' || normalized.includes('..')) {
    throw new AppError(`${fieldName} contains invalid path segments`, 400, STORAGE_PATH_ERROR_CODE);
  }

  return normalized;
}

function getOrgStoragePrefix(organizationId: string): string {
  return `organizations/${organizationId}`;
}

function buildOrgScopedPath(organizationId: string, relativePath: string): string {
  const safeRelativePath = normalizeStoragePath(relativePath, 'path', true);
  return `${getOrgStoragePrefix(organizationId)}/${safeRelativePath}`;
}

function stripOrgPrefix(organizationId: string, objectPath: string): string | null {
  const prefix = `${getOrgStoragePrefix(organizationId)}/`;
  if (!objectPath.startsWith(prefix)) {
    return null;
  }

  const relativePath = objectPath.slice(prefix.length);
  return relativePath.length > 0 ? relativePath : null;
}

export function registerStorageRoutes(router: Router) {
  /**
   * Upload document to storage
   */
  router.post('/documents/:documentId', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const { documentId } = req.params;
    const content = req.body;
    const userId = requireAuth(req);
    const organizationId = getOrganizationIdOrThrow(req);

    const { authorized } = await getDocumentWithOrgCheck(documentId, organizationId);
    if (!authorized) {
      throw new AppError('Document not found', 404, 'NOT_FOUND');
    }

    const result = await objectStorageService.uploadDocument(documentId, content, organizationId);

    if (!result.success) {
      throw new StorageError(result.error || 'Storage upload failed');
    }

    await auditService.logAudit({
      entityType: 'document',
      entityId: documentId,
      action: AuditAction.CREATE,
      userId,
      organizationId,
      ipAddress: req.ip || '',
      metadata: {
        storageAction: 'storage_upload',
        storageProvider: 'replit',
        path: result.path,
      },
    });

    metricsCollector.incrementCounter('storage_upload', 'document');
    res.json({ success: true, data: { path: result.path } });
  }));

  /**
   * Download document from storage
   */
  router.get('/documents/:documentId', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const { documentId } = req.params;
    const userId = requireAuth(req);
    const organizationId = getOrganizationIdOrThrow(req);

    const { authorized } = await getDocumentWithOrgCheck(documentId, organizationId);
    if (!authorized) {
      throw new AppError('Document not found', 404, 'NOT_FOUND');
    }

    const result = await objectStorageService.downloadDocument(documentId, organizationId);

    if (!result.success) {
      throw new AppError(result.error || 'Document not found', 404, 'NOT_FOUND');
    }

    await auditService.logAudit({
      entityType: 'document',
      entityId: documentId,
      action: AuditAction.READ,
      userId,
      organizationId,
      ipAddress: req.ip || '',
      metadata: {
        storageAction: 'storage_download',
        storageProvider: 'replit',
      },
    });

    metricsCollector.incrementCounter('storage_download', 'document');
    res.json({ success: true, data: result.data });
  }));

  /**
   * Upload company profile to storage
   */
  router.post('/profiles/:profileId', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const { profileId } = req.params;
    const profileData = req.body;
    const userId = requireAuth(req);
    const organizationId = getOrganizationIdOrThrow(req);

    const { authorized } = await getCompanyProfileWithOrgCheck(profileId, organizationId);
    if (!authorized) {
      throw new AppError('Profile not found', 404, 'NOT_FOUND');
    }

    const result = await objectStorageService.uploadCompanyProfile(profileId, profileData, organizationId);

    if (!result.success) {
      throw new StorageError(result.error || 'Profile storage upload failed');
    }

    await auditService.logAudit({
      entityType: 'company_profile',
      entityId: profileId,
      action: AuditAction.CREATE,
      userId,
      organizationId,
      ipAddress: req.ip || '',
      metadata: {
        storageAction: 'storage_upload',
        storageProvider: 'replit',
        path: result.path,
      },
    });

    metricsCollector.incrementCounter('storage_upload', 'profile');
    res.json({ success: true, data: { path: result.path } });
  }));

  /**
   * Download company profile from storage
   */
  router.get('/profiles/:profileId', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const { profileId } = req.params;
    const userId = requireAuth(req);
    const organizationId = getOrganizationIdOrThrow(req);

    const { authorized } = await getCompanyProfileWithOrgCheck(profileId, organizationId);
    if (!authorized) {
      throw new AppError('Profile not found', 404, 'NOT_FOUND');
    }

    const result = await objectStorageService.downloadCompanyProfile(profileId, organizationId);

    if (!result.success) {
      throw new AppError(result.error || 'Profile not found', 404, 'NOT_FOUND');
    }

    await auditService.logAudit({
      entityType: 'company_profile',
      entityId: profileId,
      action: AuditAction.READ,
      userId,
      organizationId,
      ipAddress: req.ip || '',
      metadata: {
        storageAction: 'storage_download',
        storageProvider: 'replit',
      },
    });

    metricsCollector.incrementCounter('storage_download', 'profile');
    res.json({ success: true, data: result.data });
  }));

  /**
   * Upload file from bytes
   */
  router.post('/files', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const rawFilename = String(req.body.filename || '');
    const rawFolder = String(req.body.folder || 'files');
    const fileData = req.body.data;
    const userId = requireAuth(req);
    const organizationId = getOrganizationIdOrThrow(req);

    if (typeof fileData !== 'string') {
      throw new AppError('File data must be provided as base64 string', 400, 'INVALID_FILE_DATA');
    }

    const filename = normalizeStoragePath(rawFilename, 'filename', false);
    const folder = normalizeStoragePath(rawFolder, 'folder', true);
    const scopedFolder = buildOrgScopedPath(organizationId, folder);
    const relativePath = `${folder}/${filename}`;

    const buffer = Buffer.from(fileData, 'base64');
    const result = await objectStorageService.uploadFileFromBytes(filename, buffer, scopedFolder);

    if (!result.success) {
      throw new StorageError(result.error || 'File storage upload failed');
    }

    await auditService.logAudit({
      entityType: 'document',
      entityId: relativePath,
      action: AuditAction.CREATE,
      userId,
      organizationId,
      ipAddress: req.ip || '',
      metadata: {
        storageAction: 'file_upload',
        storageProvider: 'replit',
        path: relativePath,
        folder,
        fileType: filename.split('.').pop(),
      },
    });

    metricsCollector.incrementCounter('storage_upload', 'file');
    res.json({ success: true, data: { path: relativePath } });
  }));

  /**
   * Download file as bytes
   */
  router.get('/files/:path(*)', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const relativePath = normalizeStoragePath(req.params.path, 'path', true);
    const userId = requireAuth(req);
    const organizationId = getOrganizationIdOrThrow(req);
    const scopedPath = buildOrgScopedPath(organizationId, relativePath);

    const result = await objectStorageService.downloadFileAsBytes(scopedPath);

    if (!result.success) {
      throw new AppError(result.error || 'File not found', 404, 'NOT_FOUND');
    }

    await auditService.logAudit({
      entityType: 'document',
      entityId: relativePath,
      action: AuditAction.DATA_EXPORT,
      userId,
      organizationId,
      ipAddress: req.ip || '',
      metadata: {
        action: 'file_download',
        storageProvider: 'replit',
        path: relativePath,
      },
    });

    metricsCollector.incrementCounter('storage_download', 'file');

    const fileExt = relativePath.split('.').pop()?.toLowerCase();
    const contentType = getContentType(fileExt);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${relativePath.split('/').pop()}"`);
    res.send(result.data);
  }));

  /**
   * List storage objects
   */
  router.get('/list', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const folder = typeof req.query.folder === 'string' ? req.query.folder : undefined;
    const userId = requireAuth(req);
    const organizationId = getOrganizationIdOrThrow(req);

    const relativeFolder = folder ? normalizeStoragePath(folder, 'folder', true) : undefined;
    const scopedFolder = relativeFolder
      ? buildOrgScopedPath(organizationId, relativeFolder)
      : getOrgStoragePrefix(organizationId);

    const result = await objectStorageService.listObjectsInFolder(scopedFolder);

    if (!result.success) {
      throw new StorageError(result.error || 'Storage list failed');
    }

    const files = (result.files || [])
      .map((objectPath) => stripOrgPrefix(organizationId, objectPath))
      .filter((path): path is string => Boolean(path));

    await auditService.logAudit({
      entityType: 'document',
      entityId: relativeFolder || 'root',
      action: AuditAction.READ,
      userId,
      organizationId,
      ipAddress: req.ip || '',
      metadata: {
        action: 'storage_list',
        storageProvider: 'replit',
        folder: relativeFolder || 'all',
        resultCount: files.length,
      },
    });

    metricsCollector.incrementCounter('storage_list', relativeFolder || 'all');
    res.json({ success: true, data: { files } });
  }));

  /**
   * Delete storage object
   */
  router.delete('/objects/*', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const relativePath = normalizeStoragePath(req.params[0], 'path', true);
    const userId = requireAuth(req);
    const organizationId = getOrganizationIdOrThrow(req);
    const scopedPath = buildOrgScopedPath(organizationId, relativePath);

    const result = await objectStorageService.deleteObject(scopedPath);

    if (!result.success) {
      throw new StorageError(result.error || 'Storage delete failed');
    }

    await auditService.logAudit({
      entityType: 'document',
      entityId: relativePath,
      action: AuditAction.DELETE,
      userId,
      organizationId,
      ipAddress: req.ip || '',
      metadata: {
        action: 'storage_delete',
        storageProvider: 'replit',
        path: relativePath,
      },
    });

    metricsCollector.incrementCounter('storage_delete', 'object');
    res.json({ success: true, message: 'Object deleted' });
  }));

  /**
   * Get storage statistics
   */
  router.get('/stats', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const userId = requireAuth(req);
    const organizationId = getOrganizationIdOrThrow(req);

    const result = await objectStorageService.getStorageStats(organizationId);

    if (!result.success) {
      throw new StorageError(result.error || 'Storage stats failed');
    }

    await auditService.logAudit({
      entityType: 'organization',
      entityId: 'storage-stats',
      action: AuditAction.READ,
      userId,
      organizationId,
      ipAddress: req.ip || '',
      metadata: {
        action: 'storage_stats',
        storageProvider: 'replit',
        totalFiles: result.data?.totalFiles || 0,
      },
    });

    metricsCollector.incrementCounter('storage_stats');
    res.json({ success: true, data: { stats: result.data } });
  }));

  /**
   * Upload backup
   */
  router.post('/backups/:backupId', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const backupId = normalizeStoragePath(req.params.backupId, 'backupId', false);
    const backupData = req.body;
    const userId = requireAuth(req);
    const organizationId = getOrganizationIdOrThrow(req);

    const result = await objectStorageService.uploadBackup(backupId, backupData, organizationId);

    if (!result.success) {
      throw new StorageError(result.error || 'Backup upload failed');
    }

    await auditService.logAudit({
      entityType: 'organization',
      entityId: backupId,
      action: AuditAction.CREATE,
      userId,
      organizationId,
      ipAddress: req.ip || '',
      metadata: {
        action: 'backup_upload',
        storageProvider: 'replit',
        path: result.path,
        dataSize: JSON.stringify(backupData).length,
      },
    });

    metricsCollector.incrementCounter('storage_backup', 'upload');
    res.json({ success: true, data: { path: result.path } });
  }));

  /**
   * Download backup
   */
  router.get('/backups/:backupId', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const backupId = normalizeStoragePath(req.params.backupId, 'backupId', false);
    const userId = requireAuth(req);
    const organizationId = getOrganizationIdOrThrow(req);

    const result = await objectStorageService.downloadBackup(backupId, organizationId);

    if (!result.success) {
      throw new AppError(result.error || 'Backup not found', 404, 'NOT_FOUND');
    }

    await auditService.logAudit({
      entityType: 'organization',
      entityId: backupId,
      action: AuditAction.DATA_EXPORT,
      userId,
      organizationId,
      ipAddress: req.ip || '',
      metadata: {
        action: 'backup_download',
        storageProvider: 'replit',
      },
    });

    metricsCollector.incrementCounter('storage_backup', 'download');
    res.json({ success: true, data: result.data });
  }));

  /**
   * Upload audit logs
   */
  router.post('/audit-logs/:logId', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response) => {
    const logId = normalizeStoragePath(req.params.logId, 'logId', false);
    const auditLogs = req.body.logs;
    const userId = requireAuth(req);
    const organizationId = getOrganizationIdOrThrow(req);

    const result = await objectStorageService.uploadAuditLogs(logId, auditLogs, organizationId);

    if (!result.success) {
      throw new StorageError(result.error || 'Audit logs upload failed');
    }

    await auditService.logAudit({
      entityType: 'organization',
      entityId: logId,
      action: AuditAction.CREATE,
      userId,
      organizationId,
      ipAddress: req.ip || '',
      metadata: {
        action: 'audit_log_upload',
        storageProvider: 'replit',
        path: result.path,
        logCount: Array.isArray(auditLogs) ? auditLogs.length : 0,
      },
    });

    metricsCollector.incrementCounter('storage_audit', 'upload');
    res.json({ success: true, data: { path: result.path } });
  }));
}

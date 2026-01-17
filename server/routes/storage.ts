import { Router, Request, Response } from 'express';
import { isAuthenticated, getUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { objectStorageService } from '../services/objectStorageService';
import { auditService, AuditAction } from '../services/auditService';
import { metricsCollector } from '../monitoring/metrics';
import { 
  secureHandler, 
  requireAuth,
  AppError
} from '../utils/errorHandling';

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
    'html': 'text/html'
  };
  
  return contentTypes[extension || ''] || 'application/octet-stream';
}

class StorageError extends AppError {
  constructor(message: string) {
    super(message, 500, 'STORAGE_ERROR');
  }
}

export function registerStorageRoutes(router: Router) {
  /**
   * Upload document to storage
   */
  router.post("/documents/:documentId", isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const { documentId } = req.params;
    const content = req.body;
    const userId = requireAuth(req);

    const result = await objectStorageService.uploadDocument(documentId, content);
    
    if (!result.success) {
      throw new StorageError(result.error || 'Storage upload failed');
    }

    await auditService.logAudit({
      entityType: "document",
      entityId: documentId,
      action: AuditAction.CREATE,
      userId,
      ipAddress: req.ip || '',
      metadata: {
        storageAction: "storage_upload",
        storageProvider: "replit",
        path: result.path
      }
    });

    metricsCollector.incrementCounter('storage_upload', 'document');
    res.json({ success: true, data: { path: result.path } });
  }));

  /**
   * Download document from storage
   */
  router.get("/documents/:documentId", isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const { documentId } = req.params;
    const userId = requireAuth(req);

    const result = await objectStorageService.downloadDocument(documentId);
    
    if (!result.success) {
      throw new AppError(result.error || 'Document not found', 404, 'NOT_FOUND');
    }

    await auditService.logAudit({
      entityType: "document",
      entityId: documentId,
      action: AuditAction.READ,
      userId,
      ipAddress: req.ip || '',
      metadata: {
        storageAction: "storage_download",
        storageProvider: "replit"
      }
    });

    metricsCollector.incrementCounter('storage_download', 'document');
    res.json({ success: true, data: result.data });
  }));

  /**
   * Upload company profile to storage
   */
  router.post("/profiles/:profileId", isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const { profileId } = req.params;
    const profileData = req.body;
    const userId = requireAuth(req);

    const result = await objectStorageService.uploadCompanyProfile(profileId, profileData);
    
    if (!result.success) {
      throw new StorageError(result.error || 'Profile storage upload failed');
    }

    await auditService.logAudit({
      entityType: "company_profile",
      entityId: profileId,
      action: AuditAction.CREATE,
      userId,
      ipAddress: req.ip || '',
      metadata: {
        storageAction: "storage_upload",
        storageProvider: "replit",
        path: result.path
      }
    });

    metricsCollector.incrementCounter('storage_upload', 'profile');
    res.json({ success: true, data: { path: result.path } });
  }));

  /**
   * Download company profile from storage
   */
  router.get("/profiles/:profileId", isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const { profileId } = req.params;
    const userId = requireAuth(req);

    const result = await objectStorageService.downloadCompanyProfile(profileId);
    
    if (!result.success) {
      throw new AppError(result.error || 'Profile not found', 404, 'NOT_FOUND');
    }

    await auditService.logAudit({
      entityType: "company_profile",
      entityId: profileId,
      action: AuditAction.READ,
      userId,
      ipAddress: req.ip || '',
      metadata: {
        storageAction: "storage_download",
        storageProvider: "replit"
      }
    });

    metricsCollector.incrementCounter('storage_download', 'profile');
    res.json({ success: true, data: result.data });
  }));

  /**
   * Upload file from bytes
   */
  router.post("/files", isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const { filename, folder = 'files' } = req.body;
    const fileData = req.body.data;
    const userId = requireAuth(req);

    const buffer = Buffer.from(fileData, 'base64');
    const result = await objectStorageService.uploadFileFromBytes(filename, buffer, folder);
    
    if (!result.success) {
      throw new StorageError(result.error || 'File storage upload failed');
    }

    await auditService.logAudit({
      entityType: "document",
      entityId: filename,
      action: AuditAction.CREATE,
      userId,
      ipAddress: req.ip || '',
      metadata: {
        storageAction: "file_upload",
        storageProvider: "replit",
        path: result.path,
        folder,
        fileType: filename.split('.').pop()
      }
    });

    metricsCollector.incrementCounter('storage_upload', 'file');
    res.json({ success: true, data: { path: result.path } });
  }));

  /**
   * Download file as bytes
   */
  router.get("/files/:path(*)", isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const path = req.params.path;
    const userId = requireAuth(req);

    const result = await objectStorageService.downloadFileAsBytes(path);
    
    if (!result.success) {
      throw new AppError(result.error || 'File not found', 404, 'NOT_FOUND');
    }

    await auditService.logAudit({
      entityType: "document",
      entityId: path,
      action: AuditAction.DATA_EXPORT,
      userId,
      ipAddress: req.ip || '',
      metadata: { 
        action: "file_download",
        storageProvider: "replit",
        path
      }
    });

    metricsCollector.incrementCounter('storage_download', 'file');
    
    const fileExt = path.split('.').pop()?.toLowerCase();
    const contentType = getContentType(fileExt);
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${path.split('/').pop()}"`);
    res.send(result.data);
  }));

  /**
   * List storage objects
   */
  router.get("/list", isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const { folder } = req.query;
    const userId = requireAuth(req);

    const result = folder 
      ? await objectStorageService.listObjectsInFolder(folder as string)
      : await objectStorageService.listObjects();
    
    if (!result.success) {
      throw new StorageError(result.error || 'Storage list failed');
    }

    await auditService.logAudit({
      entityType: "document",
      entityId: (folder as string) || "root",
      action: AuditAction.READ,
      userId,
      ipAddress: req.ip || '',
      metadata: { 
        action: "storage_list",
        storageProvider: "replit",
        folder: folder || "all",
        resultCount: result.files?.length || 0
      }
    });

    metricsCollector.incrementCounter('storage_list', (folder as string) || 'all');
    res.json({ success: true, data: { files: result.files || [] } });
  }));

  /**
   * Delete storage object
   */
  router.delete("/objects/*", isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const path = req.params[0];
    const userId = requireAuth(req);

    const result = await objectStorageService.deleteObject(path);
    
    if (!result.success) {
      throw new StorageError(result.error || 'Storage delete failed');
    }

    await auditService.logAudit({
      entityType: "document",
      entityId: path,
      action: AuditAction.DELETE,
      userId,
      ipAddress: req.ip || '',
      metadata: { 
        action: "storage_delete",
        storageProvider: "replit",
        path
      }
    });

    metricsCollector.incrementCounter('storage_delete', 'object');
    res.json({ success: true, message: 'Object deleted' });
  }));

  /**
   * Get storage statistics
   */
  router.get("/stats", isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req);

    const result = await objectStorageService.getStorageStats();
    
    if (!result.success) {
      throw new StorageError(result.error || 'Storage stats failed');
    }

    await auditService.logAudit({
      entityType: "organization",
      entityId: "storage-stats",
      action: AuditAction.READ,
      userId,
      ipAddress: req.ip || '',
      metadata: { 
        action: "storage_stats",
        storageProvider: "replit",
        totalFiles: result.data?.totalFiles || 0
      }
    });

    metricsCollector.incrementCounter('storage_stats');
    res.json({ success: true, data: { stats: result.data } });
  }));

  /**
   * Upload backup
   */
  router.post("/backups/:backupId", isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const { backupId } = req.params;
    const backupData = req.body;
    const userId = requireAuth(req);

    const result = await objectStorageService.uploadBackup(backupId, backupData);
    
    if (!result.success) {
      throw new StorageError(result.error || 'Backup upload failed');
    }

    await auditService.logAudit({
      entityType: "organization",
      entityId: backupId,
      action: AuditAction.CREATE,
      userId,
      ipAddress: req.ip || '',
      metadata: { 
        action: "backup_upload",
        storageProvider: "replit",
        path: result.path,
        dataSize: JSON.stringify(backupData).length
      }
    });

    metricsCollector.incrementCounter('storage_backup', 'upload');
    res.json({ success: true, data: { path: result.path } });
  }));

  /**
   * Download backup
   */
  router.get("/backups/:backupId", isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const { backupId } = req.params;
    const userId = requireAuth(req);

    const result = await objectStorageService.downloadBackup(backupId);
    
    if (!result.success) {
      throw new AppError(result.error || 'Backup not found', 404, 'NOT_FOUND');
    }

    await auditService.logAudit({
      entityType: "organization",
      entityId: backupId,
      action: AuditAction.DATA_EXPORT,
      userId,
      ipAddress: req.ip || '',
      metadata: { 
        action: "backup_download",
        storageProvider: "replit"
      }
    });

    metricsCollector.incrementCounter('storage_backup', 'download');
    res.json({ success: true, data: result.data });
  }));

  /**
   * Upload audit logs
   */
  router.post("/audit-logs/:logId", isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const { logId } = req.params;
    const auditLogs = req.body.logs;
    const userId = requireAuth(req);

    const result = await objectStorageService.uploadAuditLogs(logId, auditLogs);
    
    if (!result.success) {
      throw new StorageError(result.error || 'Audit logs upload failed');
    }

    await auditService.logAudit({
      entityType: "organization",
      entityId: logId,
      action: AuditAction.CREATE,
      userId,
      ipAddress: req.ip || '',
      metadata: { 
        action: "audit_log_upload",
        storageProvider: "replit",
        path: result.path,
        logCount: auditLogs.length
      }
    });

    metricsCollector.incrementCounter('storage_audit', 'upload');
    res.json({ success: true, data: { path: result.path } });
  }));
}

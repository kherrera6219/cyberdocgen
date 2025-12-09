import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { logger } from '../utils/logger';
import { objectStorageService } from '../services/objectStorageService';
import { auditService, AuditAction } from '../services/auditService';
import { metricsCollector } from '../monitoring/metrics';

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

export function registerStorageRoutes(router: Router) {
  router.post("/documents/:documentId", isAuthenticated, async (req: any, res) => {
    const { documentId } = req.params;
    const content = req.body;
    const userId = req.user?.claims?.sub;

    try {
      const result = await objectStorageService.uploadDocument(documentId, content);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      await auditService.logAudit({
        entityType: "document",
        entityId: documentId,
        action: AuditAction.CREATE,
        userId,
        ipAddress: req.ip,
        metadata: {
          storageAction: "storage_upload",
          storageProvider: "replit",
          path: result.path
        }
      });

      metricsCollector.incrementCounter('storage_upload', 'document');
      res.json({ success: true, path: result.path });
    } catch (error) {
      logger.error('Storage upload error', { documentId, error });
      res.status(500).json({ error: 'Storage upload failed' });
    }
  });

  router.get("/documents/:documentId", isAuthenticated, async (req: any, res) => {
    const { documentId } = req.params;
    const userId = req.user?.claims?.sub;

    try {
      const result = await objectStorageService.downloadDocument(documentId);
      
      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      await auditService.logAudit({
        entityType: "document",
        entityId: documentId,
        action: AuditAction.READ,
        userId,
        ipAddress: req.ip,
        metadata: {
          storageAction: "storage_download",
          storageProvider: "replit"
        }
      });

      metricsCollector.incrementCounter('storage_download', 'document');
      res.json({ success: true, data: result.data });
    } catch (error) {
      logger.error('Storage download error', { documentId, error });
      res.status(500).json({ error: 'Storage download failed' });
    }
  });

  router.post("/profiles/:profileId", isAuthenticated, async (req: any, res) => {
    const { profileId } = req.params;
    const profileData = req.body;
    const userId = req.user?.claims?.sub;

    try {
      const result = await objectStorageService.uploadCompanyProfile(profileId, profileData);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      await auditService.logAudit({
        entityType: "company_profile",
        entityId: profileId,
        action: AuditAction.CREATE,
        userId,
        ipAddress: req.ip,
        metadata: {
          storageAction: "storage_upload",
          storageProvider: "replit",
          path: result.path
        }
      });

      metricsCollector.incrementCounter('storage_upload', 'profile');
      res.json({ success: true, path: result.path });
    } catch (error) {
      logger.error('Profile storage upload error', { profileId, error });
      res.status(500).json({ error: 'Profile storage upload failed' });
    }
  });

  router.get("/profiles/:profileId", isAuthenticated, async (req: any, res) => {
    const { profileId } = req.params;
    const userId = req.user?.claims?.sub;

    try {
      const result = await objectStorageService.downloadCompanyProfile(profileId);
      
      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      await auditService.logAudit({
        entityType: "company_profile",
        entityId: profileId,
        action: AuditAction.READ,
        userId,
        ipAddress: req.ip,
        metadata: {
          storageAction: "storage_download",
          storageProvider: "replit"
        }
      });

      metricsCollector.incrementCounter('storage_download', 'profile');
      res.json({ success: true, data: result.data });
    } catch (error) {
      logger.error('Profile storage download error', { profileId, error });
      res.status(500).json({ error: 'Profile storage download failed' });
    }
  });

  router.post("/files", isAuthenticated, async (req: any, res) => {
    const { filename, folder = 'files' } = req.body;
    const fileData = req.body.data;
    const userId = req.user?.claims?.sub;

    try {
      const buffer = Buffer.from(fileData, 'base64');
      const result = await objectStorageService.uploadFileFromBytes(filename, buffer, folder);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      await auditService.logAudit({
        entityType: "document",
        entityId: filename,
        action: AuditAction.CREATE,
        userId,
        ipAddress: req.ip,
        metadata: {
          storageAction: "file_upload",
          storageProvider: "replit",
          path: result.path,
          folder,
          fileType: filename.split('.').pop()
        }
      });

      metricsCollector.incrementCounter('storage_upload', 'file');
      res.json({ success: true, path: result.path });
    } catch (error) {
      logger.error('File storage upload error', { filename, error });
      res.status(500).json({ error: 'File storage upload failed' });
    }
  });

  router.get("/files/:path(*)", isAuthenticated, async (req: any, res) => {
    const { path } = req.params;
    const userId = req.user?.claims?.sub;

    try {
      const result = await objectStorageService.downloadFileAsBytes(path);
      
      if (!result.success) {
        return res.status(404).json({ error: result.error });
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
    } catch (error) {
      logger.error('File storage download error', { path, error });
      res.status(500).json({ error: 'File storage download failed' });
    }
  });

  router.get("/list", isAuthenticated, async (req: any, res) => {
    const { folder } = req.query;
    const userId = req.user?.claims?.sub;

    try {
      const result = folder 
        ? await objectStorageService.listObjectsInFolder(folder as string)
        : await objectStorageService.listObjects();
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      await auditService.logAudit({
        entityType: "document",
        entityId: folder || "root",
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

      metricsCollector.incrementCounter('storage_list', folder || 'all');
      res.json({ success: true, files: result.files || [] });
    } catch (error) {
      logger.error('Storage list error', { folder, error });
      res.status(500).json({ error: 'Storage list failed' });
    }
  });

  router.delete("/objects/*", isAuthenticated, async (req: any, res) => {
    const path = req.params[0];
    const userId = req.user?.claims?.sub;

    try {
      const result = await objectStorageService.deleteObject(path);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
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
      res.json({ success: true });
    } catch (error) {
      logger.error('Storage delete error', { path, error });
      res.status(500).json({ error: 'Storage delete failed' });
    }
  });

  router.get("/stats", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;

    try {
      const result = await objectStorageService.getStorageStats();
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
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
      res.json({ success: true, stats: result.data });
    } catch (error) {
      logger.error('Storage stats error', { error });
      res.status(500).json({ error: 'Storage stats failed' });
    }
  });

  router.post("/backups/:backupId", isAuthenticated, async (req: any, res) => {
    const { backupId } = req.params;
    const backupData = req.body;
    const userId = req.user?.claims?.sub;

    try {
      const result = await objectStorageService.uploadBackup(backupId, backupData);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
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
      res.json({ success: true, path: result.path });
    } catch (error) {
      logger.error('Backup upload error', { backupId, error });
      res.status(500).json({ error: 'Backup upload failed' });
    }
  });

  router.get("/backups/:backupId", isAuthenticated, async (req: any, res) => {
    const { backupId } = req.params;
    const userId = req.user?.claims?.sub;

    try {
      const result = await objectStorageService.downloadBackup(backupId);
      
      if (!result.success) {
        return res.status(404).json({ error: result.error });
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
    } catch (error) {
      logger.error('Backup download error', { backupId, error });
      res.status(500).json({ error: 'Backup download failed' });
    }
  });

  router.post("/audit-logs/:logId", isAuthenticated, async (req: any, res) => {
    const { logId } = req.params;
    const auditLogs = req.body.logs;
    const userId = req.user?.claims?.sub;

    try {
      const result = await objectStorageService.uploadAuditLogs(logId, auditLogs);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
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
      res.json({ success: true, path: result.path });
    } catch (error) {
      logger.error('Audit logs upload error', { logId, error });
      res.status(500).json({ error: 'Audit logs upload failed' });
    }
  });
}

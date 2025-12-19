import { Client } from '@replit/object-storage';
import { logger } from '../utils/logger';

export interface UploadResult {
  success: boolean;
  path?: string;
  error?: string;
}

export interface DownloadResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface StorageListResult {
  success: boolean;
  files?: string[];
  error?: string;
}

export class ObjectStorageService {
  private client: Client | null = null;
  private initialized: boolean = false;

  constructor() {
    // Don't initialize here - will initialize lazily on first use
  }

  private async initializeClient(): Promise<void> {
    if (this.initialized) return;

    try {
      this.client = new Client();
      // Client auto-initializes on first use, no need to call init()
      this.initialized = true;
      logger.info('Object storage client initialized successfully');
    } catch (error) {
      logger.warn('Object storage not available - features will be limited', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.client = null;
      this.initialized = true;
    }
  }

  private async ensureClient(): Promise<Client | null> {
    if (!this.initialized) {
      await this.initializeClient();
    }
    return this.client;
  }

  /**
   * Upload document content as JSON
   */
  async uploadDocument(documentId: string, content: any): Promise<UploadResult> {
    try {
      const client = await this.ensureClient();
      if (!client) {
        return { success: false, error: 'Object storage not available' };
      }

      const filename = `documents/${documentId}.json`;
      const { ok, error } = await client.uploadFromText(filename, JSON.stringify(content, null, 2));

      if (!ok) {
        const errorMessage = error ? String(error) : 'Upload failed';
        logger.error('Failed to upload document', { documentId, error: errorMessage });
        return { success: false, error: errorMessage };
      }

      logger.info('Document uploaded successfully', { documentId, filename });
      return { success: true, path: filename };
    } catch (error) {
      logger.error('Upload document error', { documentId, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Upload file from bytes (e.g., PDF, images)
   */
  async uploadFileFromBytes(filename: string, data: Buffer, folder: string = 'files'): Promise<UploadResult> {
    try {
      const client = await this.ensureClient();
      if (!client) {
        return { success: false, error: 'Object storage not available' };
      }

      const fullPath = `${folder}/${filename}`;
      const { ok, error } = await client.uploadFromBytes(fullPath, data);

      if (!ok) {
        const errorMessage = error ? String(error) : 'Upload failed';
        logger.error('Failed to upload file from bytes', { filename, error: errorMessage });
        return { success: false, error: errorMessage };
      }

      logger.info('File uploaded from bytes successfully', { filename, fullPath });
      return { success: true, path: fullPath };
    } catch (error) {
      logger.error('Upload file from bytes error', { filename, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Upload company profile data
   */
  async uploadCompanyProfile(profileId: string, profileData: any): Promise<UploadResult> {
    try {
      const client = await this.ensureClient();
      if (!client) {
        return { success: false, error: 'Object storage not available' };
      }

      const filename = `profiles/${profileId}.json`;
      const { ok, error } = await client.uploadFromText(filename, JSON.stringify(profileData, null, 2));

      if (!ok) {
        logger.error('Failed to upload company profile', { profileId, error });
        const errorMessage = typeof error === 'string'
          ? error
          : (error as Error)?.message ?? 'Upload failed';
        return { success: false, error: errorMessage };
      }

      logger.info('Company profile uploaded successfully', { profileId, filename });
      return { success: true, path: filename };
    } catch (error) {
      logger.error('Upload company profile error', { profileId, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Download document as JSON
   */
  async downloadDocument(documentId: string): Promise<DownloadResult> {
    try {
      const client = await this.ensureClient();
      if (!client) {
        return { success: false, error: 'Object storage not available' };
      }

      const filename = `documents/${documentId}.json`;
      const { ok, value, error } = await client.downloadAsText(filename);

      if (!ok) {
        logger.error('Failed to download document', { documentId, error });
        const errorMessage = typeof error === 'string'
          ? error
          : (error as Error)?.message ?? 'Download failed';
        return { success: false, error: errorMessage };
      }

      const parsedData = JSON.parse(value);
      logger.info('Document downloaded successfully', { documentId, filename });
      return { success: true, data: parsedData };
    } catch (error) {
      logger.error('Download document error', { documentId, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Download file as bytes (e.g., PDF, images)
   */
  async downloadFileAsBytes(path: string): Promise<DownloadResult> {
    try {
      const client = await this.ensureClient();
      if (!client) {
        return { success: false, error: 'Object storage not available' };
      }

      const { ok, value, error } = await client.downloadAsBytes(path);

      if (!ok) {
        logger.error('Failed to download file as bytes', { path, error });
        const errorMessage = error instanceof Error ? error.message : error ? String(error) : 'Download failed';
        return { success: false, error: errorMessage };
      }

      logger.info('File downloaded as bytes successfully', { path });
      return { success: true, data: value };
    } catch (error) {
      logger.error('Download file as bytes error', { path, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Download company profile
   */
  async downloadCompanyProfile(profileId: string): Promise<DownloadResult> {
    try {
      const client = await this.ensureClient();
      if (!client) {
        return { success: false, error: 'Object storage not available' };
      }

      const filename = `profiles/${profileId}.json`;
      const { ok, value, error } = await client.downloadAsText(filename);

      if (!ok) {
        logger.error('Failed to download company profile', { profileId, error });
        const errorMessage = error instanceof Error ? error.message : error ? String(error) : 'Download failed';
        return { success: false, error: errorMessage };
      }

      const parsedData = JSON.parse(value);
      logger.info('Company profile downloaded successfully', { profileId, filename });
      return { success: true, data: parsedData };
    } catch (error) {
      logger.error('Download company profile error', { profileId, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Stream download for large files
   */
  async downloadAsStream(path: string): Promise<DownloadResult> {
    try {
      const client = await this.ensureClient();
      if (!client) {
        return { success: false, error: 'Object storage not available' };
      }

      const result = await client.downloadAsStream(path);

      // Handle stream response properly
      if (!result || typeof result !== 'object') {
        logger.error('Failed to download as stream', { path, error: 'Invalid response' });
        return { success: false, error: 'Stream download failed' };
      }

      logger.info('File stream download initiated successfully', { path });
      return { success: true, data: result };
    } catch (error) {
      logger.error('Download as stream error', { path, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * List all objects in bucket
   */
  async listObjects(): Promise<StorageListResult> {
    try {
      const client = await this.ensureClient();
      if (!client) {
        return { success: false, error: 'Object storage not available' };
      }

      const { ok, value, error } = await client.list();

      if (!ok) {
        logger.error('Failed to list objects', { error });
        const errorMessage = error instanceof Error ? error.message : error ? String(error) : 'List failed';
        return { success: false, error: errorMessage };
      }

      const fileList = Array.isArray(value) ? value.map(item => typeof item === 'string' ? item : item.name || String(item)) : [];
      logger.info('Objects listed successfully', { count: fileList.length });
      return { success: true, files: fileList };
    } catch (error) {
      logger.error('List objects error', { error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * List objects in a specific folder
   */
  async listObjectsInFolder(folder: string): Promise<StorageListResult> {
    try {
      const client = await this.ensureClient();
      if (!client) {
        return { success: false, error: 'Object storage not available' };
      }

      const { ok, value, error } = await client.list();

      if (!ok) {
        logger.error('Failed to list objects', { error });
        const errorMessage = error instanceof Error ? error.message : error ? String(error) : 'List failed';
        return { success: false, error: errorMessage };
      }

      // Filter objects by folder prefix and convert to strings
      const allFiles = Array.isArray(value) ? value.map(item => typeof item === 'string' ? item : item.name || String(item)) : [];
      const folderFiles = allFiles.filter(file => file.startsWith(`${folder}/`));

      logger.info('Folder objects listed successfully', { folder, count: folderFiles.length });
      return { success: true, files: folderFiles };
    } catch (error) {
      logger.error('List folder objects error', { folder, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Delete an object
   */
  async deleteObject(path: string): Promise<UploadResult> {
    try {
      const client = await this.ensureClient();
      if (!client) {
        return { success: false, error: 'Object storage not available' };
      }

      const { ok, error } = await client.delete(path);

      if (!ok) {
        const errorMessage = typeof error === 'string'
          ? error
          : (error as Error)?.message ?? 'Delete failed';
        logger.error('Failed to delete object', { path, error });
        return { success: false, error: errorMessage };
      }

      logger.info('Object deleted successfully', { path });
      return { success: true };
    } catch (error) {
      logger.error('Delete object error', { path, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<UploadResult> {
    try {
      const filename = `documents/${documentId}.json`;
      return await this.deleteObject(filename);
    } catch (error) {
      logger.error('Delete document error', { documentId, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Delete company profile
   */
  async deleteCompanyProfile(profileId: string): Promise<UploadResult> {
    try {
      const filename = `profiles/${profileId}.json`;
      return await this.deleteObject(filename);
    } catch (error) {
      logger.error('Delete company profile error', { profileId, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Upload backup data
   */
  async uploadBackup(backupId: string, data: any): Promise<UploadResult> {
    try {
      const client = await this.ensureClient();
      if (!client) {
        return { success: false, error: 'Object storage not available' };
      }

      const filename = `backups/${backupId}.json`;
      const { ok, error } = await client.uploadFromText(filename, JSON.stringify(data, null, 2));

      if (!ok) {
        logger.error('Failed to upload backup', { backupId, error });
        const errorMessage = typeof error === 'string'
          ? error
          : (error as Error)?.message ?? 'Backup upload failed';
        return { success: false, error: errorMessage };
      }

      logger.info('Backup uploaded successfully', { backupId, filename });
      return { success: true, path: filename };
    } catch (error) {
      logger.error('Upload backup error', { backupId, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Download backup data
   */
  async downloadBackup(backupId: string): Promise<DownloadResult> {
    try {
      const client = await this.ensureClient();
      if (!client) {
        return { success: false, error: 'Object storage not available' };
      }

      const filename = `backups/${backupId}.json`;
      const { ok, value, error } = await client.downloadAsText(filename);

      if (!ok) {
        logger.error('Failed to download backup', { backupId, error });
        const errorMessage = typeof error === 'string'
          ? error
          : (error as Error)?.message ?? 'Backup download failed';
        return { success: false, error: errorMessage };
      }

      const parsedData = JSON.parse(value);
      logger.info('Backup downloaded successfully', { backupId, filename });
      return { success: true, data: parsedData };
    } catch (error) {
      logger.error('Download backup error', { backupId, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Upload audit logs for compliance
   */
  async uploadAuditLogs(logId: string, logs: any[]): Promise<UploadResult> {
    try {
      const client = await this.ensureClient();
      if (!client) {
        return { success: false, error: 'Object storage not available' };
      }

      const filename = `audit-logs/${logId}.json`;
      const { ok, error } = await client.uploadFromText(filename, JSON.stringify(logs, null, 2));

      if (!ok) {
        logger.error('Failed to upload audit logs', { logId, error });
        const errorMessage = typeof error === 'string'
          ? error
          : (error as Error)?.message ?? 'Audit logs upload failed';
        return { success: false, error: errorMessage };
      }

      logger.info('Audit logs uploaded successfully', { logId, filename, logCount: logs.length });
      return { success: true, path: filename };
    } catch (error) {
      logger.error('Upload audit logs error', { logId, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<DownloadResult> {
    try {
      const listResult = await this.listObjects();

      if (!listResult.success || !listResult.files) {
        return { success: false, error: 'Failed to get storage stats' };
      }

      const stats = {
        totalFiles: listResult.files.length,
        byFolder: {
          documents: listResult.files.filter(f => f.startsWith('documents/')).length,
          profiles: listResult.files.filter(f => f.startsWith('profiles/')).length,
          backups: listResult.files.filter(f => f.startsWith('backups/')).length,
          auditLogs: listResult.files.filter(f => f.startsWith('audit-logs/')).length,
          files: listResult.files.filter(f => f.startsWith('files/')).length,
          other: listResult.files.filter(f => !f.includes('/')).length
        },
        lastUpdated: new Date().toISOString()
      };

      logger.info('Storage stats generated', stats);
      return { success: true, data: stats };
    } catch (error) {
      logger.error('Get storage stats error', { error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const objectStorageService = new ObjectStorageService();

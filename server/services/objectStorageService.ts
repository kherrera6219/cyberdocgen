import { Storage, Bucket } from '@google-cloud/storage';
import { config } from '../config';
import { logger } from '../utils/logger';
import { Readable } from 'stream';

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

class GoogleCloudStorageService {
  private storage: Storage | null = null;
  private bucket: Bucket | null = null;
  private initialized: boolean = false;

  constructor() {
    // Lazy initialization
  }

  private async initializeClient(): Promise<void> {
    if (this.initialized) return;

    if (config.storage.provider !== 'gcs') {
      logger.warn('Google Cloud Storage is not the configured provider.');
      this.initialized = true;
      return;
    }

    if (!config.storage.bucket) {
      logger.error('STORAGE_BUCKET environment variable is not set for GCS provider.');
      this.initialized = true;
      return;
    }

    try {
      this.storage = new Storage();
      this.bucket = this.storage.bucket(config.storage.bucket);
      const [exists] = await this.bucket.exists();
      if (!exists) {
        throw new Error(`Bucket ${config.storage.bucket} does not exist.`);
      }
      logger.info(`Successfully connected to GCS bucket: ${config.storage.bucket}`);
    } catch (error) {
      logger.error('Failed to initialize Google Cloud Storage client', {
        error: error instanceof Error ? error.message : String(error),
      });
      this.storage = null;
      this.bucket = null;
    } finally {
      this.initialized = true;
    }
  }

  private async ensureClient(): Promise<Bucket | null> {
    if (!this.initialized) {
      await this.initializeClient();
    }
    return this.bucket;
  }

  private getOrganizationPrefix(organizationId?: string): string | null {
    return organizationId ? `organizations/${organizationId}` : null;
  }

  private buildScopedPath(basePath: string, organizationId?: string): string {
    const organizationPrefix = this.getOrganizationPrefix(organizationId);
    return organizationPrefix ? `${organizationPrefix}/${basePath}` : basePath;
  }

  private stripOrganizationPrefix(path: string, organizationId?: string): string {
    const organizationPrefix = this.getOrganizationPrefix(organizationId);
    if (!organizationPrefix) {
      return path;
    }

    const prefixWithSlash = `${organizationPrefix}/`;
    return path.startsWith(prefixWithSlash)
      ? path.slice(prefixWithSlash.length)
      : path;
  }
  
  private async upload(path: string, data: string | Buffer): Promise<UploadResult> {
    const bucket = await this.ensureClient();
    if (!bucket) {
      return { success: false, error: 'Storage service not available' };
    }
    try {
      const file = bucket.file(path);
      await file.save(data);
      logger.info('File uploaded successfully', { path });
      return { success: true, path };
    } catch (error) {
      logger.error('Failed to upload to GCS', { path, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  private async download(path: string): Promise<DownloadResult> {
    const bucket = await this.ensureClient();
    if (!bucket) {
      return { success: false, error: 'Storage service not available' };
    }
    try {
      const file = bucket.file(path);
      const [data] = await file.download();
      logger.info('File downloaded successfully', { path });
      return { success: true, data };
    } catch (error) {
      logger.error('Failed to download from GCS', { path, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async uploadDocument(documentId: string, content: any, organizationId?: string): Promise<UploadResult> {
    const filename = this.buildScopedPath(`documents/${documentId}.json`, organizationId);
    return this.upload(filename, JSON.stringify(content, null, 2));
  }

  async uploadFileFromBytes(filename: string, data: Buffer, folder: string = 'files'): Promise<UploadResult> {
    const fullPath = `${folder}/${filename}`;
    return this.upload(fullPath, data);
  }

  async uploadCompanyProfile(profileId: string, profileData: any, organizationId?: string): Promise<UploadResult> {
    const filename = this.buildScopedPath(`profiles/${profileId}.json`, organizationId);
    return this.upload(filename, JSON.stringify(profileData, null, 2));
  }
  
  async downloadDocument(documentId: string, organizationId?: string): Promise<DownloadResult> {
    const filename = this.buildScopedPath(`documents/${documentId}.json`, organizationId);
    const result = await this.download(filename);
    if (result.success && result.data) {
      try {
        result.data = JSON.parse(result.data.toString('utf-8'));
      } catch (e) {
        return { success: false, error: 'Failed to parse document JSON' };
      }
    }
    return result;
  }
  
  async downloadFileAsBytes(path: string): Promise<DownloadResult> {
    return this.download(path);
  }

  async downloadCompanyProfile(profileId: string, organizationId?: string): Promise<DownloadResult> {
    const filename = this.buildScopedPath(`profiles/${profileId}.json`, organizationId);
    const result = await this.download(filename);
    if (result.success && result.data) {
      try {
        result.data = JSON.parse(result.data.toString('utf-8'));
      } catch (e) {
        return { success: false, error: 'Failed to parse profile JSON' };
      }
    }
    return result;
  }

  async downloadAsStream(path: string): Promise<DownloadResult> {
    const bucket = await this.ensureClient();
    if (!bucket) {
      logger.error('Stream download failed: storage service not available');
      return { success: false, error: 'Storage service not available' };
    }
    try {
      const file = bucket.file(path);
      const stream = file.createReadStream();
      logger.info('File stream download initiated successfully', { path });
      return { success: true, data: stream };
    } catch (error) {
      logger.error('Download as stream error', { path, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async listObjects(prefix?: string): Promise<StorageListResult> {
    const bucket = await this.ensureClient();
    if (!bucket) {
      return { success: false, error: 'Storage service not available' };
    }
    try {
      const [files] = await bucket.getFiles({ prefix });
      const fileList = files.map(file => file.name);
      logger.info('Objects listed successfully', { prefix, count: fileList.length });
      return { success: true, files: fileList };
    } catch (error) {
      logger.error('List objects error', { prefix, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async listObjectsInFolder(folder: string): Promise<StorageListResult> {
    const prefix = folder.endsWith('/') ? folder : `${folder}/`;
    return this.listObjects(prefix);
  }
  
  async deleteObject(path: string): Promise<UploadResult> {
    const bucket = await this.ensureClient();
    if (!bucket) {
      return { success: false, error: 'Storage service not available' };
    }
    try {
      await bucket.file(path).delete();
      logger.info('Object deleted successfully', { path });
      return { success: true };
    } catch (error) {
      logger.error('Delete object error', { path, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async deleteDocument(documentId: string, organizationId?: string): Promise<UploadResult> {
    const filename = this.buildScopedPath(`documents/${documentId}.json`, organizationId);
    return this.deleteObject(filename);
  }

  async deleteCompanyProfile(profileId: string, organizationId?: string): Promise<UploadResult> {
    const filename = this.buildScopedPath(`profiles/${profileId}.json`, organizationId);
    return this.deleteObject(filename);
  }
  
  async uploadBackup(backupId: string, data: any, organizationId?: string): Promise<UploadResult> {
    const filename = this.buildScopedPath(`backups/${backupId}.json`, organizationId);
    return this.upload(filename, JSON.stringify(data, null, 2));
  }

  async downloadBackup(backupId: string, organizationId?: string): Promise<DownloadResult> {
    const filename = this.buildScopedPath(`backups/${backupId}.json`, organizationId);
    const result = await this.download(filename);
    if (result.success && result.data) {
      try {
        result.data = JSON.parse(result.data.toString('utf-8'));
      } catch (e) {
        return { success: false, error: 'Failed to parse backup JSON' };
      }
    }
    return result;
  }
  
  async uploadAuditLogs(logId: string, logs: any[], organizationId?: string): Promise<UploadResult> {
    const filename = this.buildScopedPath(`audit-logs/${logId}.json`, organizationId);
    return this.upload(filename, JSON.stringify(logs, null, 2));
  }

  async getStorageStats(organizationId?: string): Promise<DownloadResult> {
    try {
      const organizationPrefix = this.getOrganizationPrefix(organizationId);
      const listPrefix = organizationPrefix ? `${organizationPrefix}/` : undefined;
      const listResult = await this.listObjects(listPrefix);
      if (!listResult.success || !listResult.files) {
        return { success: false, error: 'Failed to get storage stats' };
      }
      const files = listResult.files.map((file) => this.stripOrganizationPrefix(file, organizationId));
      const stats = {
        totalFiles: files.length,
        byFolder: {
          documents: files.filter(f => f.startsWith('documents/')).length,
          profiles: files.filter(f => f.startsWith('profiles/')).length,
          backups: files.filter(f => f.startsWith('backups/')).length,
          auditLogs: files.filter(f => f.startsWith('audit-logs/')).length,
          files: files.filter(f => f.startsWith('files/')).length,
          other: files.filter(f => !f.includes('/')).length
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

export const objectStorageService = new GoogleCloudStorageService();

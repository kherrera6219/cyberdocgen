import { Storage, Bucket } from '@google-cloud/storage';
import { config } from '../config';
import { logger } from '../utils/logger';
import { isLocalMode, getRuntimeConfig } from '../config/runtime';
import fs from 'fs';
import path from 'path';

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

// ---------------------------------------------------------------------------
// Local filesystem backend
// ---------------------------------------------------------------------------

class LocalFileStorageService {
  private get basePath(): string {
    return getRuntimeConfig().storage.basePath || path.join(process.cwd(), 'local-storage');
  }

  private resolvePath(relativePath: string): string {
    // Prevent path traversal
    const resolved = path.resolve(this.basePath, relativePath);
    if (!resolved.startsWith(path.resolve(this.basePath))) {
      throw new Error(`Path traversal attempt blocked: ${relativePath}`);
    }
    return resolved;
  }

  private ensureDir(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private getOrganizationPrefix(organizationId?: string): string | null {
    return organizationId ? `organizations/${organizationId}` : null;
  }

  private buildScopedPath(basePath: string, organizationId?: string): string {
    const prefix = this.getOrganizationPrefix(organizationId);
    return prefix ? `${prefix}/${basePath}` : basePath;
  }

  private stripOrganizationPrefix(filePath: string, organizationId?: string): string {
    const prefix = this.getOrganizationPrefix(organizationId);
    if (!prefix) return filePath;
    const withSlash = `${prefix}/`;
    return filePath.startsWith(withSlash) ? filePath.slice(withSlash.length) : filePath;
  }

  private async upload(relativePath: string, data: string | Buffer): Promise<UploadResult> {
    try {
      const fullPath = this.resolvePath(relativePath);
      this.ensureDir(fullPath);
      fs.writeFileSync(fullPath, data);
      logger.info('File saved to local storage', { path: relativePath });
      return { success: true, path: relativePath };
    } catch (error) {
      logger.error('Local storage write failed', { relativePath, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async download(relativePath: string): Promise<DownloadResult> {
    try {
      const fullPath = this.resolvePath(relativePath);
      if (!fs.existsSync(fullPath)) {
        return { success: false, error: `File not found: ${relativePath}` };
      }
      const data = fs.readFileSync(fullPath);
      logger.info('File read from local storage', { path: relativePath });
      return { success: true, data };
    } catch (error) {
      logger.error('Local storage read failed', { relativePath, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async uploadDocument(documentId: string, content: any, organizationId?: string): Promise<UploadResult> {
    const relativePath = this.buildScopedPath(`documents/${documentId}.json`, organizationId);
    return this.upload(relativePath, JSON.stringify(content, null, 2));
  }

  async uploadFileFromBytes(filename: string, data: Buffer, folder: string = 'files'): Promise<UploadResult> {
    return this.upload(`${folder}/${filename}`, data);
  }

  async uploadCompanyProfile(profileId: string, profileData: any, organizationId?: string): Promise<UploadResult> {
    const relativePath = this.buildScopedPath(`profiles/${profileId}.json`, organizationId);
    return this.upload(relativePath, JSON.stringify(profileData, null, 2));
  }

  async downloadDocument(documentId: string, organizationId?: string): Promise<DownloadResult> {
    const relativePath = this.buildScopedPath(`documents/${documentId}.json`, organizationId);
    const result = await this.download(relativePath);
    if (result.success && result.data) {
      try { result.data = JSON.parse(result.data.toString('utf-8')); } catch { return { success: false, error: 'Failed to parse document JSON' }; }
    }
    return result;
  }

  async downloadFileAsBytes(relativePath: string): Promise<DownloadResult> {
    return this.download(relativePath);
  }

  async downloadCompanyProfile(profileId: string, organizationId?: string): Promise<DownloadResult> {
    const relativePath = this.buildScopedPath(`profiles/${profileId}.json`, organizationId);
    const result = await this.download(relativePath);
    if (result.success && result.data) {
      try { result.data = JSON.parse(result.data.toString('utf-8')); } catch { return { success: false, error: 'Failed to parse profile JSON' }; }
    }
    return result;
  }

  async downloadAsStream(relativePath: string): Promise<DownloadResult> {
    try {
      const fullPath = this.resolvePath(relativePath);
      if (!fs.existsSync(fullPath)) return { success: false, error: 'File not found' };
      const stream = fs.createReadStream(fullPath);
      return { success: true, data: stream };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async listObjects(prefix?: string): Promise<StorageListResult> {
    try {
      const scanBase = prefix ? this.resolvePath(prefix) : this.basePath;
      if (!fs.existsSync(scanBase)) return { success: true, files: [] };
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const fullEntry = path.join(dir, entry.name);
          if (entry.isDirectory()) { walk(fullEntry); }
          else { files.push(path.relative(this.basePath, fullEntry).replace(/\\/g, '/')); }
        }
      };
      walk(scanBase);
      return { success: true, files };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async listObjectsInFolder(folder: string): Promise<StorageListResult> {
    const prefix = folder.endsWith('/') ? folder : `${folder}/`;
    return this.listObjects(prefix);
  }

  async deleteObject(relativePath: string): Promise<UploadResult> {
    try {
      const fullPath = this.resolvePath(relativePath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async deleteDocument(documentId: string, organizationId?: string): Promise<UploadResult> {
    return this.deleteObject(this.buildScopedPath(`documents/${documentId}.json`, organizationId));
  }

  async deleteCompanyProfile(profileId: string, organizationId?: string): Promise<UploadResult> {
    return this.deleteObject(this.buildScopedPath(`profiles/${profileId}.json`, organizationId));
  }

  async uploadBackup(backupId: string, data: any, organizationId?: string): Promise<UploadResult> {
    return this.upload(this.buildScopedPath(`backups/${backupId}.json`, organizationId), JSON.stringify(data, null, 2));
  }

  async downloadBackup(backupId: string, organizationId?: string): Promise<DownloadResult> {
    const relativePath = this.buildScopedPath(`backups/${backupId}.json`, organizationId);
    const result = await this.download(relativePath);
    if (result.success && result.data) {
      try { result.data = JSON.parse(result.data.toString('utf-8')); } catch { return { success: false, error: 'Failed to parse backup JSON' }; }
    }
    return result;
  }

  async uploadAuditLogs(logId: string, logs: any[], organizationId?: string): Promise<UploadResult> {
    return this.upload(this.buildScopedPath(`audit-logs/${logId}.json`, organizationId), JSON.stringify(logs, null, 2));
  }

  async getStorageStats(organizationId?: string): Promise<DownloadResult> {
    try {
      const prefix = this.getOrganizationPrefix(organizationId);
      const scanPath = prefix ? path.join(this.basePath, prefix) : this.basePath;
      const listResult = await this.listObjects(prefix ? prefix + '/' : undefined);
      if (!listResult.success || !listResult.files) return { success: false, error: 'Failed to get storage stats' };
      const files = listResult.files.map(f => this.stripOrganizationPrefix(f, organizationId));
      const stats = {
        totalFiles: files.length,
        byFolder: {
          documents: files.filter(f => f.startsWith('documents/')).length,
          profiles: files.filter(f => f.startsWith('profiles/')).length,
          backups: files.filter(f => f.startsWith('backups/')).length,
          auditLogs: files.filter(f => f.startsWith('audit-logs/')).length,
          files: files.filter(f => f.startsWith('files/')).length,
          other: files.filter(f => !f.includes('/')).length,
        },
        lastUpdated: new Date().toISOString(),
      };
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// ---------------------------------------------------------------------------
// GCS cloud backend (unchanged from original)
// ---------------------------------------------------------------------------

class GoogleCloudStorageService {
  private storage: Storage | null = null;
  private bucket: Bucket | null = null;
  private initialized: boolean = false;
  private retryAfter: number = 0;
  private static readonly RETRY_INTERVAL_MS = 30_000;

  constructor() {}

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
      if (!exists) throw new Error(`Bucket ${config.storage.bucket} does not exist.`);
      logger.info(`Successfully connected to GCS bucket: ${config.storage.bucket}`);
      this.initialized = true;
      this.retryAfter = 0;
    } catch (error) {
      logger.error('Failed to initialize Google Cloud Storage client — will retry in 30 s', {
        error: error instanceof Error ? error.message : String(error),
      });
      this.storage = null;
      this.bucket = null;
      this.retryAfter = Date.now() + GoogleCloudStorageService.RETRY_INTERVAL_MS;
    }
  }

  private async ensureClient(): Promise<Bucket | null> {
    if (!this.initialized && Date.now() >= this.retryAfter) {
      await this.initializeClient();
    }
    return this.bucket;
  }

  private getOrganizationPrefix(organizationId?: string): string | null {
    return organizationId ? `organizations/${organizationId}` : null;
  }

  private buildScopedPath(basePath: string, organizationId?: string): string {
    const prefix = this.getOrganizationPrefix(organizationId);
    return prefix ? `${prefix}/${basePath}` : basePath;
  }

  private stripOrganizationPrefix(filePath: string, organizationId?: string): string {
    const prefix = this.getOrganizationPrefix(organizationId);
    if (!prefix) return filePath;
    const withSlash = `${prefix}/`;
    return filePath.startsWith(withSlash) ? filePath.slice(withSlash.length) : filePath;
  }

  private async upload(p: string, data: string | Buffer): Promise<UploadResult> {
    const bucket = await this.ensureClient();
    if (!bucket) return { success: false, error: 'Storage service not available' };
    try {
      await bucket.file(p).save(data);
      logger.info('File uploaded successfully', { path: p });
      return { success: true, path: p };
    } catch (error) {
      logger.error('Failed to upload to GCS', { path: p, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async download(p: string): Promise<DownloadResult> {
    const bucket = await this.ensureClient();
    if (!bucket) return { success: false, error: 'Storage service not available' };
    try {
      const [data] = await bucket.file(p).download();
      logger.info('File downloaded successfully', { path: p });
      return { success: true, data };
    } catch (error) {
      logger.error('Failed to download from GCS', { path: p, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async uploadDocument(documentId: string, content: any, organizationId?: string): Promise<UploadResult> {
    return this.upload(this.buildScopedPath(`documents/${documentId}.json`, organizationId), JSON.stringify(content, null, 2));
  }

  async uploadFileFromBytes(filename: string, data: Buffer, folder = 'files'): Promise<UploadResult> {
    return this.upload(`${folder}/${filename}`, data);
  }

  async uploadCompanyProfile(profileId: string, profileData: any, organizationId?: string): Promise<UploadResult> {
    return this.upload(this.buildScopedPath(`profiles/${profileId}.json`, organizationId), JSON.stringify(profileData, null, 2));
  }

  async downloadDocument(documentId: string, organizationId?: string): Promise<DownloadResult> {
    const result = await this.download(this.buildScopedPath(`documents/${documentId}.json`, organizationId));
    if (result.success && result.data) { try { result.data = JSON.parse(result.data.toString('utf-8')); } catch { return { success: false, error: 'Failed to parse document JSON' }; } }
    return result;
  }

  async downloadFileAsBytes(p: string): Promise<DownloadResult> {
    return this.download(p);
  }

  async downloadCompanyProfile(profileId: string, organizationId?: string): Promise<DownloadResult> {
    const result = await this.download(this.buildScopedPath(`profiles/${profileId}.json`, organizationId));
    if (result.success && result.data) { try { result.data = JSON.parse(result.data.toString('utf-8')); } catch { return { success: false, error: 'Failed to parse profile JSON' }; } }
    return result;
  }

  async downloadAsStream(p: string): Promise<DownloadResult> {
    const bucket = await this.ensureClient();
    if (!bucket) return { success: false, error: 'Storage service not available' };
    try {
      return { success: true, data: bucket.file(p).createReadStream() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async listObjects(prefix?: string): Promise<StorageListResult> {
    const bucket = await this.ensureClient();
    if (!bucket) return { success: false, error: 'Storage service not available' };
    try {
      const [files] = await bucket.getFiles({ prefix });
      return { success: true, files: files.map(f => f.name) };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async listObjectsInFolder(folder: string): Promise<StorageListResult> {
    return this.listObjects(folder.endsWith('/') ? folder : `${folder}/`);
  }

  async deleteObject(p: string): Promise<UploadResult> {
    const bucket = await this.ensureClient();
    if (!bucket) return { success: false, error: 'Storage service not available' };
    try {
      await bucket.file(p).delete();
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async deleteDocument(documentId: string, organizationId?: string): Promise<UploadResult> {
    return this.deleteObject(this.buildScopedPath(`documents/${documentId}.json`, organizationId));
  }

  async deleteCompanyProfile(profileId: string, organizationId?: string): Promise<UploadResult> {
    return this.deleteObject(this.buildScopedPath(`profiles/${profileId}.json`, organizationId));
  }

  async uploadBackup(backupId: string, data: any, organizationId?: string): Promise<UploadResult> {
    return this.upload(this.buildScopedPath(`backups/${backupId}.json`, organizationId), JSON.stringify(data, null, 2));
  }

  async downloadBackup(backupId: string, organizationId?: string): Promise<DownloadResult> {
    const result = await this.download(this.buildScopedPath(`backups/${backupId}.json`, organizationId));
    if (result.success && result.data) { try { result.data = JSON.parse(result.data.toString('utf-8')); } catch { return { success: false, error: 'Failed to parse backup JSON' }; } }
    return result;
  }

  async uploadAuditLogs(logId: string, logs: any[], organizationId?: string): Promise<UploadResult> {
    return this.upload(this.buildScopedPath(`audit-logs/${logId}.json`, organizationId), JSON.stringify(logs, null, 2));
  }

  async getStorageStats(organizationId?: string): Promise<DownloadResult> {
    try {
      const prefix = this.getOrganizationPrefix(organizationId);
      const listPrefix = prefix ? `${prefix}/` : undefined;
      const listResult = await this.listObjects(listPrefix);
      if (!listResult.success || !listResult.files) return { success: false, error: 'Failed to get storage stats' };
      const files = listResult.files.map(f => this.stripOrganizationPrefix(f, organizationId));
      return {
        success: true,
        data: {
          totalFiles: files.length,
          byFolder: {
            documents: files.filter(f => f.startsWith('documents/')).length,
            profiles: files.filter(f => f.startsWith('profiles/')).length,
            backups: files.filter(f => f.startsWith('backups/')).length,
            auditLogs: files.filter(f => f.startsWith('audit-logs/')).length,
            files: files.filter(f => f.startsWith('files/')).length,
            other: files.filter(f => !f.includes('/')).length,
          },
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// ---------------------------------------------------------------------------
// Export the right implementation based on deployment mode
// ---------------------------------------------------------------------------
export const objectStorageService: LocalFileStorageService | GoogleCloudStorageService =
  isLocalMode() ? new LocalFileStorageService() : new GoogleCloudStorageService();

/**
 * Cloud Storage Provider
 *
 * Cloud mode storage implementation using the shared objectStorageService.
 */

import path from 'path';
import crypto from 'crypto';
import type { IStorageProvider, StorageFile } from '../interfaces';
import { logger } from '../../utils/logger';
import { objectStorageService } from '../../services/objectStorageService';

export class CloudStorageProvider implements IStorageProvider {
  private bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
  }

  private sanitizePath(input: string): string {
    const normalized = input.replace(/\\/g, '/').replace(/^\/+/, '');
    const parts = normalized.split('/').filter(Boolean);
    if (parts.includes('..')) {
      throw new Error('Invalid path: path traversal is not allowed');
    }
    return parts.join('/');
  }

  private toObjectPath(uriOrPath: string): string {
    const fromUri = uriOrPath.startsWith('gs://')
      ? uriOrPath.slice('gs://'.length)
      : uriOrPath;
    const sanitized = this.sanitizePath(fromUri);

    if (sanitized.startsWith(`${this.bucket}/`)) {
      return sanitized;
    }

    return `${this.bucket}/${sanitized}`;
  }

  private toUri(objectPath: string): string {
    return `gs://${objectPath}`;
  }

  private getContentType(filePath: string): string {
    const ext = path.posix.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.json': 'application/json',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.csv': 'text/csv',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.zip': 'application/zip',
    };

    return mimeMap[ext] || 'application/octet-stream';
  }

  async save(
    file: Buffer,
    filePath: string,
    metadata?: { contentType?: string }
  ): Promise<StorageFile> {
    const objectPath = this.toObjectPath(filePath);
    const folder = path.posix.dirname(objectPath);
    const fileName = path.posix.basename(objectPath);

    const upload = await objectStorageService.uploadFileFromBytes(fileName, file, folder);
    if (!upload.success || !upload.path) {
      throw new Error(upload.error || 'Cloud storage upload failed');
    }

    const savedPath = this.sanitizePath(upload.path);
    const hash = crypto.createHash('sha256').update(file).digest('hex');

    logger.debug('[CloudStorageProvider] File saved', { path: savedPath, size: file.length });

    return {
      path: savedPath,
      uri: this.toUri(savedPath),
      size: file.length,
      contentType: metadata?.contentType || this.getContentType(savedPath),
      hash,
    };
  }

  async read(uri: string): Promise<Buffer> {
    const objectPath = this.toObjectPath(uri);
    const downloaded = await objectStorageService.downloadFileAsBytes(objectPath);

    if (!downloaded.success || !downloaded.data) {
      throw new Error(downloaded.error || `Failed to read object: ${objectPath}`);
    }

    return Buffer.from(downloaded.data);
  }

  async exists(uri: string): Promise<boolean> {
    try {
      const objectPath = this.toObjectPath(uri);
      const downloaded = await objectStorageService.downloadFileAsBytes(objectPath);
      return downloaded.success;
    } catch {
      return false;
    }
  }

  async delete(uri: string): Promise<void> {
    const objectPath = this.toObjectPath(uri);
    const result = await objectStorageService.deleteObject(objectPath);
    if (!result.success) {
      throw new Error(result.error || `Failed to delete object: ${objectPath}`);
    }
  }

  async list(prefix?: string): Promise<StorageFile[]> {
    const objectPrefix = prefix ? this.toObjectPath(prefix) : this.bucket;
    const result = await objectStorageService.listObjectsInFolder(objectPrefix);

    if (!result.success || !result.files) {
      throw new Error(result.error || 'Failed to list cloud storage objects');
    }

    return result.files.map(filePath => ({
      path: filePath,
      uri: this.toUri(filePath),
      size: 0,
      contentType: this.getContentType(filePath),
    }));
  }

  async getMetadata(uri: string): Promise<Pick<StorageFile, 'size' | 'contentType'>> {
    const content = await this.read(uri);
    return {
      size: content.length,
      contentType: this.getContentType(this.toObjectPath(uri)),
    };
  }
}

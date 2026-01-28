/**
 * Cloud Storage Provider
 * 
 * Cloud mode storage implementation using S3/GCS/Azure Blob.
 * Delegates to existing objectStorageService.
 */

import type { IStorageProvider, StorageFile } from '../interfaces';
import crypto from 'crypto';
import { logger } from '../../utils/logger';

export class CloudStorageProvider implements IStorageProvider {
  private bucket: string;
  
  constructor(bucket: string) {
    this.bucket = bucket;
  }
  
  async save(
    file: Buffer,
    path: string,
    metadata?: { contentType?: string }
  ): Promise<StorageFile> {
    // TODO: Delegate to existing objectStorageService
    const hash = crypto.createHash('sha256').update(file).digest('hex');
    
    logger.debug(`[CloudStorageProvider] Would upload to ${this.bucket}/${path}`);
    
    // Return expected shape (actual upload in Sprint 1)
    return {
      path,
      uri: `gs://${this.bucket}/${path}`,
      size: file.length,
      contentType: metadata?.contentType || 'application/octet-stream',
      hash,
    };
  }
  
  async read(uri: string): Promise<Buffer> {
    // TODO: Delegate to existing objectStorageService
    logger.debug(`[CloudStorageProvider] Would read from ${uri}`);
    throw new Error('CloudStorageProvider.read() - Delegate to objectStorageService');
  }
  
  async exists(uri: string): Promise<boolean> {
    // TODO: Check if object exists
    logger.debug(`[CloudStorageProvider] Checking existence of ${uri}`);
    return false;
  }
  
  async delete(uri: string): Promise<void> {
    // TODO: Delete object
    logger.debug(`[CloudStorageProvider] Would delete ${uri}`);
  }
  
  async list(prefix?: string): Promise<StorageFile[]> {
    // TODO: List objects with prefix
    logger.debug(`[CloudStorageProvider] Would list objects with prefix: ${prefix}`);
    return [];
  }
  
  async getMetadata(uri: string): Promise<Pick<StorageFile, 'size' | 'contentType'>> {
    // TODO: Get object metadata
    logger.debug(`[CloudStorageProvider] Would get metadata for ${uri}`);
    throw new Error('CloudStorageProvider.getMetadata() - To be implemented');
  }
}

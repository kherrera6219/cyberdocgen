/**
 * Local Filesystem Storage Provider
 * 
 * Local mode storage implementation using Windows filesystem.
 * Stores files in user data directory with content-addressable naming.
 * 
 * To be fully implemented in Sprint 1.
 */

import type { IStorageProvider, StorageFile } from '../interfaces';
import crypto from 'crypto';
import path from 'path';

export class LocalFsStorageProvider implements IStorageProvider {
  private basePath: string;
  
  constructor(basePath: string) {
    this.basePath = basePath;
  }
  
  /**
   * Ensure the storage directory exists
   */
  private async ensureDirectory(dir: string): Promise<void> {
    // TODO(sprint-1): Create directory if it doesn't exist
    // const fs = await import('fs/promises');
    // await fs.mkdir(dir, { recursive: true });
    console.log(`[LocalFsStorageProvider] Would ensure directory: ${dir}`);
  }
  
  /**
   * Generate content-addressable filename
   */
  private generateStoragePath(file: Buffer, originalPath: string): string {
    const hash = crypto.createHash('sha256').update(file).digest('hex').substring(0, 16);
    const ext = path.extname(originalPath);
    const basename = path.basename(originalPath, ext);
    
    // Format: basePath/hash[0:2]/hash[2:4]/hash_basename.ext
    return path.join(
      this.basePath,
      hash.substring(0, 2),
      hash.substring(2, 4),
      `${hash}_${basename}${ext}`
    );
  }
  
  async save(
    file: Buffer,
    filePath: string,
    metadata?: { contentType?: string }
  ): Promise<StorageFile> {
    const storagePath = this.generateStoragePath(file, filePath);
    const hash = crypto.createHash('sha256').update(file).digest('hex');
    
    console.log(`[LocalFsStorageProvider] Would save to: ${storagePath}`);
    
    // TODO(sprint-1): Actually write file
    // await this.ensureDirectory(path.dirname(storagePath));
    // const fs = await import('fs/promises');
    // await fs.writeFile(storagePath, file);
    
    return {
      path: filePath,
      uri: `file://${storagePath}`,
      size: file.length,
      contentType: metadata?.contentType || 'application/octet-stream',
      hash,
    };
  }
  
  async read(uri: string): Promise<Buffer> {
    // Extract path from file:// URI
    const filePath = uri.replace('file://', '');
    
    console.log(`[LocalFsStorageProvider] Would read from: ${filePath}`);
    
    // TODO(sprint-1): Actually read file
    // const fs = await import('fs/promises');
    // return fs.readFile(filePath);
    
    throw new Error('LocalFsStorageProvider.read() - To be implemented in Sprint 1');
  }
  
  async exists(uri: string): Promise<boolean> {
    const filePath = uri.replace('file://', '');
    
    // TODO(sprint-1): Check file existence
    // const fs = await import('fs/promises');
    // try {
    //   await fs.access(filePath);
    //   return true;
    // } catch {
    //   return false;
    // }
    
    console.log(`[LocalFsStorageProvider] Would check existence of: ${filePath}`);
    return false;
  }
  
  async delete(uri: string): Promise<void> {
    const filePath = uri.replace('file://', '');
    
    console.log(`[LocalFsStorageProvider] Would delete: ${filePath}`);
    
    // TODO(sprint-1): Actually delete file
    // const fs = await import('fs/promises');
    // await fs.unlink(filePath);
  }
  
  async list(prefix?: string): Promise<StorageFile[]> {
    const searchPath = prefix ? path.join(this.basePath, prefix) : this.basePath;
    
    console.log(`[LocalFsStorageProvider] Would list files in: ${searchPath}`);
    
    // TODO(sprint-1): List files recursively
    // const fs = await import('fs/promises');
    // const files = await fs.readdir(searchPath, { recursive: true });
    
    return [];
  }
  
  async getMetadata(uri: string): Promise<Pick<StorageFile, 'size' | 'contentType'>> {
    const filePath = uri.replace('file://', '');
    
    console.log(`[LocalFsStorageProvider] Would get metadata for: ${filePath}`);
    
    // TODO(sprint-1): Get file stats
    // const fs = await import('fs/promises');
    // const stats = await fs.stat(filePath);
    // return { size: stats.size, contentType: mime.lookup(filePath) || 'application/octet-stream' };
    
    throw new Error('LocalFsStorageProvider.getMetadata() - To be implemented in Sprint 1');
  }
}

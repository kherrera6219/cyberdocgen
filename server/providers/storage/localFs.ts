/**
 * Local Filesystem Storage Provider
 *
 * Local mode storage implementation using Windows filesystem.
 * Stores files in user data directory with content-addressable naming.
 *
 * Implementation: Sprint 1
 */

import type { IStorageProvider, StorageFile } from '../interfaces';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { logger } from '../../utils/logger';

export class LocalFsStorageProvider implements IStorageProvider {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
    logger.debug(`[LocalFsStorageProvider] Initialized with basePath: ${basePath}`);

    // Create base directory if it doesn't exist
    if (!fsSync.existsSync(basePath)) {
      fsSync.mkdirSync(basePath, { recursive: true });
      logger.debug(`[LocalFsStorageProvider] Created base directory: ${basePath}`);
    }
  }

  /**
   * Ensure the storage directory exists
   */
  private async ensureDirectory(dir: string): Promise<void> {
    if (!fsSync.existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
      logger.debug(`[LocalFsStorageProvider] Created directory: ${dir}`);
    }
  }

  /**
   * Generate content-addressable filename
   * Format: basePath/hash[0:2]/hash[2:4]/hash_basename.ext
   */
  private generateStoragePath(file: Buffer, originalPath: string): string {
    const hash = crypto.createHash('sha256').update(file).digest('hex').substring(0, 16);
    const ext = path.extname(originalPath);
    const basename = path.basename(originalPath, ext);

    // Create subdirectories based on hash prefix for better file distribution
    return path.join(
      this.basePath,
      hash.substring(0, 2),
      hash.substring(2, 4),
      `${hash}_${basename}${ext}`
    );
  }

  /**
   * Validate path to prevent directory traversal attacks
   */
  private validatePath(requestedPath: string): boolean {
    const resolved = path.resolve(requestedPath);
    const base = path.resolve(this.basePath);

    // Ensure the resolved path is within basePath
    return resolved.startsWith(base);
  }

  async save(
    file: Buffer,
    filePath: string,
    metadata?: { contentType?: string }
  ): Promise<StorageFile> {
    const storagePath = this.generateStoragePath(file, filePath);

    // Security: Validate path
    if (!this.validatePath(storagePath)) {
      throw new Error(`Invalid file path: ${storagePath}`);
    }

    logger.debug(`[LocalFsStorageProvider] Saving file: ${filePath} -> ${storagePath}`);

    try {
      // Ensure parent directory exists
      await this.ensureDirectory(path.dirname(storagePath));

      // Write file to disk
      await fs.writeFile(storagePath, file);

      // Calculate hash for integrity verification
      const hash = crypto.createHash('sha256').update(file).digest('hex');

      logger.debug(`[LocalFsStorageProvider] File saved successfully: ${storagePath}`);

      return {
        path: filePath,
        uri: `file://${storagePath}`,
        size: file.length,
        contentType: metadata?.contentType || 'application/octet-stream',
        hash,
      };
    } catch (error) {
      logger.error('[LocalFsStorageProvider] Save error:', error);
      throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async read(uri: string): Promise<Buffer> {
    // Extract path from file:// URI
    const filePath = uri.replace('file://', '');

    // Security: Validate path
    if (!this.validatePath(filePath)) {
      throw new Error(`Invalid file URI: ${uri}`);
    }

    logger.debug(`[LocalFsStorageProvider] Reading file: ${filePath}`);

    try {
      const buffer = await fs.readFile(filePath);
      logger.debug(`[LocalFsStorageProvider] File read successfully: ${filePath} (${buffer.length} bytes)`);
      return buffer;
    } catch (error) {
      logger.error('[LocalFsStorageProvider] Read error:', error);
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async exists(uri: string): Promise<boolean> {
    const filePath = uri.replace('file://', '');

    // Security: Validate path
    if (!this.validatePath(filePath)) {
      return false;
    }

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async delete(uri: string): Promise<void> {
    const filePath = uri.replace('file://', '');

    // Security: Validate path
    if (!this.validatePath(filePath)) {
      throw new Error(`Invalid file URI: ${uri}`);
    }

    logger.debug(`[LocalFsStorageProvider] Deleting file: ${filePath}`);

    try {
      await fs.unlink(filePath);
      logger.debug(`[LocalFsStorageProvider] File deleted successfully: ${filePath}`);
    } catch (error) {
      // If file doesn't exist, that's fine - already deleted
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        logger.debug(`[LocalFsStorageProvider] File already deleted or does not exist: ${filePath}`);
        return;
      }
      logger.error('[LocalFsStorageProvider] Delete error:', error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async list(prefix?: string): Promise<StorageFile[]> {
    const searchPath = prefix ? path.join(this.basePath, prefix) : this.basePath;

    logger.debug(`[LocalFsStorageProvider] Listing files in: ${searchPath}`);

    // Ensure base directory exists
    if (!fsSync.existsSync(this.basePath)) {
      await this.ensureDirectory(this.basePath);
      return [];
    }

    try {
      const files: StorageFile[] = [];

      // Recursively list all files
      await this.listFilesRecursive(searchPath, files);

      logger.debug(`[LocalFsStorageProvider] Found ${files.length} files`);
      return files;
    } catch (error) {
      logger.error('[LocalFsStorageProvider] List error:', error);
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Recursively list all files in a directory
   */
  private async listFilesRecursive(dir: string, fileList: StorageFile[]): Promise<void> {
    // Security: Validate path
    if (!this.validatePath(dir)) {
      return;
    }

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recursively list subdirectory
          await this.listFilesRecursive(fullPath, fileList);
        } else if (entry.isFile()) {
          // Get file stats
          const stats = await fs.stat(fullPath);

          // Determine content type from extension
          const ext = path.extname(fullPath).toLowerCase();
          const contentType = this.getContentTypeFromExtension(ext);

          fileList.push({
            path: path.relative(this.basePath, fullPath),
            uri: `file://${fullPath}`,
            size: stats.size,
            contentType,
          });
        }
      }
    } catch (error) {
      // Skip directories that can't be read
      logger.warn(`[LocalFsStorageProvider] Cannot read directory: ${dir}`, error);
    }
  }

  async getMetadata(uri: string): Promise<Pick<StorageFile, 'size' | 'contentType'>> {
    const filePath = uri.replace('file://', '');

    // Security: Validate path
    if (!this.validatePath(filePath)) {
      throw new Error(`Invalid file URI: ${uri}`);
    }

    logger.debug(`[LocalFsStorageProvider] Getting metadata for: ${filePath}`);

    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = this.getContentTypeFromExtension(ext);

      return {
        size: stats.size,
        contentType,
      };
    } catch (error) {
      logger.error('[LocalFsStorageProvider] Get metadata error:', error);
      throw new Error(`Failed to get file metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get MIME type from file extension
   */
  private getContentTypeFromExtension(ext: string): string {
    const mimeTypes = new Map<string, string>([
      ['.txt', 'text/plain'],
      ['.pdf', 'application/pdf'],
      ['.doc', 'application/msword'],
      ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      ['.xls', 'application/vnd.ms-excel'],
      ['.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      ['.ppt', 'application/vnd.ms-powerpoint'],
      ['.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      ['.json', 'application/json'],
      ['.xml', 'application/xml'],
      ['.csv', 'text/csv'],
      ['.md', 'text/markdown'],
      ['.html', 'text/html'],
      ['.htm', 'text/html'],
      ['.jpg', 'image/jpeg'],
      ['.jpeg', 'image/jpeg'],
      ['.png', 'image/png'],
      ['.gif', 'image/gif'],
      ['.svg', 'image/svg+xml'],
      ['.zip', 'application/zip'],
      ['.tar', 'application/x-tar'],
      ['.gz', 'application/gzip'],
    ]);

    return mimeTypes.get(ext) || 'application/octet-stream';
  }

  /**
   * Get total storage size and file count
   */
  async getStorageStats(): Promise<{ totalSize: number; fileCount: number; path: string }> {
    logger.debug('[LocalFsStorageProvider] Calculating storage statistics...');

    if (!fsSync.existsSync(this.basePath)) {
      return { totalSize: 0, fileCount: 0, path: this.basePath };
    }

    let totalSize = 0;
    let fileCount = 0;

    await this.calculateDirectorySize(this.basePath, (size) => {
      totalSize += size;
      fileCount++;
    });

    logger.debug(`[LocalFsStorageProvider] Storage stats: ${fileCount} files, ${totalSize} bytes`);

    return {
      totalSize,
      fileCount,
      path: this.basePath,
    };
  }

  /**
   * Recursively calculate directory size
   */
  private async calculateDirectorySize(dir: string, onFile: (size: number) => void): Promise<void> {
    if (!this.validatePath(dir)) {
      return;
    }

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await this.calculateDirectorySize(fullPath, onFile);
        } else if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          onFile(stats.size);
        }
      }
    } catch (error) {
      logger.warn(`[LocalFsStorageProvider] Cannot calculate size for: ${dir}`, error);
    }
  }

  /**
   * Clean up empty directories
   */
  async cleanupEmptyDirectories(): Promise<number> {
    logger.debug('[LocalFsStorageProvider] Cleaning up empty directories...');

    let removedCount = 0;

    const cleanup = async (dir: string): Promise<boolean> => {
      if (!this.validatePath(dir) || dir === this.basePath) {
        return false;
      }

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        if (entries.length === 0) {
          // Directory is empty, remove it
          await fs.rmdir(dir);
          removedCount++;
          logger.debug(`[LocalFsStorageProvider] Removed empty directory: ${dir}`);
          return true;
        }

        // Check subdirectories
        const subdirs = entries.filter(e => e.isDirectory());
        for (const subdir of subdirs) {
          await cleanup(path.join(dir, subdir.name));
        }

        // Check again if directory became empty after subdirectory cleanup
        const remainingEntries = await fs.readdir(dir);
        if (remainingEntries.length === 0 && dir !== this.basePath) {
          await fs.rmdir(dir);
          removedCount++;
          logger.debug(`[LocalFsStorageProvider] Removed empty directory: ${dir}`);
          return true;
        }
      } catch (error) {
        logger.warn(`[LocalFsStorageProvider] Cannot cleanup directory: ${dir}`, error);
      }

      return false;
    };

    await cleanup(this.basePath);

    logger.debug(`[LocalFsStorageProvider] Cleanup complete. Removed ${removedCount} empty directories`);
    return removedCount;
  }
}

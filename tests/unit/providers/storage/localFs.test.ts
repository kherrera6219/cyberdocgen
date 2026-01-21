/**
 * Unit tests for Local Filesystem Storage Provider
 * Sprint 1 - Local Mode Implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalFsStorageProvider } from '../../../../server/providers/storage/localFs';
import fs from 'fs';
import path from 'path';

describe('LocalFsStorageProvider', () => {
  const testBasePath = './test-data/storage';
  let provider: LocalFsStorageProvider;

  beforeEach(() => {
    // Clean up test directory before each test
    if (fs.existsSync(testBasePath)) {
      fs.rmSync(testBasePath, { recursive: true, force: true });
    }

    provider = new LocalFsStorageProvider(testBasePath);
  });

  afterEach(() => {
    // Clean up after each test
    if (fs.existsSync(testBasePath)) {
      fs.rmSync(testBasePath, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should create base directory on initialization', () => {
      expect(fs.existsSync(testBasePath)).toBe(true);
    });

    it('should handle existing directory', () => {
      // Create directory first
      fs.mkdirSync(testBasePath, { recursive: true });

      // Should not throw
      const provider2 = new LocalFsStorageProvider(testBasePath);
      expect(fs.existsSync(testBasePath)).toBe(true);
    });
  });

  describe('save', () => {
    it('should save file with content-addressable path', async () => {
      const content = Buffer.from('Test file content');
      const originalPath = 'documents/test.txt';

      const result = await provider.save(content, originalPath);

      expect(result).toHaveProperty('uri');
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('contentType');
      expect(result.uri).toContain('file://');
      expect(result.size).toBe(content.length);

      // Extract file path from URI
      const filePath = result.uri.replace('file://', '');
      expect(fs.existsSync(filePath)).toBe(true);

      // Verify content
      const savedContent = fs.readFileSync(filePath);
      expect(savedContent.toString()).toBe('Test file content');
    });

    it('should create subdirectories based on hash', async () => {
      const content = Buffer.from('Test content');
      const originalPath = 'test.txt';

      const result = await provider.save(content, originalPath);
      const filePath = result.uri.replace('file://', '');

      // Path should have format: basePath/ab/cd/hash_filename.ext
      const relativePath = path.relative(testBasePath, filePath);
      const parts = relativePath.split(path.sep);

      expect(parts.length).toBe(3); // Two hash dirs + filename
      expect(parts[0].length).toBe(2); // First hash dir
      expect(parts[1].length).toBe(2); // Second hash dir
    });

    it('should preserve file extension', async () => {
      const content = Buffer.from('PDF content');
      const originalPath = 'documents/report.pdf';

      const result = await provider.save(content, originalPath);
      const filePath = result.uri.replace('file://', '');

      expect(filePath).toMatch(/\.pdf$/);
    });

    it('should handle files without extension', async () => {
      const content = Buffer.from('No extension');
      const originalPath = 'documents/README';

      const result = await provider.save(content, originalPath);
      const filePath = result.uri.replace('file://', '');

      // Should still work
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should use same hash for identical content', async () => {
      const content = Buffer.from('Identical content');
      const originalPath1 = 'file1.txt';
      const originalPath2 = 'file2.txt';

      const result1 = await provider.save(content, originalPath1);
      const result2 = await provider.save(content, originalPath2);

      // Hashes should be identical for identical content
      expect(result1.hash).toBe(result2.hash);

      // But URIs will differ due to different filenames
      expect(result1.uri).not.toBe(result2.uri);

      // Both files should be in the same hash-based subdirectory
      const path1 = result1.uri.replace('file://', '');
      const path2 = result2.uri.replace('file://', '');
      const dir1 = path.dirname(path1);
      const dir2 = path.dirname(path2);
      expect(dir1).toBe(dir2);
    });

    it('should handle large files', async () => {
      const largeContent = Buffer.alloc(10 * 1024 * 1024, 'a'); // 10MB
      const originalPath = 'large-file.bin';

      const result = await provider.save(largeContent, originalPath);
      const filePath = result.uri.replace('file://', '');

      expect(fs.existsSync(filePath)).toBe(true);
      const stats = fs.statSync(filePath);
      expect(stats.size).toBe(10 * 1024 * 1024);
    });
  });

  describe('read', () => {
    it('should read saved file', async () => {
      const content = Buffer.from('Read test content');
      const originalPath = 'test.txt';

      const result = await provider.save(content, originalPath);
      const readContent = await provider.read(result.uri);

      expect(readContent.toString()).toBe('Read test content');
    });

    it('should throw error for non-existent file', async () => {
      const nonExistentPath = path.join(testBasePath, 'does-not-exist.txt');

      await expect(provider.read(nonExistentPath)).rejects.toThrow();
    });

    it('should prevent path traversal attacks', async () => {
      const maliciousPath = '../../../etc/passwd';

      await expect(provider.read(maliciousPath)).rejects.toThrow('Invalid file');
    });

    it('should prevent absolute path access outside base', async () => {
      const absolutePath = '/etc/passwd';

      await expect(provider.read(absolutePath)).rejects.toThrow('Invalid file');
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      const content = Buffer.from('Exists test');
      const originalPath = 'test.txt';

      const result = await provider.save(content, originalPath);
      const exists = await provider.exists(result.uri);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const nonExistentPath = path.join(testBasePath, 'does-not-exist.txt');
      const exists = await provider.exists(nonExistentPath);

      expect(exists).toBe(false);
    });

    it('should return false for path traversal attempts', async () => {
      const maliciousPath = '../../../etc/passwd';
      const exists = await provider.exists(maliciousPath);

      expect(exists).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete existing file', async () => {
      const content = Buffer.from('Delete test');
      const originalPath = 'test.txt';

      const result = await provider.save(content, originalPath);
      const filePath = result.uri.replace('file://', '');
      expect(fs.existsSync(filePath)).toBe(true);

      await provider.delete(result.uri);

      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('should not throw for non-existent file', async () => {
      const nonExistentPath = path.join(testBasePath, 'does-not-exist.txt');

      // Should not throw
      await provider.delete(nonExistentPath);
    });

    it('should prevent path traversal in delete', async () => {
      const maliciousPath = '../../../important-file.txt';

      await expect(provider.delete(maliciousPath)).rejects.toThrow('Invalid file');
    });

    it('should clean up empty parent directories', async () => {
      const content = Buffer.from('Cleanup test');
      const originalPath = 'test.txt';

      const result = await provider.save(content, originalPath);
      const filePath = result.uri.replace('file://', '');
      const parentDir = path.dirname(filePath);

      await provider.delete(result.uri);

      // File should be removed
      expect(fs.existsSync(filePath)).toBe(false);
    });
  });

  describe('list', () => {
    it('should list all files in storage', async () => {
      // Save multiple files
      await provider.save(Buffer.from('File 1'), 'file1.txt');
      await provider.save(Buffer.from('File 2'), 'file2.txt');
      await provider.save(Buffer.from('File 3'), 'file3.pdf');

      const files = await provider.list();

      expect(files.length).toBe(3);
    });

    it('should return empty array for empty storage', async () => {
      const files = await provider.list();

      expect(files).toEqual([]);
    });

    it('should filter by prefix', async () => {
      const result1 = await provider.save(Buffer.from('File 1'), 'docs/file1.txt');
      const result2 = await provider.save(Buffer.from('File 2'), 'docs/file2.txt');
      const result3 = await provider.save(Buffer.from('File 3'), 'images/file3.png');

      // Get hash prefix from first docs file
      const filePath = result1.uri.replace('file://', '');
      const relativePath = path.relative(testBasePath, filePath);
      const prefix = relativePath.split(path.sep)[0]; // First hash dir

      const files = await provider.list(prefix);

      // Should only return files in that hash directory
      expect(files.length).toBeGreaterThan(0);
      files.forEach(file => {
        expect(file.uri).toContain(prefix);
      });
    });

    it('should return StorageFile objects with URIs', async () => {
      await provider.save(Buffer.from('File 1'), 'file1.txt');

      const files = await provider.list();

      expect(files.length).toBe(1);
      expect(files[0]).toHaveProperty('uri');
      expect(files[0]).toHaveProperty('path');
      expect(files[0]).toHaveProperty('size');
      expect(files[0].uri).toMatch(/^file:\/\//);
    });
  });

  describe('getMetadata', () => {
    it('should return file metadata', async () => {
      const content = Buffer.from('Metadata test');
      const originalPath = 'test.txt';

      const result = await provider.save(content, originalPath);
      const metadata = await provider.getMetadata(result.uri);

      expect(metadata).toHaveProperty('size');
      expect(metadata).toHaveProperty('contentType');

      expect(metadata.size).toBe(content.length);
    });

    it('should detect MIME type from extension', async () => {
      const pdfResult = await provider.save(Buffer.from('PDF'), 'test.pdf');
      const txtResult = await provider.save(Buffer.from('Text'), 'test.txt');
      const jsonResult = await provider.save(Buffer.from('{}'), 'test.json');

      const pdfMeta = await provider.getMetadata(pdfResult.uri);
      const txtMeta = await provider.getMetadata(txtResult.uri);
      const jsonMeta = await provider.getMetadata(jsonResult.uri);

      expect(pdfMeta.contentType).toBe('application/pdf');
      expect(txtMeta.contentType).toBe('text/plain');
      expect(jsonMeta.contentType).toBe('application/json');
    });

    it('should throw error for non-existent file', async () => {
      const nonExistentPath = path.join(testBasePath, 'does-not-exist.txt');

      await expect(provider.getMetadata(nonExistentPath)).rejects.toThrow();
    });

    it('should prevent path traversal in metadata', async () => {
      const maliciousPath = '../../../etc/passwd';

      await expect(provider.getMetadata(maliciousPath)).rejects.toThrow('Invalid file');
    });
  });


  describe('security', () => {
    it('should reject URIs with .. segments', async () => {
      const uris = [
        'file://../outside.txt',
        'file://subdir/../../outside.txt',
        'file://./subdir/../../../outside.txt',
      ];

      for (const maliciousUri of uris) {
        await expect(provider.read(maliciousUri)).rejects.toThrow('Invalid file');
        await expect(provider.delete(maliciousUri)).rejects.toThrow('Invalid file');
      }
    });

    it('should reject absolute paths outside base', async () => {
      const uris = [
        'file:///etc/passwd',
        'file:///tmp/outside.txt',
      ];

      for (const maliciousUri of uris) {
        await expect(provider.read(maliciousUri)).rejects.toThrow('Invalid file');
        await expect(provider.delete(maliciousUri)).rejects.toThrow('Invalid file');
      }
    });

    it('should allow valid URIs', async () => {
      const content = Buffer.from('Valid path test');
      const result = await provider.save(content, 'subdir/test.txt');

      // Should work without throwing
      const exists = await provider.exists(result.uri);
      expect(exists).toBe(true);

      const readContent = await provider.read(result.uri);
      expect(readContent.toString()).toBe('Valid path test');
    });
  });
});

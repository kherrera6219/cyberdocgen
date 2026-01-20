/**
 * Repository Parser Service
 * 
 * Handles secure extraction, indexing, and analysis of uploaded repository ZIP files.
 * Implements production-grade security controls:
 * - Path traversal prevention
 * - Zip bomb protection
 * - File type validation
 * - Size limits
 * - SHA-256 integrity verification
 * - Read-only extraction
 */

import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import AdmZip from 'adm-zip';
import { logger } from '../utils/logger';
import { AppError, ValidationError } from '../utils/errorHandling';
import { auditService } from './auditService';
import { db } from '../db';
import { repositorySnapshots, repositoryFiles } from '@shared/schema';
import type { InsertRepositorySnapshot, InsertRepositoryFile } from '@shared/schema';

// Security limits
const MAX_UPLOAD_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_EXTRACTED_SIZE = 2 * 1024 * 1024 * 1024; // 2GB uncompressed
const MAX_FILE_COUNT = 50000; // Prevent excessive file operations
const MAX_PATH_LENGTH = 4096; // Prevent excessively long paths
const COMPRESSION_RATIO_THRESHOLD = 100; // Detect zip bombs (100:1)

//Allowed file extensions for repo content
const ALLOWED_EXTENSIONS = new Set([
  // Source code
  '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rb', '.php', '.c', '.cpp', '.h', '.hpp',
  '.cs', '.rs', '.kt', '.swift', '.m', '.scala', '.clj', '.ex', '.exs', '.erl', '.lua', '.pl',
  '.r', '.jl', '.dart', '.v', '.vhd', '.sv', '.vhdl', '.asm', '.s', '.sql', '.sh', '.bash', '.zsh',
  // Config
  '.json', '.yaml', '.yml', '.toml', '.ini', '.conf', '.config', '.env', '.properties', '.xml',
  // Docs
  '.md', '.txt', '.rst', '.adoc', '.tex',
  // CI/CD & IaC
  '.tf', '.hcl', '.dockerfile', '.dockerignore', '.gitignore', '.gitattributes',
  // Package management
  '.lock', '.sum', '.gradle', '.maven', '.sbt',
  // No extension (README, LICENSE, etc.)
  ''
]);

// Dangerous extensions to block
const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.dll', '.so', '.dylib', '.app', '.dmg', '.pkg', '.deb', '.rpm',
  '.msi', '.bat', '.cmd', '.ps1', '.vbs', '.scr', '.com'
]);

interface ExtractionResult {
  extractedPath: string;
  fileCount: number;
  totalSize: number;
  fileHash: string;
}

interface TechnologyDetection {
  languages: string[];
  frameworks: string[];
  infraTools: string[];
}

interface FileManifest {
  snapshotId: string;
  files: Array<{
    relativePath: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileHash: string;
    language: string | null;
    category: 'source' | 'config' | 'docs' | 'ci_cd' | 'iac' | 'test' | 'other';
    isSecurityRelevant: boolean;
  }>;
  totalFiles: number;
  totalSize: number;
  generatedAt: string;
  manifestHash: string;
}

export class RepoParserService {
  private readonly baseExtractPath: string;

  constructor() {
    // Use data/repos for extracted repositories
    this.baseExtractPath = path.join(process.cwd(), 'data', 'repos');
  }

  /**
   * Upload and extract a repository ZIP file
   */
  async uploadAndExtract(
    zipBuffer: Buffer,
    fileName: string,
    organizationId: string,
    companyProfileId: string,
    createdBy: string,
    snapshotName: string
  ): Promise<{ snapshotId: string; extractedPath: string; fileCount: number }> {
    try {
      // Security: validate file size
      if (zipBuffer.length > MAX_UPLOAD_SIZE) {
        throw new ValidationError(
          `File size exceeds maximum allowed size of ${MAX_UPLOAD_SIZE / 1024 / 1024}MB`,
          { size: zipBuffer.length, maxSize: MAX_UPLOAD_SIZE }
        );
      }

      // Security: validate file extension
      const ext = path.extname(fileName).toLowerCase();
      if (ext !== '.zip') {
        throw new ValidationError('Only .zip files are allowed', { extension: ext });
      }

      // Calculate file hash before extraction
      const fileHash = this.calculateHash(zipBuffer);

      // Create database record with "extracting" status
      const [snapshot] = await db.insert(repositorySnapshots).values({
        organizationId,
        companyProfileId,
        createdBy,
        name: snapshotName,
        status: 'extracting',
        uploadedFileName: fileName,
        uploadedFileHash: fileHash,
      } as InsertRepositorySnapshot).returning();

      logger.info('Repository snapshot created', {
        snapshotId: snapshot.id,
        organizationId,
        fileName,
        fileHash,
      });

      // Audit log
      await auditService.logAction({
        action: 'create',
        entityType: 'repository_snapshot',
        entityId: snapshot.id,
        userId: createdBy,
        organizationId,
        ipAddress: 'system',
        metadata: {
          fileName,
          fileSize: zipBuffer.length,
          fileHash,
        },
      });

      // Extract to secure location
      const extractionResult = await this.extractZipSecurely(
        zipBuffer,
        snapshot.id,
        organizationId
      );

      // Update snapshot with extraction details
      await db.update(repositorySnapshots)
        .set({
          extractedPath: extractionResult.extractedPath,
          fileCount: extractionResult.fileCount,
          repositorySize: extractionResult.totalSize,
          status: 'indexed',
          updatedAt: new Date(),
        })
        .where({ id: snapshot.id });

      logger.info('Repository extracted successfully', {
        snapshotId: snapshot.id,
        fileCount: extractionResult.fileCount,
        totalSize: extractionResult.totalSize,
      });

      return {
        snapshotId: snapshot.id,
        extractedPath: extractionResult.extractedPath,
        fileCount: extractionResult.fileCount,
      };

    } catch (error) {
      logger.error('Failed to upload and extract repository', {
        error: error instanceof Error ? error.message : String(error),
        fileName,
        organizationId,
      });
      throw error;
    }
  }

  /**
   * Extract ZIP file securely with comprehensive security checks
   */
  private async extractZipSecurely(
    zipBuffer: Buffer,
    snapshotId: string,
    organizationId: string
  ): Promise<ExtractionResult> {
    let zip: AdmZip;
    
    try {
      zip = new AdmZip(zipBuffer);
    } catch (error) {
      throw new ValidationError('Invalid or corrupted ZIP file', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const entries = zip.getEntries();
    
    // Security: check file count
    if (entries.length > MAX_FILE_COUNT) {
      throw new ValidationError(
        `ZIP contains too many files (${entries.length}). Maximum allowed: ${MAX_FILE_COUNT}`,
        { fileCount: entries.length, maxFiles: MAX_FILE_COUNT }
      );
    }

    // Security: check compression ratio (zip bomb detection)
    const compressedSize = zipBuffer.length;
    let uncompressedSize = 0;
    
    for (const entry of entries) {
      if (!entry.isDirectory) {
        uncompressedSize += entry.header.size;
      }
    }

    const compressionRatio = uncompressedSize / compressedSize;
    if (compressionRatio > COMPRESSION_RATIO_THRESHOLD) {
      throw new ValidationError(
        'Suspicious compression ratio detected (possible zip bomb)',
        { ratio: compressionRatio, threshold: COMPRESSION_RATIO_THRESHOLD }
      );
    }

    // Security: check total uncompressed size
    if (uncompressedSize > MAX_EXTRACTED_SIZE) {
      throw new ValidationError(
        `Extracted size would exceed maximum of ${MAX_EXTRACTED_SIZE / 1024 / 1024 / 1024}GB`,
        { size: uncompressedSize, maxSize: MAX_EXTRACTED_SIZE }
      );
    }

    // Create extraction directory
    const extractPath = path.join(this.baseExtractPath, organizationId, snapshotId);
    await fs.mkdir(extractPath, { recursive: true });

    let fileCount = 0;
    let totalSize = 0;

    // Extract files with security checks
    for (const entry of entries) {
      // Skip directories
      if (entry.isDirectory) {
        continue;
      }

      // Security: validate and sanitize entry name (prevent path traversal)
      const sanitizedPath = this.sanitizeEntryPath(entry.entryName);
      if (!sanitizedPath) {
        logger.warn('Skipped suspicious file path', { entryName: entry.entryName });
        continue;
      }

      // Security: check path length
      if (sanitizedPath.length > MAX_PATH_LENGTH) {
        logger.warn('Skipped file with excessively long path', {
          path: sanitizedPath.substring(0, 100) + '...',
        });
        continue;
      }

      // Security: validate file extension
      const ext = path.extname(sanitizedPath).toLowerCase();
      
      if (BLOCKED_EXTENSIONS.has(ext)) {
        logger.warn('Blocked dangerous file extension', { path: sanitizedPath, ext });
        continue;
      }

      // Allow files without extensions or with allowed extensions
      if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
        logger.warn('Skipped file with disallowed extension', { path: sanitizedPath, ext });
        continue;
      }

      // Extract file
      const fullPath = path.join(extractPath, sanitizedPath);
      const dir = path.dirname(fullPath);
      
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, entry.getData());

      // Make file read-only (security: immutable snapshot)
      await fs.chmod(fullPath, 0o444);

      fileCount++;
      totalSize += entry.header.size;
    }

    // Make entire directory read-only
    await this.makeDirectoryReadOnly(extractPath);

    const fileHash = this.calculateHash(zipBuffer);

    logger.info('ZIP extraction completed securely', {
      snapshotId,
      fileCount,
      totalSize,
      extractPath,
    });

    return {
      extractedPath: extractPath,
      fileCount,
      totalSize,
      fileHash,
    };
  }

  /**
   * Sanitize ZIP entry path to prevent directory traversal
   */
  private sanitizeEntryPath(entryName: string): string | null {
    // Normalize path separators
    const normalized = entryName.replace(/\\/g, '/');

    // Check for path traversal attempts
    if (normalized.includes('../') || normalized.includes('..\\')) {
      return null;
    }

    // Check for absolute paths
    if (path.isAbsolute(normalized)) {
      return null;
    }

    // Remove leading slashes
    const cleaned = normalized.replace(/^\/+/, '');

    // Reject empty or suspicious paths
    if (!cleaned || cleaned === '.' || cleaned === '..') {
      return null;
    }

    return cleaned;
  }

  /**
   * Make directory and all contents read-only recursively
   */
  private async makeDirectoryReadOnly(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await this.makeDirectoryReadOnly(fullPath);
          await fs.chmod(fullPath, 0o555); // read + execute for directories
        } else {
          await fs.chmod(fullPath, 0o444); // read-only for files
        }
      }

      // Make parent directory read-only
      await fs.chmod(dir, 0o555);
    } catch (error) {
      logger.warn('Failed to set read-only permissions', {
        dir,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Generate file manifest with hashes
   */
  async generateManifest(snapshotId: string, extractedPath: string): Promise<FileManifest> {
    try {
      const files: FileManifest['files'] = [];
      let totalSize = 0;

      await this.indexDirectory(extractedPath, extractedPath, files);

      totalSize = files.reduce((sum, f) => sum + f.fileSize, 0);

      const manifest: FileManifest = {
        snapshotId,
        files,
        totalFiles: files.length,
        totalSize,
        generatedAt: new Date().toISOString(),
        manifestHash: '', // Calculated below
      };

      // Calculate manifest hash
      const manifestJson = JSON.stringify(manifest, null, 2);
      manifest.manifestHash = this.calculateHash(Buffer.from(manifestJson));

      // Update snapshot with manifest hash
      await db.update(repositorySnapshots)
        .set({ manifestHash: manifest.manifestHash })
        .where({ id: snapshotId });

      logger.info('File manifest generated', {
        snapshotId,
        fileCount: files.length,
        totalSize,
      });

      return manifest;

    } catch (error) {
      logger.error('Failed to generate manifest', {
        snapshotId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new AppError('Failed to generate file manifest', 500, 'MANIFEST_GENERATION_ERROR');
    }
  }

  /**
   * Recursively index directory and calculate file hashes
   */
  private async indexDirectory(
    basePath: string,
    currentPath: string,
    files: FileManifest['files']
  ): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        await this.indexDirectory(basePath, fullPath, files);
      } else if (entry.isFile()) {
        const relativePath = path.relative(basePath, fullPath);
        const stats = await fs.stat(fullPath);
        const content = await fs.readFile(fullPath);
        const fileHash = this.calculateHash(content);
        const ext = path.extname(entry.name).toLowerCase();
        
        const language = this.detectLanguage(entry.name, ext);
        const category = this.categorizeFile(relativePath, entry.name);
        const isSecurityRelevant = this.isSecurityRelevant(relativePath, entry.name, category);

        files.push({
          relativePath,
          fileName: entry.name,
          fileType: ext || 'none',
          fileSize: stats.size,
          fileHash,
          language,
          category,
          isSecurityRelevant,
        });
      }
    }
  }

  /**
   * Detect programming language from file extension
   */
  private detectLanguage(fileName: string, ext: string): string | null {
    const languageMap: Record<string, string> = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.go': 'Go',
      '.rb': 'Ruby',
      '.php': 'PHP',
      '.c': 'C',
      '.cpp': 'C++',
      '.cs': 'C#',
      '.rs': 'Rust',
      '.kt': 'Kotlin',
      '.swift': 'Swift',
      '.sql': 'SQL',
      '.sh': 'Shell',
      '.bash': 'Bash',
      '.ps1': 'PowerShell',
      '.yaml': 'YAML',
      '.yml': 'YAML',
      '.json': 'JSON',
      '.xml': 'XML',
      '.md': 'Markdown',
      '.tf': 'Terraform',
    };

    return languageMap[ext] || null;
  }

  /**
   * Categorize file by path and name
   */
  private categorizeFile(relativePath: string, fileName: string): 'source' | 'config' | 'docs' | 'ci_cd' | 'iac' | 'test' | 'other' {
    const lowerPath = relativePath.toLowerCase();
    const lowerName = fileName.toLowerCase();

    // CI/CD
    if (lowerPath.includes('.github/workflows') ||
        lowerPath.includes('.gitlab-ci') ||
        lowerPath.includes('jenkinsfile') ||
        lowerName === 'jenkinsfile' ||
        lowerName === '.travis.yml' ||
        lowerName === 'circle.yml' ||
        lowerName === '.circleci') {
      return 'ci_cd';
    }

    // IaC (Infrastructure as Code)
    if (lowerPath.includes('terraform') ||
        lowerPath.includes('cloudformation') ||
        lowerPath.includes('kubernetes') ||
        lowerPath.includes('k8s') ||
        lowerName.endsWith('.tf') ||
        lowerName === 'dockerfile' ||
        lowerName.includes('docker-compose')) {
      return 'iac';
    }

    // Tests
    if (lowerPath.includes('test/') ||
        lowerPath.includes('tests/') ||
        lowerPath.includes('__tests__') ||
        lowerPath.includes('spec/') ||
        lowerName.includes('.test.') ||
        lowerName.includes('.spec.')) {
      return 'test';
    }

    // Documentation
    if (lowerName === 'readme.md' ||
        lowerName === 'changelog.md' ||
        lowerName === 'license' ||
        lowerName === 'contributing.md' ||
        lowerPath.includes('docs/')) {
      return 'docs';
    }

    // Config files
    if (lowerName.endsWith('.json') && (
        lowerName.includes('package.json') ||
        lowerName.includes('tsconfig') ||
        lowerName.includes('config'))) {
      return 'config';
    }

    if (lowerName.endsWith('.yaml') ||
        lowerName.endsWith('.yml') ||
        lowerName.endsWith('.toml') ||
        lowerName.endsWith('.ini') ||
        lowerName.endsWith('.env') ||
        lowerName === '.gitignore' ||
        lowerName === '.dockerignore') {
      return 'config';
    }

    // Source code
    const sourceExtensions = ['.js', '.ts', '.py', '.java', '.go', '.rb', '.php', '.c', '.cpp', '.cs', '.rs'];
    if (sourceExtensions.some(ext => lowerName.endsWith(ext))) {
      return 'source';
    }

    return 'other';
  }

  /**
   * Determine if file is security-relevant
   */
  private isSecurityRelevant(relativePath: string, fileName: string, category: string): boolean {
    const lowerPath = relativePath.toLowerCase();
    const lowerName = fileName.toLowerCase();

    // Security-relevant paths
    if (lowerPath.includes('auth') ||
        lowerPath.includes('security') ||
        lowerPath.includes('crypto') ||
        lowerPath.includes('middleware') ||
        lowerPath.includes('jwt') ||
        lowerPath.includes('oauth') ||
        lowerPath.includes('encryption')) {
      return true;
    }

    // Security-relevant files
    if (lowerName.includes('auth') ||
        lowerName.includes('security') ||
        lowerName.includes('encrypt') ||
        lowerName.includes('permission') ||
        lowerName.includes('role') ||
        lowerName.includes('access') ||
        lowerName.includes('session') ||
        lowerName.includes('token')) {
      return true;
    }

    // CI/CD and IaC are security-relevant
    if (category === 'ci_cd' || category === 'iac') {
      return true;
    }

    return false;
  }

  /**
   * Calculate SHA-256 hash
   */
  private calculateHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Detect technologies in repository
   */
  async detectTechnologies(snapshotId: string, files: FileManifest['files']): Promise<TechnologyDetection> {
    const languages = new Set<string>();
    const frameworks = new Set<string>();
    const infraTools = new Set<string>();

    for (const file of files) {
      // Collect languages
      if (file.language) {
        languages.add(file.language);
      }

      // Framework detection
      if (file.fileName === 'package.json') {
        frameworks.add('Node.js');
      }
      if (file.fileName === 'requirements.txt' || file.fileName === 'Pipfile') {
        frameworks.add('Python');
      }
      if (file.fileName === 'pom.xml' || file.fileName === 'build.gradle') {
        frameworks.add('Java/Maven/Gradle');
      }
      if (file.fileName === 'go.mod') {
        frameworks.add('Go Modules');
      }
      if (file.fileName === 'Cargo.toml') {
        frameworks.add('Rust/Cargo');
      }

      // Infrastructure tools
      if (file.fileName.endsWith('.tf')) {
        infraTools.add('Terraform');
      }
      if (file.fileName.toLowerCase().includes('docker')) {
        infraTools.add('Docker');
      }
      if (file.relativePath.includes('kubernetes') || file.relativePath.includes('k8s')) {
        infraTools.add('Kubernetes');
      }
      if (file.relativePath.includes('.github/workflows')) {
        infraTools.add('GitHub Actions');
      }
      if (file.relativePath.includes('.gitlab-ci')) {
        infraTools.add('GitLab CI');
      }
    }

    const result = {
      languages: Array.from(languages),
      frameworks: Array.from(frameworks),
      infraTools: Array.from(infraTools),
    };

    // Update snapshot with detected technologies
    await db.update(repositorySnapshots)
      .set({
        detectedLanguages: result.languages,
        detectedFrameworks: result.frameworks,
        detectedInfraTools: result.infraTools,
      })
      .where({ id: snapshotId });

    logger.info('Technologies detected', { snapshotId, ...result });

    return result;
  }

  /**
   * Index files into database
   */
  async indexFiles(snapshotId: string, files: FileManifest['files']): Promise<void> {
    try {
      // Batch insert files (chunk to avoid query size limits)
      const BATCH_SIZE = 1000;
      
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        
        await db.insert(repositoryFiles).values(
          batch.map(f => ({
            snapshotId,
            relativePath: f.relativePath,
            fileName: f.fileName,
            fileType: f.fileType,
            fileSize: f.fileSize,
            fileHash: f.fileHash,
            language: f.language,
            category: f.category,
            isSecurityRelevant: f.isSecurityRelevant,
            indexedAt: new Date(),
          } as InsertRepositoryFile))
        );
      }

      logger.info('Files indexed in database', { snapshotId, fileCount: files.length });

    } catch (error) {
      logger.error('Failed to index files', {
        snapshotId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new AppError('Failed to index repository files', 500, 'FILE_INDEXING_ERROR');
    }
  }
}

export const repoParserService = new RepoParserService();

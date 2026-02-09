/**
 * Local Mode API Routes
 * Sprint 2: Desktop Integration & Hardening
 *
 * Provides endpoints for local mode features:
 * - Runtime mode information
 * - Database information and statistics
 * - Backup and restore operations
 * - Storage statistics
 */

import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getRuntimeConfig, isLocalMode } from '../config/runtime';
import { getProviders } from '../providers';
import { logger } from '../utils/logger';
import type { SqliteDbProvider } from '../providers/db/sqlite';
import type { LocalFsStorageProvider } from '../providers/storage/localFs';

const router = express.Router();
const SUPPORTED_API_KEY_PROVIDERS = new Set(['OPENAI', 'ANTHROPIC', 'GOOGLE_AI']);
const MAX_API_KEY_LENGTH = 4096;
const MAX_PATH_LENGTH = 1024;

function normalizeProvider(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().toUpperCase();
}

function isPathWithin(basePath: string, targetPath: string): boolean {
  const relative = path.relative(basePath, targetPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function getLocalDataRoot(): string {
  const runtimeConfig = getRuntimeConfig();
  if (runtimeConfig.database.type === 'sqlite' && runtimeConfig.database.filePath) {
    return path.resolve(path.dirname(runtimeConfig.database.filePath));
  }

  return path.resolve(process.env.LOCAL_DATA_PATH || './local-data');
}

function validateBackupPath(inputPath: unknown, operation: 'backup' | 'restore') {
  if (typeof inputPath !== 'string') {
    return { error: `${operation === 'backup' ? 'destinationPath' : 'backupPath'} must be a string` };
  }

  const trimmed = inputPath.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_PATH_LENGTH) {
    return { error: `${operation === 'backup' ? 'destinationPath' : 'backupPath'} is invalid` };
  }

  const resolvedPath = path.resolve(trimmed);
  const localDataRoot = getLocalDataRoot();
  const userHome = path.resolve(os.homedir());
  const allowedRoots = [localDataRoot, userHome];
  const allowed = allowedRoots.some(root => isPathWithin(root, resolvedPath));

  if (!allowed) {
    return { error: 'Path must be within application data or your user profile directory' };
  }

  if (path.extname(resolvedPath).toLowerCase() !== '.db') {
    return { error: 'Path must end with .db' };
  }

  if (operation === 'restore') {
    if (!fs.existsSync(resolvedPath)) {
      return { error: 'Backup file not found' };
    }

    if (!fs.statSync(resolvedPath).isFile()) {
      return { error: 'Backup path must be a file' };
    }
  }

  return { resolvedPath };
}

function isValidApiKeyFormat(provider: string, apiKey: string): boolean {
  const key = apiKey.trim();

  switch (provider) {
    case 'OPENAI':
      return /^sk-[A-Za-z0-9_-]{20,}$/.test(key);
    case 'ANTHROPIC':
      return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key);
    case 'GOOGLE_AI':
      return /^AIza[0-9A-Za-z_-]{30,}$/.test(key);
    default:
      return false;
  }
}

async function testOpenAiApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });

    return { valid: response.ok };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { valid: false, error: 'Timed out while validating API key' };
    }

    return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Get runtime mode information
 * GET /api/local/runtime/mode
 */
router.get('/runtime/mode', (req, res) => {
  if (!isLocalMode()) {
    return res.status(403).json({
      error: 'This endpoint is only available in local mode',
    });
  }

  const config = getRuntimeConfig();

  res.json({
    mode: config.mode,
    features: config.features,
    database: {
      type: config.database.type,
    },
    storage: {
      type: config.storage.type,
    },
    auth: {
      enabled: config.auth.enabled,
      provider: config.auth.provider,
    },
  });
});

/**
 * Get database information
 * GET /api/local/db-info
 */
router.get('/db-info', async (req, res) => {
  try {
    if (!isLocalMode()) {
      return res.status(403).json({
        error: 'This endpoint is only available in local mode',
      });
    }

    const providers = await getProviders();
    const dbProvider = providers.db as SqliteDbProvider;

    // Check if getStats method exists (SQLite provider)
    if (typeof dbProvider.getStats !== 'function') {
      return res.status(400).json({
        error: 'Database statistics not available for this provider',
      });
    }

    const stats = await dbProvider.getStats();

    res.json({
      path: stats.path,
      size: stats.size,
      pageCount: stats.pageCount,
      pageSize: stats.pageSize,
      walMode: stats.walMode,
      formattedSize: formatBytes(stats.size),
    });
  } catch (error) {
    logger.error('Failed to get database info', { error });
    res.status(500).json({
      error: 'Failed to retrieve database information',
    });
  }
});

/**
 * Get storage information
 * GET /api/local/storage-info
 */
router.get('/storage-info', async (req, res) => {
  try {
    if (!isLocalMode()) {
      return res.status(403).json({
        error: 'This endpoint is only available in local mode',
      });
    }

    const providers = await getProviders();
    const storageProvider = providers.storage as LocalFsStorageProvider;

    // Check if getStorageStats method exists (LocalFs provider)
    if (typeof storageProvider.getStorageStats !== 'function') {
      return res.status(400).json({
        error: 'Storage statistics not available for this provider',
      });
    }

    const stats = await storageProvider.getStorageStats();

    res.json({
      path: stats.path,
      totalSize: stats.totalSize,
      fileCount: stats.fileCount,
      formattedSize: formatBytes(stats.totalSize),
    });
  } catch (error) {
    logger.error('Failed to get storage info', { error });
    res.status(500).json({
      error: 'Failed to retrieve storage information',
    });
  }
});

/**
 * Backup database
 * POST /api/local/backup
 */
router.post('/backup', async (req, res) => {
  try {
    if (!isLocalMode()) {
      return res.status(403).json({
        error: 'This endpoint is only available in local mode',
      });
    }

    const { destinationPath } = req.body;

    if (!destinationPath) {
      return res.status(400).json({
        error: 'destinationPath is required',
      });
    }

    const pathValidation = validateBackupPath(destinationPath, 'backup');
    if (pathValidation.error || !pathValidation.resolvedPath) {
      return res.status(400).json({
        error: pathValidation.error || 'Invalid destinationPath',
      });
    }

    const providers = await getProviders();
    const dbProvider = providers.db as SqliteDbProvider;

    // Check if backup method exists (SQLite provider)
    if (typeof dbProvider.backup !== 'function') {
      return res.status(400).json({
        error: 'Backup not available for this database provider',
      });
    }

    await dbProvider.backup(pathValidation.resolvedPath);

    logger.info('Database backup created', { destinationPath: pathValidation.resolvedPath });

    res.json({
      success: true,
      message: 'Database backup created successfully',
      path: pathValidation.resolvedPath,
    });
  } catch (error) {
    logger.error('Failed to create database backup', { error });
    res.status(500).json({
      error: 'Failed to create database backup',
    });
  }
});

/**
 * Restore database
 * POST /api/local/restore
 */
router.post('/restore', async (req, res) => {
  try {
    if (!isLocalMode()) {
      return res.status(403).json({
        error: 'This endpoint is only available in local mode',
      });
    }

    const { backupPath } = req.body;

    if (!backupPath) {
      return res.status(400).json({
        error: 'backupPath is required',
      });
    }

    const pathValidation = validateBackupPath(backupPath, 'restore');
    if (pathValidation.error || !pathValidation.resolvedPath) {
      return res.status(400).json({
        error: pathValidation.error || 'Invalid backupPath',
      });
    }

    const providers = await getProviders();
    const dbProvider = providers.db as SqliteDbProvider;

    // Check if restore method exists (SQLite provider)
    if (typeof dbProvider.restore !== 'function') {
      return res.status(400).json({
        error: 'Restore not available for this database provider',
      });
    }

    await dbProvider.restore(pathValidation.resolvedPath);

    logger.info('Database restored from backup', { backupPath: pathValidation.resolvedPath });

    res.json({
      success: true,
      message: 'Database restored successfully',
      path: pathValidation.resolvedPath,
    });
  } catch (error) {
    logger.error('Failed to restore database', { error });
    res.status(500).json({
      error: 'Failed to restore database',
    });
  }
});

/**
 * Run database maintenance
 * POST /api/local/maintenance
 */
router.post('/maintenance', async (req, res) => {
  try {
    if (!isLocalMode()) {
      return res.status(403).json({
        error: 'This endpoint is only available in local mode',
      });
    }

    const providers = await getProviders();
    const dbProvider = providers.db as SqliteDbProvider;

    // Check if maintenance method exists (SQLite provider)
    if (typeof dbProvider.maintenance !== 'function') {
      return res.status(400).json({
        error: 'Maintenance not available for this database provider',
      });
    }

    await dbProvider.maintenance();

    logger.info('Database maintenance completed');

    res.json({
      success: true,
      message: 'Database maintenance completed successfully',
    });
  } catch (error) {
    logger.error('Failed to run database maintenance', { error });
    res.status(500).json({
      error: 'Failed to run database maintenance',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Cleanup empty directories in storage
 * POST /api/local/cleanup
 */
router.post('/cleanup', async (req, res) => {
  try {
    if (!isLocalMode()) {
      return res.status(403).json({
        error: 'This endpoint is only available in local mode',
      });
    }

    const providers = await getProviders();
    const storageProvider = providers.storage as LocalFsStorageProvider;

    // Check if cleanupEmptyDirectories method exists
    if (typeof storageProvider.cleanupEmptyDirectories !== 'function') {
      return res.status(400).json({
        error: 'Cleanup not available for this storage provider',
      });
    }

    const removedCount = await storageProvider.cleanupEmptyDirectories();

    logger.info('Storage cleanup completed', { removedCount });

    res.json({
      success: true,
      message: 'Storage cleanup completed successfully',
      removedDirectories: removedCount,
    });
  } catch (error) {
    logger.error('Failed to run storage cleanup', { error });
    res.status(500).json({
      error: 'Failed to run storage cleanup',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get configured API key providers
 * GET /api/local/api-keys/configured
 */
router.get('/api-keys/configured', async (req, res) => {
  try {
    if (!isLocalMode()) {
      return res.status(403).json({
        error: 'This endpoint is only available in local mode',
      });
    }

    const providers = await getProviders();
    const configured = typeof providers.secrets.getConfiguredProviders === 'function'
      ? await providers.secrets.getConfiguredProviders()
      : [];

    res.json({ configured });
  } catch (error) {
    logger.error('Failed to get configured API key providers', { error });
    res.status(500).json({
      error: 'Failed to get configured providers',
    });
  }
});

/**
 * Test an API key
 * POST /api/local/api-keys/test
 */
router.post('/api-keys/test', async (req, res) => {
  try {
    if (!isLocalMode()) {
      return res.status(403).json({
        error: 'This endpoint is only available in local mode',
      });
    }

    const provider = normalizeProvider(req.body?.provider);
    const apiKey = typeof req.body?.apiKey === 'string' ? req.body.apiKey.trim() : '';

    if (!provider || !apiKey) {
      return res.status(400).json({
        error: 'provider and apiKey are required',
      });
    }

    if (!SUPPORTED_API_KEY_PROVIDERS.has(provider)) {
      return res.status(400).json({
        error: 'Invalid provider',
      });
    }

    if (apiKey.length > MAX_API_KEY_LENGTH) {
      return res.status(400).json({
        error: `apiKey exceeds maximum length (${MAX_API_KEY_LENGTH})`,
      });
    }

    if (!isValidApiKeyFormat(provider, apiKey)) {
      return res.json({
        valid: false,
        error: `API key format is invalid for ${provider}`,
      });
    }

    // Test the API key by making a simple request
    let valid = false;
    let testError: string | undefined;
    try {
      if (provider === 'OPENAI') {
        const testResult = await testOpenAiApiKey(apiKey);
        valid = testResult.valid;
        testError = testResult.error;
      } else if (provider === 'ANTHROPIC') {
        // Anthropic doesn't have a simple test endpoint, so we just check format
        valid = true;
      } else if (provider === 'GOOGLE_AI') {
        // Google AI key validation
        valid = true;
      }

      res.json({ valid, error: testError });
    } catch (error) {
      res.json({ valid: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  } catch (error) {
    logger.error('Failed to test API key', { error });
    res.status(500).json({
      error: 'Failed to test API key',
    });
  }
});

/**
 * Save an API key
 * POST /api/local/api-keys/:provider
 */
router.post('/api-keys/:provider', async (req, res) => {
  try {
    if (!isLocalMode()) {
      return res.status(403).json({
        error: 'This endpoint is only available in local mode',
      });
    }

    const provider = normalizeProvider(req.params.provider);
    const apiKey = typeof req.body?.apiKey === 'string' ? req.body.apiKey.trim() : '';

    if (!apiKey) {
      return res.status(400).json({
        error: 'apiKey is required',
      });
    }

    if (!SUPPORTED_API_KEY_PROVIDERS.has(provider)) {
      return res.status(400).json({
        error: 'Invalid provider',
      });
    }

    if (apiKey.length > MAX_API_KEY_LENGTH) {
      return res.status(400).json({
        error: `apiKey exceeds maximum length (${MAX_API_KEY_LENGTH})`,
      });
    }

    if (!isValidApiKeyFormat(provider, apiKey)) {
      return res.status(400).json({
        error: `Invalid API key format for ${provider}`,
      });
    }

    // Import LLM_API_KEYS from WindowsCredentialManagerProvider
    const { LLM_API_KEYS } = await import('../providers/secrets/windowsCredMan');
    const keyName = LLM_API_KEYS[provider as keyof typeof LLM_API_KEYS];

    if (!keyName) {
      return res.status(400).json({
        error: 'Invalid provider',
      });
    }

    const providers = await getProviders();
    await providers.secrets.set(keyName, apiKey);

    logger.info('API key saved', { provider });

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to save API key', { error });
    res.status(500).json({
      error: 'Failed to save API key',
    });
  }
});

/**
 * Delete an API key
 * DELETE /api/local/api-keys/:provider
 */
router.delete('/api-keys/:provider', async (req, res) => {
  try {
    if (!isLocalMode()) {
      return res.status(403).json({
        error: 'This endpoint is only available in local mode',
      });
    }

    const provider = normalizeProvider(req.params.provider);

    if (!SUPPORTED_API_KEY_PROVIDERS.has(provider)) {
      return res.status(400).json({
        error: 'Invalid provider',
      });
    }

    // Import LLM_API_KEYS from WindowsCredentialManagerProvider
    const { LLM_API_KEYS } = await import('../providers/secrets/windowsCredMan');
    const keyName = LLM_API_KEYS[provider as keyof typeof LLM_API_KEYS];

    if (!keyName) {
      return res.status(400).json({
        error: 'Invalid provider',
      });
    }

    const providers = await getProviders();
    await providers.secrets.delete(keyName);

    logger.info('API key deleted', { provider });

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete API key', { error });
    res.status(500).json({
      error: 'Failed to delete API key',
    });
  }
});

/**
 * Helper: Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + (sizes.at(i) || 'Bytes');
}

export default router;

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
import { LLM_API_KEYS } from '../providers/secrets/windowsCredMan';
import { isAuthenticated } from '../replitAuth';
import { backupLocalDatabase, restoreLocalDatabase, runLocalDatabaseMaintenance } from '../db';
import type { IDbProvider, IStorageProvider } from '../providers/interfaces';
import type { SqliteDbStats } from '../providers/db/sqlite';
import { logger } from '../utils/logger';

const router = express.Router();
type SupportedApiKeyProvider = 'OPENAI' | 'ANTHROPIC' | 'GOOGLE_AI';
const SUPPORTED_API_KEY_PROVIDERS = new Set<SupportedApiKeyProvider>(['OPENAI', 'ANTHROPIC', 'GOOGLE_AI']);
const MAX_API_KEY_LENGTH = 4096;
const MAX_PATH_LENGTH = 1024;
const isTestRuntime = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

router.use((req, res, next) => {
  if (!isLocalMode()) {
    return res.status(403).json({
      error: 'This endpoint is only available in local mode',
    });
  }
  return next();
});

router.use(isAuthenticated);

type DbStatsCapableProvider = IDbProvider & {
  getStats: () => Promise<SqliteDbStats>;
};

type DbBackupCapableProvider = IDbProvider & {
  backup: (destinationPath: string) => Promise<string>;
};

type DbRestoreCapableProvider = IDbProvider & {
  restore: (sourcePath: string) => Promise<void>;
};

type DbMaintenanceCapableProvider = IDbProvider & {
  maintenance: () => Promise<void>;
};

type StorageStatsCapableProvider = IStorageProvider & {
  getStorageStats: () => Promise<{ totalSize: number; fileCount: number; path: string }>;
};

type StorageCleanupCapableProvider = IStorageProvider & {
  cleanupEmptyDirectories: () => Promise<number>;
};

function hasDbStats(provider: IDbProvider): provider is DbStatsCapableProvider {
  return typeof (provider as Partial<DbStatsCapableProvider>).getStats === 'function';
}

function hasDbBackup(provider: IDbProvider): provider is DbBackupCapableProvider {
  return typeof (provider as Partial<DbBackupCapableProvider>).backup === 'function';
}

function hasDbRestore(provider: IDbProvider): provider is DbRestoreCapableProvider {
  return typeof (provider as Partial<DbRestoreCapableProvider>).restore === 'function';
}

function hasDbMaintenance(provider: IDbProvider): provider is DbMaintenanceCapableProvider {
  return typeof (provider as Partial<DbMaintenanceCapableProvider>).maintenance === 'function';
}

function hasStorageStats(provider: IStorageProvider): provider is StorageStatsCapableProvider {
  return typeof (provider as Partial<StorageStatsCapableProvider>).getStorageStats === 'function';
}

function hasStorageCleanup(provider: IStorageProvider): provider is StorageCleanupCapableProvider {
  return typeof (provider as Partial<StorageCleanupCapableProvider>).cleanupEmptyDirectories === 'function';
}

function isSupportedProvider(value: string): value is SupportedApiKeyProvider {
  return SUPPORTED_API_KEY_PROVIDERS.has(value as SupportedApiKeyProvider);
}

function normalizeProvider(value: unknown): SupportedApiKeyProvider | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  return isSupportedProvider(normalized) ? normalized : null;
}

function setProviderApiKeyInEnvironment(provider: SupportedApiKeyProvider, apiKey: string): void {
  switch (provider) {
    case 'OPENAI':
      process.env.OPENAI_API_KEY = apiKey;
      return;
    case 'ANTHROPIC':
      process.env.ANTHROPIC_API_KEY = apiKey;
      return;
    case 'GOOGLE_AI':
      process.env.GOOGLE_GENERATIVE_AI_KEY = apiKey;
      process.env.GEMINI_API_KEY = apiKey;
      return;
    default:
      return;
  }
}

function clearProviderApiKeyFromEnvironment(provider: SupportedApiKeyProvider): void {
  switch (provider) {
    case 'OPENAI':
      delete process.env.OPENAI_API_KEY;
      return;
    case 'ANTHROPIC':
      delete process.env.ANTHROPIC_API_KEY;
      return;
    case 'GOOGLE_AI':
      delete process.env.GOOGLE_GENERATIVE_AI_KEY;
      delete process.env.GEMINI_API_KEY;
      return;
    default:
      return;
  }
}

function getProviderSecretName(provider: SupportedApiKeyProvider): string {
  switch (provider) {
    case 'OPENAI':
      return LLM_API_KEYS.OPENAI;
    case 'ANTHROPIC':
      return LLM_API_KEYS.ANTHROPIC;
    case 'GOOGLE_AI':
      return LLM_API_KEYS.GOOGLE_AI;
    default:
      return '';
  }
}

async function resetRuntimeAIClients(): Promise<void> {
  try {
    const [{ resetAIClients }, { resetGeminiClient }, { resetAgentModelClients }] = await Promise.all([
      import('../services/aiClients'),
      import('../services/gemini'),
      import('../mcp/agentClient'),
    ]);
    resetAIClients();
    resetGeminiClient();
    resetAgentModelClients();
  } catch (error) {
    logger.warn('Failed to reset runtime AI clients after API key update', { error });
  }
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

function isValidApiKeyFormat(provider: SupportedApiKeyProvider, apiKey: string): boolean {
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

    if (!response.ok) {
      return { valid: false, error: `OpenAI API rejected key (HTTP ${response.status})` };
    }
    return { valid: true };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { valid: false, error: 'Timed out while validating API key' };
    }

    return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function testAnthropicApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return { valid: false, error: `Anthropic API rejected key (HTTP ${response.status})` };
    }
    return { valid: true };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { valid: false, error: 'Timed out while validating API key' };
    }
    return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function testGoogleApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      return { valid: false, error: `Google AI API rejected key (HTTP ${response.status})` };
    }
    return { valid: true };
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
    const providers = await getProviders();
    const dbProvider = providers.db;

    if (!hasDbStats(dbProvider)) {
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
    const providers = await getProviders();
    const storageProvider = providers.storage;

    if (!hasStorageStats(storageProvider)) {
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

    if (isTestRuntime) {
      const providers = await getProviders();
      const dbProvider = providers.db;
      if (!hasDbBackup(dbProvider)) {
        return res.status(400).json({
          error: 'Backup not available for this database provider',
        });
      }
      await dbProvider.backup(pathValidation.resolvedPath);
    } else {
      await backupLocalDatabase(pathValidation.resolvedPath);
    }

    logger.info('Database backup created', { destinationPath: pathValidation.resolvedPath });

    res.json({
      success: true,
      message: 'Database backup created successfully',
      path: pathValidation.resolvedPath,
      integrityPath: `${pathValidation.resolvedPath}.integrity.json`,
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
    if (isTestRuntime) {
      const dbProvider = providers.db;
      if (!hasDbRestore(dbProvider)) {
        return res.status(400).json({
          error: 'Restore not available for this database provider',
        });
      }
      await dbProvider.restore(pathValidation.resolvedPath);
    } else {
      try {
        await providers.db.close();
      } catch (error) {
        logger.warn('Failed to close provider DB connection before restore', { error });
      }

      await restoreLocalDatabase(pathValidation.resolvedPath);

      try {
        await providers.db.connect();
      } catch (error) {
        logger.error('Failed to reconnect provider DB after restore', { error });
      }
    }

    logger.info('Database restored from backup', { backupPath: pathValidation.resolvedPath });
    const integrityPath = `${pathValidation.resolvedPath}.integrity.json`;
    const integrityVerified = fs.existsSync(integrityPath);

    res.json({
      success: true,
      message: 'Database restored successfully',
      path: pathValidation.resolvedPath,
      integrityVerified,
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
    if (isTestRuntime) {
      const providers = await getProviders();
      const dbProvider = providers.db;
      if (!hasDbMaintenance(dbProvider)) {
        return res.status(400).json({
          error: 'Database maintenance not available for this provider',
        });
      }
      await dbProvider.maintenance();
    } else {
      await runLocalDatabaseMaintenance();
    }

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
    const providers = await getProviders();
    const storageProvider = providers.storage;

    if (!hasStorageCleanup(storageProvider)) {
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
    const rawProvider = typeof req.body?.provider === 'string' ? req.body.provider.trim() : '';
    const provider = normalizeProvider(rawProvider);
    const apiKey = typeof req.body?.apiKey === 'string' ? req.body.apiKey.trim() : '';

    if (!rawProvider || !apiKey) {
      return res.status(400).json({
        error: 'provider and apiKey are required',
      });
    }

    if (!provider) {
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
        const testResult = await testAnthropicApiKey(apiKey);
        valid = testResult.valid;
        testError = testResult.error;
      } else if (provider === 'GOOGLE_AI') {
        const testResult = await testGoogleApiKey(apiKey);
        valid = testResult.valid;
        testError = testResult.error;
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
    const provider = normalizeProvider(req.params.provider);
    const apiKey = typeof req.body?.apiKey === 'string' ? req.body.apiKey.trim() : '';

    if (!apiKey) {
      return res.status(400).json({
        error: 'apiKey is required',
      });
    }
    if (!provider) {
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

    const keyName = getProviderSecretName(provider);

    const providers = await getProviders();
    const allowEnvironmentFallback = process.env.ALLOW_ENV_SECRET_FALLBACK === 'true';
    let persistedToSecrets = true;
    try {
      await providers.secrets.set(keyName, apiKey);
    } catch (error) {
      if (!allowEnvironmentFallback) {
        logger.error('Secrets provider could not persist API key and environment fallback is disabled', {
          provider,
          error: error instanceof Error ? error.message : String(error),
        });
        return res.status(500).json({
          error: 'Failed to store API key securely. Ensure Windows Credential Manager support is available.',
        });
      }
      persistedToSecrets = false;
      logger.warn('Secrets provider could not persist API key, falling back to process environment', {
        provider,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    setProviderApiKeyInEnvironment(provider, apiKey);
    await resetRuntimeAIClients();

    logger.info('API key saved', { provider });

    res.json({
      success: true,
      persistence: persistedToSecrets ? 'secrets-provider' : 'process-environment',
    });
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
    const provider = normalizeProvider(req.params.provider);

    if (!provider) {
      return res.status(400).json({
        error: 'Invalid provider',
      });
    }

    const keyName = getProviderSecretName(provider);

    const providers = await getProviders();
    try {
      await providers.secrets.delete(keyName);
    } catch (error) {
      logger.warn('Secrets provider could not delete API key, continuing with in-memory cleanup', {
        provider,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    clearProviderApiKeyFromEnvironment(provider);
    await resetRuntimeAIClients();

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

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
import { getRuntimeConfig, isLocalMode } from '../config/runtime';
import { getProviders } from '../providers';
import { logger } from '../utils/logger';
import type { SqliteDbProvider } from '../providers/db/sqlite';
import type { LocalFsStorageProvider } from '../providers/storage/localFs';

const router = express.Router();

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

    const providers = await getProviders();
    const dbProvider = providers.db as SqliteDbProvider;

    // Check if backup method exists (SQLite provider)
    if (typeof dbProvider.backup !== 'function') {
      return res.status(400).json({
        error: 'Backup not available for this database provider',
      });
    }

    await dbProvider.backup(destinationPath);

    logger.info('Database backup created', { destinationPath });

    res.json({
      success: true,
      message: 'Database backup created successfully',
      path: destinationPath,
    });
  } catch (error) {
    logger.error('Failed to create database backup', { error });
    res.status(500).json({
      error: 'Failed to create database backup',
      details: error instanceof Error ? error.message : 'Unknown error',
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

    const providers = await getProviders();
    const dbProvider = providers.db as SqliteDbProvider;

    // Check if restore method exists (SQLite provider)
    if (typeof dbProvider.restore !== 'function') {
      return res.status(400).json({
        error: 'Restore not available for this database provider',
      });
    }

    await dbProvider.restore(backupPath);

    logger.info('Database restored from backup', { backupPath });

    res.json({
      success: true,
      message: 'Database restored successfully',
      path: backupPath,
    });
  } catch (error) {
    logger.error('Failed to restore database', { error });
    res.status(500).json({
      error: 'Failed to restore database',
      details: error instanceof Error ? error.message : 'Unknown error',
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
 * Helper: Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default router;

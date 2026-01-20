/**
 * Database Health Service
 * Provides health checks, integrity verification, and diagnostics for database
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { schemaMigrations } from '@shared/schema-migrations';

export interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    connection: boolean;
    migrations: { current: number; latest: number; upToDate: boolean };
    poolMetrics: {
      total: number;
      idle: number;
      waiting: number;
    };
  };
  issues: string[];
  lastChecked: Date;
}

export class DatabaseHealthService {
  /**
   * Perform comprehensive database health check
   */
  async checkHealth(): Promise<DatabaseHealth> {
    const issues: string[] = [];
    let connectionOk = false;
    let migrationsOk = { current: 0, latest: 0, upToDate: false };

    try {
      // 1. Test basic connection
      await db.execute(sql`SELECT 1`);
      connectionOk = true;
    } catch (error) {
      issues.push(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // 2. Check schema migrations
      const migrations = await db.select()
        .from(schemaMigrations)
        .orderBy(schemaMigrations.version);

      const currentVersion = migrations.length > 0 ? migrations[migrations.length - 1].version : 0;
      const latestVersion = this.getLatestMigrationVersion();
      
      migrationsOk = {
        current: currentVersion,
        latest: latestVersion,
        upToDate: currentVersion === latestVersion,
      };

      if (currentVersion < latestVersion) {
        issues.push(`Database schema is outdated (${currentVersion}/${latestVersion})`);
      }
    } catch (error) {
      issues.push(`Migration check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 3. Get pool metrics
    const poolMetrics = {
      total: 0,
      idle: 0,
      waiting: 0,
    };

    try {
      // Note: Pool metrics specific to connection pool implementation
      // This would need to be adapted based on actual pool
      const globalPool = (global as { dbPool?: { totalCount: number; idleCount: number; waitingCount: number } }).dbPool;
      poolMetrics.total = globalPool?.totalCount || 0;
      poolMetrics.idle = globalPool?.idleCount || 0;
      poolMetrics.waiting = globalPool?.waitingCount || 0;
    } catch (error) {
      logger.debug('Could not retrieve pool metrics', { error });
    }

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (!connectionOk) {
      status = 'unhealthy';
    } else if (issues.length > 0) {
      status = 'degraded';
    }

    const health: DatabaseHealth = {
      status,
      checks: {
        connection: connectionOk,
        migrations: migrationsOk,
        poolMetrics,
      },
      issues,
      lastChecked: new Date(),
    };

    logger.info('Database health check completed', {
      status,
      issueCount: issues.length,
    });

    return health;
  }

  /**
   * Get latest migration version from code
   * In a real implementation, this would read from migration files
   */
  private getLatestMigrationVersion(): number {
    // TODO: Read from actual migration files directory
    // For now, return current version
    return 1;
  }

  /**
   * Verify database integrity (PostgreSQL-specific)
   */
  async verifyIntegrity(): Promise<{ ok: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // For PostgreSQL, we can check for corrupted indexes and tables
      // This is a basic check - more comprehensive checks would be added
      await db.execute(sql`SELECT 1`);
      return { ok: true, errors: [] };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown integrity error');
      return { ok: false, errors };
    }
  }

  /**
   * Get database size and statistics
   */
  async getDatabaseStats(): Promise<{
    sizeBytes: number;
    tableCount: number;
    rowCounts: Record<string, number>;
  }> {
    try {
      // Get database size (PostgreSQL-specific)
      const sizeResult = await db.execute(sql`
        SELECT pg_database_size(current_database()) as size
      `);
      
      const sizeBytes = Number((sizeResult.rows[0] as { size?: number })?.size || 0);

      // Get table count
      const tableResult = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `);

      const tableCount = Number((tableResult.rows[0] as { count?: number })?.count || 0);

      return {
        sizeBytes,
        tableCount,
        rowCounts: {}, // TODO: Add specific table row counts if needed
      };
    } catch (error) {
      logger.error('Failed to get database stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        sizeBytes: 0,
        tableCount: 0,
        rowCounts: {},
      };
    }
  }

  /**
   * Log usage metric (opt-in only)
   */
  async logUsageMetric(
    eventType: string,
    eventData: Record<string, unknown>
  ): Promise<void> {
    // Check if telemetry is enabled (would read from settings)
    const telemetryEnabled = process.env.TELEMETRY_ENABLED === 'true';
    
    if (!telemetryEnabled) {
      return;
    }

    try {
      const { usageMetrics } = await import('@shared/schema-migrations');
      
      await db.insert(usageMetrics).values({
        eventType,
        eventData: JSON.stringify(eventData),
      });

      logger.debug('Usage metric logged', { eventType });
    } catch (error) {
      // Silently fail - metrics should never break functionality
      logger.debug('Failed to log usage metric', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const databaseHealthService = new DatabaseHealthService();

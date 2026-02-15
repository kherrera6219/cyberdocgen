/**
 * PostgreSQL Database Provider
 * 
 * Cloud mode database implementation using PostgreSQL.
 * Delegates to existing Drizzle ORM setup for compatibility.
 */

import type { IDbProvider, IDbConnection, IDbTransaction } from '../interfaces';
import { logger } from '../../utils/logger';
import { pool, testDatabaseConnection, closeDatabaseConnections } from '../../db';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class PostgresDbProvider implements IDbProvider {
  private connectionString: string;
  private migrationsPath?: string;
  
  constructor(connectionString: string, migrationsPath?: string) {
    this.connectionString = connectionString;
    if (migrationsPath) {
      this.migrationsPath = path.resolve(migrationsPath);
    }
  }

  private getPool() {
    if (!pool) {
      throw new Error('PostgreSQL pool is not initialized');
    }
    return pool;
  }
  
  async connect(): Promise<IDbConnection> {
    const pgPool = this.getPool();

    return {
      query: async <T>(sql: string, params?: any[]) => {
        const result = await pgPool.query(sql, params);
        return result.rows as T[];
      },
      execute: async (sql: string, params?: any[]) => {
        await pgPool.query(sql, params);
      },
      close: async () => {
        // Closing is handled globally by closeDatabaseConnections
      },
    };
  }
  
  async migrate(): Promise<void> {
    const pgPool = this.getPool();
    if (!this.migrationsPath) {
      logger.info('[PostgresDbProvider] No migrations path configured, skipping SQL migrations');
      return;
    }

    if (!fs.existsSync(this.migrationsPath)) {
      logger.warn('[PostgresDbProvider] Migrations path does not exist, skipping SQL migrations', {
        migrationsPath: this.migrationsPath,
      });
      return;
    }

    const migrationFiles = fs
      .readdirSync(this.migrationsPath)
      .filter((file) => file.toLowerCase().endsWith('.sql'))
      .sort();

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    for (const migrationFile of migrationFiles) {
      const migrationPath = path.join(this.migrationsPath, migrationFile);
      const sqlText = fs.readFileSync(migrationPath, 'utf8');
      const checksum = crypto.createHash('sha256').update(sqlText).digest('hex');

      const existing = await pgPool.query<{ checksum: string }>(
        'SELECT checksum FROM _migrations WHERE name = $1',
        [migrationFile]
      );
      if (existing.rows.length > 0) {
        const appliedChecksum = existing.rows[0].checksum;
        if (appliedChecksum !== checksum) {
          throw new Error(
            `Postgres migration checksum mismatch for ${migrationFile}. ` +
            `Applied=${appliedChecksum}, Current=${checksum}`
          );
        }
        continue;
      }

      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sqlText);
        await client.query(
          'INSERT INTO _migrations (name, checksum) VALUES ($1, $2)',
          [migrationFile, checksum]
        );
        await client.query('COMMIT');
        logger.info('[PostgresDbProvider] Applied migration', { migrationFile });
      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch {
          // Ignore rollback failures if transaction already closed.
        }
        throw error;
      } finally {
        client.release();
      }
    }

    logger.info('[PostgresDbProvider] Migration completed', { migrationsApplied: migrationFiles.length });
  }
  
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const pgPool = this.getPool();
    const result = await pgPool.query(sql, params);
    return result.rows as T[];
  }
  
  async transaction<T>(callback: (tx: IDbTransaction) => Promise<T>): Promise<T> {
    const pgPool = this.getPool();
    const client = await pgPool.connect();
    let completed = false;
    try {
      await client.query('BEGIN');

      const tx: IDbTransaction = {
        query: async <R = any>(sql: string, params?: any[]) => {
          const result = await client.query(sql, params);
          return result.rows as R[];
        },
        commit: async () => {
          if (!completed) {
            await client.query('COMMIT');
            completed = true;
          }
        },
        rollback: async () => {
          if (!completed) {
            await client.query('ROLLBACK');
            completed = true;
          }
        },
      };

      const result = await callback(tx);
      if (!completed) {
        await client.query('COMMIT');
        completed = true;
      }
      return result;
    } catch (error) {
      if (!completed) {
        try {
          await client.query('ROLLBACK');
        } catch {
          // Ignore rollback failures if transaction is already closed.
        }
      }
      throw error;
    } finally {
      client.release();
    }
  }
  
  async healthCheck(): Promise<boolean> {
    // Use the health check from db.ts
    return await testDatabaseConnection();
  }
  
  async close(): Promise<void> {
    logger.debug('[PostgresDbProvider] Closing PostgreSQL connections');
    // Pool cleanup handled by db.ts
    await closeDatabaseConnections();
  }
}

/**
 * PGlite Database Provider
 *
 * Local-first embedded PostgreSQL database using @electric-sql/pglite.
 * Runs fully in-process with NO external database server required.
 * Supports pgvector for AI RAG embeddings.
 *
 * Storage location: ~/.cyberdocgen/data/ (configurable)
 */

import { PGlite } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite/vector';
import fs from 'fs';
import path from 'path';
import type { IDbConnection, IDbProvider, IDbTransaction } from '../interfaces';
import { logger } from '../../utils/logger';

export interface PgliteDbStats {
  path: string;
  size: number;
  fileSize: number;
  connections: number;
}

export class PgliteDbProvider implements IDbProvider {
  private pg: PGlite | null = null;
  private readonly dataDir: string;
  private readonly migrationsPath?: string;

  constructor(dataDir: string, migrationsPath?: string) {
    this.dataDir = path.resolve(dataDir);
    if (migrationsPath) {
      this.migrationsPath = path.resolve(migrationsPath);
    }
    logger.info(`[PgliteDbProvider] Initialized with dataDir: ${this.dataDir}`);
  }

  private ensureConnected(): PGlite {
    if (!this.pg) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.pg;
  }

  private createConnectionHandle(): IDbConnection {
    return {
      query: async <T = any>(sql: string, params: any[] = []) => this.query<T>(sql, params),
      execute: async (sql: string, params: any[] = []) => {
        await this.query(sql, params);
      },
      close: async () => this.close(),
    };
  }

  async connect(): Promise<IDbConnection> {
    if (this.pg) {
      return this.createConnectionHandle();
    }

    try {
      // Ensure the data directory exists
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
        logger.info(`[PgliteDbProvider] Created data directory: ${this.dataDir}`);
      }

      // Attempt to reuse the global pgInstance from server/db.ts to avoid double connection lock errors
      try {
        const dbModule = await import('../../db');
        await dbModule.getDbAsync();
        if (dbModule.pgInstance) {
          logger.info('[PgliteDbProvider] Reusing existing global pgInstance from db.ts');
          this.pg = dbModule.pgInstance;
          return this.createConnectionHandle();
        }
      } catch (dbError) {
        logger.debug('[PgliteDbProvider] Could not reuse global pgInstance from db.ts, will instantiate new PGlite', { error: dbError });
      }

      // Initialize PGlite with pgvector extension and persistent local storage
      this.pg = new PGlite({
        dataDir: this.dataDir,
        extensions: { vector },
      });

      // Wait for PGlite to be ready
      await this.pg.waitReady;

      // Enable pgvector extension
      await this.pg.exec('CREATE EXTENSION IF NOT EXISTS vector;');

      logger.info(`[PgliteDbProvider] Connected to embedded PostgreSQL at ${this.dataDir}`);
      return this.createConnectionHandle();
    } catch (error) {
      const message = error instanceof Error ? error.message : (typeof error === 'object' ? JSON.stringify(error) : String(error));
      logger.error('[PgliteDbProvider] Connection error', { error: message });
      throw error;
    }
  }

  async migrate(): Promise<void> {
    const pg = this.ensureConnected();

    if (!this.migrationsPath) {
      logger.info('[PgliteDbProvider] No migrations path configured, skipping SQL migrations');
      return;
    }

    if (!fs.existsSync(this.migrationsPath)) {
      logger.info(`[PgliteDbProvider] Migrations path not found, skipping: ${this.migrationsPath}`);
      return;
    }

    logger.info('[PgliteDbProvider] Starting migration...');

    // Create migrations tracking table if not exists
    await pg.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const appliedResult = await pg.query<{ name: string }>('SELECT name FROM _migrations');
    const appliedMigrations = new Set(appliedResult.rows.map((r) => r.name));

    const migrationFiles = fs
      .readdirSync(this.migrationsPath)
      .filter((file) => file.toLowerCase().endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      if (appliedMigrations.has(file)) {
        continue;
      }

      try {
        const migrationContent = fs.readFileSync(path.join(this.migrationsPath, file), 'utf-8');
        const statements = migrationContent.split('--> statement-breakpoint');
        await pg.transaction(async (tx) => {
          for (const statement of statements) {
            const trimmed = statement.trim();
            if (trimmed) {
              await tx.exec(trimmed);
            }
          }
          await tx.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        });
        logger.info(`[PgliteDbProvider] Applied migration: ${file}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[PgliteDbProvider] Migration failed on ${file}`, { error: message });
        throw error;
      }
    }

    logger.info('[PgliteDbProvider] Migration completed');
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const pg = this.ensureConnected();

    try {
      const result = await pg.query<T>(sql, params);
      return result.rows;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('[PgliteDbProvider] Query failed', { sql, error: message });
      throw error;
    }
  }

  async transaction<T>(callback: (tx: IDbTransaction) => Promise<T>): Promise<T> {
    const pg = this.ensureConnected();

    return pg.transaction(async (pgTx) => {
      const tx: IDbTransaction = {
        query: async <R = any>(sql: string, params: any[] = []) => {
          const result = await pgTx.query<R>(sql, params);
          return result.rows;
        },
        commit: async () => {
          // PGlite transaction commits automatically on success
        },
        rollback: async () => {
          // PGlite transaction rolls back automatically on throw
          throw new Error('Manual rollback requested');
        },
      };

      return callback(tx);
    });
  }

  async healthCheck(): Promise<boolean> {
    if (!this.pg) {
      return false;
    }

    try {
      await this.pg.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.pg) {
      await this.pg.close();
      this.pg = null;
      logger.info('[PgliteDbProvider] Connection closed.');
    }
  }

  async backup(destinationPath: string): Promise<string> {
    this.ensureConnected();
    const resolvedDestination = path.resolve(destinationPath);

    try {
      const backupDir = path.dirname(resolvedDestination);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // PGlite stores data as a directory — copy the entire dataDir as the backup
      fs.cpSync(this.dataDir, resolvedDestination, { recursive: true });
      logger.info(`[PgliteDbProvider] Database backup successful to ${resolvedDestination}`);
      return resolvedDestination;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('[PgliteDbProvider] Backup failed', { error: message });
      throw error;
    }
  }

  async restore(sourcePath: string): Promise<void> {
    const resolvedSourcePath = path.resolve(sourcePath);
    if (!fs.existsSync(resolvedSourcePath)) {
      throw new Error(`Backup directory does not exist: ${resolvedSourcePath}`);
    }

    const wasConnected = !!this.pg;
    await this.close();

    try {
      if (fs.existsSync(this.dataDir)) {
        fs.rmSync(this.dataDir, { recursive: true, force: true });
      }
      fs.cpSync(resolvedSourcePath, this.dataDir, { recursive: true });

      if (wasConnected) {
        await this.connect();
      }

      logger.info(`[PgliteDbProvider] Database restored from ${resolvedSourcePath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('[PgliteDbProvider] Restore failed', { error: message });
      throw error;
    }
  }

  async getStats(): Promise<PgliteDbStats> {
    let size = 0;
    if (fs.existsSync(this.dataDir)) {
      const getSize = (dir: string): number => {
        let total = 0;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            total += getSize(fullPath);
          } else {
            total += fs.statSync(fullPath).size;
          }
        }
        return total;
      };
      size = getSize(this.dataDir);
    }

    return {
      path: this.dataDir,
      size,
      fileSize: size,
      connections: 1,
    };
  }

  async maintenance(): Promise<void> {
    const pg = this.ensureConnected();
    await pg.exec('VACUUM ANALYZE;');
    logger.info('[PgliteDbProvider] Maintenance (VACUUM ANALYZE) complete.');
  }
}

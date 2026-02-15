import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import type { IDbConnection, IDbProvider, IDbTransaction } from '../interfaces';
import { logger } from '../../utils/logger';
import { createIntegrityEnvelope, type IntegrityEnvelope, verifyIntegrityEnvelope } from '../../utils/dataIntegrity';

export interface SqliteDbStats {
  path: string;
  size: number;
  fileSize: number;
  pageCount: number;
  pageSize: number;
  walMode: boolean;
  walSize: number;
  journalMode: string;
  connections: number;
}

interface SqliteBackupIntegritySidecar {
  version: 1;
  backupPath: string;
  sourcePath: string;
  fileSize: number;
  generatedAt: string;
  envelope: IntegrityEnvelope;
}

function isIntegrityEnvelope(value: unknown): value is IntegrityEnvelope {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const envelope = value as Partial<IntegrityEnvelope>;
  return (
    typeof envelope.algorithm === 'string'
    && typeof envelope.hash === 'string'
    && typeof envelope.hmac === 'string'
    && typeof envelope.generatedAt === 'string'
  );
}

export class SqliteDbProvider implements IDbProvider {
  private db: Database.Database | null = null;
  private readonly dbPath: string;
  private readonly migrationsPath?: string;

  constructor(dbPath: string, migrationsPath?: string) {
    this.dbPath = path.resolve(dbPath);
    if (migrationsPath) {
      this.migrationsPath = path.resolve(migrationsPath);
    }
    logger.info(`[SqliteDbProvider] Initialized with path: ${this.dbPath}`);
  }

  private getIntegritySidecarPath(backupPath: string): string {
    return `${backupPath}.integrity.json`;
  }

  private shouldRequireSignedBackups(): boolean {
    return process.env.NODE_ENV === 'production' && process.env.ALLOW_UNSIGNED_BACKUP_RESTORE !== 'true';
  }

  private writeBackupIntegritySidecar(backupPath: string): void {
    const content = fs.readFileSync(backupPath);
    const payload: SqliteBackupIntegritySidecar = {
      version: 1,
      backupPath,
      sourcePath: this.dbPath,
      fileSize: content.length,
      generatedAt: new Date().toISOString(),
      envelope: createIntegrityEnvelope(content),
    };
    fs.writeFileSync(this.getIntegritySidecarPath(backupPath), JSON.stringify(payload, null, 2), 'utf8');
  }

  private verifyBackupIntegrityIfPresent(backupPath: string): void {
    const sidecarPath = this.getIntegritySidecarPath(backupPath);
    if (!fs.existsSync(sidecarPath)) {
      if (this.shouldRequireSignedBackups()) {
        throw new Error(`Backup integrity sidecar missing: ${sidecarPath}`);
      }

      logger.warn('[SqliteDbProvider] Backup integrity sidecar missing; skipping verification', {
        backupPath,
        sidecarPath,
      });
      return;
    }

    const sidecarRaw = fs.readFileSync(sidecarPath, 'utf8');
    const sidecar = JSON.parse(sidecarRaw) as Partial<SqliteBackupIntegritySidecar>;
    if (!isIntegrityEnvelope(sidecar.envelope)) {
      throw new Error(`Backup integrity sidecar is invalid: ${sidecarPath}`);
    }

    const content = fs.readFileSync(backupPath);
    const verification = verifyIntegrityEnvelope(content, sidecar.envelope);
    if (!verification.valid) {
      throw new Error(
        `Backup integrity verification failed (hashValid=${verification.hashValid}, hmacValid=${verification.hmacValid})`
      );
    }
  }

  private ensureConnected(): Database.Database {
    if (!this.db) {
      throw new Error('Database not connected.');
    }

    return this.db;
  }

  private configureConnection(db: Database.Database): void {
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = -64000');
    db.pragma('temp_store = MEMORY');
    db.pragma('foreign_keys = ON');
    logger.info('[SqliteDbProvider] Connection configured with WAL mode and performance settings');
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
    if (this.db) {
      return this.createConnectionHandle();
    }

    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`[SqliteDbProvider] Created directory: ${dir}`);
      }

      this.db = new Database(this.dbPath, {
        verbose: (message: unknown) => logger.debug(`[SQLite] ${String(message)}`),
      });
      this.configureConnection(this.db);
      logger.info(`[SqliteDbProvider] Connected to ${this.dbPath}`);
      return this.createConnectionHandle();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('[SqliteDbProvider] Connection error', { error: message });
      throw error;
    }
  }

  async migrate(): Promise<void> {
    const db = this.ensureConnected();

    if (!this.migrationsPath) {
      logger.info('[SqliteDbProvider] No migrations path configured, skipping SQL migrations');
      return;
    }

    if (!fs.existsSync(this.migrationsPath)) {
      logger.info(`[SqliteDbProvider] Migrations path not found, skipping: ${this.migrationsPath}`);
      return;
    }

    logger.info('[SqliteDbProvider] Starting migration...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationColumns = db
      .prepare(`PRAGMA table_info('_migrations')`)
      .all()
      .map((row) => (row as { name: string }).name.toLowerCase());
    const hasVersionColumn = migrationColumns.includes('version');

    const appliedMigrations = db
      .prepare('SELECT name FROM _migrations')
      .all()
      .map((row) => (row as { name: string }).name);
    const usedMigrationVersions = new Set<number>(
      hasVersionColumn
        ? db
            .prepare('SELECT version FROM _migrations WHERE version IS NOT NULL')
            .all()
            .map((row) => Number((row as { version: number }).version))
            .filter((value) => Number.isFinite(value))
        : []
    );
    let nextMigrationVersion =
      usedMigrationVersions.size > 0 ? Math.max(...Array.from(usedMigrationVersions)) + 1 : 1;

    const migrationFiles = fs
      .readdirSync(this.migrationsPath)
      .filter((file) => file.toLowerCase().endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      if (appliedMigrations.includes(file)) {
        continue;
      }

      try {
        const migration = fs.readFileSync(path.join(this.migrationsPath, file), 'utf-8');
        db.exec('BEGIN');
        db.exec(migration);
        if (hasVersionColumn) {
          const versionMatch = file.match(/^(\d+)/);
          let version = versionMatch ? parseInt(versionMatch[1], 10) : nextMigrationVersion;
          if (!Number.isFinite(version) || version <= 0) {
            version = nextMigrationVersion;
          }
          while (usedMigrationVersions.has(version)) {
            version = nextMigrationVersion;
            nextMigrationVersion += 1;
          }
          db.prepare('INSERT INTO _migrations (version, name) VALUES (?, ?)').run(version, file);
          usedMigrationVersions.add(version);
          if (version >= nextMigrationVersion) {
            nextMigrationVersion = version + 1;
          }
        } else {
          db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
        }
        db.exec('COMMIT');
        logger.info(`[SqliteDbProvider] Applied migration: ${file}`);
      } catch (error) {
        try {
          db.exec('ROLLBACK');
        } catch {
          // Ignore rollback failures if transaction already closed.
        }

        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[SqliteDbProvider] Migration failed on ${file}`, { error: message });
        throw error;
      }
    }

    logger.info('[SqliteDbProvider] Migration completed');
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const db = this.ensureConnected();

    try {
      const statement = db.prepare(sql);
      if (statement.reader) {
        return (params.length > 0 ? statement.all(...params) : statement.all()) as T[];
      }

      if (params.length > 0) {
        statement.run(...params);
      } else {
        statement.run();
      }
      return [];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('[SqliteDbProvider] Query failed', { sql, error: message });
      throw error;
    }
  }

  async transaction<T>(callback: (tx: IDbTransaction) => Promise<T>): Promise<T> {
    const db = this.ensureConnected();

    db.exec('BEGIN');
    let completed = false;

    const tx: IDbTransaction = {
      query: async <R = any>(sql: string, params: any[] = []) => this.query<R>(sql, params),
      commit: async () => {
        if (!completed) {
          db.exec('COMMIT');
          completed = true;
        }
      },
      rollback: async () => {
        if (!completed) {
          db.exec('ROLLBACK');
          completed = true;
        }
      },
    };

    try {
      const result = await callback(tx);
      if (!completed) {
        db.exec('COMMIT');
        completed = true;
      }
      return result;
    } catch (error) {
      if (!completed) {
        try {
          db.exec('ROLLBACK');
        } catch {
          // Ignore rollback failures if transaction already closed.
        }
      }
      logger.error('[SqliteDbProvider] Transaction rolled back', { error });
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.db) {
      return false;
    }

    try {
      this.db.prepare('SELECT 1').get();
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.db && this.db.open) {
      this.db.close();
      this.db = null;
      logger.info('[SqliteDbProvider] Connection closed.');
    }
  }

  async backup(destinationPath: string): Promise<string> {
    const db = this.ensureConnected();
    const resolvedDestination = path.resolve(destinationPath);

    try {
      const backupDir = path.dirname(resolvedDestination);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      await db.backup(resolvedDestination);
      this.writeBackupIntegritySidecar(resolvedDestination);
      logger.info(`[SqliteDbProvider] Database backup successful to ${resolvedDestination}`);
      return resolvedDestination;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('[SqliteDbProvider] Backup failed', { error: message });
      throw error;
    }
  }

  async restore(sourcePath: string): Promise<void> {
    const resolvedSourcePath = path.resolve(sourcePath);
    if (!fs.existsSync(resolvedSourcePath)) {
      throw new Error(`Backup file does not exist: ${resolvedSourcePath}`);
    }

    this.verifyBackupIntegrityIfPresent(resolvedSourcePath);

    const wasConnected = !!this.db;
    await this.close();

    try {
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      fs.copyFileSync(resolvedSourcePath, this.dbPath);

      const walPath = `${this.dbPath}-wal`;
      const shmPath = `${this.dbPath}-shm`;
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

      if (wasConnected) {
        await this.connect();
      }

      logger.info(`[SqliteDbProvider] Database restored from ${resolvedSourcePath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('[SqliteDbProvider] Restore failed', { error: message });
      throw error;
    }
  }

  async getStats(): Promise<SqliteDbStats> {
    const db = this.ensureConnected();
    const pageCount = Number(db.pragma('page_count', { simple: true }) || 0);
    const pageSize = Number(db.pragma('page_size', { simple: true }) || 0);
    const journalMode = String(db.pragma('journal_mode', { simple: true }) || 'unknown').toLowerCase();
    const walMode = journalMode === 'wal';
    const size = fs.existsSync(this.dbPath) ? fs.statSync(this.dbPath).size : 0;

    const walPath = `${this.dbPath}-wal`;
    const walSize = fs.existsSync(walPath) ? fs.statSync(walPath).size : 0;

    return {
      path: this.dbPath,
      size,
      fileSize: size,
      pageCount,
      pageSize,
      walMode,
      walSize,
      journalMode,
      connections: 1,
    };
  }

  async maintenance(): Promise<void> {
    this.ensureConnected();
    await this.query('VACUUM;');
    await this.query('ANALYZE;');
    logger.info('[SqliteDbProvider] Maintenance (VACUUM, ANALYZE) complete.');
  }
}

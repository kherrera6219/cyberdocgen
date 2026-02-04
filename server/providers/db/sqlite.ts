import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { IDbProvider, HealthCheck, QueryResult, DbStats } from './types';
import { logger } from '../utils/logger';

export class SqliteDbProvider implements IDbProvider {
  private db: Database.Database | null = null;
  private dbPath: string;
  private migrationsPath: string;

  constructor(dbPath: string, migrationsPath: string) {
    this.dbPath = dbPath;
    this.migrationsPath = migrationsPath;
    logger.info(`[SqliteDbProvider] Initialized with path: ${this.dbPath}`);
  }

  async connect(): Promise<void> {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`[SqliteDbProvider] Created directory: ${dir}`)
      }

      this.db = new Database(this.dbPath, { verbose: (message: any) => logger.debug(`[SQLite] ${message}`) });
      this.configureConnection();
      logger.info(`[SqliteDbProvider] Connected to ${this.dbPath}`);
    } catch (error: any) {
      logger.error('[SqliteDbProvider] Connection error', { error: error.message });
      throw error;
    }
  }

  private configureConnection(): void {
    if (!this.db) return;
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000'); // 64MB cache
    this.db.pragma('temp_store = MEMORY');
    this.db.pragma('foreign_keys = ON');
    logger.info('[SqliteDbProvider] Connection configured with WAL mode and performance settings');
  }

  async migrate(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() before migrating.');
    }

    logger.info('[SqliteDbProvider] Starting migration...');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const appliedMigrations = this.db.prepare('SELECT name FROM _migrations').all().map((row: any) => row.name);
    const migrationFiles = fs.readdirSync(this.migrationsPath).sort();

    for (const file of migrationFiles) {
      if (appliedMigrations.includes(file)) {
        continue;
      }

      try {
        const migration = fs.readFileSync(path.join(this.migrationsPath, file), 'utf-8');
        this.db.exec('BEGIN');
        this.db.exec(migration);
        this.db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
        this.db.exec('COMMIT');
        logger.info(`[SqliteDbProvider] Applied migration: ${file}`);
      } catch (error: any) {
        this.db.exec('ROLLBACK');
        logger.error(`[SqliteDbProvider] Migration failed on ${file}`, { error: error.message });
        throw error;
      }
    }
    logger.info('[SqliteDbProvider] Migration completed');
  }

  async query<T>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    if (!this.db) {
      throw new Error('Database not connected.');
    }

    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.all(params);
      return { rows: result as T[] };
    } catch (error: any) {
      logger.error('[SqliteDbProvider] Query failed', { sql, error: error.message });
      throw error;
    }
  }

  async transaction<T>(callback: (provider: IDbProvider) => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new Error('Database not connected.');
    }
    
    this.db.exec('BEGIN');
    try {
      const result = await callback(this);
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      logger.error('[SqliteDbProvider] Transaction rolled back', { error });
      throw error;
    }
  }

  async healthCheck(): Promise<HealthCheck> {
    if (!this.db) {
      return { healthy: false, message: 'Database not connected' };
    }
    try {
      this.db.prepare('SELECT 1').get();
      return { healthy: true, message: 'Connection successful' };
    } catch (error: any) {
      return { healthy: false, message: error.message };
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
    if (!this.db) {
      throw new Error('Database not connected.');
    }

    try {
      const backupDir = path.dirname(destinationPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      await this.db.backup(destinationPath);
      logger.info(`[SqliteDbProvider] Database backup successful to ${destinationPath}`);
      return destinationPath;
    } catch (error: any) {
      logger.error('[SqliteDbProvider] Backup failed', { error: error.message });
      throw error;
    }
  }
  
  async getStats(): Promise<DbStats> {
      if (!this.db) {
        throw new Error('Database not connected.');
      }

      const stats: any = {};
      const sizeResult = this.db.pragma('page_count * page_size', { simple: true });
      stats.fileSize = sizeResult;

      try {
        const walPath = `${this.dbPath}-wal`;
        if (fs.existsSync(walPath)) {
          stats.walSize = fs.statSync(walPath).size;
        }
      } catch (e) { 
        // ignore if wal file not accessible
      }

      stats.journalMode = this.db.pragma('journal_mode', { simple: true });
      stats.connections = this.db.pragma('integrity_check', { simple: true });

      return stats;
  }
  
  async maintenance(): Promise<void> {
      if (!this.db) {
          throw new Error('Database not connected.');
      }
      this.query('VACUUM;');
      this.query('ANALYZE;');
      logger.info('[SqliteDbProvider] Maintenance (VACUUM, ANALYZE) complete.');
  }
}

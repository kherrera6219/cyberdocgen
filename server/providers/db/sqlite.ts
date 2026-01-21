/**
 * SQLite Database Provider
 *
 * Local mode database implementation using SQLite.
 * Stores database file in user data directory.
 *
 * Implementation: Sprint 1
 */

import Database from 'better-sqlite3';
import type { IDbProvider, IDbConnection, IDbTransaction } from '../interfaces';
import path from 'path';
import fs from 'fs';

export class SqliteDbProvider implements IDbProvider {
  private filePath: string;
  private db: Database.Database | null = null;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async connect(): Promise<IDbConnection> {
    console.log(`[SqliteDbProvider] Connecting to: ${this.filePath}`);

    // Ensure directory exists
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[SqliteDbProvider] Created directory: ${dir}`);
    }

    // Initialize database with better-sqlite3
    this.db = new Database(this.filePath, {
      verbose: (msg) => console.log('[SQLite]', msg),
      fileMustExist: false,
    });

    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000'); // 64MB cache
    this.db.pragma('temp_store = MEMORY');
    this.db.pragma('foreign_keys = ON');

    console.log('[SqliteDbProvider] Connected successfully with WAL mode');

    return {
      query: async <T>(sql: string, params?: any[]) => {
        return this.query<T>(sql, params);
      },
      execute: async (sql: string, params?: any[]) => {
        if (!this.db) throw new Error('Database not connected');
        const stmt = this.db.prepare(sql);
        stmt.run(...(params || []));
      },
      close: async () => {
        await this.close();
      },
    };
  }

  async migrate(): Promise<void> {
    if (!this.db) {
      await this.connect();
    }

    console.log('[SqliteDbProvider] Starting database migration...');

    // Create migrations table if it doesn't exist
    this.db!.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER NOT NULL UNIQUE,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Get current version
    const currentVersion = this.db!.prepare(
      'SELECT COALESCE(MAX(version), 0) as version FROM _migrations'
    ).get() as { version: number };

    console.log(`[SqliteDbProvider] Current schema version: ${currentVersion.version}`);

    // Load and apply pending migrations
    const migrations = this.getPendingMigrations(currentVersion.version);

    if (migrations.length === 0) {
      console.log('[SqliteDbProvider] No pending migrations');
      return;
    }

    console.log(`[SqliteDbProvider] Applying ${migrations.length} migration(s)...`);

    for (const migration of migrations) {
      console.log(`[SqliteDbProvider] Applying migration ${migration.version}: ${migration.name}`);

      try {
        // Execute migration in a transaction
        const applyMigration = this.db!.transaction(() => {
          this.db!.exec(migration.sql);
          this.db!.prepare(
            'INSERT INTO _migrations (version, name) VALUES (?, ?)'
          ).run(migration.version, migration.name);
        });

        applyMigration();
        console.log(`[SqliteDbProvider] Migration ${migration.version} applied successfully`);
      } catch (error) {
        console.error(`[SqliteDbProvider] Migration ${migration.version} failed:`, error);
        throw error;
      }
    }

    console.log('[SqliteDbProvider] Migration complete');
  }

  /**
   * Get pending migrations that need to be applied
   */
  private getPendingMigrations(currentVersion: number): Array<{ version: number; name: string; sql: string }> {
    // For Sprint 1, we'll use inline migrations
    // In production, these would be loaded from migration files

    const allMigrations = [
      {
        version: 1,
        name: 'initial_schema',
        sql: this.getInitialSchemaSql(),
      },
    ];

    return allMigrations.filter(m => m.version > currentVersion);
  }

  /**
   * Get initial schema SQL (converted from PostgreSQL to SQLite)
   */
  private getInitialSchemaSql(): string {
    return `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT,
        first_name TEXT,
        last_name TEXT,
        role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user', 'auditor')),
        organization_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_login_at TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        email_verified INTEGER NOT NULL DEFAULT 0,
        mfa_enabled INTEGER NOT NULL DEFAULT 0,
        mfa_secret TEXT
      );

      -- Organizations table
      CREATE TABLE IF NOT EXISTS organizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        settings TEXT,
        subscription_tier TEXT DEFAULT 'free' CHECK(subscription_tier IN ('free', 'pro', 'enterprise'))
      );

      -- Documents table
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        document_type TEXT NOT NULL CHECK(document_type IN ('policy', 'procedure', 'plan', 'manual', 'other')),
        framework TEXT CHECK(framework IN ('iso27001', 'soc2', 'fedramp', 'nist')),
        status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'in_review', 'approved', 'published', 'archived')),
        version INTEGER NOT NULL DEFAULT 1,
        organization_id INTEGER NOT NULL,
        created_by INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        published_at TEXT,
        metadata TEXT,
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      -- Document versions table
      CREATE TABLE IF NOT EXISTS document_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER NOT NULL,
        version INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_by INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        change_summary TEXT,
        FOREIGN KEY (document_id) REFERENCES documents(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      -- Gap analysis table
      CREATE TABLE IF NOT EXISTS gap_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization_id INTEGER NOT NULL,
        framework TEXT NOT NULL CHECK(framework IN ('iso27001', 'soc2', 'fedramp', 'nist')),
        control_id TEXT NOT NULL,
        control_name TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('not_implemented', 'partially_implemented', 'fully_implemented', 'not_applicable')),
        gap_description TEXT,
        remediation_plan TEXT,
        priority TEXT CHECK(priority IN ('critical', 'high', 'medium', 'low')),
        target_date TEXT,
        assigned_to INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id)
      );

      -- Risk assessments table
      CREATE TABLE IF NOT EXISTS risk_assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization_id INTEGER NOT NULL,
        risk_name TEXT NOT NULL,
        description TEXT,
        likelihood TEXT CHECK(likelihood IN ('very_low', 'low', 'medium', 'high', 'very_high')),
        impact TEXT CHECK(impact IN ('very_low', 'low', 'medium', 'high', 'very_high')),
        risk_score INTEGER,
        mitigation_plan TEXT,
        status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'mitigated', 'accepted', 'closed')),
        owner INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        FOREIGN KEY (owner) REFERENCES users(id)
      );

      -- Audit logs table
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization_id INTEGER,
        user_id INTEGER,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        risk_level TEXT CHECK(risk_level IN ('low', 'medium', 'high', 'critical')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- Files/Storage metadata table
      CREATE TABLE IF NOT EXISTS storage_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization_id INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        uri TEXT NOT NULL UNIQUE,
        size INTEGER NOT NULL,
        content_type TEXT NOT NULL,
        hash TEXT,
        uploaded_by INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      );

      -- Create indexes for common queries
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
      CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id);
      CREATE INDEX IF NOT EXISTS idx_documents_framework ON documents(framework);
      CREATE INDEX IF NOT EXISTS idx_gap_analysis_org ON gap_analysis(organization_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_storage_files_org ON storage_files(organization_id);

      -- Insert default local organization for local mode
      INSERT OR IGNORE INTO organizations (id, name, slug, settings)
      VALUES (1, 'Local Workspace', 'local', '{}');

      -- Insert default local admin user for local mode
      INSERT OR IGNORE INTO users (id, email, role, first_name, last_name, organization_id, is_active)
      VALUES (1, 'admin@local', 'admin', 'Local', 'Admin', 1, 1);
    `;
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...(params || []));
      return rows as T[];
    } catch (error) {
      console.error('[SqliteDbProvider] Query error:', error);
      console.error('[SqliteDbProvider] SQL:', sql);
      console.error('[SqliteDbProvider] Params:', params);
      throw error;
    }
  }

  async transaction<T>(callback: (tx: IDbTransaction) => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    const transaction: IDbTransaction = {
      query: async <T>(sql: string, params?: any[]): Promise<T[]> => {
        if (!this.db) throw new Error('Database not connected');
        const stmt = this.db.prepare(sql);
        return stmt.all(...(params || [])) as T[];
      },
      commit: async () => {
        // Commit is handled by better-sqlite3 transaction function
      },
      rollback: async () => {
        throw new Error('Transaction rollback requested');
      },
    };

    // Use better-sqlite3 transaction wrapper
    const wrappedCallback = this.db.transaction(async () => {
      return await callback(transaction);
    });

    try {
      return wrappedCallback();
    } catch (error) {
      console.error('[SqliteDbProvider] Transaction error:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.db) {
      return false;
    }

    try {
      // Simple query to verify DB is accessible
      const result = this.db.prepare('SELECT 1 as test').get();
      return result !== undefined;
    } catch (error) {
      console.error('[SqliteDbProvider] Health check failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      console.log('[SqliteDbProvider] Closing SQLite database');
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Perform database maintenance (vacuum, analyze)
   */
  async maintenance(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    console.log('[SqliteDbProvider] Running maintenance...');

    try {
      this.db.exec('VACUUM');
      this.db.exec('ANALYZE');
      console.log('[SqliteDbProvider] Maintenance complete');
    } catch (error) {
      console.error('[SqliteDbProvider] Maintenance error:', error);
      throw error;
    }
  }

  /**
   * Create a backup of the database
   */
  async backup(destinationPath: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    console.log(`[SqliteDbProvider] Creating backup: ${destinationPath}`);

    try {
      // Ensure backup directory exists
      const backupDir = path.dirname(destinationPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Use better-sqlite3 backup API
      await this.db.backup(destinationPath);
      console.log('[SqliteDbProvider] Backup complete');
    } catch (error) {
      console.error('[SqliteDbProvider] Backup error:', error);
      throw error;
    }
  }

  /**
   * Restore from a backup
   */
  async restore(backupPath: string): Promise<void> {
    console.log(`[SqliteDbProvider] Restoring from backup: ${backupPath}`);

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    try {
      // Close current connection
      await this.close();

      // Copy backup file to current database location
      fs.copyFileSync(backupPath, this.filePath);

      // Reconnect
      await this.connect();

      console.log('[SqliteDbProvider] Restore complete');
    } catch (error) {
      console.error('[SqliteDbProvider] Restore error:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    path: string;
    size: number;
    pageCount: number;
    pageSize: number;
    walMode: boolean;
  }> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    const stats = fs.statSync(this.filePath);
    const pageCount = this.db.prepare('PRAGMA page_count').pluck().get() as number;
    const pageSize = this.db.prepare('PRAGMA page_size').pluck().get() as number;
    const journalMode = this.db.prepare('PRAGMA journal_mode').pluck().get() as string;

    return {
      path: this.filePath,
      size: stats.size,
      pageCount,
      pageSize,
      walMode: journalMode.toLowerCase() === 'wal',
    };
  }
}

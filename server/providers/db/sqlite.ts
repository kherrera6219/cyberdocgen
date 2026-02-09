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
import { logger } from '../../utils/logger';

export class SqliteDbProvider implements IDbProvider {
  private filePath: string;
  private db: Database.Database | null = null;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async connect(): Promise<IDbConnection> {
    logger.debug(`[SqliteDbProvider] Connecting to: ${this.filePath}`);

    // Ensure directory exists
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.debug(`[SqliteDbProvider] Created directory: ${dir}`);
    }

    // Initialize database with better-sqlite3
    this.db = new Database(this.filePath, {
      verbose: (msg) => logger.debug('[SQLite]', msg),
      fileMustExist: false,
    });

    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000'); // 64MB cache
    this.db.pragma('temp_store = MEMORY');
    this.db.pragma('foreign_keys = ON');

    logger.debug('[SqliteDbProvider] Connected successfully with WAL mode');

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

    logger.debug('[SqliteDbProvider] Starting database migration...');

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

    logger.debug(`[SqliteDbProvider] Current schema version: ${currentVersion.version}`);

    // Load and apply pending migrations
    const migrations = this.getPendingMigrations(currentVersion.version);

    if (migrations.length === 0) {
      logger.debug('[SqliteDbProvider] No pending migrations');
      return;
    }

    logger.debug(`[SqliteDbProvider] Applying ${migrations.length} migration(s)...`);

    for (const migration of migrations) {
      logger.debug(`[SqliteDbProvider] Applying migration ${migration.version}: ${migration.name}`);

      try {
        // Execute migration in a transaction
        const applyMigration = this.db!.transaction(() => {
          this.db!.exec(migration.sql);
          this.db!.prepare(
            'INSERT INTO _migrations (version, name) VALUES (?, ?)'
          ).run(migration.version, migration.name);
        });

        applyMigration();
        logger.debug(`[SqliteDbProvider] Migration ${migration.version} applied successfully`);
      } catch (error) {
        logger.error(`[SqliteDbProvider] Migration ${migration.version} failed:`, error);
        throw error;
      }
    }

    logger.debug('[SqliteDbProvider] Migration complete');
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
      {
        version: 2,
        name: 'schema_parity_fixes',
        sql: this.getSchemaParitySql(),
      },
    ];

    return allMigrations.filter(m => m.version > currentVersion);
  }

  /**
   * Add missing columns/tables needed by the current shared schema.
   * This keeps existing local databases upgradeable across releases.
   */
  private getSchemaParitySql(): string {
    if (!this.db) {
      return '-- no-op';
    }

    const statements: string[] = [];

    const tableExists = (table: string): boolean => {
      const row = this.db!
        .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
        .get(table) as { name?: string } | undefined;
      return Boolean(row?.name);
    };

    const columnExists = (table: string, column: string): boolean => {
      if (!tableExists(table)) {
        return false;
      }

      const columns = this.db!
        .prepare(`PRAGMA table_info(${table})`)
        .all() as Array<{ name: string }>;

      return columns.some((c) => c.name === column);
    };

    const ensureColumn = (table: string, column: string, definition: string) => {
      if (tableExists(table) && !columnExists(table, column)) {
        statements.push(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      }
    };

    ensureColumn('users', 'profile_image_url', 'TEXT');
    ensureColumn('users', 'phone_number', 'TEXT');
    ensureColumn('users', 'phone_verified', 'INTEGER NOT NULL DEFAULT 0');
    ensureColumn('users', 'two_factor_enabled', 'INTEGER NOT NULL DEFAULT 0');
    ensureColumn('users', 'account_status', `TEXT DEFAULT 'pending_verification'`);
    ensureColumn('users', 'failed_login_attempts', 'INTEGER DEFAULT 0');
    ensureColumn('users', 'account_locked_until', 'TEXT');
    ensureColumn('users', 'passkey_enabled', 'INTEGER DEFAULT 0');
    ensureColumn('users', 'profile_preferences', `TEXT DEFAULT '{}'`);
    ensureColumn('users', 'notification_settings', `TEXT DEFAULT '{}'`);

    ensureColumn('audit_logs', 'old_values', 'TEXT');
    ensureColumn('audit_logs', 'new_values', 'TEXT');
    ensureColumn('audit_logs', 'additional_context', 'TEXT');
    ensureColumn('audit_logs', 'timestamp', `TEXT NOT NULL DEFAULT (datetime('now'))`);
    ensureColumn('audit_logs', 'signature', 'TEXT');
    ensureColumn('audit_logs', 'previous_signature', 'TEXT');

    if (!tableExists('document_approvals')) {
      statements.push(`
        CREATE TABLE IF NOT EXISTS document_approvals (
          id TEXT PRIMARY KEY,
          document_id TEXT NOT NULL,
          version_id TEXT,
          requested_by TEXT NOT NULL,
          approver_role TEXT NOT NULL,
          assigned_to TEXT,
          status TEXT DEFAULT 'pending',
          comments TEXT,
          priority TEXT DEFAULT 'medium',
          due_date TEXT,
          approved_at TEXT,
          rejected_at TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `.trim());
      statements.push('CREATE INDEX IF NOT EXISTS idx_document_approvals_status ON document_approvals(status)');
      statements.push('CREATE INDEX IF NOT EXISTS idx_document_approvals_created_at ON document_approvals(created_at)');
    }

    if (statements.length === 0) {
      return '-- no-op';
    }

    return statements.map((s) => `${s};`).join('\n');
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
        profile_image_url TEXT,
        role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user', 'auditor')),
        organization_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_login_at TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        email_verified INTEGER NOT NULL DEFAULT 0,
        phone_number TEXT,
        phone_verified INTEGER NOT NULL DEFAULT 0,
        two_factor_enabled INTEGER NOT NULL DEFAULT 0,
        account_status TEXT DEFAULT 'pending_verification',
        failed_login_attempts INTEGER DEFAULT 0,
        account_locked_until TEXT,
        passkey_enabled INTEGER DEFAULT 0,
        profile_preferences TEXT DEFAULT '{}',
        notification_settings TEXT DEFAULT '{}',
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
        old_values TEXT,
        new_values TEXT,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        risk_level TEXT CHECK(risk_level IN ('low', 'medium', 'high', 'critical')),
        additional_context TEXT,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        signature TEXT,
        previous_signature TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- Document approvals
      CREATE TABLE IF NOT EXISTS document_approvals (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        version_id TEXT,
        requested_by TEXT NOT NULL,
        approver_role TEXT NOT NULL,
        assigned_to TEXT,
        status TEXT DEFAULT 'pending',
        comments TEXT,
        priority TEXT DEFAULT 'medium',
        due_date TEXT,
        approved_at TEXT,
        rejected_at TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
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
      CREATE INDEX IF NOT EXISTS idx_document_approvals_status ON document_approvals(status);
      CREATE INDEX IF NOT EXISTS idx_document_approvals_created_at ON document_approvals(created_at);
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
      const trimmedSql = sql.trim().toUpperCase();

      // Use run() for INSERT, UPDATE, DELETE, CREATE, DROP, ALTER
      if (
        trimmedSql.startsWith('INSERT') ||
        trimmedSql.startsWith('UPDATE') ||
        trimmedSql.startsWith('DELETE') ||
        trimmedSql.startsWith('CREATE') ||
        trimmedSql.startsWith('DROP') ||
        trimmedSql.startsWith('ALTER')
      ) {
        stmt.run(...(params || []));
        return [] as T[];
      }

      // Use all() for SELECT and other queries that return data
      const rows = stmt.all(...(params || []));
      return rows as T[];
    } catch (error) {
      logger.error('[SqliteDbProvider] Query error:', error);
      logger.error('[SqliteDbProvider] SQL:', sql);
      logger.error('[SqliteDbProvider] Params:', params);
      throw error;
    }
  }

  async transaction<T>(callback: (tx: IDbTransaction) => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    const transaction: IDbTransaction = {
      query: async <T>(sql: string, params?: any[]): Promise<T[]> => {
        return this.query<T>(sql, params);
      },
      commit: async () => {
        // Commit is handled automatically at the end
      },
      rollback: async () => {
        throw new Error('Transaction rollback requested');
      },
    };

    // Manually handle transaction with BEGIN/COMMIT/ROLLBACK for async support
    try {
      logger.debug('[SQLite] BEGIN');
      this.db.prepare('BEGIN').run();

      const result = await callback(transaction);

      logger.debug('[SQLite] COMMIT');
      this.db.prepare('COMMIT').run();

      return result;
    } catch (error) {
      logger.error('[SqliteDbProvider] Transaction error:', error);

      try {
        logger.debug('[SQLite] ROLLBACK');
        this.db.prepare('ROLLBACK').run();
      } catch (rollbackError) {
        logger.error('[SqliteDbProvider] Rollback error:', rollbackError);
      }

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
      logger.error('[SqliteDbProvider] Health check failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      logger.debug('[SqliteDbProvider] Closing SQLite database');
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

    logger.debug('[SqliteDbProvider] Running maintenance...');

    try {
      this.db.exec('VACUUM');
      this.db.exec('ANALYZE');
      logger.debug('[SqliteDbProvider] Maintenance complete');
    } catch (error) {
      logger.error('[SqliteDbProvider] Maintenance error:', error);
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

    logger.debug(`[SqliteDbProvider] Creating backup: ${destinationPath}`);

    try {
      // Ensure backup directory exists
      const backupDir = path.dirname(destinationPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Use better-sqlite3 backup API
      await this.db.backup(destinationPath);
      logger.debug('[SqliteDbProvider] Backup complete');
    } catch (error) {
      logger.error('[SqliteDbProvider] Backup error:', error);
      throw error;
    }
  }

  /**
   * Restore from a backup
   */
  async restore(backupPath: string): Promise<void> {
    logger.debug(`[SqliteDbProvider] Restoring from backup: ${backupPath}`);

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

      logger.debug('[SqliteDbProvider] Restore complete');
    } catch (error) {
      logger.error('[SqliteDbProvider] Restore error:', error);
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

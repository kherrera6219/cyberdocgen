/**
 * SQLite Database Provider
 * 
 * Local mode database implementation using SQLite.
 * Stores database file in user data directory.
 * 
 * To be fully implemented in Sprint 1.
 */

import type { IDbProvider, IDbConnection, IDbTransaction } from '../interfaces';

export class SqliteDbProvider implements IDbProvider {
  private filePath: string;
  private db: any; // Will be better-sqlite3 instance
  
  constructor(filePath: string) {
    this.filePath = filePath;
    this.db = null;
  }
  
  async connect(): Promise<IDbConnection> {
    console.log(`[SqliteDbProvider] Would connect to: ${this.filePath}`);
    
    // TODO(sprint-1): Implement SQLite connection
    // const Database = require('better-sqlite3');
    // this.db = new Database(this.filePath);
    
    return {
      query: async <T>(sql: string, params?: any[]) => {
        throw new Error('SqliteDbProvider - To be implemented in Sprint 1');
      },
      execute: async (sql: string, params?: any[]) => {
        throw new Error('SqliteDbProvider - To be implemented in Sprint 1');
      },
      close: async () => {
        if (this.db) {
          this.db.close();
        }
      },
    };
  }
  
  async migrate(): Promise<void> {
    console.log('[SqliteDbProvider] Auto-migration on startup - Sprint 1');
    
    // TODO(sprint-1): Implement SQLite migrations
    // - Check current schema version
    // - Run pending migrations
    // - Store migration history in _migrations table
  }
  
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    
    // TODO(sprint-1): Execute query with better-sqlite3
    // const stmt = this.db.prepare(sql);
    // return stmt.all(...(params || []));
    
    throw new Error('SqliteDbProvider.query() - To be implemented in Sprint 1');
  }
  
  async transaction<T>(callback: (tx: IDbTransaction) => Promise<T>): Promise<T> {
    // TODO(sprint-1): Implement SQLite transactions
    throw new Error('SqliteDbProvider.transaction() - To be implemented in Sprint 1');
  }
  
  async healthCheck(): Promise<boolean> {
    if (!this.db) {
      return false;
    }
    
    try {
      // Simple query to verify DB is accessible
      // this.db.prepare('SELECT 1').get();
      return true;
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
}

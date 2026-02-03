/**
 * PostgreSQL Database Provider
 * 
 * Cloud mode database implementation using PostgreSQL.
 * Delegates to existing Drizzle ORM setup for compatibility.
 */

import type { IDbProvider, IDbConnection, IDbTransaction } from '../interfaces';
import { logger } from '../../utils/logger';
import { db, testDatabaseConnection, closeDatabaseConnections } from '../../db';

export class PostgresDbProvider implements IDbProvider {
  private connectionString: string;
  
  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }
  
  async connect(): Promise<IDbConnection> {
    // Connection is managed by the singleton db instance from db.ts
    logger.debug('[PostgresDbProvider] Connection handled by db.ts');
    return {
      query: async <T>(sql: string, params?: any[]) => {
        // This is a compatibility layer. Use the Drizzle ORM directly.
        return db.query(sql, params);
      },
      execute: async (sql: string, params?: any[]) => {
        // This is a compatibility layer. Use the Drizzle ORM directly.
        return db.execute(sql, params);
      },
      close: async () => {
        // Closing is handled globally by closeDatabaseConnections
      },
    };
  }
  
  async migrate(): Promise<void> {
    // Uses existing Drizzle migration system
    logger.debug('[PostgresDbProvider] Migrations handled by db:push or db:migrate');
  }
  
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    // Delegate to existing Drizzle/Postgres setup
    throw new Error('PostgresDbProvider.query() - Use Drizzle ORM directly');
  }
  
  async transaction<T>(callback: (tx: IDbTransaction) => Promise<T>): Promise<T> {
    // Delegate to existing Drizzle transaction support
    throw new Error('PostgresDbProvider.transaction() - Use db.transaction() from db.ts');
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

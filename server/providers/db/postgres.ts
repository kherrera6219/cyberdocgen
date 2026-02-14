/**
 * PostgreSQL Database Provider
 * 
 * Cloud mode database implementation using PostgreSQL.
 * Delegates to existing Drizzle ORM setup for compatibility.
 */

import type { IDbProvider, IDbConnection, IDbTransaction } from '../interfaces';
import { logger } from '../../utils/logger';
import { pool, testDatabaseConnection, closeDatabaseConnections } from '../../db';

export class PostgresDbProvider implements IDbProvider {
  private connectionString: string;
  
  constructor(connectionString: string) {
    this.connectionString = connectionString;
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
    // Uses existing Drizzle migration system
    logger.debug('[PostgresDbProvider] Migrations handled by db:push or db:migrate');
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

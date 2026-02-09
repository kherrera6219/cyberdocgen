/**
 * PostgreSQL Database Provider
 *
 * Cloud mode database implementation using PostgreSQL.
 */

import postgres, { type Sql } from 'postgres';
import type { IDbProvider, IDbConnection, IDbTransaction } from '../interfaces';
import { logger } from '../../utils/logger';

class TransactionRollbackError extends Error {
  constructor() {
    super('Transaction rollback requested');
    this.name = 'TransactionRollbackError';
  }
}

export class PostgresDbProvider implements IDbProvider {
  private connectionString: string;
  private client: Sql | null = null;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  private async getClient(): Promise<Sql> {
    if (!this.client) {
      await this.connect();
    }

    if (!this.client) {
      throw new Error('PostgreSQL client not initialized');
    }

    return this.client;
  }

  async connect(): Promise<IDbConnection> {
    if (!this.client) {
      logger.debug('[PostgresDbProvider] Connecting to PostgreSQL...');

      this.client = postgres(this.connectionString, {
        max: 20,
        idle_timeout: 30,
        connect_timeout: 10,
        prepare: false,
      });

      await this.client`SELECT 1`;
      logger.info('[PostgresDbProvider] PostgreSQL connection established');
    }

    return {
      query: async <T>(sql: string, params?: any[]) => {
        return this.query<T>(sql, params);
      },
      execute: async (sql: string, params?: any[]) => {
        const client = await this.getClient();
        await client.unsafe(sql, params ?? []);
      },
      close: async () => {
        await this.close();
      },
    };
  }

  async migrate(): Promise<void> {
    // Migrations are handled through dedicated migration scripts.
    logger.debug('[PostgresDbProvider] Migrations are managed by db:push/db:migrate');
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const client = await this.getClient();
    const rows = await client.unsafe(sql, params ?? []);
    return rows as unknown as T[];
  }

  async transaction<T>(callback: (tx: IDbTransaction) => Promise<T>): Promise<T> {
    const client = await this.getClient();

    try {
      const result = await client.begin(async txClient => {
        const tx: IDbTransaction = {
          query: async <R>(sql: string, params?: any[]) => {
            const rows = await txClient.unsafe(sql, params ?? []);
            return rows as unknown as R[];
          },
          commit: async () => {
            // postgres.begin commits automatically when callback resolves.
          },
          rollback: async () => {
            throw new TransactionRollbackError();
          },
        };

        return callback(tx);
      });
      return result as unknown as T;
    } catch (error) {
      if (error instanceof TransactionRollbackError) {
        throw new Error('Transaction rolled back');
      }
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.getClient();
      await client`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('[PostgresDbProvider] Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async close(): Promise<void> {
    if (!this.client) {
      return;
    }

    logger.debug('[PostgresDbProvider] Closing PostgreSQL connections');
    await this.client.end({ timeout: 5 });
    this.client = null;
  }
}

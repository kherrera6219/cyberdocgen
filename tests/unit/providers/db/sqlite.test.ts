/**
 * Unit tests for SQLite Database Provider
 * Sprint 1 - Local Mode Implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SqliteDbProvider } from '../../../../server/providers/db/sqlite';
import fs from 'fs';
import path from 'path';

describe('SqliteDbProvider', () => {
  const testDbPath = './test-data/test.db';
  let provider: SqliteDbProvider;

  beforeEach(async () => {
    // Clean up test database before each test
    const dir = path.dirname(testDbPath);
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    if (fs.existsSync(`${testDbPath}-shm`)) {
      fs.unlinkSync(`${testDbPath}-shm`);
    }
    if (fs.existsSync(`${testDbPath}-wal`)) {
      fs.unlinkSync(`${testDbPath}-wal`);
    }

    provider = new SqliteDbProvider(testDbPath);
  });

  afterEach(async () => {
    // Clean up after each test
    await provider.close();

    // Remove test database files
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    if (fs.existsSync(`${testDbPath}-shm`)) {
      fs.unlinkSync(`${testDbPath}-shm`);
    }
    if (fs.existsSync(`${testDbPath}-wal`)) {
      fs.unlinkSync(`${testDbPath}-wal`);
    }
  });

  describe('connect', () => {
    it('should create database file if it does not exist', async () => {
      expect(fs.existsSync(testDbPath)).toBe(false);

      await provider.connect();

      expect(fs.existsSync(testDbPath)).toBe(true);
    });

    it('should create parent directory if needed', async () => {
      const deepPath = './test-data/deep/nested/test.db';
      const deepProvider = new SqliteDbProvider(deepPath);

      await deepProvider.connect();

      expect(fs.existsSync(deepPath)).toBe(true);

      // Cleanup
      await deepProvider.close();
      fs.unlinkSync(deepPath);
      fs.rmdirSync('./test-data/deep/nested');
      fs.rmdirSync('./test-data/deep');
    });

    it('should enable WAL mode', async () => {
      await provider.connect();

      const stats = await provider.getStats();
      expect(stats.walMode).toBe(true);
    });
  });

  describe('migrate', () => {
    it('should create migrations table', async () => {
      await provider.connect();
      await provider.migrate();

      const tables = await provider.query<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'"
      );

      expect(tables.length).toBeGreaterThan(0);
      expect(tables[0].name).toBe('_migrations');
    });

    it('should apply initial schema migration', async () => {
      await provider.connect();
      await provider.migrate();

      // Check that core tables were created
      const tables = await provider.query<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      );

      const tableNames = tables.map(t => t.name);

      expect(tableNames).toContain('users');
      expect(tableNames).toContain('organizations');
      expect(tableNames).toContain('documents');
      expect(tableNames).toContain('gap_analysis');
      expect(tableNames).toContain('audit_logs');
    });

    it('should insert default local organization and user', async () => {
      await provider.connect();
      await provider.migrate();

      const orgs = await provider.query<{ id: number; name: string }>(
        "SELECT id, name FROM organizations WHERE id = 1"
      );

      expect(orgs.length).toBe(1);
      expect(orgs[0].name).toBe('Local Workspace');

      const users = await provider.query<{ id: number; email: string }>(
        "SELECT id, email FROM users WHERE id = 1"
      );

      expect(users.length).toBe(1);
      expect(users[0].email).toBe('admin@local');
    });

    it('should not re-apply migrations on second run', async () => {
      await provider.connect();
      await provider.migrate();

      // Get migration count
      const firstCount = await provider.query<{ count: number }>(
        "SELECT COUNT(*) as count FROM _migrations"
      );

      // Run migrations again
      await provider.migrate();

      const secondCount = await provider.query<{ count: number }>(
        "SELECT COUNT(*) as count FROM _migrations"
      );

      expect(secondCount[0].count).toBe(firstCount[0].count);
    });
  });

  describe('query', () => {
    beforeEach(async () => {
      await provider.connect();
      await provider.migrate();
    });

    it('should execute SELECT queries', async () => {
      const result = await provider.query<{ result: number }>(
        "SELECT 1 as result"
      );

      expect(result.length).toBe(1);
      expect(result[0].result).toBe(1);
    });

    it('should support parameterized queries', async () => {
      const name = 'Test Org';
      const slug = 'test-org';

      await provider.query(
        "INSERT INTO organizations (name, slug, settings) VALUES (?, ?, ?)",
        [name, slug, '{}']
      );

      const result = await provider.query<{ name: string; slug: string }>(
        "SELECT name, slug FROM organizations WHERE slug = ?",
        [slug]
      );

      expect(result.length).toBe(1);
      expect(result[0].name).toBe(name);
      expect(result[0].slug).toBe(slug);
    });

    it('should return empty array for no results', async () => {
      const result = await provider.query<{ id: number }>(
        "SELECT * FROM organizations WHERE id = 9999"
      );

      expect(result).toEqual([]);
    });
  });

  describe('transaction', () => {
    beforeEach(async () => {
      await provider.connect();
      await provider.migrate();
    });

    it('should commit transaction on success', async () => {
      await provider.transaction(async (tx) => {
        await tx.query(
          "INSERT INTO organizations (name, slug, settings) VALUES (?, ?, ?)",
          ['Test 1', 'test-1', '{}']
        );
        await tx.query(
          "INSERT INTO organizations (name, slug, settings) VALUES (?, ?, ?)",
          ['Test 2', 'test-2', '{}']
        );
      });

      const result = await provider.query<{ name: string }>(
        "SELECT name FROM organizations WHERE slug LIKE 'test-%' ORDER BY name"
      );

      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Test 1');
      expect(result[1].name).toBe('Test 2');
    });

    it('should rollback transaction on error', async () => {
      try {
        await provider.transaction(async (tx) => {
          await tx.query(
            "INSERT INTO organizations (name, slug, settings) VALUES (?, ?, ?)",
            ['Test 1', 'test-1', '{}']
          );

          // This should cause a unique constraint violation
          await tx.query(
            "INSERT INTO organizations (id, name, slug, settings) VALUES (?, ?, ?, ?)",
            [1, 'Duplicate', 'local', '{}']
          );
        });

        // Should not reach here
        expect.fail('Transaction should have failed');
      } catch (error) {
        // Transaction should rollback
        const result = await provider.query<{ slug: string }>(
          "SELECT slug FROM organizations WHERE slug = 'test-1'"
        );

        expect(result.length).toBe(0);
      }
    });
  });

  describe('healthCheck', () => {
    it('should return false if not connected', async () => {
      const isHealthy = await provider.healthCheck();
      expect(isHealthy).toBe(false);
    });

    it('should return true if connected', async () => {
      await provider.connect();
      const isHealthy = await provider.healthCheck();
      expect(isHealthy).toBe(true);
    });
  });

  describe('close', () => {
    it('should close database connection', async () => {
      await provider.connect();
      expect(await provider.healthCheck()).toBe(true);

      await provider.close();
      expect(await provider.healthCheck()).toBe(false);
    });

    it('should be safe to call multiple times', async () => {
      await provider.connect();
      await provider.close();
      await provider.close(); // Should not throw
    });
  });

  describe('backup', () => {
    beforeEach(async () => {
      await provider.connect();
      await provider.migrate();
    });

    it('should create backup file', async () => {
      const backupPath = './test-data/backup.db';

      // Insert test data
      await provider.query(
        "INSERT INTO organizations (name, slug, settings) VALUES (?, ?, ?)",
        ['Backup Test', 'backup-test', '{}']
      );

      await provider.backup(backupPath);

      expect(fs.existsSync(backupPath)).toBe(true);

      // Cleanup
      fs.unlinkSync(backupPath);
    });

    it('should create backup directory if needed', async () => {
      const backupPath = './test-data/backups/backup.db';

      await provider.backup(backupPath);

      expect(fs.existsSync(backupPath)).toBe(true);

      // Cleanup
      fs.unlinkSync(backupPath);
      fs.rmdirSync('./test-data/backups');
    });
  });

  describe('restore', () => {
    beforeEach(async () => {
      await provider.connect();
      await provider.migrate();
    });

    it('should restore database from backup', async () => {
      const backupPath = './test-data/backup.db';

      // Insert test data
      await provider.query(
        "INSERT INTO organizations (name, slug, settings) VALUES (?, ?, ?)",
        ['Original Data', 'original', '{}']
      );

      // Create backup
      await provider.backup(backupPath);

      // Modify database
      await provider.query(
        "DELETE FROM organizations WHERE slug = 'original'"
      );

      // Verify data is gone
      let result = await provider.query<{ name: string }>(
        "SELECT name FROM organizations WHERE slug = 'original'"
      );
      expect(result.length).toBe(0);

      // Restore from backup
      await provider.restore(backupPath);

      // Verify data is restored
      result = await provider.query<{ name: string }>(
        "SELECT name FROM organizations WHERE slug = 'original'"
      );
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Original Data');

      // Cleanup
      fs.unlinkSync(backupPath);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await provider.connect();
      await provider.migrate();
    });

    it('should return database statistics', async () => {
      const stats = await provider.getStats();

      expect(stats).toHaveProperty('path');
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('pageCount');
      expect(stats).toHaveProperty('pageSize');
      expect(stats).toHaveProperty('walMode');

      expect(stats.path).toBe(testDbPath);
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.pageCount).toBeGreaterThan(0);
      expect(stats.pageSize).toBeGreaterThan(0);
      expect(stats.walMode).toBe(true);
    });
  });

  describe('maintenance', () => {
    beforeEach(async () => {
      await provider.connect();
      await provider.migrate();
    });

    it('should run VACUUM and ANALYZE', async () => {
      // Should not throw
      await provider.maintenance();
    });
  });
});

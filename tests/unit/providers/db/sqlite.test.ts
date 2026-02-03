import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SqliteDbProvider } from '../../../../server/providers/db/sqlite';

const TEST_DB_PATH = './test-data/test.db';
const MIGRATIONS_PATH = './server/providers/db/migrations/sqlite';

describe('SqliteDbProvider', () => {
  beforeEach(() => {
    // Ensure the test-data directory exists and is clean
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    if (!fs.existsSync(path.dirname(TEST_DB_PATH))) {
      fs.mkdirSync(path.dirname(TEST_DB_PATH), { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  it('should create database file if it does not exist', async () => {
    const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
    await provider.connect();
    expect(fs.existsSync(TEST_DB_PATH)).toBe(true);
    await provider.close();
  });

  it('should create parent directory if needed', async () => {
    const deepPath = './test-data/deep/nested/test.db';
    if (fs.existsSync(deepPath)) fs.unlinkSync(deepPath);
    if (fs.existsSync('./test-data/deep/nested')) fs.rmdirSync('./test-data/deep/nested');
    if (fs.existsSync('./test-data/deep')) fs.rmdirSync('./test-data/deep');

    const deepProvider = new SqliteDbProvider(deepPath, MIGRATIONS_PATH);
    await deepProvider.connect();
    expect(fs.existsSync(deepPath)).toBe(true);
    await deepProvider.close();
    fs.unlinkSync(deepPath)
    fs.rmdirSync('./test-data/deep/nested', { recursive: true });
  });

  it('should enable WAL mode', async () => {
    const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
    await provider.connect();
    const result = await provider.query('PRAGMA journal_mode');
    expect(result[0].journal_mode).toBe('wal');
    await provider.close();
  });

  describe('migrate', () => {
    it('should create migrations table', async () => {
      const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
      await provider.connect();
      await provider.migrate();
      const result = await provider.query(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'`
      );
      expect(result.length).toBe(1);
      await provider.close();
    });

    it('should apply initial schema migration', async () => {
        const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
        await provider.connect();
        await provider.migrate();
        // Verify a table from the initial schema exists
        const result = await provider.query(`SELECT name FROM sqlite_master WHERE type='table' AND name='organizations'`);
        expect(result.length).toBe(1);
        await provider.close();
    });

    it('should insert default local organization and user', async () => {
        const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
        await provider.connect();
        await provider.migrate();
        const orgs = await provider.query('SELECT * FROM organizations WHERE slug = ?', ['local']);
        expect(orgs.length).toBe(1);
        expect(orgs[0].name).toBe('Local');
        const users = await provider.query('SELECT * FROM users WHERE email = ?', ['admin@local.host']);
        expect(users.length).toBe(1);
        expect(users[0].organizationId).toBe(orgs[0].id);
        await provider.close();
    });

    it('should not re-apply migrations on second run', async () => {
        const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
        await provider.connect();
        await provider.migrate(); // First run
        const initialMigrations = await provider.query('SELECT id FROM migrations');
        await provider.migrate(); // Second run
        const secondMigrations = await provider.query('SELECT id FROM migrations');
        expect(secondMigrations.length).toBe(initialMigrations.length);
        await provider.close();
    });
  });

  describe('query', () => {
    let provider: SqliteDbProvider;

    beforeEach(async () => {
      provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
      await provider.connect();
      await provider.migrate();
    });

    afterEach(async () => {
      await provider.close();
    });

    it('should execute SELECT queries', async () => {
      const result = await provider.query('SELECT * FROM organizations');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should support parameterized queries', async () => {
        const orgs = await provider.query('SELECT * FROM organizations WHERE slug = ?', ['local']);
        expect(orgs.length).toBe(1);
        expect(orgs[0].name).toBe('Local');
    });

    it('should return empty array for no results', async () => {
        const result = await provider.query('SELECT * FROM organizations WHERE id = ?', [999]);
        expect(result).toEqual([]);
    });
  });

  describe('transaction', () => {
    let provider: SqliteDbProvider;

    beforeEach(async () => {
        provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
        await provider.connect();
        await provider.migrate();
    });

    afterEach(async () => {
        await provider.close();
    });

    it('should commit transaction on success', async () => {
        await provider.transaction(async (trx) => {
            await trx.query(`INSERT INTO organizations (id, name, slug, settings) VALUES (?, ?, ?, ?)`,
                [2, 'Test Inc', 'test-inc', '{}']);
        });
        const result = await provider.query('SELECT * FROM organizations WHERE id = 2');
        expect(result.length).toBe(1);
    });

    it('should rollback transaction on error', async () => {
        await expect(provider.transaction(async (trx) => {
            await trx.query(`INSERT INTO organizations (id, name, slug, settings) VALUES (?, ?, ?, ?)`,
                [1, 'Duplicate', 'local', '{}']);
        })).rejects.toThrow();

        const result = await provider.query('SELECT * FROM organizations WHERE name = ?', ['Duplicate']);
        expect(result.length).toBe(0);
    });
  });

  describe('healthCheck', () => {
      it('should return false if not connected', async () => {
        const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
        const health = await provider.healthCheck();
        expect(health.healthy).toBe(false);
        expect(health.message).toBe('Database not connected');
      });

      it('should return true if connected', async () => {
        const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
        await provider.connect();
        const health = await provider.healthCheck();
        expect(health.healthy).toBe(true);
        await provider.close();
      });
  });

  describe('close', () => {
      it('should close database connection', async () => {
        const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
        await provider.connect();
        expect(provider.db).toBeDefined();
        await provider.close();
        expect(provider.db).toBeUndefined();
      });

      it('should be safe to call multiple times', async () => {
        const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
        await provider.connect();
        await provider.close();
        await expect(provider.close()).resolves.not.toThrow();
      });
  })

  describe('backup', () => {
    it('should create backup file', async () => {
      const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
      await provider.connect();
      const backupPath = await provider.backup();
      expect(fs.existsSync(backupPath)).toBe(true);
      fs.unlinkSync(backupPath);
      await provider.close();
    });

    it('should create backup directory if needed', async () => {
        const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
        await provider.connect();
        const backupPath = await provider.backup('./test-data/backups/new_dir');
        expect(fs.existsSync(backupPath)).toBe(true);
        fs.unlinkSync(backupPath);
        fs.rmdirSync('./test-data/backups/new_dir');
        fs.rmdirSync('./test-data/backups');
        await provider.close();
    });
  });

  describe('restore', () => {
    it('should restore database from backup', async () => {
        const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
        await provider.connect();
        await provider.query(`INSERT INTO organizations (id, name, slug, settings) VALUES (2, 'Before Restore', 'br', '{}')`);
        const backupPath = await provider.backup();
        await provider.query('DELETE FROM organizations WHERE id = 2');
        
        const restoreSuccess = await provider.restore(backupPath);
        expect(restoreSuccess).toBe(true);

        const result = await provider.query('SELECT * FROM organizations WHERE id = 2');
        expect(result.length).toBe(1);
        expect(result[0].name).toBe('Before Restore');
        
        fs.unlinkSync(backupPath);
        await provider.close();
    });
  });

  describe('getStats', () => {
    it('should return database statistics', async () => {
        const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
        await provider.connect();
        const stats = await provider.getStats();
        expect(stats.fileSize).toBeGreaterThan(0);
        expect(stats.walSize).toBeGreaterThan(0);
        expect(stats.journalMode).toBe('wal');
        expect(stats.pageCount).toBeGreaterThan(0);
        await provider.close();
    });
  });

  describe('maintenance', () => {
    it('should run VACUUM and ANALYZE', async () => {
        const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
        await provider.connect();
        // Spy on the query method to check if the commands are executed
        const querySpy = vi.spyOn(provider, 'query');
        await provider.maintenance();
        expect(querySpy).toHaveBeenCalledWith('VACUUM');
        expect(querySpy).toHaveBeenCalledWith('ANALYZE');
        await provider.close();
    });
  });
});

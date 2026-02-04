import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { SqliteDbProvider } from '../../../server/providers/db/sqlite';

const TEST_DB_PATH = './test-data/test.db';
const MIGRATIONS_PATH = './tests/migrations';

describe('SqliteDbProvider', () => {
  beforeEach(() => {
    // Ensure the test directories are clean before each test
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    if (!fs.existsSync(MIGRATIONS_PATH)) {
        fs.mkdirSync(MIGRATIONS_PATH, { recursive: true });
    }
    // Create a dummy migration file
    fs.writeFileSync(path.join(MIGRATIONS_PATH, '0001_initial.sql'), 
      `CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT); INSERT INTO USERS (id, name) VALUES (1, 'local-admin');`
    );
  });

  afterEach(() => {
    // Clean up created files
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    fs.unlinkSync(path.join(MIGRATIONS_PATH, '0001_initial.sql'));
    // fs.rmdirSync(MIGRATIONS_PATH);
  });

  it('should create database file and parent directory if they do not exist', async () => {
    const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
    await provider.connect();
    expect(fs.existsSync(TEST_DB_PATH)).toBe(true);
    await provider.close();
  });

  it('should apply migrations correctly', async () => {
    const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
    await provider.connect();
    await provider.migrate();
    const { rows } = await provider.query('SELECT * FROM users');
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe('local-admin');
    await provider.close();
  });

  it('should not re-apply existing migrations', async () => {
    const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
    await provider.connect();
    await provider.migrate(); // First migration
    const { rows: firstRun } = await provider.query('SELECT * FROM _migrations');
    expect(firstRun.length).toBe(1);

    await provider.migrate(); // Second migration
    const { rows: secondRun } = await provider.query('SELECT * FROM _migrations');
    expect(secondRun.length).toBe(1);
    await provider.close();
  });

  it('should execute SELECT queries', async () => {
    const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
    await provider.connect();
    await provider.migrate();
    const { rows } = await provider.query('SELECT name FROM users WHERE id = ?', [1]);
    expect(rows[0].name).toBe('local-admin');
    await provider.close();
  });

  it('should handle transactions correctly', async () => {
    const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
    await provider.connect();
    await provider.migrate();

    await provider.transaction(async (txProvider) => {
      await txProvider.query("INSERT INTO users (name) VALUES ('test-user')");
    });

    const { rows } = await provider.query('SELECT * FROM users');
    expect(rows.length).toBe(2);
    await provider.close();
  });

  it('should rollback transactions on error', async () => {
    const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
    await provider.connect();
    await provider.migrate();

    await expect(provider.transaction(async (txProvider) => {
      await txProvider.query("INSERT INTO users (name) VALUES ('test-user')");
      throw new Error('Rollback!');
    })).rejects.toThrow('Rollback!');

    const { rows } = await provider.query('SELECT * FROM users');
    expect(rows.length).toBe(1);
    await provider.close();
  });

  it('should return a healthy health check', async () => {
    const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
    await provider.connect();
    const health = await provider.healthCheck();
    expect(health.healthy).toBe(true);
    await provider.close();
  });

  it('should return an unhealthy health check if not connected', async () => {
    const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
    const health = await provider.healthCheck();
    expect(health.healthy).toBe(false);
  });

  it('should close the database connection', async () => {
      const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
      await provider.connect();
      await provider.close();
      await expect(provider.query('SELECT 1')).rejects.toThrow('Database not connected.');
  });

  it('should backup the database', async () => {
      const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
      await provider.connect();
      await provider.migrate();
      const backupPath = './test-data/backup.db';
      await provider.backup(backupPath);
      expect(fs.existsSync(backupPath)).toBe(true);
      fs.unlinkSync(backupPath);
      await provider.close();
  });

  it('should return database statistics', async () => {
      const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
      await provider.connect();
      await provider.migrate();
      const stats = await provider.getStats();
      expect(stats.fileSize).toBeGreaterThan(0);
      expect(stats.journalMode).toBe('wal');
      await provider.close();
  });

  it('should run maintenance tasks', async () => {
      const provider = new SqliteDbProvider(TEST_DB_PATH, MIGRATIONS_PATH);
      await provider.connect();
      const querySpy = vi.spyOn(provider, 'query');
      await provider.maintenance();
      expect(querySpy).toHaveBeenCalledWith('VACUUM;');
      expect(querySpy).toHaveBeenCalledWith('ANALYZE;');
      await provider.close();
  });
});

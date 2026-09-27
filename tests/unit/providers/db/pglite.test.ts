import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PgliteDbProvider } from '../../../../server/providers/db/pglite';

const TEST_DATA_DIR = path.resolve(`./.pgdata-unit-test-${Date.now()}`);
const BACKUP_DIR = path.resolve(`./.pgdata-backup-test-${Date.now()}`);

describe('PgliteDbProvider', () => {
  let provider: PgliteDbProvider;

  beforeEach(async () => {
    provider = new PgliteDbProvider(TEST_DATA_DIR);
  });

  afterEach(async () => {
    try {
      await provider.close();
    } catch {
      // ignore if already closed
    }
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
    if (fs.existsSync(BACKUP_DIR)) {
      fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
    }
  });

  it('should connect and create data directory', async () => {
    const conn = await provider.connect();
    expect(conn).toBeDefined();
    expect(fs.existsSync(TEST_DATA_DIR)).toBe(true);
    expect(await provider.healthCheck()).toBe(true);
  }, 60000);

  it('should execute queries successfully', async () => {
    await provider.connect();
    await provider.query('CREATE TABLE IF NOT EXISTS test_items (id SERIAL PRIMARY KEY, name TEXT);');
    await provider.query("INSERT INTO test_items (name) VALUES ('item1'), ('item2');");
    
    const rows = await provider.query<{ id: number; name: string }>('SELECT * FROM test_items ORDER BY id ASC;');
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe('item1');
    expect(rows[1].name).toBe('item2');
  });

  it('should support transactions', async () => {
    await provider.connect();
    await provider.query('CREATE TABLE IF NOT EXISTS test_tx (id SERIAL PRIMARY KEY, val TEXT);');

    await provider.transaction(async (tx) => {
      await tx.query("INSERT INTO test_tx (val) VALUES ('tx-val');");
    });

    const rows = await provider.query('SELECT * FROM test_tx;');
    expect(rows).toHaveLength(1);
  });

  it('should rollback transaction on error', async () => {
    await provider.connect();
    await provider.query('CREATE TABLE IF NOT EXISTS test_rollback (id SERIAL PRIMARY KEY, val TEXT);');

    await expect(
      provider.transaction(async (tx) => {
        await tx.query("INSERT INTO test_rollback (val) VALUES ('should-rollback');");
        throw new Error('Forced rollback');
      })
    ).rejects.toThrow('Forced rollback');

    const rows = await provider.query('SELECT * FROM test_rollback;');
    expect(rows).toHaveLength(0);
  });

  it('should report health check correctly', async () => {
    expect(await provider.healthCheck()).toBe(false);
    await provider.connect();
    expect(await provider.healthCheck()).toBe(true);
    await provider.close();
    expect(await provider.healthCheck()).toBe(false);
  });

  it('should report database stats', async () => {
    await provider.connect();
    const stats = await provider.getStats();
    expect(stats.path).toBe(TEST_DATA_DIR);
    expect(stats.connections).toBe(1);
    expect(typeof stats.size).toBe('number');
  });

  it('should run maintenance tasks without error', async () => {
    await provider.connect();
    await expect(provider.maintenance()).resolves.toBeUndefined();
  });

  it('should backup database to destination', async () => {
    await provider.connect();
    const result = await provider.backup(BACKUP_DIR);
    expect(result).toBe(BACKUP_DIR);
    expect(fs.existsSync(BACKUP_DIR)).toBe(true);
  });
});

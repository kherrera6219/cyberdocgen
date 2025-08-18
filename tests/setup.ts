import { describe, it, expect, beforeAll, afterAll } from 'vitest';

let pool: any;

// Test environment setup
beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set; skipping database setup');
    return;
  }

  const dbModule = await import('../server/db');
  pool = dbModule.pool;

  // Ensure test database is clean
  try {
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    console.log('Test database reset successfully');
  } catch (error) {
    console.error('Database reset failed:', error);
    throw error;
  }
});

afterAll(async () => {
  if (pool) {
    await pool.end();
  }
});

export { describe, it, expect };
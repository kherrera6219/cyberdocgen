import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { pool } from '../server/db';

// Test environment setup
beforeAll(async () => {
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
  await pool.end();
});

export { describe, it, expect };
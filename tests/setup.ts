import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { Pool } from '@neondatabase/serverless';

let pool: Pool | null = null;

// Basic environment defaults for tests
process.env.REPLIT_DOMAINS = process.env.REPLIT_DOMAINS || 'example.com';
process.env.REPL_ID = process.env.REPL_ID || 'test-repl';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || '0123456789abcdef0123456789abcdef';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-openai-key';
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test-anthropic-key';

// Test environment setup
beforeAll(async () => {
  if (process.env.DATABASE_URL) {
    try {
      const dbModule = await import('../server/db');
      pool = dbModule.pool;
      await pool!.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
      console.log('Test database reset successfully');
    } catch (error) {
      console.error('Database reset failed:', error);
      throw error;
    }
  } else {
    console.warn('DATABASE_URL not set; skipping database reset');
  }
});

afterAll(async () => {
  if (pool) {
    await pool.end();
  }
});

export { describe, it, expect, beforeEach, beforeAll, afterAll };
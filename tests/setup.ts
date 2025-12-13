import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Set up required environment variables for tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.SESSION_SECRET = 'test-secret-key-for-testing-purposes-only-minimum-32-chars';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.REPLIT_DOMAINS = 'test.replit.dev';
process.env.REPL_ID = 'test-repl-id';
process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID = 'test-bucket-id';

// Export all vitest functions
export { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi };
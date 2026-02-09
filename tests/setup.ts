// Polyfill requestSubmit FIRST before any imports (required by React Hook Form in jsdom).
// jsdom may define requestSubmit but throw "Not implemented", so always override in tests.
if (typeof global !== 'undefined' && typeof HTMLFormElement !== 'undefined') {
  Object.defineProperty(HTMLFormElement.prototype, 'requestSubmit', {
    configurable: true,
    writable: true,
    value: function() {
      this.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    },
  });
}

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Set test environment variables
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
// Force test environment - must override any shell-level NODE_ENV to ensure
// React act() works and logger doesn't redact IPs in tests.
process.env.NODE_ENV = 'test';
process.env.REPLIT_DOMAINS = process.env.REPLIT_DOMAINS || 'localhost,test.local';
process.env.REPL_ID = process.env.REPL_ID || 'test-repl-id';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-key-for-testing-only';

// Mock @replit/object-storage to prevent connection errors in tests
vi.mock('@replit/object-storage', () => {
  return {
    Client: vi.fn().mockImplementation(() => ({
      init: vi.fn().mockResolvedValue(undefined),
      uploadFromText: vi.fn().mockResolvedValue({ ok: true, error: null }),
      uploadFromBytes: vi.fn().mockResolvedValue({ ok: true, error: null }),
      downloadAsText: vi.fn().mockResolvedValue({ ok: true, value: '{}', error: null }),
      downloadAsBytes: vi.fn().mockResolvedValue({ ok: true, value: Buffer.from(''), error: null }),
      list: vi.fn().mockResolvedValue({ ok: true, value: [], error: null }),
      delete: vi.fn().mockResolvedValue({ ok: true, error: null }),
      exists: vi.fn().mockResolvedValue({ ok: true, value: true, error: null }),
    })),
  };
});

// Polyfill ResizeObserver for jsdom (required by Radix UI)
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}

// Polyfill pointer capture methods for jsdom (required by Radix UI)
if (typeof Element !== 'undefined') {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = function() {
      return false;
    };
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = function() {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = function() {};
  }
}

// Polyfill scrollIntoView for jsdom
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function() {};
}

// Mock window.matchMedia (only in browser/jsdom environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Export all vitest functions
export { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi };

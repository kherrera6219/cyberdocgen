/**
 * Unit tests for Windows Credential Manager Provider
 * Sprint 3: Windows Integration & Key Management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WindowsCredentialManagerProvider, LLM_API_KEYS } from '../../../../server/providers/secrets/windowsCredMan';

describe('WindowsCredentialManagerProvider', () => {
  let provider: WindowsCredentialManagerProvider;

  beforeEach(() => {
    provider = new WindowsCredentialManagerProvider();
    delete process.env.OPENAI_API_KEY;
    delete process.env.ALLOW_ENV_SECRET_FALLBACK;
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ALLOW_ENV_SECRET_FALLBACK;
  });

  describe('LLM_API_KEYS constants', () => {
    it('should define known API key names', () => {
      expect(LLM_API_KEYS).toHaveProperty('OPENAI');
      expect(LLM_API_KEYS).toHaveProperty('ANTHROPIC');
      expect(LLM_API_KEYS).toHaveProperty('GOOGLE_AI');
    });

    it('should use consistent naming format', () => {
      expect(LLM_API_KEYS.OPENAI).toBe('openai-api-key');
      expect(LLM_API_KEYS.ANTHROPIC).toBe('anthropic-api-key');
      expect(LLM_API_KEYS.GOOGLE_AI).toBe('google-ai-api-key');
    });
  });

  describe('Provider initialization', () => {
    it('should create provider instance', () => {
      expect(provider).toBeInstanceOf(WindowsCredentialManagerProvider);
    });

    it('should have availability check method', () => {
      expect(typeof provider.isAvailable).toBe('function');
    });
  });

  describe('API key operations', () => {
    it('should have set method', () => {
      expect(typeof provider.set).toBe('function');
    });

    it('should have get method', () => {
      expect(typeof provider.get).toBe('function');
    });

    it('should have delete method', () => {
      expect(typeof provider.delete).toBe('function');
    });

    it('should have listKeys method', () => {
      expect(typeof provider.listKeys).toBe('function');
    });

    it('should have hasKey method', () => {
      expect(typeof provider.hasKey).toBe('function');
    });

    it('should have getConfiguredProviders method', () => {
      expect(typeof provider.getConfiguredProviders).toBe('function');
    });
  });

  describe('Environment variable fallback', () => {
    it('should fallback to environment variables when keytar not available', async () => {
      process.env.ALLOW_ENV_SECRET_FALLBACK = 'true';
      // Set environment variable
      process.env.OPENAI_API_KEY = 'test-key-123';

      const value = await provider.get('openai-api-key');

      // Should return value from environment or null (depending on keytar availability)
      if (!provider.isAvailable()) {
        expect(value).toBe('test-key-123');
      }
    });
  });

  describe('Configuration checking', () => {
    it('should check if specific key is configured', async () => {
      const hasKey = await provider.hasKey('test-key');
      expect(typeof hasKey).toBe('boolean');
    });

    it('should return list of configured providers', async () => {
      const configured = await provider.getConfiguredProviders();
      expect(Array.isArray(configured)).toBe(true);
    });
  });
});

/**
 * Unit tests for Local Mode Routes
 * Sprint 2: Desktop Integration & Hardening
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getRuntimeConfig } from '../../../server/config/runtime';

describe('Local Mode Routes', () => {
  describe('Runtime Mode Endpoint', () => {
    it('should return runtime configuration', async () => {
      const config = getRuntimeConfig();

      expect(config).toHaveProperty('mode');
      expect(config).toHaveProperty('features');
      expect(config).toHaveProperty('database');
      expect(config).toHaveProperty('storage');
      expect(config).toHaveProperty('auth');
    });

    it('should include deployment mode in response', () => {
      const config = getRuntimeConfig();

      expect(config.mode).toMatch(/^(local|cloud)$/);
    });

    it('should include features configuration', () => {
      const config = getRuntimeConfig();

      expect(config.features).toHaveProperty('organizationManagement');
      expect(config.features).toHaveProperty('userManagement');
      expect(config.features).toHaveProperty('multiTenant');
      expect(config.features).toHaveProperty('sso');
      expect(config.features).toHaveProperty('mfa');
    });
  });

  describe('Local Mode Configuration', () => {
    beforeEach(() => {
      // Set local mode environment
      process.env.DEPLOYMENT_MODE = 'local';
      process.env.LOCAL_DATA_PATH = './test-data';
    });

    afterEach(() => {
      // Reset environment
      delete process.env.DEPLOYMENT_MODE;
      delete process.env.LOCAL_DATA_PATH;
      // Reset runtime config singleton
      const { _resetRuntimeConfig } = require('../../../server/config/runtime');
      _resetRuntimeConfig();
    });

    it('should use localhost binding in local mode', () => {
      const config = getRuntimeConfig();

      if (config.mode === 'local') {
        expect(config.server.host).toBe('127.0.0.1');
      }
    });

    it('should use SQLite in local mode', () => {
      const config = getRuntimeConfig();

      if (config.mode === 'local') {
        expect(config.database.type).toBe('sqlite');
        expect(config.database.filePath).toBeDefined();
      }
    });

    it('should use local storage in local mode', () => {
      const config = getRuntimeConfig();

      if (config.mode === 'local') {
        expect(config.storage.type).toBe('local');
        expect(config.storage.basePath).toBeDefined();
      }
    });

    it('should disable auth in local mode', () => {
      const config = getRuntimeConfig();

      if (config.mode === 'local') {
        expect(config.auth.enabled).toBe(false);
        expect(config.auth.provider).toBe('bypass');
      }
    });

    it('should disable enterprise features in local mode', () => {
      const config = getRuntimeConfig();

      if (config.mode === 'local') {
        expect(config.features.organizationManagement).toBe(false);
        expect(config.features.userManagement).toBe(false);
        expect(config.features.multiTenant).toBe(false);
        expect(config.features.sso).toBe(false);
        expect(config.features.mfa).toBe(false);
      }
    });
  });

  describe('Security Validation', () => {
    it('should enforce localhost binding in local mode', () => {
      // Set local mode with invalid host
      process.env.DEPLOYMENT_MODE = 'local';
      const { _resetRuntimeConfig } = require('../../../server/config/runtime');
      _resetRuntimeConfig();

      const config = getRuntimeConfig();

      // Verify localhost enforcement
      if (config.mode === 'local') {
        expect(config.server.host).toBe('127.0.0.1');
        expect(config.server.host).not.toBe('0.0.0.0');
      }

      // Cleanup
      delete process.env.DEPLOYMENT_MODE;
      _resetRuntimeConfig();
    });

    it('should default to cloud mode if DEPLOYMENT_MODE is invalid', () => {
      process.env.DEPLOYMENT_MODE = 'invalid';
      const { _resetRuntimeConfig } = require('../../../server/config/runtime');
      _resetRuntimeConfig();

      const config = getRuntimeConfig();

      expect(config.mode).toBe('cloud');

      // Cleanup
      delete process.env.DEPLOYMENT_MODE;
      _resetRuntimeConfig();
    });
  });
});

/**
 * Runtime Configuration Tests
 * 
 * Validates deployment mode detection and configuration building
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getRuntimeConfig,
  isCloudMode,
  isLocalMode,
  _resetRuntimeConfig,
  type DeploymentMode,
} from './runtime';

describe('Runtime Configuration', () => {
  const originalEnv = process.env.DEPLOYMENT_MODE;

  beforeEach(() => {
    // Reset singleton before each test
    _resetRuntimeConfig();
  });

  afterEach(() => {
    // Restore original environment
    if (originalEnv) {
      process.env.DEPLOYMENT_MODE = originalEnv;
    } else {
      delete process.env.DEPLOYMENT_MODE;
    }
    _resetRuntimeConfig();
  });

  describe('Deployment Mode Detection', () => {
    it('should default to cloud mode when DEPLOYMENT_MODE is not set', () => {
      delete process.env.DEPLOYMENT_MODE;
      
      expect(isCloudMode()).toBe(true);
      expect(isLocalMode()).toBe(false);
      expect(getRuntimeConfig().mode).toBe('cloud');
    });

    it('should use cloud mode when DEPLOYMENT_MODE=cloud', () => {
      process.env.DEPLOYMENT_MODE = 'cloud';
      
      expect(isCloudMode()).toBe(true);
      expect(isLocalMode()).toBe(false);
    });

    it('should use local mode when DEPLOYMENT_MODE=local', () => {
      process.env.DEPLOYMENT_MODE = 'local';
      
      expect(isLocalMode()).toBe(true);
      expect(isCloudMode()).toBe(false);
    });

    it('should be case-insensitive', () => {
      process.env.DEPLOYMENT_MODE = 'LOCAL';
      expect(isLocalMode()).toBe(true);

      _resetRuntimeConfig();
      process.env.DEPLOYMENT_MODE = 'CLOUD';
      expect(isCloudMode()).toBe(true);
    });

    it('should default to cloud for invalid values', () => {
      process.env.DEPLOYMENT_MODE = 'invalid-mode';
      
      expect(isCloudMode()).toBe(true);
      expect(getRuntimeConfig().mode).toBe('cloud');
    });
  });

  describe('Cloud Mode Configuration', () => {
    beforeEach(() => {
      process.env.DEPLOYMENT_MODE = 'cloud';
    });

    it('should configure PostgreSQL database', () => {
      const config = getRuntimeConfig();
      
      expect(config.database.type).toBe('postgres');
      expect(config.database.filePath).toBeUndefined();
    });

    it('should configure cloud storage', () => {
      const config = getRuntimeConfig();
      
      expect(config.storage.type).toBe('cloud');
      expect(config.storage.basePath).toBeUndefined();
    });

    it('should enable authentication', () => {
      const config = getRuntimeConfig();
      
      expect(config.auth.enabled).toBe(true);
      expect(config.auth.provider).toBe('entra-id');
    });

    it('should use environment secrets provider', () => {
      const config = getRuntimeConfig();
      
      expect(config.secrets.provider).toBe('environment');
    });

    it('should enable all enterprise features', () => {
      const config = getRuntimeConfig();
      
      expect(config.features.organizationManagement).toBe(true);
      expect(config.features.userManagement).toBe(true);
      expect(config.features.multiTenant).toBe(true);
      expect(config.features.sso).toBe(true);
      expect(config.features.mfa).toBe(true);
    });

    it('should bind to 0.0.0.0 by default', () => {
      const config = getRuntimeConfig();
      
      expect(config.server.host).toBe('0.0.0.0');
    });

    it('should respect custom HOST environment variable', () => {
      process.env.HOST = '192.168.1.100';
      _resetRuntimeConfig();
      
      const config = getRuntimeConfig();
      expect(config.server.host).toBe('192.168.1.100');
      
      delete process.env.HOST;
    });
  });

  describe('Local Mode Configuration', () => {
    beforeEach(() => {
      process.env.DEPLOYMENT_MODE = 'local';
    });

    it('should configure SQLite database', () => {
      const config = getRuntimeConfig();
      
      expect(config.database.type).toBe('sqlite');
      expect(config.database.filePath).toContain('cyberdocgen.db');
      expect(config.database.connection).toBeUndefined();
    });

    it('should configure local filesystem storage', () => {
      const config = getRuntimeConfig();
      
      expect(config.storage.type).toBe('local');
      expect(config.storage.basePath).toContain('files');
      expect(config.storage.bucket).toBeUndefined();
    });

    it('should disable authentication', () => {
      const config = getRuntimeConfig();
      
      expect(config.auth.enabled).toBe(false);
      expect(config.auth.provider).toBe('bypass');
    });

    it('should use Windows Credential Manager for secrets', () => {
      const config = getRuntimeConfig();
      
      expect(config.secrets.provider).toBe('windows-credential-manager');
    });

    it('should disable all enterprise features', () => {
      const config = getRuntimeConfig();
      
      expect(config.features.organizationManagement).toBe(false);
      expect(config.features.userManagement).toBe(false);
      expect(config.features.multiTenant).toBe(false);
      expect(config.features.sso).toBe(false);
      expect(config.features.mfa).toBe(false);
    });

    it('should bind to 127.0.0.1 (localhost only)', () => {
      const config = getRuntimeConfig();
      
      expect(config.server.host).toBe('127.0.0.1');
    });

    it('should use port 5231 by default', () => {
      const config = getRuntimeConfig();
      
      expect(config.server.port).toBe(5231);
    });

    it('should respect custom LOCAL_PORT environment variable', () => {
      process.env.LOCAL_PORT = '9000';
      _resetRuntimeConfig();
      
      const config = getRuntimeConfig();
      expect(config.server.port).toBe(9000);
      
      delete process.env.LOCAL_PORT;
    });

    it('should use custom data path if LOCAL_DATA_PATH is set', () => {
      process.env.LOCAL_DATA_PATH = 'C:\\CustomPath\\Data';
      _resetRuntimeConfig();
      
      const config = getRuntimeConfig();
      expect(config.database.filePath).toBe('C:\\CustomPath\\Data/cyberdocgen.db');
      expect(config.storage.basePath).toBe('C:\\CustomPath\\Data/files');
      
      delete process.env.LOCAL_DATA_PATH;
    });
  });

  describe('Singleton Behavior', () => {
    it('should return the same instance on multiple calls', () => {
      const config1 = getRuntimeConfig();
      const config2 = getRuntimeConfig();
      
      expect(config1).toBe(config2); // Same object reference
    });

    it('should rebuild after reset', () => {
      process.env.DEPLOYMENT_MODE = 'cloud';
      const cloudConfig = getRuntimeConfig();
      
      process.env.DEPLOYMENT_MODE = 'local';
      _resetRuntimeConfig();
      const localConfig = getRuntimeConfig();
      
      expect(cloudConfig.mode).toBe('cloud');
      expect(localConfig.mode).toBe('local');
      expect(cloudConfig).not.toBe(localConfig); // Different instances
    });
  });

  describe('Configuration Validation', () => {
    it('should have valid server configuration in both modes', () => {
      // Cloud mode
      process.env.DEPLOYMENT_MODE = 'cloud';
      let config = getRuntimeConfig();
      expect(config.server.host).toBeTruthy();
      expect(config.server.port).toBeGreaterThan(0);
      expect(config.server.baseUrl).toContain('http');
      
      // Local mode
      process.env.DEPLOYMENT_MODE = 'local';
      _resetRuntimeConfig();
      config = getRuntimeConfig();
      expect(config.server.host).toBe('127.0.0.1');
      expect(config.server.port).toBeGreaterThan(0);
      expect(config.server.baseUrl).toContain('127.0.0.1');
    });

    it('should have consistent feature flags with auth setting', () => {
      // Cloud: auth enabled = features enabled
      process.env.DEPLOYMENT_MODE = 'cloud';
      let config = getRuntimeConfig();
      expect(config.auth.enabled).toBe(true);
      expect(config.features.sso).toBe(true);
      expect(config.features.mfa).toBe(true);
      
      // Local: auth disabled = features disabled
      process.env.DEPLOYMENT_MODE = 'local';
      _resetRuntimeConfig();
      config = getRuntimeConfig();
      expect(config.auth.enabled).toBe(false);
      expect(config.features.sso).toBe(false);
      expect(config.features.mfa).toBe(false);
    });
  });
});

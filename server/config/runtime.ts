/**
 * Runtime Configuration Module
 * 
 * Centralized configuration for dual-mode deployment:
 * - CLOUD mode: Multi-tenant web app (PostgreSQL, cloud storage, SSO)
 * - LOCAL mode: Windows 11 desktop app (SQLite, local filesystem, no login)
 * 
 * This is the ONLY module that should directly read DEPLOYMENT_MODE.
 * All feature code should use the exported functions instead.
 */

export type DeploymentMode = 'cloud' | 'local';

export interface RuntimeConfig {
  mode: DeploymentMode;
  server: {
    host: string;
    port: number;
    baseUrl: string;
  };
  database: {
    type: 'postgres' | 'sqlite';
    connection?: string; // Postgres connection string
    filePath?: string;   // SQLite file path
  };
  storage: {
    type: 'cloud' | 'local';
    bucket?: string;     // Cloud storage bucket
    basePath?: string;   // Local filesystem path
  };
  auth: {
    enabled: boolean;
    provider: 'entra-id' | 'bypass';
  };
  secrets: {
    provider: 'environment' | 'windows-credential-manager';
  };
  features: {
    organizationManagement: boolean;
    userManagement: boolean;
    multiTenant: boolean;
    sso: boolean;
    mfa: boolean;
  };
}

/**
 * Get deployment mode from environment variable
 * Defaults to 'cloud' if not specified or invalid
 */
function getDeploymentMode(): DeploymentMode {
  const mode = process.env.DEPLOYMENT_MODE?.toLowerCase();
  
  if (mode === 'local' || mode === 'cloud') {
    return mode;
  }
  
  // Default to cloud mode for safety
  console.warn(
    `Invalid DEPLOYMENT_MODE: "${process.env.DEPLOYMENT_MODE}". ` +
    `Expected "cloud" or "local". Defaulting to "cloud".`
  );
  return 'cloud';
}

/**
 * Build runtime configuration based on deployment mode
 */
function buildRuntimeConfig(): RuntimeConfig {
  const mode = getDeploymentMode();
  
  if (mode === 'local') {
    return buildLocalModeConfig();
  }
  
  return buildCloudModeConfig();
}

/**
 * Cloud mode configuration (existing behavior)
 */
function buildCloudModeConfig(): RuntimeConfig {
  return {
    mode: 'cloud',
    server: {
      host: process.env.HOST || '0.0.0.0',
      port: parseInt(process.env.PORT || '5000', 10),
      baseUrl: process.env.BASE_URL || 'http://localhost:5000',
    },
    database: {
      type: 'postgres',
      connection: process.env.DATABASE_URL,
    },
    storage: {
      type: 'cloud',
      bucket: process.env.STORAGE_BUCKET,
    },
    auth: {
      enabled: true,
      provider: 'entra-id',
    },
    secrets: {
      provider: 'environment',
    },
    features: {
      organizationManagement: true,
      userManagement: true,
      multiTenant: true,
      sso: true,
      mfa: true,
    },
  };
}

/**
 * Local mode configuration (Windows 11 desktop app)
 */
function buildLocalModeConfig(): RuntimeConfig {
  // In Electron context, get userData path
  // For now, use a placeholder that will be replaced during Electron integration
  const userDataPath = process.env.LOCAL_DATA_PATH || './local-data';
  
  // Allow env overrides for host/port even in local mode
  const host = process.env.HOST || '127.0.0.1';
  const port = parseInt(process.env.PORT || process.env.LOCAL_PORT || '5231', 10);

  return {
    mode: 'local',
    server: {
      host,
      port,
      baseUrl: `http://${host}:${port}`,
    },
    database: {
      type: 'sqlite',
      filePath: `${userDataPath}/cyberdocgen.db`,
    },
    storage: {
      type: 'local',
      basePath: `${userDataPath}/files`,
    },
    auth: {
      enabled: false, // No login in local mode
      provider: 'bypass',
    },
    secrets: {
      provider: 'windows-credential-manager',
    },
    features: {
      // Disable enterprise features in local mode
      organizationManagement: false,
      userManagement: false,
      multiTenant: false,
      sso: false,
      mfa: false,
    },
  };
}

// Singleton instance
let _runtimeConfig: RuntimeConfig | null = null;

/**
 * Get runtime configuration (singleton)
 * This is the primary export that all application code should use
 */
export function getRuntimeConfig(): RuntimeConfig {
  if (!_runtimeConfig) {
    _runtimeConfig = buildRuntimeConfig();
  }
  return _runtimeConfig;
}

/**
 * Convenience: Check if running in cloud mode
 */
export function isCloudMode(): boolean {
  return getRuntimeConfig().mode === 'cloud';
}

/**
 * Convenience: Check if running in local mode
 */
export function isLocalMode(): boolean {
  return getRuntimeConfig().mode === 'local';
}

/**
 * Reset configuration (useful for testing)
 * @internal
 */
export function _resetRuntimeConfig(): void {
  _runtimeConfig = null;
}

/**
 * Log runtime configuration on startup (redact sensitive values)
 */
export function logRuntimeConfig(): void {
  const config = getRuntimeConfig();
  
  console.log('='.repeat(60));
  console.log('CyberDocGen Runtime Configuration');
  console.log('='.repeat(60));
  console.log(`Deployment Mode: ${config.mode.toUpperCase()}`);
  console.log(`Server: ${config.server.host}:${config.server.port}`);
  console.log(`Database: ${config.database.type}`);
  console.log(`Storage: ${config.storage.type}`);
  console.log(`Auth: ${config.auth.enabled ? config.auth.provider : 'disabled'}`);
  console.log(`Features: ${JSON.stringify(config.features, null, 2)}`);
  console.log('='.repeat(60));
}

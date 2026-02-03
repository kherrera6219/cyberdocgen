/**
 * Provider Factory
 * 
 * Creates the appropriate provider implementations based on deployment mode.
 * This is the ONLY module that should instantiate providers directly.
 */

import { getRuntimeConfig, isLocalMode } from '../config/runtime';
import type { Providers } from './interfaces';
import { logger } from '../utils/logger';

/**
 * Create all providers based on current deployment mode
 */
export async function createProviders(): Promise<Providers> {
  const config = getRuntimeConfig();
  
  logger.debug(`Creating providers for ${config.mode} mode...`);
  
  const providers: Providers = {
    db: await createDbProvider(),
    storage: await createStorageProvider(),
    secrets: await createSecretsProvider(),
    auth: await createAuthProvider(),
  };
  
  logger.debug('All providers created successfully');
  
  return providers;
}

/**
 * Create database provider
 */
async function createDbProvider() {
  const config = getRuntimeConfig();
  
  if (config.database.type === 'sqlite') {
    const { SqliteDbProvider } = await import('./db/sqlite');
    return new SqliteDbProvider(config.database.filePath!);
  }
  
  const { PostgresDbProvider } = await import('./db/postgres');
  return new PostgresDbProvider(config.database.connection!);
}

/**
 * Create storage provider
 */
async function createStorageProvider() {
  const config = getRuntimeConfig();
  
  if (config.storage.type === 'local') {
    const { LocalFsStorageProvider } = await import('./storage/localFs');
    return new LocalFsStorageProvider(config.storage.basePath!);
  }
  
  // Default: Cloud storage
  const { CloudStorageProvider } = await import('./storage/cloud');
  return new CloudStorageProvider(config.storage.bucket!);
}

/**
 * Create secrets provider
 */
async function createSecretsProvider() {
  const config = getRuntimeConfig();
  
  if (config.secrets.provider === 'windows-credential-manager') {
    const { WindowsCredentialManagerProvider } = await import('./secrets/windowsCredMan');
    return new WindowsCredentialManagerProvider();
  }
  
  // Default: Environment variables (cloud mode)
  const { EnvironmentSecretsProvider } = await import('./secrets/environment');
  return new EnvironmentSecretsProvider();
}

/**
 * Create auth provider
 */
async function createAuthProvider() {
  const config = getRuntimeConfig();
  
  if (config.auth.provider === 'bypass') {
    const { LocalAuthBypassProvider } = await import('./auth/localBypass');
    return new LocalAuthBypassProvider();
  }
  
  // Default: Entra ID (cloud mode)
  const { EntraIdAuthProvider } = await import('./auth/entraId');
  return new EntraIdAuthProvider();
}

// Singleton instance
let _providers: Providers | null = null;

/**
 * Get providers singleton
 * Initializes on first call
 */
export async function getProviders(): Promise<Providers> {
  if (!_providers) {
    _providers = await createProviders();
  }
  return _providers;
}

/**
 * Reset providers (useful for testing)
 * @internal
 */
export async function _resetProviders(): Promise<void> {
  if (_providers?.db) {
    await _providers.db.close();
  }
  _providers = null;
}

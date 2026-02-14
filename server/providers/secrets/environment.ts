/**
 * Environment Secrets Provider
 * 
 * Cloud mode secrets implementation using environment variables.
 * Read-only (cannot write secrets at runtime).
 */

import type { ISecretsProvider } from '../interfaces';
import { logger } from '../../utils/logger';

export class EnvironmentSecretsProvider implements ISecretsProvider {
  // Common secret key patterns to detect
  private static SECRET_PATTERNS = [
    'API_KEY',
    'SECRET',
    'TOKEN',
    'PASSWORD',
    'PRIVATE_KEY',
    'OPENAI',
    'ANTHROPIC',
    'GOOGLE_AI',
  ];
  
  async set(key: string, value: string): Promise<void> {
    logger.warn(
      `[EnvironmentSecretsProvider] Cannot set environment variables at runtime. ` +
      `Key "${key}" should be set via deployment configuration.`
    );
    
    // In a real scenario, this could update a secrets manager instead
    // throw new Error('Cannot modify environment secrets at runtime');
  }
  
  async get(key: string): Promise<string | null> {
    const envEntry = Object.entries(process.env).find(([envKey]) => envKey === key);
    const value = envEntry?.[1];
    
    if (!value) {
      logger.debug(`[EnvironmentSecretsProvider] Key "${key}" not found`);
      return null;
    }
    
    return value;
  }
  
  async delete(key: string): Promise<void> {
    logger.warn(
      `[EnvironmentSecretsProvider] Cannot delete environment variables at runtime. ` +
      `Key "${key}" should be removed via deployment configuration.`
    );
  }
  
  async listKeys(): Promise<string[]> {
    // Return environment variables that look like secrets
    // (for diagnostics, not exposing values)
    return Object.keys(process.env).filter(key =>
      EnvironmentSecretsProvider.SECRET_PATTERNS.some(pattern =>
        key.toUpperCase().includes(pattern)
      )
    );
  }
}

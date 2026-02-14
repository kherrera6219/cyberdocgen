/**
 * Windows Credential Manager Secrets Provider
 * Sprint 3: Windows Integration & Key Management
 *
 * Local mode secrets implementation using Windows Credential Manager.
 * Provides secure storage for LLM API keys using OS-level encryption.
 *
 * Security: Keys are stored in the Windows Credential Manager, which:
 * - Encrypts data using the user's Windows login credentials
 * - Is inaccessible to other users on the same machine
 * - Survives app reinstalls (tied to Windows user profile)
 * - Accessible via Control Panel → Credential Manager → Windows Credentials
 */

import type { ISecretsProvider } from '../interfaces';
import { logger } from '../../utils/logger';

// Service name for Windows Credential Manager
const SERVICE_NAME = 'CyberDocGen';

// Known LLM API key names
export const LLM_API_KEYS = {
  OPENAI: 'openai-api-key',
  ANTHROPIC: 'anthropic-api-key',
  GOOGLE_AI: 'google-ai-api-key',
} as const;

export class WindowsCredentialManagerProvider implements ISecretsProvider {
  private isKeytarAvailable: boolean = false;
  private keytar: any = null;
  private initPromise: Promise<void>;

  constructor() {
    // Lazy-load keytar to avoid issues when not on Windows or not installed
    this.initPromise = this.initKeytar();
  }

  private async initKeytar(): Promise<void> {
    try {
      // Dynamically import keytar (native module)
      this.keytar = await import('keytar');
      this.isKeytarAvailable = true;
      logger.debug('[WindowsCredentialManagerProvider] Initialized successfully');
    } catch (error) {
      logger.warn('[WindowsCredentialManagerProvider] keytar not available:', error);
      logger.warn('[WindowsCredentialManagerProvider] Falling back to environment variables');
      this.isKeytarAvailable = false;
    }
  }

  /**
   * Ensure keytar is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    await this.initPromise;
  }

  private allowEnvironmentFallback(): boolean {
    return process.env.ALLOW_ENV_SECRET_FALLBACK === 'true';
  }

  async set(key: string, value: string): Promise<void> {
    await this.ensureInitialized();

    if (!this.isKeytarAvailable) {
      logger.debug(`[WindowsCredentialManagerProvider] Keytar not available, cannot store key: ${key}`);
      throw new Error(
        'Windows Credential Manager not available. ' +
        'This may be due to running on a non-Windows platform or missing native dependencies.'
      );
    }

    try {
      await this.keytar.setPassword(SERVICE_NAME, key, value);
      logger.debug(`[WindowsCredentialManagerProvider] Stored key: ${key}`);
    } catch (error) {
      logger.error(`[WindowsCredentialManagerProvider] Failed to store key: ${key}`, error);
      throw new Error(`Failed to store secret in Windows Credential Manager: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async get(key: string): Promise<string | null> {
    await this.ensureInitialized();

    if (!this.isKeytarAvailable) {
      if (!this.allowEnvironmentFallback()) {
        logger.warn(
          '[WindowsCredentialManagerProvider] Keytar unavailable and environment fallback disabled; secret access denied'
        );
        return null;
      }
      // Fallback to environment variables for development/testing
      const envCandidates = [
        key.toUpperCase().replace(/-/g, '_'),
        key === LLM_API_KEYS.OPENAI ? 'OPENAI_API_KEY' : null,
        key === LLM_API_KEYS.ANTHROPIC ? 'ANTHROPIC_API_KEY' : null,
        key === LLM_API_KEYS.GOOGLE_AI ? 'GOOGLE_GENERATIVE_AI_KEY' : null,
        key === LLM_API_KEYS.GOOGLE_AI ? 'GEMINI_API_KEY' : null,
      ].filter((candidate): candidate is string => Boolean(candidate));

      for (const envKey of envCandidates) {
        const envEntry = Object.entries(process.env).find(([name]) => name === envKey);
        const value = envEntry?.[1];
        if (value) {
          logger.debug(`[WindowsCredentialManagerProvider] Retrieved key from environment: ${key}`);
          return value;
        }
      }

      return null;
    }

    try {
      const value = await this.keytar.getPassword(SERVICE_NAME, key);
      if (value) {
        logger.debug(`[WindowsCredentialManagerProvider] Retrieved key: ${key}`);
      }
      return value;
    } catch (error) {
      logger.error(`[WindowsCredentialManagerProvider] Failed to retrieve key: ${key}`, error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    await this.ensureInitialized();

    if (!this.isKeytarAvailable) {
      logger.debug(`[WindowsCredentialManagerProvider] Keytar not available, cannot delete key: ${key}`);
      return;
    }

    try {
      const deleted = await this.keytar.deletePassword(SERVICE_NAME, key);
      if (deleted) {
        logger.debug(`[WindowsCredentialManagerProvider] Deleted key: ${key}`);
      } else {
        logger.debug(`[WindowsCredentialManagerProvider] Key not found: ${key}`);
      }
    } catch (error) {
      logger.error(`[WindowsCredentialManagerProvider] Failed to delete key: ${key}`, error);
      throw new Error(`Failed to delete secret from Windows Credential Manager: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listKeys(): Promise<string[]> {
    await this.ensureInitialized();

    if (!this.isKeytarAvailable) {
      // Return empty list when keytar not available
      return [];
    }

    try {
      const credentials = await this.keytar.findCredentials(SERVICE_NAME);
      return credentials.map((c: { account: string }) => c.account);
    } catch (error) {
      logger.error('[WindowsCredentialManagerProvider] Failed to list keys', error);
      return [];
    }
  }

  /**
   * Test if a specific LLM API key is configured
   */
  async hasKey(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null && value.length > 0;
  }

  /**
   * Check which LLM providers are configured
   */
  async getConfiguredProviders(): Promise<string[]> {
    const configured: string[] = [];

    for (const [provider, keyName] of Object.entries(LLM_API_KEYS)) {
      if (await this.hasKey(keyName)) {
        configured.push(provider);
      }
    }

    return configured;
  }

  /**
   * Check if Windows Credential Manager is available
   */
  isAvailable(): boolean {
    return this.isKeytarAvailable;
  }
}

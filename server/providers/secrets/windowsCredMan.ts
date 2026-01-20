/**
 * Windows Credential Manager Secrets Provider
 * 
 * Local mode secrets implementation using Windows Credential Manager.
 * Provides secure storage for LLM API keys using OS-level encryption.
 * 
 * Requires: keytar npm package (to be added in Sprint 3)
 * 
 * Security: Keys are stored in the Windows Credential Manager, which:
 * - Encrypts data using the user's Windows login credentials
 * - Is inaccessible to other users on the same machine
 * - Survives app reinstalls (tied to Windows user profile)
 */

import type { ISecretsProvider } from '../interfaces';

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
  
  constructor() {
    // Lazy-load keytar to avoid issues when not installed
    this.initKeytar();
  }
  
  private async initKeytar(): Promise<void> {
    try {
      // TODO(sprint-3): Add keytar to dependencies
      // this.keytar = await import('keytar');
      // this.isKeytarAvailable = true;
      console.log('[WindowsCredentialManagerProvider] keytar not yet installed (Sprint 3)');
    } catch (error) {
      console.warn('[WindowsCredentialManagerProvider] keytar not available:', error);
      this.isKeytarAvailable = false;
    }
  }
  
  async set(key: string, value: string): Promise<void> {
    if (!this.isKeytarAvailable) {
      console.log(`[WindowsCredentialManagerProvider] Would store key: ${key}`);
      throw new Error(
        'Windows Credential Manager not available. Install keytar package.'
      );
    }
    
    // TODO(sprint-3): Implement secure storage
    // await this.keytar.setPassword(SERVICE_NAME, key, value);
    console.log(`[WindowsCredentialManagerProvider] Stored key: ${key}`);
  }
  
  async get(key: string): Promise<string | null> {
    if (!this.isKeytarAvailable) {
      console.log(`[WindowsCredentialManagerProvider] Would retrieve key: ${key}`);
      return null;
    }
    
    // TODO(sprint-3): Implement secure retrieval
    // return await this.keytar.getPassword(SERVICE_NAME, key);
    return null;
  }
  
  async delete(key: string): Promise<void> {
    if (!this.isKeytarAvailable) {
      console.log(`[WindowsCredentialManagerProvider] Would delete key: ${key}`);
      return;
    }
    
    // TODO(sprint-3): Implement secure deletion
    // await this.keytar.deletePassword(SERVICE_NAME, key);
    console.log(`[WindowsCredentialManagerProvider] Deleted key: ${key}`);
  }
  
  async listKeys(): Promise<string[]> {
    if (!this.isKeytarAvailable) {
      // Return known key names (without values)
      return Object.values(LLM_API_KEYS);
    }
    
    // TODO(sprint-3): List all stored credentials
    // const credentials = await this.keytar.findCredentials(SERVICE_NAME);
    // return credentials.map(c => c.account);
    return [];
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
}

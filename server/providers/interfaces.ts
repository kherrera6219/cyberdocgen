/**
 * Provider Interfaces
 * 
 * Abstract interfaces for environment-specific implementations.
 * Each provider has cloud and local implementations.
 */

import type { Request } from 'express';

// ============================================================================
// Database Provider
// ============================================================================

export interface IDbConnection {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<void>;
  close(): Promise<void>;
}

export interface IDbTransaction {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface IDbProvider {
  /**
   * Initialize database connection
   */
  connect(): Promise<IDbConnection>;
  
  /**
   * Run database migrations
   * Should be idempotent (safe to run multiple times)
   */
  migrate(): Promise<void>;
  
  /**
   * Execute a query
   */
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  
  /**
   * Execute a transaction
   */
  transaction<T>(callback: (tx: IDbTransaction) => Promise<T>): Promise<T>;
  
  /**
   * Health check
   */
  healthCheck(): Promise<boolean>;
  
  /**
   * Close all connections
   */
  close(): Promise<void>;
}

// ============================================================================
// Storage Provider
// ============================================================================

export interface StorageFile {
  path: string;
  uri: string;
  size: number;
  contentType: string;
  hash?: string; // SHA-256 hash for integrity
}

export interface IStorageProvider {
  /**
   * Save a file and return its URI
   */
  save(file: Buffer, path: string, metadata?: { contentType?: string }): Promise<StorageFile>;
  
  /**
   * Read a file by URI
   */
  read(uri: string): Promise<Buffer>;
  
  /**
   * Check if file exists
   */
  exists(uri: string): Promise<boolean>;
  
  /**
   * Delete a file
   */
  delete(uri: string): Promise<void>;
  
  /**
   * List files with optional prefix
   */
  list(prefix?: string): Promise<StorageFile[]>;
  
  /**
   * Get file metadata without downloading
   */
  getMetadata(uri: string): Promise<Pick<StorageFile, 'size' | 'contentType'>>;
}

// ============================================================================
// Secrets Provider
// ============================================================================

export interface ISecretsProvider {
  /**
   * Store a secret
   */
  set(key: string, value: string): Promise<void>;
  
  /**
   * Retrieve a secret
   * Returns null if not found
   */
  get(key: string): Promise<string | null>;
  
  /**
   * Delete a secret
   */
  delete(key: string): Promise<void>;
  
  /**
   * List all secret keys (not values)
   */
  listKeys(): Promise<string[]>;

  /**
   * Optional helper for providers that can identify configured integrations
   */
  getConfiguredProviders?(): Promise<string[]>;
}

// ============================================================================
// Auth Provider
// ============================================================================

export interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
}

export interface Tenant {
  id: string;
  name: string;
}

export interface AuthContext {
  user: User;
  tenant: Tenant;
}

export interface IAuthProvider {
  /**
   * Authenticate a request and return user/tenant context
   * Returns null if authentication fails
   */
  authenticate(req: Request): Promise<AuthContext | null>;
  
  /**
   * Check if authentication is required in this mode
   */
  isAuthRequired(): boolean;
  
  /**
   * Initialize auth provider (setup routes, etc.)
   */
  initialize?(): Promise<void>;
}

// ============================================================================
// Provider Factory Type
// ============================================================================

export interface Providers {
  db: IDbProvider;
  storage: IStorageProvider;
  secrets: ISecretsProvider;
  auth: IAuthProvider;
}

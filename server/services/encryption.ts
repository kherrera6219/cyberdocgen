import crypto from 'crypto';
import { logger } from '../utils/logger';

export enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal', 
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

export interface EncryptedData {
  encryptedValue: string;
  iv: string;
  authTag: string;
  encryptionVersion: number;
  encryptedAt: string;
}

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly legacyAlgorithm = 'aes-256-cbc';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 12; // GCM uses 12-byte IV/nonce
  private readonly legacyIvLength = 16; // CBC used 16-byte IV
  private readonly tagLength = 16;
  private readonly encryptionVersion = 2;

  private getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    return Buffer.from(key, 'hex');
  }

  /**
   * Encrypts sensitive data using AES-256-GCM (Authenticated Encryption)
   */
  async encryptSensitiveField(data: string, classification: DataClassification): Promise<EncryptedData> {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      const encryptedData: EncryptedData = {
        encryptedValue: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        encryptionVersion: this.encryptionVersion,
        encryptedAt: new Date().toISOString()
      };

      logger.info('Data encrypted successfully with AES-256-GCM', { 
        classification, 
        encryptionVersion: this.encryptionVersion 
      });

      return encryptedData;
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Encryption failed', { error: errMessage, classification });
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypts sensitive data using AES-256-GCM with authentication verification
   */
  async decryptSensitiveField(encryptedData: EncryptedData, classification: DataClassification): Promise<string> {
    try {
      const key = this.getEncryptionKey();
      
      if (encryptedData.encryptionVersion === 1) {
        return this.decryptLegacyV1(encryptedData, classification);
      }

      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');
      
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv, {
        authTagLength: this.tagLength
      });
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedData.encryptedValue, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      logger.info('Data decrypted successfully with AES-256-GCM', { 
        encryptionVersion: encryptedData.encryptionVersion 
      });

      return decrypted;
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Decryption failed', { 
        error: errMessage, 
        encryptionVersion: encryptedData.encryptionVersion 
      });
      throw new Error('Failed to decrypt sensitive data: authentication failed or data corrupted');
    }
  }

  /**
   * Decrypts legacy v1 data encrypted with AES-256-CBC
   */
  private async decryptLegacyV1(encryptedData: EncryptedData, classification: DataClassification): Promise<string> {
    try {
      const key = this.getEncryptionKey();
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const decipher = crypto.createDecipheriv(this.legacyAlgorithm, key, iv);

      let decrypted = decipher.update(encryptedData.encryptedValue, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      logger.info('Legacy v1 data decrypted successfully (AES-256-CBC)', { 
        encryptionVersion: encryptedData.encryptionVersion 
      });

      return decrypted;
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Legacy v1 decryption failed', { 
        error: errMessage, 
        encryptionVersion: encryptedData.encryptionVersion 
      });
      throw new Error('Failed to decrypt legacy v1 data');
    }
  }

  /**
   * Migrates v1 encrypted data to v2 (AES-256-GCM)
   */
  async migrateToV2(encryptedData: EncryptedData, classification: DataClassification): Promise<EncryptedData> {
    if (encryptedData.encryptionVersion >= 2) {
      logger.info('Data already using v2 encryption, no migration needed');
      return encryptedData;
    }

    const decrypted = await this.decryptLegacyV1(encryptedData, classification);
    const reEncrypted = await this.encryptSensitiveField(decrypted, classification);

    logger.info('Successfully migrated data from v1 to v2 encryption', {
      fromVersion: encryptedData.encryptionVersion,
      toVersion: reEncrypted.encryptionVersion
    });

    return reEncrypted;
  }

  /**
   * Checks if encrypted data needs migration to v2
   */
  needsMigration(encryptedData: EncryptedData): boolean {
    return encryptedData.encryptionVersion < 2;
  }

  /**
   * Generates a new encryption key for key rotation
   */
  generateEncryptionKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * Validates if data needs re-encryption (key rotation)
   */
  needsReEncryption(encryptedData: EncryptedData): boolean {
    const encryptedDate = new Date(encryptedData.encryptedAt);
    const rotationPeriod = 90 * 24 * 60 * 60 * 1000; // 90 days
    const now = new Date();

    return (now.getTime() - encryptedDate.getTime()) > rotationPeriod;
  }

  /**
   * Securely hashes data for indexing/searching encrypted fields
   * Uses deterministic SHA-256 hashing for consistent lookups
   */
  async hashForIndexing(data: string): Promise<string> {
    // Use deterministic SHA-256 hash for consistent indexing/searching
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return hash;
  }
}

export const encryptionService = new EncryptionService();

export async function encrypt(data: string): Promise<EncryptedData> {
  const service = new EncryptionService();
  return service.encryptSensitiveField(data, DataClassification.RESTRICTED);
}

export async function decrypt(encryptedData: string | EncryptedData): Promise<string> {
  const service = new EncryptionService();
  if (typeof encryptedData === 'string') {
    try {
      const parsedData = JSON.parse(encryptedData);
      if (parsedData.encryptedValue && parsedData.iv) {
        return service.decryptSensitiveField(parsedData, DataClassification.RESTRICTED);
      }
    } catch (e) {
      // Ignore decryption errors for invalid formats
    }
  } else {
    return service.decryptSensitiveField(encryptedData, DataClassification.RESTRICTED);
  }
  throw new Error('Invalid encrypted data format for decryption');
}

/**
 * Encrypt sensitive company profile data
 */
export async function encryptCompanyProfile(profile: any): Promise<any> {
  if (!profile || typeof profile !== 'object') {
    return profile;
  }

  const sensitiveFields = new Set([
    'taxId', 'ssn', 'bankAccount', 'routingNumber',
    'apiKey', 'apiKeys', 'credentials', 'financialData', 'encryptionKey'
  ]);

  const encryptedEntries = await Promise.all(
    Object.entries(profile).map(async ([field, value]) => {
      if (sensitiveFields.has(field) && value !== undefined && value !== null) {
        const plainValue = typeof value === 'string' ? value : String(value);
        return [field, await encrypt(plainValue)] as const;
      }

      return [field, value] as const;
    })
  );

  return Object.fromEntries(encryptedEntries);
}

/**
 * Encrypt all data at rest
 */
export async function encryptDataAtRest(data: any, dataType: string): Promise<any> {
  if (!data) return data;

  const encryptionMetadata = {
    encrypted: true,
    encryptedAt: new Date().toISOString(),
    dataType,
    algorithm: 'AES-256-GCM',
    keyVersion: process.env.ENCRYPTION_KEY_VERSION || '1'
  };

  if (typeof data === 'object' && !Array.isArray(data)) {
    const encryptedEntries = await Promise.all(
      Object.entries(data).map(async ([key, value]) => {
        if (typeof value === 'string' && shouldEncryptField(key, dataType)) {
          return [key, await encrypt(value)] as const;
        }

        return [key, value] as const;
      })
    );

    return { ...Object.fromEntries(encryptedEntries), _encryption: encryptionMetadata };
  }

  if (typeof data === 'string') {
    return {
      encryptedValue: await encrypt(data),
      _encryption: encryptionMetadata
    };
  }

  return data;
}

/**
 * Decrypt data at rest
 */
export async function decryptDataAtRest(data: any): Promise<any> {
  if (!data || !data._encryption) return data;

  if (data.encryptedValue) {
    return await decrypt(data.encryptedValue);
  }

  const decryptedEntries = await Promise.all(
    Object.entries(data)
      .filter(([key]) => key !== '_encryption')
      .map(async ([key, value]) => {
        try {
          if (typeof value === 'string') {
            return [key, await decrypt(value)] as const;
          }

          if (typeof value === 'object' && value !== null && 'encryptedValue' in value) {
            return [key, await decrypt(value as EncryptedData)] as const;
          }
        } catch {
          // Keep original value when decryption fails.
        }

        return [key, value] as const;
      })
  );

  return Object.fromEntries(decryptedEntries);
}

/**
 * Determine if field should be encrypted based on data type and field name
 */
export function shouldEncryptField(fieldName: string, dataType: string): boolean {
  const sensitiveFields = [
    'password', 'secret', 'key', 'token', 'credential',
    'ssn', 'taxId', 'bankAccount', 'routingNumber',
    'apiKey', 'privateKey', 'confidential', 'credit', 'card'
  ];

  const fieldLower = fieldName.toLowerCase();
  return sensitiveFields.some(sensitive => fieldLower.includes(sensitive));
}

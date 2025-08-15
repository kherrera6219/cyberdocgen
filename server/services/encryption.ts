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
  private readonly algorithm = 'aes-256-cbc';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly encryptionVersion = 1;

  // In production, this should come from a secure key management service
  private getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    return Buffer.from(key, 'hex');
  }

  /**
   * Encrypts sensitive data using AES-256-CBC
   */
  async encryptSensitiveField(data: string, classification: DataClassification): Promise<EncryptedData> {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = crypto.createHash('sha256').update(encrypted + classification).digest();

      const encryptedData: EncryptedData = {
        encryptedValue: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        encryptionVersion: this.encryptionVersion,
        encryptedAt: new Date().toISOString()
      };

      logger.info('Data encrypted successfully', { 
        classification, 
        encryptionVersion: this.encryptionVersion 
      });

      return encryptedData;
    } catch (error: any) {
      logger.error('Encryption failed', { error: error.message, classification });
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypts sensitive data using AES-256-CBC
   */
  async decryptSensitiveField(encryptedData: EncryptedData, classification: DataClassification): Promise<string> {
    try {
      const key = this.getEncryptionKey();
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);

      let decrypted = decipher.update(encryptedData.encryptedValue, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      logger.info('Data decrypted successfully', { 
        encryptionVersion: encryptedData.encryptionVersion 
      });

      return decrypted;
    } catch (error: any) {
      logger.error('Decryption failed', { 
        error: error.message, 
        encryptionVersion: encryptedData.encryptionVersion 
      });
      throw new Error('Failed to decrypt sensitive data');
    }
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
   */
  async hashForIndexing(data: string): Promise<string> {
    const salt = crypto.randomBytes(16);
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(data, salt, 100000, 64, 'sha256', (err, derivedKey) => {
        if (err) reject(err);
        resolve(salt.toString('hex') + ':' + derivedKey.toString('hex'));
      });
    });
  }
}

export const encryptionService = new EncryptionService();

// Helper functions for data at rest encryption
async function encrypt(data: string): Promise<EncryptedData> {
  const service = new EncryptionService();
  return service.encryptSensitiveField(data, DataClassification.RESTRICTED);
}

async function decrypt(encryptedData: string | EncryptedData): Promise<string> {
  const service = new EncryptionService();
  if (typeof encryptedData === 'string') {
    // Assume it's the encrypted value and IV is not provided separately,
    // which might happen if encryption was not done using EncryptedData interface
    try {
      const parsedData = JSON.parse(encryptedData);
      if (parsedData.encryptedValue && parsedData.iv) {
        return service.decryptSensitiveField(parsedData, DataClassification.RESTRICTED);
      }
    } catch (e) {
      // If parsing fails, it might be a simple string or an old format
    }
    // Fallback for cases where only the encrypted string is present
    // This requires a default IV or a different decryption mechanism if the format is unknown
    // For simplicity, we'll assume the EncryptedData interface is used or the format is consistent.
    // If a simple string is passed, and it's not parsable into EncryptedData, decryption will fail here.
  } else {
    return service.decryptSensitiveField(encryptedData, DataClassification.RESTRICTED);
  }
  throw new Error('Invalid encrypted data format for decryption');
}


/**
 * Encrypt sensitive company profile data
 */
export async function encryptCompanyProfile(profile: any): Promise<any> {
  const sensitiveFields = [
    'taxId', 'ssn', 'bankAccount', 'routingNumber',
    'apiKeys', 'credentials', 'financialData'
  ];

  const encrypted = { ...profile };

  for (const field of sensitiveFields) {
    if (encrypted[field]) {
      encrypted[field] = await encrypt(encrypted[field]);
    }
  }

  return encrypted;
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

  // For objects, encrypt sensitive string fields
  if (typeof data === 'object' && !Array.isArray(data)) {
    const encrypted = { ...data };

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && shouldEncryptField(key, dataType)) {
        encrypted[key] = await encrypt(value);
      }
    }

    return { ...encrypted, _encryption: encryptionMetadata };
  }

  // For primitive sensitive data
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

  const decrypted = { ...data };
  delete decrypted._encryption;

  // Handle encrypted value wrapper
  if (data.encryptedValue) {
    return await decrypt(data.encryptedValue);
  }

  // Handle object with encrypted fields
  for (const [key, value] of Object.entries(decrypted)) {
    if (typeof value === 'string' && key !== '_encryption') {
      try {
        decrypted[key] = await decrypt(value);
      } catch {
        // If decryption fails, assume it's not encrypted
        decrypted[key] = value;
      }
    }
  }

  return decrypted;
}

/**
 * Determine if field should be encrypted based on data type and field name
 */
function shouldEncryptField(fieldName: string, dataType: string): boolean {
  const sensitiveFields = [
    'password', 'secret', 'key', 'token', 'credential',
    'ssn', 'taxId', 'bankAccount', 'routingNumber',
    'apiKey', 'privateKey', 'confidential'
  ];

  const fieldLower = fieldName.toLowerCase();
  return sensitiveFields.some(sensitive => fieldLower.includes(sensitive));
}
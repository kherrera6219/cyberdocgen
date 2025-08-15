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
   * Encrypts sensitive data using AES-256-GCM
   */
  async encryptSensitiveField(data: string, classification: DataClassification): Promise<EncryptedData> {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipherGCM(this.algorithm, key, iv);
      cipher.setAAD(Buffer.from(classification));

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

      logger.info('Data encrypted successfully', { 
        classification, 
        encryptionVersion: this.encryptionVersion 
      });

      return encryptedData;
    } catch (error) {
      logger.error('Encryption failed', { error: error.message, classification });
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypts sensitive data using AES-256-GCM
   */
  async decryptSensitiveField(encryptedData: EncryptedData, classification: DataClassification): Promise<string> {
    try {
      const key = this.getEncryptionKey();
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const decipher = crypto.createDecipherGCM(this.algorithm, key, iv);
      
      decipher.setAAD(Buffer.from(classification));
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

      let decrypted = decipher.update(encryptedData.encryptedValue, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      logger.info('Data decrypted successfully', { 
        encryptionVersion: encryptedData.encryptionVersion 
      });

      return decrypted;
    } catch (error) {
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
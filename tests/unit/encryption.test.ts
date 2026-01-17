import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  encryptionService, 
  DataClassification, 
  EncryptedData,
  encrypt,
  decrypt,
  shouldEncryptField,
  encryptCompanyProfile
} from '../../server/services/encryption';
import crypto from 'crypto';

// Mock logger
vi.mock('../../server/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}));

describe('EncryptionService', () => {
  const testData = 'sensitive-test-data-123';
  const classification = DataClassification.CONFIDENTIAL;

  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure encryption key is set
    process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  });

  describe('encryptSensitiveField', () => {
    it('encrypts data using AES-256-GCM', async () => {
      const encrypted = await encryptionService.encryptSensitiveField(testData, classification);

      expect(encrypted).toHaveProperty('encryptedValue');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');
      expect(encrypted.encryptionVersion).toBe(2);
      expect(encrypted.encryptedAt).toBeDefined();
      expect(encrypted.encryptedValue).not.toBe(testData);
    });

    it('produces unique IVs for each encryption', async () => {
      const encrypted1 = await encryptionService.encryptSensitiveField(testData, classification);
      const encrypted2 = await encryptionService.encryptSensitiveField(testData, classification);

      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.encryptedValue).not.toBe(encrypted2.encryptedValue);
    });

    it('handles empty strings', async () => {
      const encrypted = await encryptionService.encryptSensitiveField('', classification);
      expect(encrypted.encryptedValue).toBeDefined();
    });
  });

  describe('decryptSensitiveField', () => {
    it('successfully decrypts encrypted data', async () => {
      const encrypted = await encryptionService.encryptSensitiveField(testData, classification);
      const decrypted = await encryptionService.decryptSensitiveField(encrypted, classification);

      expect(decrypted).toBe(testData);
    });

    it('throws error on tampered data (auth tag validation)', async () => {
      const encrypted = await encryptionService.encryptSensitiveField(testData, classification);
      
      // Tamper with encrypted value
      const tamperedData = {
        ...encrypted,
        encryptedValue: encrypted.encryptedValue.slice(0, -4) + 'XXXX'
      };

      await expect(
        encryptionService.decryptSensitiveField(tamperedData, classification)
      ).rejects.toThrow();
    });

    it('throws error on invalid auth tag', async () => {
      const encrypted = await encryptionService.encryptSensitiveField(testData, classification);
      
      const invalidData = {
        ...encrypted,
        authTag: crypto.randomBytes(16).toString('hex')
      };

      await expect(
        encryptionService.decryptSensitiveField(invalidData, classification)
      ).rejects.toThrow();
    });
  });

  describe('legacy v1 support', () => {
    it('identifies data needing migration', () => {
      const v1Data: EncryptedData = {
        encryptedValue: 'legacy-encrypted-value',
        iv: 'legacy-iv',
        authTag: '',
        encryptionVersion: 1,
        encryptedAt: new Date().toISOString()
      };

      expect(encryptionService.needsMigration(v1Data)).toBe(true);
    });

    it('identifies v2 data as not needing migration', () => {
      const v2Data: EncryptedData = {
        encryptedValue: 'v2-encrypted-value',
        iv: 'v2-iv',
        authTag: 'auth-tag',
        encryptionVersion: 2,
        encryptedAt: new Date().toISOString()
      };

      expect(encryptionService.needsMigration(v2Data)).toBe(false);
    });
  });

  describe('key rotation detection', () => {
    it('detects data needing re-encryption based on age', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100); // 100 days old

      const oldData: EncryptedData = {
        encryptedValue: 'old-value',
        iv: 'old-iv',
        authTag: 'old-tag',
        encryptionVersion: 2,
        encryptedAt: oldDate.toISOString()
      };

      expect(encryptionService.needsReEncryption(oldData)).toBe(true);
    });

    it('does not flag recent data for re-encryption', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10); // 10 days old

      const recentData: EncryptedData = {
        encryptedValue: 'recent-value',
        iv: 'recent-iv',
        authTag: 'recent-tag',
        encryptionVersion: 2,
        encryptedAt: recentDate.toISOString()
      };

      expect(encryptionService.needsReEncryption(recentData)).toBe(false);
    });
  });

  describe('generateEncryptionKey', () => {
    it('generates a valid 64-character hex key', () => {
      const key = encryptionService.generateEncryptionKey();

      expect(key).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/i.test(key)).toBe(true);
    });

    it('generates unique keys', () => {
      const key1 = encryptionService.generateEncryptionKey();
      const key2 = encryptionService.generateEncryptionKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe('hashForIndexing', () => {
    it('produces consistent hashes for same input', async () => {
      const hash1 = await encryptionService.hashForIndexing(testData);
      const hash2 = await encryptionService.hashForIndexing(testData);

      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different inputs', async () => {
      const hash1 = await encryptionService.hashForIndexing('data1');
      const hash2 = await encryptionService.hashForIndexing('data2');

      expect(hash1).not.toBe(hash2);
    });

    it('outputs SHA-256 hex format', async () => {
      const hash = await encryptionService.hashForIndexing(testData);

      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/i.test(hash)).toBe(true);
    });
  });

  describe('helper functions', () => {
    describe('encrypt/decrypt wrappers', () => {
      it('encrypt wrapper works with sensitive field encryption', async () => {
        const encrypted = await encrypt(testData);
        const decrypted = await decrypt(encrypted);

        expect(decrypted).toBe(testData);
      });
    });

    describe('shouldEncryptField', () => {
      it('encrypts sensitive field names', () => {
        expect(shouldEncryptField('password', 'user')).toBe(true);
        expect(shouldEncryptField('apiKey', 'service')).toBe(true);
        expect(shouldEncryptField('ssn', 'employee')).toBe(true);
        expect(shouldEncryptField('creditCard', 'payment')).toBe(true);
      });

      it('does not encrypt non-sensitive fields', () => {
        expect(shouldEncryptField('name', 'user')).toBe(false);
        expect(shouldEncryptField('email', 'user')).toBe(false);
        expect(shouldEncryptField('id', 'user')).toBe(false);
      });
    });
  });

  describe('field-level encryption', () => {
    it('encrypts company profile sensitive fields', async () => {
      const profile = {
        companyName: 'Test Corp',
        apiKey: 'secret-api-key-123',
        encryptionKey: 'master-encryption-key'
      };

      const encrypted = await encryptCompanyProfile(profile);

      expect(encrypted.companyName).toBe('Test Corp'); // Not sensitive
      expect(encrypted.apiKey).not.toBe('secret-api-key-123'); // Encrypted
      expect(encrypted.apiKey).toHaveProperty('encryptedValue');
    });
  });

  describe('data classification', () => {
    it('supports all classification levels', async () => {
      const classifications = [
        DataClassification.PUBLIC,
        DataClassification.INTERNAL,
        DataClassification.CONFIDENTIAL,
        DataClassification.RESTRICTED
      ];

      for (const level of classifications) {
        const encrypted = await encryptionService.encryptSensitiveField(testData, level);
        const decrypted = await encryptionService.decryptSensitiveField(encrypted, level);
        expect(decrypted).toBe(testData);
      }
    });
  });
});

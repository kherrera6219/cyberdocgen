import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cloudIntegrationService } from '../../server/services/cloudIntegrationService';
import { db } from '../../server/db';
import { systemConfigService } from '../../server/services/systemConfigService';

// DB Mock
vi.mock('../../server/db', () => ({
  db: {
    insert: vi.fn(() => ({
       values: vi.fn(() => ({
         onConflictDoUpdate: vi.fn(() => ({
           returning: vi.fn().mockResolvedValue([{ id: 'int-1' }])
         }))
       }))
    })),
    query: {
      cloudIntegrations: { findFirst: vi.fn() },
      cloudFiles: { findFirst: vi.fn(), findMany: vi.fn() }
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn()
      }))
    })),
    delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue({ rowCount: 1 }) })) 
  }
}));

// Config & Encryption Mocks
vi.mock('../../server/services/systemConfigService', () => ({
  systemConfigService: {
    getOAuthCredentials: vi.fn()
  }
}));

vi.mock('../../server/services/encryption', () => ({
  encryptionService: {
    encryptSensitiveField: vi.fn().mockResolvedValue('encrypted'),
    decryptSensitiveField: vi.fn().mockResolvedValue('token')
  },
  DataClassification: { RESTRICTED: 'restricted' }
}));

vi.mock('../../server/services/auditService', () => ({
  auditService: { logAuditEvent: vi.fn() },
  AuditAction: {}, RiskLevel: {}
}));

vi.mock('../../server/utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn() }
}));

// Circuit Breaker Mock - pass through
vi.mock('../../server/utils/circuitBreaker', () => ({
  circuitBreakers: {
    cloudStorage: { execute: vi.fn((fn) => fn()) }
  }
}));

// Google API Mocks
vi.mock('@googleapis/drive', () => ({
  drive: vi.fn(() => ({
    files: {
      list: vi.fn().mockResolvedValue({ 
        data: { 
          files: [
            { id: 'f1', name: 'test.pdf', mimeType: 'application/pdf', size: '1000', modifiedTime: new Date().toISOString() }
          ] 
        } 
      })
    }
  })),
  drive_v3: {}
}));

vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn(() => ({
    setCredentials: vi.fn()
  }))
}));

// Microsoft Graph Mock
vi.mock('@microsoft/microsoft-graph-client', () => ({
  Client: {
    initWithMiddleware: vi.fn(() => ({
      api: vi.fn(() => ({
        filter: vi.fn(() => ({
          select: vi.fn(() => ({
             top: vi.fn(() => ({
               get: vi.fn().mockResolvedValue({ value: [] })
             }))
          }))
        }))
      }))
    }))
  },
  AuthenticationProvider: class {}
}));

describe('CloudIntegrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createIntegration', () => {
    it('should create integration successfully', async () => {
      const config = {
        userId: 'u1',
        organizationId: 'o1',
        provider: 'google_drive' as const,
        accessToken: 'abc',
        userProfile: { id: 'p1', email: 'test@example.com', displayName: 'Test' }
      };

      const result = await cloudIntegrationService.createIntegration(config);

      expect(result).toBe('int-1');
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('syncFiles', () => {
    it('should sync google drive files', async () => {
      // Mock integration found
      // @ts-ignore
      db.query.cloudIntegrations.findFirst.mockResolvedValue({
        id: 'int-1',
        userId: 'u1',
        organizationId: 'o1',
        provider: 'google_drive',
        accessTokenEncrypted: JSON.stringify({ iv: 'iv', content: 'enc' }),
        isActive: true
      });

      // Mock config found
      // @ts-ignore
      systemConfigService.getOAuthCredentials.mockResolvedValue({ clientId: 'c', clientSecret: 's' });

      const result = await cloudIntegrationService.syncFiles('int-1');

      expect(result.synced).toBe(1); // 1 file from mock
      expect(db.update).toHaveBeenCalled(); // Sync status update, then completion
    });

    it('should handle inactive integration', async () => {
      // @ts-ignore
      db.query.cloudIntegrations.findFirst.mockResolvedValue({ isActive: false });

      await expect(cloudIntegrationService.syncFiles('int-1'))
        .rejects.toThrow('not found or inactive');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KeyRotationService } from '../../server/services/keyRotationService';
import { auditService } from '../../server/services/auditService';

// Mock dependencies
vi.mock('../../server/db', () => ({
  db: {}
}));

vi.mock('../../server/services/auditService', () => ({
  auditService: {
    logAuditEvent: vi.fn(),
  },
  AuditAction: {
    UPDATE: 'update',
    DELETE: 'delete',
  },
  RiskLevel: {
    HIGH: 'high',
    CRITICAL: 'critical',
  }
}));

vi.mock('../../server/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('KeyRotationService', () => {
    let service: KeyRotationService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new KeyRotationService();
    });

    describe('rotateEncryptionKey', () => {
        it('rotates encryption key and logs audit event', async () => {
             const result = await service.rotateEncryptionKey('scheduled');

             expect(result.success).toBe(true);
             expect(result.keyId).toBeDefined();
             expect(auditService.logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
                 resourceType: 'encryption_key',
                 action: 'update'
             }));
        });
    });

    describe('checkRotationDue', () => {
        it('returns false if recently rotated', async () => {
             // Mock getLastRotation to return recent date
             vi.spyOn(service as any, 'getLastRotation').mockResolvedValue({
                 rotatedAt: new Date()
             });

             const result = await service.checkRotationDue('encryption_key');
             
             expect(result.isDue).toBe(false);
        });

        it('returns true if never rotated', async () => {
             vi.spyOn(service as any, 'getLastRotation').mockResolvedValue(null);

             const result = await service.checkRotationDue('encryption_key');
             
             expect(result.isDue).toBe(true);
        });
    });

    describe('performScheduledRotations', () => {
        it('skips if not due', async () => {
             vi.spyOn(service as any, 'checkRotationDue').mockResolvedValue({ isDue: false });

             const result = await service.performScheduledRotations();
             
             expect(result.skipped).toContain('encryption_key');
             expect(result.rotated).toHaveLength(0);
        });

        it('rotates if due', async () => {
            // Mock encryption key due, signing key not due
            vi.spyOn(service as any, 'checkRotationDue').mockImplementation(async (keyName) => {
                return { isDue: keyName === 'encryption_key' };
            });

            vi.spyOn(service, 'rotateEncryptionKey').mockResolvedValue({ success: true } as any);

            const result = await service.performScheduledRotations();
            
            expect(result.rotated).toContain('encryption_key');
        });
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dataResidencyService } from '../../server/services/dataResidencyService';
import { db } from '../../server/db';
import { dataResidencyPolicies } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

// Mock DB
vi.mock('../../server/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(),
    })),
  },
}));

// Mock logger
vi.mock('../../server/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('DataResidencyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPolicy', () => {
    it('should create a new policy', async () => {
      const input = {
        organizationId: 'org-123',
        policyName: 'EU Data Only',
        region: 'eu-west',
        dataTypes: ['pii', 'financial'],
        createdBy: 'user-123',
      };

      const mockPolicy = { ...input, id: 'policy-1', status: 'active' };

      // Setup mock chain
      const returningMock = vi.fn().mockResolvedValue([mockPolicy]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      const insertMock = vi.fn().mockReturnValue({ values: valuesMock });
      
      // @ts-expect-error
      db.insert.mockImplementation(insertMock);

      const result = await dataResidencyService.createPolicy(input);

      expect(insertMock).toHaveBeenCalledWith(dataResidencyPolicies);
      expect(valuesMock).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: input.organizationId,
        policyName: input.policyName,
        status: 'active'
      }));
      expect(result).toEqual(mockPolicy);
    });

    it('should throw error on creation failure', async () => {
      const input = {
        organizationId: 'org-123',
        policyName: 'Fail Policy',
        region: 'us-east',
        dataTypes: ['all'],
        createdBy: 'user-123',
      };

      // @ts-expect-error
      db.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
           returning: vi.fn().mockRejectedValue(new Error('DB Error')),
        }),
      });

      await expect(dataResidencyService.createPolicy(input))
        .rejects.toThrow('Failed to create data residency policy: DB Error');
    });
  });

  describe('validateRegion', () => {
    const mockActivePolicies = [
      {
        id: 'p1',
        organizationId: 'org-1',
        policyName: 'EU Strict',
        region: 'eu',
        dataTypes: ['pii'],
        enforceStrict: true,
        allowedRegions: ['eu-west', 'eu-central'],
        blockedRegions: ['us-east'],
        status: 'active',
      }
    ];

    it('should allow if no policies match data type', async () => {
      // Mock getActivePolicies to return empty or non-matching
      vi.spyOn(dataResidencyService, 'getActivePolicies').mockResolvedValue([]);

      const result = await dataResidencyService.validateRegion('org-1', 'finance', 'us-east');
      expect(result.allowed).toBe(true);
    });

    it('should block if region is in blockedRegions', async () => {
      // @ts-expect-error
      vi.spyOn(dataResidencyService, 'getActivePolicies').mockResolvedValue(mockActivePolicies);

      const result = await dataResidencyService.validateRegion('org-1', 'pii', 'us-east');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('is blocked by policy');
    });

    it('should block if strict enforcement and region not in allowedRegions', async () => {
      // @ts-expect-error
      vi.spyOn(dataResidencyService, 'getActivePolicies').mockResolvedValue(mockActivePolicies);

      const result = await dataResidencyService.validateRegion('org-1', 'pii', 'asia-east');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('is not in allowed regions');
    });

    it('should allow if region is in allowedRegions', async () => {
      // @ts-expect-error
      vi.spyOn(dataResidencyService, 'getActivePolicies').mockResolvedValue(mockActivePolicies);

      const result = await dataResidencyService.validateRegion('org-1', 'pii', 'eu-west');
      expect(result.allowed).toBe(true);
    });
  });
});

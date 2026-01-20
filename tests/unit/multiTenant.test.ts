import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  extractOrganizationContext,
  requireOrganization,
  requireOrganizationRole,
  validateResourceOwnership,
  requireResourceOwnership,
  getDocumentWithOrgCheck,
  getCompanyProfileWithOrgCheck,
  MultiTenantRequest
} from '../../server/middleware/multiTenant';
import { ForbiddenError, NotFoundError, ValidationError } from '../../server/utils/errorHandling';

// Mock dependencies
vi.mock('../../server/storage', () => ({
  storage: {
    getUserOrganizations: vi.fn(),
    getDocument: vi.fn(),
    getCompanyProfile: vi.fn(),
    getGapAnalysisReport: vi.fn(),
  },
}));

vi.mock('../../server/replitAuth', () => ({
  getUserId: vi.fn(),
}));

vi.mock('../../server/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MultiTenant Middleware', () => {
  let mockReq: Partial<MultiTenantRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let storage: any;
  let getUserId: any;
  let logger: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const storageModule = await import('../../server/storage');
    storage = storageModule.storage;

    const authModule = await import('../../server/replitAuth');
    getUserId = authModule.getUserId;

    const loggerModule = await import('../../server/utils/logger');
    logger = loggerModule.logger;

    mockReq = {
      headers: {},
      query: {},
      params: {},
      session: {} as any,
      user: undefined,
      ip: '127.0.0.1',
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('extractOrganizationContext', () => {
    it('should call next() if no userId is found', async () => {
      getUserId.mockReturnValue(null);

      await extractOrganizationContext(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(storage.getUserOrganizations).not.toHaveBeenCalled();
    });

    it('should set empty userOrganizations if user has no organizations', async () => {
      getUserId.mockReturnValue('user-123');
      storage.getUserOrganizations.mockResolvedValue([]);

      await extractOrganizationContext(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(mockReq.userOrganizations).toEqual([]);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should extract organization from header when provided', async () => {
      getUserId.mockReturnValue('user-123');
      const userOrgs = [
        { organizationId: 'org-1', role: 'admin' },
        { organizationId: 'org-2', role: 'user' }
      ];
      storage.getUserOrganizations.mockResolvedValue(userOrgs);
      mockReq.headers = { 'x-organization-id': 'org-2' };

      await extractOrganizationContext(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(mockReq.organizationId).toBe('org-2');
      expect(mockReq.organizationRole).toBe('user');
      expect(mockReq.userOrganizations).toHaveLength(2);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should extract organization from query parameter when header not provided', async () => {
      getUserId.mockReturnValue('user-123');
      const userOrgs = [
        { organizationId: 'org-1', role: 'admin' }
      ];
      storage.getUserOrganizations.mockResolvedValue(userOrgs);
      mockReq.query = { organizationId: 'org-1' };

      await extractOrganizationContext(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(mockReq.organizationId).toBe('org-1');
      expect(mockReq.organizationRole).toBe('admin');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should use first organization as default when no specific org requested', async () => {
      getUserId.mockReturnValue('user-123');
      const userOrgs = [
        { organizationId: 'org-1', role: 'admin' },
        { organizationId: 'org-2', role: 'user' }
      ];
      storage.getUserOrganizations.mockResolvedValue(userOrgs);

      await extractOrganizationContext(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(mockReq.organizationId).toBe('org-1');
      expect(mockReq.organizationRole).toBe('admin');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should not set organizationId if requested org is not in user organizations', async () => {
      getUserId.mockReturnValue('user-123');
      const userOrgs = [
        { organizationId: 'org-1', role: 'admin' }
      ];
      storage.getUserOrganizations.mockResolvedValue(userOrgs);
      mockReq.headers = { 'x-organization-id': 'org-999' };

      await extractOrganizationContext(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(mockReq.organizationId).toBeUndefined();
      expect(mockReq.organizationRole).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle errors gracefully and call next()', async () => {
      getUserId.mockReturnValue('user-123');
      storage.getUserOrganizations.mockRejectedValue(new Error('Database error'));

      await extractOrganizationContext(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith('Failed to extract organization context', expect.objectContaining({
        error: 'Database error'
      }));
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should map organizations correctly with multiple orgs', async () => {
      getUserId.mockReturnValue('user-123');
      const userOrgs = [
        { organizationId: 'org-1', role: 'admin' },
        { organizationId: 'org-2', role: 'user' },
        { organizationId: 'org-3', role: 'viewer' }
      ];
      storage.getUserOrganizations.mockResolvedValue(userOrgs);

      await extractOrganizationContext(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(mockReq.userOrganizations).toEqual([
        { organizationId: 'org-1', role: 'admin' },
        { organizationId: 'org-2', role: 'user' },
        { organizationId: 'org-3', role: 'viewer' }
      ]);
    });
  });

  describe('requireOrganization', () => {
    it('should return ForbiddenError if organizationId is not set', () => {
      mockReq.organizationId = undefined;

      requireOrganization(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.code).toBe('ORG_CONTEXT_REQUIRED');
    });

    it('should call next() if organizationId is set', () => {
      mockReq.organizationId = 'org-123';

      requireOrganization(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('requireOrganizationRole', () => {
    it('should return ForbiddenError if organizationId is not set', () => {
      mockReq.organizationId = undefined;
      const middleware = requireOrganizationRole('admin');

      middleware(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.code).toBe('ORG_CONTEXT_REQUIRED');
    });

    it('should return ForbiddenError if user role is not in allowed roles', () => {
      getUserId.mockReturnValue('user-123');
      mockReq.organizationId = 'org-123';
      mockReq.organizationRole = 'user';
      const middleware = requireOrganizationRole('admin', 'owner');

      middleware(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(logger.warn).toHaveBeenCalledWith('Insufficient organization role', expect.objectContaining({
        userRole: 'user',
        requiredRoles: ['admin', 'owner']
      }));
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.code).toBe('INSUFFICIENT_ORG_ROLE');
    });

    it('should call next() if user has required role', () => {
      mockReq.organizationId = 'org-123';
      mockReq.organizationRole = 'admin';
      const middleware = requireOrganizationRole('admin', 'owner');

      middleware(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should work with single role requirement', () => {
      mockReq.organizationId = 'org-123';
      mockReq.organizationRole = 'viewer';
      const middleware = requireOrganizationRole('viewer');

      middleware(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle missing organizationRole', () => {
      mockReq.organizationId = 'org-123';
      mockReq.organizationRole = undefined;
      const middleware = requireOrganizationRole('admin');

      middleware(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe('validateResourceOwnership', () => {
    it('should return false if document does not exist', async () => {
      storage.getDocument.mockResolvedValue(null);

      const result = await validateResourceOwnership('document', 'doc-123', 'org-123');

      expect(result).toBe(false);
    });

    it('should return false if document profile does not exist', async () => {
      storage.getDocument.mockResolvedValue({ companyProfileId: 'profile-1' });
      storage.getCompanyProfile.mockResolvedValue(null);

      const result = await validateResourceOwnership('document', 'doc-123', 'org-123');

      expect(result).toBe(false);
    });

    it('should return false if document belongs to different organization', async () => {
      storage.getDocument.mockResolvedValue({ companyProfileId: 'profile-1' });
      storage.getCompanyProfile.mockResolvedValue({ organizationId: 'org-999' });

      const result = await validateResourceOwnership('document', 'doc-123', 'org-123');

      expect(result).toBe(false);
    });

    it('should return true if document belongs to organization', async () => {
      storage.getDocument.mockResolvedValue({ companyProfileId: 'profile-1' });
      storage.getCompanyProfile.mockResolvedValue({ organizationId: 'org-123' });

      const result = await validateResourceOwnership('document', 'doc-123', 'org-123');

      expect(result).toBe(true);
    });

    it('should validate companyProfile ownership correctly', async () => {
      storage.getCompanyProfile.mockResolvedValue({ organizationId: 'org-123' });

      const result = await validateResourceOwnership('companyProfile', 'profile-123', 'org-123');

      expect(result).toBe(true);
    });

    it('should return false if companyProfile does not exist', async () => {
      storage.getCompanyProfile.mockResolvedValue(null);

      const result = await validateResourceOwnership('companyProfile', 'profile-123', 'org-123');

      expect(result).toBe(false);
    });

    it('should validate gapAnalysisReport ownership correctly', async () => {
      storage.getGapAnalysisReport.mockResolvedValue({ organizationId: 'org-123' });

      const result = await validateResourceOwnership('gapAnalysisReport', 'report-123', 'org-123');

      expect(result).toBe(true);
    });

    it('should return false for unknown resource type', async () => {
      // @ts-expect-error - testing invalid type
      const result = await validateResourceOwnership('unknownType', 'res-123', 'org-123');

      expect(result).toBe(false);
    });

    it('should handle errors and return false', async () => {
      storage.getDocument.mockRejectedValue(new Error('Database error'));

      const result = await validateResourceOwnership('document', 'doc-123', 'org-123');

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Resource ownership validation failed', expect.objectContaining({
        resourceType: 'document',
        resourceId: 'doc-123',
        error: 'Database error'
      }));
    });
  });

  describe('requireResourceOwnership', () => {
    it('should return ValidationError if resourceId is missing', async () => {
      mockReq.params = {};
      const middleware = requireResourceOwnership('document');

      await middleware(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.details?.code).toBe('RESOURCE_ID_REQUIRED');
    });

    it('should return ForbiddenError if organizationId is missing', async () => {
      mockReq.params = { id: 'doc-123' };
      mockReq.organizationId = undefined;
      const middleware = requireResourceOwnership('document');

      await middleware(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should return NotFoundError if resource ownership validation fails', async () => {
      getUserId.mockReturnValue('user-123');
      mockReq.params = { id: 'doc-123' };
      mockReq.organizationId = 'org-123';
      Object.defineProperty(mockReq, 'ip', { value: '192.168.1.1', writable: true });
      storage.getDocument.mockResolvedValue({ companyProfileId: 'profile-1' });
      storage.getCompanyProfile.mockResolvedValue({ organizationId: 'org-999' });

      const middleware = requireResourceOwnership('document');
      await middleware(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(logger.warn).toHaveBeenCalledWith('Cross-tenant access attempt blocked', expect.objectContaining({
        organizationId: 'org-123',
        resourceType: 'document',
        resourceId: 'doc-123',
        ip: '192.168.1.1'
      }));
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('should call next() if ownership validation succeeds', async () => {
      mockReq.params = { id: 'doc-123' };
      mockReq.organizationId = 'org-123';
      storage.getDocument.mockResolvedValue({ companyProfileId: 'profile-1' });
      storage.getCompanyProfile.mockResolvedValue({ organizationId: 'org-123' });

      const middleware = requireResourceOwnership('document');
      await middleware(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should extract resourceId from documentId param', async () => {
      mockReq.params = { documentId: 'doc-456' };
      mockReq.organizationId = 'org-123';
      storage.getDocument.mockResolvedValue({ companyProfileId: 'profile-1' });
      storage.getCompanyProfile.mockResolvedValue({ organizationId: 'org-123' });

      const middleware = requireResourceOwnership('document');
      await middleware(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(storage.getDocument).toHaveBeenCalledWith('doc-456');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should extract resourceId from profileId param', async () => {
      mockReq.params = { profileId: 'profile-789' };
      mockReq.organizationId = 'org-123';
      storage.getCompanyProfile.mockResolvedValue({ organizationId: 'org-123' });

      const middleware = requireResourceOwnership('companyProfile');
      await middleware(mockReq as MultiTenantRequest, mockRes as Response, mockNext);

      expect(storage.getCompanyProfile).toHaveBeenCalledWith('profile-789');
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('getDocumentWithOrgCheck', () => {
    it('should return unauthorized if document does not exist', async () => {
      storage.getDocument.mockResolvedValue(null);

      const result = await getDocumentWithOrgCheck('doc-123', 'org-123');

      expect(result).toEqual({ document: null, authorized: false });
    });

    it('should return unauthorized if profile does not exist', async () => {
      storage.getDocument.mockResolvedValue({ id: 'doc-123', companyProfileId: 'profile-1' });
      storage.getCompanyProfile.mockResolvedValue(null);

      const result = await getDocumentWithOrgCheck('doc-123', 'org-123');

      expect(result).toEqual({ document: null, authorized: false });
    });

    it('should return unauthorized if document belongs to different org', async () => {
      storage.getDocument.mockResolvedValue({ id: 'doc-123', companyProfileId: 'profile-1' });
      storage.getCompanyProfile.mockResolvedValue({ organizationId: 'org-999' });

      const result = await getDocumentWithOrgCheck('doc-123', 'org-123');

      expect(result).toEqual({ document: null, authorized: false });
    });

    it('should return document if authorized', async () => {
      const mockDocument = { id: 'doc-123', companyProfileId: 'profile-1', title: 'Test Doc' };
      storage.getDocument.mockResolvedValue(mockDocument);
      storage.getCompanyProfile.mockResolvedValue({ organizationId: 'org-123' });

      const result = await getDocumentWithOrgCheck('doc-123', 'org-123');

      expect(result).toEqual({ document: mockDocument, authorized: true });
    });
  });

  describe('getCompanyProfileWithOrgCheck', () => {
    it('should return unauthorized if profile does not exist', async () => {
      storage.getCompanyProfile.mockResolvedValue(null);

      const result = await getCompanyProfileWithOrgCheck('profile-123', 'org-123');

      expect(result).toEqual({ profile: null, authorized: false });
    });

    it('should return unauthorized if profile belongs to different org', async () => {
      storage.getCompanyProfile.mockResolvedValue({ id: 'profile-123', organizationId: 'org-999' });

      const result = await getCompanyProfileWithOrgCheck('profile-123', 'org-123');

      expect(result).toEqual({ profile: null, authorized: false });
    });

    it('should return profile if authorized', async () => {
      const mockProfile = { id: 'profile-123', organizationId: 'org-123', name: 'Test Company' };
      storage.getCompanyProfile.mockResolvedValue(mockProfile);

      const result = await getCompanyProfileWithOrgCheck('profile-123', 'org-123');

      expect(result).toEqual({ profile: mockProfile, authorized: true });
    });
  });
});

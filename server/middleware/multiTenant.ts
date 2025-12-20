import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { logger } from '../utils/logger';
import { getUserId } from '../replitAuth';

export interface MultiTenantRequest extends Request {
  organizationId?: string;
  organizationRole?: string;
  userOrganizations?: Array<{ organizationId: string; role: string }>;
}

export async function extractOrganizationContext(
  req: MultiTenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return next();
    }

    const userOrgs = await storage.getUserOrganizations(userId);
    
    if (userOrgs.length === 0) {
      req.userOrganizations = [];
      return next();
    }

    req.userOrganizations = userOrgs.map(org => ({
      organizationId: org.organizationId,
      role: org.role
    }));

    const requestedOrgId = req.headers['x-organization-id'] as string || req.query.organizationId as string;
    
    if (requestedOrgId) {
      const matchedOrg = userOrgs.find(org => org.organizationId === requestedOrgId);
      if (matchedOrg) {
        req.organizationId = matchedOrg.organizationId;
        req.organizationRole = matchedOrg.role;
      }
    } else {
      req.organizationId = userOrgs[0].organizationId;
      req.organizationRole = userOrgs[0].role;
    }

    next();
  } catch (error: any) {
    logger.error('Failed to extract organization context', { error: error.message });
    next();
  }
}

export function requireOrganization(
  req: MultiTenantRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.organizationId) {
    res.status(403).json({
      success: false,
      message: 'Organization context required',
      code: 'ORG_CONTEXT_REQUIRED'
    });
    return;
  }
  next();
}

export function requireOrganizationRole(...allowedRoles: string[]) {
  return (req: MultiTenantRequest, res: Response, next: NextFunction): void => {
    if (!req.organizationId) {
      res.status(403).json({
        success: false,
        message: 'Organization context required',
        code: 'ORG_CONTEXT_REQUIRED'
      });
      return;
    }

    if (!req.organizationRole || !allowedRoles.includes(req.organizationRole)) {
      logger.warn('Insufficient organization role', {
        userId: getUserId(req),
        organizationId: req.organizationId,
        userRole: req.organizationRole,
        requiredRoles: allowedRoles
      });
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions for this operation',
        code: 'INSUFFICIENT_ORG_ROLE'
      });
      return;
    }

    next();
  };
}

export async function validateResourceOwnership(
  resourceType: 'document' | 'companyProfile' | 'gapAnalysisReport',
  resourceId: string,
  organizationId: string
): Promise<boolean> {
  try {
    switch (resourceType) {
      case 'document': {
        const doc = await storage.getDocument(resourceId);
        if (!doc) return false;
        
        const profile = await storage.getCompanyProfile(doc.companyProfileId);
        return profile?.organizationId === organizationId;
      }
      
      case 'companyProfile': {
        const profile = await storage.getCompanyProfile(resourceId);
        return profile?.organizationId === organizationId;
      }
      
      case 'gapAnalysisReport': {
        const report = await storage.getGapAnalysisReport(resourceId);
        return report?.organizationId === organizationId;
      }
      
      default:
        return false;
    }
  } catch (error: any) {
    logger.error('Resource ownership validation failed', {
      resourceType,
      resourceId,
      organizationId,
      error: error.message
    });
    return false;
  }
}

export function requireResourceOwnership(resourceType: 'document' | 'companyProfile' | 'gapAnalysisReport') {
  return async (req: MultiTenantRequest, res: Response, next: NextFunction): Promise<void> => {
    const resourceId = req.params.id || req.params.documentId || req.params.profileId;
    
    if (!resourceId) {
      res.status(400).json({
        success: false,
        message: 'Resource ID required',
        code: 'RESOURCE_ID_REQUIRED'
      });
      return;
    }

    if (!req.organizationId) {
      res.status(403).json({
        success: false,
        message: 'Organization context required',
        code: 'ORG_CONTEXT_REQUIRED'
      });
      return;
    }

    const isOwner = await validateResourceOwnership(resourceType, resourceId, req.organizationId);
    
    if (!isOwner) {
      logger.warn('Cross-tenant access attempt blocked', {
        userId: getUserId(req),
        organizationId: req.organizationId,
        resourceType,
        resourceId,
        ip: req.ip
      });
      
      res.status(404).json({
        success: false,
        message: 'Resource not found',
        code: 'RESOURCE_NOT_FOUND'
      });
      return;
    }

    next();
  };
}

export async function getDocumentWithOrgCheck(
  documentId: string,
  organizationId: string
): Promise<{ document: any; authorized: boolean }> {
  const document = await storage.getDocument(documentId);
  
  if (!document) {
    return { document: null, authorized: false };
  }

  const profile = await storage.getCompanyProfile(document.companyProfileId);
  
  if (!profile || profile.organizationId !== organizationId) {
    return { document: null, authorized: false };
  }

  return { document, authorized: true };
}

export async function getCompanyProfileWithOrgCheck(
  profileId: string,
  organizationId: string
): Promise<{ profile: any; authorized: boolean }> {
  const profile = await storage.getCompanyProfile(profileId);
  
  if (!profile) {
    return { profile: null, authorized: false };
  }

  if (profile.organizationId !== organizationId) {
    return { profile: null, authorized: false };
  }

  return { profile, authorized: true };
}

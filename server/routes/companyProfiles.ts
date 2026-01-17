import { Router, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';
import { logger } from '../utils/logger';
import { insertCompanyProfileSchema } from '@shared/schema';
import { companyDataExtractionService } from '../services/companyDataExtractionService';
import { cache } from '../middleware/production';
import { requireOrganization, getCompanyProfileWithOrgCheck, type MultiTenantRequest } from '../middleware/multiTenant';
import { 
  secureHandler, 
  NotFoundError, 
  ValidationError,
  validateInput 
} from '../utils/errorHandling';

export async function registerCompanyProfilesRoutes(router: Router) {
  const { requireMFA, enforceMFATimeout } = await import('../middleware/mfa');

  router.get("/", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const profiles = await storage.getCompanyProfiles(organizationId);
    res.json({
      success: true,
      data: profiles
    });
  }));

  router.get("/:id", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const { profile, authorized } = await getCompanyProfileWithOrgCheck(req.params.id, organizationId);
    
    if (!authorized || !profile) {
      logger.warn('Cross-tenant company profile access attempt', {
        profileId: req.params.id,
        organizationId,
        ip: req.ip
      });
      throw new NotFoundError("Company profile not found");
    }
    
    res.json({
      success: true,
      data: profile
    });
  }));

  router.post("/", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, validateInput(insertCompanyProfileSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const validatedData = {
      ...req.body,
      organizationId
    };
    const profile = await storage.createCompanyProfile(validatedData);
    
    cache.invalidateByPattern('/api/company-profiles');
    
    res.status(201).json({
      success: true,
      data: profile
    });
  }));

  router.put("/:id", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, validateInput(insertCompanyProfileSchema.partial()), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const { profile: existingProfile, authorized } = await getCompanyProfileWithOrgCheck(req.params.id, organizationId);
    
    if (!authorized || !existingProfile) {
      logger.warn('Cross-tenant company profile update attempt', {
        profileId: req.params.id,
        organizationId,
        ip: req.ip
      });
      throw new NotFoundError("Company profile not found");
    }
    
    const profile = await storage.updateCompanyProfile(req.params.id, req.body);
    if (!profile) {
      throw new NotFoundError("Company profile not found");
    }
    
    cache.invalidateByPattern('/api/company-profiles');
    
    res.json({
      success: true,
      data: profile
    });
  }));

  router.patch("/:id", isAuthenticated, requireOrganization, validateInput(insertCompanyProfileSchema.partial()), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const { profile: existingProfile, authorized } = await getCompanyProfileWithOrgCheck(req.params.id, organizationId);
    
    if (!authorized || !existingProfile) {
      logger.warn('Cross-tenant company profile patch attempt', {
        profileId: req.params.id,
        organizationId,
        ip: req.ip
      });
      throw new NotFoundError("Company profile not found");
    }
    
    const profile = await storage.updateCompanyProfile(req.params.id, req.body);
    if (!profile) {
      throw new NotFoundError("Company profile not found");
    }
    
    cache.invalidateByPattern('/api/company-profiles');
    
    res.json({
      success: true,
      data: profile
    });
  }));

  router.post("/:id/extract-from-document", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const { profile, authorized } = await getCompanyProfileWithOrgCheck(req.params.id, organizationId);
    
    if (!authorized || !profile) {
      throw new NotFoundError("Company profile not found");
    }
    
    const { documentContent, documentType, filename } = req.body;
    
    if (!documentContent || !documentType || !filename) {
      throw new ValidationError("Document content, type, and filename are required");
    }

    const extracted = await companyDataExtractionService.extractFromDocument({
      documentContent,
      documentType,
      filename,
    });

    res.json({
      success: true,
      data: extracted
    });
  }));

  router.post("/:id/extract-from-website", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const { profile, authorized } = await getCompanyProfileWithOrgCheck(req.params.id, organizationId);
    
    if (!authorized || !profile) {
      throw new NotFoundError("Company profile not found");
    }
    
    const { url } = req.body;
    
    if (!url) {
      throw new ValidationError("Website URL is required");
    }

    const extracted = await companyDataExtractionService.extractFromWebsite({ url });
    res.json({
      success: true,
      data: extracted
    });
  }));

  router.post("/:id/research", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const { profile, authorized } = await getCompanyProfileWithOrgCheck(req.params.id, organizationId);
    
    if (!authorized || !profile) {
      throw new NotFoundError("Company profile not found");
    }

    const extracted = await companyDataExtractionService.researchCompany({
      companyName: profile.companyName,
      industry: profile.industry,
      headquarters: profile.headquarters,
    });

    res.json({
      success: true,
      data: extracted
    });
  }));
}

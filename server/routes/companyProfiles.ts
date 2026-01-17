import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';
import { logger } from '../utils/logger';
import { insertCompanyProfileSchema } from '@shared/schema';
import { companyDataExtractionService } from '../services/companyDataExtractionService';
import { cache } from '../middleware/production';
import { requireOrganization, getCompanyProfileWithOrgCheck, type MultiTenantRequest } from '../middleware/multiTenant';
import { asyncHandler, NotFoundError, ValidationError } from '../utils/routeHelpers';

export async function registerCompanyProfilesRoutes(router: Router) {
  const { requireMFA, enforceMFATimeout } = await import('../middleware/mfa');

  router.get("/", isAuthenticated, requireOrganization, asyncHandler(async (req: MultiTenantRequest, res) => {
    const organizationId = req.organizationId!;
    const profiles = await storage.getCompanyProfiles(organizationId);
    res.json(profiles);
  }));

  router.get("/:id", isAuthenticated, requireOrganization, asyncHandler(async (req: MultiTenantRequest, res) => {
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
    
    res.json(profile);
  }));

  router.post("/", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, asyncHandler(async (req: MultiTenantRequest, res) => {
    const organizationId = req.organizationId!;
    const validatedData = insertCompanyProfileSchema.parse({
      ...req.body,
      organizationId
    });
    const profile = await storage.createCompanyProfile(validatedData);
    
    cache.invalidateByPattern('/api/company-profiles');
    
    res.status(201).json(profile);
  }));

  router.put("/:id", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, asyncHandler(async (req: MultiTenantRequest, res) => {
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
    
    const validatedData = insertCompanyProfileSchema.partial().parse(req.body);
    const profile = await storage.updateCompanyProfile(req.params.id, validatedData);
    if (!profile) {
      throw new NotFoundError("Company profile not found");
    }
    
    cache.invalidateByPattern('/api/company-profiles');
    
    res.json(profile);
  }));

  router.patch("/:id", isAuthenticated, requireOrganization, asyncHandler(async (req: MultiTenantRequest, res) => {
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
    
    const validatedData = insertCompanyProfileSchema.partial().parse(req.body);
    const profile = await storage.updateCompanyProfile(req.params.id, validatedData);
    if (!profile) {
      throw new NotFoundError("Company profile not found");
    }
    
    cache.invalidateByPattern('/api/company-profiles');
    
    res.json(profile);
  }));

  router.post("/:id/extract-from-document", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, asyncHandler(async (req: MultiTenantRequest, res) => {
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

    res.json(extracted);
  }));

  router.post("/:id/extract-from-website", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, asyncHandler(async (req: MultiTenantRequest, res) => {
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
    res.json(extracted);
  }));

  router.post("/:id/research", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, asyncHandler(async (req: MultiTenantRequest, res) => {
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

    res.json(extracted);
  }));
}

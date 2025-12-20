import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';
import { logger } from '../utils/logger';
import { insertCompanyProfileSchema } from '@shared/schema';
import { companyDataExtractionService } from '../services/companyDataExtractionService';
import { validateBody } from '../middleware/routeValidation';
import { extractFromDocumentSchema, extractFromWebsiteSchema } from '../validation/schemas';
import { cache } from '../middleware/production';
import { requireOrganization, getCompanyProfileWithOrgCheck, type MultiTenantRequest } from '../middleware/multiTenant';

export async function registerCompanyProfilesRoutes(router: Router) {
  const { requireMFA, enforceMFATimeout } = await import('../middleware/mfa');

  router.get("/", isAuthenticated, requireOrganization, async (req: MultiTenantRequest, res) => {
    try {
      const organizationId = req.organizationId!;
      const profiles = await storage.getCompanyProfiles(organizationId);
      res.json(profiles);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error("Failed to fetch company profiles", { error: errorMessage });
      res.status(500).json({ message: "Failed to fetch company profiles" });
    }
  });

  router.get("/:id", isAuthenticated, requireOrganization, async (req: MultiTenantRequest, res) => {
    try {
      const organizationId = req.organizationId!;
      const { profile, authorized } = await getCompanyProfileWithOrgCheck(req.params.id, organizationId);
      
      if (!authorized || !profile) {
        logger.warn('Cross-tenant company profile access attempt', {
          profileId: req.params.id,
          organizationId,
          ip: req.ip
        });
        return res.status(404).json({ message: "Company profile not found" });
      }
      
      res.json(profile);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error("Failed to fetch company profile", { error: errorMessage, profileId: req.params.id });
      res.status(500).json({ message: "Failed to fetch company profile" });
    }
  });

  router.post("/", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, async (req: MultiTenantRequest, res) => {
    try {
      const organizationId = req.organizationId!;
      const validatedData = insertCompanyProfileSchema.parse({
        ...req.body,
        organizationId
      });
      const profile = await storage.createCompanyProfile(validatedData);
      
      cache.invalidateByPattern('/api/company-profiles');
      
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create company profile" });
    }
  });

  router.put("/:id", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, async (req: MultiTenantRequest, res) => {
    try {
      const organizationId = req.organizationId!;
      const { profile: existingProfile, authorized } = await getCompanyProfileWithOrgCheck(req.params.id, organizationId);
      
      if (!authorized || !existingProfile) {
        logger.warn('Cross-tenant company profile update attempt', {
          profileId: req.params.id,
          organizationId,
          ip: req.ip
        });
        return res.status(404).json({ message: "Company profile not found" });
      }
      
      const validatedData = insertCompanyProfileSchema.partial().parse(req.body);
      const profile = await storage.updateCompanyProfile(req.params.id, validatedData);
      if (!profile) {
        return res.status(404).json({ message: "Company profile not found" });
      }
      
      cache.invalidateByPattern('/api/company-profiles');
      
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update company profile" });
    }
  });

  router.patch("/:id", isAuthenticated, requireOrganization, async (req: MultiTenantRequest, res) => {
    try {
      const organizationId = req.organizationId!;
      const { profile: existingProfile, authorized } = await getCompanyProfileWithOrgCheck(req.params.id, organizationId);
      
      if (!authorized || !existingProfile) {
        logger.warn('Cross-tenant company profile patch attempt', {
          profileId: req.params.id,
          organizationId,
          ip: req.ip
        });
        return res.status(404).json({ message: "Company profile not found" });
      }
      
      const validatedData = insertCompanyProfileSchema.partial().parse(req.body);
      const profile = await storage.updateCompanyProfile(req.params.id, validatedData);
      if (!profile) {
        return res.status(404).json({ message: "Company profile not found" });
      }
      
      cache.invalidateByPattern('/api/company-profiles');
      
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update company profile" });
    }
  });

  router.post("/:id/extract-from-document", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, async (req: MultiTenantRequest, res) => {
    try {
      const organizationId = req.organizationId!;
      const { profile, authorized } = await getCompanyProfileWithOrgCheck(req.params.id, organizationId);
      
      if (!authorized || !profile) {
        return res.status(404).json({ message: "Company profile not found" });
      }
      
      const { documentContent, documentType, filename } = req.body;
      
      if (!documentContent || !documentType || !filename) {
        return res.status(400).json({ message: "Document content, type, and filename are required" });
      }

      const extracted = await companyDataExtractionService.extractFromDocument({
        documentContent,
        documentType,
        filename,
      });

      res.json(extracted);
    } catch (error) {
      logger.error("Document extraction failed:", error);
      res.status(500).json({ message: "Failed to extract data from document" });
    }
  });

  router.post("/:id/extract-from-website", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, async (req: MultiTenantRequest, res) => {
    try {
      const organizationId = req.organizationId!;
      const { profile, authorized } = await getCompanyProfileWithOrgCheck(req.params.id, organizationId);
      
      if (!authorized || !profile) {
        return res.status(404).json({ message: "Company profile not found" });
      }
      
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "Website URL is required" });
      }

      const extracted = await companyDataExtractionService.extractFromWebsite({ url });
      res.json(extracted);
    } catch (error) {
      logger.error("Website extraction failed:", error);
      res.status(500).json({ message: "Failed to extract data from website" });
    }
  });

  router.post("/:id/research", isAuthenticated, requireOrganization, requireMFA, enforceMFATimeout, async (req: MultiTenantRequest, res) => {
    try {
      const organizationId = req.organizationId!;
      const { profile, authorized } = await getCompanyProfileWithOrgCheck(req.params.id, organizationId);
      
      if (!authorized || !profile) {
        return res.status(404).json({ message: "Company profile not found" });
      }

      const extracted = await companyDataExtractionService.researchCompany({
        companyName: profile.companyName,
        industry: profile.industry,
        headquarters: profile.headquarters,
      });

      res.json(extracted);
    } catch (error) {
      logger.error("Company research failed:", error);
      res.status(500).json({ message: "Failed to research company" });
    }
  });
}

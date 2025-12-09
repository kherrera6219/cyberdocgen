import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';
import { logger } from '../utils/logger';
import { insertCompanyProfileSchema } from '@shared/schema';
import { companyDataExtractionService } from '../services/companyDataExtractionService';

export async function registerCompanyProfilesRoutes(router: Router) {
  const { requireMFA, enforceMFATimeout } = await import('../middleware/mfa');

  router.get("/", isAuthenticated, async (req: any, res) => {
    try {
      const profiles = await storage.getCompanyProfiles();
      res.json(profiles);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error("Failed to fetch company profiles", { error: errorMessage });
      res.status(500).json({ message: "Failed to fetch company profiles" });
    }
  });

  router.get("/:id", isAuthenticated, async (req: any, res) => {
    try {
      const profile = await storage.getCompanyProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: "Company profile not found" });
      }
      res.json(profile);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error("Failed to fetch company profile", { error: errorMessage, profileId: req.params.id });
      res.status(500).json({ message: "Failed to fetch company profile" });
    }
  });

  router.post("/", requireMFA, enforceMFATimeout, async (req: any, res) => {
    try {
      const validatedData = insertCompanyProfileSchema.parse(req.body);
      const profile = await storage.createCompanyProfile(validatedData);
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create company profile" });
    }
  });

  router.put("/:id", requireMFA, enforceMFATimeout, async (req: any, res) => {
    try {
      const validatedData = insertCompanyProfileSchema.partial().parse(req.body);
      const profile = await storage.updateCompanyProfile(req.params.id, validatedData);
      if (!profile) {
        return res.status(404).json({ message: "Company profile not found" });
      }
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update company profile" });
    }
  });

  router.post("/:id/extract-from-document", requireMFA, enforceMFATimeout, async (req: any, res) => {
    try {
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

  router.post("/:id/extract-from-website", requireMFA, enforceMFATimeout, async (req: any, res) => {
    try {
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

  router.post("/:id/research", requireMFA, enforceMFATimeout, async (req: any, res) => {
    try {
      const profile = await storage.getCompanyProfile(req.params.id);
      if (!profile) {
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

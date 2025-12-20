import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { isAuthenticated } from '../replitAuth';

// Validation schemas for control status updates
const controlStatusSchema = z.enum(["not_started", "in_progress", "implemented", "not_applicable"]);
const evidenceStatusSchema = z.enum(["none", "partial", "complete"]);

const updateControlStatusSchema = z.object({
  status: controlStatusSchema.optional(),
  evidenceStatus: evidenceStatusSchema.optional(),
  notes: z.string().nullable().optional(),
}).refine(
  (data) => data.status !== undefined || data.evidenceStatus !== undefined || data.notes !== undefined,
  { message: "At least one field (status, evidenceStatus, or notes) must be provided" }
);

const bulkUpdateSchema = z.object({
  updates: z.array(z.object({
    controlId: z.string().min(1),
    status: controlStatusSchema.optional(),
    evidenceStatus: evidenceStatusSchema.optional(),
    notes: z.string().nullable().optional(),
  }).refine(
    (data) => data.status !== undefined || data.evidenceStatus !== undefined || data.notes !== undefined,
    { message: "At least one field (status, evidenceStatus, or notes) must be provided for each update" }
  )).min(1, { message: "At least one update must be provided" }),
});

export function registerTemplatesRoutes(router: Router) {
  // Template listing is public (no auth required) - users can browse templates
  router.get('/', async (req: any, res) => {
    try {
      const { DocumentTemplateService } = await import('../services/documentTemplates');
      const { framework } = req.query;
      
      if (framework) {
        const templates = DocumentTemplateService.getTemplatesByFramework(framework as string);
        return res.json({ templates });
      }

      // Return both stats and all templates when no framework specified
      const stats = DocumentTemplateService.getTemplateStats();
      const allTemplates = DocumentTemplateService.getAllTemplates();
      res.json({ ...stats, templates: allTemplates });
    } catch (error: any) {
      logger.error("Failed to get templates", { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Individual template access is public (no auth required)
  router.get('/:templateId', async (req: any, res) => {
    try {
      const { DocumentTemplateService } = await import('../services/documentTemplates');
      const { templateId } = req.params;
      
      const template = DocumentTemplateService.getTemplateById(templateId);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      res.json({ template });
    } catch (error: any) {
      logger.error("Failed to get template", { error: error.message, templateId: req.params.templateId });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

export function registerFrameworksRoutes(router: Router) {
  router.get('/:framework/required-templates', isAuthenticated, async (req: any, res) => {
    try {
      const { DocumentTemplateService } = await import('../services/documentTemplates');
      const { framework } = req.params;
      
      const requiredTemplates = DocumentTemplateService.getRequiredTemplates(framework);
      
      res.json({ 
        framework,
        count: requiredTemplates.length,
        templates: requiredTemplates 
      });
    } catch (error: any) {
      logger.error("Failed to get required templates", { error: error.message, framework: req.params.framework });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  router.get("/:framework/stats", isAuthenticated, async (req: any, res) => {
    try {
      const { storage } = await import('../storage');
      const { frameworkTemplates } = await import('../services/openai');
      const { framework } = req.params;
      const { companyProfileId } = req.query;

      if (!companyProfileId) {
        return res.status(400).json({ message: "Company profile ID is required" });
      }

      const documents = await storage.getDocumentsByCompanyProfile(companyProfileId as string);
      const frameworkDocs = documents.filter(doc => doc.framework === framework);
      const templates = frameworkTemplates[framework] || [];
      
      const completedDocs = frameworkDocs.filter(doc => doc.status === 'complete').length;
      const totalDocs = templates.length;
      const progress = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

      res.json({
        framework,
        completed: completedDocs,
        total: totalDocs,
        progress,
        documents: frameworkDocs,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch framework statistics" });
    }
  });

  // Get control statuses for a framework
  router.get("/:framework/control-statuses", isAuthenticated, async (req: any, res) => {
    try {
      const { storage } = await import('../storage');
      const { framework } = req.params;
      const user = req.user;

      if (!user?.organizationId) {
        return res.status(400).json({ message: "Organization ID is required" });
      }

      const controlStatuses = await storage.getFrameworkControlStatuses(user.organizationId, framework);
      res.json(controlStatuses);
    } catch (error: any) {
      logger.error("Failed to get control statuses", { error: error.message, framework: req.params.framework });
      res.status(500).json({ message: "Failed to fetch control statuses" });
    }
  });

  // Update a specific control status
  router.put("/:framework/control-statuses/:controlId", isAuthenticated, async (req: any, res) => {
    try {
      const { storage } = await import('../storage');
      const { framework, controlId } = req.params;
      const user = req.user;

      if (!user?.organizationId) {
        return res.status(400).json({ message: "Organization ID is required" });
      }

      // Validate request body with Zod
      const parseResult = updateControlStatusSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body", 
          errors: parseResult.error.errors 
        });
      }

      const { status, evidenceStatus, notes } = parseResult.data;

      const updated = await storage.updateFrameworkControlStatus(
        user.organizationId,
        framework,
        controlId,
        { 
          status, 
          evidenceStatus, 
          notes,
          updatedBy: user.id 
        }
      );
      res.json(updated);
    } catch (error: any) {
      logger.error("Failed to update control status", { error: error.message, framework: req.params.framework, controlId: req.params.controlId });
      res.status(500).json({ message: "Failed to update control status" });
    }
  });

  // Bulk update control statuses
  router.post("/:framework/control-statuses/bulk", isAuthenticated, async (req: any, res) => {
    try {
      const { storage } = await import('../storage');
      const { framework } = req.params;
      const user = req.user;

      if (!user?.organizationId) {
        return res.status(400).json({ message: "Organization ID is required" });
      }

      // Validate request body with Zod
      const parseResult = bulkUpdateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body", 
          errors: parseResult.error.errors 
        });
      }

      const { updates } = parseResult.data;

      const results = await Promise.all(
        updates.map((update) => 
          storage.updateFrameworkControlStatus(
            user.organizationId,
            framework,
            update.controlId,
            { 
              status: update.status, 
              evidenceStatus: update.evidenceStatus, 
              notes: update.notes,
              updatedBy: user.id 
            }
          )
        )
      );

      res.json({ updated: results.length, statuses: results });
    } catch (error: any) {
      logger.error("Failed to bulk update control statuses", { error: error.message, framework: req.params.framework });
      res.status(500).json({ message: "Failed to bulk update control statuses" });
    }
  });
}

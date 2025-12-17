import { Router } from 'express';
import { logger } from '../utils/logger';
import { isAuthenticated } from '../replitAuth';

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
}

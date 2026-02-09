import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { isAuthenticated, getRequiredUserId } from '../replitAuth';
import { 
  secureHandler, 
  validateInput,
  ValidationError,
  NotFoundError
} from '../utils/errorHandling';
import { type MultiTenantRequest, requireOrganization } from '../middleware/multiTenant';

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
  /**
   * Get all templates (public - no auth required)
   */
  router.get('/', secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { DocumentTemplateService } = await import('../services/documentTemplates');
    const { framework } = req.query;
    
    if (framework) {
      const templates = DocumentTemplateService.getTemplatesByFramework(framework as string);
      res.json({ success: true, data: { templates } });
    } else {
      // Return both stats and all templates when no framework specified
      const stats = DocumentTemplateService.getTemplateStats();
      const allTemplates = DocumentTemplateService.getAllTemplates();
      res.json({ success: true, data: { ...stats, templates: allTemplates } });
    }
  }));

  /**
   * Get single template by ID (public - no auth required)
   */
  router.get('/:templateId', secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { DocumentTemplateService } = await import('../services/documentTemplates');
    const { templateId } = req.params;
    
    const template = DocumentTemplateService.getTemplateById(templateId);
    if (!template) {
      throw new NotFoundError('Template not found');
    }

    res.json({ success: true, data: { template } });
  }));
}

export function registerFrameworksRoutes(router: Router) {
  /**
   * Get required templates for a framework
   */
  router.get('/:framework/required-templates', isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { DocumentTemplateService } = await import('../services/documentTemplates');
    const { framework } = req.params;
    
    const requiredTemplates = DocumentTemplateService.getRequiredTemplates(framework);
    
    res.json({ 
      success: true,
      data: {
        framework,
        count: requiredTemplates.length,
        templates: requiredTemplates 
      }
    });
  }));

  /**
   * Get framework statistics
   */
  router.get("/:framework/stats", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { storage } = await import('../storage');
    const { frameworkTemplates } = await import('../services/openai');
    const { framework } = req.params;
    const { companyProfileId } = req.query;

    if (!companyProfileId) {
      throw new ValidationError("Company profile ID is required");
    }

    const documents = await storage.getDocumentsByCompanyProfile(companyProfileId as string);
    const frameworkDocs = documents.filter(doc => doc.framework === framework);
    const templateMap = new Map<string, any[]>(Object.entries(frameworkTemplates as Record<string, any[]>));
    const templates = templateMap.get(framework) || [];
    
    const completedDocs = frameworkDocs.filter(doc => doc.status === 'complete').length;
    const totalDocs = templates.length;
    const progress = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

    res.json({
      success: true,
      data: {
        framework,
        completed: completedDocs,
        total: totalDocs,
        progress,
        documents: frameworkDocs,
      }
    });
  }));

  /**
   * Get control statuses for a framework
   */
  router.get("/:framework/control-statuses", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { storage } = await import('../storage');
    const { framework } = req.params;
    const organizationId = req.organizationId!;

    const controlStatuses = await storage.getFrameworkControlStatuses(organizationId, framework);
    res.json({ success: true, data: controlStatuses });
  }));

  /**
   * Update a specific control status
   */
  router.put("/:framework/control-statuses/:controlId", isAuthenticated, requireOrganization, validateInput(updateControlStatusSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { storage } = await import('../storage');
    const { framework, controlId } = req.params;
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;

    const { status, evidenceStatus, notes } = req.body;

    const updated = await storage.updateFrameworkControlStatus(
      organizationId,
      framework,
      controlId,
      { 
        status, 
        evidenceStatus, 
        notes,
        updatedBy: userId 
      }
    );
    res.json({ success: true, data: updated });
  }, { audit: { action: 'update', entityType: 'controlStatus', getEntityId: (req) => req.params.controlId } }));

  /**
   * Bulk update control statuses
   */
  router.post("/:framework/control-statuses/bulk", isAuthenticated, requireOrganization, validateInput(bulkUpdateSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { storage } = await import('../storage');
    const { framework } = req.params;
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;

    const { updates } = req.body;

    type UpdateItem = {
      controlId: string;
      status?: "not_started" | "in_progress" | "implemented" | "not_applicable";
      evidenceStatus?: "none" | "partial" | "complete";
      notes?: string | null;
    };

    const results = await Promise.all(
      updates.map((update: UpdateItem) => 
        storage.updateFrameworkControlStatus(
          organizationId,
          framework,
          update.controlId,
          { 
            status: update.status, 
            evidenceStatus: update.evidenceStatus, 
            notes: update.notes,
            updatedBy: userId 
          }
        )
      )
    );

    res.json({ success: true, data: { updated: results.length, statuses: results } });
  }, { audit: { action: 'update', entityType: 'controlStatuses' } }));
}

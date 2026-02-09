import { Router, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { isAuthenticated, getRequiredUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { aiOrchestrator, type AIModel, type GenerationOptions } from '../services/aiOrchestrator';
import { frameworkTemplates } from '../services/openai';
import { generationLimiter } from '../middleware/security';
import { 
  secureHandler, 
  validateInput,
  ValidationError,
  NotFoundError
} from '../utils/errorHandling';
import { 
  type MultiTenantRequest, 
  requireOrganization,
  getCompanyProfileWithOrgCheck 
} from '../middleware/multiTenant';
import { generationJobCreateSchema } from '../validation/requestSchemas';

export function registerGenerationJobsRoutes(router: Router) {
  /**
   * Get all generation jobs (optionally filtered by company profile)
   */
  router.get("/", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { companyProfileId } = req.query;
    const organizationId = req.organizationId!;
    
    let jobs;
    if (companyProfileId) {
      // Validate company profile ownership
      const { authorized } = await getCompanyProfileWithOrgCheck(companyProfileId as string, organizationId);
      if (!authorized) {
        throw new NotFoundError("Company profile not found");
      }
      jobs = await storage.getGenerationJobsByCompanyProfile(companyProfileId as string);
    } else {
      jobs = await storage.getGenerationJobs(organizationId);
    }
    
    res.json({ success: true, data: jobs });
  }));

  /**
   * Get single generation job by ID
   */
  router.get("/:id", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const job = await storage.getGenerationJob(req.params.id);
    
    if (!job) {
      throw new NotFoundError("Generation job not found");
    }
    
    // Check if job belongs to organization via company profile
    const profile = await storage.getCompanyProfile(job.companyProfileId);
    if (!profile || profile.organizationId !== organizationId) {
      throw new NotFoundError("Generation job not found");
    }
    
    res.json({ success: true, data: job });
  }, { audit: { action: 'view', entityType: 'generationJob', getEntityId: (req) => req.params.id } }));
}

export function registerGenerateDocumentsRoutes(router: Router) {
  /**
   * Start async document generation job
   */
  router.post("/", generationLimiter, isAuthenticated, requireOrganization, validateInput(generationJobCreateSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { companyProfileId, framework, model = 'auto', includeQualityAnalysis = false, enableCrossValidation = false } = req.body;
    const organizationId = req.organizationId!;
    const userId = getRequiredUserId(req);

    const { profile: companyProfile, authorized } = await getCompanyProfileWithOrgCheck(companyProfileId, organizationId);
    if (!authorized || !companyProfile) {
      throw new NotFoundError("Company profile not found");
    }

    const frameworkTemplateMap = new Map(Object.entries(frameworkTemplates));
    const templates = frameworkTemplateMap.get(framework);
    if (!templates) {
      throw new ValidationError(`Invalid framework: ${framework}`);
    }

    const job = await storage.createGenerationJob({
      companyProfileId,
      createdBy: userId,
      framework,
      status: "running",
      progress: 0,
      documentsGenerated: 0,
      totalDocuments: templates.length,
    });

    // Background processing - fire and forget
    (async () => {
      try {
        const options: GenerationOptions = {
          model: model as AIModel,
          includeQualityAnalysis,
          enableCrossValidation
        };

        const documents = await aiOrchestrator.generateComplianceDocuments(
          companyProfile,
          framework,
          options,
          async (progress) => {
            await storage.updateGenerationJob(job.id, {
              progress: progress.progress,
              documentsGenerated: progress.completed,
              currentDocument: progress.currentDocument,
            });
          }
        );

        const templateQueue = [...templates];
        for (const result of documents) {
          const template = templateQueue.shift();
          if (!template) {
            break;
          }
          
          await storage.createDocument({
            companyProfileId,
            createdBy: userId,
            title: template.title,
            description: template.description,
            framework,
            category: template.category,
            content: result.content,
            status: "complete",
            aiGenerated: true,
            aiModel: result.model,
            generationPrompt: `Generated using ${result.model} with ${framework} framework`,
          });
        }

        await storage.updateGenerationJob(job.id, {
          status: "completed",
          progress: 100,
          documentsGenerated: templates.length,
        });

        logger.info('Document generation completed', { jobId: job.id, totalDocuments: templates.length });
      } catch (error) {
        logger.error("Document generation failed", { 
          jobId: job.id, 
          error: error instanceof Error ? error.message : String(error) 
        });
        await storage.updateGenerationJob(job.id, {
          status: "failed",
        });
      }
    })();

    res.status(202).json({ 
      success: true, 
      data: { 
        jobId: job.id, 
        message: "Enhanced document generation started" 
      } 
    });
  }, { audit: { action: 'create', entityType: 'generationJob' } }));
}

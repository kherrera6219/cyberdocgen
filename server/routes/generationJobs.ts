import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { isAuthenticated, getRequiredUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { aiOrchestrator, type AIModel, type GenerationOptions } from '../services/aiOrchestrator';
import { frameworkTemplates } from '../services/openai';
import { generationLimiter } from '../middleware/security';
import { validateBody } from '../middleware/routeValidation';
import { generationJobCreateSchema } from '../validation/requestSchemas';
import { 
  secureHandler, 
  requireAuth, 
  requireResource,
  ValidationError 
} from '../utils/errorHandling';

export function registerGenerationJobsRoutes(router: Router) {
  /**
   * Get all generation jobs (optionally filtered by company profile)
   */
  router.get("/", isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const { companyProfileId } = req.query;
    
    let jobs;
    if (companyProfileId) {
      jobs = await storage.getGenerationJobsByCompanyProfile(companyProfileId as string);
    } else {
      jobs = await storage.getGenerationJobs();
    }
    
    res.json({ success: true, data: jobs });
  }));

  /**
   * Get single generation job by ID
   */
  router.get("/:id", isAuthenticated, secureHandler(async (req: Request, res: Response) => {
    const job = await storage.getGenerationJob(req.params.id);
    requireResource(job, 'Generation job');
    res.json({ success: true, data: job });
  }, { audit: { action: 'view', entityType: 'generationJob', getEntityId: (req) => req.params.id } }));
}

export function registerGenerateDocumentsRoutes(router: Router) {
  /**
   * Start async document generation job
   */
  router.post("/", generationLimiter, isAuthenticated, validateBody(generationJobCreateSchema), secureHandler(async (req: Request, res: Response) => {
    const { companyProfileId, framework, model = 'auto', includeQualityAnalysis = false, enableCrossValidation = false } = req.body;
    const userId = requireAuth(req);

    const companyProfile = await storage.getCompanyProfile(companyProfileId);
    requireResource(companyProfile, 'Company profile');

    const templates = frameworkTemplates[framework];
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

        for (let i = 0; i < documents.length; i++) {
          const template = templates[i];
          const result = documents[i];
          
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

import { Router } from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';
import { logger } from '../utils/logger';
import { aiOrchestrator, type AIModel, type GenerationOptions } from '../services/aiOrchestrator';
import { frameworkTemplates } from '../services/openai';
import { generationLimiter } from '../middleware/security';
import { validateBody } from '../middleware/routeValidation';
import { generationJobCreateSchema } from '../validation/requestSchemas';

export function registerGenerationJobsRoutes(router: Router) {
  router.get("/", isAuthenticated, async (req: any, res) => {
    try {
      const { companyProfileId } = req.query;
      
      let jobs;
      if (companyProfileId) {
        jobs = await storage.getGenerationJobsByCompanyProfile(companyProfileId as string);
      } else {
        jobs = await storage.getGenerationJobs();
      }
      
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch generation jobs" });
    }
  });

  router.get("/:id", isAuthenticated, async (req: any, res) => {
    try {
      const job = await storage.getGenerationJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Generation job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch generation job" });
    }
  });
}

export function registerGenerateDocumentsRoutes(router: Router) {
  router.post("/", generationLimiter, isAuthenticated, validateBody(generationJobCreateSchema), async (req: any, res) => {
    try {
      const { companyProfileId, framework, model = 'auto', includeQualityAnalysis = false, enableCrossValidation = false } = req.body;
      const userId = req.user.claims.sub;

      const companyProfile = await storage.getCompanyProfile(companyProfileId);
      if (!companyProfile) {
        return res.status(404).json({ message: "Company profile not found" });
      }

      const templates = frameworkTemplates[framework];
      if (!templates) {
        return res.status(400).json({ message: `Invalid framework: ${framework}` });
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
        } catch (error) {
          logger.error("Document generation failed:", error);
          await storage.updateGenerationJob(job.id, {
            status: "failed",
          });
        }
      })();

      res.status(202).json({ jobId: job.id, message: "Enhanced document generation started" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start document generation" });
    }
  });
}

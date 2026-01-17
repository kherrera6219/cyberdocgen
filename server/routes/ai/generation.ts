// AI Generation Routes
// Document generation and job management
import { Router } from 'express';
import { storage } from '../../storage';
import { aiOrchestrator } from '../../services/aiOrchestrator';
import {
  isAuthenticated,
  getRequiredUserId,
  asyncHandler,
  NotFoundError,
  validateBody,
  validateAIRequestSize,
  generationLimiter
} from './shared';
import { generateComplianceDocsSchema } from '../../validation/requestSchemas';

export function registerGenerationRoutes(router: Router) {
  /**
   * POST /api/ai/generate-compliance-docs
   * Start asynchronous document generation job
   */
  router.post('/generate-compliance-docs', isAuthenticated, generationLimiter, validateAIRequestSize, validateBody(generateComplianceDocsSchema), asyncHandler(async (req, res) => {
    const { companyInfo, frameworks, soc2Options, fedrampOptions } = req.body;
    const userId = getRequiredUserId(req);
    
    const userOrgs = await storage.getUserOrganizations(userId);
    let organizationId = userOrgs[0]?.organizationId;
    
    if (!organizationId) {
      const org = await storage.createOrganization({
        name: companyInfo.companyName,
        slug: companyInfo.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()
      });
      await storage.addUserToOrganization({
        userId,
        organizationId: org.id,
        role: 'owner'
      });
      organizationId = org.id;
    }
    
    const companyProfile = await storage.createCompanyProfile({
      organizationId,
      createdBy: userId,
      companyName: companyInfo.companyName,
      industry: companyInfo.industry || 'Technology',
      companySize: companyInfo.companySize || '51-200',
      headquarters: companyInfo.headquarters || 'United States',
      cloudInfrastructure: companyInfo.cloudProviders || ['AWS'],
      dataClassification: companyInfo.dataClassification || 'Confidential',
      businessApplications: companyInfo.businessApplications || 'Enterprise applications',
      complianceFrameworks: frameworks,
      frameworkConfigs: {
        soc2: soc2Options ? {
          trustServices: soc2Options.trustPrinciples || ['security'],
          reportType: 'type2' as const
        } : undefined,
        fedramp: fedrampOptions ? {
          level: (fedrampOptions.impactLevel || 'moderate') as 'low' | 'moderate' | 'high',
          impactLevel: {
            confidentiality: (fedrampOptions.impactLevel || 'moderate') as 'low' | 'moderate' | 'high',
            integrity: (fedrampOptions.impactLevel || 'moderate') as 'low' | 'moderate' | 'high',
            availability: (fedrampOptions.impactLevel || 'moderate') as 'low' | 'moderate' | 'high'
          },
          selectedControls: []
        } : undefined
      }
    });

    const job = await storage.createGenerationJob({
      companyProfileId: companyProfile.id,
      createdBy: userId,
      framework: frameworks.join(', '),
      status: 'running',
      progress: 0,
      documentsGenerated: 0,
      totalDocuments: frameworks.length * 3
    });

    res.json({ 
      success: true, 
      jobId: job.id,
      companyProfileId: companyProfile.id,
      message: 'Document generation started',
      estimatedDocuments: frameworks.length * 3
    });

    // Start generation in background
    (async () => {
      try {
        const generatedDocs: any[] = [];
        
        for (const framework of frameworks) {
          const profileForAI = {
            ...companyProfile,
            cloudInfrastructure: companyProfile.cloudInfrastructure || []
          };
          
          const results = await aiOrchestrator.generateComplianceDocuments(
            profileForAI as any,
            framework,
            { model: 'auto', includeQualityAnalysis: true },
            (p) => {
              const progress = Math.round((frameworks.indexOf(framework) / frameworks.length) * 100 + (p.progress / frameworks.length));
              storage.updateGenerationJob(job.id, { progress, documentsGenerated: generatedDocs.length });
            }
          );
          
          for (const result of results) {
            const doc = await storage.createDocument({
              companyProfileId: companyProfile.id,
              createdBy: userId,
              title: `${framework} - Generated Document`,
              framework,
              category: 'policy',
              content: result.content,
              documentType: 'text',
              status: 'draft',
              aiGenerated: true,
              aiModel: result.model
            });
            generatedDocs.push({ ...doc, qualityScore: result.qualityScore });
          }
        }
        
        await storage.updateGenerationJob(job.id, { 
          status: 'completed', 
          progress: 100,
          documentsGenerated: generatedDocs.length,
          completedAt: new Date()
        });
      } catch (error) {
        await storage.updateGenerationJob(job.id, { 
          status: 'failed', 
          errorMessage: error instanceof Error ? error.message : 'Generation failed'
        });
      }
    })();
  }));

  /**
   * GET /api/ai/generation-jobs/:id
   * Get job status
   */
  router.get('/generation-jobs/:id', isAuthenticated, asyncHandler(async (req, res) => {
    const job = await storage.getGenerationJob(req.params.id);
    if (!job) {
      throw new NotFoundError("Job not found");
    }
    res.json(job);
  }));
}

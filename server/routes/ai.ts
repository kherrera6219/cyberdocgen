import { Router } from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';
import { logger } from '../utils/logger';
import { aiOrchestrator, type AIModel, type GenerationOptions } from '../services/aiOrchestrator';
import { documentAnalysisService } from '../services/documentAnalysis';
import { complianceChatbot } from '../services/chatbot';
import { riskAssessmentService } from '../services/riskAssessment';
import { qualityScoringService } from '../services/qualityScoring';
import { auditService } from '../services/auditService';
import { metricsCollector } from '../monitoring/metrics';
import { generationLimiter } from '../middleware/security';
import { frameworkTemplates } from '../services/openai';
import { validateBody } from '../middleware/routeValidation';
import {
  analyzeQualitySchema,
  generateInsightsSchema,
  generateComplianceDocsSchema,
  chatMessageSchema,
  analyzeDocumentSchema,
  extractProfileSchema,
  riskAssessmentSchema,
  threatAnalysisSchema,
  qualityScoreSchema,
  frameworkAlignmentSchema,
  fineTuneSchema,
  generateOptimizedSchema,
  assessRisksSchema,
  analyzeImageSchema,
  multimodalChatSchema
} from '../validation/schemas';
import { analyzeImage, analyzeMultipleImages } from '../services/geminiVision';

export function registerAIRoutes(router: Router) {
  router.get("/models", isAuthenticated, async (req: any, res) => {
    try {
      const models = aiOrchestrator.getAvailableModels();
      res.json({ models });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available models" });
    }
  });

  router.post("/analyze-quality", isAuthenticated, validateBody(analyzeQualitySchema), async (req: any, res) => {
    try {
      const { content, framework } = req.body;

      const analysis = await aiOrchestrator.analyzeQuality(content, framework);
      metricsCollector.trackAIOperation('analysis', true);
      res.json(analysis);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error("Quality analysis failed", { error: errorMessage });
      res.status(500).json({ message: "Failed to analyze document quality" });
    }
  });

  router.post("/generate-insights", isAuthenticated, validateBody(generateInsightsSchema), async (req: any, res) => {
    try {
      const { companyProfileId, framework } = req.body;
      const userId = req.user.claims.sub;

      const companyProfile = await storage.getCompanyProfile(companyProfileId);
      if (!companyProfile) {
        return res.status(404).json({ message: "Company profile not found" });
      }

      const insights = await aiOrchestrator.generateInsights(companyProfile, framework);
      
      metricsCollector.trackAIOperation('analysis', true);
      await auditService.logAction({
        action: "generate_insights",
        entityType: "company_profile",
        entityId: companyProfileId,
        userId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: { framework, riskScore: insights.riskScore }
      });

      res.json(insights);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error("Insight generation failed", { error: errorMessage });
      res.status(500).json({ message: "Failed to generate compliance insights" });
    }
  });

  router.post('/generate-compliance-docs', isAuthenticated, generationLimiter, validateBody(generateComplianceDocsSchema), async (req: any, res) => {
    try {
      const { companyInfo, frameworks, soc2Options, fedrampOptions } = req.body;
      const userId = req.user.claims.sub;
      
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
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error starting document generation', { error: errorMessage });
      res.status(500).json({ message: 'Failed to start document generation' });
    }
  });

  router.get('/generation-jobs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const job = await storage.getGenerationJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get job status' });
    }
  });

  router.post("/analyze-document", isAuthenticated, validateBody(analyzeDocumentSchema), async (req: any, res) => {
    try {
      const { content, filename, framework } = req.body;

      const analysis = await documentAnalysisService.analyzeDocument(content, filename, framework);
      
      await auditService.logAction({
        action: "analyze",
        entityType: "document",
        entityId: filename,
        userId: req.user.claims.sub,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { framework, analysisType: "document" }
      });

      res.json(analysis);
    } catch (error: any) {
      logger.error("Document analysis failed", { error: error.message, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: "Failed to analyze document" });
    }
  });

  router.post("/extract-profile", isAuthenticated, validateBody(extractProfileSchema), async (req: any, res) => {
    try {
      const { content } = req.body;

      const extractedProfile = await documentAnalysisService.extractCompanyProfile(content);
      
      await auditService.logAction({
        action: "extract",
        entityType: "company_profile",
        entityId: `profile_${Date.now()}`,
        userId: req.user.claims.sub,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { extractionType: "profile" }
      });

      res.json(extractedProfile);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Profile extraction failed", { error: errorMessage, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: "Failed to extract profile" });
    }
  });

  router.post("/chat", isAuthenticated, validateBody(chatMessageSchema), async (req: any, res) => {
    try {
      const { message, framework, sessionId } = req.body;

      const response = await complianceChatbot.processMessage(
        message,
        req.user.claims.sub,
        sessionId,
        framework
      );
      
      await auditService.logAction({
        action: "chat",
        entityType: "ai_conversation",
        entityId: sessionId || `chat_${Date.now()}`,
        userId: req.user.claims.sub,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { framework, messageLength: message.length }
      });

      res.json(response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Chat processing failed", { error: errorMessage, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  router.get("/chat/suggestions", isAuthenticated, async (req: any, res) => {
    try {
      const framework = req.query.framework as string;
      const suggestions = complianceChatbot.getSuggestedQuestions(framework);
      res.json(suggestions);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Chat suggestions failed", { error: errorMessage, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: "Failed to get chat suggestions" });
    }
  });

  router.post("/risk-assessment", isAuthenticated, validateBody(riskAssessmentSchema), async (req: any, res) => {
    try {
      const { frameworks, includeDocuments } = req.body;
      const userId = req.user.claims.sub;

      const companyProfile = await storage.getCompanyProfile(userId);
      if (!companyProfile) {
        return res.status(400).json({ message: "Company profile is required for risk assessment" });
      }

      let existingDocuments: string[] = [];
      if (includeDocuments) {
        const documents = await storage.getDocuments();
        const userDocs = documents.filter((doc: any) => doc.userId === userId);
        existingDocuments = userDocs.map((doc: any) => doc.title);
      }

      const assessment = await riskAssessmentService.assessOrganizationalRisk(
        companyProfile,
        frameworks,
        existingDocuments
      );
      
      await auditService.logAction({
        action: "assess",
        entityType: "risk_assessment",
        entityId: `risk_${Date.now()}`,
        userId: req.user.claims.sub,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { frameworks, includeDocuments }
      });

      res.json(assessment);
    } catch (error: any) {
      logger.error("Risk assessment failed", { error: error.message, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: "Failed to conduct risk assessment" });
    }
  });

  router.post("/threat-analysis", isAuthenticated, validateBody(threatAnalysisSchema), async (req: any, res) => {
    try {
      const { industry, companySize, frameworks } = req.body;

      const threatAnalysis = await riskAssessmentService.analyzeThreatLandscape(
        industry,
        companySize,
        frameworks
      );
      
      await auditService.logAction({
        action: "analyze",
        entityType: "threat_landscape",
        entityId: `threat_${Date.now()}`,
        userId: req.user.claims.sub,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { industry, companySize, frameworks }
      });

      res.json(threatAnalysis);
    } catch (error: any) {
      logger.error("Threat analysis failed", { error: error.message, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: "Failed to analyze threat landscape" });
    }
  });

  router.post("/quality-score", isAuthenticated, validateBody(qualityScoreSchema), async (req: any, res) => {
    try {
      const { content, title, framework, documentType } = req.body;

      const qualityScore = await qualityScoringService.analyzeDocumentQuality(
        content,
        title,
        framework,
        documentType
      );
      
      await auditService.logAction({
        action: "score",
        entityType: "document_quality",
        entityId: `quality_${Date.now()}`,
        userId: req.user.claims.sub,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { title, framework, documentType, score: qualityScore.overallScore }
      });

      res.json(qualityScore);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Quality scoring failed", { error: errorMessage, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: "Failed to analyze document quality" });
    }
  });

  router.post("/framework-alignment", isAuthenticated, validateBody(frameworkAlignmentSchema), async (req: any, res) => {
    try {
      const { content, framework, documentType } = req.body;

      const alignment = await qualityScoringService.checkFrameworkAlignment(
        content,
        framework,
        documentType
      );
      
      res.json(alignment);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Framework alignment check failed", { error: errorMessage, userId: req.user?.claims?.sub }, req);
      res.status(500).json({ message: "Failed to check framework alignment" });
    }
  });

  router.get("/industries", isAuthenticated, async (req, res) => {
    try {
      const { AIFineTuningService } = await import('../services/aiFineTuningService');
      const service = new AIFineTuningService();
      const configurations = service.getIndustryConfigurations();
      res.json({ success: true, configurations });
    } catch (error) {
      logger.error("Error fetching industry configurations:", error);
      res.status(500).json({ success: false, error: "Failed to fetch configurations" });
    }
  });

  router.get("/industries/:industryId", isAuthenticated, async (req, res) => {
    try {
      const { AIFineTuningService } = await import('../services/aiFineTuningService');
      const service = new AIFineTuningService();
      const configuration = service.getIndustryConfiguration(req.params.industryId);
      
      if (!configuration) {
        return res.status(404).json({ success: false, error: "Industry not found" });
      }
      
      res.json({ success: true, configuration });
    } catch (error) {
      logger.error("Error fetching industry configuration:", error);
      res.status(500).json({ success: false, error: "Failed to fetch configuration" });
    }
  });

  router.post("/fine-tune", isAuthenticated, validateBody(fineTuneSchema), async (req: any, res) => {
    try {
      const { industryId, requirements, customInstructions, priority } = req.body;
      const userId = req.user?.claims?.sub;

      const { AIFineTuningService } = await import('../services/aiFineTuningService');
      const service = new AIFineTuningService();
      
      const result = await service.createCustomConfiguration({
        industryId,
        organizationId: userId,
        requirements: Array.isArray(requirements) ? requirements : [requirements],
        customInstructions,
        priority: priority || 'medium'
      });

      await storage.createAuditEntry({
        userId,
        action: "ai_fine_tuning_created",
        entityType: "ai_configuration",
        entityId: result.configId,
        metadata: { industryId, accuracy: result.accuracy, requirements, customInstructions, priority }
      });

      res.json({ success: true, result });
    } catch (error) {
      logger.error("Error creating fine-tuning configuration:", error);
      res.status(500).json({ success: false, error: "Failed to create configuration" });
    }
  });

  router.post("/generate-optimized", isAuthenticated, validateBody(generateOptimizedSchema), async (req: any, res) => {
    try {
      const { configId, documentType, context } = req.body;
      const userId = req.user?.claims?.sub;

      const { AIFineTuningService } = await import('../services/aiFineTuningService');
      const service = new AIFineTuningService();
      
      const generatedContent = await service.generateOptimizedDocument(
        configId || `default-${context.industry}`,
        documentType,
        context
      );

      await storage.createAuditEntry({
        userId,
        action: "ai_optimized_generation",
        entityType: "document",
        entityId: `opt-${Date.now()}`,
        metadata: { documentType, industry: context.industry, configId, context }
      });

      res.json({ success: true, content: generatedContent });
    } catch (error) {
      logger.error("Error generating optimized document:", error);
      res.status(500).json({ success: false, error: "Failed to generate document" });
    }
  });

  router.post("/assess-risks", isAuthenticated, validateBody(assessRisksSchema), async (req: any, res) => {
    try {
      const { industryId, organizationContext } = req.body;
      const userId = req.user?.claims?.sub;

      const { AIFineTuningService } = await import('../services/aiFineTuningService');
      const service = new AIFineTuningService();
      
      const riskAssessment = await service.assessIndustryRisks(industryId, organizationContext);

      await storage.createAuditEntry({
        userId,
        action: "ai_risk_assessment",
        entityType: "risk_assessment",
        entityId: `risk-${Date.now()}`,
        metadata: { industryId, riskScore: riskAssessment.riskScore, organizationContext, identifiedRisks: riskAssessment.identifiedRisks.length }
      });

      res.json({ success: true, assessment: riskAssessment });
    } catch (error) {
      logger.error("Error assessing industry risks:", error);
      res.status(500).json({ success: false, error: "Failed to assess risks" });
    }
  });

  router.post("/analyze-image", isAuthenticated, validateBody(analyzeImageSchema), async (req: any, res) => {
    const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    
    try {
      const { imageData, prompt, framework, analysisType } = req.body;
      const userId = req.user?.claims?.sub;

      // Validate image data format and extract MIME type
      let mimeType = 'image/png';
      if (imageData.startsWith('data:')) {
        const matches = imageData.match(/^data:([^;]+);base64,/);
        if (matches) {
          mimeType = matches[1];
        }
      }
      
      // Validate MIME type
      if (!SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
        return res.status(400).json({
          success: false,
          message: `Unsupported image format: ${mimeType}. Supported formats: PNG, JPEG, GIF, WebP`
        });
      }
      
      // Validate data size (rough check for base64)
      const base64Length = imageData.includes(',') 
        ? imageData.split(',')[1].length 
        : imageData.length;
      const estimatedSize = base64Length * 0.75;
      
      if (estimatedSize > 20 * 1024 * 1024) { // 20MB limit
        return res.status(400).json({
          success: false,
          message: "Image file is too large. Maximum size is 20MB."
        });
      }

      const result = await analyzeImage(imageData, {
        prompt,
        framework,
        analysisType
      });

      metricsCollector.trackAIOperation('vision_analysis', true);
      await auditService.logAction({
        action: "analyze_image",
        entityType: "image",
        entityId: `img_${Date.now()}`,
        userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { analysisType, framework, mimeType, hasComplianceRelevance: !!result.complianceRelevance }
      });

      res.json({ success: true, ...result });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error("Image analysis failed", { error: errorMessage, userId: req.user?.claims?.sub });
      
      metricsCollector.trackAIOperation('vision_analysis', false);
      
      if (errorMessage.includes('GOOGLE_API_KEY')) {
        res.status(503).json({ 
          success: false, 
          message: "Image analysis service is temporarily unavailable. Please try again later." 
        });
      } else if (errorMessage.includes('Invalid') || errorMessage.includes('format')) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid image format. Please upload a valid image file." 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Failed to analyze image. Please try again." 
        });
      }
    }
  });

  router.post("/multimodal-chat", isAuthenticated, validateBody(multimodalChatSchema), async (req: any, res) => {
    const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
    
    try {
      const { message, framework, sessionId, attachments } = req.body;
      const userId = req.user?.claims?.sub;

      let imageAnalysisResults: any[] = [];
      const unsupportedFiles: string[] = [];
      const documentContents: string[] = [];
      
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          const { type, content, name } = attachment;
          
          if (!content) continue;
          
          // Check size (base64 is ~1.37x the original size)
          const estimatedSize = (content.length * 0.75);
          if (estimatedSize > MAX_ATTACHMENT_SIZE) {
            unsupportedFiles.push(`${name} (file too large)`);
            continue;
          }
          
          if (SUPPORTED_IMAGE_TYPES.includes(type)) {
            // Process as image
            try {
              const result = await analyzeImage(content, {
                framework,
                analysisType: 'compliance',
                prompt: `Analyze this image in the context of the user's message: "${message}"`
              });
              imageAnalysisResults.push({
                fileName: name,
                ...result
              });
            } catch (imgError) {
              logger.warn('Failed to analyze image attachment', { name, error: imgError });
              unsupportedFiles.push(`${name} (analysis failed)`);
            }
          } else if (type === 'application/pdf' || type?.includes('document')) {
            // For documents, note them but don't process through vision API
            documentContents.push(`[Document attached: ${name}]`);
          } else {
            unsupportedFiles.push(`${name} (unsupported type: ${type})`);
          }
        }
      }

      // Build enhanced message with context from attachments
      let enhancedMessage = message;
      
      if (imageAnalysisResults.length > 0) {
        enhancedMessage += '\n\n[Image Analysis Results]:\n';
        imageAnalysisResults.forEach((result, i) => {
          const truncatedAnalysis = result.analysis.length > 1000 
            ? result.analysis.substring(0, 1000) + '...' 
            : result.analysis;
          enhancedMessage += `\nImage "${result.fileName}": ${truncatedAnalysis}`;
          
          if (result.complianceRelevance) {
            const { controls, risks, recommendations } = result.complianceRelevance;
            if (controls?.length) enhancedMessage += `\n  Controls: ${controls.join(', ')}`;
            if (risks?.length) enhancedMessage += `\n  Risks: ${risks.slice(0, 3).join('; ')}`;
            if (recommendations?.length) enhancedMessage += `\n  Recommendations: ${recommendations.slice(0, 3).join('; ')}`;
          }
        });
      }
      
      if (documentContents.length > 0) {
        enhancedMessage += '\n\n' + documentContents.join('\n');
      }

      const response = await complianceChatbot.processMessage(
        enhancedMessage,
        userId,
        sessionId,
        framework
      );

      metricsCollector.trackAIOperation('multimodal_chat', true);
      await auditService.logAction({
        action: "multimodal_chat",
        entityType: "ai_conversation",
        entityId: sessionId || `chat_${Date.now()}`,
        userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { 
          framework, 
          messageLength: message.length,
          attachmentCount: attachments?.length || 0,
          imageAnalysisCount: imageAnalysisResults.length,
          unsupportedFiles: unsupportedFiles.length
        }
      });

      res.json({
        ...response,
        imageAnalysis: imageAnalysisResults.length > 0 ? imageAnalysisResults : undefined,
        unsupportedFiles: unsupportedFiles.length > 0 ? unsupportedFiles : undefined
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Multimodal chat processing failed", { error: errorMessage, userId: req.user?.claims?.sub });
      
      // Return user-safe error message
      if (errorMessage.includes('GOOGLE_API_KEY')) {
        res.status(503).json({ 
          success: false,
          message: "Image analysis service temporarily unavailable. Your message was received but attachments could not be analyzed."
        });
      } else {
        res.status(500).json({ 
          success: false,
          message: "Failed to process your message. Please try again." 
        });
      }
    }
  });

  /**
   * @openapi
   * /api/ai/stats:
   *   get:
   *     tags: [AI]
   *     summary: Get AI usage statistics
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: AI statistics retrieved
   *       401:
   *         description: Unauthorized
   */
  router.get("/stats", isAuthenticated, async (req: any, res) => {
    // TODO: Implement AI statistics tracking
    res.status(501).json({ message: 'AI statistics not yet implemented' });
  });
}

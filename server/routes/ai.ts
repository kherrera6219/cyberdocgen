import { Router } from 'express';
import { storage } from '../storage';
import { isAuthenticated, getRequiredUserId, getUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { asyncHandler, AppError, ValidationError, NotFoundError, ForbiddenError } from '../utils/routeHelpers';
import { db } from '../db';
import { aiGuardrailsLogs, aiUsageDisclosures, documents, frameworkControlStatuses } from '@shared/schema';
import { eq, count, sql } from 'drizzle-orm';
import { aiOrchestrator } from '../services/aiOrchestrator';
import { documentAnalysisService } from '../services/documentAnalysis';
import { complianceChatbot } from '../services/chatbot';
import { riskAssessmentService } from '../services/riskAssessment';
import { qualityScoringService } from '../services/qualityScoring';
import { auditService } from '../services/auditService';
import { metricsCollector } from '../monitoring/metrics';
import { generationLimiter } from '../middleware/security';
import { validateBody } from '../middleware/routeValidation';
import { aiGuardrailsService } from '../services/aiGuardrailsService';
import { validateAIRequestSize, aiLimiter } from '../middleware/rateLimiter';
import crypto from 'crypto';
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
} from '../validation/requestSchemas';
import { analyzeImage } from '../services/geminiVision';

export function registerAIRoutes(router: Router) {
  router.get("/models", isAuthenticated, asyncHandler(async (req, res) => {
    const models = aiOrchestrator.getAvailableModels();
    res.json({ models });
  }));

  router.post("/analyze-quality", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(analyzeQualitySchema), asyncHandler(async (req, res) => {
    const { content, framework } = req.body;
    const userId = getUserId(req);
    const requestId = crypto.randomUUID();

    // Run guardrails check on user input
    const guardrailResult = await aiGuardrailsService.checkGuardrails(content, null, {
      userId: userId || undefined,
      requestId,
      modelProvider: 'openai',
      modelName: 'gpt-4o-mini',
      ipAddress: req.ip
    });

    if (!guardrailResult.allowed) {
      logger.warn("AI request blocked by guardrails", { 
        userId, 
        action: guardrailResult.action,
        severity: guardrailResult.severity 
      });
      throw new ForbiddenError("Request blocked for security reasons", { action: guardrailResult.action });
    }

    // Use sanitized content
    const sanitizedContent = guardrailResult.sanitizedPrompt || content;
    const analysis = await aiOrchestrator.analyzeQuality(sanitizedContent, framework);
    metricsCollector.trackAIOperation('analysis', true);
    res.json(analysis);
  }));

  router.post("/generate-insights", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(generateInsightsSchema), asyncHandler(async (req, res) => {
    const { companyProfileId, framework } = req.body;
    const userId = getRequiredUserId(req);

    const companyProfile = await storage.getCompanyProfile(companyProfileId);
    if (!companyProfile) {
      throw new NotFoundError("Company profile not found");
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
  }));

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

  router.get('/generation-jobs/:id', isAuthenticated, asyncHandler(async (req, res) => {
    const job = await storage.getGenerationJob(req.params.id);
    if (!job) {
      throw new NotFoundError("Job not found");
    }
    res.json(job);
  }));

  router.post("/analyze-document", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(analyzeDocumentSchema), asyncHandler(async (req, res) => {
    const { content, filename, framework } = req.body;
    const userId = getUserId(req);
    const requestId = crypto.randomUUID();

    // Run guardrails check on document content
    const guardrailResult = await aiGuardrailsService.checkGuardrails(content, null, {
      userId: userId || undefined,
      requestId,
      modelProvider: 'openai',
      modelName: 'gpt-4o-mini',
      ipAddress: req.ip
    });

    if (!guardrailResult.allowed) {
      logger.warn("Document analysis blocked by guardrails", { 
        userId, 
        action: guardrailResult.action,
        severity: guardrailResult.severity 
      });
      throw new ForbiddenError("Document content blocked for security reasons", { action: guardrailResult.action });
    }

    // Use sanitized content
    const sanitizedContent = guardrailResult.sanitizedPrompt || content;
    const analysis = await documentAnalysisService.analyzeDocument(sanitizedContent, filename, framework);
    
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
  }));

  router.post("/extract-profile", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(extractProfileSchema), asyncHandler(async (req, res) => {
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
  }));

  router.post("/chat", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(chatMessageSchema), asyncHandler(async (req, res) => {
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
  }));

  router.get("/chat/suggestions", isAuthenticated, asyncHandler(async (req, res) => {
    const framework = req.query.framework as string;
    const suggestions = complianceChatbot.getSuggestedQuestions(framework);
    res.json(suggestions);
  }));

  router.post("/risk-assessment", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(riskAssessmentSchema), asyncHandler(async (req, res) => {
    const { frameworks, includeDocuments } = req.body;
    const userId = getRequiredUserId(req);

    const companyProfile = await storage.getCompanyProfile(userId);
    if (!companyProfile) {
      throw new ValidationError("Company profile is required for risk assessment");
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
  }));

  router.post("/threat-analysis", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(threatAnalysisSchema), asyncHandler(async (req, res) => {
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
  }));

  router.post("/quality-score", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(qualityScoreSchema), asyncHandler(async (req, res) => {
    const { content, title, framework, documentType } = req.body;
    const userId = getUserId(req);
    const requestId = crypto.randomUUID();

    // Run guardrails check on document content
    const guardrailResult = await aiGuardrailsService.checkGuardrails(content, null, {
      userId: userId || undefined,
      requestId,
      modelProvider: 'openai',
      modelName: 'gpt-4o-mini',
      ipAddress: req.ip
    });

    if (!guardrailResult.allowed) {
      logger.warn("Quality scoring blocked by guardrails", { 
        userId, 
        action: guardrailResult.action,
        severity: guardrailResult.severity 
      });
      throw new ForbiddenError("Content blocked for security reasons", { action: guardrailResult.action });
    }

    const sanitizedContent = guardrailResult.sanitizedPrompt || content;

    const qualityScore = await qualityScoringService.analyzeDocumentQuality(
      sanitizedContent,
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
  }));

  router.post("/framework-alignment", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(frameworkAlignmentSchema), asyncHandler(async (req, res) => {
    const { content, framework, documentType } = req.body;
    const userId = getUserId(req);
    const requestId = crypto.randomUUID();

    // Run guardrails check on document content
    const guardrailResult = await aiGuardrailsService.checkGuardrails(content, null, {
      userId: userId || undefined,
      requestId,
      modelProvider: 'openai',
      modelName: 'gpt-4o-mini',
      ipAddress: req.ip
    });

    if (!guardrailResult.allowed) {
      logger.warn("Framework alignment blocked by guardrails", { 
        userId, 
        action: guardrailResult.action,
        severity: guardrailResult.severity 
      });
      throw new ForbiddenError("Content blocked for security reasons", { action: guardrailResult.action });
    }

    const sanitizedContent = guardrailResult.sanitizedPrompt || content;

    const alignment = await qualityScoringService.checkFrameworkAlignment(
      sanitizedContent,
      framework,
      documentType
    );
    
    res.json(alignment);
  }));

  router.get("/industries", isAuthenticated, asyncHandler(async (req, res) => {
    const { AIFineTuningService } = await import('../services/aiFineTuningService');
    const service = new AIFineTuningService();
    const configurations = service.getIndustryConfigurations();
    res.json({ success: true, configurations });
  }));

  router.get("/industries/:industryId", isAuthenticated, asyncHandler(async (req, res) => {
    const { AIFineTuningService } = await import('../services/aiFineTuningService');
    const service = new AIFineTuningService();
    const configuration = service.getIndustryConfiguration(req.params.industryId);
    
    if (!configuration) {
      throw new NotFoundError("Industry not found");
    }
    
    res.json({ success: true, configuration });
  }));

  router.post("/fine-tune", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(fineTuneSchema), asyncHandler(async (req, res) => {
    const { industryId, requirements, customInstructions, priority } = req.body;
    const userId = getRequiredUserId(req);

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
  }));

  router.post("/generate-optimized", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(generateOptimizedSchema), asyncHandler(async (req, res) => {
    const { configId, documentType, context } = req.body;
    const userId = getRequiredUserId(req);

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
  }));

  router.post("/assess-risks", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(assessRisksSchema), asyncHandler(async (req, res) => {
    const { industryId, organizationContext } = req.body;
    const userId = getRequiredUserId(req);

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
  }));

  router.post("/analyze-image", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(analyzeImageSchema), asyncHandler(async (req, res) => {
    const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    
    const { imageData, prompt, framework, analysisType } = req.body;
    const userId = getRequiredUserId(req);

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
      throw new ValidationError(`Unsupported image format: ${mimeType}. Supported formats: PNG, JPEG, GIF, WebP`);
    }
    
    // Validate data size (rough check for base64)
    const base64Length = imageData.includes(',') 
      ? imageData.split(',')[1].length 
      : imageData.length;
    const estimatedSize = base64Length * 0.75;
    
    if (estimatedSize > 20 * 1024 * 1024) { // 20MB limit
      throw new ValidationError("Image file is too large. Maximum size is 20MB.");
    }

    try {
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
      metricsCollector.trackAIOperation('vision_analysis', false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error("Image analysis failed", { error: errorMessage, userId: req.user?.claims?.sub });

      if (errorMessage.includes('GOOGLE_API_KEY')) {
        throw new AppError("Image analysis service is temporarily unavailable. Please try again later.", 503);
      } else if (errorMessage.includes('Invalid') || errorMessage.includes('format')) {
        throw new ValidationError("Invalid image format. Please upload a valid image file.");
      } else {
        throw new AppError("Failed to analyze image. Please try again.");
      }
    }
  }));

  router.post("/multimodal-chat", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(multimodalChatSchema), asyncHandler(async (req, res) => {
    const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
    
    const { message, framework, sessionId, attachments } = req.body;
    const userId = getRequiredUserId(req);

    const imageAnalysisResults: any[] = [];
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
      processingDetails: {
        processedImages: imageAnalysisResults.map(r => r.fileName),
        unsupportedFiles,
        documents: documentContents.length
      },
      imageAnalysis: imageAnalysisResults.length > 0 ? imageAnalysisResults : undefined,
      unsupportedFiles: unsupportedFiles.length > 0 ? unsupportedFiles : undefined
    });
  }));

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
  router.get("/stats", isAuthenticated, asyncHandler(async (req, res) => {
    const { organizationId, timeRange = '30d' } = req.query;

    // Calculate time filter
    const now = new Date();
    const startDate = new Date();
    if (timeRange === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === '30d') {
      startDate.setDate(now.getDate() - 30);
    } else if (timeRange === '90d') {
      startDate.setDate(now.getDate() - 90);
    } else if (timeRange === '1y') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // Get guardrail statistics
    const guardrailsQuery = organizationId
      ? db.select({
          action: aiGuardrailsLogs.action,
          severity: aiGuardrailsLogs.severity,
          count: count()
        })
        .from(aiGuardrailsLogs)
        .where(eq(aiGuardrailsLogs.organizationId, organizationId as string))
        .groupBy(aiGuardrailsLogs.action, aiGuardrailsLogs.severity)
      : db.select({
          action: aiGuardrailsLogs.action,
          severity: aiGuardrailsLogs.severity,
          count: count()
        })
        .from(aiGuardrailsLogs)
        .groupBy(aiGuardrailsLogs.action, aiGuardrailsLogs.severity);

    const guardrailStats = await guardrailsQuery;

    // Get usage disclosure statistics
    const usageQuery = organizationId
      ? db.select({
          actionType: aiUsageDisclosures.actionType,
          modelProvider: aiUsageDisclosures.modelProvider,
          count: count()
        })
        .from(aiUsageDisclosures)
        .where(eq(aiUsageDisclosures.organizationId, organizationId as string))
        .groupBy(aiUsageDisclosures.actionType, aiUsageDisclosures.modelProvider)
      : db.select({
          actionType: aiUsageDisclosures.actionType,
          modelProvider: aiUsageDisclosures.modelProvider,
          count: count()
        })
        .from(aiUsageDisclosures)
        .groupBy(aiUsageDisclosures.actionType, aiUsageDisclosures.modelProvider);

    const usageStats = await usageQuery;

    // Get AI-generated documents count
    const [aiDocsResult] = await db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.aiGenerated, true));

    // Calculate summary statistics
    const totalGuardrailActions = guardrailStats.reduce((sum, stat) => sum + stat.count, 0);
    const blockedActions = guardrailStats
      .filter(stat => stat.action === 'blocked')
      .reduce((sum, stat) => sum + stat.count, 0);
    const redactedActions = guardrailStats
      .filter(stat => stat.action === 'redacted')
      .reduce((sum, stat) => sum + stat.count, 0);
    const totalUsageActions = usageStats.reduce((sum, stat) => sum + stat.count, 0);

    res.json({
      success: true,
      timeRange,
      statistics: {
        guardrails: {
          total: totalGuardrailActions,
          blocked: blockedActions,
          redacted: redactedActions,
          byAction: guardrailStats.reduce((acc, stat) => {
            acc[stat.action] = (acc[stat.action] || 0) + stat.count;
            return acc;
          }, {}),
          bySeverity: guardrailStats.reduce((acc, stat) => {
            acc[stat.severity] = (acc[stat.severity] || 0) + stat.count;
            return acc;
          }, {})
        },
        usage: {
          total: totalUsageActions,
          byActionType: usageStats.reduce((acc, stat) => {
            acc[stat.actionType] = (acc[stat.actionType] || 0) + stat.count;
            return acc;
          }, {}),
          byModelProvider: usageStats.reduce((acc, stat) => {
            acc[stat.modelProvider] = (acc[stat.modelProvider] || 0) + stat.count;
            return acc;
          }, {})
        },
        documents: {
          aiGenerated: aiDocsResult.count
        }
      }
    });
  }));

  /**
   * @openapi
   * /api/ai/hub-insights:
   *   get:
   *     tags: [AI]
   *     summary: Get real-time AI insights based on actual compliance data
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: AI hub insights retrieved
   *       401:
   *         description: Unauthorized
   */
  router.get("/hub-insights", isAuthenticated, asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    
    // Get user's organization
    const userOrgs = userId ? await storage.getUserOrganizations(userId) : [];
    const organizationId = userOrgs[0]?.organizationId;

    // If no organization, return empty data with helpful insight
    if (!organizationId) {
      return res.json({
        success: true,
        stats: {
          documentsGenerated: 0,
          totalDocuments: 0,
          gapsIdentified: 0,
          risksAssessed: 0,
          complianceScore: 0,
          controlsTotal: 0,
          controlsImplemented: 0,
          controlsInProgress: 0,
          controlsNotStarted: 0
        },
        insights: [
          {
            id: 'no-organization',
            type: 'recommendation',
            title: 'Join or Create an Organization',
            description: 'To get personalized compliance insights, please join or create an organization.',
            actionUrl: '/settings/organization'
          }
        ],
        risks: []
      });
    }

    // Get AI-generated documents count for this organization (via companyProfiles)
    const orgProfiles = await storage.getCompanyProfiles(organizationId);
    const companyProfileIds = orgProfiles.map((p: { id: string }) => p.id);
    
    let aiDocsCount = 0;
    let totalDocsCount = 0;
    
    if (companyProfileIds.length > 0) {
      const [aiDocsResult] = await db
        .select({ count: count() })
        .from(documents)
        .where(sql`${documents.aiGenerated} = true AND ${documents.companyProfileId} IN (${sql.raw(companyProfileIds.map((id: string) => `'${id}'`).join(','))})`);
      aiDocsCount = Number(aiDocsResult?.count) || 0;

      // Get total documents for this organization
      const [totalDocsResult] = await db
        .select({ count: count() })
        .from(documents)
        .where(sql`${documents.companyProfileId} IN (${sql.raw(companyProfileIds.map((id: string) => `'${id}'`).join(','))})`);
      totalDocsCount = Number(totalDocsResult?.count) || 0;
    }

    // Get framework control statuses for this organization
    const controlStatuses = await db.select().from(frameworkControlStatuses).where(eq(frameworkControlStatuses.organizationId, organizationId));

    // Calculate insights based on actual data
    const notStartedControls = controlStatuses.filter(c => c.status === 'not_started');
    const inProgressControls = controlStatuses.filter(c => c.status === 'in_progress');
    const implementedControls = controlStatuses.filter(c => c.status === 'implemented');
    const missingEvidenceControls = controlStatuses.filter(c => c.evidenceStatus === 'none' && c.status !== 'not_applicable');
    
    // Calculate compliance score
    const totalApplicable = controlStatuses.filter(c => c.status !== 'not_applicable').length;
    const complianceScore = totalApplicable > 0 
      ? Math.round((implementedControls.length / totalApplicable) * 100) 
      : 0;

    // Generate dynamic insights based on actual data
    const insights: Array<{
      id: string;
      type: 'recommendation' | 'warning' | 'info';
      title: string;
      description: string;
      framework?: string;
      actionUrl?: string;
    }> = [];

    // Add insight for missing evidence
    if (missingEvidenceControls.length > 0) {
      const frameworks = [...new Set(missingEvidenceControls.map(c => c.framework))];
      insights.push({
        id: 'missing-evidence',
        type: 'warning',
        title: `Missing Evidence for ${missingEvidenceControls.length} Controls`,
        description: `${missingEvidenceControls.length} controls across ${frameworks.join(', ').toUpperCase()} are missing required evidence documentation.`,
        framework: frameworks[0]?.toUpperCase(),
        actionUrl: '/evidence-ingestion'
      });
    }

    // Add insight for controls not started
    if (notStartedControls.length > 5) {
      insights.push({
        id: 'controls-not-started',
        type: 'recommendation',
        title: 'Start Implementing Controls',
        description: `${notStartedControls.length} controls haven't been started yet. Consider prioritizing critical security controls.`,
        actionUrl: '/iso27001-framework'
      });
    }

    // Add progress insight
    if (implementedControls.length > 0) {
      insights.push({
        id: 'progress-update',
        type: 'info',
        title: 'Implementation Progress',
        description: `${implementedControls.length} controls are fully implemented. ${inProgressControls.length} are in progress.`,
        framework: 'All'
      });
    }

    // Add compliance score insight
    if (complianceScore >= 70) {
      insights.push({
        id: 'compliance-score',
        type: 'info',
        title: 'Good Compliance Standing',
        description: `Your organization has a ${complianceScore}% compliance score. Keep up the great work!`,
        framework: 'All'
      });
    } else if (totalApplicable > 0) {
      insights.push({
        id: 'compliance-improvement',
        type: 'recommendation',
        title: 'Improve Compliance Score',
        description: `Current compliance score is ${complianceScore}%. Implement more controls to improve your security posture.`,
        actionUrl: '/ai-doc-generator'
      });
    }

    // Generate risk items based on actual gaps
    const risks: Array<{
      id: string;
      title: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      framework: string;
      control: string;
      recommendation: string;
    }> = [];

    // High-priority risks: controls with no evidence that should be implemented
    const highRiskControls = controlStatuses.filter(
      c => c.status === 'implemented' && c.evidenceStatus === 'none'
    ).slice(0, 3);

    highRiskControls.forEach((control, idx) => {
      risks.push({
        id: `risk-${idx + 1}`,
        title: `Missing Evidence for ${control.controlId}`,
        severity: 'high',
        framework: control.framework.toUpperCase(),
        control: control.controlId,
        recommendation: 'Upload supporting evidence to demonstrate control implementation.'
      });
    });

    // Medium risks: controls stuck in progress for too long
    const staleControls = inProgressControls.slice(0, 2);
    staleControls.forEach((control, idx) => {
      risks.push({
        id: `stale-${idx + 1}`,
        title: `Control ${control.controlId} In Progress`,
        severity: 'medium',
        framework: control.framework.toUpperCase(),
        control: control.controlId,
        recommendation: 'Complete implementation and gather required evidence.'
      });
    });

    res.json({
      success: true,
      stats: {
        documentsGenerated: aiDocsCount,
        totalDocuments: totalDocsCount,
        gapsIdentified: notStartedControls.length + missingEvidenceControls.length,
        risksAssessed: risks.length,
        complianceScore,
        controlsTotal: controlStatuses.length,
        controlsImplemented: implementedControls.length,
        controlsInProgress: inProgressControls.length,
        controlsNotStarted: notStartedControls.length
      },
      insights: insights.length > 0 ? insights : [
        {
          id: 'get-started',
          type: 'info',
          title: 'Get Started with Compliance',
          description: 'Begin by setting up your company profile and selecting compliance frameworks.',
          actionUrl: '/ai-doc-generator'
        }
      ],
      risks: risks.length > 0 ? risks : []
    });
  }));

  /**
   * @openapi
   * /api/ai/generate:
   *   post:
   *     tags: [AI]
   *     summary: Generate AI content
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       401:
   *         description: Unauthorized
   */
  router.post("/generate", isAuthenticated, aiLimiter, validateAIRequestSize, asyncHandler(async (req, res) => {
    // Generic AI generation endpoint - redirects to more specific endpoints
    throw new AppError('Please use specific generation endpoints like /generate-compliance-docs', 501);
  }));

  /**
   * @openapi
   * /api/ai/analyze:
   *   post:
   *     tags: [AI]
   *     summary: Analyze content with AI
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       401:
   *         description: Unauthorized
   */
  router.post("/analyze", isAuthenticated, aiLimiter, validateAIRequestSize, asyncHandler(async (req, res) => {
    // Generic AI analysis endpoint - redirects to more specific endpoints
    throw new AppError('Please use specific analysis endpoints like /analyze-document or /analyze-quality', 501);
  }));
}

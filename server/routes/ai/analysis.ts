// AI Analysis Routes
// Quality analysis, document analysis, and insights generation
import { Router, Response, NextFunction } from 'express';
import { storage } from '../../storage';
import { aiOrchestrator } from '../../services/aiOrchestrator';
import { documentAnalysisService } from '../../services/documentAnalysis';
import {
  isAuthenticated,
  getRequiredUserId,
  secureHandler,
  NotFoundError,
  ForbiddenError,
  validateInput,
  requireOrganization,
  type MultiTenantRequest,
  aiLimiter,
  validateAIRequestSize,
  auditService,
  metricsCollector,
  aiGuardrailsService,
  crypto
} from './shared';
import {
  analyzeQualitySchema,
  generateInsightsSchema,
  analyzeDocumentSchema,
  extractProfileSchema
} from '../../validation/requestSchemas';
import { logger } from '../../utils/logger';
import { getCompanyProfileWithOrgCheck } from '../../middleware/multiTenant';

export function registerAnalysisRoutes(router: Router) {
  /**
   * POST /api/ai/analyze-quality
   * Analyze content quality for compliance frameworks
   */
  router.post("/analyze-quality", isAuthenticated, requireOrganization, aiLimiter, validateAIRequestSize, validateInput(analyzeQualitySchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { content, framework } = req.body;
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;
    const requestId = crypto.randomUUID();

    // Run guardrails check on user input
    const guardrailResult = await aiGuardrailsService.checkGuardrails(content, null, {
      userId,
      requestId,
      modelProvider: 'openai',
      modelName: 'gpt-4o-mini',
      ipAddress: req.ip
    });

    if (!guardrailResult.allowed) {
      logger.warn("AI request blocked by guardrails", { 
        userId, 
        organizationId,
        action: guardrailResult.action,
        severity: guardrailResult.severity 
      });
      throw new ForbiddenError("Request blocked for security reasons", { action: guardrailResult.action });
    }

    // Use sanitized content
    const sanitizedContent = guardrailResult.sanitizedPrompt || content;
    const analysis = await aiOrchestrator.analyzeQuality(sanitizedContent, framework);
    metricsCollector.trackAIOperation('analysis', true);
    
    res.json({
      success: true,
      data: analysis
    });
  }));

  /**
   * POST /api/ai/generate-insights
   * Generate compliance insights from company profile
   */
  router.post("/generate-insights", isAuthenticated, requireOrganization, aiLimiter, validateAIRequestSize, validateInput(generateInsightsSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { companyProfileId, framework } = req.body;
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;

    const { profile: companyProfile, authorized } = await getCompanyProfileWithOrgCheck(companyProfileId, organizationId);
    
    if (!authorized || !companyProfile) {
      throw new NotFoundError("Company profile not found");
    }

    const insights = await aiOrchestrator.generateInsights(companyProfile, framework);
    
    metricsCollector.trackAIOperation('analysis', true);
    await auditService.logAction({
      action: "generate_insights",
      entityType: "company_profile",
      entityId: companyProfileId,
      userId: userId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      details: { framework, riskScore: insights.riskScore, organizationId }
    });

    res.json({
      success: true,
      data: insights
    });
  }));

  /**
   * POST /api/ai/analyze-document
   * Analyze document content against compliance frameworks
   */
  router.post("/analyze-document", isAuthenticated, requireOrganization, aiLimiter, validateAIRequestSize, validateInput(analyzeDocumentSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { content, filename, framework } = req.body;
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;
    const requestId = crypto.randomUUID();

    // Run guardrails check on document content
    const guardrailResult = await aiGuardrailsService.checkGuardrails(content, null, {
      userId,
      requestId,
      modelProvider: 'openai',
      modelName: 'gpt-4o-mini',
      ipAddress: req.ip
    });

    if (!guardrailResult.allowed) {
      logger.warn("Document analysis blocked by guardrails", { 
        userId, 
        organizationId,
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
      userId: userId.toString(),
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      metadata: { framework, analysisType: "document", organizationId }
    });

    res.json({
      success: true,
      data: analysis
    });
  }));

  /**
   * POST /api/ai/extract-profile
   * Extract company profile information from text
   */
  router.post("/extract-profile", isAuthenticated, requireOrganization, aiLimiter, validateAIRequestSize, validateInput(extractProfileSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { content } = req.body;
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;

    const extractedProfile = await documentAnalysisService.extractCompanyProfile(content);
    
    await auditService.logAction({
      action: "extract",
      entityType: "company_profile",
      entityId: `profile_${crypto.randomUUID()}`,
      userId: userId.toString(),
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      metadata: { extractionType: "profile", organizationId }
    });

    res.json({
      success: true,
      data: extractedProfile
    });
  }));
}

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
  AppError,
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
import { aiUsageAccountingService } from '../../services/aiUsageAccountingService';
import { aiOutputClassificationService } from '../../services/aiOutputClassificationService';
import { aiMetadataAuditService } from '../../services/aiMetadataAuditService';
import { promptTemplateRegistry } from '../../services/promptTemplateRegistry';

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
    const promptTemplate = promptTemplateRegistry.renderTemplate('content_generation', {
      taskSummary: `Analyze quality for ${framework}`,
    });
    const budgetCheck = await aiUsageAccountingService.checkBudget({
      userId,
      organizationId,
      actionType: 'analysis_quality',
      model: 'claude-sonnet-4',
      prompt: content,
      expectedResponseTokens: 600,
    });
    if (!budgetCheck.allowed) {
      throw new AppError('AI usage budget exceeded for this organization', 429, 'AI_BUDGET_EXCEEDED', {
        reason: budgetCheck.reason,
      });
    }

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
    const usage = await aiUsageAccountingService.recordUsage({
      userId,
      organizationId,
      actionType: 'analysis_quality',
      model: 'claude-sonnet-4',
      prompt: sanitizedContent,
      response: JSON.stringify(analysis),
      purposeDescription: `Analyze document quality for ${framework}`,
      dataUsed: ['document_content', 'framework'],
      aiContribution: 'assisted',
      humanOversight: true,
    });
    await aiMetadataAuditService.record({
      actionType: 'analysis_quality',
      model: 'claude-sonnet-4',
      userId,
      organizationId,
      requestId,
      promptTemplateKey: promptTemplate.key,
      promptTemplateVersion: promptTemplate.version,
      outputClassification: aiOutputClassificationService.classify(analysis.feedback || ''),
      usage,
      metadata: { framework },
    });
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

    const promptTemplate = promptTemplateRegistry.renderTemplate('content_generation', {
      taskSummary: `Generate compliance insights for ${framework}`,
    });
    const budgetCheck = await aiUsageAccountingService.checkBudget({
      userId,
      organizationId,
      actionType: 'analysis_insights',
      model: 'claude-sonnet-4',
      prompt: JSON.stringify(companyProfile).slice(0, 6000),
      expectedResponseTokens: 800,
    });
    if (!budgetCheck.allowed) {
      throw new AppError('AI usage budget exceeded for this organization', 429, 'AI_BUDGET_EXCEEDED', {
        reason: budgetCheck.reason,
      });
    }

    const insights = await aiOrchestrator.generateInsights(companyProfile, framework);
    const usage = await aiUsageAccountingService.recordUsage({
      userId,
      organizationId,
      actionType: 'analysis_insights',
      model: 'claude-sonnet-4',
      prompt: JSON.stringify(companyProfile),
      response: JSON.stringify(insights),
      purposeDescription: `Generate compliance insights for ${framework}`,
      dataUsed: ['company_profile', 'framework'],
      aiContribution: 'assisted',
      humanOversight: true,
    });
    await aiMetadataAuditService.record({
      actionType: 'analysis_insights',
      model: 'claude-sonnet-4',
      userId,
      organizationId,
      requestId: crypto.randomUUID(),
      promptTemplateKey: promptTemplate.key,
      promptTemplateVersion: promptTemplate.version,
      outputClassification: aiOutputClassificationService.classify(JSON.stringify(insights)),
      usage,
      metadata: { framework },
    });
    
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
    const promptTemplate = promptTemplateRegistry.renderTemplate('content_generation', {
      taskSummary: `Analyze document ${filename || 'uploaded-file'}`,
    });
    const budgetCheck = await aiUsageAccountingService.checkBudget({
      userId,
      organizationId,
      actionType: 'analysis_document',
      model: 'gpt-5.1',
      prompt: content,
      expectedResponseTokens: 800,
    });
    if (!budgetCheck.allowed) {
      throw new AppError('AI usage budget exceeded for this organization', 429, 'AI_BUDGET_EXCEEDED', {
        reason: budgetCheck.reason,
      });
    }

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
    const usage = await aiUsageAccountingService.recordUsage({
      userId,
      organizationId,
      actionType: 'analysis_document',
      model: 'gpt-5.1',
      prompt: sanitizedContent,
      response: JSON.stringify(analysis),
      purposeDescription: `Analyze document for ${framework}`,
      dataUsed: ['document_content', 'framework'],
      aiContribution: 'assisted',
      humanOversight: true,
    });
    await aiMetadataAuditService.record({
      actionType: 'analysis_document',
      model: 'gpt-5.1',
      userId,
      organizationId,
      requestId,
      promptTemplateKey: promptTemplate.key,
      promptTemplateVersion: promptTemplate.version,
      outputClassification: aiOutputClassificationService.classify(JSON.stringify(analysis)),
      usage,
      metadata: { framework, filename },
    });
    
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
    const requestId = crypto.randomUUID();
    const promptTemplate = promptTemplateRegistry.renderTemplate('content_generation', {
      taskSummary: 'Extract company profile details',
    });
    const budgetCheck = await aiUsageAccountingService.checkBudget({
      userId,
      organizationId,
      actionType: 'analysis_extract_profile',
      model: 'gpt-5.1',
      prompt: content,
      expectedResponseTokens: 800,
    });
    if (!budgetCheck.allowed) {
      throw new AppError('AI usage budget exceeded for this organization', 429, 'AI_BUDGET_EXCEEDED', {
        reason: budgetCheck.reason,
      });
    }

    const extractedProfile = await documentAnalysisService.extractCompanyProfile(content);
    const usage = await aiUsageAccountingService.recordUsage({
      userId,
      organizationId,
      actionType: 'analysis_extract_profile',
      model: 'gpt-5.1',
      prompt: content,
      response: JSON.stringify(extractedProfile),
      purposeDescription: 'Extract company profile from uploaded content',
      dataUsed: ['document_content'],
      aiContribution: 'assisted',
      humanOversight: true,
    });
    await aiMetadataAuditService.record({
      actionType: 'analysis_extract_profile',
      model: 'gpt-5.1',
      userId,
      organizationId,
      requestId,
      promptTemplateKey: promptTemplate.key,
      promptTemplateVersion: promptTemplate.version,
      outputClassification: aiOutputClassificationService.classify(JSON.stringify(extractedProfile)),
      usage,
    });
    
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

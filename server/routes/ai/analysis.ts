// AI Analysis Routes
// Quality analysis and insights generation
import { Router } from 'express';
import { storage } from '../../storage';
import { aiOrchestrator } from '../../services/aiOrchestrator';
import {
  isAuthenticated,
  getRequiredUserId,
  getUserId,
  asyncHandler,
  NotFoundError,
  ForbiddenError,
  validateBody,
  aiLimiter,
  validateAIRequestSize,
  auditService,
  metricsCollector,
  aiGuardrailsService,
  crypto
} from './shared';
import {
  analyzeQualitySchema,
  generateInsightsSchema
} from '../../validation/requestSchemas';
import { logger } from '../../utils/logger';

export function registerAnalysisRoutes(router: Router) {
  /**
   * POST /api/ai/analyze-quality
   * Analyze content quality for compliance frameworks
   */
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

  /**
   * POST /api/ai/generate-insights
   * Generate compliance insights from company profile
   */
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
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.get('User-Agent'),
      details: { framework, riskScore: insights.riskScore }
    });

    res.json(insights);
  }));
}

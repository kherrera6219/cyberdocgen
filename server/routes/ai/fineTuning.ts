// AI Fine-tuning Routes
// Custom fine-tuning and optimization
import { Router } from 'express';
import { storage } from '../../storage';
import {
  isAuthenticated,
  getRequiredUserId,
  asyncHandler,
  validateBody,
  aiLimiter,
  validateAIRequestSize
} from './shared';
import { fineTuneSchema, generateOptimizedSchema, assessRisksSchema } from '../../validation/requestSchemas';

export function registerFineTuningRoutes(router: Router) {
  /**
   * POST /api/ai/fine-tune
   * Create custom fine-tuning configuration
   */
  router.post("/fine-tune", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(fineTuneSchema), asyncHandler(async (req, res) => {
    const { industryId, requirements, customInstructions, priority } = req.body;
    const userId = getRequiredUserId(req);

    const { AIFineTuningService } = await import('../../services/aiFineTuningService');
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

  /**
   * POST /api/ai/generate-optimized
   * Generate content using fine-tuned model
   */
  router.post("/generate-optimized", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(generateOptimizedSchema), asyncHandler(async (req, res) => {
    const { configId, documentType, context } = req.body;
    const userId = getRequiredUserId(req);

    const { AIFineTuningService } = await import('../../services/aiFineTuningService');
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

  /**
   * POST /api/ai/assess-risks
   * Advanced risk assessment using fine-tuned models
   */
  router.post("/assess-risks", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(assessRisksSchema), asyncHandler(async (req, res) => {
    const { industryId, organizationContext } = req.body;
    const userId = getRequiredUserId(req);

    const { AIFineTuningService } = await import('../../services/aiFineTuningService');
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
}

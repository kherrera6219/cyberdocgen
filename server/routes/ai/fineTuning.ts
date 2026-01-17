// AI Fine-tuning Routes
// Custom fine-tuning and optimization
import { Router, Response, NextFunction } from 'express';
import { storage } from '../../storage';
import {
  isAuthenticated,
  getRequiredUserId,
  secureHandler,
  validateInput,
  requireOrganization,
  type MultiTenantRequest,
  aiLimiter,
  validateAIRequestSize,
  crypto
} from './shared';
import { fineTuneSchema, generateOptimizedSchema, assessRisksSchema } from '../../validation/requestSchemas';

export function registerFineTuningRoutes(router: Router) {
  /**
   * POST /api/ai/fine-tune
   * Create custom fine-tuning configuration
   */
  router.post("/fine-tune", isAuthenticated, requireOrganization, aiLimiter, validateAIRequestSize, validateInput(fineTuneSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { industryId, requirements, customInstructions, priority } = req.body;
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;

    const { AIFineTuningService } = await import('../../services/aiFineTuningService');
    const service = new AIFineTuningService();
    
    const result = await service.createCustomConfiguration({
      industryId,
      organizationId,
      requirements: Array.isArray(requirements) ? requirements : [requirements],
      customInstructions,
      priority: priority || 'medium'
    });

    await storage.createAuditEntry({
      userId,
      action: "ai_fine_tuning_created",
      entityType: "ai_configuration",
      entityId: result.configId,
      metadata: { industryId, accuracy: result.accuracy, requirements, customInstructions, priority, organizationId }
    });

    res.json({ 
      success: true, 
      data: result 
    });
  }));

  /**
   * POST /api/ai/generate-optimized
   * Generate content using fine-tuned model
   */
  router.post("/generate-optimized", isAuthenticated, requireOrganization, aiLimiter, validateAIRequestSize, validateInput(generateOptimizedSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { configId, documentType, context } = req.body;
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;

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
      entityId: `opt-${crypto.randomUUID()}`,
      metadata: { documentType, industry: context.industry, configId, context, organizationId }
    });

    res.json({ 
      success: true, 
      data: { content: generatedContent }
    });
  }));

  /**
   * POST /api/ai/assess-risks
   * Advanced risk assessment using fine-tuned models
   */
  router.post("/assess-risks", isAuthenticated, requireOrganization, aiLimiter, validateAIRequestSize, validateInput(assessRisksSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { industryId, organizationContext } = req.body;
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;

    const { AIFineTuningService } = await import('../../services/aiFineTuningService');
    const service = new AIFineTuningService();
    
    const riskAssessment = await service.assessIndustryRisks(industryId, organizationContext);

    await storage.createAuditEntry({
      userId,
      action: "ai_risk_assessment",
      entityType: "risk_assessment",
      entityId: `risk-${crypto.randomUUID()}`,
      metadata: { industryId, riskScore: riskAssessment.riskScore, organizationContext, identifiedRisks: riskAssessment.identifiedRisks.length, organizationId }
    });

    res.json({ 
      success: true, 
      data: riskAssessment 
    });
  }));
}

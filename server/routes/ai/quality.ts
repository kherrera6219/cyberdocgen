// AI Quality Scoring Routes
// Document quality and framework alignment checks
import { Router, Response, NextFunction } from 'express';
import { qualityScoringService } from '../../services/qualityScoring';
import {
  isAuthenticated,
  getRequiredUserId,
  secureHandler,
  ForbiddenError,
  validateInput,
  requireOrganization,
  type MultiTenantRequest,
  aiLimiter,
  validateAIRequestSize,
  auditService,
  aiGuardrailsService,
  logger,
  crypto
} from './shared';
import { qualityScoreSchema, frameworkAlignmentSchema } from '../../validation/requestSchemas';

export function registerQualityRoutes(router: Router) {
  /**
   * POST /api/ai/quality-score
   * Evaluate document quality
   */
  router.post("/quality-score", isAuthenticated, requireOrganization, aiLimiter, validateAIRequestSize, validateInput(qualityScoreSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { content, title, framework, documentType } = req.body;
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
      logger.warn("Quality scoring blocked by guardrails", { 
        userId, 
        organizationId,
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
      entityId: `quality_${crypto.randomUUID()}`,
      userId: userId.toString(),
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      metadata: { title, framework, documentType, score: qualityScore.overallScore, organizationId }
    });

    res.json({
      success: true,
      data: qualityScore
    });
  }));

  /**
   * POST /api/ai/framework-alignment
   * Check how well context aligns with framework checks
   */
  router.post("/framework-alignment", isAuthenticated, requireOrganization, aiLimiter, validateAIRequestSize, validateInput(frameworkAlignmentSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { content, framework, documentType } = req.body;
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
      logger.warn("Framework alignment blocked by guardrails", { 
        userId, 
        organizationId,
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
    
    res.json({
      success: true,
      data: alignment
    });
  }));
}

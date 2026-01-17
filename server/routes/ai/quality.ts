// AI Quality Scoring Routes
// Document quality and framework alignment checks
import { Router } from 'express';
import { qualityScoringService } from '../../services/qualityScoring';
import {
  isAuthenticated,
  getUserId,
  getRequiredUserId,
  asyncHandler,
  ForbiddenError,
  validateBody,
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
      userId: req.user?.claims?.sub || getRequiredUserId(req).toString(),
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.get('User-Agent'),
      metadata: { title, framework, documentType, score: qualityScore.overallScore }
    });

    res.json(qualityScore);
  }));

  /**
   * POST /api/ai/framework-alignment
   * Check how well context aligns with framework checks
   */
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
}

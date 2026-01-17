// AI Chat Routes
// Interactive chat and multimodal support
import { Router, Response, NextFunction } from 'express';
import { complianceChatbot } from '../../services/chatbot';
import { analyzeImage } from '../../services/geminiVision';
import {
  isAuthenticated,
  getRequiredUserId,
  secureHandler,
  validateInput,
  requireOrganization,
  type MultiTenantRequest,
  aiLimiter,
  validateAIRequestSize,
  auditService,
  metricsCollector,
  logger,
  crypto,
  NotFoundError
} from './shared';
import { chatMessageSchema, multimodalChatSchema } from '../../validation/requestSchemas';
import { db } from '../../db';
import { aiSessions } from '@shared/schema';
import { and, eq } from 'drizzle-orm';

export function registerChatRoutes(router: Router) {
  /**
   * POST /api/ai/chat
   * Compliance chatbot interface
   */
  router.post("/chat", isAuthenticated, requireOrganization, aiLimiter, validateAIRequestSize, validateInput(chatMessageSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { message, framework, sessionId } = req.body;
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;

    // Verify session ownership if sessionId is provided
    if (sessionId) {
      const [session] = await db
        .select()
        .from(aiSessions)
        .where(and(
          eq(aiSessions.id, sessionId),
          eq(aiSessions.organizationId, organizationId)
        ))
        .limit(1);

      if (!session) {
        throw new NotFoundError('Conversation session not found');
      }
    }

    const response = await complianceChatbot.processMessage(
      message,
      userId,
      sessionId,
      framework
    );

    await auditService.logAction({
      action: "chat",
      entityType: "ai_conversation",
      entityId: sessionId || `chat_${crypto.randomUUID()}`,
      userId: userId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      metadata: { framework, messageLength: message.length, organizationId }
    });

    res.json({
      success: true,
      data: response
    });
  }));

  /**
   * GET /api/ai/chat/suggestions
   * Get suggested questions for compliance implementation
   */
  router.get("/chat/suggestions", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const framework = req.query.framework as string;
    const suggestions = complianceChatbot.getSuggestedQuestions(framework);
    
    res.json({
      success: true,
      data: suggestions
    });
  }));

  /**
   * POST /api/ai/multimodal-chat
   * Chat with image/document attachments
   */
  router.post("/multimodal-chat", isAuthenticated, requireOrganization, aiLimiter, validateAIRequestSize, validateInput(multimodalChatSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
    
    const { message, framework, sessionId, attachments } = req.body;
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;

    // Verify session ownership if sessionId is provided
    if (sessionId) {
      const [session] = await db
        .select()
        .from(aiSessions)
        .where(and(
          eq(aiSessions.id, sessionId),
          eq(aiSessions.organizationId, organizationId)
        ))
        .limit(1);

      if (!session) {
        throw new NotFoundError('Conversation session not found');
      }
    }

    const imageAnalysisResults: { fileName: string; analysis: string; complianceRelevance?: { controls?: string[]; risks?: string[]; recommendations?: string[] } }[] = [];
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
      imageAnalysisResults.forEach((result) => {
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
      entityId: sessionId || `chat_${crypto.randomUUID()}`,
      userId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      metadata: {
        framework,
        organizationId,
        messageLength: message.length,
        attachmentCount: attachments?.length || 0,
        imageAnalysisCount: imageAnalysisResults.length,
        unsupportedFiles: unsupportedFiles.length
      }
    });

    res.json({
      success: true,
      data: {
        ...response,
        processingDetails: {
          processedImages: imageAnalysisResults.map(r => r.fileName),
          unsupportedFiles,
          documents: documentContents.length
        },
        imageAnalysis: imageAnalysisResults.length > 0 ? imageAnalysisResults : undefined,
        unsupportedFiles: unsupportedFiles.length > 0 ? unsupportedFiles : undefined
      }
    });
  }));
}

import { Router } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { isAuthenticated, getUserId } from '../replitAuth';
import { validateBody } from '../middleware/routeValidation';
import { aiGuardrailsService } from '../services/aiGuardrailsService';
import { getAnthropicClient, getGeminiClient } from '../services/aiClients';
import {
  riskAssessmentRequestSchema,
  complianceAnalysisRequestSchema,
  documentQualityAnalysisSchema,
  complianceChatRequestSchema
} from '../validation/requestSchemas';

export function registerAnalyticsRoutes(router: Router) {
  router.post('/risk-assessment', isAuthenticated, validateBody(riskAssessmentRequestSchema), async (req: any, res) => {
    try {
      const { companyProfile } = req.body;
      const userId = getUserId(req);
      const requestId = crypto.randomUUID();

      // Build prompt content for guardrails check
      const promptContent = `Company: ${companyProfile.name}, Industry: ${companyProfile.industry}, Assets: ${companyProfile.assets?.join(', ')}, Threats: ${companyProfile.threats?.join(', ')}`;

      // Run guardrails check
      const guardrailResult = await aiGuardrailsService.checkGuardrails(promptContent, null, {
        userId: userId || undefined,
        requestId,
        modelProvider: 'anthropic',
        modelName: 'claude-sonnet-4-20250514',
        ipAddress: req.ip
      });

      if (!guardrailResult.allowed) {
        logger.warn("Risk assessment blocked by guardrails", { 
          userId, 
          action: guardrailResult.action,
          severity: guardrailResult.severity 
        });
        return res.status(403).json({ 
          success: false,
          error: "Content blocked for security reasons"
        });
      }

      const sanitizedContent = guardrailResult.sanitizedPrompt || promptContent;
      
      const anthropic = getAnthropicClient();
      
      const systemPrompt = `You are a cybersecurity risk analyst. Analyze the company profile and provide a comprehensive risk assessment with specific recommendations.`;
      
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{
          role: "user", 
          content: `Analyze cybersecurity risks for: ${sanitizedContent}`
        }],
      });

      const content = response.content[0];
      const analysisText = content.type === 'text' ? content.text : 'Risk analysis completed';

      res.json({
        success: true,
        riskAssessment: analysisText,
        model: "claude-sonnet-4-20250514",
        usage: response.usage
      });
    } catch (error: any) {
      logger.error("Risk assessment failed", { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  router.post('/compliance-analysis', isAuthenticated, validateBody(complianceAnalysisRequestSchema), async (req: any, res) => {
    try {
      const { framework, currentControls, requirements } = req.body;
      const userId = getUserId(req);
      const requestId = crypto.randomUUID();
      
      const prompt = `Analyze compliance gaps for ${framework}. Current controls: ${currentControls.join(', ')}. Requirements: ${requirements.join(', ')}. Provide detailed gap analysis and recommendations.`;
      
      // Run guardrails check
      const guardrailResult = await aiGuardrailsService.checkGuardrails(prompt, null, {
        userId: userId || undefined,
        requestId,
        modelProvider: 'gemini',
        modelName: 'gemini-2.5-pro',
        ipAddress: req.ip
      });

      if (!guardrailResult.allowed) {
        logger.warn("Compliance analysis blocked by guardrails", { 
          userId, 
          action: guardrailResult.action,
          severity: guardrailResult.severity 
        });
        return res.status(403).json({ 
          success: false,
          error: "Content blocked for security reasons"
        });
      }

      const sanitizedPrompt = guardrailResult.sanitizedPrompt || prompt;
      
      const gemini = getGeminiClient();
      const response = await gemini.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: sanitizedPrompt }]
          }
        ],
        config: {
          maxOutputTokens: 2000,
        }
      });
      
      const analysisText = response.text || 'Compliance analysis completed';

      res.json({
        success: true,
        gapAnalysis: analysisText,
        model: "gemini-2.0-flash"
      });
    } catch (error: any) {
      logger.error("Compliance analysis failed", { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Compliance gap analysis endpoint
  router.post('/analyze-compliance-gaps', isAuthenticated, async (req: any, res) => {
    try {
      const { framework, currentControls, requirements } = req.body;

      if (!framework) {
        return res.status(400).json({ message: 'Framework is required' });
      }

      // Perform gap analysis by comparing current controls against requirements
      const controlsSet = new Set(currentControls || []);
      const requirementsArray = requirements || [];

      // Identify gaps (missing controls)
      const gaps = requirementsArray.filter((req: string) => !controlsSet.has(req));

      // Identify implemented controls
      const implemented = requirementsArray.filter((req: string) => controlsSet.has(req));

      // Calculate compliance percentage
      const totalRequirements = requirementsArray.length;
      const implementedCount = implemented.length;
      const compliancePercentage = totalRequirements > 0
        ? Math.round((implementedCount / totalRequirements) * 100)
        : 0;

      // Categorize gaps by severity (simplified heuristic)
      const criticalGaps = gaps.slice(0, Math.ceil(gaps.length * 0.2));
      const highGaps = gaps.slice(Math.ceil(gaps.length * 0.2), Math.ceil(gaps.length * 0.5));
      const mediumGaps = gaps.slice(Math.ceil(gaps.length * 0.5), Math.ceil(gaps.length * 0.8));
      const lowGaps = gaps.slice(Math.ceil(gaps.length * 0.8));

      res.json({
        success: true,
        framework,
        gaps, // Backward compatibility: top-level gaps array
        summary: {
          totalRequirements,
          implementedControls: implementedCount,
          gaps: gaps.length,
          compliancePercentage
        },
        gapsByPriority: {
          critical: criticalGaps,
          high: highGaps,
          medium: mediumGaps,
          low: lowGaps
        },
        implementedControls: implemented,
        recommendations: gaps.length > 0
          ? [
              `Address ${criticalGaps.length} critical gaps first to improve security posture`,
              `Focus on high-priority gaps (${highGaps.length}) for quick compliance wins`,
              `Plan medium and low priority implementations in phased approach`
            ]
          : ['All requirements are currently implemented - maintain regular reviews']
      });
    } catch (error) {
      logger.error('Compliance gap analysis failed', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: 'Failed to analyze compliance gaps' });
    }
  });

  // Document quality analysis requires authentication to prevent abuse of AI credits
  router.post('/analyze-document-quality', isAuthenticated, validateBody(documentQualityAnalysisSchema), async (req: any, res) => {
    try {
      const { content, framework, documentType } = req.body;
      const userId = getUserId(req);
      const requestId = crypto.randomUUID();

      // Run guardrails check on document content
      const guardrailResult = await aiGuardrailsService.checkGuardrails(content, null, {
        userId: userId || undefined,
        requestId,
        modelProvider: 'anthropic',
        modelName: 'claude-sonnet-4-20250514',
        ipAddress: req.ip
      });

      if (!guardrailResult.allowed) {
        logger.warn("Document quality analysis blocked by guardrails", { 
          userId, 
          action: guardrailResult.action,
          severity: guardrailResult.severity 
        });
        return res.status(403).json({ 
          success: false,
          error: "Content blocked for security reasons"
        });
      }

      // Use sanitized content
      const sanitizedContent = guardrailResult.sanitizedPrompt || content;
      
      const anthropic = getAnthropicClient();
      
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: `Analyze the quality and completeness of this ${documentType} for ${framework} compliance. Score it 1-100 and provide specific improvement suggestions.\n\nDocument:\n${sanitizedContent.substring(0, 4000)}`
        }],
      });

      const analysisContent = response.content[0];
      const qualityText = analysisContent.type === 'text' ? analysisContent.text : 'Quality analysis completed';

      res.json({
        success: true,
        qualityAnalysis: qualityText,
        model: "claude-sonnet-4-20250514"
      });
    } catch (error: any) {
      logger.error("Quality analysis failed", { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  router.post('/compliance-chat', isAuthenticated, validateBody(complianceChatRequestSchema), async (req: any, res) => {
    try {
      const { message, context, framework } = req.body;
      const userId = getUserId(req);
      const requestId = crypto.randomUUID();

      // Run guardrails check on user message
      const guardrailResult = await aiGuardrailsService.checkGuardrails(message, null, {
        userId: userId || undefined,
        requestId,
        modelProvider: 'anthropic',
        modelName: 'claude-sonnet-4-20250514',
        ipAddress: req.ip
      });

      if (!guardrailResult.allowed) {
        logger.warn("Compliance chat blocked by guardrails", { 
          userId, 
          action: guardrailResult.action,
          severity: guardrailResult.severity 
        });
        return res.status(403).json({ 
          success: false,
          error: "Message blocked for security reasons"
        });
      }

      // Use sanitized message
      const sanitizedMessage = guardrailResult.sanitizedPrompt || message;
      
      const anthropic = getAnthropicClient();
      
      const systemPrompt = `You are an expert ${framework || 'compliance'} compliance advisor. Answer questions clearly and provide actionable guidance. Context: ${context || 'General compliance inquiry'}`;
      
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: sanitizedMessage
        }],
      });

      const responseContent = response.content[0];
      const replyText = responseContent.type === 'text' ? responseContent.text : 'I can help you with compliance questions.';

      res.json({
        success: true,
        reply: replyText,
        model: "claude-sonnet-4-20250514"
      });
    } catch (error: any) {
      logger.error("Compliance chat failed", { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

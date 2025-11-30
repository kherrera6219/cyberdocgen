/**
 * Service Integration Layer
 * Wraps existing services to work seamlessly with MCP
 */

import { complianceChatbot } from '../services/chatbot';
import { aiOrchestrator } from '../services/aiOrchestrator';
import { ToolContext, ToolResult } from './types';
import { logger } from '../utils/logger';

/**
 * Process chatbot message with MCP context
 */
export async function processChatMessage(
  message: string,
  context: ToolContext
): Promise<ToolResult> {
  try {
    const userId = context.userId || 'anonymous';
    const sessionId = context.sessionId;
    const framework = context.metadata?.framework;

    const response = await complianceChatbot.processMessage(
      message,
      userId,
      sessionId,
      framework
    );

    return {
      success: true,
      data: response,
      metadata: {
        confidence: response.confidence,
        sourceCount: response.sources.length
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Chat message processing failed', { error: errorMessage });
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Generate document with existing service
 */
export async function generateWithExistingService(
  template: any,
  companyProfile: any,
  framework: string,
  options: any = {}
): Promise<ToolResult> {
  try {
    const result = await aiOrchestrator.generateDocument(
      template,
      companyProfile,
      framework,
      options
    );

    return {
      success: true,
      data: result,
      metadata: {
        model: result.model,
        qualityScore: result.qualityScore
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Document generation failed', { error: errorMessage });
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Batch generation with existing service
 */
export async function batchGenerateWithExistingService(
  companyProfile: any,
  framework: string,
  options: any = {}
): Promise<ToolResult> {
  try {
    const results = await aiOrchestrator.generateComplianceDocuments(
      companyProfile,
      framework,
      options
    );

    const avgQuality = results.reduce((sum, r) => sum + (r.qualityScore || 0), 0) / results.length;

    return {
      success: true,
      data: results,
      metadata: {
        count: results.length,
        averageQuality: avgQuality
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Batch generation failed', { error: errorMessage });
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get compliance insights from existing service
 */
export async function getComplianceInsights(
  companyProfile: any,
  framework: string
): Promise<ToolResult> {
  try {
    const insights = await aiOrchestrator.generateInsights(
      companyProfile,
      framework
    );

    return {
      success: true,
      data: insights,
      metadata: {
        riskScore: insights.riskScore,
        riskCount: insights.keyRisks.length
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Insights generation failed', { error: errorMessage });
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Analyze quality with existing service
 */
export async function analyzeQualityWithExistingService(
  content: string,
  framework: string
): Promise<ToolResult> {
  try {
    const analysis = await aiOrchestrator.analyzeQuality(content, framework);

    return {
      success: true,
      data: analysis,
      metadata: {
        score: analysis.score,
        suggestionCount: analysis.suggestions.length
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Quality analysis failed', { error: errorMessage });
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Check AI service health
 */
export async function checkAIServiceHealth(): Promise<ToolResult> {
  try {
    const health = await aiOrchestrator.healthCheck();

    return {
      success: true,
      data: health,
      metadata: {
        allHealthy: health.overall,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Health check failed', { error: errorMessage });
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Legacy API compatibility wrapper
 * Allows existing routes to work with MCP tools
 */
export class MCPLegacyAdapter {
  /**
   * Execute a tool by name with legacy format
   */
  static async executeTool(
    toolName: string,
    params: any,
    userId?: string,
    sessionId?: string
  ): Promise<any> {
    const { toolRegistry } = await import('./toolRegistry');

    const context: ToolContext = {
      userId,
      sessionId,
      metadata: params.metadata || {}
    };

    const result = await toolRegistry.executeTool(toolName, params, context);

    return result.success ? result.data : { error: result.error };
  }

  /**
   * Execute an agent by ID with legacy format
   */
  static async executeAgent(
    agentId: string,
    prompt: string,
    userId?: string,
    sessionId?: string,
    additionalContext?: any
  ): Promise<any> {
    const { agentClient } = await import('./agentClient');

    const context: ToolContext = {
      userId,
      sessionId,
      agentId,
      metadata: additionalContext || {}
    };

    const response = await agentClient.execute(
      {
        agentId,
        prompt,
        context: additionalContext
      },
      context
    );

    return response;
  }
}

/**
 * Migrate existing chatbot to use MCP
 */
export function createMCPChatbotWrapper() {
  return {
    processMessage: async (
      message: string,
      userId: string,
      sessionId?: string,
      framework?: string
    ) => {
      const context: ToolContext = {
        userId,
        sessionId,
        metadata: { framework }
      };

      return processChatMessage(message, context);
    },

    getSuggestedQuestions: (framework?: string) => {
      return complianceChatbot.getSuggestedQuestions(framework);
    }
  };
}

/**
 * Create agent-based document generator
 */
export function createAgentDocumentGenerator() {
  return {
    generate: async (
      template: any,
      companyProfile: any,
      framework: string,
      userId: string
    ) => {
      const { agentClient } = await import('./agentClient');

      const context: ToolContext = {
        userId,
        agentId: 'document-generator'
      };

      const prompt = `Generate a ${template.title} document for ${companyProfile.name} following ${framework} framework requirements.`;

      const response = await agentClient.execute(
        {
          agentId: 'document-generator',
          prompt,
          context: {
            template,
            companyProfile,
            framework
          }
        },
        context
      );

      return response;
    }
  };
}

/**
 * Create agent-based risk assessor
 */
export function createAgentRiskAssessor() {
  return {
    assess: async (
      companyProfile: any,
      frameworks: string[],
      userId: string
    ) => {
      const { agentClient } = await import('./agentClient');

      const context: ToolContext = {
        userId,
        agentId: 'risk-assessment'
      };

      const prompt = `Conduct a comprehensive risk assessment for ${companyProfile.name} across these frameworks: ${frameworks.join(', ')}. Identify key risks, assess their severity, and provide prioritized mitigation recommendations.`;

      const response = await agentClient.execute(
        {
          agentId: 'risk-assessment',
          prompt,
          context: {
            companyProfile,
            frameworks
          }
        },
        context
      );

      return response;
    }
  };
}

export default {
  processChatMessage,
  generateWithExistingService,
  batchGenerateWithExistingService,
  getComplianceInsights,
  analyzeQualityWithExistingService,
  checkAIServiceHealth,
  MCPLegacyAdapter,
  createMCPChatbotWrapper,
  createAgentDocumentGenerator,
  createAgentRiskAssessor
};

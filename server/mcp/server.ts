/**
 * MCP Server
 * Main server for Model Context Protocol
 */

import { Router } from 'express';
import { agentClient } from './agentClient';
import { toolRegistry } from './toolRegistry';
import { AgentAttachment, AgentRequest, ToolContext, MCPMessageType } from './types';
import { logger } from '../utils/logger';
import { auditService, AuditAction } from '../services/auditService';
import { getUserId } from '../replitAuth';
import { aiLimiter } from '../middleware/security';

export const mcpRouter = Router();

const MAX_BATCH_EXECUTIONS = 10;
const MAX_ATTACHMENTS = 10;
const MAX_ATTACHMENT_CONTENT_CHARS = 2_000_000;
const MAX_TOTAL_ATTACHMENT_CONTENT_CHARS = 8_000_000;
const TOOL_EXECUTION_TIMEOUT_MS = 30_000;

function resolveIdentityContext(req: any): Pick<ToolContext, 'userId' | 'organizationId'> {
  const userId = getUserId(req);
  const organizationId =
    req.organizationId
    || req.user?.organization?.id
    || req.user?.organizationId
    || req.session?.organizationId;

  return {
    userId,
    organizationId,
  };
}

function normalizeAttachments(raw: unknown): { attachments?: AgentAttachment[]; error?: string } {
  if (raw === undefined || raw === null) {
    return {};
  }

  if (!Array.isArray(raw)) {
    return {
      error: 'attachments must be an array when provided',
    };
  }

  if (raw.length > MAX_ATTACHMENTS) {
    return {
      error: `Too many attachments. Maximum allowed is ${MAX_ATTACHMENTS}.`,
    };
  }

  let totalContentLength = 0;
  const normalized: AgentAttachment[] = [];
  for (const [index, item] of raw.entries()) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return {
        error: `Attachment at index ${index} must be an object`,
      };
    }

    const attachment = item as Record<string, unknown>;
    const name = typeof attachment.name === 'string' ? attachment.name : undefined;
    const type = typeof attachment.type === 'string' ? attachment.type : undefined;
    const content = typeof attachment.content === 'string' ? attachment.content : undefined;

    if (content) {
      if (content.length > MAX_ATTACHMENT_CONTENT_CHARS) {
        return {
          error: `Attachment "${name || 'unnamed-file'}" exceeds maximum size`,
        };
      }
      totalContentLength += content.length;
    }

    normalized.push({ name, type, content });
  }

  if (totalContentLength > MAX_TOTAL_ATTACHMENT_CONTENT_CHARS) {
    return {
      error: `Combined attachment size exceeds maximum allowed (${MAX_TOTAL_ATTACHMENT_CONTENT_CHARS} characters).`,
    };
  }

  return { attachments: normalized.length > 0 ? normalized : undefined };
}

async function executeToolWithTimeout(
  toolName: string,
  parameters: Record<string, any>,
  context: ToolContext,
): Promise<Awaited<ReturnType<typeof toolRegistry.executeTool>>> {
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      toolRegistry.executeTool(toolName, parameters, context),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Tool execution timed out after ${TOOL_EXECUTION_TIMEOUT_MS}ms`));
        }, TOOL_EXECUTION_TIMEOUT_MS);
        timeoutId.unref?.();
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * List all available tools
 * GET /api/mcp/tools
 */
mcpRouter.get('/tools', async (req, res) => {
  try {
    const tools = toolRegistry.getAllToolDocumentation();

    res.json({
      success: true,
      count: tools.length,
      tools
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to list tools', { error: errorMessage });
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * Get tool documentation by name
 * GET /api/mcp/tools/:name
 */
mcpRouter.get('/tools/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const tool = toolRegistry.getToolDocumentation(name);

    if (!tool) {
      return res.status(404).json({
        success: false,
        error: 'Tool not found'
      });
    }

    res.json({
      success: true,
      tool
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get tool', { error: errorMessage });
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * Execute a tool directly
 * POST /api/mcp/tools/:name/execute
 */
mcpRouter.post('/tools/:name/execute', aiLimiter, async (req: any, res) => {
  try {
    const { name } = req.params;
    const { parameters, context: additionalContext } = req.body;
    const { userId, organizationId } = resolveIdentityContext(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (!toolRegistry.getToolDocumentation(name)) {
      return res.status(404).json({
        success: false,
        error: 'Tool not found',
      });
    }

    if (
      parameters !== undefined
      && (typeof parameters !== 'object' || Array.isArray(parameters) || parameters === null)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameters payload',
      });
    }

    const context: ToolContext = {
      userId,
      organizationId,
      sessionId: req.sessionID,
      metadata: additionalContext
    };

    const result = await executeToolWithTimeout(name, parameters, context);

    // Log tool execution
    await auditService.logAudit({
      action: AuditAction.READ,
      entityType: 'tool_execution',
      entityId: name,
      userId,
      ipAddress: req.ip,
      metadata: {
        toolName: name,
        success: result.success,
        parameters
      }
    });

    res.json({
      success: true,
      result
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Tool execution failed', { error: errorMessage, tool: req.params.name });
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * List all registered agents
 * GET /api/mcp/agents
 */
mcpRouter.get('/agents', async (req, res) => {
  try {
    const agents = agentClient.listAgents();

    res.json({
      success: true,
      count: agents.length,
      agents: agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        model: agent.model,
        capabilities: agent.capabilities,
        availableTools: agent.tools
      }))
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to list agents', { error: errorMessage });
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * Get agent details
 * GET /api/mcp/agents/:id
 */
mcpRouter.get('/agents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const agent = agentClient.getAgent(id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    res.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        model: agent.model,
        capabilities: agent.capabilities,
        availableTools: agent.tools,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get agent', { error: errorMessage });
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * Execute an agent request
 * POST /api/mcp/agents/:id/execute
 */
mcpRouter.post('/agents/:id/execute', aiLimiter, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { prompt, context: additionalContext, maxIterations, attachments } = req.body;

    if (!agentClient.getAgent(id)) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Prompt exceeds maximum length (10000 characters)',
      });
    }

    const { userId, organizationId } = resolveIdentityContext(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const normalized = normalizeAttachments(attachments);
    if (normalized.error) {
      return res.status(400).json({
        success: false,
        error: normalized.error,
      });
    }

    const normalizedAttachments = normalized.attachments;
    const iterations = Number.isInteger(maxIterations)
      ? Math.min(Math.max(maxIterations, 1), 10)
      : 5;

    const agentRequest: AgentRequest = {
      agentId: id,
      prompt: trimmedPrompt,
      context: additionalContext,
      maxIterations: iterations,
      attachments: normalizedAttachments,
    };

    const context: ToolContext = {
      userId,
      organizationId,
      sessionId: req.sessionID,
      agentId: id,
      metadata: additionalContext
    };

    const response = await agentClient.execute(agentRequest, context);

    // Log agent execution
    await auditService.logAudit({
      action: AuditAction.CREATE,
      entityType: 'agent_execution',
      entityId: id,
      userId,
      ipAddress: req.ip,
      metadata: {
        agentId: id,
        prompt: prompt.substring(0, 100),
        toolCallsCount: response.toolCalls?.length || 0,
        attachmentCount: normalizedAttachments?.length || 0,
        success: true
      }
    });

    res.json({
      success: true,
      response
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Agent execution failed', { error: errorMessage, agentId: req.params.id });
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * Clear agent conversation history
 * POST /api/mcp/agents/:id/clear
 */
mcpRouter.post('/agents/:id/clear', aiLimiter, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }
    const conversationId = `${userId}_${id}`;

    agentClient.clearConversation(conversationId);

    res.json({
      success: true,
      message: 'Conversation cleared'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to clear conversation', { error: errorMessage });
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * Health check endpoint
 * GET /api/mcp/health
 */
mcpRouter.get('/health', async (req, res) => {
  try {
    const toolCount = toolRegistry.getAllTools().length;
    const agentCount = agentClient.listAgents().length;

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        toolRegistry: {
          status: 'operational',
          toolsRegistered: toolCount
        },
        agentClient: {
          status: 'operational',
          agentsRegistered: agentCount
        }
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('MCP health check failed', { error: errorMessage });
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: errorMessage
    });
  }
});

/**
 * Batch tool execution
 * POST /api/mcp/tools/batch
 */
mcpRouter.post('/tools/batch', aiLimiter, async (req: any, res) => {
  try {
    const { executions } = req.body;

    if (!Array.isArray(executions)) {
      return res.status(400).json({
        success: false,
        error: 'executions must be an array'
      });
    }

    if (executions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'executions cannot be empty',
      });
    }

    if (executions.length > MAX_BATCH_EXECUTIONS) {
      return res.status(400).json({
        success: false,
        error: `Too many executions. Maximum allowed is ${MAX_BATCH_EXECUTIONS}.`,
      });
    }

    const { userId, organizationId } = resolveIdentityContext(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const context: ToolContext = {
      userId,
      organizationId,
      sessionId: req.sessionID
    };

    const results: Array<{
      toolName: string;
      result: Awaited<ReturnType<typeof toolRegistry.executeTool>>;
    }> = [];

    for (const execution of executions) {
      if (!execution || typeof execution !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Each execution must be an object',
        });
      }

      const { toolName, parameters } = execution;
      if (typeof toolName !== 'string' || toolName.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Each execution must include a non-empty toolName',
        });
      }

      if (!toolRegistry.getToolDocumentation(toolName)) {
        return res.status(404).json({
          success: false,
          error: `Tool "${toolName}" not found`,
        });
      }

      if (
        parameters !== undefined
        && (typeof parameters !== 'object' || Array.isArray(parameters) || parameters === null)
      ) {
        return res.status(400).json({
          success: false,
          error: `Invalid parameters for tool "${toolName}"`,
        });
      }

      const result = await executeToolWithTimeout(toolName, parameters, context);
      results.push({
        toolName,
        result
      });
    }

    res.json({
      success: true,
      results
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Batch tool execution failed', { error: errorMessage });
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

export default mcpRouter;

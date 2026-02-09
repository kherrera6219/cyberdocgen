/**
 * MCP Server
 * Main server for Model Context Protocol
 */

import { Router } from 'express';
import { agentClient } from './agentClient';
import { toolRegistry } from './toolRegistry';
import { AgentRequest, ToolContext, MCPMessageType } from './types';
import { logger } from '../utils/logger';
import { auditService, AuditAction } from '../services/auditService';

export const mcpRouter = Router();

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
mcpRouter.post('/tools/:name/execute', async (req: any, res) => {
  try {
    const { name } = req.params;
    const { parameters, context: additionalContext } = req.body;

    const userId = req.user?.claims?.sub;
    const organizationId = req.user?.organization?.id;

    const context: ToolContext = {
      userId,
      organizationId,
      sessionId: req.sessionID,
      metadata: additionalContext
    };

    const result = await toolRegistry.executeTool(name, parameters, context);

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
mcpRouter.post('/agents/:id/execute', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { prompt, context: additionalContext, maxIterations } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const userId = req.user?.claims?.sub;
    const organizationId = req.user?.organization?.id;

    const agentRequest: AgentRequest = {
      agentId: id,
      prompt,
      context: additionalContext,
      maxIterations: maxIterations || 5
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
mcpRouter.post('/agents/:id/clear', async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.claims?.sub || 'anon';
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
mcpRouter.post('/tools/batch', async (req: any, res) => {
  try {
    const { executions } = req.body;

    if (!Array.isArray(executions)) {
      return res.status(400).json({
        success: false,
        error: 'executions must be an array'
      });
    }

    const userId = req.user?.claims?.sub;
    const organizationId = req.user?.organization?.id;

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
      const { toolName, parameters } = execution;
      const result = await toolRegistry.executeTool(toolName, parameters, context);
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

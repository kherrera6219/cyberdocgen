
import { Tool, ToolType, ToolResult, ToolContext } from './types';
import { logger } from '../utils/logger';
import { auditService, RiskLevel } from '../services/auditService';
import { circuitBreakers } from '../utils/circuitBreaker';

class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private rateLimitTracking: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * Register a new tool
   */
  registerTool(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      logger.warn(`Tool ${tool.name} already registered, overwriting`);
    }
    this.tools.set(tool.name, tool);
    logger.info(`Registered tool: ${tool.name} (${tool.type})`);
  }

  /**
   * Unregister a tool
   */
  unregisterTool(name: string): boolean {
    const deleted = this.tools.delete(name);
    if (deleted) {
      logger.info(`Unregistered tool: ${name}`);
    }
    return deleted;
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by type
   */
  getToolsByType(type: ToolType): Tool[] {
    return this.getAllTools().filter(tool => tool.type === type);
  }

  /**
   * Execute a tool with rate limiting and auth checks
   */
  async executeTool(
    name: string,
    params: Record<string, any>,
    context: ToolContext
  ): Promise<ToolResult> {
    const tool = this.getTool(name);

    if (!tool) {
      return {
        success: false,
        error: `Tool '${name}' not found`
      };
    }

    // Check authentication if required
    if (tool.requiresAuth && !context.userId) {
      return {
        success: false,
        error: 'Authentication required for this tool'
      };
    }

    // Validate parameters
    const validationError = this.validateParameters(params, tool.parameters);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    // Check rate limit
    if (tool.rateLimit && !this.checkRateLimit(name, tool.rateLimit, context.userId)) {
      await auditService.logEvent({
        action: 'tool_rate_limit_exceeded',
        userId: context.userId,
        organizationId: context.organizationId,
        resourceType: 'mcp_tool',
        resourceId: name,
        ipAddress: 'internal',
        riskLevel: RiskLevel.MEDIUM,
        details: { toolName: name }
      });
      return {
        success: false,
        error: 'Rate limit exceeded for this tool'
      };
    }

    try {
      // Execute with audit logging
      await auditService.logEvent({
        action: 'execute_mcp_tool',
        userId: context.userId,
        organizationId: context.organizationId,
        resourceType: 'mcp_tool',
        resourceId: name,
        ipAddress: 'internal',
        details: { parameters: params }
      });

      let result: ToolResult;

      // Use circuit breaker for external tools
      if (tool.type === ToolType.EXTERNAL) {
        // Find matching breaker or use a generic one
        const breakerMap = new Map<string, typeof circuitBreakers.openai>(Object.entries(circuitBreakers));
        const breaker = breakerMap.get(name) || circuitBreakers.openai; // Fallback to settings
        result = await breaker.execute(() => tool.handler(params, context));
      } else {
        result = await tool.handler(params, context);
      }

      if (result.success) {
        logger.info(`Tool ${name} executed successfully`, { userId: context.userId });
      } else {
        await auditService.logEvent({
          action: 'tool_execution_failed',
          userId: context.userId,
          organizationId: context.organizationId,
          resourceType: 'mcp_tool',
          resourceId: name,
          ipAddress: 'internal',
          riskLevel: RiskLevel.MEDIUM,
          details: { error: result.error }
        });
      }

      return result;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Tool execution failed: ${name}`, { error: errorMessage, userId: context.userId });

      await auditService.logEvent({
        action: 'tool_execution_error',
        userId: context.userId,
        organizationId: context.organizationId,
        resourceType: 'mcp_tool',
        resourceId: name,
        ipAddress: 'internal',
        riskLevel: RiskLevel.HIGH,
        details: { error: errorMessage }
      });

      // Enterprise hardening: mask implementation details in production
      const isDev = process.env.NODE_ENV === 'development';
      return {
        success: false,
        error: isDev ? `Tool execution failed: ${errorMessage}` : 'An internal error occurred during tool execution'
      };
    }
  }

  /**
   * Check rate limit for a tool
   */
  private checkRateLimit(
    toolName: string,
    rateLimit: { maxCalls: number; windowMs: number },
    userId?: string
  ): boolean {
    const key = `${toolName}:${userId || 'anonymous'}`;
    const now = Date.now();
    const tracking = this.rateLimitTracking.get(key);

    if (!tracking || now > tracking.resetTime) {
      this.rateLimitTracking.set(key, {
        count: 1,
        resetTime: now + rateLimit.windowMs
      });
      return true;
    }

    if (tracking.count >= rateLimit.maxCalls) {
      return false;
    }

    tracking.count++;
    return true;
  }

  /**
   * Validate tool parameters
   */
  private validateParameters(
    params: Record<string, any>,
    schema: Array<{ name: string; type: string; required: boolean }>
  ): string | null {
    for (const param of schema) {
      if (param.required && !(param.name in params)) {
        return `Missing required parameter: ${param.name}`;
      }

      if (param.name in params) {
        const value = params[param.name];
        const actualType = Array.isArray(value) ? 'array' : typeof value;

        if (param.type !== 'any' && actualType !== param.type) {
          return `Parameter ${param.name} must be of type ${param.type}`;
        }
      }
    }

    return null;
  }

  /**
   * List all available tool names
   */
  listToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get tool metadata for documentation
   */
  getToolDocumentation(name: string): any {
    const tool = this.getTool(name);
    if (!tool) return null;

    return {
      name: tool.name,
      description: tool.description,
      type: tool.type,
      parameters: tool.parameters,
      returns: tool.returns,
      requiresAuth: tool.requiresAuth || false,
      rateLimit: tool.rateLimit
    };
  }

  /**
   * Get all tool documentation
   */
  getAllToolDocumentation(): any[] {
    return this.getAllTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      type: tool.type,
      parameters: tool.parameters,
      returns: tool.returns,
      requiresAuth: tool.requiresAuth || false,
      rateLimit: tool.rateLimit
    }));
  }
}

export const toolRegistry = new ToolRegistry();

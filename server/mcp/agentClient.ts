/**
 * AI Agent Client
 * Manages AI agents with tool calling capabilities
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { AgentAttachment, AgentConfig, AgentRequest, AgentResponse, ToolCall, ToolContext } from './types';
import { toolRegistry } from './toolRegistry';
import { logger } from '../utils/logger';
import { generateContentWithGemini } from '../services/gemini';
import { promptTemplateRegistry } from '../services/promptTemplateRegistry';
import { aiUsageAccountingService } from '../services/aiUsageAccountingService';
import { aiOutputClassificationService } from '../services/aiOutputClassificationService';
import { aiMetadataAuditService } from '../services/aiMetadataAuditService';

let openaiClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

export function resetAgentModelClients(): void {
  openaiClient = null;
  anthropicClient = null;
}

export class AgentClient {
  private agentConfigs: Map<string, AgentConfig> = new Map();
  private activeConversations: Map<string, any[]> = new Map();

  /**
   * Register an agent configuration
   */
  registerAgent(config: AgentConfig): void {
    this.agentConfigs.set(config.id, config);
    logger.info(`Registered agent: ${config.name} (${config.id})`);
  }

  /**
   * Get agent configuration
   */
  getAgent(agentId: string): AgentConfig | undefined {
    return this.agentConfigs.get(agentId);
  }

  /**
   * Execute agent request with tool calling
   */
  async execute(request: AgentRequest, context: ToolContext): Promise<AgentResponse> {
    const agent = this.getAgent(request.agentId);

    if (!agent) {
      throw new Error(`Agent ${request.agentId} not found`);
    }

    const promptTemplate = promptTemplateRegistry.renderTemplate('mcp_agent', {
      agentId: request.agentId,
      prompt: request.prompt.slice(0, 1000),
    });
    const governedModel = this.toGovernedModel(agent.model);
    const budgetCheck = await aiUsageAccountingService.checkBudget({
      userId: context.userId,
      organizationId: context.organizationId,
      actionType: 'mcp_agent_execution',
      model: governedModel,
      prompt: request.prompt,
      expectedResponseTokens: agent.maxTokens || 2000,
    });
    if (!budgetCheck.allowed) {
      await aiMetadataAuditService.record({
        actionType: 'mcp_agent_execution',
        model: governedModel,
        userId: context.userId,
        organizationId: context.organizationId,
        requestId: context.sessionId,
        promptTemplateKey: promptTemplate.key,
        promptTemplateVersion: promptTemplate.version,
        metadata: {
          agentId: request.agentId,
          blockedReason: budgetCheck.reason || 'budget_exceeded',
        },
      });
      return {
        content: 'AI usage budget exceeded for this scope. Agent execution blocked.',
        toolCalls: [],
        metadata: {
          blocked: true,
          reason: budgetCheck.reason || 'budget_exceeded',
        },
      };
    }

    // Prepare tools for this agent
    const tools = this.prepareTools(agent.tools);

    // Execute based on model type
    let response: AgentResponse;
    if (agent.model === 'gpt-5.1') {
      response = await this.executeOpenAI(agent, request, context, tools);
    } else if (agent.model === 'claude-sonnet-4') {
      response = await this.executeAnthropic(agent, request, context, tools);
    } else if (agent.model === 'gemini-3-pro' || agent.model === 'gemini-3.0-pro') {
      response = await this.executeGemini(agent, request, context);
    } else {
      throw new Error(`Unsupported model: ${agent.model}`);
    }

    const usage = await aiUsageAccountingService.recordUsage({
      userId: context.userId,
      organizationId: context.organizationId,
      actionType: 'mcp_agent_execution',
      model: governedModel,
      prompt: request.prompt,
      response: response.content,
      purposeDescription: `MCP agent execution: ${agent.name}`,
      dataUsed: ['agent_prompt', 'tool_outputs'],
      aiContribution: 'assisted',
      humanOversight: true,
    });
    const outputClassification = aiOutputClassificationService.classify(response.content || '');
    await aiMetadataAuditService.record({
      actionType: 'mcp_agent_execution',
      model: governedModel,
      userId: context.userId,
      organizationId: context.organizationId,
      requestId: context.sessionId,
      promptTemplateKey: promptTemplate.key,
      promptTemplateVersion: promptTemplate.version,
      usage,
      outputClassification,
      metadata: {
        agentId: request.agentId,
        toolCallCount: response.toolCalls?.length || 0,
      },
    });

    return {
      ...response,
      metadata: {
        ...(response.metadata || {}),
        usage,
        outputClassification,
        promptTemplate: {
          key: promptTemplate.key,
          version: promptTemplate.version,
        },
      },
    };
  }

  /**
   * Execute with OpenAI
   */
  private async executeOpenAI(
    agent: AgentConfig,
    request: AgentRequest,
    context: ToolContext,
    tools: any[]
  ): Promise<AgentResponse> {
    try {
      const conversationId = `${context.userId || 'anon'}_${agent.id}`;
      const messages = this.getConversationHistory(conversationId);
      const promptWithAttachmentContext = this.buildPromptWithAttachments(
        request.prompt,
        request.attachments,
      );

      // Add system prompt if this is the start of conversation
      if (messages.length === 0) {
        messages.push({
          role: 'system',
          content: agent.systemPrompt
        });
      }

      // Add user message
      messages.push({
        role: 'user',
        content: promptWithAttachmentContext
      });

      const maxIterations = request.maxIterations || 5;
      let iteration = 0;
      const toolCalls: ToolCall[] = [];

      while (iteration < maxIterations) {
        iteration++;

        const response = await getOpenAIClient().chat.completions.create({
          model: 'gpt-5.1',
          messages,
          tools: tools.length > 0 ? tools : undefined,
          tool_choice: tools.length > 0 ? 'auto' : undefined,
          temperature: agent.temperature || 0.7,
          max_tokens: agent.maxTokens || 2000
        });

        const message = response.choices[0].message;

        // Add assistant response to messages
        messages.push(message as any);

        // Check if tool calls were made
        if (message.tool_calls && message.tool_calls.length > 0) {
          // Execute tool calls
          for (const toolCall of message.tool_calls) {
            // Handle both standard and custom tool call types
            const toolFunction = 'function' in toolCall ? toolCall.function : null;
            if (!toolFunction) continue;
            const toolName = toolFunction.name;
            const toolParams = this.parseToolArguments(toolFunction.arguments);

            logger.info('Executing tool', { toolName, agentId: agent.id });

            const toolResult = await toolRegistry.executeTool(
              toolName,
              toolParams,
              context
            );

            toolCalls.push({
              id: toolCall.id,
              toolName,
              parameters: toolParams,
              timestamp: new Date()
            });

            // Add tool result to messages
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult)
            } as any);
          }
        } else {
          // No more tool calls, return final response
          this.saveConversationHistory(conversationId, messages);

          return {
            content: message.content || '',
            toolCalls,
            metadata: {
              model: 'gpt-5.1',
              iterations: iteration,
              tokensUsed: response.usage?.total_tokens,
              attachmentCount: request.attachments?.length || 0,
            }
          };
        }
      }

      // Max iterations reached
      this.saveConversationHistory(conversationId, messages);

      return {
        content: 'Maximum iterations reached. Task may be incomplete.',
        toolCalls,
        metadata: {
          model: 'gpt-5.1',
          iterations: iteration,
          maxIterationsReached: true,
          attachmentCount: request.attachments?.length || 0,
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('OpenAI agent execution failed', { error: errorMessage, agentId: agent.id });
      throw error;
    }
  }

  /**
   * Execute with Anthropic Claude
   */
  private async executeAnthropic(
    agent: AgentConfig,
    request: AgentRequest,
    context: ToolContext,
    tools: any[]
  ): Promise<AgentResponse> {
    try {
      const conversationId = `${context.userId || 'anon'}_${agent.id}`;
      const messages = this.getConversationHistory(conversationId);
      const promptWithAttachmentContext = this.buildPromptWithAttachments(
        request.prompt,
        request.attachments,
      );

      // Add user message
      messages.push({
        role: 'user',
        content: promptWithAttachmentContext
      });

      const maxIterations = request.maxIterations || 5;
      let iteration = 0;
      const toolCalls: ToolCall[] = [];

      // Convert tools to Claude format
      const claudeTools = tools.map(tool => ({
        name: tool.function.name,
        description: tool.function.description,
        input_schema: tool.function.parameters
      }));

      while (iteration < maxIterations) {
        iteration++;

        const response = await getAnthropicClient().messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: agent.maxTokens || 4000,
          system: agent.systemPrompt,
          messages: messages as any,
          tools: claudeTools.length > 0 ? claudeTools as any : undefined,
          temperature: agent.temperature || 0.7
        });

        const content = response.content;

        // Check for tool use
        const toolUseBlocks = content.filter((block: any) => block.type === 'tool_use');

        if (toolUseBlocks.length > 0) {
          // Add assistant message with tool use
          messages.push({
            role: 'assistant',
            content: content as any
          });

          // Execute tools
          const toolResults: Array<{
            type: 'tool_result';
            tool_use_id: string;
            content: string;
          }> = [];

          for (const toolUse of toolUseBlocks) {
            const toolName = (toolUse as any).name;
            const toolParams = (toolUse as any).input;

            logger.info('Executing tool', { toolName, agentId: agent.id });

            const toolResult = await toolRegistry.executeTool(
              toolName,
              toolParams,
              context
            );

            toolCalls.push({
              id: (toolUse as any).id,
              toolName,
              parameters: toolParams,
              timestamp: new Date()
            });

            toolResults.push({
              type: 'tool_result',
              tool_use_id: String((toolUse as any).id),
              content: JSON.stringify(toolResult)
            });
          }

          // Add tool results to messages
          messages.push({
            role: 'user',
            content: toolResults as any
          });
        } else {
          // No more tool calls, extract text response
          const textBlock = content.find((block: any) => block.type === 'text');
          const finalContent = textBlock ? (textBlock as any).text : '';

          this.saveConversationHistory(conversationId, messages);

          return {
            content: finalContent,
            toolCalls,
            metadata: {
              model: 'claude-sonnet-4',
              iterations: iteration,
              tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
              attachmentCount: request.attachments?.length || 0,
            }
          };
        }
      }

      // Max iterations reached
      this.saveConversationHistory(conversationId, messages);

      return {
        content: 'Maximum iterations reached. Task may be incomplete.',
        toolCalls,
        metadata: {
          model: 'claude-sonnet-4',
          iterations: iteration,
          maxIterationsReached: true,
          attachmentCount: request.attachments?.length || 0,
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Anthropic agent execution failed', { error: errorMessage, agentId: agent.id });
      throw error;
    }
  }

  /**
   * Execute with Gemini for direct model usage.
   * Gemini agent runs without tool-calling and supports attachment-aware prompts.
   */
  private async executeGemini(
    agent: AgentConfig,
    request: AgentRequest,
    context: ToolContext,
  ): Promise<AgentResponse> {
    try {
      const conversationId = `${context.userId || 'anon'}_${agent.id}`;
      const messages = this.getConversationHistory(conversationId);
      const promptWithAttachmentContext = this.buildPromptWithAttachments(
        request.prompt,
        request.attachments,
      );

      if (messages.length === 0) {
        messages.push({
          role: 'system',
          content: agent.systemPrompt,
        });
      }

      messages.push({
        role: 'user',
        content: promptWithAttachmentContext,
      });

      const transcript = messages
        .slice(-10)
        .map((message) => `${message.role}: ${message.content}`)
        .join('\n');
      const geminiPrompt = `${agent.systemPrompt}\n\nConversation:\n${transcript}\n\nassistant:`;
      const content = await generateContentWithGemini(geminiPrompt);

      messages.push({
        role: 'assistant',
        content,
      });
      this.saveConversationHistory(conversationId, messages);

      return {
        content,
        toolCalls: [],
        metadata: {
          model: 'gemini-3-pro',
          iterations: 1,
          attachmentCount: request.attachments?.length || 0,
          toolsDisabled: true,
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Gemini agent execution failed', { error: errorMessage, agentId: agent.id });
      throw error;
    }
  }

  /**
   * Prepare tools in OpenAI format
   */
  private prepareTools(toolNames: string[]): any[] {
    return toolNames.map(name => {
      const tool = toolRegistry.getTool(name);
      if (!tool) {
        logger.warn(`Tool ${name} not found in registry`);
        return null;
      }

      return {
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: {
            type: 'object',
            properties: tool.parameters.reduce((acc, param) => {
              acc[param.name] = {
                type: param.type,
                description: param.description,
                ...(param.enum && { enum: param.enum })
              };
              return acc;
            }, {} as any),
            required: tool.parameters.filter(p => p.required).map(p => p.name)
          }
        }
      };
    }).filter(Boolean);
  }

  private parseToolArguments(rawArguments: string): Record<string, unknown> {
    try {
      const parsed = JSON.parse(rawArguments);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
      return {};
    } catch {
      return {};
    }
  }

  private buildPromptWithAttachments(prompt: string, attachments?: AgentAttachment[]): string {
    if (!attachments || attachments.length === 0) {
      return prompt;
    }

    const attachmentLines: string[] = [];
    let remainingTextBudget = 8000;
    const limitedAttachments = attachments.slice(0, 10);

    for (const attachment of limitedAttachments) {
      const name = attachment.name || 'unnamed-file';
      const type = attachment.type || 'application/octet-stream';
      const content = attachment.content || '';

      const decodedText = this.decodeAttachmentText(type, content);
      if (decodedText) {
        const trimmed = decodedText.trim();
        if (!trimmed) {
          attachmentLines.push(`[Attachment "${name}" (${type}) was empty after decoding]`);
          continue;
        }

        const maxAttachmentChars = Math.min(remainingTextBudget, 2000);
        const snippet = trimmed.length > maxAttachmentChars
          ? `${trimmed.slice(0, maxAttachmentChars)}...`
          : trimmed;
        attachmentLines.push(`[Attachment "${name}" (${type}) content]: ${snippet}`);
        remainingTextBudget -= snippet.length;
        if (remainingTextBudget <= 0) {
          break;
        }
        continue;
      }

      attachmentLines.push(`[Attachment "${name}" (${type}) attached]`);
    }

    if (attachmentLines.length === 0) {
      return prompt;
    }

    return `${prompt}\n\n${attachmentLines.join('\n')}`;
  }

  private decodeAttachmentText(type: string, content: string): string | null {
    if (!content) {
      return null;
    }

    const normalizedType = type.toLowerCase();
    if (normalizedType === 'text/plain' || normalizedType === 'application/json') {
      return this.decodeDataUrlIfPresent(content);
    }

    return null;
  }

  private decodeDataUrlIfPresent(content: string): string {
    if (!content.startsWith('data:')) {
      return content;
    }

    const parts = content.split(',', 2);
    if (parts.length < 2) {
      return '';
    }

    const metadata = parts[0].toLowerCase();
    const data = parts[1];
    if (!metadata.includes(';base64')) {
      try {
        return decodeURIComponent(data);
      } catch {
        return data;
      }
    }

    try {
      return Buffer.from(data, 'base64').toString('utf8');
    } catch {
      return '';
    }
  }

  private toGovernedModel(model: AgentConfig["model"]): "gpt-5.1" | "claude-sonnet-4" | "gemini-3-pro" {
    if (model === "gemini-3.0-pro") {
      return "gemini-3-pro";
    }
    return model;
  }

  /**
   * Get conversation history
   */
  private getConversationHistory(conversationId: string): any[] {
    return this.activeConversations.get(conversationId) || [];
  }

  /**
   * Save conversation history
   */
  private saveConversationHistory(conversationId: string, messages: any[]): void {
    // Keep only last 20 messages to manage memory
    const trimmedMessages = messages.slice(-20);
    this.activeConversations.set(conversationId, trimmedMessages);
  }

  /**
   * Clear conversation history
   */
  clearConversation(conversationId: string): void {
    this.activeConversations.delete(conversationId);
  }

  /**
   * List all registered agents
   */
  listAgents(): AgentConfig[] {
    return Array.from(this.agentConfigs.values());
  }
}

export const agentClient = new AgentClient();

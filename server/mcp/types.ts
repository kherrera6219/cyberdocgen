/**
 * Model Context Protocol (MCP) Types
 * Defines the protocol for AI agent communication and tool calling
 */

export enum MCPMessageType {
  TOOL_CALL = 'tool_call',
  TOOL_RESULT = 'tool_result',
  CONTEXT_UPDATE = 'context_update',
  AGENT_REQUEST = 'agent_request',
  AGENT_RESPONSE = 'agent_response',
  ERROR = 'error'
}

export enum ToolType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  HYBRID = 'hybrid'
}

export interface MCPMessage {
  id: string;
  type: MCPMessageType;
  timestamp: Date;
  payload: any;
  metadata?: Record<string, any>;
}

export interface Tool {
  name: string;
  description: string;
  type: ToolType;
  parameters: ToolParameter[];
  returns: ToolReturn;
  handler: ToolHandler;
  rateLimit?: RateLimit;
  requiresAuth?: boolean;
  metadata?: Record<string, any>;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
  enum?: any[];
}

export interface ToolReturn {
  type: string;
  description: string;
  schema?: Record<string, any>;
}

export interface ToolHandler {
  (params: Record<string, any>, context: ToolContext): Promise<ToolResult>;
}

export interface ToolContext {
  userId?: string;
  organizationId?: string;
  sessionId?: string;
  agentId?: string;
  metadata?: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface RateLimit {
  maxCalls: number;
  windowMs: number;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  model: 'gpt-4o' | 'claude-sonnet-4' | 'gemini-2.5-pro';
  tools: string[]; // Tool names available to this agent
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  capabilities: AgentCapability[];
}

export enum AgentCapability {
  DOCUMENT_GENERATION = 'document_generation',
  COMPLIANCE_ANALYSIS = 'compliance_analysis',
  RISK_ASSESSMENT = 'risk_assessment',
  QUALITY_SCORING = 'quality_scoring',
  GAP_ANALYSIS = 'gap_analysis',
  CHAT_INTERACTION = 'chat_interaction',
  DATA_EXTRACTION = 'data_extraction',
  EXTERNAL_API_CALLS = 'external_api_calls'
}

export interface AgentRequest {
  agentId: string;
  prompt: string;
  context?: Record<string, any>;
  tools?: string[];
  maxIterations?: number;
}

export interface AgentResponse {
  content: string;
  toolCalls?: ToolCall[];
  reasoning?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface ToolCall {
  id: string;
  toolName: string;
  parameters: Record<string, any>;
  timestamp: Date;
}

export interface MCPServerConfig {
  port?: number;
  enableWebSocket?: boolean;
  enableHTTP?: boolean;
  maxConnections?: number;
  timeout?: number;
}

/**
 * MCP Initialization
 * Register all tools and agents
 */

import { toolRegistry } from './toolRegistry';
import { agentClient } from './agentClient';
import { internalTools } from './tools/internal';
import { externalTools } from './tools/external';
import { AgentConfig, AgentCapability } from './types';
import { logger } from '../utils/logger';

/**
 * Initialize MCP system
 */
export function initializeMCP(): void {
  logger.info('Initializing MCP system...');

  // Register all internal tools
  internalTools.forEach(tool => {
    toolRegistry.registerTool(tool);
  });

  // Register all external tools
  externalTools.forEach(tool => {
    toolRegistry.registerTool(tool);
  });

  // Register predefined agents
  registerPredefinedAgents();

  logger.info('MCP system initialized successfully', {
    toolsRegistered: toolRegistry.getAllTools().length,
    agentsRegistered: agentClient.listAgents().length
  });
}

/**
 * Register predefined agent configurations
 */
function registerPredefinedAgents(): void {

  // Compliance Assistant Agent
  const complianceAssistant: AgentConfig = {
    id: 'compliance-assistant',
    name: 'Compliance Assistant',
    description: 'Expert assistant for compliance documentation, gap analysis, and framework implementation',
    model: 'gpt-4o',
    tools: [
      'get_company_profile',
      'get_documents',
      'analyze_document_quality',
      'perform_gap_analysis',
      'search_documents',
      'web_search',
      'get_regulatory_updates'
    ],
    systemPrompt: `You are an expert compliance assistant specializing in cybersecurity frameworks like ISO 27001, SOC 2, NIST, and GDPR.

Your capabilities:
- Analyze compliance documentation and provide quality scores
- Identify gaps in compliance implementations
- Search for relevant regulatory updates and best practices
- Guide users through compliance requirements
- Recommend improvements to policies and procedures

Always:
- Provide specific, actionable recommendations
- Reference relevant compliance standards
- Use tools to gather current information
- Be thorough and professional in your analysis
- Ask clarifying questions when needed`,
    temperature: 0.7,
    maxTokens: 2000,
    capabilities: [
      AgentCapability.COMPLIANCE_ANALYSIS,
      AgentCapability.GAP_ANALYSIS,
      AgentCapability.QUALITY_SCORING,
      AgentCapability.CHAT_INTERACTION
    ]
  };

  // Document Generator Agent
  const documentGenerator: AgentConfig = {
    id: 'document-generator',
    name: 'Document Generator',
    description: 'Specialized agent for generating compliance documents, policies, and procedures',
    model: 'claude-sonnet-4',
    tools: [
      'get_company_profile',
      'generate_document',
      'analyze_document_quality',
      'get_documents',
      'web_search'
    ],
    systemPrompt: `You are a specialized document generation agent focused on creating high-quality compliance documentation.

Your capabilities:
- Generate comprehensive policies and procedures
- Ensure documentation meets compliance standards
- Tailor content to specific industries and company profiles
- Incorporate regulatory requirements and best practices
- Validate document quality automatically

Always:
- Generate professional, clear, and actionable content
- Include all required sections for compliance frameworks
- Use company-specific information appropriately
- Ensure documents are implementation-ready
- Follow industry best practices and standards`,
    temperature: 0.6,
    maxTokens: 4000,
    capabilities: [
      AgentCapability.DOCUMENT_GENERATION,
      AgentCapability.COMPLIANCE_ANALYSIS,
      AgentCapability.QUALITY_SCORING
    ]
  };

  // Risk Assessment Agent
  const riskAssessment: AgentConfig = {
    id: 'risk-assessment',
    name: 'Risk Assessment Specialist',
    description: 'Expert in organizational risk assessment and threat analysis',
    model: 'gpt-4o',
    tools: [
      'get_company_profile',
      'perform_risk_assessment',
      'get_documents',
      'web_search',
      'get_regulatory_updates',
      'search_documents'
    ],
    systemPrompt: `You are a cybersecurity risk assessment specialist with expertise in:
- Organizational risk analysis
- Threat landscape evaluation
- Control effectiveness assessment
- Risk mitigation strategies
- Compliance risk identification

Your approach:
- Conduct thorough risk assessments based on company profile
- Identify critical vulnerabilities and threats
- Prioritize risks based on likelihood and impact
- Recommend practical mitigation strategies
- Consider industry-specific threats

Always:
- Provide quantifiable risk scores
- Explain risk factors clearly
- Recommend actionable mitigations
- Consider business context
- Stay current with threat intelligence`,
    temperature: 0.7,
    maxTokens: 2500,
    capabilities: [
      AgentCapability.RISK_ASSESSMENT,
      AgentCapability.COMPLIANCE_ANALYSIS,
      AgentCapability.CHAT_INTERACTION
    ]
  };

  // Data Extraction Agent
  const dataExtractor: AgentConfig = {
    id: 'data-extractor',
    name: 'Data Extraction Agent',
    description: 'Specialized in extracting structured data from documents and external sources',
    model: 'claude-sonnet-4',
    tools: [
      'get_documents',
      'search_documents',
      'fetch_url',
      'web_search'
    ],
    systemPrompt: `You are a data extraction specialist focused on:
- Extracting structured information from documents
- Parsing compliance documentation
- Gathering information from external sources
- Identifying key data points and metadata
- Validating extracted information

Your process:
- Use search tools to find relevant content
- Extract specific data points accurately
- Validate information from multiple sources
- Present data in structured format
- Highlight confidence levels

Always:
- Be precise and accurate in extraction
- Validate critical information
- Provide source references
- Structure data logically
- Indicate any uncertainties`,
    temperature: 0.5,
    maxTokens: 3000,
    capabilities: [
      AgentCapability.DATA_EXTRACTION,
      AgentCapability.EXTERNAL_API_CALLS,
      AgentCapability.CHAT_INTERACTION
    ]
  };

  // Compliance Chat Agent
  const complianceChat: AgentConfig = {
    id: 'compliance-chat',
    name: 'Compliance Chatbot',
    description: 'Interactive chatbot for answering compliance questions and providing guidance',
    model: 'gpt-4o',
    tools: [
      'get_documents',
      'search_documents',
      'get_company_profile',
      'web_search',
      'get_regulatory_updates',
      'check_api_health'
    ],
    systemPrompt: `You are a friendly and knowledgeable compliance chatbot helping users with:
- Answering compliance questions
- Providing implementation guidance
- Explaining regulatory requirements
- Searching documentation
- Staying updated on regulatory changes

Your style:
- Conversational and approachable
- Clear and concise explanations
- Proactive in using tools to find information
- Patient and thorough
- Helpful and supportive

Always:
- Search documentation first before answering
- Provide specific examples
- Reference standards and requirements
- Offer to elaborate or clarify
- Stay within your knowledge domain`,
    temperature: 0.8,
    maxTokens: 1500,
    capabilities: [
      AgentCapability.CHAT_INTERACTION,
      AgentCapability.COMPLIANCE_ANALYSIS,
      AgentCapability.EXTERNAL_API_CALLS
    ]
  };

  // Register all agents
  [
    complianceAssistant,
    documentGenerator,
    riskAssessment,
    dataExtractor,
    complianceChat
  ].forEach(agent => {
    agentClient.registerAgent(agent);
  });
}

/**
 * Get recommended agent for a specific task
 */
export function getRecommendedAgent(task: string): string {
  const taskLower = task.toLowerCase();

  if (taskLower.includes('generate') || taskLower.includes('create document')) {
    return 'document-generator';
  }

  if (taskLower.includes('risk') || taskLower.includes('threat')) {
    return 'risk-assessment';
  }

  if (taskLower.includes('gap') || taskLower.includes('analysis')) {
    return 'compliance-assistant';
  }

  if (taskLower.includes('extract') || taskLower.includes('parse')) {
    return 'data-extractor';
  }

  // Default to compliance chat for general queries
  return 'compliance-chat';
}

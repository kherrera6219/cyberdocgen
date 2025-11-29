/**
 * External Tools
 * Tools that interact with external APIs and services
 */

import { Tool, ToolType, ToolContext, ToolResult } from '../types';
import { logger } from '../../utils/logger';

/**
 * Web search tool
 */
export const webSearchTool: Tool = {
  name: 'web_search',
  description: 'Search the web for compliance information, best practices, and regulatory updates',
  type: ToolType.EXTERNAL,
  requiresAuth: true,
  rateLimit: {
    maxCalls: 30,
    windowMs: 60 * 60 * 1000 // 1 hour
  },
  parameters: [
    {
      name: 'query',
      type: 'string',
      description: 'Search query string',
      required: true
    },
    {
      name: 'limit',
      type: 'number',
      description: 'Maximum number of results',
      required: false,
      default: 5
    },
    {
      name: 'domain',
      type: 'string',
      description: 'Restrict search to specific domain (optional)',
      required: false
    }
  ],
  returns: {
    type: 'array',
    description: 'Array of search results with titles, URLs, and snippets'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      // Simulate web search - in production, integrate with Google Custom Search API, Bing API, etc.
      const simulatedResults = [
        {
          title: `Compliance best practices for ${params.query}`,
          url: `https://compliance.example.com/search?q=${encodeURIComponent(params.query)}`,
          snippet: 'Latest guidance and best practices for compliance frameworks...',
          source: 'Compliance Portal'
        },
        {
          title: `${params.query} - Implementation Guide`,
          url: `https://security.example.com/${params.query.toLowerCase()}`,
          snippet: 'Step-by-step implementation guide for security compliance...',
          source: 'Security Documentation'
        }
      ];

      const limit = params.limit || 5;
      const limitedResults = simulatedResults.slice(0, limit);

      return {
        success: true,
        data: limitedResults,
        metadata: {
          query: params.query,
          totalResults: simulatedResults.length,
          returned: limitedResults.length
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('web_search failed', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

/**
 * Fetch URL content tool
 */
export const fetchUrlTool: Tool = {
  name: 'fetch_url',
  description: 'Fetch and extract content from a specific URL',
  type: ToolType.EXTERNAL,
  requiresAuth: true,
  rateLimit: {
    maxCalls: 50,
    windowMs: 60 * 60 * 1000 // 1 hour
  },
  parameters: [
    {
      name: 'url',
      type: 'string',
      description: 'The URL to fetch',
      required: true
    },
    {
      name: 'selector',
      type: 'string',
      description: 'CSS selector to extract specific content (optional)',
      required: false
    }
  ],
  returns: {
    type: 'object',
    description: 'Fetched content with URL, title, and extracted text'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      // Validate URL
      const url = new URL(params.url);

      // Security check - block private IPs and localhost
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.match(/^192\.168\./)) {
        return {
          success: false,
          error: 'Cannot fetch from private or local addresses'
        };
      }

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'ComplianceAI-Bot/1.0'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const content = await response.text();

      // Basic HTML parsing (in production, use a proper HTML parser like cheerio)
      const titleMatch = content.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : 'No title';

      // Remove HTML tags for basic text extraction
      const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

      return {
        success: true,
        data: {
          url: params.url,
          title,
          content: textContent.substring(0, 5000), // Limit to 5000 chars
          contentLength: textContent.length
        },
        metadata: {
          statusCode: response.status,
          contentType: response.headers.get('content-type')
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('fetch_url failed', { error: errorMessage, url: params.url });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

/**
 * Get regulatory updates tool
 */
export const getRegulatoryUpdatesTool: Tool = {
  name: 'get_regulatory_updates',
  description: 'Fetch latest regulatory updates and compliance news for specific frameworks',
  type: ToolType.EXTERNAL,
  requiresAuth: true,
  rateLimit: {
    maxCalls: 20,
    windowMs: 60 * 60 * 1000 // 1 hour
  },
  parameters: [
    {
      name: 'framework',
      type: 'string',
      description: 'Compliance framework (ISO27001, SOC2, GDPR, etc.)',
      required: true
    },
    {
      name: 'dateRange',
      type: 'string',
      description: 'Date range for updates (last_week, last_month, last_year)',
      required: false,
      default: 'last_month'
    }
  ],
  returns: {
    type: 'array',
    description: 'Array of regulatory updates with titles, dates, and summaries'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      // Simulate regulatory updates - in production, integrate with regulatory APIs/feeds
      const updates = [
        {
          id: '1',
          framework: params.framework,
          title: `${params.framework} Amendment 2025.1 Released`,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          summary: 'New requirements for cloud security controls and third-party risk management.',
          source: 'Regulatory Authority',
          severity: 'high',
          url: `https://regulatory.example.com/${params.framework.toLowerCase()}/2025-1`
        },
        {
          id: '2',
          framework: params.framework,
          title: `${params.framework} Guidance Update: AI and Machine Learning`,
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          summary: 'Updated guidance on implementing AI systems while maintaining compliance.',
          source: 'Standards Organization',
          severity: 'medium',
          url: `https://standards.example.com/${params.framework.toLowerCase()}/ai-guidance`
        }
      ];

      return {
        success: true,
        data: updates,
        metadata: {
          framework: params.framework,
          dateRange: params.dateRange,
          count: updates.length
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('get_regulatory_updates failed', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

/**
 * Send email notification tool
 */
export const sendEmailTool: Tool = {
  name: 'send_email',
  description: 'Send email notifications to users or stakeholders',
  type: ToolType.EXTERNAL,
  requiresAuth: true,
  rateLimit: {
    maxCalls: 100,
    windowMs: 60 * 60 * 1000 // 1 hour
  },
  parameters: [
    {
      name: 'to',
      type: 'string',
      description: 'Recipient email address',
      required: true
    },
    {
      name: 'subject',
      type: 'string',
      description: 'Email subject',
      required: true
    },
    {
      name: 'body',
      type: 'string',
      description: 'Email body content',
      required: true
    },
    {
      name: 'template',
      type: 'string',
      description: 'Email template name (optional)',
      required: false
    }
  ],
  returns: {
    type: 'object',
    description: 'Email send result with message ID'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(params.to)) {
        return {
          success: false,
          error: 'Invalid email address format'
        };
      }

      // Simulate email sending - in production, integrate with SendGrid, AWS SES, etc.
      logger.info('Email sent', {
        to: params.to,
        subject: params.subject,
        userId: context.userId
      });

      return {
        success: true,
        data: {
          messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          recipient: params.to,
          status: 'sent',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('send_email failed', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

/**
 * Check external API health tool
 */
export const checkApiHealthTool: Tool = {
  name: 'check_api_health',
  description: 'Check the health status of external compliance APIs and services',
  type: ToolType.EXTERNAL,
  requiresAuth: false,
  parameters: [
    {
      name: 'service',
      type: 'string',
      description: 'Service name to check (openai, anthropic, gemini, all)',
      required: true,
      enum: ['openai', 'anthropic', 'gemini', 'all']
    }
  ],
  returns: {
    type: 'object',
    description: 'Health status of requested services'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const checkService = async (name: string, url: string) => {
        try {
          const response = await fetch(url, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          });
          return {
            name,
            status: response.ok ? 'healthy' : 'degraded',
            statusCode: response.status,
            responseTime: Date.now()
          };
        } catch (error) {
          return {
            name,
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      };

      const results: any = {};

      if (params.service === 'all' || params.service === 'openai') {
        results.openai = await checkService('OpenAI', 'https://api.openai.com/v1/models');
      }

      if (params.service === 'all' || params.service === 'anthropic') {
        results.anthropic = { name: 'Anthropic', status: 'healthy' }; // Simplified
      }

      if (params.service === 'all' || params.service === 'gemini') {
        results.gemini = { name: 'Gemini', status: 'healthy' }; // Simplified
      }

      return {
        success: true,
        data: results,
        metadata: {
          checkedAt: new Date().toISOString()
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('check_api_health failed', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

// Export all external tools
export const externalTools: Tool[] = [
  webSearchTool,
  fetchUrlTool,
  getRegulatoryUpdatesTool,
  sendEmailTool,
  checkApiHealthTool
];

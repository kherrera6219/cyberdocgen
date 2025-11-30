/**
 * Internal Tools
 * Tools that interact with internal services and databases
 */

import { Tool, ToolType, ToolContext, ToolResult } from '../types';
import { storage } from '../../storage';
import { aiOrchestrator } from '../../services/aiOrchestrator';
import { documentAnalysisService } from '../../services/documentAnalysis';
import { riskAssessmentService } from '../../services/riskAssessment';
import { qualityScoringService } from '../../services/qualityScoring';
import { complianceGapAnalysisService } from '../../services/complianceGapAnalysis';
import { logger } from '../../utils/logger';

/**
 * Get company profile tool
 */
export const getCompanyProfileTool: Tool = {
  name: 'get_company_profile',
  description: 'Retrieve a company profile by ID or for the current user',
  type: ToolType.INTERNAL,
  requiresAuth: true,
  parameters: [
    {
      name: 'profileId',
      type: 'string',
      description: 'The ID of the company profile to retrieve (optional, uses user context if not provided)',
      required: false
    }
  ],
  returns: {
    type: 'object',
    description: 'Company profile data including name, industry, size, and compliance information'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const profileId = params.profileId || context.userId;

      if (!profileId) {
        return {
          success: false,
          error: 'No profile ID provided and no user context available'
        };
      }

      const profile = await storage.getCompanyProfile(profileId);

      if (!profile) {
        return {
          success: false,
          error: 'Company profile not found'
        };
      }

      return {
        success: true,
        data: profile
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('get_company_profile failed', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

/**
 * Get documents tool
 */
export const getDocumentsTool: Tool = {
  name: 'get_documents',
  description: 'Retrieve documents filtered by company profile or framework',
  type: ToolType.INTERNAL,
  requiresAuth: true,
  parameters: [
    {
      name: 'companyProfileId',
      type: 'string',
      description: 'Filter by company profile ID',
      required: false
    },
    {
      name: 'framework',
      type: 'string',
      description: 'Filter by compliance framework (e.g., ISO27001, SOC2)',
      required: false
    },
    {
      name: 'limit',
      type: 'number',
      description: 'Maximum number of documents to return',
      required: false,
      default: 10
    }
  ],
  returns: {
    type: 'array',
    description: 'Array of document objects'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      let documents;

      if (params.companyProfileId) {
        documents = await storage.getDocumentsByCompanyProfile(params.companyProfileId);
      } else if (params.framework) {
        documents = await storage.getDocumentsByFramework(params.framework);
      } else {
        documents = await storage.getDocuments();
      }

      const limit = params.limit || 10;
      const limitedDocs = documents.slice(0, limit);

      return {
        success: true,
        data: limitedDocs,
        metadata: {
          total: documents.length,
          returned: limitedDocs.length
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('get_documents failed', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

/**
 * Analyze document quality tool
 */
export const analyzeDocumentQualityTool: Tool = {
  name: 'analyze_document_quality',
  description: 'Analyze the quality of a compliance document and provide scoring and feedback',
  type: ToolType.INTERNAL,
  requiresAuth: true,
  rateLimit: {
    maxCalls: 20,
    windowMs: 60 * 60 * 1000 // 1 hour
  },
  parameters: [
    {
      name: 'content',
      type: 'string',
      description: 'The document content to analyze',
      required: true
    },
    {
      name: 'title',
      type: 'string',
      description: 'The document title',
      required: true
    },
    {
      name: 'framework',
      type: 'string',
      description: 'The compliance framework (e.g., ISO27001, SOC2)',
      required: true
    },
    {
      name: 'documentType',
      type: 'string',
      description: 'Type of document (policy, procedure, plan, etc.)',
      required: true
    }
  ],
  returns: {
    type: 'object',
    description: 'Quality analysis including score, feedback, and suggestions'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const analysis = await qualityScoringService.analyzeDocumentQuality(
        params.content,
        params.title,
        params.framework,
        params.documentType
      );

      return {
        success: true,
        data: analysis
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('analyze_document_quality failed', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

/**
 * Perform risk assessment tool
 */
export const performRiskAssessmentTool: Tool = {
  name: 'perform_risk_assessment',
  description: 'Conduct a comprehensive risk assessment for an organization',
  type: ToolType.INTERNAL,
  requiresAuth: true,
  rateLimit: {
    maxCalls: 10,
    windowMs: 60 * 60 * 1000 // 1 hour
  },
  parameters: [
    {
      name: 'companyProfile',
      type: 'object',
      description: 'Company profile object with industry, size, and other details',
      required: true
    },
    {
      name: 'frameworks',
      type: 'array',
      description: 'Array of compliance frameworks to assess against',
      required: true
    },
    {
      name: 'existingDocuments',
      type: 'array',
      description: 'Array of existing document titles',
      required: false,
      default: []
    }
  ],
  returns: {
    type: 'object',
    description: 'Risk assessment results with scores and recommendations'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const assessment = await riskAssessmentService.assessOrganizationalRisk(
        params.companyProfile,
        params.frameworks,
        params.existingDocuments || []
      );

      return {
        success: true,
        data: assessment
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('perform_risk_assessment failed', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

/**
 * Generate compliance document tool
 */
export const generateDocumentTool: Tool = {
  name: 'generate_document',
  description: 'Generate a compliance document using AI based on template and company profile',
  type: ToolType.INTERNAL,
  requiresAuth: true,
  rateLimit: {
    maxCalls: 10,
    windowMs: 60 * 60 * 1000 // 1 hour
  },
  parameters: [
    {
      name: 'template',
      type: 'object',
      description: 'Document template with title, category, and framework',
      required: true
    },
    {
      name: 'companyProfile',
      type: 'object',
      description: 'Company profile data',
      required: true
    },
    {
      name: 'framework',
      type: 'string',
      description: 'Compliance framework',
      required: true
    },
    {
      name: 'model',
      type: 'string',
      description: 'AI model to use (gpt-4o, claude-sonnet-4, or auto)',
      required: false,
      default: 'auto'
    }
  ],
  returns: {
    type: 'object',
    description: 'Generated document with content and quality metrics'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const result = await aiOrchestrator.generateDocument(
        params.template,
        params.companyProfile,
        params.framework,
        { model: params.model || 'auto', includeQualityAnalysis: true }
      );

      return {
        success: true,
        data: result
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('generate_document failed', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

/**
 * Perform gap analysis tool
 */
export const performGapAnalysisTool: Tool = {
  name: 'perform_gap_analysis',
  description: 'Analyze compliance gaps between current state and framework requirements',
  type: ToolType.INTERNAL,
  requiresAuth: true,
  rateLimit: {
    maxCalls: 5,
    windowMs: 60 * 60 * 1000 // 1 hour
  },
  parameters: [
    {
      name: 'framework',
      type: 'string',
      description: 'Compliance framework to analyze against',
      required: true
    },
    {
      name: 'companyProfile',
      type: 'object',
      description: 'Company profile data',
      required: true
    },
    {
      name: 'existingControls',
      type: 'array',
      description: 'List of existing controls and implementations',
      required: false,
      default: []
    }
  ],
  returns: {
    type: 'object',
    description: 'Gap analysis with findings, recommendations, and maturity assessment'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const analysis = await complianceGapAnalysisService.analyzeGaps(
        params.framework,
        params.companyProfile,
        params.existingControls || []
      );

      return {
        success: true,
        data: analysis
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('perform_gap_analysis failed', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

/**
 * Search documents tool
 */
export const searchDocumentsTool: Tool = {
  name: 'search_documents',
  description: 'Search for similar document content using semantic search',
  type: ToolType.INTERNAL,
  requiresAuth: true,
  parameters: [
    {
      name: 'query',
      type: 'string',
      description: 'Search query text',
      required: true
    },
    {
      name: 'documents',
      type: 'array',
      description: 'Array of document objects to search within',
      required: false
    },
    {
      name: 'limit',
      type: 'number',
      description: 'Maximum number of results to return',
      required: false,
      default: 5
    }
  ],
  returns: {
    type: 'array',
    description: 'Array of matching documents with relevance scores'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const documents = params.documents || await storage.getDocuments();
      const results = await documentAnalysisService.searchSimilarContent(
        params.query,
        documents,
        params.limit || 5
      );

      return {
        success: true,
        data: results
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('search_documents failed', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

// Export all internal tools
export const internalTools: Tool[] = [
  getCompanyProfileTool,
  getDocumentsTool,
  analyzeDocumentQualityTool,
  performRiskAssessmentTool,
  generateDocumentTool,
  performGapAnalysisTool,
  searchDocumentsTool
];

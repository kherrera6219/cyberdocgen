/**
 * Advanced Tools
 * Sophisticated tools that leverage existing services and add new capabilities
 */

import { Tool, ToolType, ToolContext, ToolResult } from '../types';
import { storage } from '../../storage';
import { aiOrchestrator } from '../../services/aiOrchestrator';
import { complianceChatbot } from '../../services/chatbot';
import { versionService } from '../../services/versionService';
import { auditService } from '../../services/auditService';
import { DocumentTemplateService } from '../../services/documentTemplates';
import { logger } from '../../utils/logger';

/**
 * Get document templates tool
 */
export const getDocumentTemplatesTool: Tool = {
  name: 'get_document_templates',
  description: 'Get available document templates for compliance frameworks',
  type: ToolType.INTERNAL,
  requiresAuth: false,
  parameters: [
    {
      name: 'framework',
      type: 'string',
      description: 'Compliance framework (ISO27001, SOC2, FedRAMP, NIST, GDPR)',
      required: false
    },
    {
      name: 'category',
      type: 'string',
      description: 'Template category (policy, procedure, plan, etc.)',
      required: false
    }
  ],
  returns: {
    type: 'array',
    description: 'Array of available document templates'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      let templates;

      if (params.framework) {
        templates = DocumentTemplateService.getTemplatesByFramework(params.framework);
      } else {
        // Get all templates from all frameworks
        templates = DocumentTemplateService.getAllTemplates();
      }

      if (params.category) {
        templates = templates.filter((t: any) =>
          t.category.toLowerCase().includes(params.category.toLowerCase())
        );
      }

      return {
        success: true,
        data: templates,
        metadata: {
          count: templates.length,
          framework: params.framework,
          category: params.category
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('get_document_templates failed', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

/**
 * Get framework information tool
 */
export const getFrameworkInfoTool: Tool = {
  name: 'get_framework_info',
  description: 'Get detailed information about compliance frameworks',
  type: ToolType.INTERNAL,
  requiresAuth: false,
  parameters: [
    {
      name: 'framework',
      type: 'string',
      description: 'Framework name (ISO27001, SOC2, FedRAMP, NIST, GDPR)',
      required: true,
      enum: ['ISO27001', 'SOC2', 'FedRAMP', 'NIST', 'GDPR', 'HIPAA', 'PCI-DSS']
    }
  ],
  returns: {
    type: 'object',
    description: 'Framework information including requirements, controls, and documentation needs'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const frameworkInfo: Record<string, any> = {
        'ISO27001': {
          name: 'ISO/IEC 27001',
          fullName: 'Information Security Management System',
          description: 'International standard for information security management',
          controls: 93,
          controlFamilies: ['Organizational', 'People', 'Physical', 'Technological'],
          requiredDocuments: 20,
          certificationBody: 'Accredited certification bodies',
          auditCycle: 'Annual surveillance, 3-year recertification',
          keyRequirements: [
            'Risk assessment and treatment',
            'Statement of Applicability (SoA)',
            'Information security policies',
            'Asset management',
            'Access control',
            'Cryptography',
            'Physical security',
            'Operations security',
            'Communications security',
            'System acquisition and development',
            'Supplier relationships',
            'Incident management',
            'Business continuity',
            'Compliance'
          ]
        },
        'SOC2': {
          name: 'SOC 2',
          fullName: 'Service Organization Control 2',
          description: 'Audit for service providers storing customer data',
          controls: 'Variable based on TSC',
          controlFamilies: ['Trust Service Criteria (TSC)'],
          requiredDocuments: 15,
          certificationBody: 'Licensed CPAs',
          auditCycle: 'Type I (point in time) or Type II (3-12 months)',
          keyRequirements: [
            'Security (mandatory)',
            'Availability (optional)',
            'Processing Integrity (optional)',
            'Confidentiality (optional)',
            'Privacy (optional)',
            'System description',
            'Control environment',
            'Risk assessment',
            'Monitoring',
            'Control activities',
            'Logical and physical access',
            'System operations',
            'Change management',
            'Risk mitigation'
          ]
        },
        'FedRAMP': {
          name: 'FedRAMP',
          fullName: 'Federal Risk and Authorization Management Program',
          description: 'Security assessment for cloud services used by US federal agencies',
          controls: '325+ (based on NIST 800-53)',
          controlFamilies: ['NIST 800-53 families'],
          requiredDocuments: 30,
          certificationBody: '3PAO (Third Party Assessment Organization)',
          auditCycle: 'Annual assessment, continuous monitoring',
          keyRequirements: [
            'System Security Plan (SSP)',
            'Security Assessment Plan (SAP)',
            'Security Assessment Report (SAR)',
            'Plan of Action and Milestones (POA&M)',
            'Continuous monitoring',
            'Incident response',
            'Configuration management',
            'Contingency planning',
            'Identification and authentication',
            'System and communications protection',
            'Audit and accountability'
          ]
        },
        'NIST': {
          name: 'NIST CSF',
          fullName: 'NIST Cybersecurity Framework',
          description: 'Framework for improving critical infrastructure cybersecurity',
          controls: '108 subcategories',
          controlFamilies: ['Identify', 'Protect', 'Detect', 'Respond', 'Recover'],
          requiredDocuments: 10,
          certificationBody: 'No formal certification',
          auditCycle: 'Continuous improvement',
          keyRequirements: [
            'Asset Management',
            'Business Environment',
            'Governance',
            'Risk Assessment',
            'Risk Management Strategy',
            'Access Control',
            'Data Security',
            'Protective Technology',
            'Anomalies and Events Detection',
            'Security Continuous Monitoring',
            'Response Planning',
            'Communications',
            'Analysis',
            'Mitigation',
            'Improvements',
            'Recovery Planning'
          ]
        },
        'GDPR': {
          name: 'GDPR',
          fullName: 'General Data Protection Regulation',
          description: 'EU regulation on data protection and privacy',
          controls: '99 articles',
          controlFamilies: ['Principles', 'Rights', 'Controller obligations', 'Transfer', 'DPA'],
          requiredDocuments: 12,
          certificationBody: 'Data Protection Authorities',
          auditCycle: 'Continuous compliance required',
          keyRequirements: [
            'Lawful basis for processing',
            'Data subject rights',
            'Consent management',
            'Data protection by design',
            'Data protection impact assessments',
            'Data breach notification',
            'Privacy notices',
            'Data processing agreements',
            'Record of processing activities',
            'Data transfer mechanisms',
            'DPO appointment (if applicable)',
            'Security measures'
          ]
        }
      };

      const info = frameworkInfo[params.framework];

      if (!info) {
        return {
          success: false,
          error: `Framework '${params.framework}' not found`
        };
      }

      return {
        success: true,
        data: info
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('get_framework_info failed', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

/**
 * Batch document generation tool
 */
export const batchGenerateDocumentsTool: Tool = {
  name: 'batch_generate_documents',
  description: 'Generate multiple compliance documents for a framework',
  type: ToolType.INTERNAL,
  requiresAuth: true,
  rateLimit: {
    maxCalls: 3,
    windowMs: 60 * 60 * 1000 // 1 hour
  },
  parameters: [
    {
      name: 'companyProfileId',
      type: 'string',
      description: 'Company profile ID',
      required: true
    },
    {
      name: 'framework',
      type: 'string',
      description: 'Compliance framework',
      required: true
    },
    {
      name: 'templateIds',
      type: 'array',
      description: 'Array of template IDs to generate (optional, generates all if not provided)',
      required: false
    },
    {
      name: 'includeQualityAnalysis',
      type: 'boolean',
      description: 'Include quality analysis for each document',
      required: false,
      default: true
    }
  ],
  returns: {
    type: 'array',
    description: 'Array of generated documents with quality scores'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const companyProfile = await storage.getCompanyProfile(params.companyProfileId);

      if (!companyProfile) {
        return {
          success: false,
          error: 'Company profile not found'
        };
      }

      const results = await aiOrchestrator.generateComplianceDocuments(
        companyProfile,
        params.framework,
        {
          includeQualityAnalysis: params.includeQualityAnalysis !== false
        }
      );

      return {
        success: true,
        data: results,
        metadata: {
          count: results.length,
          framework: params.framework,
          averageQuality: results.reduce((sum, r) => sum + (r.qualityScore || 0), 0) / results.length
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('batch_generate_documents failed', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

/**
 * Get document version history tool
 */
export const getVersionHistoryTool: Tool = {
  name: 'get_version_history',
  description: 'Get version history for a document',
  type: ToolType.INTERNAL,
  requiresAuth: true,
  parameters: [
    {
      name: 'documentId',
      type: 'string',
      description: 'Document ID',
      required: true
    },
    {
      name: 'limit',
      type: 'number',
      description: 'Maximum number of versions to return',
      required: false,
      default: 10
    }
  ],
  returns: {
    type: 'array',
    description: 'Array of document versions with metadata'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const versions = await versionService.getVersionHistory(params.documentId);
      const limit = params.limit || 10;
      const limitedVersions = versions.slice(0, limit);

      return {
        success: true,
        data: limitedVersions,
        metadata: {
          total: versions.length,
          returned: limitedVersions.length
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('get_version_history failed', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

/**
 * Compare document versions tool
 */
export const compareVersionsTool: Tool = {
  name: 'compare_versions',
  description: 'Compare two versions of a document',
  type: ToolType.INTERNAL,
  requiresAuth: true,
  parameters: [
    {
      name: 'documentId',
      type: 'string',
      description: 'Document ID',
      required: true
    },
    {
      name: 'version1',
      type: 'string',
      description: 'First version number',
      required: true
    },
    {
      name: 'version2',
      type: 'string',
      description: 'Second version number',
      required: true
    }
  ],
  returns: {
    type: 'object',
    description: 'Comparison result showing differences'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const comparison = await versionService.compareVersions(
        params.documentId,
        parseInt(params.version1),
        parseInt(params.version2)
      );

      return {
        success: true,
        data: comparison
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('compare_versions failed', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

/**
 * Generate audit report tool
 */
export const generateAuditReportTool: Tool = {
  name: 'generate_audit_report',
  description: 'Generate compliance audit report for a date range',
  type: ToolType.INTERNAL,
  requiresAuth: true,
  rateLimit: {
    maxCalls: 10,
    windowMs: 60 * 60 * 1000 // 1 hour
  },
  parameters: [
    {
      name: 'startDate',
      type: 'string',
      description: 'Start date (ISO 8601 format)',
      required: true
    },
    {
      name: 'endDate',
      type: 'string',
      description: 'End date (ISO 8601 format)',
      required: true
    },
    {
      name: 'organizationId',
      type: 'string',
      description: 'Organization ID (optional)',
      required: false
    }
  ],
  returns: {
    type: 'object',
    description: 'Audit report with events, risk analysis, and statistics'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const startDate = new Date(params.startDate);
      const endDate = new Date(params.endDate);

      const report = await auditService.generateAuditReport(
        startDate,
        endDate,
        params.organizationId || context.organizationId
      );

      return {
        success: true,
        data: report,
        metadata: {
          startDate: params.startDate,
          endDate: params.endDate,
          organizationId: params.organizationId || context.organizationId
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('generate_audit_report failed', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

/**
 * Get compliance suggestions tool
 */
export const getComplianceSuggestionsTool: Tool = {
  name: 'get_compliance_suggestions',
  description: 'Get intelligent compliance suggestions based on framework and context',
  type: ToolType.INTERNAL,
  requiresAuth: true,
  parameters: [
    {
      name: 'framework',
      type: 'string',
      description: 'Compliance framework',
      required: false
    },
    {
      name: 'context',
      type: 'string',
      description: 'Context or topic for suggestions',
      required: false
    }
  ],
  returns: {
    type: 'array',
    description: 'Array of suggested questions and topics'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const suggestions = complianceChatbot.getSuggestedQuestions(params.framework);

      return {
        success: true,
        data: suggestions,
        metadata: {
          framework: params.framework,
          count: suggestions.length
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('get_compliance_suggestions failed', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

/**
 * Calculate compliance score tool
 */
export const calculateComplianceScoreTool: Tool = {
  name: 'calculate_compliance_score',
  description: 'Calculate overall compliance score based on documents and controls',
  type: ToolType.INTERNAL,
  requiresAuth: true,
  parameters: [
    {
      name: 'framework',
      type: 'string',
      description: 'Compliance framework',
      required: true
    },
    {
      name: 'companyProfileId',
      type: 'string',
      description: 'Company profile ID',
      required: true
    }
  ],
  returns: {
    type: 'object',
    description: 'Compliance score with breakdown and recommendations'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      // Get company documents
      const documents = await storage.getDocumentsByFramework(params.framework);
      const companyProfile = await storage.getCompanyProfile(params.companyProfileId);

      if (!companyProfile) {
        return {
          success: false,
          error: 'Company profile not found'
        };
      }

      // Get required templates for framework
      const requiredTemplates = DocumentTemplateService.getRequiredTemplates(params.framework);
      const totalRequired = requiredTemplates.length;

      // Calculate document coverage
      const documentTypes = new Set(documents.map((d: any) => d.category));
      const coverage = (documentTypes.size / totalRequired) * 100;

      // Calculate quality score (average of all documents with quality scores)
      const documentsWithQuality = documents.filter((d: any) => d.qualityScore);
      const avgQuality = documentsWithQuality.length > 0
        ? documentsWithQuality.reduce((sum: number, d: any) => sum + d.qualityScore, 0) / documentsWithQuality.length
        : 0;

      // Overall compliance score (weighted average)
      const complianceScore = Math.round((coverage * 0.6) + (avgQuality * 0.4));

      const recommendations: string[] = [];

      // Add recommendations based on score
      if (complianceScore < 60) {
        recommendations.push('Priority: Generate missing required documents');
        recommendations.push('Conduct comprehensive gap analysis');
      }
      if (avgQuality < 75) {
        recommendations.push('Improve document quality through review and updates');
      }
      if (coverage < 80) {
        recommendations.push(`Missing ${Math.max(0, totalRequired - documentTypes.size)} required document types`);
      }

      const result = {
        overallScore: complianceScore,
        breakdown: {
          documentCoverage: Math.round(coverage),
          documentQuality: Math.round(avgQuality),
          totalDocuments: documents.length,
          requiredDocuments: totalRequired,
          missingDocuments: Math.max(0, totalRequired - documentTypes.size)
        },
        riskLevel: complianceScore >= 80 ? 'low' :
                   complianceScore >= 60 ? 'medium' :
                   complianceScore >= 40 ? 'high' : 'critical',
        recommendations
      };

      return {
        success: true,
        data: result
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('calculate_compliance_score failed', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

/**
 * AI health check tool
 */
export const aiHealthCheckTool: Tool = {
  name: 'ai_health_check',
  description: 'Check health status of AI services',
  type: ToolType.INTERNAL,
  requiresAuth: false,
  parameters: [],
  returns: {
    type: 'object',
    description: 'Health status of all AI services'
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const health = await aiOrchestrator.healthCheck();

      return {
        success: true,
        data: health,
        metadata: {
          timestamp: new Date().toISOString(),
          allHealthy: health.overall
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('ai_health_check failed', { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

// Export all advanced tools
export const advancedTools: Tool[] = [
  getDocumentTemplatesTool,
  getFrameworkInfoTool,
  batchGenerateDocumentsTool,
  getVersionHistoryTool,
  compareVersionsTool,
  generateAuditReportTool,
  getComplianceSuggestionsTool,
  calculateComplianceScoreTool,
  aiHealthCheckTool
];

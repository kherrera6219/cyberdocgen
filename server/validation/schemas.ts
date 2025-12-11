import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  contactEmail: z.string().email().optional()
});

export const analyzeQualitySchema = z.object({
  content: z.string().min(1),
  framework: z.string().min(1)
});

export const generateInsightsSchema = z.object({
  companyProfileId: z.string().min(1),
  framework: z.string().min(1)
});

export const generateComplianceDocsSchema = z.object({
  companyInfo: z.object({
    companyName: z.string().min(1),
    industry: z.string().optional(),
    companySize: z.string().optional(),
    headquarters: z.string().optional(),
    cloudProviders: z.array(z.string()).optional(),
    dataClassification: z.string().optional(),
    businessApplications: z.string().optional()
  }),
  frameworks: z.array(z.string()).min(1),
  soc2Options: z.object({
    trustPrinciples: z.array(z.string()).optional()
  }).optional(),
  fedrampOptions: z.object({
    impactLevel: z.enum(['low', 'moderate', 'high']).optional()
  }).optional()
});

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(10000),
  framework: z.string().optional(),
  sessionId: z.string().optional()
});

export const analyzeDocumentSchema = z.object({
  content: z.string().min(1),
  filename: z.string().min(1),
  framework: z.string().optional()
});

export const extractProfileSchema = z.object({
  content: z.string().min(1)
});

export const riskAssessmentSchema = z.object({
  frameworks: z.array(z.string()).min(1),
  includeDocuments: z.boolean().optional()
});

export const threatAnalysisSchema = z.object({
  industry: z.string().min(1),
  companySize: z.string().min(1),
  frameworks: z.array(z.string()).min(1)
});

export const qualityScoreSchema = z.object({
  content: z.string().min(1),
  title: z.string().min(1),
  framework: z.string().min(1),
  documentType: z.string().min(1)
});

export const frameworkAlignmentSchema = z.object({
  content: z.string().min(1),
  framework: z.string().min(1),
  documentType: z.string().min(1)
});

export const fineTuneSchema = z.object({
  industryId: z.string().min(1),
  requirements: z.union([z.string(), z.array(z.string())]),
  customInstructions: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional()
});

export const generateOptimizedSchema = z.object({
  configId: z.string().optional(),
  documentType: z.string().min(1),
  context: z.object({
    industry: z.string().optional()
  }).passthrough()
});

export const assessRisksSchema = z.object({
  industryId: z.string().min(1),
  organizationContext: z.object({}).passthrough()
});

export const analyzeImageSchema = z.object({
  imageData: z.string().min(1),
  prompt: z.string().optional(),
  framework: z.string().optional(),
  analysisType: z.enum(['compliance', 'diagram', 'document', 'general']).optional()
});

export const multimodalChatSchema = z.object({
  message: z.string().min(1).max(10000),
  framework: z.string().optional(),
  sessionId: z.string().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    type: z.string(),
    content: z.string().optional()
  })).optional()
});

export const generateDocumentSchema = z.object({
  framework: z.string().min(1),
  category: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  companyProfileId: z.string().optional()
});

export const generateSingleDocumentSchema = z.object({
  companyProfileId: z.string().min(1),
  framework: z.string().min(1),
  template: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    category: z.string().min(1)
  }).passthrough(),
  model: z.enum(['gpt-5.1', 'claude-sonnet', 'auto']).optional(),
  includeQualityAnalysis: z.boolean().optional()
});

export const createDocumentVersionSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  changes: z.string().optional(),
  changeType: z.enum(['major', 'minor', 'patch']).optional()
});

export const gapAnalysisGenerateSchema = z.object({
  framework: z.string().min(1),
  includeMaturityAssessment: z.boolean().optional(),
  focusAreas: z.array(z.string()).optional()
});

export const updateRecommendationSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'deferred'])
});

export const extractFromDocumentSchema = z.object({
  documentContent: z.string().min(1),
  documentType: z.string().min(1),
  filename: z.string().min(1)
});

export const extractFromWebsiteSchema = z.object({
  url: z.string().url()
});

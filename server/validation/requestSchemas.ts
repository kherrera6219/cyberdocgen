import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  logo: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
});

export const analyzeQualitySchema = z.object({
  content: z.string().min(1, 'Content is required'),
  framework: z.string().min(1, 'Framework is required'),
});

export const generateInsightsSchema = z.object({
  companyProfileId: z.string().min(1, 'Company profile ID is required'),
  framework: z.string().min(1, 'Framework is required'),
});

export const generateComplianceDocsSchema = z.object({
  companyInfo: z.object({
    companyName: z.string().min(1, 'Company name is required'),
    industry: z.string().optional(),
    companySize: z.string().optional(),
    headquarters: z.string().optional(),
    cloudProviders: z.array(z.string()).optional(),
    dataClassification: z.string().optional(),
    businessApplications: z.string().optional(),
  }),
  frameworks: z.array(z.string()).min(1, 'At least one framework is required'),
  soc2Options: z.object({
    trustPrinciples: z.array(z.enum(['security', 'availability', 'processing', 'confidentiality', 'privacy'])).optional(),
  }).optional(),
  fedrampOptions: z.object({
    impactLevel: z.enum(['low', 'moderate', 'high']).optional(),
  }).optional(),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(10000),
  context: z.object({
    companyProfileId: z.string().optional(),
    framework: z.string().optional(),
    documentId: z.string().optional(),
  }).optional(),
  conversationId: z.string().optional(),
});

export const analyzeDocumentSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  framework: z.string().optional(),
  analysisType: z.enum(['compliance', 'quality', 'risk', 'full']).optional().default('full'),
});

export const riskAnalysisSchema = z.object({
  companyProfileId: z.string().min(1, 'Company profile ID is required'),
  framework: z.string().optional(),
  includeRecommendations: z.boolean().optional().default(true),
});

export const qualityScoringSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  documentType: z.string().optional(),
  framework: z.string().optional(),
});

export const generateDocumentSchema = z.object({
  framework: z.string().min(1, 'Framework is required'),
  category: z.string().min(1, 'Category is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  companyProfileId: z.string().optional(),
});

export const gapAnalysisSchema = z.object({
  companyProfileId: z.string().min(1, 'Company profile ID is required'),
  framework: z.string().min(1, 'Framework is required'),
  includeRemediation: z.boolean().optional().default(true),
});

export const exportDocumentSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  format: z.enum(['pdf', 'docx', 'html', 'txt']).default('pdf'),
  includeMetadata: z.boolean().optional().default(true),
});

export const auditTrailQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).optional().default(100),
  offset: z.coerce.number().min(0).optional().default(0),
});

export const documentsQuerySchema = z.object({
  companyProfileId: z.string().optional(),
  framework: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
});

export const generationJobSchema = z.object({
  companyProfileId: z.string().min(1, 'Company profile ID is required'),
  framework: z.string().min(1, 'Framework is required'),
  options: z.object({
    model: z.string().optional(),
    includeQualityAnalysis: z.boolean().optional(),
  }).optional(),
});

export const updateGenerationJobSchema = z.object({
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).optional(),
  progress: z.number().min(0).max(100).optional(),
  errorMessage: z.string().optional(),
});

export const mfaSetupSchema = z.object({
  method: z.enum(['totp', 'sms']),
  phoneNumber: z.string().optional(),
});

export const mfaVerifySchema = z.object({
  code: z.string().min(6).max(8),
  method: z.enum(['totp', 'sms']).optional(),
});

export const cloudIntegrationConnectSchema = z.object({
  provider: z.enum(['google_drive', 'onedrive', 'dropbox']),
  credentials: z.record(z.string()).optional(),
});

export const cloudIntegrationSyncSchema = z.object({
  provider: z.enum(['google_drive', 'onedrive', 'dropbox']),
  folderId: z.string().optional(),
  direction: z.enum(['upload', 'download', 'sync']).default('sync'),
});

export const adminUserUpdateSchema = z.object({
  role: z.enum(['user', 'admin', 'org_admin']).optional(),
  isActive: z.boolean().optional(),
  accountStatus: z.enum(['active', 'suspended', 'pending_verification']).optional(),
});

export const storageUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  contentType: z.string().optional(),
  folder: z.string().optional(),
});

export const companyProfileCreateSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  companyName: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1, 'Industry is required'),
  companySize: z.string().min(1, 'Company size is required'),
  headquarters: z.string().min(1, 'Headquarters is required'),
  cloudInfrastructure: z.array(z.string()).optional().default([]),
  dataClassification: z.string().min(1, 'Data classification is required'),
  businessApplications: z.string().optional().default(''),
  complianceFrameworks: z.array(z.string()).optional().default([]),
  contactInfo: z.object({
    primaryContact: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  websiteUrl: z.string().url().optional().nullable(),
});

export const companyProfileUpdateSchema = companyProfileCreateSchema.partial().omit({ organizationId: true });

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type AnalyzeQualityInput = z.infer<typeof analyzeQualitySchema>;
export type GenerateInsightsInput = z.infer<typeof generateInsightsSchema>;
export type GenerateComplianceDocsInput = z.infer<typeof generateComplianceDocsSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type AnalyzeDocumentInput = z.infer<typeof analyzeDocumentSchema>;
export type RiskAnalysisInput = z.infer<typeof riskAnalysisSchema>;
export type QualityScoringInput = z.infer<typeof qualityScoringSchema>;
export type GenerateDocumentInput = z.infer<typeof generateDocumentSchema>;
export type GapAnalysisInput = z.infer<typeof gapAnalysisSchema>;
export type ExportDocumentInput = z.infer<typeof exportDocumentSchema>;
export type AuditTrailQueryInput = z.infer<typeof auditTrailQuerySchema>;
export type DocumentsQueryInput = z.infer<typeof documentsQuerySchema>;
export type GenerationJobInput = z.infer<typeof generationJobSchema>;
export type UpdateGenerationJobInput = z.infer<typeof updateGenerationJobSchema>;
export type MfaSetupInput = z.infer<typeof mfaSetupSchema>;
export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>;
export type CloudIntegrationConnectInput = z.infer<typeof cloudIntegrationConnectSchema>;
export type CloudIntegrationSyncInput = z.infer<typeof cloudIntegrationSyncSchema>;
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;
export type StorageUploadInput = z.infer<typeof storageUploadSchema>;
export type CompanyProfileCreateInput = z.infer<typeof companyProfileCreateSchema>;
export type CompanyProfileUpdateInput = z.infer<typeof companyProfileUpdateSchema>;

export const riskAssessmentRequestSchema = z.object({
  companyProfile: z.object({
    name: z.string().min(1, 'Company name is required'),
    industry: z.string().optional(),
    assets: z.array(z.string()).optional(),
    threats: z.array(z.string()).optional(),
  }),
});

export const complianceAnalysisRequestSchema = z.object({
  framework: z.string().min(1, 'Framework is required'),
  currentControls: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
});

export const documentQualityAnalysisSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  framework: z.string().optional(),
  documentType: z.string().optional(),
});

export const complianceChatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required').max(10000),
  context: z.string().optional(),
  framework: z.string().optional(),
});

export type RiskAssessmentRequestInput = z.infer<typeof riskAssessmentRequestSchema>;
export type ComplianceAnalysisRequestInput = z.infer<typeof complianceAnalysisRequestSchema>;
export type DocumentQualityAnalysisInput = z.infer<typeof documentQualityAnalysisSchema>;
export type ComplianceChatRequestInput = z.infer<typeof complianceChatRequestSchema>;

export const exportDocumentRequestSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  format: z.enum(['pdf', 'docx', 'txt', 'html']),
  filename: z.string().optional(),
});

export const saveDocumentRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  framework: z.string().min(1, 'Framework is required'),
  category: z.string().optional(),
  companyProfileId: z.string().optional(),
  createdBy: z.string().optional(),
});

export const generateDocumentRequestSchema = z.object({
  framework: z.string().min(1, 'Framework is required'),
  companyProfile: z.object({
    name: z.string().min(1),
    industry: z.string().optional(),
    size: z.string().optional(),
  }),
  documentType: z.string().min(1, 'Document type is required'),
  templateId: z.string().optional(),
  variables: z.record(z.any()).optional(),
});

export const generationJobCreateSchema = z.object({
  companyProfileId: z.string().min(1, 'Company profile ID is required'),
  framework: z.string().min(1, 'Framework is required'),
  model: z.enum(['auto', 'openai', 'anthropic', 'gemini']).optional().default('auto'),
  includeQualityAnalysis: z.boolean().optional().default(false),
  enableCrossValidation: z.boolean().optional().default(false),
});

export type ExportDocumentRequestInput = z.infer<typeof exportDocumentRequestSchema>;
export type SaveDocumentRequestInput = z.infer<typeof saveDocumentRequestSchema>;
export type GenerateDocumentRequestInput = z.infer<typeof generateDocumentRequestSchema>;
export type GenerationJobCreateInput = z.infer<typeof generationJobCreateSchema>;

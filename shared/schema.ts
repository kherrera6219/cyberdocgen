import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, boolean, index, unique, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User profiles table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("user"), // user, admin, org_admin
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Organizations table for multi-tenant support
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").unique().notNull(),
  description: text("description"),
  logo: varchar("logo"),
  website: varchar("website"),
  contactEmail: varchar("contact_email"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User-Organization memberships
export const userOrganizations = pgTable("user_organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  role: varchar("role").notNull().default("member"), // member, admin, owner
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => [
  unique().on(table.userId, table.organizationId)
]);

export const companyProfiles = pgTable("company_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  companyName: text("company_name").notNull(),
  industry: text("industry").notNull(),
  companySize: text("company_size").notNull(),
  headquarters: text("headquarters").notNull(),
  cloudInfrastructure: jsonb("cloud_infrastructure").$type<string[]>().notNull().default([]),
  dataClassification: text("data_classification").notNull(),
  businessApplications: text("business_applications").notNull(),
  complianceFrameworks: jsonb("compliance_frameworks").$type<string[]>().notNull().default([]),
  contactInfo: jsonb("contact_info").$type<{
    primaryContact: string;
    email: string;
    phone?: string;
    address?: string;
  }>(),
  
  // Key Personnel for Compliance Documentation
  keyPersonnel: jsonb("key_personnel").$type<{
    ceo?: { name: string; email?: string; };
    ciso?: { name: string; email?: string; };
    securityOfficer?: { name: string; email?: string; };
    complianceOfficer?: { name: string; email?: string; };
    itManager?: { name: string; email?: string; };
    legalCounsel?: { name: string; email?: string; };
    boardMembers?: { name: string; role: string; email?: string; }[];
    keyStakeholders?: { name: string; role: string; department: string; email?: string; }[];
  }>(),
  
  // Framework-Specific Configurations
  frameworkConfigs: jsonb("framework_configs").$type<{
    fedramp?: {
      level: 'low' | 'moderate' | 'high';
      impactLevel: {
        confidentiality: 'low' | 'moderate' | 'high';
        integrity: 'low' | 'moderate' | 'high';
        availability: 'low' | 'moderate' | 'high';
      };
      selectedControls: string[];
    };
    nist80053?: {
      version: 'revision-5';
      selectedControlFamilies: string[]; // AC, AT, AU, CA, CM, CP, IA, IR, MA, MP, PE, PL, PM, PS, PT, RA, SA, SC, SI, SR
    };
    iso27001?: {
      version: '2022';
      scope: string;
      selectedControls: string[];
    };
    soc2?: {
      trustServices: ('security' | 'availability' | 'processing' | 'confidentiality' | 'privacy')[];
      reportType: 'type1' | 'type2';
    };
  }>(),
  
  // Document Upload References for RAG Processing
  uploadedDocs: jsonb("uploaded_docs").$type<{
    incorporationDocs?: { filename: string; url: string; extractedData?: any; }[];
    registrationDocs?: { filename: string; url: string; extractedData?: any; }[];
    profileDocs?: { filename: string; url: string; extractedData?: any; }[];
  }>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyProfileId: varchar("company_profile_id").references(() => companyProfiles.id).notNull(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  framework: text("framework").notNull(), // ISO27001, SOC2, FedRAMP-Low, FedRAMP-Moderate, FedRAMP-High, NIST-800-53
  subFramework: text("sub_framework"), // For FedRAMP levels and NIST control families
  category: text("category").notNull(), // policy, procedure, assessment, template, etc.
  documentType: text("document_type").notNull().default("text"), // text, excel, pdf, word
  content: text("content").notNull(),
  templateData: jsonb("template_data"), // Structured data for templates
  status: text("status").notNull().default("draft"), // draft, in_progress, complete, approved, published
  version: integer("version").notNull().default(1),
  tags: jsonb("tags").$type<string[]>().default([]),
  
  // File Storage Information
  fileName: text("file_name"),
  fileType: text("file_type"), // .docx, .xlsx, .pdf
  fileSize: integer("file_size"),
  downloadUrl: text("download_url"), // Cloud storage URL
  
  // Approval Workflow
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // AI Processing
  aiGenerated: boolean("ai_generated").notNull().default(false),
  aiModel: text("ai_model"), // gpt-4, claude-3, etc.
  generationPrompt: text("generation_prompt"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Document Templates table for reusable templates
export const documentTemplates = pgTable("document_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  framework: text("framework").notNull(),
  category: text("category").notNull(),
  documentType: text("document_type").notNull(), // excel, pdf, word
  templateContent: text("template_content").notNull(),
  templateVariables: jsonb("template_variables").$type<{
    [key: string]: {
      type: 'text' | 'number' | 'date' | 'select';
      label: string;
      required: boolean;
      options?: string[];
    };
  }>(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Encryption fields for SOC 2 compliance
  companyNameEncrypted: text("company_name_encrypted"),
  industryEncrypted: text("industry_encrypted"), 
  headquartersEncrypted: text("headquarters_encrypted"),
  encryptionVersion: integer("encryption_version"),
  encryptedAt: timestamp("encrypted_at"),
});

// Document Workspace for AI editing and collaboration
export const documentWorkspace = pgTable("document_workspace", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").references(() => documents.id).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  workspaceData: jsonb("workspace_data").$type<{
    editorState?: any;
    comments?: { id: string; userId: string; content: string; timestamp: string; resolved: boolean; }[];
    suggestions?: { id: string; type: string; content: string; status: 'pending' | 'accepted' | 'rejected'; }[];
    aiAssistance?: { enabled: boolean; model: string; lastUsed: string; }[];
  }>(),
  lastEditedBy: varchar("last_edited_by").references(() => users.id),
  lastEditedAt: timestamp("last_edited_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const generationJobs = pgTable("generation_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyProfileId: varchar("company_profile_id").references(() => companyProfiles.id).notNull(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  framework: text("framework").notNull(),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  progress: integer("progress").notNull().default(0),
  documentsGenerated: integer("documents_generated").notNull().default(0),
  totalDocuments: integer("total_documents").notNull().default(0),
  errorMessage: text("error_message"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  userOrganizations: many(userOrganizations),
  companyProfiles: many(companyProfiles),
  documents: many(documents),
  generationJobs: many(generationJobs),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  userOrganizations: many(userOrganizations),
  companyProfiles: many(companyProfiles),
}));

export const userOrganizationsRelations = relations(userOrganizations, ({ one }) => ({
  user: one(users, {
    fields: [userOrganizations.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [userOrganizations.organizationId],
    references: [organizations.id],
  }),
}));

export const companyProfilesRelations = relations(companyProfiles, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [companyProfiles.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [companyProfiles.createdBy],
    references: [users.id],
  }),
  documents: many(documents),
  generationJobs: many(generationJobs),
}));

export const documentTemplatesRelations = relations(documentTemplates, ({ one }) => ({
  createdByUser: one(users, {
    fields: [documentTemplates.createdBy],
    references: [users.id],
  }),
}));

export const documentWorkspaceRelations = relations(documentWorkspace, ({ one }) => ({
  document: one(documents, {
    fields: [documentWorkspace.documentId],
    references: [documents.id],
  }),
  organization: one(organizations, {
    fields: [documentWorkspace.organizationId],
    references: [organizations.id],
  }),
  lastEditedByUser: one(users, {
    fields: [documentWorkspace.lastEditedBy],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  companyProfile: one(companyProfiles, {
    fields: [documents.companyProfileId],
    references: [companyProfiles.id],
  }),
  createdByUser: one(users, {
    fields: [documents.createdBy],
    references: [users.id],
  }),
  reviewedByUser: one(users, {
    fields: [documents.reviewedBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [documents.approvedBy],
    references: [users.id],
  }),
}));

export const generationJobsRelations = relations(generationJobs, ({ one }) => ({
  companyProfile: one(companyProfiles, {
    fields: [generationJobs.companyProfileId],
    references: [companyProfiles.id],
  }),
  createdByUser: one(users, {
    fields: [generationJobs.createdBy],
    references: [users.id],
  }),
}));

// Schema validations
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserOrganizationSchema = createInsertSchema(userOrganizations).omit({
  id: true,
  joinedAt: true,
});

export const insertCompanyProfileSchema = createInsertSchema(companyProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGenerationJobSchema = createInsertSchema(generationJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentTemplateSchema = createInsertSchema(documentTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentWorkspaceSchema = createInsertSchema(documentWorkspace).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;

// AI Fine-tuning configuration tables
export const industryConfigurations = pgTable("industry_configurations", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  primaryFrameworks: text("primary_frameworks").array(),
  specializations: text("specializations").array(),
  riskFactors: text("risk_factors").array(),
  complianceRequirements: text("compliance_requirements").array(),
  customPrompts: jsonb("custom_prompts"),
  modelPreferences: jsonb("model_preferences"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const organizationFineTuning = pgTable("organization_fine_tuning", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  industryId: varchar("industry_id").notNull(),
  configId: varchar("config_id").notNull(),
  status: varchar("status").notNull().default("pending"),
  customPrompts: jsonb("custom_prompts"),
  modelSettings: jsonb("model_settings"),
  accuracy: decimal("accuracy", { precision: 5, scale: 4 }),
  requirements: text("requirements").array(),
  customInstructions: text("custom_instructions"),
  priority: varchar("priority").default("medium"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fineTuningMetrics = pgTable("fine_tuning_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  configId: varchar("config_id").notNull(),
  metricType: varchar("metric_type").notNull(), // accuracy, performance, user_satisfaction
  value: decimal("value", { precision: 10, scale: 6 }),
  metadata: jsonb("metadata"),
  measuredAt: timestamp("measured_at").defaultNow(),
});

export type IndustryConfiguration = typeof industryConfigurations.$inferSelect;
export type InsertIndustryConfiguration = typeof industryConfigurations.$inferInsert;
export type OrganizationFineTuning = typeof organizationFineTuning.$inferSelect;
export type InsertOrganizationFineTuning = typeof organizationFineTuning.$inferInsert;

// Compliance Gap Analysis Tables
export const gapAnalysisReports = pgTable("gap_analysis_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  framework: varchar("framework", { enum: ["iso27001", "soc2", "fedramp", "nist"] }).notNull(),
  analysisDate: timestamp("analysis_date").defaultNow(),
  overallScore: integer("overall_score").notNull(), // 0-100
  status: varchar("status", { enum: ["pending", "in_progress", "completed", "failed"] }).default("pending"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gapAnalysisFindings = pgTable("gap_analysis_findings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").notNull().references(() => gapAnalysisReports.id, { onDelete: "cascade" }),
  controlId: varchar("control_id").notNull(), // e.g., "A.5.1.1" for ISO 27001
  controlTitle: varchar("control_title").notNull(),
  currentStatus: varchar("current_status", { enum: ["not_implemented", "partially_implemented", "implemented", "fully_compliant"] }).notNull(),
  riskLevel: varchar("risk_level", { enum: ["low", "medium", "high", "critical"] }).notNull(),
  gapDescription: text("gap_description").notNull(),
  businessImpact: text("business_impact").notNull(),
  evidenceRequired: text("evidence_required"),
  complianceScore: integer("compliance_score").notNull(), // 0-100
  priority: integer("priority").notNull(), // 1-5
  estimatedEffort: varchar("estimated_effort", { enum: ["low", "medium", "high"] }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const remediationRecommendations = pgTable("remediation_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  findingId: varchar("finding_id").notNull().references(() => gapAnalysisFindings.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  implementation: text("implementation").notNull(),
  resources: jsonb("resources"), // Links, tools, templates
  timeframe: varchar("timeframe", { enum: ["immediate", "short_term", "medium_term", "long_term"] }).notNull(),
  cost: varchar("cost", { enum: ["low", "medium", "high"] }),
  priority: integer("priority").notNull(),
  status: varchar("status", { enum: ["pending", "in_progress", "completed", "deferred"] }).default("pending"),
  assignedTo: varchar("assigned_to"),
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const complianceMaturityAssessments = pgTable("compliance_maturity_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  framework: varchar("framework", { enum: ["iso27001", "soc2", "fedramp", "nist"] }).notNull(),
  maturityLevel: integer("maturity_level").notNull(), // 1-5 (Initial, Developing, Defined, Managed, Optimizing)
  assessmentData: jsonb("assessment_data").notNull(),
  recommendations: jsonb("recommendations"),
  nextReviewDate: timestamp("next_review_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for gap analysis
export const insertGapAnalysisReportSchema = createInsertSchema(gapAnalysisReports).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertGapAnalysisFindingSchema = createInsertSchema(gapAnalysisFindings).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertRemediationRecommendationSchema = createInsertSchema(remediationRecommendations).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertComplianceMaturityAssessmentSchema = createInsertSchema(complianceMaturityAssessments).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Gap analysis type exports
export type InsertGapAnalysisReport = z.infer<typeof insertGapAnalysisReportSchema>;
export type GapAnalysisReport = typeof gapAnalysisReports.$inferSelect;
export type InsertGapAnalysisFinding = z.infer<typeof insertGapAnalysisFindingSchema>;
export type GapAnalysisFinding = typeof gapAnalysisFindings.$inferSelect;
export type InsertRemediationRecommendation = z.infer<typeof insertRemediationRecommendationSchema>;
export type RemediationRecommendation = typeof remediationRecommendations.$inferSelect;
export type InsertComplianceMaturityAssessment = z.infer<typeof insertComplianceMaturityAssessmentSchema>;
export type ComplianceMaturityAssessment = typeof complianceMaturityAssessments.$inferSelect;
export type FineTuningMetric = typeof fineTuningMetrics.$inferSelect;
export type InsertFineTuningMetric = typeof fineTuningMetrics.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type UserOrganization = typeof userOrganizations.$inferSelect;
export type InsertUserOrganization = z.infer<typeof insertUserOrganizationSchema>;

export type CompanyProfile = typeof companyProfiles.$inferSelect;
export type InsertCompanyProfile = z.infer<typeof insertCompanyProfileSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type InsertDocumentTemplate = z.infer<typeof insertDocumentTemplateSchema>;

export type DocumentWorkspace = typeof documentWorkspace.$inferSelect;
export type InsertDocumentWorkspace = z.infer<typeof insertDocumentWorkspaceSchema>;

export type GenerationJob = typeof generationJobs.$inferSelect;
export type InsertGenerationJob = z.infer<typeof insertGenerationJobSchema>;

// Extended types for audit actions including AI operations
export const AuditAction = z.enum([
  "view", "download", "delete", "create", "update", "approve", "reject", "publish", "archive",
  // AI-specific actions
  "generate_insights", "analyze", "extract", "chat", "assess", "score"
]);

export const AuditEntityType = z.enum([
  "user", "template", "document", "company_profile", "organization",
  // AI-specific entities
  "ai_conversation", "risk_assessment", "threat_landscape", "document_quality"
]);

export type AuditActionType = z.infer<typeof AuditAction>;
export type AuditEntityTypeEnum = z.infer<typeof AuditEntityType>;

// Document Versions table for version control
export const documentVersions = pgTable("document_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  changes: text("changes"), // Description of what changed
  changeType: varchar("change_type", { enum: ["major", "minor", "patch"] }).default("minor"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  status: varchar("status", { enum: ["draft", "published", "archived"] }).default("draft"),
  fileSize: integer("file_size"),
  checksum: varchar("checksum", { length: 64 }), // For integrity verification
});

export const insertDocumentVersionSchema = createInsertSchema(documentVersions).omit({
  id: true,
  createdAt: true,
});

export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;

// Audit Logs Table for SOC 2 Compliance
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  organizationId: varchar("organization_id").references(() => organizations.id),
  action: varchar("action").notNull(),
  resourceType: varchar("resource_type").notNull(),
  resourceId: varchar("resource_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address").notNull(),
  userAgent: varchar("user_agent"),
  riskLevel: varchar("risk_level").notNull().default("low"),
  additionalContext: jsonb("additional_context"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_audit_logs_user_id").on(table.userId),
  index("idx_audit_logs_action").on(table.action),
  index("idx_audit_logs_timestamp").on(table.timestamp),
  index("idx_audit_logs_risk_level").on(table.riskLevel)
]);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export type DocumentVersion = typeof documentVersions.$inferSelect;

// Audit Trail table for comprehensive logging with extended AI actions
export const auditTrail = pgTable("audit_trail", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(), // Extended to support AI entities
  entityId: varchar("entity_id").notNull(),
  action: text("action").notNull(), // Extended to support AI actions
  userId: varchar("user_id").notNull(),
  userEmail: varchar("user_email"),
  userName: varchar("user_name"),
  organizationId: varchar("organization_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  metadata: jsonb("metadata"), // Additional context like IP, user agent, etc.
  timestamp: timestamp("timestamp").defaultNow(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  sessionId: varchar("session_id"),
});

export const insertAuditTrailSchema = createInsertSchema(auditTrail).omit({
  id: true,
  timestamp: true,
});

export type InsertAuditTrail = z.infer<typeof insertAuditTrailSchema>;
export type AuditTrail = typeof auditTrail.$inferSelect;

// Document Approvals table for approval workflow
export const documentApprovals = pgTable("document_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  versionId: varchar("version_id").references(() => documentVersions.id),
  requestedBy: varchar("requested_by").notNull(),
  approverRole: varchar("approver_role", { enum: ["ciso", "compliance_officer", "legal_counsel", "ceo", "manager"] }).notNull(),
  assignedTo: varchar("assigned_to"),
  status: varchar("status", { enum: ["pending", "approved", "rejected", "withdrawn"] }).default("pending"),
  comments: text("comments"),
  priority: varchar("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  dueDate: timestamp("due_date"),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDocumentApprovalSchema = createInsertSchema(documentApprovals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDocumentApproval = z.infer<typeof insertDocumentApprovalSchema>;
export type DocumentApproval = typeof documentApprovals.$inferSelect;

// Add relations for audit trail and document versions
export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
  document: one(documents, {
    fields: [documentVersions.documentId],
    references: [documents.id],
  }),
}));

export const auditTrailRelations = relations(auditTrail, ({ one }) => ({
  user: one(users, {
    fields: [auditTrail.userId],
    references: [users.id],
  }),
}));

export const documentApprovalsRelations = relations(documentApprovals, ({ one }) => ({
  document: one(documents, {
    fields: [documentApprovals.documentId],
    references: [documents.id],
  }),
  version: one(documentVersions, {
    fields: [documentApprovals.versionId],
    references: [documentVersions.id],
  }),
}));

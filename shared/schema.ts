import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, boolean, index, unique, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
// Cast to any required due to incompatibility between drizzle-zod 0.8.3 and zod 3.25.x (required by openai/anthropic SDKs)
// TODO: Remove cast when drizzle-zod supports zod 3.25+
export const cis = createInsertSchema as any;
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
  // Enterprise authentication fields
  passwordHash: varchar("password_hash"), // For local account creation
  emailVerified: boolean("email_verified").default(false),
  phoneNumber: varchar("phone_number"),
  phoneVerified: boolean("phone_verified").default(false),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  // Account status and security
  accountStatus: varchar("account_status", { enum: ["active", "suspended", "pending_verification"] }).default("pending_verification"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  accountLockedUntil: timestamp("account_locked_until"),
  // Passkey support
  passkeyEnabled: boolean("passkey_enabled").default(false),
  // Profile preferences
  profilePreferences: jsonb("profile_preferences").$type<{
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    timezone?: string;
    dateFormat?: string;
    dashboardLayout?: 'compact' | 'standard' | 'expanded';
    defaultFramework?: string;
    aiAssistantEnabled?: boolean;
  }>().default({}),
  // Notification settings
  notificationSettings: jsonb("notification_settings").$type<{
    emailNotifications?: boolean;
    documentUpdates?: boolean;
    complianceAlerts?: boolean;
    teamActivity?: boolean;
    weeklyDigest?: boolean;
    securityAlerts?: boolean;
    marketingEmails?: boolean;
  }>().default({}),
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

// User Invitations for enterprise user management
export const userInvitations = pgTable("user_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id),
  role: varchar("role").notNull().default("user"), // user, admin, org_admin
  organizationRole: varchar("organization_role").default("member"), // member, admin, owner
  invitedBy: varchar("invited_by").references(() => users.id).notNull(),
  token: varchar("token").unique().notNull(),
  status: varchar("status", { enum: ["pending", "accepted", "expired", "revoked"] }).default("pending"),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Sessions for session management
export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sessionToken: varchar("session_token").unique().notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  deviceInfo: jsonb("device_info").$type<{
    browser?: string;
    os?: string;
    device?: string;
    isMobile?: boolean;
  }>(),
  location: jsonb("location").$type<{
    country?: string;
    city?: string;
    timezone?: string;
  }>(),
  isActive: boolean("is_active").default(true),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

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
  
  // Website URL for AI-powered data extraction
  websiteUrl: text("website_url"),
  
  // Organization Structure
  organizationStructure: jsonb("organization_structure").$type<{
    legalEntityType?: string; // LLC, Corporation, Partnership, etc.
    parentCompany?: { name: string; relationship?: string; };
    subsidiaries?: { name: string; location?: string; }[];
    departments?: { name: string; head?: string; employeeCount?: number; responsibilities?: string; }[];
    totalEmployees?: number;
    employeesByDepartment?: { department: string; count: number; }[];
  }>(),
  
  // Enhanced Key Personnel for Compliance Documentation
  keyPersonnel: jsonb("key_personnel").$type<{
    ceo?: { name: string; email?: string; phone?: string; };
    cfo?: { name: string; email?: string; phone?: string; };
    coo?: { name: string; email?: string; phone?: string; };
    cto?: { name: string; email?: string; phone?: string; };
    cio?: { name: string; email?: string; phone?: string; };
    ciso?: { name: string; email?: string; phone?: string; };
    dpo?: { name: string; email?: string; phone?: string; }; // Data Protection Officer
    cpo?: { name: string; email?: string; phone?: string; }; // Chief Privacy Officer
    securityOfficer?: { name: string; email?: string; phone?: string; };
    complianceOfficer?: { name: string; email?: string; phone?: string; };
    itManager?: { name: string; email?: string; phone?: string; };
    hrDirector?: { name: string; email?: string; phone?: string; };
    legalCounsel?: { name: string; email?: string; phone?: string; };
    boardMembers?: { name: string; role: string; email?: string; }[];
    securityTeam?: { name: string; role: string; email?: string; }[];
    complianceTeam?: { name: string; role: string; email?: string; }[];
    itTeamLeads?: { name: string; area: string; email?: string; }[];
    keyStakeholders?: { name: string; role: string; department: string; email?: string; }[];
  }>(),
  
  // Products & Services
  productsAndServices: jsonb("products_and_services").$type<{
    primaryProducts?: { name: string; description?: string; }[];
    primaryServices?: { name: string; description?: string; }[];
    customerSegments?: ('B2B' | 'B2C' | 'Government' | 'Enterprise' | 'SMB')[];
    slaCommitments?: { service: string; availability: string; responseTime?: string; }[];
    serviceAvailabilityRequirements?: string;
  }>(),
  
  // Geographic Operations
  geographicOperations: jsonb("geographic_operations").$type<{
    countriesOfOperation?: string[];
    officeLocations?: { address: string; type: 'headquarters' | 'regional' | 'satellite' | 'remote'; employeeCount?: number; }[];
    dataCenterLocations?: { location: string; type: 'primary' | 'disaster_recovery' | 'backup'; provider?: string; }[];
    customerRegionsServed?: string[];
    regulatoryJurisdictions?: string[];
  }>(),
  
  // Security Infrastructure
  securityInfrastructure: jsonb("security_infrastructure").$type<{
    networkArchitectureSummary?: string;
    firewallVendor?: string;
    idsIpsVendor?: string;
    siemSolution?: string;
    endpointProtection?: string;
    encryptionStandards?: { type: string; algorithm: string; keyLength?: number; }[];
    backupSolutions?: { type: string; frequency: string; retention?: string; }[];
    disasterRecoverySites?: { location: string; type: string; rtoHours?: number; }[];
    vpnSolution?: string;
    mfaProvider?: string;
    identityProvider?: string;
  }>(),
  
  // Business Continuity
  businessContinuity: jsonb("business_continuity").$type<{
    rtoHours?: number; // Recovery Time Objective
    rpoHours?: number; // Recovery Point Objective
    bcdrPlanExists?: boolean;
    lastDrTestDate?: string;
    criticalSystems?: { system: string; rtoHours: number; rpoHours: number; }[];
    backupFrequency?: string;
    incidentResponsePlanExists?: boolean;
    lastIncidentResponseTest?: string;
  }>(),
  
  // Vendor & Supply Chain
  vendorManagement: jsonb("vendor_management").$type<{
    criticalVendors?: { name: string; service: string; securityAssessmentStatus?: 'pending' | 'approved' | 'requires_review'; lastAssessmentDate?: string; }[];
    thirdPartyIntegrations?: { name: string; type: string; dataShared?: string[]; }[];
    vendorRiskAssessmentFrequency?: string;
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
    orgCharts?: { filename: string; url: string; extractedData?: any; }[];
    policyDocs?: { filename: string; url: string; extractedData?: any; }[];
  }>(),
  
  // AI Research Data
  aiResearchData: jsonb("ai_research_data").$type<{
    lastResearchDate?: string;
    sources?: { url: string; type: string; extractedAt: string; }[];
    confidence?: number;
    extractedInfo?: Record<string, any>;
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

// Multi-Factor Authentication settings
// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email verification tokens table
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token").notNull().unique(),
  email: varchar("email").notNull(), // New email for email change verification
  expiresAt: timestamp("expires_at").notNull(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Passkey credentials table
export const passkeyCredentials = pgTable("passkey_credentials", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  credentialId: varchar("credential_id").notNull().unique(),
  publicKey: text("public_key").notNull(),
  counter: integer("counter").notNull().default(0),
  deviceType: varchar("device_type"), // "platform" or "cross-platform"
  deviceName: varchar("device_name"), // User-friendly device name
  transports: jsonb("transports"), // Array of transport methods
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
});

// Enhanced MFA settings table
export const mfaSettings = pgTable("mfa_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  mfaType: text("mfa_type").notNull(), // 'totp', 'sms', 'backup_codes'
  secretEncrypted: text("secret_encrypted"),
  phoneNumberEncrypted: text("phone_number_encrypted"),
  backupCodesEncrypted: text("backup_codes_encrypted"),
  isEnabled: boolean("is_enabled").notNull().default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  // Google Authenticator specific fields
  authenticatorName: varchar("authenticator_name").default("Google Authenticator"),
  qrCodeUrl: text("qr_code_url"), // For setup process
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  failedAttempts: integer("failed_attempts").default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
}, (table) => ({
  userMfaTypeUnique: unique().on(table.userId, table.mfaType),
  userIdIdx: index("idx_mfa_settings_user_id").on(table.userId),
  enabledIdx: index("idx_mfa_settings_enabled").on(table.userId, table.isEnabled),
}));

// System configuration for admin-managed settings
export const systemConfigurations = pgTable("system_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  configKey: varchar("config_key").unique().notNull(), // 'oauth_google', 'oauth_microsoft', 'pdf_defaults'
  configType: varchar("config_type").notNull(), // 'oauth', 'security', 'system'
  configValueEncrypted: text("config_value_encrypted").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  configKeyIdx: index("idx_system_config_key").on(table.configKey),
  configTypeIdx: index("idx_system_config_type").on(table.configType),
}));

// Cloud storage integrations table
export const cloudIntegrations = pgTable("cloud_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  provider: varchar("provider").notNull(), // 'google_drive', 'onedrive', 'dropbox'
  providerUserId: varchar("provider_user_id").notNull(),
  displayName: varchar("display_name").notNull(),
  email: varchar("email").notNull(),
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  refreshTokenEncrypted: text("refresh_token_encrypted"),
  tokenExpiresAt: timestamp("token_expires_at"),
  scopes: jsonb("scopes").$type<string[]>().default([]),
  isActive: boolean("is_active").notNull().default(true),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: varchar("sync_status").default("pending"), // 'pending', 'syncing', 'completed', 'error'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userProviderUnique: unique().on(table.userId, table.provider),
  providerIdx: index("idx_cloud_integrations_provider").on(table.provider),
  userIdIdx: index("idx_cloud_integrations_user_id").on(table.userId),
  orgIdIdx: index("idx_cloud_integrations_org_id").on(table.organizationId),
}));

// Evidence Snapshots for time-point audit evidence
export const evidenceSnapshots = pgTable("evidence_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  name: varchar("name").notNull(),
  status: varchar("status", { enum: ['open', 'locked', 'archived'] }).default('open').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lockedAt: timestamp("locked_at"),
});

// Connector configurations (what to sync/import)
export const connectorConfigs = pgTable("connector_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationId: varchar("integration_id").references(() => cloudIntegrations.id, { onDelete: 'cascade' }).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name").notNull(), // User-friendly name e.g. "Engineering Jira Tickets"
  connectorType: varchar("connector_type").notNull(), // 'sharepoint', 'jira', 'notion'
  
  // Scope Configuration (JSON)
  scopeConfig: jsonb("scope_config").$type<{
    siteUrl?: string;
    siteId?: string;
    libraryId?: string;
    folderPaths?: string[];
    projectKeys?: string[]; // Jira
    issueTypes?: string[]; // Jira
    workspaceId?: string; // Notion
    pageIds?: string[]; // Notion
  }>().notNull(),

  // Sync Settings
  syncMode: varchar("sync_mode", { enum: ['manual', 'auto'] }).default('manual').notNull(),
  
  // Last Import State
  lastSnapshotId: varchar("last_snapshot_id").references(() => evidenceSnapshots.id),
  lastSyncedAt: timestamp("last_synced_at"),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  integrationIdx: index("idx_connector_configs_integration").on(table.integrationId),
  orgIdx: index("idx_connector_configs_org").on(table.organizationId),
}));

// Cloud files metadata table
export const cloudFiles = pgTable("cloud_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationId: varchar("integration_id").references(() => cloudIntegrations.id, { onDelete: 'cascade' }).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  providerFileId: varchar("provider_file_id").notNull(),
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileType: varchar("file_type").notNull(), // 'pdf', 'docx', 'xlsx', etc.
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  isSecurityLocked: boolean("is_security_locked").default(false),
  securityLevel: varchar("security_level").default("standard"), // 'standard', 'restricted', 'confidential'
  permissions: jsonb("permissions").$type<{
    canView: boolean;
    canEdit: boolean;
    canDownload: boolean;
    canShare: boolean;
  }>().default({ canView: true, canEdit: false, canDownload: false, canShare: false }),
  metadata: jsonb("metadata").$type<{
    createdBy?: string;
    modifiedBy?: string;
    version?: string;
    tags?: string[];
    description?: string;
  }>(),
  thumbnailUrl: varchar("thumbnail_url"),
  downloadUrl: varchar("download_url"),
  webViewUrl: varchar("web_view_url"),
  lastModified: timestamp("last_modified"),
  syncedAt: timestamp("synced_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Document Ingestion Fields
  snapshotId: varchar("snapshot_id").references(() => evidenceSnapshots.id),
  category: varchar("category", { enum: ['Company Profile', 'Product & System', 'Security Program', 'Evidence'] }),
  fileHash: varchar("file_hash"),
  processingStatus: varchar("processing_status", { enum: ['pending', 'extracting', 'indexing', 'analyzing', 'completed', 'failed'] }).default('pending'),
  extractedTextPath: varchar("extracted_text_path"), // Path to .txt file in storage
  embeddingId: varchar("embedding_id"), // Reference to vector DB embedding

}, (table) => ({
  integrationFileUnique: unique().on(table.integrationId, table.providerFileId),
  fileTypeIdx: index("idx_cloud_files_type").on(table.fileType),
  securityIdx: index("idx_cloud_files_security").on(table.securityLevel),
  integrationIdx: index("idx_cloud_files_integration").on(table.integrationId),
  orgIdIdx: index("idx_cloud_files_org_id").on(table.organizationId),
}));



export const evidenceSnapshotsRelations = relations(evidenceSnapshots, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [evidenceSnapshots.organizationId],
    references: [organizations.id],
  }),
  files: many(cloudFiles),
}));

// Update cloudFiles definition to include new ingestion fields
// Note: We are patching the existing cloudFiles table definition here to avoid re-writing the whole file. 
// In a real migration, we would ALTER TABLE. Drizzle kit push should handle this diff.
/* 
  Existing fields: 
  id, integrationId, organizationId, providerFileId, fileName, filePath, fileType, fileSize, mimeType, 
  isSecurityLocked, securityLevel, permissions, metadata, thumbnailUrl, downloadUrl, webViewUrl, 
  lastModified, syncedAt, createdAt, updatedAt
*/

// OAuth providers table for SSO
export const oauthProviders = pgTable("oauth_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider: varchar("provider").notNull(), // 'google', 'microsoft', 'github'
  providerId: varchar("provider_id").notNull(), // External user ID
  email: varchar("email").notNull(),
  displayName: varchar("display_name"),
  profileImageUrl: varchar("profile_image_url"),
  accessTokenEncrypted: text("access_token_encrypted"),
  refreshTokenEncrypted: text("refresh_token_encrypted"),
  tokenExpiresAt: timestamp("token_expires_at"),
  isPrimary: boolean("is_primary").default(false), // Primary OAuth account
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userProviderUnique: unique().on(table.userId, table.provider),
  providerIdUnique: unique().on(table.provider, table.providerId),
  providerIdx: index("idx_oauth_providers_provider").on(table.provider),
  userIdIdx: index("idx_oauth_providers_user_id").on(table.userId),
}));

// PDF security settings table
export const pdfSecuritySettings = pgTable("pdf_security_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileId: varchar("file_id").references(() => cloudFiles.id, { onDelete: 'cascade' }).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  
  // Password protection
  hasUserPassword: boolean("has_user_password").default(false),
  hasOwnerPassword: boolean("has_owner_password").default(false),
  userPasswordEncrypted: text("user_password_encrypted"),
  ownerPasswordEncrypted: text("owner_password_encrypted"),
  
  // Permissions
  allowPrinting: boolean("allow_printing").default(false),
  allowCopying: boolean("allow_copying").default(false),
  allowModifying: boolean("allow_modifying").default(false),
  allowAnnotations: boolean("allow_annotations").default(false),
  allowFormFilling: boolean("allow_form_filling").default(false),
  allowAssembly: boolean("allow_assembly").default(false),
  allowDegradedPrinting: boolean("allow_degraded_printing").default(false),
  
  // Encryption settings
  encryptionLevel: varchar("encryption_level").default("AES256"), // 'RC4_40', 'RC4_128', 'AES128', 'AES256'
  keyLength: integer("key_length").default(256),
  
  // Watermark settings
  hasWatermark: boolean("has_watermark").default(false),
  watermarkText: varchar("watermark_text"),
  watermarkOpacity: decimal("watermark_opacity").default("0.3"),
  watermarkPosition: varchar("watermark_position").default("center"), // 'center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  fileIdUnique: unique().on(table.fileId),
  fileIdIdx: index("idx_pdf_security_file_id").on(table.fileId),
  orgIdIdx: index("idx_pdf_security_org_id").on(table.organizationId),
  encryptionIdx: index("idx_pdf_security_encryption").on(table.encryptionLevel),
}));

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
  currentDocument: text("current_document"),
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

export const cloudIntegrationsRelations = relations(cloudIntegrations, ({ many }) => ({
  connectorConfigs: many(connectorConfigs),
  files: many(cloudFiles),
}));

export const connectorConfigsRelations = relations(connectorConfigs, ({ one }) => ({
  integration: one(cloudIntegrations, {
    fields: [connectorConfigs.integrationId],
    references: [cloudIntegrations.id],
  }),
  organization: one(organizations, {
    fields: [connectorConfigs.organizationId],
    references: [organizations.id],
  }),
  lastSnapshot: one(evidenceSnapshots, {
    fields: [connectorConfigs.lastSnapshotId],
    references: [evidenceSnapshots.id],
  }),
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
export const insertUserSchema = cis(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = cis(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationSchema = cis(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConnectorConfigSchema = cis(connectorConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSnapshotId: true,
  lastSyncedAt: true,
});

export const insertUserOrganizationSchema = cis(userOrganizations).omit({
  id: true,
  joinedAt: true,
});

export const insertUserInvitationSchema = cis(userInvitations).omit({
  id: true,
  createdAt: true,
  acceptedAt: true,
});

export const insertUserSessionSchema = cis(userSessions).omit({
  id: true,
  createdAt: true,
});

// Zod schemas for company profile nested JSON structures
export const contactInfoSchema = z.object({
  primaryContact: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
}).optional();

export const organizationStructureSchema = z.object({
  legalEntityType: z.string().optional(),
  parentCompany: z.object({ name: z.string(), relationship: z.string().optional() }).optional(),
  subsidiaries: z.array(z.object({ name: z.string(), location: z.string().optional() })).optional(),
  departments: z.array(z.object({ name: z.string(), head: z.string().optional(), employeeCount: z.number().optional(), responsibilities: z.string().optional() })).optional(),
  totalEmployees: z.number().optional(),
  employeesByDepartment: z.array(z.object({ department: z.string(), count: z.number() })).optional(),
}).optional();

export const keyPersonnelSchema = z.object({
  ceo: z.object({ name: z.string(), email: z.string().optional(), phone: z.string().optional() }).optional(),
  cfo: z.object({ name: z.string(), email: z.string().optional(), phone: z.string().optional() }).optional(),
  coo: z.object({ name: z.string(), email: z.string().optional(), phone: z.string().optional() }).optional(),
  cto: z.object({ name: z.string(), email: z.string().optional(), phone: z.string().optional() }).optional(),
  cio: z.object({ name: z.string(), email: z.string().optional(), phone: z.string().optional() }).optional(),
  ciso: z.object({ name: z.string(), email: z.string().optional(), phone: z.string().optional() }).optional(),
  dpo: z.object({ name: z.string(), email: z.string().optional(), phone: z.string().optional() }).optional(),
  cpo: z.object({ name: z.string(), email: z.string().optional(), phone: z.string().optional() }).optional(),
  securityOfficer: z.object({ name: z.string(), email: z.string().optional(), phone: z.string().optional() }).optional(),
  complianceOfficer: z.object({ name: z.string(), email: z.string().optional(), phone: z.string().optional() }).optional(),
  itManager: z.object({ name: z.string(), email: z.string().optional(), phone: z.string().optional() }).optional(),
  hrDirector: z.object({ name: z.string(), email: z.string().optional(), phone: z.string().optional() }).optional(),
  legalCounsel: z.object({ name: z.string(), email: z.string().optional(), phone: z.string().optional() }).optional(),
  boardMembers: z.array(z.object({ name: z.string(), role: z.string(), email: z.string().optional() })).optional(),
  securityTeam: z.array(z.object({ name: z.string(), role: z.string(), email: z.string().optional() })).optional(),
  complianceTeam: z.array(z.object({ name: z.string(), role: z.string(), email: z.string().optional() })).optional(),
  itTeamLeads: z.array(z.object({ name: z.string(), area: z.string(), email: z.string().optional() })).optional(),
  keyStakeholders: z.array(z.object({ name: z.string(), role: z.string(), department: z.string(), email: z.string().optional() })).optional(),
}).optional();

export const productsAndServicesSchema = z.object({
  primaryProducts: z.array(z.object({ name: z.string(), description: z.string().optional() })).optional(),
  primaryServices: z.array(z.object({ name: z.string(), description: z.string().optional() })).optional(),
  customerSegments: z.array(z.enum(['B2B', 'B2C', 'Government', 'Enterprise', 'SMB'])).optional(),
  slaCommitments: z.array(z.object({ service: z.string(), availability: z.string(), responseTime: z.string().optional() })).optional(),
  serviceAvailabilityRequirements: z.string().optional(),
}).optional();

export const geographicOperationsSchema = z.object({
  countriesOfOperation: z.array(z.string()).optional(),
  officeLocations: z.array(z.object({ address: z.string(), type: z.enum(['headquarters', 'regional', 'satellite', 'remote']), employeeCount: z.number().optional() })).optional(),
  dataCenterLocations: z.array(z.object({ location: z.string(), type: z.enum(['primary', 'disaster_recovery', 'backup']), provider: z.string().optional() })).optional(),
  customerRegionsServed: z.array(z.string()).optional(),
  regulatoryJurisdictions: z.array(z.string()).optional(),
}).optional();

export const securityInfrastructureSchema = z.object({
  networkArchitectureSummary: z.string().optional(),
  firewallVendor: z.string().optional(),
  idsIpsVendor: z.string().optional(),
  siemSolution: z.string().optional(),
  endpointProtection: z.string().optional(),
  encryptionStandards: z.array(z.object({ type: z.string(), algorithm: z.string(), keyLength: z.number().optional() })).optional(),
  backupSolutions: z.array(z.object({ type: z.string(), frequency: z.string(), retention: z.string().optional() })).optional(),
  disasterRecoverySites: z.array(z.object({ location: z.string(), type: z.string(), rtoHours: z.number().optional() })).optional(),
  vpnSolution: z.string().optional(),
  mfaProvider: z.string().optional(),
  identityProvider: z.string().optional(),
}).optional();

export const businessContinuitySchema = z.object({
  rtoHours: z.number().optional(),
  rpoHours: z.number().optional(),
  bcdrPlanExists: z.boolean().optional(),
  lastDrTestDate: z.string().optional(),
  criticalSystems: z.array(z.object({ system: z.string(), rtoHours: z.number(), rpoHours: z.number() })).optional(),
  backupFrequency: z.string().optional(),
  incidentResponsePlanExists: z.boolean().optional(),
  lastIncidentResponseTest: z.string().optional(),
}).optional();

export const vendorManagementSchema = z.object({
  criticalVendors: z.array(z.object({ name: z.string(), service: z.string(), securityAssessmentStatus: z.enum(['pending', 'approved', 'requires_review']).optional(), lastAssessmentDate: z.string().optional() })).optional(),
  thirdPartyIntegrations: z.array(z.object({ name: z.string(), type: z.string(), dataShared: z.array(z.string()).optional() })).optional(),
  vendorRiskAssessmentFrequency: z.string().optional(),
}).optional();

export const frameworkConfigsSchema = z.object({
  fedramp: z.object({
    level: z.enum(['low', 'moderate', 'high']),
    impactLevel: z.object({
      confidentiality: z.enum(['low', 'moderate', 'high']),
      integrity: z.enum(['low', 'moderate', 'high']),
      availability: z.enum(['low', 'moderate', 'high']),
    }),
    selectedControls: z.array(z.string()),
  }).optional(),
  nist80053: z.object({
    version: z.literal('revision-5'),
    selectedControlFamilies: z.array(z.string()),
  }).optional(),
  iso27001: z.object({
    version: z.literal('2022'),
    scope: z.string(),
    selectedControls: z.array(z.string()),
  }).optional(),
  soc2: z.object({
    trustServices: z.array(z.enum(['security', 'availability', 'processing', 'confidentiality', 'privacy'])),
    reportType: z.enum(['type1', 'type2']),
  }).optional(),
}).optional();

export const uploadedDocsSchema = z.object({
  incorporationDocs: z.array(z.object({ filename: z.string(), url: z.string(), extractedData: z.any().optional() })).optional(),
  registrationDocs: z.array(z.object({ filename: z.string(), url: z.string(), extractedData: z.any().optional() })).optional(),
  profileDocs: z.array(z.object({ filename: z.string(), url: z.string(), extractedData: z.any().optional() })).optional(),
  orgCharts: z.array(z.object({ filename: z.string(), url: z.string(), extractedData: z.any().optional() })).optional(),
  policyDocs: z.array(z.object({ filename: z.string(), url: z.string(), extractedData: z.any().optional() })).optional(),
}).optional();

export const aiResearchDataSchema = z.object({
  lastResearchDate: z.string().optional(),
  sources: z.array(z.object({ url: z.string(), type: z.string(), extractedAt: z.string() })).optional(),
  confidence: z.number().optional(),
  extractedInfo: z.record(z.any()).optional(),
}).optional();

export const insertCompanyProfileSchema = cis(companyProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  contactInfo: contactInfoSchema,
  organizationStructure: organizationStructureSchema,
  keyPersonnel: keyPersonnelSchema,
  productsAndServices: productsAndServicesSchema,
  geographicOperations: geographicOperationsSchema,
  securityInfrastructure: securityInfrastructureSchema,
  businessContinuity: businessContinuitySchema,
  vendorManagement: vendorManagementSchema,
  frameworkConfigs: frameworkConfigsSchema,
  uploadedDocs: uploadedDocsSchema,
  aiResearchData: aiResearchDataSchema,
});

export const insertDocumentSchema = cis(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGenerationJobSchema = cis(generationJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentTemplateSchema = cis(documentTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentWorkspaceSchema = cis(documentWorkspace).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemConfigurationSchema = cis(systemConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type PasskeyCredential = typeof passkeyCredentials.$inferSelect;
export type SystemConfiguration = typeof systemConfigurations.$inferSelect;
export type MfaSetting = typeof mfaSettings.$inferSelect;
export type CloudIntegration = typeof cloudIntegrations.$inferSelect;
export type ConnectorConfig = typeof connectorConfigs.$inferSelect;
export type InsertConnectorConfig = z.infer<typeof insertConnectorConfigSchema>;

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
export const insertGapAnalysisReportSchema = cis(gapAnalysisReports).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertGapAnalysisFindingSchema = cis(gapAnalysisFindings).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertRemediationRecommendationSchema = cis(remediationRecommendations).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertComplianceMaturityAssessmentSchema = cis(complianceMaturityAssessments).omit({ 
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

// Framework Control Status Tracking - for persisting control status on framework pages
export const frameworkControlStatuses = pgTable("framework_control_statuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  framework: varchar("framework", { enum: ["iso27001", "soc2", "fedramp", "nist"] }).notNull(),
  controlId: varchar("control_id").notNull(),
  status: varchar("status", { enum: ["not_started", "in_progress", "implemented", "not_applicable"] }).default("not_started"),
  evidenceStatus: varchar("evidence_status", { enum: ["none", "partial", "complete"] }).default("none"),
  notes: text("notes"),
  updatedBy: varchar("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFrameworkControlStatusSchema = cis(frameworkControlStatuses).omit({
  id: true,
  updatedAt: true,
});
export type InsertFrameworkControlStatus = z.infer<typeof insertFrameworkControlStatusSchema>;
export type FrameworkControlStatus = typeof frameworkControlStatuses.$inferSelect;
export type FineTuningMetric = typeof fineTuningMetrics.$inferSelect;
export type InsertFineTuningMetric = typeof fineTuningMetrics.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type UserOrganization = typeof userOrganizations.$inferSelect;
export type InsertUserOrganization = z.infer<typeof insertUserOrganizationSchema>;

export type UserInvitation = typeof userInvitations.$inferSelect;
export type InsertUserInvitation = z.infer<typeof insertUserInvitationSchema>;

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;

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

export const insertDocumentVersionSchema = cis(documentVersions).omit({
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
  signature: varchar("signature", { length: 64 }),
  previousSignature: varchar("previous_signature", { length: 64 }),
}, (table) => [
  index("idx_audit_logs_user_id").on(table.userId),
  index("idx_audit_logs_action").on(table.action),
  index("idx_audit_logs_timestamp").on(table.timestamp),
  index("idx_audit_logs_risk_level").on(table.riskLevel),
  index("idx_audit_logs_signature").on(table.signature)
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

export const insertAuditTrailSchema = cis(auditTrail).omit({
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

export const insertDocumentApprovalSchema = cis(documentApprovals).omit({
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

// In-app notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id),
  type: varchar("type", { enum: ["document", "compliance", "security", "team", "system", "ai"] }).notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  link: varchar("link"),
  isRead: boolean("is_read").default(false).notNull(),
  metadata: jsonb("metadata").$type<{
    entityType?: string;
    entityId?: string;
    actionType?: string;
    severity?: "low" | "medium" | "high" | "critical";
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_notifications_user_id").on(table.userId),
  index("idx_notifications_is_read").on(table.isRead),
  index("idx_notifications_created_at").on(table.createdAt),
]);

export const insertNotificationSchema = cis(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [notifications.organizationId],
    references: [organizations.id],
  }),
}));

// ========================================
// PHASE 3: Data Residency, Privacy & AI Guardrails
// ========================================

// Data Residency Policies - Tenant-level geographic data controls
export const dataResidencyPolicies = pgTable("data_residency_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  policyName: varchar("policy_name").notNull(),
  region: varchar("region").notNull(), // us-east-1, eu-west-1, ap-southeast-1, etc.
  dataTypes: jsonb("data_types").$type<string[]>().notNull().default([]), // documents, ai_cache, audit_logs, etc.
  enforceStrict: boolean("enforce_strict").notNull().default(true),
  allowedRegions: jsonb("allowed_regions").$type<string[]>().notNull().default([]),
  blockedRegions: jsonb("blocked_regions").$type<string[]>().notNull().default([]),
  status: varchar("status", { enum: ["active", "inactive", "pending"] }).notNull().default("active"),
  validatedAt: timestamp("validated_at"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_residency_org").on(table.organizationId),
  index("idx_residency_status").on(table.status),
]);

// Data Retention Policies - Configurable data lifecycle management
export const dataRetentionPolicies = pgTable("data_retention_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  policyName: varchar("policy_name").notNull(),
  dataType: varchar("data_type").notNull(), // documents, ai_responses, audit_logs, user_data, etc.
  retentionDays: integer("retention_days").notNull(), // Number of days to retain data
  deleteAfterExpiry: boolean("delete_after_expiry").notNull().default(true),
  archiveBeforeDelete: boolean("archive_before_delete").notNull().default(true),
  archiveLocation: varchar("archive_location"), // s3, glacier, local, etc.
  complianceFramework: varchar("compliance_framework"), // GDPR, HIPAA, SOC2, etc.
  status: varchar("status", { enum: ["active", "inactive", "pending"] }).notNull().default("active"),
  lastEnforcedAt: timestamp("last_enforced_at"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_retention_org").on(table.organizationId),
  index("idx_retention_status").on(table.status),
  index("idx_retention_type").on(table.dataType),
]);

// AI Guardrails Logs - Track AI safety checks and interventions
export const aiGuardrailsLogs = pgTable("ai_guardrails_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id),
  userId: varchar("user_id").references(() => users.id),
  requestId: varchar("request_id").notNull(), // Correlate with AI request
  guardrailType: varchar("guardrail_type").notNull(), // prompt_shield, pii_redaction, output_classifier, content_moderation
  action: varchar("action").notNull(), // allowed, blocked, redacted, flagged, human_review_required
  severity: varchar("severity", { enum: ["low", "medium", "high", "critical"] }).notNull(),

  // Input analysis
  originalPrompt: text("original_prompt"),
  sanitizedPrompt: text("sanitized_prompt"),
  promptRiskScore: decimal("prompt_risk_score", { precision: 5, scale: 2 }),

  // PII Detection and Redaction
  piiDetected: boolean("pii_detected").notNull().default(false),
  piiTypes: jsonb("pii_types").$type<string[]>(), // email, ssn, credit_card, phone, address, etc.
  piiRedacted: boolean("pii_redacted").notNull().default(false),

  // Output analysis
  originalResponse: text("original_response"),
  sanitizedResponse: text("sanitized_response"),
  responseRiskScore: decimal("response_risk_score", { precision: 5, scale: 2 }),

  // Content classification
  contentCategories: jsonb("content_categories").$type<string[]>(), // safe, policy_violation, toxic, harmful, etc.
  moderationFlags: jsonb("moderation_flags").$type<{
    hate: number;
    harassment: number;
    violence: number;
    sexual: number;
    selfHarm: number;
    pii: number;
  }>(),

  // Human review
  requiresHumanReview: boolean("requires_human_review").notNull().default(false),
  humanReviewedAt: timestamp("human_reviewed_at"),
  humanReviewedBy: varchar("human_reviewed_by").references(() => users.id),
  humanReviewDecision: varchar("human_review_decision", { enum: ["approved", "rejected", "modified"] }),
  humanReviewNotes: text("human_review_notes"),

  // Metadata
  modelProvider: varchar("model_provider"), // openai, anthropic, etc.
  modelName: varchar("model_name"),
  processingTimeMs: integer("processing_time_ms"),
  ipAddress: varchar("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_guardrails_org").on(table.organizationId),
  index("idx_guardrails_user").on(table.userId),
  index("idx_guardrails_type").on(table.guardrailType),
  index("idx_guardrails_action").on(table.action),
  index("idx_guardrails_severity").on(table.severity),
  index("idx_guardrails_review").on(table.requiresHumanReview),
  index("idx_guardrails_created").on(table.createdAt),
]);

// Model Cards - AI Model transparency and documentation
export const modelCards = pgTable("model_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelProvider: varchar("model_provider").notNull(), // openai, anthropic, custom
  modelName: varchar("model_name").notNull(),
  modelVersion: varchar("model_version").notNull(),

  // Model Information
  description: text("description").notNull(),
  intendedUse: text("intended_use").notNull(),
  limitations: text("limitations").notNull(),
  trainingData: text("training_data"),

  // Performance Metrics
  performanceMetrics: jsonb("performance_metrics").$type<{
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    latencyMs?: number;
    customMetrics?: Record<string, number>;
  }>(),

  // Bias and Fairness
  biasAssessment: text("bias_assessment"),
  fairnessMetrics: jsonb("fairness_metrics").$type<{
    demographicParity?: number;
    equalOpportunity?: number;
    notes?: string;
  }>(),

  // Safety and Ethics
  safetyEvaluations: text("safety_evaluations"),
  ethicalConsiderations: text("ethical_considerations"),

  // Data Privacy
  privacyFeatures: jsonb("privacy_features").$type<string[]>(), // encryption, pii_filtering, data_minimization
  dataRetentionPolicy: text("data_retention_policy"),
  dataResidency: text("data_residency"),

  // Compliance
  complianceFrameworks: jsonb("compliance_frameworks").$type<string[]>(), // SOC2, GDPR, HIPAA, etc.
  certifications: jsonb("certifications").$type<string[]>(),

  // Contact and Support
  contactInfo: jsonb("contact_info").$type<{
    supportEmail?: string;
    documentation?: string;
    responsible?: string;
  }>(),

  status: varchar("status", { enum: ["active", "deprecated", "experimental"] }).notNull().default("active"),
  publishedAt: timestamp("published_at"),
  lastReviewedAt: timestamp("last_reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_model_provider").on(table.modelProvider),
  index("idx_model_name").on(table.modelName),
  index("idx_model_status").on(table.status),
  unique().on(table.modelProvider, table.modelName, table.modelVersion),
]);

// AI Usage Transparency - Track and disclose AI usage to users
export const aiUsageDisclosures = pgTable("ai_usage_disclosures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  actionType: varchar("action_type").notNull(), // document_generation, analysis, chatbot, risk_assessment, etc.

  // Model Information
  modelProvider: varchar("model_provider").notNull(),
  modelName: varchar("model_name").notNull(),
  modelCardId: varchar("model_card_id").references(() => modelCards.id),

  // Disclosure Details
  purposeDescription: text("purpose_description").notNull(),
  dataUsed: jsonb("data_used").$type<string[]>(), // Types of data sent to AI
  dataRetentionDays: integer("data_retention_days"),
  dataStorageRegion: varchar("data_storage_region"),

  // User Consent
  userConsented: boolean("user_consented").notNull().default(false),
  consentedAt: timestamp("consented_at"),
  consentVersion: varchar("consent_version"),

  // Transparency
  aiContribution: varchar("ai_contribution").notNull(), // full, partial, assisted, review
  humanOversight: boolean("human_oversight").notNull().default(false),

  // Result Metadata
  tokensUsed: integer("tokens_used"),
  costEstimate: decimal("cost_estimate", { precision: 10, scale: 4 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_disclosure_org").on(table.organizationId),
  index("idx_disclosure_user").on(table.userId),
  index("idx_disclosure_action").on(table.actionType),
  index("idx_disclosure_provider").on(table.modelProvider),
  index("idx_disclosure_created").on(table.createdAt),
]);

// Contact Messages table for storing form submissions
export const contactMessages = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  company: varchar("company").notNull(),
  subject: varchar("subject").notNull(),
  message: text("message").notNull(),
  status: varchar("status").notNull().default("new"), // new, read, replied, archived
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContactMessageSchema = cis(contactMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

// Role definitions for RBAC
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(), // admin, standard_user, auditor
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  permissions: jsonb("permissions").$type<{
    documents?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean; approve?: boolean; };
    users?: { invite?: boolean; manage?: boolean; view?: boolean; };
    organization?: { settings?: boolean; billing?: boolean; integrations?: boolean; };
    compliance?: { view?: boolean; audit?: boolean; manage?: boolean; };
    ai?: { chat?: boolean; generate?: boolean; finetune?: boolean; };
    admin?: { full?: boolean; };
  }>().notNull().default({}),
  isSystem: boolean("is_system").notNull().default(false), // System roles cannot be deleted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRoleSchema = cis(roles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;

// Role assignments for users within organizations
export const roleAssignments = pgTable("role_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  roleId: varchar("role_id").references(() => roles.id).notNull(),
  assignedBy: varchar("assigned_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique().on(table.userId, table.organizationId, table.roleId),
  index("idx_role_assignment_user").on(table.userId),
  index("idx_role_assignment_org").on(table.organizationId),
]);

export const insertRoleAssignmentSchema = cis(roleAssignments).omit({ id: true, createdAt: true });
export type InsertRoleAssignment = z.infer<typeof insertRoleAssignmentSchema>;
export type RoleAssignment = typeof roleAssignments.$inferSelect;

// Projects for team collaboration
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  status: varchar("status", { enum: ["active", "archived", "completed"] }).default("active"),
  framework: varchar("framework"), // Primary compliance framework
  targetCompletionDate: timestamp("target_completion_date"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_project_org").on(table.organizationId),
]);

export const insertProjectSchema = cis(projects).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Project memberships
export const projectMemberships = pgTable("project_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role", { enum: ["owner", "editor", "viewer"] }).default("viewer"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => [
  unique().on(table.projectId, table.userId),
  index("idx_project_member_project").on(table.projectId),
  index("idx_project_member_user").on(table.userId),
]);

export const insertProjectMembershipSchema = cis(projectMemberships).omit({ id: true, joinedAt: true });
export type InsertProjectMembership = z.infer<typeof insertProjectMembershipSchema>;
export type ProjectMembership = typeof projectMemberships.$inferSelect;

// AI Chat Sessions for persistent conversation history
export const aiSessions = pgTable("ai_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "set null" }),
  title: varchar("title").notNull().default("New Conversation"),
  sessionType: varchar("session_type", { enum: ["chat", "document_generation", "analysis", "gap_assessment"] }).default("chat"),
  context: jsonb("context").$type<{
    framework?: string;
    documentId?: string;
    companyProfileId?: string;
  }>(),
  isActive: boolean("is_active").default(true),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_session_user").on(table.userId),
  index("idx_ai_session_org").on(table.organizationId),
]);

export const insertAiSessionSchema = cis(aiSessions).omit({ id: true, createdAt: true });
export type InsertAiSession = z.infer<typeof insertAiSessionSchema>;
export type AiSession = typeof aiSessions.$inferSelect;

// AI Chat Messages within sessions
export const aiMessages = pgTable("ai_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => aiSessions.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<{
    model?: string;
    tokensUsed?: number;
    toolCalls?: { name: string; input: any; output: any; }[];
    citations?: { source: string; reference: string; }[];
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_message_session").on(table.sessionId),
  index("idx_ai_message_created").on(table.createdAt),
]);

export const insertAiMessageSchema = cis(aiMessages).omit({ id: true, createdAt: true });
export type InsertAiMessage = z.infer<typeof insertAiMessageSchema>;
export type AiMessage = typeof aiMessages.$inferSelect;

// ============================================================================
// Repository Analysis Tables
// ============================================================================

// Repository Snapshots - Immutable source code snapshots for compliance analysis
export const repositorySnapshots = pgTable("repository_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  companyProfileId: varchar("company_profile_id").references(() => companyProfiles.id, { onDelete: "cascade" }).notNull(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  name: varchar("name").notNull(), // User-provided name
  status: varchar("status", { 
    enum: ["extracting", "indexed", "analyzing", "completed", "failed"] 
  }).default("extracting").notNull(),
  uploadedFileName: varchar("uploaded_file_name").notNull(),
  uploadedFileHash: varchar("uploaded_file_hash").notNull(), // SHA-256
  extractedPath: text("extracted_path"), // Local read-only path
  repositorySize: integer("repository_size"), // bytes
  fileCount: integer("file_count").default(0),
  manifestHash: varchar("manifest_hash"), // SHA-256 of MANIFEST.json
  // Detection results
  detectedLanguages: jsonb("detected_languages").$type<string[]>().default([]),
  detectedFrameworks: jsonb("detected_frameworks").$type<string[]>().default([]),
  detectedInfraTools: jsonb("detected_infra_tools").$type<string[]>().default([]), // terraform, k8s, docker
  // Analysis metadata
  analysisStartedAt: timestamp("analysis_started_at"),
  analysisCompletedAt: timestamp("analysis_completed_at"),
  analysisPhase: varchar("analysis_phase"), // current phase if in progress
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_repo_snapshot_org").on(table.organizationId),
  index("idx_repo_snapshot_profile").on(table.companyProfileId),
  index("idx_repo_snapshot_status").on(table.status),
]);

export const insertRepositorySnapshotSchema = cis(repositorySnapshots).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertRepositorySnapshot = z.infer<typeof insertRepositorySnapshotSchema>;
export type RepositorySnapshot = typeof repositorySnapshots.$inferSelect;

// Repository Files - Individual files within a snapshot
export const repositoryFiles = pgTable("repository_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  snapshotId: varchar("snapshot_id").references(() => repositorySnapshots.id, { onDelete: "cascade" }).notNull(),
  relativePath: text("relative_path").notNull(),
  fileName: varchar("file_name").notNull(),
  fileType: varchar("file_type"), // extension
  fileSize: integer("file_size"),
  fileHash: varchar("file_hash"), // SHA-256
  language: varchar("language"), // detected language
  category: varchar("category", { 
    enum: ["source", "config", "docs", "ci_cd", "iac", "test", "other"] 
  }).default("other"),
  isSecurityRelevant: boolean("is_security_relevant").default(false),
  indexedAt: timestamp("indexed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_repo_file_snapshot").on(table.snapshotId),
  index("idx_repo_file_category").on(table.category),
  index("idx_repo_file_security").on(table.isSecurityRelevant),
]);

export const insertRepositoryFileSchema = cis(repositoryFiles).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertRepositoryFile = z.infer<typeof insertRepositoryFileSchema>;
export type RepositoryFile = typeof repositoryFiles.$inferSelect;

// Repository Findings - Control scores and evidence from code analysis
export const repositoryFindings = pgTable("repository_findings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  snapshotId: varchar("snapshot_id").references(() => repositorySnapshots.id, { onDelete: "cascade" }).notNull(),
  controlId: varchar("control_id").notNull(), // Framework control ID (e.g., 'CC6.1', 'A.9.1.1')
  framework: varchar("framework").notNull(), // 'SOC2', 'ISO27001', etc.
  status: varchar("status", { 
    enum: ["pass", "partial", "fail", "not_observed", "needs_human"] 
  }).notNull(),
  confidenceLevel: varchar("confidence_level", { 
    enum: ["high", "medium", "low"] 
  }).default("medium").notNull(),
  signalType: varchar("signal_type"), // 'authentication', 'encryption', 'logging', etc.
  summary: text("summary").notNull(),
  details: jsonb("details"), // structured finding data
  evidenceReferences: jsonb("evidence_references").$type<{
    filePath: string;
    lineStart?: number;
    lineEnd?: number;
    snippet?: string;
  }[]>().default([]),
  recommendation: text("recommendation"),
  aiModel: varchar("ai_model"), // which model generated this
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  humanOverride: jsonb("human_override"), // if human modifies AI conclusion
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_repo_finding_snapshot").on(table.snapshotId),
  index("idx_repo_finding_framework").on(table.framework),
  index("idx_repo_finding_control").on(table.controlId),
  index("idx_repo_finding_status").on(table.status),
]);

export const insertRepositoryFindingSchema = cis(repositoryFindings).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  generatedAt: true
});
export type InsertRepositoryFinding = z.infer<typeof insertRepositoryFindingSchema>;
export type RepositoryFinding = typeof repositoryFindings.$inferSelect;

// Repository Tasks - Action items from findings
export const repositoryTasks = pgTable("repository_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  snapshotId: varchar("snapshot_id").references(() => repositorySnapshots.id, { onDelete: "cascade" }).notNull(),
  findingId: varchar("finding_id").references(() => repositoryFindings.id, { onDelete: "set null" }),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category", { 
    enum: ["missing_evidence", "code_change", "policy_needed", "procedure_needed"] 
  }).notNull(),
  priority: varchar("priority", { 
    enum: ["critical", "high", "medium", "low"] 
  }).default("medium").notNull(),
  status: varchar("status", { 
    enum: ["open", "in_progress", "completed", "dismissed"] 
  }).default("open").notNull(),
  assignedToRole: varchar("assigned_to_role").default("user"), // RBAC role label
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_repo_task_snapshot").on(table.snapshotId),
  index("idx_repo_task_finding").on(table.findingId),
  index("idx_repo_task_status").on(table.status),
  index("idx_repo_task_priority").on(table.priority),
]);

export const insertRepositoryTaskSchema = cis(repositoryTasks).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertRepositoryTask = z.infer<typeof insertRepositoryTaskSchema>;
export type RepositoryTask = typeof repositoryTasks.$inferSelect;

// Repository Analysis Runs - Track analysis execution
export const repositoryAnalysisRuns = pgTable("repository_analysis_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  snapshotId: varchar("snapshot_id").references(() => repositorySnapshots.id, { onDelete: "cascade" }).notNull(),
  frameworks: jsonb("frameworks").$type<string[]>().notNull(), // which frameworks to analyze
  analysisDepth: varchar("analysis_depth", { 
    enum: ["structure_only", "security_relevant", "full"] 
  }).default("security_relevant").notNull(),
  phase: varchar("phase"), // current phase name
  phaseStatus: varchar("phase_status", { 
    enum: ["pending", "running", "completed", "failed"] 
  }).default("pending").notNull(),
  progress: integer("progress").default(0), // 0-100
  filesAnalyzed: integer("files_analyzed").default(0),
  findingsGenerated: integer("findings_generated").default(0),
  documentsGenerated: integer("documents_generated").default(0),
  tasksCreated: integer("tasks_created").default(0),
  llmCallsMade: integer("llm_calls_made").default(0),
  tokensUsed: integer("tokens_used").default(0),
  costEstimate: decimal("cost_estimate"), // USD
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorLog: jsonb("error_log"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_repo_run_snapshot").on(table.snapshotId),
  index("idx_repo_run_status").on(table.phaseStatus),
]);

export const insertRepositoryAnalysisRunSchema = cis(repositoryAnalysisRuns).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertRepositoryAnalysisRun = z.infer<typeof insertRepositoryAnalysisRunSchema>;
export type RepositoryAnalysisRun = typeof repositoryAnalysisRuns.$inferSelect;

// Repository Documents - Link generated docs to snapshots
export const repositoryDocuments = pgTable("repository_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  snapshotId: varchar("snapshot_id").references(() => repositorySnapshots.id, { onDelete: "cascade" }).notNull(),
  documentId: varchar("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  framework: varchar("framework").notNull(),
  templateId: varchar("template_id"),
  status: varchar("status", { 
    enum: ["generated", "draft", "pending_approval", "approved"] 
  }).default("generated").notNull(),
  generatedBy: varchar("generated_by").default("AI"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedByName: varchar("approved_by_name"),
  approvedByTitle: varchar("approved_by_title"),
  approvedAt: timestamp("approved_at"),
  approvalNotes: text("approval_notes"),
  version: integer("version").default(1).notNull(),
  signatureBlock: jsonb("signature_block").$type<{
    createdBy: string;
    createdAt: string;
    snapshotId: string;
    snapshotHash: string;
    templateId: string;
    templateVersion: string;
    approvedBy?: string;
    approvedByName?: string;
    approvedByTitle?: string;
    approvedAt?: string;
    approvalStatement?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_repo_doc_snapshot").on(table.snapshotId),
  index("idx_repo_doc_document").on(table.documentId),
  index("idx_repo_doc_status").on(table.status),
]);

export const insertRepositoryDocumentSchema = cis(repositoryDocuments).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  generatedAt: true
});
export type InsertRepositoryDocument = z.infer<typeof insertRepositoryDocumentSchema>;
export type RepositoryDocument = typeof repositoryDocuments.$inferSelect;

// Stakeholders - People imported from IdP or entered manually
export const stakeholders = pgTable("stakeholders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  source: varchar("source", { 
    enum: ["manual", "entra_id", "google_workspace", "okta"] 
  }).default("manual").notNull(),
  externalId: varchar("external_id"), // IdP user ID
  displayName: varchar("display_name").notNull(),
  email: varchar("email").notNull(),
  jobTitle: varchar("job_title"),
  department: varchar("department"),
  managerName: varchar("manager_name"),
  managerEmail: varchar("manager_email"),
  phone: varchar("phone"),
  isActive: boolean("is_active").default(true).notNull(),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_stakeholder_org").on(table.organizationId),
  index("idx_stakeholder_email").on(table.email),
  index("idx_stakeholder_source").on(table.source),
]);

export const insertStakeholderSchema = cis(stakeholders).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertStakeholder = z.infer<typeof insertStakeholderSchema>;
export type Stakeholder = typeof stakeholders.$inferSelect;

// Relations for Phase 3 tables
export const dataResidencyPoliciesRelations = relations(dataResidencyPolicies, ({ one }) => ({
  organization: one(organizations, {
    fields: [dataResidencyPolicies.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [dataResidencyPolicies.createdBy],
    references: [users.id],
  }),
}));

export const dataRetentionPoliciesRelations = relations(dataRetentionPolicies, ({ one }) => ({
  organization: one(organizations, {
    fields: [dataRetentionPolicies.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [dataRetentionPolicies.createdBy],
    references: [users.id],
  }),
}));

export const aiGuardrailsLogsRelations = relations(aiGuardrailsLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [aiGuardrailsLogs.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [aiGuardrailsLogs.userId],
    references: [users.id],
  }),
}));

export const aiUsageDisclosuresRelations = relations(aiUsageDisclosures, ({ one }) => ({
  organization: one(organizations, {
    fields: [aiUsageDisclosures.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [aiUsageDisclosures.userId],
    references: [users.id],
  }),
  modelCard: one(modelCards, {
    fields: [aiUsageDisclosures.modelCardId],
    references: [modelCards.id],
  }),
}));

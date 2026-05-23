import crypto from 'crypto';
import { sql, relations } from "drizzle-orm";
import { sqliteTable as pgTable, text, integer, real as decimal, index, unique } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
// Cast to any required due to incompatibility between drizzle-zod 0.8.3 and zod 3.25.x (required by openai/anthropic SDKs)
// TODO: Remove cast when drizzle-zod supports zod 3.25+
export const cis = createInsertSchema as any;
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess", { mode: "json" }).notNull(),
    expire: integer("expire", { mode: "timestamp" }).notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User profiles table
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique().notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").notNull().default("user"), // user, admin, org_admin
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  // Enterprise authentication fields
  passwordHash: text("password_hash"), // For local account creation
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  phoneNumber: text("phone_number"),
  phoneVerified: integer("phone_verified", { mode: "boolean" }).default(false),
  twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" }).default(false),
  // Account status and security
  accountStatus: text("account_status").default("pending_verification"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  accountLockedUntil: integer("account_locked_until", { mode: "timestamp" }),
  // Passkey support
  passkeyEnabled: integer("passkey_enabled", { mode: "boolean" }).default(false),
  // Profile preferences
  profilePreferences: text("profile_preferences", { mode: "json" }).$type<{
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    timezone?: string;
    dateFormat?: string;
    dashboardLayout?: 'compact' | 'standard' | 'expanded';
    defaultFramework?: string;
    aiAssistantEnabled?: boolean;
  }>().default({}),
  // Notification settings
  notificationSettings: text("notification_settings", { mode: "json" }).$type<{
    emailNotifications?: boolean;
    documentUpdates?: boolean;
    complianceAlerts?: boolean;
    teamActivity?: boolean;
    weeklyDigest?: boolean;
    securityAlerts?: boolean;
    marketingEmails?: boolean;
  }>().default({}),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
});

// Organizations table for multi-tenant support
export const organizations = pgTable("organizations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  logo: text("logo"),
  website: text("website"),
  contactEmail: text("contact_email"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
});

// User-Organization memberships
export const userOrganizations = pgTable("user_organizations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  organizationId: text("organization_id").references(() => organizations.id).notNull(),
  role: text("role").notNull().default("member"), // member, admin, owner
  joinedAt: integer("joined_at", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => [
  unique().on(table.userId, table.organizationId)
]);

// User Invitations for enterprise user management
export const userInvitations = pgTable("user_invitations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  organizationId: text("organization_id").references(() => organizations.id),
  role: text("role").notNull().default("user"), // user, admin, org_admin
  organizationRole: text("organization_role").default("member"), // member, admin, owner
  invitedBy: text("invited_by").references(() => users.id).notNull(),
  token: text("token").unique().notNull(),
  status: text("status").default("pending"),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  acceptedAt: integer("accepted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
});

// User Sessions for session management
export const userSessions = pgTable("user_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  sessionToken: text("session_token").unique().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceInfo: text("device_info", { mode: "json" }).$type<{
    browser?: string;
    os?: string;
    device?: string;
    isMobile?: boolean;
  }>(),
  location: text("location", { mode: "json" }).$type<{
    country?: string;
    city?: string;
    timezone?: string;
  }>(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  lastActivityAt: integer("last_activity_at", { mode: "timestamp" }).defaultNow(),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const companyProfiles = pgTable("company_profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").references(() => organizations.id).notNull(),
  createdBy: text("created_by").references(() => users.id).notNull(),
  companyName: text("company_name").notNull(),
  industry: text("industry").notNull(),
  companySize: text("company_size").notNull(),
  headquarters: text("headquarters").notNull(),
  cloudInfrastructure: text("cloud_infrastructure", { mode: "json" }).$type<string[]>().notNull().default([]),
  dataClassification: text("data_classification").notNull(),
  businessApplications: text("business_applications").notNull(),
  complianceFrameworks: text("compliance_frameworks", { mode: "json" }).$type<string[]>().notNull().default([]),
  contactInfo: text("contact_info", { mode: "json" }).$type<{
    primaryContact: string;
    email: string;
    phone?: string;
    address?: string;
  }>(),
  
  // Website URL for AI-powered data extraction
  websiteUrl: text("website_url"),
  
  // Organization Structure
  organizationStructure: text("organization_structure", { mode: "json" }).$type<{
    legalEntityType?: string; // LLC, Corporation, Partnership, etc.
    parentCompany?: { name: string; relationship?: string; };
    subsidiaries?: { name: string; location?: string; }[];
    departments?: { name: string; head?: string; employeeCount?: number; responsibilities?: string; }[];
    totalEmployees?: number;
    employeesByDepartment?: { department: string; count: number; }[];
  }>(),
  
  // Enhanced Key Personnel for Compliance Documentation
  keyPersonnel: text("key_personnel", { mode: "json" }).$type<{
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
  productsAndServices: text("products_and_services", { mode: "json" }).$type<{
    primaryProducts?: { name: string; description?: string; }[];
    primaryServices?: { name: string; description?: string; }[];
    customerSegments?: ('B2B' | 'B2C' | 'Government' | 'Enterprise' | 'SMB')[];
    slaCommitments?: { service: string; availability: string; responseTime?: string; }[];
    serviceAvailabilityRequirements?: string;
  }>(),
  
  // Geographic Operations
  geographicOperations: text("geographic_operations", { mode: "json" }).$type<{
    countriesOfOperation?: string[];
    officeLocations?: { address: string; type: 'headquarters' | 'regional' | 'satellite' | 'remote'; employeeCount?: number; }[];
    dataCenterLocations?: { location: string; type: 'primary' | 'disaster_recovery' | 'backup'; provider?: string; }[];
    customerRegionsServed?: string[];
    regulatoryJurisdictions?: string[];
  }>(),
  
  // Security Infrastructure
  securityInfrastructure: text("security_infrastructure", { mode: "json" }).$type<{
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
  businessContinuity: text("business_continuity", { mode: "json" }).$type<{
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
  vendorManagement: text("vendor_management", { mode: "json" }).$type<{
    criticalVendors?: { name: string; service: string; securityAssessmentStatus?: 'pending' | 'approved' | 'requires_review'; lastAssessmentDate?: string; }[];
    thirdPartyIntegrations?: { name: string; type: string; dataShared?: string[]; }[];
    vendorRiskAssessmentFrequency?: string;
  }>(),
  
  // Framework-Specific Configurations
  frameworkConfigs: text("framework_configs", { mode: "json" }).$type<{
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
  uploadedDocs: text("uploaded_docs", { mode: "json" }).$type<{
    incorporationDocs?: { filename: string; url: string; extractedData?: any; }[];
    registrationDocs?: { filename: string; url: string; extractedData?: any; }[];
    profileDocs?: { filename: string; url: string; extractedData?: any; }[];
    orgCharts?: { filename: string; url: string; extractedData?: any; }[];
    policyDocs?: { filename: string; url: string; extractedData?: any; }[];
  }>(),
  
  // AI Research Data
  aiResearchData: text("ai_research_data", { mode: "json" }).$type<{
    lastResearchDate?: string;
    sources?: { url: string; type: string; extractedAt: string; }[];
    confidence?: number;
    extractedInfo?: Record<string, any>;
  }>(),
  
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyProfileId: text("company_profile_id").references(() => companyProfiles.id).notNull(),
  createdBy: text("created_by").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  framework: text("framework").notNull(), // ISO27001, SOC2, FedRAMP-Low, FedRAMP-Moderate, FedRAMP-High, NIST-800-53
  subFramework: text("sub_framework"), // For FedRAMP levels and NIST control families
  category: text("category").notNull(), // policy, procedure, assessment, template, etc.
  documentType: text("document_type").notNull().default("text"), // text, excel, pdf, word
  content: text("content").notNull(),
  templateData: text("template_data", { mode: "json" }), // Structured data for templates
  status: text("status").notNull().default("draft"), // draft, in_progress, complete, approved, published
  version: integer("version").notNull().default(1),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  
  // File Storage Information
  fileName: text("file_name"),
  fileType: text("file_type"), // .docx, .xlsx, .pdf
  fileSize: integer("file_size"),
  downloadUrl: text("download_url"), // Cloud storage URL
  
  // Approval Workflow
  reviewedBy: text("reviewed_by").references(() => users.id),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  
  // AI Processing
  aiGenerated: integer("ai_generated", { mode: "boolean" }).notNull().default(false),
  aiModel: text("ai_model"), // gpt-5.4, claude-3, etc.
  generationPrompt: text("generation_prompt"),
  
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
});

// Document Templates table for reusable templates
export const documentTemplates = pgTable("document_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  framework: text("framework").notNull(),
  category: text("category").notNull(),
  documentType: text("document_type").notNull(), // excel, pdf, word
  templateContent: text("template_content").notNull(),
  templateVariables: text("template_variables", { mode: "json" }).$type<{
    [key: string]: {
      type: 'text' | 'number' | 'date' | 'select';
      label: string;
      required: boolean;
      options?: string[];
    };
  }>(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdBy: text("created_by").references(() => users.id).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
  // Encryption fields for SOC 2 compliance
  companyNameEncrypted: text("company_name_encrypted"),
  industryEncrypted: text("industry_encrypted"), 
  headquartersEncrypted: text("headquarters_encrypted"),
  encryptionVersion: integer("encryption_version"),
  encryptedAt: integer("encrypted_at", { mode: "timestamp" }),
});

// Multi-Factor Authentication settings
// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

// Email verification tokens table
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  email: text("email").notNull(), // New email for email change verification
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  verifiedAt: integer("verified_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

// Passkey credentials table
export const passkeyCredentials = pgTable("passkey_credentials", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  credentialId: text("credential_id").notNull().unique(),
  publicKey: text("public_key").notNull(),
  counter: integer("counter").notNull().default(0),
  deviceType: text("device_type"), // "platform" or "cross-platform"
  deviceName: text("device_name"), // User-friendly device name
  transports: text("transports", { mode: "json" }), // Array of transport methods
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
});

// Enhanced MFA settings table
export const mfaSettings = pgTable("mfa_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  mfaType: text("mfa_type").notNull(), // 'totp', 'sms', 'backup_codes'
  secretEncrypted: text("secret_encrypted"),
  phoneNumberEncrypted: text("phone_number_encrypted"),
  backupCodesEncrypted: text("backup_codes_encrypted"),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(false),
  isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
  // Google Authenticator specific fields
  authenticatorName: text("authenticator_name").default("Google Authenticator"),
  qrCodeUrl: text("qr_code_url"), // For setup process
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  failedAttempts: integer("failed_attempts").default(0),
  lockedUntil: integer("locked_until", { mode: "timestamp" }),
}, (table) => ({
  userMfaTypeUnique: unique().on(table.userId, table.mfaType),
  userIdIdx: index("idx_mfa_settings_user_id").on(table.userId),
  enabledIdx: index("idx_mfa_settings_enabled").on(table.userId, table.isEnabled),
}));

// System configuration for admin-managed settings
export const systemConfigurations = pgTable("system_configurations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  configKey: text("config_key").unique().notNull(), // 'oauth_google', 'oauth_microsoft', 'pdf_defaults'
  configType: text("config_type").notNull(), // 'oauth', 'security', 'system'
  configValueEncrypted: text("config_value_encrypted").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdBy: text("created_by").references(() => users.id).notNull(),
  updatedBy: text("updated_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => ({
  configKeyIdx: index("idx_system_config_key").on(table.configKey),
  configTypeIdx: index("idx_system_config_type").on(table.configType),
}));

// Cloud storage integrations table
export const cloudIntegrations = pgTable("cloud_integrations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  provider: text("provider").notNull(), // 'google_drive', 'onedrive', 'dropbox'
  providerUserId: text("provider_user_id").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  refreshTokenEncrypted: text("refresh_token_encrypted"),
  tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),
  scopes: text("scopes", { mode: "json" }).$type<string[]>().default([]),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  syncStatus: text("sync_status").default("pending"), // 'pending', 'syncing', 'completed', 'error'
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => ({
  userProviderUnique: unique().on(table.userId, table.provider),
  providerIdx: index("idx_cloud_integrations_provider").on(table.provider),
  userIdIdx: index("idx_cloud_integrations_user_id").on(table.userId),
  orgIdIdx: index("idx_cloud_integrations_org_id").on(table.organizationId),
}));

// Evidence Snapshots for time-point audit evidence
export const evidenceSnapshots = pgTable("evidence_snapshots", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  status: text("status").default('open').notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  lockedAt: integer("locked_at", { mode: "timestamp" }),
});

// Connector configurations (what to sync/import)
export const connectorConfigs = pgTable("connector_configs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  integrationId: text("integration_id").references(() => cloudIntegrations.id, { onDelete: 'cascade' }).notNull(),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(), // User-friendly name e.g. "Engineering Jira Tickets"
  connectorType: text("connector_type").notNull(), // 'sharepoint', 'jira', 'notion'
  
  // Scope Configuration (JSON)
  scopeConfig: text("scope_config", { mode: "json" }).$type<{
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
  syncMode: text("sync_mode").default('manual').notNull(),
  
  // Last Import State
  lastSnapshotId: text("last_snapshot_id").references(() => evidenceSnapshots.id),
  lastSyncedAt: integer("last_synced_at", { mode: "timestamp" }),
  
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => ({
  integrationIdx: index("idx_connector_configs_integration").on(table.integrationId),
  orgIdx: index("idx_connector_configs_org").on(table.organizationId),
}));

// Cloud files metadata table
export const cloudFiles = pgTable("cloud_files", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  integrationId: text("integration_id").references(() => cloudIntegrations.id, { onDelete: 'cascade' }).notNull(),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  providerFileId: text("provider_file_id").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(), // 'pdf', 'docx', 'xlsx', etc.
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  isSecurityLocked: integer("is_security_locked", { mode: "boolean" }).default(false),
  securityLevel: text("security_level").default("standard"), // 'standard', 'restricted', 'confidential'
  permissions: text("permissions", { mode: "json" }).$type<{
    canView: boolean;
    canEdit: boolean;
    canDownload: boolean;
    canShare: boolean;
  }>().default({ canView: true, canEdit: false, canDownload: false, canShare: false }),
  metadata: text("metadata", { mode: "json" }).$type<{
    createdBy?: string;
    modifiedBy?: string;
    version?: string;
    tags?: string[];
    description?: string;
  }>(),
  thumbnailUrl: text("thumbnail_url"),
  downloadUrl: text("download_url"),
  webViewUrl: text("web_view_url"),
  lastModified: integer("last_modified", { mode: "timestamp" }),
  syncedAt: integer("synced_at", { mode: "timestamp" }).defaultNow(),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),

  // Document Ingestion Fields
  snapshotId: text("snapshot_id").references(() => evidenceSnapshots.id),
  category: text("category"),
  fileHash: text("file_hash"),
  processingStatus: text("processing_status").default('pending'),
  extractedTextPath: text("extracted_text_path"), // Path to .txt file in storage
  embeddingId: text("embedding_id"), // Reference to vector DB embedding

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
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider: text("provider").notNull(), // 'google', 'microsoft', 'github'
  providerId: text("provider_id").notNull(), // External user ID
  email: text("email").notNull(),
  displayName: text("display_name"),
  profileImageUrl: text("profile_image_url"),
  accessTokenEncrypted: text("access_token_encrypted"),
  refreshTokenEncrypted: text("refresh_token_encrypted"),
  tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),
  isPrimary: integer("is_primary", { mode: "boolean" }).default(false), // Primary OAuth account
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => ({
  userProviderUnique: unique().on(table.userId, table.provider),
  providerIdUnique: unique().on(table.provider, table.providerId),
  providerIdx: index("idx_oauth_providers_provider").on(table.provider),
  userIdIdx: index("idx_oauth_providers_user_id").on(table.userId),
}));

// PDF security settings table
export const pdfSecuritySettings = pgTable("pdf_security_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fileId: text("file_id").references(() => cloudFiles.id, { onDelete: 'cascade' }).notNull(),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  createdBy: text("created_by").references(() => users.id).notNull(),
  
  // Password protection
  hasUserPassword: integer("has_user_password", { mode: "boolean" }).default(false),
  hasOwnerPassword: integer("has_owner_password", { mode: "boolean" }).default(false),
  userPasswordEncrypted: text("user_password_encrypted"),
  ownerPasswordEncrypted: text("owner_password_encrypted"),
  
  // Permissions
  allowPrinting: integer("allow_printing", { mode: "boolean" }).default(false),
  allowCopying: integer("allow_copying", { mode: "boolean" }).default(false),
  allowModifying: integer("allow_modifying", { mode: "boolean" }).default(false),
  allowAnnotations: integer("allow_annotations", { mode: "boolean" }).default(false),
  allowFormFilling: integer("allow_form_filling", { mode: "boolean" }).default(false),
  allowAssembly: integer("allow_assembly", { mode: "boolean" }).default(false),
  allowDegradedPrinting: integer("allow_degraded_printing", { mode: "boolean" }).default(false),
  
  // Encryption settings
  encryptionLevel: text("encryption_level").default("AES256"), // 'RC4_40', 'RC4_128', 'AES128', 'AES256'
  keyLength: integer("key_length").default(256),
  
  // Watermark settings
  hasWatermark: integer("has_watermark", { mode: "boolean" }).default(false),
  watermarkText: text("watermark_text"),
  watermarkOpacity: decimal("watermark_opacity").default(0.3),
  watermarkPosition: text("watermark_position").default("center"), // 'center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
  
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => ({
  fileIdUnique: unique().on(table.fileId),
  fileIdIdx: index("idx_pdf_security_file_id").on(table.fileId),
  orgIdIdx: index("idx_pdf_security_org_id").on(table.organizationId),
  encryptionIdx: index("idx_pdf_security_encryption").on(table.encryptionLevel),
}));

// Document Workspace for AI editing and collaboration
export const documentWorkspace = pgTable("document_workspace", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: text("document_id").references(() => documents.id).notNull(),
  organizationId: text("organization_id").references(() => organizations.id).notNull(),
  workspaceData: text("workspace_data", { mode: "json" }).$type<{
    editorState?: any;
    comments?: { id: string; userId: string; content: string; timestamp: string; resolved: boolean; }[];
    suggestions?: { id: string; type: string; content: string; status: 'pending' | 'accepted' | 'rejected'; }[];
    aiAssistance?: { enabled: boolean; model: string; lastUsed: string; }[];
  }>(),
  lastEditedBy: text("last_edited_by").references(() => users.id),
  lastEditedAt: integer("last_edited_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
});

export const generationJobs = pgTable("generation_jobs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyProfileId: text("company_profile_id").references(() => companyProfiles.id).notNull(),
  createdBy: text("created_by").references(() => users.id).notNull(),
  framework: text("framework").notNull(),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  progress: integer("progress").notNull().default(0),
  documentsGenerated: integer("documents_generated").notNull().default(0),
  totalDocuments: integer("total_documents").notNull().default(0),
  currentDocument: text("current_document"),
  errorMessage: text("error_message"),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
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
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  primaryFrameworks: text("primary_frameworks", { mode: "json" }).$type<string[]>(),
  specializations: text("specializations", { mode: "json" }).$type<string[]>(),
  riskFactors: text("risk_factors", { mode: "json" }).$type<string[]>(),
  complianceRequirements: text("compliance_requirements", { mode: "json" }).$type<string[]>(),
  customPrompts: text("custom_prompts", { mode: "json" }),
  modelPreferences: text("model_preferences", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

export const organizationFineTuning = pgTable("organization_fine_tuning", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull(),
  industryId: text("industry_id").notNull(),
  configId: text("config_id").notNull(),
  status: text("status").notNull().default("pending"),
  customPrompts: text("custom_prompts", { mode: "json" }),
  modelSettings: text("model_settings", { mode: "json" }),
  accuracy: decimal("accuracy"),
  requirements: text("requirements", { mode: "json" }).$type<string[]>(),
  customInstructions: text("custom_instructions"),
  priority: text("priority").default("medium"),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

export const fineTuningMetrics = pgTable("fine_tuning_metrics", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  configId: text("config_id").notNull(),
  metricType: text("metric_type").notNull(), // accuracy, performance, user_satisfaction
  value: decimal("value"),
  metadata: text("metadata", { mode: "json" }),
  measuredAt: integer("measured_at", { mode: "timestamp" }).defaultNow(),
});

export type IndustryConfiguration = typeof industryConfigurations.$inferSelect;
export type InsertIndustryConfiguration = typeof industryConfigurations.$inferInsert;
export type OrganizationFineTuning = typeof organizationFineTuning.$inferSelect;
export type InsertOrganizationFineTuning = typeof organizationFineTuning.$inferInsert;

// Compliance Gap Analysis Tables
export const gapAnalysisReports = pgTable("gap_analysis_reports", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull(),
  framework: text("framework").notNull(),
  analysisDate: integer("analysis_date", { mode: "timestamp" }).defaultNow(),
  overallScore: integer("overall_score").notNull(), // 0-100
  status: text("status").default("pending"),
  metadata: text("metadata", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

export const gapAnalysisFindings = pgTable("gap_analysis_findings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  reportId: text("report_id").notNull().references(() => gapAnalysisReports.id, { onDelete: "cascade" }),
  controlId: text("control_id").notNull(), // e.g., "A.5.1.1" for ISO 27001
  controlTitle: text("control_title").notNull(),
  currentStatus: text("current_status").notNull(),
  riskLevel: text("risk_level").notNull(),
  gapDescription: text("gap_description").notNull(),
  businessImpact: text("business_impact").notNull(),
  evidenceRequired: text("evidence_required"),
  complianceScore: integer("compliance_score").notNull(), // 0-100
  priority: integer("priority").notNull(), // 1-5
  estimatedEffort: text("estimated_effort"),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

export const remediationRecommendations = pgTable("remediation_recommendations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  findingId: text("finding_id").notNull().references(() => gapAnalysisFindings.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  implementation: text("implementation").notNull(),
  resources: text("resources", { mode: "json" }), // Links, tools, templates
  timeframe: text("timeframe").notNull(),
  cost: text("cost"),
  priority: integer("priority").notNull(),
  status: text("status").default("pending"),
  assignedTo: text("assigned_to"),
  dueDate: integer("due_date", { mode: "timestamp" }),
  completedDate: integer("completed_date", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

export const complianceMaturityAssessments = pgTable("compliance_maturity_assessments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull(),
  framework: text("framework").notNull(),
  maturityLevel: integer("maturity_level").notNull(), // 1-5 (Initial, Developing, Defined, Managed, Optimizing)
  assessmentData: text("assessment_data", { mode: "json" }).notNull(),
  recommendations: text("recommendations", { mode: "json" }),
  nextReviewDate: integer("next_review_date", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
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
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull(),
  framework: text("framework").notNull(),
  controlId: text("control_id").notNull(),
  status: text("status").default("not_started"),
  evidenceStatus: text("evidence_status").default("none"),
  notes: text("notes"),
  updatedBy: text("updated_by"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
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
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  changes: text("changes"), // Description of what changed
  changeType: text("change_type").default("minor"),
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
  status: text("status").default("draft"),
  fileSize: integer("file_size"),
  checksum: text("checksum"), // For integrity verification
});

export const insertDocumentVersionSchema = cis(documentVersions).omit({
  id: true,
  createdAt: true,
});

export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;

// Audit Logs Table for SOC 2 Compliance
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id),
  organizationId: text("organization_id").references(() => organizations.id),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  oldValues: text("old_values", { mode: "json" }),
  newValues: text("new_values", { mode: "json" }),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  riskLevel: text("risk_level").notNull().default("low"),
  additionalContext: text("additional_context", { mode: "json" }),
  timestamp: integer("timestamp", { mode: "timestamp" }).defaultNow().notNull(),
  signature: text("signature"),
  previousSignature: text("previous_signature"),
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
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  entityType: text("entity_type").notNull(), // Extended to support AI entities
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(), // Extended to support AI actions
  userId: text("user_id").notNull(),
  userEmail: text("user_email"),
  userName: text("user_name"),
  organizationId: text("organization_id"),
  oldValues: text("old_values", { mode: "json" }),
  newValues: text("new_values", { mode: "json" }),
  metadata: text("metadata", { mode: "json" }), // Additional context like IP, user agent, etc.
  timestamp: integer("timestamp", { mode: "timestamp" }).defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  sessionId: text("session_id"),
});

export const insertAuditTrailSchema = cis(auditTrail).omit({
  id: true,
  timestamp: true,
});

export type InsertAuditTrail = z.infer<typeof insertAuditTrailSchema>;
export type AuditTrail = typeof auditTrail.$inferSelect;

// Document Approvals table for approval workflow
export const documentApprovals = pgTable("document_approvals", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  versionId: text("version_id").references(() => documentVersions.id),
  requestedBy: text("requested_by").notNull(),
  approverRole: text("approver_role").notNull(),
  assignedTo: text("assigned_to"),
  status: text("status").default("pending"),
  comments: text("comments"),
  priority: text("priority").default("medium"),
  dueDate: integer("due_date", { mode: "timestamp" }),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  rejectedAt: integer("rejected_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
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
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  organizationId: text("organization_id").references(() => organizations.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  isRead: integer("is_read", { mode: "boolean" }).default(false).notNull(),
  metadata: text("metadata", { mode: "json" }).$type<{
    entityType?: string;
    entityId?: string;
    actionType?: string;
    severity?: "low" | "medium" | "high" | "critical";
  }>(),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
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
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").references(() => organizations.id).notNull(),
  policyName: text("policy_name").notNull(),
  region: text("region").notNull(), // us-east-1, eu-west-1, ap-southeast-1, etc.
  dataTypes: text("data_types", { mode: "json" }).$type<string[]>().notNull().default([]), // documents, ai_cache, audit_logs, etc.
  enforceStrict: integer("enforce_strict", { mode: "boolean" }).notNull().default(true),
  allowedRegions: text("allowed_regions", { mode: "json" }).$type<string[]>().notNull().default([]),
  blockedRegions: text("blocked_regions", { mode: "json" }).$type<string[]>().notNull().default([]),
  status: text("status").notNull().default("active"),
  validatedAt: integer("validated_at", { mode: "timestamp" }),
  createdBy: text("created_by").references(() => users.id).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => [
  index("idx_residency_org").on(table.organizationId),
  index("idx_residency_status").on(table.status),
]);

// Data Retention Policies - Configurable data lifecycle management
export const dataRetentionPolicies = pgTable("data_retention_policies", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").references(() => organizations.id).notNull(),
  policyName: text("policy_name").notNull(),
  dataType: text("data_type").notNull(), // documents, ai_responses, audit_logs, user_data, etc.
  retentionDays: integer("retention_days").notNull(), // Number of days to retain data
  deleteAfterExpiry: integer("delete_after_expiry", { mode: "boolean" }).notNull().default(true),
  archiveBeforeDelete: integer("archive_before_delete", { mode: "boolean" }).notNull().default(true),
  archiveLocation: text("archive_location"), // s3, glacier, local, etc.
  complianceFramework: text("compliance_framework"), // GDPR, HIPAA, SOC2, etc.
  status: text("status").notNull().default("active"),
  lastEnforcedAt: integer("last_enforced_at", { mode: "timestamp" }),
  createdBy: text("created_by").references(() => users.id).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => [
  index("idx_retention_org").on(table.organizationId),
  index("idx_retention_status").on(table.status),
  index("idx_retention_type").on(table.dataType),
]);

// AI Guardrails Logs - Track AI safety checks and interventions
export const aiGuardrailsLogs = pgTable("ai_guardrails_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").references(() => organizations.id),
  userId: text("user_id").references(() => users.id),
  requestId: text("request_id").notNull(), // Correlate with AI request
  guardrailType: text("guardrail_type").notNull(), // prompt_shield, pii_redaction, output_classifier, content_moderation
  action: text("action").notNull(), // allowed, blocked, redacted, flagged, human_review_required
  severity: text("severity").notNull(),

  // Input analysis
  originalPrompt: text("original_prompt"),
  sanitizedPrompt: text("sanitized_prompt"),
  promptRiskScore: decimal("prompt_risk_score"),

  // PII Detection and Redaction
  piiDetected: integer("pii_detected", { mode: "boolean" }).notNull().default(false),
  piiTypes: text("pii_types", { mode: "json" }).$type<string[]>(), // email, ssn, credit_card, phone, address, etc.
  piiRedacted: integer("pii_redacted", { mode: "boolean" }).notNull().default(false),

  // Output analysis
  originalResponse: text("original_response"),
  sanitizedResponse: text("sanitized_response"),
  responseRiskScore: decimal("response_risk_score"),

  // Content classification
  contentCategories: text("content_categories", { mode: "json" }).$type<string[]>(), // safe, policy_violation, toxic, harmful, etc.
  moderationFlags: text("moderation_flags", { mode: "json" }).$type<{
    hate: number;
    harassment: number;
    violence: number;
    sexual: number;
    selfHarm: number;
    pii: number;
  }>(),

  // Human review
  requiresHumanReview: integer("requires_human_review", { mode: "boolean" }).notNull().default(false),
  humanReviewedAt: integer("human_reviewed_at", { mode: "timestamp" }),
  humanReviewedBy: text("human_reviewed_by").references(() => users.id),
  humanReviewDecision: text("human_review_decision"),
  humanReviewNotes: text("human_review_notes"),

  // Metadata
  modelProvider: text("model_provider"), // openai, anthropic, etc.
  modelName: text("model_name"),
  processingTimeMs: integer("processing_time_ms"),
  ipAddress: text("ip_address"),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
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
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  modelProvider: text("model_provider").notNull(), // openai, anthropic, custom
  modelName: text("model_name").notNull(),
  modelVersion: text("model_version").notNull(),

  // Model Information
  description: text("description").notNull(),
  intendedUse: text("intended_use").notNull(),
  limitations: text("limitations").notNull(),
  trainingData: text("training_data"),

  // Performance Metrics
  performanceMetrics: text("performance_metrics", { mode: "json" }).$type<{
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    latencyMs?: number;
    customMetrics?: Record<string, number>;
  }>(),

  // Bias and Fairness
  biasAssessment: text("bias_assessment"),
  fairnessMetrics: text("fairness_metrics", { mode: "json" }).$type<{
    demographicParity?: number;
    equalOpportunity?: number;
    notes?: string;
  }>(),

  // Safety and Ethics
  safetyEvaluations: text("safety_evaluations"),
  ethicalConsiderations: text("ethical_considerations"),

  // Data Privacy
  privacyFeatures: text("privacy_features", { mode: "json" }).$type<string[]>(), // encryption, pii_filtering, data_minimization
  dataRetentionPolicy: text("data_retention_policy"),
  dataResidency: text("data_residency"),

  // Compliance
  complianceFrameworks: text("compliance_frameworks", { mode: "json" }).$type<string[]>(), // SOC2, GDPR, HIPAA, etc.
  certifications: text("certifications", { mode: "json" }).$type<string[]>(),

  // Contact and Support
  contactInfo: text("contact_info", { mode: "json" }).$type<{
    supportEmail?: string;
    documentation?: string;
    responsible?: string;
  }>(),

  status: text("status").notNull().default("active"),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  lastReviewedAt: integer("last_reviewed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => [
  index("idx_model_provider").on(table.modelProvider),
  index("idx_model_name").on(table.modelName),
  index("idx_model_status").on(table.status),
  unique().on(table.modelProvider, table.modelName, table.modelVersion),
]);

// AI Usage Transparency - Track and disclose AI usage to users
export const aiUsageDisclosures = pgTable("ai_usage_disclosures", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").references(() => organizations.id),
  userId: text("user_id").references(() => users.id).notNull(),
  actionType: text("action_type").notNull(), // document_generation, analysis, chatbot, risk_assessment, etc.

  // Model Information
  modelProvider: text("model_provider").notNull(),
  modelName: text("model_name").notNull(),
  modelCardId: text("model_card_id").references(() => modelCards.id),

  // Disclosure Details
  purposeDescription: text("purpose_description").notNull(),
  dataUsed: text("data_used", { mode: "json" }).$type<string[]>(), // Types of data sent to AI
  dataRetentionDays: integer("data_retention_days"),
  dataStorageRegion: text("data_storage_region"),

  // User Consent
  userConsented: integer("user_consented", { mode: "boolean" }).notNull().default(false),
  consentedAt: integer("consented_at", { mode: "timestamp" }),
  consentVersion: text("consent_version"),

  // Transparency
  aiContribution: text("ai_contribution").notNull(), // full, partial, assisted, review
  humanOversight: integer("human_oversight", { mode: "boolean" }).notNull().default(false),

  // Result Metadata
  tokensUsed: integer("tokens_used"),
  costEstimate: decimal("cost_estimate"),

  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => [
  index("idx_disclosure_org").on(table.organizationId),
  index("idx_disclosure_user").on(table.userId),
  index("idx_disclosure_action").on(table.actionType),
  index("idx_disclosure_provider").on(table.modelProvider),
  index("idx_disclosure_created").on(table.createdAt),
]);

// Contact Messages table for storing form submissions
export const contactMessages = pgTable("contact_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"), // new, read, replied, archived
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
});

export const insertContactMessageSchema = cis(contactMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

// Role definitions for RBAC
export const roles = pgTable("roles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(), // admin, standard_user, auditor
  displayName: text("display_name").notNull(),
  description: text("description"),
  permissions: text("permissions", { mode: "json" }).$type<{
    documents?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean; approve?: boolean; };
    users?: { invite?: boolean; manage?: boolean; view?: boolean; };
    organization?: { settings?: boolean; billing?: boolean; integrations?: boolean; };
    compliance?: { view?: boolean; audit?: boolean; manage?: boolean; };
    ai?: { chat?: boolean; generate?: boolean; finetune?: boolean; };
    admin?: { full?: boolean; };
  }>().notNull().default({}),
  isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false), // System roles cannot be deleted
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
});

export const insertRoleSchema = cis(roles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;

// Role assignments for users within organizations
export const roleAssignments = pgTable("role_assignments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  roleId: text("role_id").references(() => roles.id).notNull(),
  assignedBy: text("assigned_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
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
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("active"),
  framework: text("framework"), // Primary compliance framework
  targetCompletionDate: integer("target_completion_date", { mode: "timestamp" }),
  createdBy: text("created_by").references(() => users.id).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => [
  index("idx_project_org").on(table.organizationId),
]);

export const insertProjectSchema = cis(projects).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Project memberships
export const projectMemberships = pgTable("project_memberships", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: text("role").default("viewer"),
  joinedAt: integer("joined_at", { mode: "timestamp" }).defaultNow().notNull(),
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
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
  title: text("title").notNull().default("New Conversation"),
  sessionType: text("session_type").default("chat"),
  context: text("context", { mode: "json" }).$type<{
    framework?: string;
    documentId?: string;
    companyProfileId?: string;
  }>(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  lastMessageAt: integer("last_message_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => [
  index("idx_ai_session_user").on(table.userId),
  index("idx_ai_session_org").on(table.organizationId),
]);

export const insertAiSessionSchema = cis(aiSessions).omit({ id: true, createdAt: true });
export type InsertAiSession = z.infer<typeof insertAiSessionSchema>;
export type AiSession = typeof aiSessions.$inferSelect;

// AI Chat Messages within sessions
export const aiMessages = pgTable("ai_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id").references(() => aiSessions.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  metadata: text("metadata", { mode: "json" }).$type<{
    model?: string;
    tokensUsed?: number;
    toolCalls?: { name: string; input: any; output: any; }[];
    citations?: { source: string; reference: string; }[];
  }>(),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
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
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  companyProfileId: text("company_profile_id").references(() => companyProfiles.id, { onDelete: "cascade" }).notNull(),
  createdBy: text("created_by").references(() => users.id).notNull(),
  name: text("name").notNull(), // User-provided name
  status: text("status").default("extracting").notNull(),
  uploadedFileName: text("uploaded_file_name").notNull(),
  uploadedFileHash: text("uploaded_file_hash").notNull(), // SHA-256
  extractedPath: text("extracted_path"), // Local read-only path
  repositorySize: integer("repository_size"), // bytes
  fileCount: integer("file_count").default(0),
  manifestHash: text("manifest_hash"), // SHA-256 of MANIFEST.json
  // Detection results
  detectedLanguages: text("detected_languages", { mode: "json" }).$type<string[]>().default([]),
  detectedFrameworks: text("detected_frameworks", { mode: "json" }).$type<string[]>().default([]),
  detectedInfraTools: text("detected_infra_tools", { mode: "json" }).$type<string[]>().default([]), // terraform, k8s, docker
  // Analysis metadata
  analysisStartedAt: integer("analysis_started_at", { mode: "timestamp" }),
  analysisCompletedAt: integer("analysis_completed_at", { mode: "timestamp" }),
  analysisPhase: text("analysis_phase"), // current phase if in progress
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
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
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  snapshotId: text("snapshot_id").references(() => repositorySnapshots.id, { onDelete: "cascade" }).notNull(),
  relativePath: text("relative_path").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type"), // extension
  fileSize: integer("file_size"),
  fileHash: text("file_hash"), // SHA-256
  language: text("language"), // detected language
  category: text("category").default("other"),
  isSecurityRelevant: integer("is_security_relevant", { mode: "boolean" }).default(false),
  indexedAt: integer("indexed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
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
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  snapshotId: text("snapshot_id").references(() => repositorySnapshots.id, { onDelete: "cascade" }).notNull(),
  controlId: text("control_id").notNull(), // Framework control ID (e.g., 'CC6.1', 'A.9.1.1')
  framework: text("framework").notNull(), // 'SOC2', 'ISO27001', etc.
  status: text("status").notNull(),
  confidenceLevel: text("confidence_level").default("medium").notNull(),
  signalType: text("signal_type"), // 'authentication', 'encryption', 'logging', etc.
  summary: text("summary").notNull(),
  details: text("details", { mode: "json" }), // structured finding data
  evidenceReferences: text("evidence_references", { mode: "json" }).$type<{
    filePath: string;
    lineStart?: number;
    lineEnd?: number;
    snippet?: string;
  }[]>().default([]),
  recommendation: text("recommendation"),
  aiModel: text("ai_model"), // which model generated this
  generatedAt: integer("generated_at", { mode: "timestamp" }).defaultNow().notNull(),
  reviewedBy: text("reviewed_by").references(() => users.id),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  humanOverride: text("human_override", { mode: "json" }), // if human modifies AI conclusion
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
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
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  snapshotId: text("snapshot_id").references(() => repositorySnapshots.id, { onDelete: "cascade" }).notNull(),
  findingId: text("finding_id").references(() => repositoryFindings.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  priority: text("priority").default("medium").notNull(),
  status: text("status").default("open").notNull(),
  assignedToRole: text("assigned_to_role").default("user"), // RBAC role label
  dueDate: integer("due_date", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  completedBy: text("completed_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
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
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  snapshotId: text("snapshot_id").references(() => repositorySnapshots.id, { onDelete: "cascade" }).notNull(),
  frameworks: text("frameworks", { mode: "json" }).$type<string[]>().notNull(), // which frameworks to analyze
  analysisDepth: text("analysis_depth").default("security_relevant").notNull(),
  phase: text("phase"), // current phase name
  phaseStatus: text("phase_status").default("pending").notNull(),
  progress: integer("progress").default(0), // 0-100
  filesAnalyzed: integer("files_analyzed").default(0),
  findingsGenerated: integer("findings_generated").default(0),
  documentsGenerated: integer("documents_generated").default(0),
  tasksCreated: integer("tasks_created").default(0),
  llmCallsMade: integer("llm_calls_made").default(0),
  tokensUsed: integer("tokens_used").default(0),
  costEstimate: decimal("cost_estimate"), // USD
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  errorLog: text("error_log", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
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
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  snapshotId: text("snapshot_id").references(() => repositorySnapshots.id, { onDelete: "cascade" }).notNull(),
  documentId: text("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  framework: text("framework").notNull(),
  templateId: text("template_id"),
  status: text("status").default("generated").notNull(),
  generatedBy: text("generated_by").default("AI"),
  generatedAt: integer("generated_at", { mode: "timestamp" }).defaultNow().notNull(),
  approvedBy: text("approved_by").references(() => users.id),
  approvedByName: text("approved_by_name"),
  approvedByTitle: text("approved_by_title"),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  approvalNotes: text("approval_notes"),
  version: integer("version").default(1).notNull(),
  signatureBlock: text("signature_block", { mode: "json" }).$type<{
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
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
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
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  source: text("source").default("manual").notNull(),
  externalId: text("external_id"), // IdP user ID
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  jobTitle: text("job_title"),
  department: text("department"),
  managerName: text("manager_name"),
  managerEmail: text("manager_email"),
  phone: text("phone"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  lastSyncedAt: integer("last_synced_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
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

export const evidenceControlMappings = pgTable("evidence_control_mappings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  evidenceId: text("evidence_id").references(() => cloudFiles.id, { onDelete: 'cascade' }).notNull(),
  framework: text("framework").notNull(),
  controlId: text("control_id").notNull(),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  mappedBy: text("mapped_by").references(() => users.id, { onDelete: 'set null' }),
  mappingSource: text("mapping_source").notNull().default("manual"), // 'manual' or 'ai_suggested'
  confidenceScore: decimal("confidence_score"), // Useful if AI mapping
  status: text("status").notNull().default("active"), // 'active', 'rejected'
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => ({
  evidenceControlUnique: unique().on(table.evidenceId, table.framework, table.controlId),
  orgIdx: index("idx_evidence_mappings_org").on(table.organizationId),
  evidenceIdx: index("idx_evidence_mappings_evidence").on(table.evidenceId),
}));

export const evidenceControlMappingsRelations = relations(evidenceControlMappings, ({ one }) => ({
  evidence: one(cloudFiles, {
    fields: [evidenceControlMappings.evidenceId],
    references: [cloudFiles.id],
  }),
  organization: one(organizations, {
    fields: [evidenceControlMappings.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [evidenceControlMappings.mappedBy],
    references: [users.id],
  }),
}));

export const insertEvidenceControlMappingSchema = cis(evidenceControlMappings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


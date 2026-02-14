import { 
  users, 
  organizations, 
  userOrganizations, 
  companyProfiles, 
  documents, 
  generationJobs,
  gapAnalysisReports,
  gapAnalysisFindings,
  remediationRecommendations,
  complianceMaturityAssessments,
  auditLogs,
  documentVersions,
  auditTrail,
  contactMessages,
  documentApprovals,
  roles,
  roleAssignments,
  frameworkControlStatuses,
  notifications,
  userInvitations,
  userSessions,
  type User,
  type UpsertUser,
  type InsertUser,
  type Organization,
  type InsertOrganization,
  type UserOrganization,
  type InsertUserOrganization,
  type CompanyProfile, 
  type InsertCompanyProfile, 
  type Document, 
  type InsertDocument, 
  type GenerationJob, 
  type InsertGenerationJob,
  type GapAnalysisReport,
  type InsertGapAnalysisReport,
  type GapAnalysisFinding,
  type InsertGapAnalysisFinding,
  type RemediationRecommendation,
  type InsertRemediationRecommendation,
  type ComplianceMaturityAssessment,
  type InsertComplianceMaturityAssessment,
  type InsertAuditTrail,
  type AuditTrail,
  type ContactMessage,
  type InsertContactMessage,
  type DocumentApproval,
  type InsertDocumentApproval,
  type UserInvitation,
  type InsertUserInvitation,
  type UserSession,
  type InsertUserSession,
  type Role,
  type RoleAssignment,
  type FrameworkControlStatus,
  type InsertFrameworkControlStatus,
  type Notification,
  type InsertNotification,
  type AuditLog,
  type InsertAuditLog,
  type DocumentVersion,
  type InsertDocumentVersion
} from "@shared/schema";
import { db as maybeDb } from "./db";
const db = maybeDb!;
import { eq, and, desc, like, or, sql, asc, count, ilike, lt, gte, lte } from "drizzle-orm";
import { randomUUID } from "crypto";
import { computeAuditSignature } from "./utils/auditSignature";

function buildAuditSignableData(log: Pick<AuditLog, "userId" | "organizationId" | "action" | "resourceType" | "resourceId" | "timestamp">): string {
  const timestamp = log.timestamp ? new Date(log.timestamp).toISOString() : new Date(0).toISOString();
  return JSON.stringify({
    userId: log.userId,
    orgId: log.organizationId,
    action: log.action,
    resource: `${log.resourceType}:${log.resourceId}`,
    timestamp,
  });
}

// Types for filtered queries
export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  organizationId?: string;
  isActive?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Storage Layer Interface
 *
 * This file contains the complete data access layer with 192 methods across multiple domains:
 * - User Management (15 methods)
 * - Organization Management (12 methods)
 * - Company Profiles (8 methods)
 * - Documents (20 methods)
 * - Generation Jobs (8 methods)
 * - Gap Analysis (15 methods)
 * - Audit Trail (10 methods)
 * - Document Approvals (8 methods)
 * - Roles & Permissions (12 methods)
 * - Framework Control Statuses (15 methods)
 * - Notifications (12 methods)
 * - User Invitations (8 methods)
 * - User Sessions (10 methods)
 * - Contact Messages (5 methods)
 * - Utility Methods (34 methods)
 *
 * Refactoring note:
 * - repositories/userRepository.ts
 * - repositories/organizationRepository.ts
 * - repositories/documentRepository.ts
 * - repositories/auditRepository.ts
 * - etc.
 * See REFACTORING_RECOMMENDATIONS.md for details.
 */
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Extended user management operations
  getAllUsers(filters?: UserFilters, pagination?: PaginationParams): Promise<PaginatedResult<User>>;
  deleteUser(id: string): Promise<boolean>;
  suspendUser(id: string, reason?: string): Promise<User | undefined>;
  reactivateUser(id: string): Promise<User | undefined>;
  bulkUpdateUsers(ids: string[], updates: Partial<InsertUser>): Promise<number>;
  
  // User invitation operations
  createInvitation(invitation: InsertUserInvitation): Promise<UserInvitation>;
  getInvitation(id: string): Promise<UserInvitation | undefined>;
  getInvitationByToken(token: string): Promise<UserInvitation | undefined>;
  getInvitationsByOrganization(organizationId: string): Promise<UserInvitation[]>;
  getPendingInvitations(): Promise<UserInvitation[]>;
  updateInvitation(id: string, updates: Partial<InsertUserInvitation>): Promise<UserInvitation | undefined>;
  revokeInvitation(id: string): Promise<boolean>;
  acceptInvitation(token: string, userId: string): Promise<UserInvitation | undefined>;
  
  // User session operations
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  getUserSessions(userId: string): Promise<UserSession[]>;
  getActiveUserSessions(userId: string): Promise<UserSession[]>;
  terminateSession(sessionId: string): Promise<boolean>;
  terminateAllUserSessions(userId: string): Promise<number>;
  updateSessionActivity(sessionId: string): Promise<UserSession | undefined>;
  cleanupExpiredSessions(): Promise<number>;
  
  // Organization operations
  getOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, org: Partial<InsertOrganization>): Promise<Organization | undefined>;
  
  // User-Organization operations
  getUserOrganizations(userId: string): Promise<UserOrganization[]>;
  getOrganizationUsers(organizationId: string): Promise<UserOrganization[]>;
  addUserToOrganization(membership: InsertUserOrganization): Promise<UserOrganization>;
  updateUserOrganizationRole(userId: string, organizationId: string, role: string): Promise<UserOrganization | undefined>;
  removeUserFromOrganization(userId: string, organizationId: string): Promise<boolean>;

  // Company Profile methods
  getCompanyProfile(id: string): Promise<CompanyProfile | undefined>;
  getCompanyProfiles(organizationId?: string): Promise<CompanyProfile[]>;
  createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile>;
  updateCompanyProfile(id: string, profile: Partial<InsertCompanyProfile>): Promise<CompanyProfile | undefined>;
  
  // Document methods
  getDocument(id: string): Promise<Document | undefined>;
  getDocuments(organizationId?: string): Promise<Document[]>;
  getDocumentsByCompanyProfile(companyProfileId: string): Promise<Document[]>;
  getDocumentsByFramework(framework: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;
  
  // Generation Job methods
  getGenerationJob(id: string): Promise<GenerationJob | undefined>;
  getGenerationJobs(organizationId?: string): Promise<GenerationJob[]>;
  getGenerationJobsByCompanyProfile(companyProfileId: string): Promise<GenerationJob[]>;
  createGenerationJob(job: InsertGenerationJob): Promise<GenerationJob>;
  updateGenerationJob(id: string, job: Partial<InsertGenerationJob>): Promise<GenerationJob | undefined>;

  // Gap analysis methods
  createGapAnalysisReport(report: InsertGapAnalysisReport): Promise<GapAnalysisReport>;
  getGapAnalysisReports(organizationId: string): Promise<GapAnalysisReport[]>;
  getGapAnalysisReport(id: string): Promise<GapAnalysisReport | undefined>;
  updateGapAnalysisReport(id: string, updates: Partial<GapAnalysisReport>): Promise<GapAnalysisReport>;
  createGapAnalysisFinding(finding: InsertGapAnalysisFinding): Promise<GapAnalysisFinding>;
  getGapAnalysisFindings(reportId: string): Promise<GapAnalysisFinding[]>;
  getGapAnalysisFinding(id: string): Promise<GapAnalysisFinding | undefined>;
  createRemediationRecommendation(recommendation: InsertRemediationRecommendation): Promise<RemediationRecommendation>;
  getRemediationRecommendations(findingId: string): Promise<RemediationRecommendation[]>;
  getRemediationRecommendation(id: string): Promise<RemediationRecommendation | undefined>;
  updateRemediationRecommendation(id: string, updates: Partial<RemediationRecommendation>): Promise<RemediationRecommendation>;
  createComplianceMaturityAssessment(assessment: InsertComplianceMaturityAssessment): Promise<ComplianceMaturityAssessment>;
  getComplianceMaturityAssessment(
    organizationId: string,
    framework: ComplianceMaturityAssessment["framework"]
  ): Promise<ComplianceMaturityAssessment | undefined>;

  // Gap analysis methods
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;

  // Document approvals
  getDocumentApprovals(status?: string): Promise<DocumentApproval[]>;
  getDocumentApproval(id: string): Promise<DocumentApproval | undefined>;
  createDocumentApproval(approval: InsertDocumentApproval): Promise<DocumentApproval>;
  updateDocumentApproval(id: string, updates: Partial<InsertDocumentApproval>): Promise<DocumentApproval | undefined>;

  // Role-based access control
  getUserRoleAssignments(userId: string): Promise<Array<RoleAssignment & { role: Role | null }>>;
  
  // Framework Control Status methods
  getFrameworkControlStatuses(organizationId: string, framework: string): Promise<FrameworkControlStatus[]>;
  updateFrameworkControlStatus(organizationId: string, framework: string, controlId: string, updates: Partial<InsertFrameworkControlStatus>): Promise<FrameworkControlStatus>;
  
  // Notification methods
  getNotifications(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string, userId: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<number>;
  deleteNotification(id: string, userId: string): Promise<boolean>;

  // Versioning operations
  getDocumentVersions(documentId: string): Promise<DocumentVersion[]>;
  getDocumentVersion(documentId: string, versionNumber: number): Promise<DocumentVersion | undefined>;
  createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion>;
  deleteDocumentVersion(documentId: string, versionNumber: number): Promise<boolean>;

  // Audit operations
  createAuditEntry(entry: InsertAuditLog): Promise<AuditLog>;
  getLatestAuditSignature(): Promise<string | null>;
  getAuditLogById(id: string, organizationId: string): Promise<AuditLog | null>;
  getAuditLogsByDateRange(startDate: Date, endDate: Date, organizationId?: string): Promise<AuditLog[]>;
  verifyAuditChain(limit: number): Promise<{ valid: boolean; failedId?: string; count: number }>;
  getAuditLogsDetailed(
    organizationId: string,
    query: {
      page?: number;
      limit?: number;
      entityType?: string;
      action?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<{ data: AuditLog[]; total: number }>;
  getAuditStats(organizationId: string): Promise<{
    totalEvents: number;
    highRiskEvents: number;
    actions: Record<string, number>;
    entities: Record<string, number>;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private organizations: Map<string, Organization>;
  private userOrganizations: Map<string, UserOrganization>;
  private companyProfiles: Map<string, CompanyProfile>;
  private documents: Map<string, Document>;
  private generationJobs: Map<string, GenerationJob>;
  private frameworkControlStatusesStore: Map<string, FrameworkControlStatus>;

  constructor() {
    this.users = new Map();
    this.organizations = new Map();
    this.userOrganizations = new Map();
    this.companyProfiles = new Map();
    this.documents = new Map();
    this.generationJobs = new Map();
    this.frameworkControlStatusesStore = new Map();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(user: InsertUser, idOverride?: string): Promise<User> {
    const id = idOverride ?? randomUUID();
    const now = new Date();
    const newUser: User = {
      ...user,
      id,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      profileImageUrl: user.profileImageUrl || null,
      role: user.role || "user",
      isActive: user.isActive ?? true,
      lastLoginAt: user.lastLoginAt || null,
      passwordHash: user.passwordHash ?? null,
      emailVerified: user.emailVerified ?? null,
      phoneNumber: user.phoneNumber ?? null,
      phoneVerified: user.phoneVerified ?? null,
      twoFactorEnabled: user.twoFactorEnabled ?? false,
      accountStatus: user.accountStatus ?? "pending_verification",
      failedLoginAttempts: user.failedLoginAttempts ?? 0,
      accountLockedUntil: user.accountLockedUntil ?? null,
      passkeyEnabled: user.passkeyEnabled ?? false,
      profilePreferences: user.profilePreferences ?? null,
      notificationSettings: user.notificationSettings ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;

    const updated: User = {
      ...existing,
      ...user,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const id = user.id ?? randomUUID();
    const existing = this.users.get(id);
    if (existing) {
      const { id: _userId, ...updateData } = user;
      const updated = await this.updateUser(id, updateData);
      if (!updated) {
        throw new Error("Failed to update user");
      }
      return updated;
    } else {
      const { id: _userId, ...insertUser } = user;
      const newUser = await this.createUser(insertUser, id);
      this.users.set(id, newUser);
      return newUser;
    }
  }

  // Organization operations
  async getOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    return Array.from(this.organizations.values()).find(org => org.slug === slug);
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const id = randomUUID();
    const now = new Date();
    const newOrg: Organization = {
      ...org,
      id,
      isActive: org.isActive ?? true,
      description: org.description || null,
      logo: org.logo || null,
      website: org.website || null,
      contactEmail: org.contactEmail || null,
      createdAt: now,
      updatedAt: now,
    };
    this.organizations.set(id, newOrg);
    return newOrg;
  }

  async updateOrganization(id: string, org: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const existing = this.organizations.get(id);
    if (!existing) return undefined;

    const updated: Organization = {
      ...existing,
      ...org,
      updatedAt: new Date(),
    };
    this.organizations.set(id, updated);
    return updated;
  }

  // User-Organization operations
  async getUserOrganizations(userId: string): Promise<UserOrganization[]> {
    return Array.from(this.userOrganizations.values()).filter(uo => uo.userId === userId);
  }

  async getOrganizationUsers(organizationId: string): Promise<UserOrganization[]> {
    return Array.from(this.userOrganizations.values()).filter(uo => uo.organizationId === organizationId);
  }

  async addUserToOrganization(membership: InsertUserOrganization): Promise<UserOrganization> {
    const id = randomUUID();
    const now = new Date();
    const newMembership: UserOrganization = {
      ...membership,
      id,
      role: membership.role || "member",
      joinedAt: now,
    };
    this.userOrganizations.set(id, newMembership);
    return newMembership;
  }

  async updateUserOrganizationRole(userId: string, organizationId: string, role: string): Promise<UserOrganization | undefined> {
    const membership = Array.from(this.userOrganizations.values())
      .find(uo => uo.userId === userId && uo.organizationId === organizationId);
    
    if (!membership) return undefined;

    const updated: UserOrganization = {
      ...membership,
      role,
    };
    this.userOrganizations.set(membership.id, updated);
    return updated;
  }

  async removeUserFromOrganization(userId: string, organizationId: string): Promise<boolean> {
    const membership = Array.from(this.userOrganizations.entries())
      .find(([, uo]) => uo.userId === userId && uo.organizationId === organizationId);
    
    if (!membership) return false;

    this.userOrganizations.delete(membership[0]);
    return true;
  }

  // Company Profile methods
  async getCompanyProfile(id: string): Promise<CompanyProfile | undefined> {
    return this.companyProfiles.get(id);
  }

  async getCompanyProfiles(): Promise<CompanyProfile[]> {
    return Array.from(this.companyProfiles.values());
  }

  async createCompanyProfile(insertProfile: InsertCompanyProfile): Promise<CompanyProfile> {
    const id = randomUUID();
    const now = new Date();
    const profile: CompanyProfile = {
      ...insertProfile,
      id,
      cloudInfrastructure: Array.isArray(insertProfile.cloudInfrastructure) ? insertProfile.cloudInfrastructure : [],
      complianceFrameworks: insertProfile.complianceFrameworks ?? [],
      contactInfo: insertProfile.contactInfo ?? null,
      organizationStructure: insertProfile.organizationStructure ?? null,
      geographicOperations: insertProfile.geographicOperations ?? null,
      productsAndServices: insertProfile.productsAndServices ?? null,
      securityInfrastructure: insertProfile.securityInfrastructure ?? null,
      businessContinuity: insertProfile.businessContinuity ?? null,
      vendorManagement: insertProfile.vendorManagement ?? null,
      aiResearchData: insertProfile.aiResearchData ?? null,
      isActive: insertProfile.isActive ?? true,
      keyPersonnel: insertProfile.keyPersonnel ?? null,
      frameworkConfigs: insertProfile.frameworkConfigs ?? null,
      uploadedDocs: insertProfile.uploadedDocs ?? null,
      websiteUrl: insertProfile.websiteUrl ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.companyProfiles.set(id, profile);
    return profile;
  }

  async updateCompanyProfile(id: string, updateData: Partial<InsertCompanyProfile>): Promise<CompanyProfile | undefined> {
    const existing = this.companyProfiles.get(id);
    if (!existing) return undefined;

    const updated: CompanyProfile = {
      ...existing,
      ...updateData,
      cloudInfrastructure: Array.isArray(updateData.cloudInfrastructure) ? updateData.cloudInfrastructure : existing.cloudInfrastructure,
      complianceFrameworks: updateData.complianceFrameworks ?? existing.complianceFrameworks,
      updatedAt: new Date(),
    };
    this.companyProfiles.set(id, updated);
    return updated;
  }

  // Document methods
  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocuments(organizationId?: string): Promise<Document[]> {
    const docs = Array.from(this.documents.values());
    if (organizationId) {
      // Note: In MemStorage, documents don't have organizationId directly, 
      // but they are linked to companyProfileId which has organizationId.
      // For simplicity in MemStorage, we'll return all if not filtering by profile.
    }
    return docs.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getDocumentsByCompanyProfile(companyProfileId: string): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.companyProfileId === companyProfileId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getDocumentsByFramework(framework: string): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.framework === framework)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const now = new Date();
    const document: Document = {
      ...insertDocument,
      id,
      createdAt: now,
      updatedAt: now,
      description: insertDocument.description || null,
      status: insertDocument.status || "draft",
      version: insertDocument.version || 1,
      subFramework: insertDocument.subFramework || null,
      documentType: insertDocument.documentType || "text",
      templateData: insertDocument.templateData || null,
      tags: Array.isArray(insertDocument.tags) ? insertDocument.tags : [],
      fileName: insertDocument.fileName || null,
      fileType: insertDocument.fileType || null,
      fileSize: insertDocument.fileSize || null,
      downloadUrl: insertDocument.downloadUrl || null,
      reviewedBy: insertDocument.reviewedBy || null,
      reviewedAt: insertDocument.reviewedAt || null,
      approvedBy: insertDocument.approvedBy || null,
      approvedAt: insertDocument.approvedAt || null,
      aiGenerated: insertDocument.aiGenerated || false,
      aiModel: insertDocument.aiModel || null,
      generationPrompt: insertDocument.generationPrompt || null,
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: string, updateData: Partial<InsertDocument>): Promise<Document | undefined> {
    const existing = this.documents.get(id);
    if (!existing) return undefined;

    const updated: Document = {
      ...existing,
      ...updateData,
      tags: Array.isArray(updateData.tags) ? updateData.tags : existing.tags,
      updatedAt: new Date(),
    };
    this.documents.set(id, updated);
    return updated;
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Generation Job methods
  async getGenerationJob(id: string): Promise<GenerationJob | undefined> {
    return this.generationJobs.get(id);
  }

  async getGenerationJobs(): Promise<GenerationJob[]> {
    return Array.from(this.generationJobs.values());
  }

  async getGenerationJobsByCompanyProfile(companyProfileId: string): Promise<GenerationJob[]> {
    return Array.from(this.generationJobs.values())
      .filter(job => job.companyProfileId === companyProfileId);
  }

  async createGenerationJob(insertJob: InsertGenerationJob): Promise<GenerationJob> {
    const id = randomUUID();
    const now = new Date();
    const job: GenerationJob = {
      ...insertJob,
      id,
      status: insertJob.status || "pending",
      progress: insertJob.progress || 0,
      documentsGenerated: insertJob.documentsGenerated || 0,
      totalDocuments: insertJob.totalDocuments || 0,
      currentDocument: insertJob.currentDocument ?? null,
      errorMessage: insertJob.errorMessage || null,
      completedAt: insertJob.completedAt || null,
      createdAt: now,
      updatedAt: now,
    };
    this.generationJobs.set(id, job);
    return job;
  }

  async updateGenerationJob(id: string, updateData: Partial<InsertGenerationJob>): Promise<GenerationJob | undefined> {
    const existing = this.generationJobs.get(id);
    if (!existing) return undefined;

    const updated: GenerationJob = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.generationJobs.set(id, updated);
    return updated;
  }

  // Gap Analysis methods
  async createGapAnalysisReport(report: InsertGapAnalysisReport): Promise<GapAnalysisReport> {
    const id = randomUUID();
    const newReport: GapAnalysisReport = {
      ...report,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: report.metadata ?? null,
      status: report.status ?? "pending",
      analysisDate: report.analysisDate ?? new Date(),
    };
    this.gapAnalysisReports.set(id, newReport);
    return newReport;
  }

  async getGapAnalysisReports(organizationId: string): Promise<GapAnalysisReport[]> {
    return Array.from(this.gapAnalysisReports.values())
      .filter(report => report.organizationId === organizationId)
      .sort((a, b) =>
        (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0)
      );
  }

  async getGapAnalysisReport(id: string): Promise<GapAnalysisReport | undefined> {
    return this.gapAnalysisReports.get(id);
  }

  async updateGapAnalysisReport(id: string, updates: Partial<GapAnalysisReport>): Promise<GapAnalysisReport> {
    const existing = this.gapAnalysisReports.get(id);
    if (!existing) throw new Error('Report not found');
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.gapAnalysisReports.set(id, updated);
    return updated;
  }

  async createGapAnalysisFinding(finding: InsertGapAnalysisFinding): Promise<GapAnalysisFinding> {
    const id = randomUUID();
    const newFinding: GapAnalysisFinding = {
      ...finding,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      evidenceRequired: finding.evidenceRequired ?? null,
      estimatedEffort: finding.estimatedEffort ?? null,
    };
    this.gapAnalysisFindings.set(id, newFinding);
    return newFinding;
  }

  async getGapAnalysisFindings(reportId: string): Promise<GapAnalysisFinding[]> {
    return Array.from(this.gapAnalysisFindings.values())
      .filter(finding => finding.reportId === reportId)
      .sort((a, b) => b.priority - a.priority);
  }

  async getGapAnalysisFinding(id: string): Promise<GapAnalysisFinding | undefined> {
    return this.gapAnalysisFindings.get(id);
  }

  async createRemediationRecommendation(recommendation: InsertRemediationRecommendation): Promise<RemediationRecommendation> {
    const id = randomUUID();
    const newRecommendation: RemediationRecommendation = {
      ...recommendation,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      cost: recommendation.cost ?? null,
      status: recommendation.status ?? "pending",
      assignedTo: recommendation.assignedTo ?? null,
      dueDate: recommendation.dueDate ?? null,
      completedDate: recommendation.completedDate ?? null,
      resources: recommendation.resources ?? null,
    };
    this.remediationRecommendations.set(id, newRecommendation);
    return newRecommendation;
  }

  async getRemediationRecommendations(findingId: string): Promise<RemediationRecommendation[]> {
    return Array.from(this.remediationRecommendations.values())
      .filter(rec => rec.findingId === findingId)
      .sort((a, b) => b.priority - a.priority);
  }

  async getRemediationRecommendation(id: string): Promise<RemediationRecommendation | undefined> {
    return this.remediationRecommendations.get(id);
  }

  async updateRemediationRecommendation(id: string, updates: Partial<RemediationRecommendation>): Promise<RemediationRecommendation> {
    const existing = this.remediationRecommendations.get(id);
    if (!existing) throw new Error('Recommendation not found');
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.remediationRecommendations.set(id, updated);
    return updated;
  }

  async createComplianceMaturityAssessment(assessment: InsertComplianceMaturityAssessment): Promise<ComplianceMaturityAssessment> {
    const id = randomUUID();
    const newAssessment: ComplianceMaturityAssessment = {
      ...assessment,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      recommendations: assessment.recommendations ?? null,
      nextReviewDate: assessment.nextReviewDate ?? null,
    };
    this.complianceMaturityAssessments.set(id, newAssessment);
    return newAssessment;
  }

  async getComplianceMaturityAssessment(
    organizationId: string,
    framework: ComplianceMaturityAssessment["framework"]
  ): Promise<ComplianceMaturityAssessment | undefined> {
    return Array.from(this.complianceMaturityAssessments.values())
      .filter(assessment =>
        assessment.organizationId === organizationId &&
        assessment.framework === framework
      )
      .sort((a, b) =>
        (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0)
      )[0];
  }

  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const id = randomUUID();
    const newMessage: ContactMessage = {
      ...message,
      id,
      status: message.status ?? "new",
      createdAt: new Date(),
    };
    this.contactMessagesStore.set(id, newMessage);
    return newMessage;
  }

  // Document Approvals methods
  async getDocumentApprovals(status?: string): Promise<DocumentApproval[]> {
    const approvals = Array.from(this.documentApprovalsStore.values());
    if (status && status !== "all") {
      return approvals.filter(a => a.status === status);
    }
    return approvals.sort((a, b) => 
      (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
    );
  }

  async getDocumentApproval(id: string): Promise<DocumentApproval | undefined> {
    return this.documentApprovalsStore.get(id);
  }

  async createDocumentApproval(approval: InsertDocumentApproval): Promise<DocumentApproval> {
    const id = randomUUID();
    const now = new Date();
    const newApproval: DocumentApproval = {
      id,
      documentId: approval.documentId,
      versionId: approval.versionId ?? null,
      requestedBy: approval.requestedBy,
      approverRole: approval.approverRole,
      assignedTo: approval.assignedTo ?? null,
      status: (approval.status ?? "pending") as DocumentApproval['status'],
      comments: approval.comments ?? null,
      priority: (approval.priority ?? "medium") as DocumentApproval['priority'],
      dueDate: approval.dueDate ?? null,
      approvedAt: approval.approvedAt ?? null,
      rejectedAt: approval.rejectedAt ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.documentApprovalsStore.set(id, newApproval);
    return newApproval;
  }

  async updateDocumentApproval(id: string, updates: Partial<InsertDocumentApproval>): Promise<DocumentApproval | undefined> {
    const existing = this.documentApprovalsStore.get(id);
    if (!existing) return undefined;

    const updated: DocumentApproval = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.documentApprovalsStore.set(id, updated);
    return updated;
  }

  // Extended user management operations
  async getAllUsers(filters?: UserFilters, pagination?: PaginationParams): Promise<PaginatedResult<User>> {
    let filteredUsers = Array.from(this.users.values());

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(u =>
        u.email.toLowerCase().includes(search) ||
        u.firstName?.toLowerCase().includes(search) ||
        u.lastName?.toLowerCase().includes(search)
      );
    }
    if (filters?.role) {
      filteredUsers = filteredUsers.filter(u => u.role === filters.role);
    }
    if (filters?.isActive !== undefined) {
      filteredUsers = filteredUsers.filter(u => u.isActive === filters.isActive);
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const total = filteredUsers.length;
    const start = (page - 1) * limit;
    const data = filteredUsers.slice(start, start + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async suspendUser(id: string, _reason?: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, isActive: false, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async reactivateUser(id: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, isActive: true, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async bulkUpdateUsers(ids: string[], updates: Partial<InsertUser>): Promise<number> {
    let count = 0;
    for (const id of ids) {
      const user = this.users.get(id);
      if (user) {
        this.users.set(id, { ...user, ...updates, updatedAt: new Date() });
        count++;
      }
    }
    return count;
  }

  // User invitation operations
  async createInvitation(invitation: InsertUserInvitation): Promise<UserInvitation> {
    const newInvitation: UserInvitation = {
      id: randomUUID(),
      ...invitation,
      role: invitation.role ?? "user",
      organizationId: invitation.organizationId ?? null,
      organizationRole: invitation.organizationRole ?? "member",
      status: (invitation.status ?? "pending") as UserInvitation['status'],
      acceptedAt: null,
      createdAt: new Date(),
    };
    this.userInvitationsStore.set(newInvitation.id, newInvitation);
    return newInvitation;
  }

  async getInvitation(id: string): Promise<UserInvitation | undefined> {
    return this.userInvitationsStore.get(id);
  }

  async getInvitationByToken(token: string): Promise<UserInvitation | undefined> {
    return Array.from(this.userInvitationsStore.values()).find(inv => inv.token === token);
  }

  async getInvitationsByOrganization(organizationId: string): Promise<UserInvitation[]> {
    return Array.from(this.userInvitationsStore.values())
      .filter(inv => inv.organizationId === organizationId);
  }

  async getPendingInvitations(): Promise<UserInvitation[]> {
    return Array.from(this.userInvitationsStore.values())
      .filter(inv => inv.status === 'pending');
  }

  async updateInvitation(id: string, updates: Partial<InsertUserInvitation>): Promise<UserInvitation | undefined> {
    const existing = this.userInvitationsStore.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.userInvitationsStore.set(id, updated);
    return updated;
  }

  async revokeInvitation(id: string): Promise<boolean> {
    const invitation = this.userInvitationsStore.get(id);
    if (!invitation) return false;
    this.userInvitationsStore.set(id, { ...invitation, status: 'revoked' });
    return true;
  }

  async acceptInvitation(token: string, userId: string): Promise<UserInvitation | undefined> {
    const invitation = await this.getInvitationByToken(token);
    if (!invitation) return undefined;
    const updated = {
      ...invitation,
      status: 'accepted' as const,
      acceptedAt: new Date(),
      acceptedBy: userId
    };
    this.userInvitationsStore.set(invitation.id, updated);
    return updated;
  }

  // User session operations
  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const newSession: UserSession = {
      id: randomUUID(),
      userId: session.userId,
      sessionToken: session.sessionToken,
      ipAddress: session.ipAddress ?? null,
      userAgent: session.userAgent ?? null,
      deviceInfo: session.deviceInfo ?? null,
      location: session.location ?? null,
      isActive: session.isActive ?? true,
      expiresAt: session.expiresAt,
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };
    this.userSessionsStore.set(newSession.id, newSession);
    return newSession;
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    return Array.from(this.userSessionsStore.values())
      .filter(session => session.userId === userId);
  }

  async getActiveUserSessions(userId: string): Promise<UserSession[]> {
    const now = new Date();
    return Array.from(this.userSessionsStore.values())
      .filter(session =>
        session.userId === userId &&
        (!session.expiresAt || session.expiresAt > now)
      );
  }

  async terminateSession(sessionId: string): Promise<boolean> {
    return this.userSessionsStore.delete(sessionId);
  }

  async terminateAllUserSessions(userId: string): Promise<number> {
    const sessions = await this.getUserSessions(userId);
    sessions.forEach(session => this.userSessionsStore.delete(session.id));
    return sessions.length;
  }

  async updateSessionActivity(sessionId: string): Promise<UserSession | undefined> {
    const session = this.userSessionsStore.get(sessionId);
    if (!session) return undefined;
    const updated = { ...session, lastActivityAt: new Date() };
    this.userSessionsStore.set(sessionId, updated);
    return updated;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    let count = 0;
    for (const [id, session] of this.userSessionsStore.entries()) {
      if (session.expiresAt && session.expiresAt < now) {
        this.userSessionsStore.delete(id);
        count++;
      }
    }
    return count;
  }

  // Role-based access control
  async getUserRoleAssignments(userId: string): Promise<Array<RoleAssignment & { role: Role | null }>> {
    // MemStorage stub - returns empty array as there's no role storage in memory
    return [];
  }

  // Framework Control Status methods
  async getFrameworkControlStatuses(organizationId: string, framework: string): Promise<FrameworkControlStatus[]> {
    return Array.from(this.frameworkControlStatusesStore.values())
      .filter(s => s.organizationId === organizationId && s.framework === framework);
  }

  async updateFrameworkControlStatus(
    organizationId: string, 
    framework: string, 
    controlId: string, 
    updates: Partial<InsertFrameworkControlStatus>
  ): Promise<FrameworkControlStatus> {
    const key = `${organizationId}-${framework}-${controlId}`;
    const existing = this.frameworkControlStatusesStore.get(key);
    const now = new Date();
    
    // Filter out undefined values to prevent overwriting existing data with undefined
    const filteredUpdates: Partial<FrameworkControlStatus> = {};
    if (updates.status !== undefined) filteredUpdates.status = updates.status;
    if (updates.evidenceStatus !== undefined) filteredUpdates.evidenceStatus = updates.evidenceStatus;
    if (updates.notes !== undefined) filteredUpdates.notes = updates.notes;
    if (updates.updatedBy !== undefined) filteredUpdates.updatedBy = updates.updatedBy;
    
    if (existing) {
      const updated: FrameworkControlStatus = { ...existing, ...filteredUpdates, updatedAt: now };
      this.frameworkControlStatusesStore.set(key, updated);
      return updated;
    }
    
    const newStatus: FrameworkControlStatus = {
      id: randomUUID(),
      organizationId,
      framework: framework as FrameworkControlStatus["framework"],
      controlId,
      status: updates.status ?? "not_started",
      evidenceStatus: updates.evidenceStatus ?? "none",
      notes: updates.notes ?? null,
      updatedBy: updates.updatedBy ?? null,
      updatedAt: now,
    };
    this.frameworkControlStatusesStore.set(key, newStatus);
    return newStatus;
  }

  // Notification methods
  private notificationsStore = new Map<string, Notification>();
  
  async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    return Array.from(this.notificationsStore.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  
  async getUnreadNotificationCount(userId: string): Promise<number> {
    return Array.from(this.notificationsStore.values())
      .filter(n => n.userId === userId && !n.isRead).length;
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const newNotification: Notification = {
      ...notification,
      id,
      link: notification.link ?? null,
      metadata: notification.metadata ?? null,
      organizationId: notification.organizationId ?? null,
      isRead: notification.isRead ?? false,
      createdAt: new Date(),
    };
    this.notificationsStore.set(id, newNotification);
    return newNotification;
  }
  
  async markNotificationAsRead(id: string, userId: string): Promise<Notification | undefined> {
    const notification = this.notificationsStore.get(id);
    if (!notification || notification.userId !== userId) return undefined;
    const updated = { ...notification, isRead: true };
    this.notificationsStore.set(id, updated);
    return updated;
  }
  
  async markAllNotificationsAsRead(userId: string): Promise<number> {
    let count = 0;
    for (const [id, notification] of this.notificationsStore) {
      if (notification.userId === userId && !notification.isRead) {
        this.notificationsStore.set(id, { ...notification, isRead: true });
        count++;
      }
    }
    return count;
  }
  
  async deleteNotification(id: string, userId: string): Promise<boolean> {
    const notification = this.notificationsStore.get(id);
    if (!notification || notification.userId !== userId) return false;
    return this.notificationsStore.delete(id);
  }

  // Private storage
  private gapAnalysisReports = new Map<string, GapAnalysisReport>();
  private gapAnalysisFindings = new Map<string, GapAnalysisFinding>();
  private remediationRecommendations = new Map<string, RemediationRecommendation>();
  private complianceMaturityAssessments = new Map<string, ComplianceMaturityAssessment>();
  private auditEntries = new Map<string, AuditTrail>();
  private contactMessagesStore = new Map<string, ContactMessage>();
  private documentApprovalsStore = new Map<string, DocumentApproval>();
  private userInvitationsStore = new Map<string, UserInvitation>();
  private userSessionsStore = new Map<string, UserSession>();
  private documentVersionsStore = new Map<string, DocumentVersion>();
  private auditLogsStore = new Map<string, AuditLog>();

  // Versioning operations
  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    return Array.from(this.documentVersionsStore.values())
      .filter(v => v.documentId === documentId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  async getDocumentVersion(documentId: string, versionNumber: number): Promise<DocumentVersion | undefined> {
    return Array.from(this.documentVersionsStore.values()).find(
      v => v.documentId === documentId && v.versionNumber === versionNumber
    );
  }

  async createDocumentVersion(insertVersion: InsertDocumentVersion): Promise<DocumentVersion> {
    const id = randomUUID();
    const newVersion: DocumentVersion = {
      ...insertVersion,
      id,
      changes: insertVersion.changes ?? null,
      changeType: insertVersion.changeType ?? "minor",
      createdAt: new Date(),
      status: insertVersion.status ?? "draft",
      fileSize: insertVersion.fileSize ?? null,
      checksum: insertVersion.checksum ?? null,
    };
    this.documentVersionsStore.set(id, newVersion);
    return newVersion;
  }

  async deleteDocumentVersion(documentId: string, versionNumber: number): Promise<boolean> {
    const version = await this.getDocumentVersion(documentId, versionNumber);
    if (!version) return false;
    return this.documentVersionsStore.delete(version.id);
  }

  // Audit operations
  async createAuditEntry(entry: InsertAuditLog): Promise<AuditLog> {
    const id = randomUUID();
    const timestamp = entry.timestamp || new Date();
    const previousSignature = entry.previousSignature ?? await this.getLatestAuditSignature();
    const signature = entry.signature ?? computeAuditSignature(
      buildAuditSignableData({
        userId: entry.userId ?? null,
        organizationId: entry.organizationId ?? null,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        timestamp,
      } as AuditLog),
      previousSignature
    );
    const newEntry: AuditLog = {
      ...entry,
      id,
      timestamp,
      signature,
      previousSignature,
      oldValues: entry.oldValues || null,
      newValues: entry.newValues || null,
      resourceId: entry.resourceId || null,
      userAgent: entry.userAgent || null,
      additionalContext: entry.additionalContext || null,
      userId: entry.userId || null,
      organizationId: entry.organizationId || null,
      riskLevel: entry.riskLevel || "low",
    };
    this.auditLogsStore.set(id, newEntry);
    return newEntry;
  }

  async getAuditLogById(id: string, organizationId: string): Promise<AuditLog | null> {
    const log = this.auditLogsStore.get(id);
    if (log && log.organizationId === organizationId) return log;
    return null;
  }

  async getLatestAuditSignature(): Promise<string | null> {
    const latest = Array.from(this.auditLogsStore.values())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .at(0);
    return latest?.signature ?? null;
  }

  async getAuditLogsByDateRange(startDate: Date, endDate: Date, organizationId?: string): Promise<AuditLog[]> {
    return Array.from(this.auditLogsStore.values())
      .filter(l => (!organizationId || l.organizationId === organizationId))
      .filter(l => (l.timestamp && l.timestamp >= startDate && l.timestamp <= endDate))
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  async verifyAuditChain(limit: number): Promise<{ valid: boolean; failedId?: string; count: number }> {
    const boundedLimit = Math.max(0, limit);
    const logs = Array.from(this.auditLogsStore.values())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, boundedLimit)
      .sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));

    if (logs.length === 0) {
      return { valid: true, count: 0 };
    }

    let expectedPreviousSignature = logs[0].previousSignature ?? null;
    for (const [index, log] of logs.entries()) {
      const signature = log.signature ?? null;
      if (!signature) {
        const previousSignature = log.previousSignature ?? null;
        if (previousSignature) {
          return { valid: false, failedId: log.id, count: index + 1 };
        }
        // Legacy entries may not have signatures; treat as chain reset.
        expectedPreviousSignature = null;
        continue;
      }

      if ((log.previousSignature ?? null) !== expectedPreviousSignature) {
        return { valid: false, failedId: log.id, count: index + 1 };
      }

      const expectedSignature = computeAuditSignature(
        buildAuditSignableData(log),
        expectedPreviousSignature
      );

      if (signature !== expectedSignature) {
        return { valid: false, failedId: log.id, count: index + 1 };
      }

      expectedPreviousSignature = signature;
    }

    return { valid: true, count: logs.length };
  }

  async getAuditLogsDetailed(
    organizationId: string,
    query: {
      page?: number;
      limit?: number;
      entityType?: string;
      action?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<{ data: AuditLog[]; total: number }> {
    const logs = Array.from(this.auditLogsStore.values())
      .filter(l => l.organizationId === organizationId)
      .filter(l => !query.entityType || l.resourceType === query.entityType)
      .filter(l => !query.action || l.action === query.action)
      .filter(l => !query.dateFrom || (l.timestamp && l.timestamp >= query.dateFrom))
      .filter(l => !query.dateTo || (l.timestamp && l.timestamp <= query.dateTo))
      .sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      data: logs.slice(start, end),
      total: logs.length
    };
  }

  async getAuditStats(organizationId: string): Promise<{
    totalEvents: number;
    highRiskEvents: number;
    actions: Record<string, number>;
    entities: Record<string, number>;
  }> {
    const logs = Array.from(this.auditLogsStore.values()).filter(l => l.organizationId === organizationId);
    
    const stats = {
      totalEvents: logs.length,
      highRiskEvents: logs.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length,
      actions: {} as Record<string, number>,
      entities: {} as Record<string, number>,
    };

    for (const log of logs) {
      if (log.action) {
        stats.actions[log.action] = (stats.actions[log.action] || 0) + 1;
      }
      if (log.resourceType) {
        stats.entities[log.resourceType] = (stats.entities[log.resourceType] || 0) + 1;
      }
    }

    return stats;
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Extended user management operations
  async getAllUsers(filters?: UserFilters, pagination?: PaginationParams): Promise<PaginatedResult<User>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (filters?.search) {
      const searchConditions = [
        ilike(users.email, `%${filters.search}%`),
      ];
      if (filters.search) {
        searchConditions.push(
          ilike(users.firstName, `%${filters.search}%`),
          ilike(users.lastName, `%${filters.search}%`)
        );
      }
      conditions.push(or(...searchConditions));
    }

    if (filters?.role) {
      conditions.push(eq(users.role, filters.role as any));
    }

    if (filters?.status) {
      conditions.push(eq(users.accountStatus, filters.status as any));
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(users.isActive, filters.isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [totalResult] = await db
      .select({ count: count() })
      .from(users)
      .where(whereClause);
    
    const total = totalResult?.count || 0;

    // Build query with orderBy based on sorting parameters
    let data;
    if (pagination?.sortBy === 'createdAt') {
      data = await db.select().from(users).where(whereClause)
        .orderBy(pagination.sortOrder === 'asc' ? asc(users.createdAt) : desc(users.createdAt))
        .limit(limit).offset(offset);
    } else if (pagination?.sortBy === 'email') {
      data = await db.select().from(users).where(whereClause)
        .orderBy(pagination.sortOrder === 'asc' ? asc(users.email) : desc(users.email))
        .limit(limit).offset(offset);
    } else {
      data = await db.select().from(users).where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(limit).offset(offset);
    }
    
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async suspendUser(id: string, _reason?: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        accountStatus: 'suspended', 
        isActive: false,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async reactivateUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        accountStatus: 'active', 
        isActive: true,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async bulkUpdateUsers(ids: string[], updates: Partial<InsertUser>): Promise<number> {
    if (ids.length === 0) return 0;
    
    let updated = 0;
    for (const id of ids) {
      const result = await db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, id));
      if ((result.rowCount ?? 0) > 0) updated++;
    }
    return updated;
  }

  // User invitation operations
  async createInvitation(invitation: InsertUserInvitation): Promise<UserInvitation> {
    const [inv] = await db.insert(userInvitations).values(invitation).returning();
    return inv;
  }

  async getInvitation(id: string): Promise<UserInvitation | undefined> {
    const [inv] = await db.select().from(userInvitations).where(eq(userInvitations.id, id));
    return inv || undefined;
  }

  async getInvitationByToken(token: string): Promise<UserInvitation | undefined> {
    const [inv] = await db.select().from(userInvitations).where(eq(userInvitations.token, token));
    return inv || undefined;
  }

  async getInvitationsByOrganization(organizationId: string): Promise<UserInvitation[]> {
    return await db.select().from(userInvitations)
      .where(eq(userInvitations.organizationId, organizationId))
      .orderBy(desc(userInvitations.createdAt));
  }

  async getPendingInvitations(): Promise<UserInvitation[]> {
    return await db.select().from(userInvitations)
      .where(eq(userInvitations.status, 'pending'))
      .orderBy(desc(userInvitations.createdAt));
  }

  async updateInvitation(id: string, updates: Partial<InsertUserInvitation>): Promise<UserInvitation | undefined> {
    const [inv] = await db.update(userInvitations).set(updates).where(eq(userInvitations.id, id)).returning();
    return inv || undefined;
  }

  async revokeInvitation(id: string): Promise<boolean> {
    const result = await db.update(userInvitations)
      .set({ status: 'revoked' })
      .where(eq(userInvitations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async acceptInvitation(token: string, userId: string): Promise<UserInvitation | undefined> {
    const invitation = await this.getInvitationByToken(token);
    if (!invitation || invitation.status !== 'pending') return undefined;
    
    const now = new Date();
    if (invitation.expiresAt < now) {
      await db.update(userInvitations).set({ status: 'expired' }).where(eq(userInvitations.id, invitation.id));
      return undefined;
    }
    
    const [inv] = await db.update(userInvitations)
      .set({ status: 'accepted', acceptedAt: now })
      .where(eq(userInvitations.id, invitation.id))
      .returning();
    return inv || undefined;
  }

  // User session operations
  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const [sess] = await db.insert(userSessions).values(session).returning();
    return sess;
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    return await db.select().from(userSessions)
      .where(eq(userSessions.userId, userId))
      .orderBy(desc(userSessions.createdAt));
  }

  async getActiveUserSessions(userId: string): Promise<UserSession[]> {
    const now = new Date();
    return await db.select().from(userSessions)
      .where(and(
        eq(userSessions.userId, userId),
        eq(userSessions.isActive, true),
        gte(userSessions.expiresAt, now)
      ))
      .orderBy(desc(userSessions.lastActivityAt));
  }

  async terminateSession(sessionId: string): Promise<boolean> {
    const result = await db.update(userSessions)
      .set({ isActive: false })
      .where(eq(userSessions.id, sessionId));
    return (result.rowCount ?? 0) > 0;
  }

  async terminateAllUserSessions(userId: string): Promise<number> {
    const result = await db.update(userSessions)
      .set({ isActive: false })
      .where(eq(userSessions.userId, userId));
    return result.rowCount ?? 0;
  }

  async updateSessionActivity(sessionId: string): Promise<UserSession | undefined> {
    const [sess] = await db.update(userSessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(userSessions.id, sessionId))
      .returning();
    return sess || undefined;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    const result = await db.delete(userSessions).where(lt(userSessions.expiresAt, now));
    return result.rowCount ?? 0;
  }

  // Organization operations
  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(desc(organizations.createdAt));
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org || undefined;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug));
    return org || undefined;
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const [org] = await db
      .insert(organizations)
      .values(insertOrg)
      .returning();
    return org;
  }

  async updateOrganization(id: string, updateData: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const [org] = await db
      .update(organizations)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return org || undefined;
  }

  // User-Organization operations
  async getUserOrganizations(userId: string): Promise<UserOrganization[]> {
    return await db.select().from(userOrganizations).where(eq(userOrganizations.userId, userId));
  }

  async getOrganizationUsers(organizationId: string): Promise<UserOrganization[]> {
    return await db.select().from(userOrganizations).where(eq(userOrganizations.organizationId, organizationId));
  }

  async addUserToOrganization(membership: InsertUserOrganization): Promise<UserOrganization> {
    const [userOrg] = await db
      .insert(userOrganizations)
      .values(membership)
      .returning();
    return userOrg;
  }

  async updateUserOrganizationRole(userId: string, organizationId: string, role: string): Promise<UserOrganization | undefined> {
    const [userOrg] = await db
      .update(userOrganizations)
      .set({ role })
      .where(and(
        eq(userOrganizations.userId, userId),
        eq(userOrganizations.organizationId, organizationId)
      ))
      .returning();
    return userOrg || undefined;
  }

  async removeUserFromOrganization(userId: string, organizationId: string): Promise<boolean> {
    const result = await db
      .delete(userOrganizations)
      .where(and(
        eq(userOrganizations.userId, userId),
        eq(userOrganizations.organizationId, organizationId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  // Company Profile methods
  async getCompanyProfile(id: string): Promise<CompanyProfile | undefined> {
    const [profile] = await db.select().from(companyProfiles).where(eq(companyProfiles.id, id));
    return profile || undefined;
  }

  async getCompanyProfiles(organizationId?: string): Promise<CompanyProfile[]> {
    const DEFAULT_LIMIT = 1000; // Prevent memory exhaustion
    if (organizationId) {
      return await db
        .select()
        .from(companyProfiles)
        .where(eq(companyProfiles.organizationId, organizationId))
        .orderBy(desc(companyProfiles.updatedAt))
        .limit(DEFAULT_LIMIT);
    }
    return await db.select().from(companyProfiles).orderBy(desc(companyProfiles.updatedAt)).limit(DEFAULT_LIMIT);
  }

  async createCompanyProfile(insertProfile: InsertCompanyProfile): Promise<CompanyProfile> {
    const [profile] = await db
      .insert(companyProfiles)
      .values([insertProfile])
      .returning();
    return profile;
  }

  async updateCompanyProfile(id: string, updateData: Partial<InsertCompanyProfile>): Promise<CompanyProfile | undefined> {
    const updateValues = {
      ...updateData,
      updatedAt: new Date(),
      // Ensure array fields are properly handled
      cloudInfrastructure: Array.isArray(updateData.cloudInfrastructure) ? updateData.cloudInfrastructure : undefined,
    };
    
    // Remove undefined values to prevent database errors
    const cleanUpdateValues = Object.fromEntries(
      Object.entries(updateValues).filter(([, value]) => value !== undefined)
    );
    
    const [profile] = await db
      .update(companyProfiles)
      .set(cleanUpdateValues)
      .where(eq(companyProfiles.id, id))
      .returning();
    return profile || undefined;
  }

  // Document methods
  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async getDocuments(organizationId?: string): Promise<Document[]> {
    const DEFAULT_LIMIT = 1000; // Prevent memory exhaustion
    if (organizationId) {
      return await db
        .select()
        .from(documents)
        .innerJoin(companyProfiles, eq(documents.companyProfileId, companyProfiles.id))
        .where(eq(companyProfiles.organizationId, organizationId))
        .orderBy(desc(documents.updatedAt))
        .limit(DEFAULT_LIMIT)
        .then((results: any[]) => results.map((result: any) => result.documents));
    }
    return await db.select().from(documents).orderBy(desc(documents.updatedAt)).limit(DEFAULT_LIMIT);
  }

  async getDocumentsByCompanyProfile(companyProfileId: string): Promise<Document[]> {
    const DEFAULT_LIMIT = 500; // Prevent memory exhaustion
    return await db
      .select()
      .from(documents)
      .where(eq(documents.companyProfileId, companyProfileId))
      .orderBy(desc(documents.updatedAt))
      .limit(DEFAULT_LIMIT);
  }

  async getDocumentsByFramework(framework: string): Promise<Document[]> {
    const DEFAULT_LIMIT = 500; // Prevent memory exhaustion
    return await db
      .select()
      .from(documents)
      .where(eq(documents.framework, framework))
      .orderBy(desc(documents.updatedAt))
      .limit(DEFAULT_LIMIT);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values([insertDocument])
      .returning();
    return document;
  }

  async updateDocument(id: string, updateData: Partial<InsertDocument>): Promise<Document | undefined> {
    const updateValues = {
      ...updateData,
      updatedAt: new Date(),
      // Ensure array fields are properly handled
      tags: Array.isArray(updateData.tags) ? updateData.tags : undefined,
    };
    
    // Remove undefined values to prevent database errors
    const cleanUpdateValues = Object.fromEntries(
      Object.entries(updateValues).filter(([, value]) => value !== undefined)
    );
    
    const [document] = await db
      .update(documents)
      .set(cleanUpdateValues)
      .where(eq(documents.id, id))
      .returning();
    return document || undefined;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Generation Job methods
  async getGenerationJob(id: string): Promise<GenerationJob | undefined> {
    const [job] = await db.select().from(generationJobs).where(eq(generationJobs.id, id));
    return job || undefined;
  }

  async getGenerationJobs(organizationId?: string): Promise<GenerationJob[]> {
    const DEFAULT_LIMIT = 500; // Prevent memory exhaustion
    if (organizationId) {
      return await db
        .select()
        .from(generationJobs)
        .innerJoin(companyProfiles, eq(generationJobs.companyProfileId, companyProfiles.id))
        .where(eq(companyProfiles.organizationId, organizationId))
        .orderBy(desc(generationJobs.createdAt))
        .limit(DEFAULT_LIMIT)
        .then((results: any[]) => results.map((result: any) => result.generation_jobs));
    }
    return await db.select().from(generationJobs).orderBy(desc(generationJobs.createdAt)).limit(DEFAULT_LIMIT);
  }

  async getGenerationJobsByCompanyProfile(companyProfileId: string): Promise<GenerationJob[]> {
    const DEFAULT_LIMIT = 200; // Prevent memory exhaustion
    return await db
      .select()
      .from(generationJobs)
      .where(eq(generationJobs.companyProfileId, companyProfileId))
      .orderBy(desc(generationJobs.createdAt))
      .limit(DEFAULT_LIMIT);
  }

  async createGenerationJob(insertJob: InsertGenerationJob): Promise<GenerationJob> {
    const [job] = await db
      .insert(generationJobs)
      .values([insertJob])
      .returning();
    return job;
  }

  async updateGenerationJob(id: string, updateData: Partial<InsertGenerationJob>): Promise<GenerationJob | undefined> {
    const [job] = await db
      .update(generationJobs)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(generationJobs.id, id))
      .returning();
    return job || undefined;
  }

  // Gap analysis methods
  async createGapAnalysisReport(report: InsertGapAnalysisReport): Promise<GapAnalysisReport> {
    const [newReport] = await db
      .insert(gapAnalysisReports)
      .values(report)
      .returning();
    return newReport;
  }

  async getGapAnalysisReports(organizationId: string): Promise<GapAnalysisReport[]> {
    const DEFAULT_LIMIT = 500; // Prevent memory exhaustion
    return db
      .select()
      .from(gapAnalysisReports)
      .where(eq(gapAnalysisReports.organizationId, organizationId))
      .orderBy(desc(gapAnalysisReports.createdAt))
      .limit(DEFAULT_LIMIT);
  }

  async getGapAnalysisReport(id: string): Promise<GapAnalysisReport | undefined> {
    const [report] = await db
      .select()
      .from(gapAnalysisReports)
      .where(eq(gapAnalysisReports.id, id));
    return report || undefined;
  }

  async updateGapAnalysisReport(id: string, updates: Partial<GapAnalysisReport>): Promise<GapAnalysisReport> {
    const [updated] = await db
      .update(gapAnalysisReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(gapAnalysisReports.id, id))
      .returning();
    if (!updated) {
      throw new Error("Report not found");
    }
    return updated;
  }

  async createGapAnalysisFinding(finding: InsertGapAnalysisFinding): Promise<GapAnalysisFinding> {
    const [newFinding] = await db
      .insert(gapAnalysisFindings)
      .values(finding)
      .returning();
    return newFinding;
  }

  async getGapAnalysisFindings(reportId: string): Promise<GapAnalysisFinding[]> {
    return db
      .select()
      .from(gapAnalysisFindings)
      .where(eq(gapAnalysisFindings.reportId, reportId))
      .orderBy(desc(gapAnalysisFindings.createdAt));
  }

  async getGapAnalysisFinding(id: string): Promise<GapAnalysisFinding | undefined> {
    const [finding] = await db
      .select()
      .from(gapAnalysisFindings)
      .where(eq(gapAnalysisFindings.id, id));
    return finding || undefined;
  }

  async createRemediationRecommendation(recommendation: InsertRemediationRecommendation): Promise<RemediationRecommendation> {
    const [newRecommendation] = await db
      .insert(remediationRecommendations)
      .values(recommendation)
      .returning();
    return newRecommendation;
  }

  async getRemediationRecommendations(findingId: string): Promise<RemediationRecommendation[]> {
    return db
      .select()
      .from(remediationRecommendations)
      .where(eq(remediationRecommendations.findingId, findingId))
      .orderBy(desc(remediationRecommendations.createdAt));
  }

  async getRemediationRecommendation(id: string): Promise<RemediationRecommendation | undefined> {
    const [recommendation] = await db
      .select()
      .from(remediationRecommendations)
      .where(eq(remediationRecommendations.id, id));
    return recommendation || undefined;
  }

  async updateRemediationRecommendation(id: string, updates: Partial<RemediationRecommendation>): Promise<RemediationRecommendation> {
    const [updated] = await db
      .update(remediationRecommendations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(remediationRecommendations.id, id))
      .returning();

    if (!updated) {
      throw new Error("Recommendation not found");
    }

    return updated;
  }

  async createComplianceMaturityAssessment(assessment: InsertComplianceMaturityAssessment): Promise<ComplianceMaturityAssessment> {
    const [newAssessment] = await db
      .insert(complianceMaturityAssessments)
      .values(assessment)
      .returning();
    return newAssessment;
  }

  async getComplianceMaturityAssessment(
    organizationId: string,
    framework: ComplianceMaturityAssessment["framework"]
  ): Promise<ComplianceMaturityAssessment | undefined> {
    const [assessment] = await db
      .select()
      .from(complianceMaturityAssessments)
      .where(
        and(
          eq(complianceMaturityAssessments.organizationId, organizationId),
          eq(complianceMaturityAssessments.framework, framework)
        )
      )
      .orderBy(desc(complianceMaturityAssessments.createdAt));

    return assessment || undefined;
  }

  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [newMessage] = await db
      .insert(contactMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  // Document Approvals methods
  async getDocumentApprovals(status?: string): Promise<DocumentApproval[]> {
    if (status && status !== "all") {
      return await db
        .select()
        .from(documentApprovals)
        .where(eq(documentApprovals.status, status as any))
        .orderBy(desc(documentApprovals.createdAt));
    }
    return await db
      .select()
      .from(documentApprovals)
      .orderBy(desc(documentApprovals.createdAt));
  }

  async getDocumentApproval(id: string): Promise<DocumentApproval | undefined> {
    const [approval] = await db
      .select()
      .from(documentApprovals)
      .where(eq(documentApprovals.id, id));
    return approval || undefined;
  }

  async createDocumentApproval(approval: InsertDocumentApproval): Promise<DocumentApproval> {
    const [newApproval] = await db
      .insert(documentApprovals)
      .values(approval)
      .returning();
    return newApproval;
  }

  async updateDocumentApproval(id: string, updates: Partial<InsertDocumentApproval>): Promise<DocumentApproval | undefined> {
    const [updated] = await db
      .update(documentApprovals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documentApprovals.id, id))
      .returning();
    return updated || undefined;
  }

  // Role-based access control
  async getUserRoleAssignments(userId: string): Promise<Array<RoleAssignment & { role: Role | null }>> {
    const results = await db
      .select({
        id: roleAssignments.id,
        userId: roleAssignments.userId,
        roleId: roleAssignments.roleId,
        organizationId: roleAssignments.organizationId,
        assignedBy: roleAssignments.assignedBy,
        createdAt: roleAssignments.createdAt,
        role: roles
      })
      .from(roleAssignments)
      .leftJoin(roles, eq(roleAssignments.roleId, roles.id))
      .where(eq(roleAssignments.userId, userId));
    
    return results;
  }

  // Framework Control Status methods
  async getFrameworkControlStatuses(organizationId: string, framework: string): Promise<FrameworkControlStatus[]> {
    return await db
      .select()
      .from(frameworkControlStatuses)
      .where(
        and(
          eq(frameworkControlStatuses.organizationId, organizationId),
          eq(frameworkControlStatuses.framework, framework as FrameworkControlStatus["framework"])
        )
      );
  }

  async updateFrameworkControlStatus(
    organizationId: string, 
    framework: string, 
    controlId: string, 
    updates: Partial<InsertFrameworkControlStatus>
  ): Promise<FrameworkControlStatus> {
    const [existing] = await db
      .select()
      .from(frameworkControlStatuses)
      .where(
        and(
          eq(frameworkControlStatuses.organizationId, organizationId),
          eq(frameworkControlStatuses.framework, framework as FrameworkControlStatus["framework"]),
          eq(frameworkControlStatuses.controlId, controlId)
        )
      );

    // Filter out undefined values to prevent overwriting existing data with undefined
    const filteredUpdates: Record<string, unknown> = { updatedAt: new Date() };
    if (updates.status !== undefined) filteredUpdates.status = updates.status;
    if (updates.evidenceStatus !== undefined) filteredUpdates.evidenceStatus = updates.evidenceStatus;
    if (updates.notes !== undefined) filteredUpdates.notes = updates.notes;
    if (updates.updatedBy !== undefined) filteredUpdates.updatedBy = updates.updatedBy;

    if (existing) {
      const [updated] = await db
        .update(frameworkControlStatuses)
        .set(filteredUpdates)
        .where(eq(frameworkControlStatuses.id, existing.id))
        .returning();
      return updated;
    }

    const [newStatus] = await db
      .insert(frameworkControlStatuses)
      .values({
        organizationId,
        framework: framework as FrameworkControlStatus["framework"],
        controlId,
        status: updates.status ?? "not_started",
        evidenceStatus: updates.evidenceStatus ?? "none",
        notes: updates.notes,
        updatedBy: updates.updatedBy,
      })
      .returning();
    return newStatus;
  }

  // Notification methods
  async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result?.count ?? 0;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string, userId: string): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return notification || undefined;
  }

  async markAllNotificationsAsRead(userId: string): Promise<number> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return (result).rowCount ?? 0;
  }

  async deleteNotification(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    return (result).rowCount > 0;
  }

  // Versioning operations
  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    return await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, documentId))
      .orderBy(desc(documentVersions.versionNumber));
  }

  async getDocumentVersion(documentId: string, versionNumber: number): Promise<DocumentVersion | undefined> {
    const [version] = await db
      .select()
      .from(documentVersions)
      .where(
        and(
          eq(documentVersions.documentId, documentId),
          eq(documentVersions.versionNumber, versionNumber)
        )
      )
      .limit(1);
    return version || undefined;
  }

  async createDocumentVersion(insertVersion: InsertDocumentVersion): Promise<DocumentVersion> {
    const [version] = await db
      .insert(documentVersions)
      .values(insertVersion)
      .returning();
    return version;
  }

  async deleteDocumentVersion(documentId: string, versionNumber: number): Promise<boolean> {
    const result = await db
      .delete(documentVersions)
      .where(
        and(
          eq(documentVersions.documentId, documentId),
          eq(documentVersions.versionNumber, versionNumber)
        )
      );
    return (result.rowCount ?? 0) > 0;
  }

  // Audit operations
  async createAuditEntry(entry: InsertAuditLog): Promise<AuditLog> {
    const timestamp = entry.timestamp ?? new Date();
    const previousSignature = entry.previousSignature ?? await this.getLatestAuditSignature();
    const signature = entry.signature ?? computeAuditSignature(
      buildAuditSignableData({
        userId: entry.userId ?? null,
        organizationId: entry.organizationId ?? null,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        timestamp,
      } as AuditLog),
      previousSignature
    );
    const [audit] = await db
      .insert(auditLogs)
      .values({
        ...entry,
        timestamp,
        previousSignature,
        signature,
      })
      .returning();
    return audit;
  }

  async getLatestAuditSignature(): Promise<string | null> {
    const [latest] = await db
      .select({ signature: auditLogs.signature })
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(1);
    return latest?.signature ?? null;
  }

  async getAuditLogById(id: string, organizationId: string): Promise<AuditLog | null> {
    const [log] = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.id, id), eq(auditLogs.organizationId, organizationId)))
      .limit(1);
    return log || null;
  }

  async getAuditLogsByDateRange(startDate: Date, endDate: Date, organizationId?: string): Promise<AuditLog[]> {
    const conditions = [
      gte(auditLogs.timestamp, startDate),
      lte(auditLogs.timestamp, endDate)
    ];
    if (organizationId) {
      conditions.push(eq(auditLogs.organizationId, organizationId));
    }
    return await db
      .select()
      .from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.timestamp));
  }

  async verifyAuditChain(limit: number): Promise<{ valid: boolean; failedId?: string; count: number }> {
    const boundedLimit = Math.max(0, limit);
    const logs = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(boundedLimit);

    if (logs.length === 0) {
      return { valid: true, count: 0 };
    }

    const orderedLogs = logs.slice().sort((a, b) =>
      (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0)
    );

    let expectedPreviousSignature = orderedLogs[0].previousSignature ?? null;
    for (const [index, log] of orderedLogs.entries()) {
      const signature = log.signature ?? null;
      if (!signature) {
        const previousSignature = log.previousSignature ?? null;
        if (previousSignature) {
          return { valid: false, failedId: log.id, count: index + 1 };
        }
        // Legacy entries may not have signatures; treat as chain reset.
        expectedPreviousSignature = null;
        continue;
      }

      if ((log.previousSignature ?? null) !== expectedPreviousSignature) {
        return { valid: false, failedId: log.id, count: index + 1 };
      }

      const expectedSignature = computeAuditSignature(
        buildAuditSignableData(log),
        expectedPreviousSignature
      );

      if (signature !== expectedSignature) {
        return { valid: false, failedId: log.id, count: index + 1 };
      }

      expectedPreviousSignature = signature;
    }

    return { valid: true, count: orderedLogs.length };
  }

  async getAuditLogsDetailed(
    organizationId: string,
    query: {
      page?: number;
      limit?: number;
      entityType?: string;
      action?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<{ data: AuditLog[]; total: number }> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 50, 100);
    const offset = (page - 1) * limit;

    const conditions = [eq(auditLogs.organizationId, organizationId)];
    if (query.entityType) conditions.push(eq(auditLogs.resourceType, query.entityType));
    if (query.action) conditions.push(eq(auditLogs.action, query.action));
    if (query.dateFrom) conditions.push(gte(auditLogs.timestamp, query.dateFrom));
    if (query.dateTo) conditions.push(lte(auditLogs.timestamp, query.dateTo));

    const [countResult] = await db
      .select({ total: count() })
      .from(auditLogs)
      .where(and(...conditions));
    
    const total = countResult?.total ?? 0;

    const data = await db
      .select()
      .from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    return { data, total };
  }

  async getAuditStats(organizationId: string): Promise<{
    totalEvents: number;
    highRiskEvents: number;
    actions: Record<string, number>;
    entities: Record<string, number>;
  }> {
    const results = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.organizationId, organizationId))
      .limit(10000);

    const stats = {
      totalEvents: results.length,
      highRiskEvents: results.filter((r: any) => r.riskLevel === 'high' || r.riskLevel === 'critical').length,
      actions: {} as Record<string, number>,
      entities: {} as Record<string, number>,
    };

    for (const log of results) {
      if (log.action) {
        stats.actions[log.action] = (stats.actions[log.action] || 0) + 1;
      }
      if (log.resourceType) {
        stats.entities[log.resourceType] = (stats.entities[log.resourceType] || 0) + 1;
      }
    }

    return stats;
  }
}

// Use DatabaseStorage for both Cloud (Postgres) and Local (SQLite) modes
// Fallback to MemStorage only if no database is configured and not in local mode (e.g. limited dev environment)
export const storage: IStorage = (process.env.DATABASE_URL || process.env.DEPLOYMENT_MODE === 'local')
  ? new DatabaseStorage()
  : new MemStorage();

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
  type InsertDocumentVersion,
  type PolicyAcknowledgment,
  type InsertPolicyAcknowledgment,
  type Risk,
  type InsertRisk,
  type AgentState,
  type InsertAgentState,
  type Vendor,
  type InsertVendor,
  type VendorQuestionnaire,
  type InsertVendorQuestionnaire,
  type QuestionnaireSolver,
  type InsertQuestionnaireSolver,
  type AgentToolLog,
  type InsertAgentToolLog
} from "@shared/schema";
import { db } from "./db";
import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite/vector";
import fs from "fs";
import path from "path";
import * as schema from "@shared/schema";

import { createUsersRepository } from "./repositories/usersRepository";
import { createOrganizationsRepository } from "./repositories/organizationsRepository";
import { createCompanyProfilesRepository } from "./repositories/companyProfilesRepository";
import { createDocumentsRepository } from "./repositories/documentsRepository";
import { createGenerationJobsRepository } from "./repositories/generationJobsRepository";
import { createGapAnalysisRepository } from "./repositories/gapAnalysisRepository";
import { createComplianceMaturityRepository } from "./repositories/complianceMaturityRepository";
import { createAuditRepository } from "./repositories/auditRepository";
import { createContactRepository } from "./repositories/contactRepository";
import { createApprovalsRepository } from "./repositories/approvalsRepository";
import { createRolesRepository } from "./repositories/rolesRepository";
import { createFrameworksRepository } from "./repositories/frameworksRepository";
import { createNotificationsRepository } from "./repositories/notificationsRepository";
import { createInvitationsRepository } from "./repositories/invitationsRepository";
import { createSessionsRepository } from "./repositories/sessionsRepository";
import { createPolicyAcknowledgmentsRepository } from "./repositories/policyAcknowledgmentsRepository";
import { createRisksRepository } from "./repositories/risksRepository";
import { createVendorsRepository } from "./repositories/vendorsRepository";
import { createQuestionnaireSolverRepository } from "./repositories/questionnaireSolverRepository";
import { createAgentToolLogRepository } from "./repositories/agentToolLogRepository";
import { UserFilters, PaginationParams, PaginatedResult } from "./repositories/utils";

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

  // Policy Acknowledgment operations
  createPolicyAcknowledgment(ack: InsertPolicyAcknowledgment): Promise<PolicyAcknowledgment>;
  getPolicyAcknowledgmentsByUser(userId: string): Promise<PolicyAcknowledgment[]>;
  getPolicyAcknowledgment(userId: string, documentId: string): Promise<PolicyAcknowledgment | undefined>;
  getPolicyAcknowledgmentsByDocument(documentId: string): Promise<PolicyAcknowledgment[]>;

  // Risk catalog operations
  createRisk(risk: InsertRisk): Promise<Risk>;
  getRisk(id: string): Promise<Risk | undefined>;
  getRisks(orgId: string): Promise<Risk[]>;
  updateRisk(id: string, risk: Partial<InsertRisk>): Promise<Risk | undefined>;
  deleteRisk(id: string): Promise<boolean>;

  // Agent State Store operations
  getAgentState(agentId: string): Promise<AgentState | undefined>;
  saveAgentState(state: {
    agentId: string;
    agentName: string;
    trajectory: any[];
    variables: any;
    status: string;
    organizationId: string;
  }): Promise<AgentState>;
  deleteAgentState(agentId: string): Promise<boolean>;

  // Third-party Vendor operations
  getVendor(id: string): Promise<Vendor | undefined>;
  getVendors(organizationId: string): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor | undefined>;
  deleteVendor(id: string): Promise<boolean>;

  getVendorQuestionnaire(id: string): Promise<VendorQuestionnaire | undefined>;
  getVendorQuestionnaires(vendorId: string): Promise<VendorQuestionnaire[]>;
  createVendorQuestionnaire(questionnaire: InsertVendorQuestionnaire): Promise<VendorQuestionnaire>;
  updateVendorQuestionnaire(id: string, questionnaire: Partial<InsertVendorQuestionnaire>): Promise<VendorQuestionnaire | undefined>;
  deleteVendorQuestionnaire(id: string): Promise<boolean>;

  // Questionnaire Solver operations
  getQuestionnaireSolver(id: string): Promise<QuestionnaireSolver | undefined>;
  getQuestionnaireSolvers(organizationId: string): Promise<QuestionnaireSolver[]>;
  createQuestionnaireSolver(job: InsertQuestionnaireSolver): Promise<QuestionnaireSolver>;
  updateQuestionnaireSolver(id: string, job: Partial<InsertQuestionnaireSolver>): Promise<QuestionnaireSolver | undefined>;
  deleteQuestionnaireSolver(id: string): Promise<boolean>;

  // Agent Tool Log operations
  getAgentToolLogs(organizationId: string): Promise<AgentToolLog[]>;
  getAgentToolLogsByAgent(agentId: string): Promise<AgentToolLog[]>;
  createAgentToolLog(log: InsertAgentToolLog): Promise<AgentToolLog>;
}

export function createStorage(dbClient: typeof db): IStorage {
  return {
    ...createUsersRepository(dbClient),
    ...createOrganizationsRepository(dbClient),
    ...createCompanyProfilesRepository(dbClient),
    ...createDocumentsRepository(dbClient),
    ...createGenerationJobsRepository(dbClient),
    ...createGapAnalysisRepository(dbClient),
    ...createComplianceMaturityRepository(dbClient),
    ...createAuditRepository(dbClient),
    ...createContactRepository(dbClient),
    ...createApprovalsRepository(dbClient),
    ...createRolesRepository(dbClient),
    ...createFrameworksRepository(dbClient),
    ...createNotificationsRepository(dbClient),
    ...createInvitationsRepository(dbClient),
    ...createSessionsRepository(dbClient),
    ...createPolicyAcknowledgmentsRepository(dbClient),
    ...createRisksRepository(dbClient),
    ...createVendorsRepository(dbClient),
    ...createQuestionnaireSolverRepository(dbClient),
    ...createAgentToolLogRepository(dbClient)
  };
}

export const storage: IStorage = createStorage(db);

export class MemStorage {
  private dbInstance: any = null;
  private pg: any = null;
  private storageImpl: any = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (
          prop === 'pg' ||
          prop === 'dbInstance' ||
          prop === 'close' ||
          prop === 'ensureInitialized' ||
          prop === 'initPromise' ||
          prop === 'storageImpl'
        ) {
          return Reflect.get(target, prop, receiver);
        }

        return async function(...args: any[]) {
          await target.ensureInitialized();
          const method = target.storageImpl[prop];
          if (typeof method !== 'function') {
            throw new Error(`Method ${String(prop)} is not defined on storage`);
          }
          return method.apply(target.storageImpl, args);
        };
      }
    });
  }

  private async ensureInitialized() {
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = (async () => {
      this.pg = new PGlite({
        extensions: { vector },
      });
      await this.pg.waitReady;
      await this.pg.exec("CREATE EXTENSION IF NOT EXISTS vector;");
      
      const schemaPath = path.resolve(process.cwd(), "server/migrations/postgres/0000_initial_schema.sql");
      const sql = fs.readFileSync(schemaPath, "utf8");
      await this.pg.exec(sql);
      
      this.dbInstance = drizzle({ client: this.pg, schema });
      this.storageImpl = createStorage(this.dbInstance);
    })();
    return this.initPromise;
  }

  async close() {
    if (this.pg) {
      await this.pg.close();
      this.pg = null;
      this.initPromise = null;
    }
  }
}

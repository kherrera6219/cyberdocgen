import { db } from "../db";
import { eq, and, desc, like, or, sql, asc, count, ilike, lt, gte, lte } from "drizzle-orm";
import { randomUUID } from "crypto";
import { 
  users, organizations, userOrganizations, companyProfiles, documents, generationJobs,
  gapAnalysisReports, gapAnalysisFindings, remediationRecommendations, complianceMaturityAssessments,
  auditLogs, documentVersions, auditTrail, contactMessages, documentApprovals, roles,
  roleAssignments, frameworkControlStatuses, notifications, userInvitations, userSessions,
  User, UpsertUser, InsertUser, Organization, InsertOrganization, UserOrganization, InsertUserOrganization,
  CompanyProfile, InsertCompanyProfile, Document, InsertDocument, GenerationJob, InsertGenerationJob,
  GapAnalysisReport, InsertGapAnalysisReport, GapAnalysisFinding, InsertGapAnalysisFinding,
  RemediationRecommendation, InsertRemediationRecommendation, ComplianceMaturityAssessment,
  InsertComplianceMaturityAssessment, InsertAuditTrail, AuditTrail, ContactMessage, InsertContactMessage,
  DocumentApproval, InsertDocumentApproval, UserInvitation, InsertUserInvitation, UserSession,
  InsertUserSession, Role, RoleAssignment, FrameworkControlStatus, InsertFrameworkControlStatus,
  Notification, InsertNotification, AuditLog, InsertAuditLog, DocumentVersion, InsertDocumentVersion
} from "@shared/schema";
import { computeAuditSignature } from "../utils/auditSignature";
import { buildAuditSignableData, coerceLocalDateValue, coerceLocalBooleanValue, normalizeLocalUserWriteValues, UserFilters, PaginationParams, PaginatedResult } from "./utils";

export function createApprovalsRepository(dbClient: typeof db) {
  return {
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
      },

    async getDocumentApproval(id: string): Promise<DocumentApproval | undefined> {
        const [approval] = await db
          .select()
          .from(documentApprovals)
          .where(eq(documentApprovals.id, id));
        return approval || undefined;
      },

    async createDocumentApproval(approval: InsertDocumentApproval): Promise<DocumentApproval> {
        const [newApproval] = await db
          .insert(documentApprovals)
          .values(approval)
          .returning();
        return newApproval;
      },

    async updateDocumentApproval(id: string, updates: Partial<InsertDocumentApproval>): Promise<DocumentApproval | undefined> {
        const [updated] = await db
          .update(documentApprovals)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(documentApprovals.id, id))
          .returning();
        return updated || undefined;
      },

  };
}

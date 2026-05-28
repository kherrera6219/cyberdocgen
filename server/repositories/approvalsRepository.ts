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
          return await dbClient.select()
            .from(documentApprovals)
            .where(eq(documentApprovals.status, status as any))
            .orderBy(desc(documentApprovals.createdAt));
        }
        return await dbClient.select()
          .from(documentApprovals)
          .orderBy(desc(documentApprovals.createdAt));
      },
 
    async getDocumentApprovalsByDocumentId(documentId: string): Promise<DocumentApproval[]> {
        return await dbClient.select()
          .from(documentApprovals)
          .where(eq(documentApprovals.documentId, documentId))
          .orderBy(desc(documentApprovals.createdAt));
      },

    async getDocumentApproval(id: string): Promise<DocumentApproval | undefined> {
        const [approval] = await dbClient.select()
          .from(documentApprovals)
          .where(eq(documentApprovals.id, id));
        return approval || undefined;
      },

    async createDocumentApproval(approval: InsertDocumentApproval): Promise<DocumentApproval> {
        let requestedBy = approval.requestedBy;
        if (!requestedBy) {
          const [firstUser] = await dbClient.select({ id: users.id }).from(users).limit(1);
          requestedBy = firstUser?.id ?? 'user-1';
        }
        
        let documentId = approval.documentId;
        if (!documentId) {
          const [firstDoc] = await dbClient.select({ id: documents.id }).from(documents).limit(1);
          documentId = firstDoc?.id ?? 'doc-1';
        }

        const approverRole = approval.approverRole ?? 'reviewer';

        const [newApproval] = await dbClient.insert(documentApprovals)
          .values({ ...approval, requestedBy, documentId, approverRole })
          .returning();
        return newApproval;
      },

    async updateDocumentApproval(id: string, updates: Partial<InsertDocumentApproval>): Promise<DocumentApproval | undefined> {
        const [updated] = await dbClient.update(documentApprovals)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(documentApprovals.id, id))
          .returning();
        return updated || undefined;
      },

  };
}




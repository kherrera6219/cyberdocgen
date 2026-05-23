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

export function createFrameworksRepository(dbClient: typeof db) {
  return {
    async getDocumentsByFramework(framework: string): Promise<Document[]> {
        const DEFAULT_LIMIT = 500; // Prevent memory exhaustion
        return await db
          .select()
          .from(documents)
          .where(eq(documents.framework, framework))
          .orderBy(desc(documents.updatedAt))
          .limit(DEFAULT_LIMIT);
      },

    async getFrameworkControlStatuses(organizationId: string, framework: string): Promise<FrameworkControlStatus[]> {
        return await db
          .select()
          .from(frameworkControlStatuses)
          .where(
            and(
              eq(frameworkControlStatuses.organizationId, organizationId),
              eq(frameworkControlStatuses.framework, framework)
            )
          );
      },

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
              eq(frameworkControlStatuses.framework, framework),
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
            framework: framework,
            controlId,
            status: updates.status ?? "not_started",
            evidenceStatus: updates.evidenceStatus ?? "none",
            notes: updates.notes,
            updatedBy: updates.updatedBy,
          })
          .returning();
        return newStatus;
      },

  };
}

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

export function createRolesRepository(dbClient: typeof db) {
  return {
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
      },

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
      },

  };
}

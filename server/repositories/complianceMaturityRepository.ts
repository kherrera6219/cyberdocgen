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

export function createComplianceMaturityRepository(dbClient: typeof db) {
  return {
    async createComplianceMaturityAssessment(assessment: InsertComplianceMaturityAssessment): Promise<ComplianceMaturityAssessment> {
        const [newAssessment] = await db
          .insert(complianceMaturityAssessments)
          .values(assessment)
          .returning();
        return newAssessment;
      },

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
      },

  };
}

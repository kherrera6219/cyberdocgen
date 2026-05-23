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

export function createContactRepository(dbClient: typeof db) {
  return {
    async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
        const [newMessage] = await db
          .insert(contactMessages)
          .values(message)
          .returning();
        return newMessage;
      },

  };
}

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

export function createSessionsRepository(dbClient: typeof db) {
  return {
    async createUserSession(session: InsertUserSession): Promise<UserSession> {
        const [sess] = await dbClient.insert(userSessions).values(session).returning();
        return sess;
      },

    async getUserSessions(userId: string): Promise<UserSession[]> {
        return await dbClient.select().from(userSessions)
          .where(eq(userSessions.userId, userId))
          .orderBy(desc(userSessions.createdAt));
      },

    async getActiveUserSessions(userId: string): Promise<UserSession[]> {
        const now = new Date();
        return await dbClient.select().from(userSessions)
          .where(and(
            eq(userSessions.userId, userId),
            eq(userSessions.isActive, true),
            gte(userSessions.expiresAt, now)
          ))
          .orderBy(desc(userSessions.lastActivityAt));
      },

    async terminateSession(sessionId: string): Promise<boolean> {
        const result = await dbClient.update(userSessions)
          .set({ isActive: false })
          .where(eq(userSessions.id, sessionId));
        return (result.affectedRows ?? 0) > 0;
      },

    async terminateAllUserSessions(userId: string): Promise<number> {
        const result = await dbClient.update(userSessions)
          .set({ isActive: false })
          .where(eq(userSessions.userId, userId));
        return result.affectedRows ?? 0;
      },

    async updateSessionActivity(sessionId: string): Promise<UserSession | undefined> {
        const [sess] = await dbClient.update(userSessions)
          .set({ lastActivityAt: new Date() })
          .where(eq(userSessions.id, sessionId))
          .returning();
        return sess || undefined;
      },

    async cleanupExpiredSessions(): Promise<number> {
        const now = new Date();
        const result = await dbClient.delete(userSessions).where(lt(userSessions.expiresAt, now));
        return result.affectedRows ?? 0;
      },

  };
}


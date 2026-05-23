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

export function createNotificationsRepository(dbClient: typeof db) {
  return {
    async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
        return db
          .select()
          .from(notifications)
          .where(eq(notifications.userId, userId))
          .orderBy(desc(notifications.createdAt))
          .limit(limit);
      },

    async getUnreadNotificationCount(userId: string): Promise<number> {
        const [result] = await db
          .select({ count: count() })
          .from(notifications)
          .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
        return result?.count ?? 0;
      },

    async createNotification(notification: InsertNotification): Promise<Notification> {
        const isLocalSqliteMode = process.env.DEPLOYMENT_MODE === 'local';
        const normalizedNotificationData = isLocalSqliteMode
          ? (() => {
              const source = notification as Record<string, unknown>;
              return {
                ...notification,
                id: typeof source.id === 'string' && source.id.trim().length > 0 ? source.id : randomUUID(),
                isRead: coerceLocalBooleanValue(source.isRead, false),
                metadata: source.metadata ?? null,
                organizationId: source.organizationId ?? null,
                createdAt: coerceLocalDateValue(source.createdAt) ?? new Date(),
              };
            })()
          : notification;
    
        const [newNotification] = await db
          .insert(notifications)
          .values(normalizedNotificationData)
          .returning();
        return newNotification;
      },

    async markNotificationAsRead(id: string, userId: string): Promise<Notification | undefined> {
        const [notification] = await db
          .update(notifications)
          .set({ isRead: true })
          .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
          .returning();
        return notification || undefined;
      },

    async markAllNotificationsAsRead(userId: string): Promise<number> {
        const result = await db
          .update(notifications)
          .set({ isRead: true })
          .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
        return (result as any)?.affectedRows ?? 0;
      },

    async deleteNotification(id: string, userId: string): Promise<boolean> {
        const result = await db
          .delete(notifications)
          .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
        return ((result as any)?.affectedRows ?? 0) > 0;
      },

  };
}


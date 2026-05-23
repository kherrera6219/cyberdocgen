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

export function createInvitationsRepository(dbClient: typeof db) {
  return {
    async createInvitation(invitation: InsertUserInvitation): Promise<UserInvitation> {
        const [inv] = await dbClient.insert(userInvitations).values(invitation).returning();
        return inv;
      },

    async getInvitation(id: string): Promise<UserInvitation | undefined> {
        const [inv] = await dbClient.select().from(userInvitations).where(eq(userInvitations.id, id));
        return inv || undefined;
      },

    async getInvitationByToken(token: string): Promise<UserInvitation | undefined> {
        const [inv] = await dbClient.select().from(userInvitations).where(eq(userInvitations.token, token));
        return inv || undefined;
      },

    async getInvitationsByOrganization(organizationId: string): Promise<UserInvitation[]> {
        return await dbClient.select().from(userInvitations)
          .where(eq(userInvitations.organizationId, organizationId))
          .orderBy(desc(userInvitations.createdAt));
      },

    async getPendingInvitations(): Promise<UserInvitation[]> {
        return await dbClient.select().from(userInvitations)
          .where(eq(userInvitations.status, 'pending'))
          .orderBy(desc(userInvitations.createdAt));
      },

    async updateInvitation(id: string, updates: Partial<InsertUserInvitation>): Promise<UserInvitation | undefined> {
        const [inv] = await dbClient.update(userInvitations).set(updates).where(eq(userInvitations.id, id)).returning();
        return inv || undefined;
      },

    async revokeInvitation(id: string): Promise<boolean> {
        const result = await dbClient.update(userInvitations)
          .set({ status: 'revoked' })
          .where(eq(userInvitations.id, id));
        return (result.rowCount ?? 0) > 0;
      },

    async acceptInvitation(token: string, userId: string): Promise<UserInvitation | undefined> {
        const invitation = await this.getInvitationByToken(token);
        if (!invitation || invitation.status !== 'pending') return undefined;
        
        const now = new Date();
        if (invitation.expiresAt < now) {
          await dbClient.update(userInvitations).set({ status: 'expired' }).where(eq(userInvitations.id, invitation.id));
          return undefined;
        }
        
        const [inv] = await dbClient.update(userInvitations)
          .set({ status: 'accepted', acceptedAt: now })
          .where(eq(userInvitations.id, invitation.id))
          .returning();
        return inv || undefined;
      },

  };
}

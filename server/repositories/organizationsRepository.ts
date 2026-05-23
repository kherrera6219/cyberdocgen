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

export function createOrganizationsRepository(dbClient: typeof db) {
  return {
    async getOrganizations(): Promise<Organization[]> {
        return await dbClient.select().from(organizations).orderBy(desc(organizations.createdAt));
      },

    async getOrganization(id: string): Promise<Organization | undefined> {
        const [org] = await dbClient.select().from(organizations).where(eq(organizations.id, id));
        return org || undefined;
      },

    async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
        const [org] = await dbClient.select().from(organizations).where(eq(organizations.slug, slug));
        return org || undefined;
      },

    async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
        const isLocalSqliteMode = process.env.DEPLOYMENT_MODE === 'local';
        const normalizedOrgData = isLocalSqliteMode
          ? (() => {
              const source = insertOrg as Record<string, unknown>;
              const now = new Date();
              return {
                ...insertOrg,
                id: typeof source.id === 'string' && source.id.trim().length > 0 ? source.id : randomUUID(),
                isActive: coerceLocalBooleanValue(source.isActive, true),
                description: source.description ?? null,
                logo: source.logo ?? null,
                website: source.website ?? null,
                contactEmail: source.contactEmail ?? null,
                createdAt: coerceLocalDateValue(source.createdAt) ?? now,
                updatedAt: coerceLocalDateValue(source.updatedAt) ?? now,
              };
            })()
          : insertOrg;
    
        const [org] = await db
          .insert(organizations)
          .values(normalizedOrgData)
          .returning();
        return org;
      },

    async updateOrganization(id: string, updateData: Partial<InsertOrganization>): Promise<Organization | undefined> {
        const [org] = await db
          .update(organizations)
          .set({ ...updateData, updatedAt: new Date() })
          .where(eq(organizations.id, id))
          .returning();
        return org || undefined;
      },

    async getUserOrganizations(userId: string): Promise<UserOrganization[]> {
        return await dbClient.select().from(userOrganizations).where(eq(userOrganizations.userId, userId));
      },

    async getOrganizationUsers(organizationId: string): Promise<UserOrganization[]> {
        return await dbClient.select().from(userOrganizations).where(eq(userOrganizations.organizationId, organizationId));
      },

    async addUserToOrganization(membership: InsertUserOrganization): Promise<UserOrganization> {
        const isLocalSqliteMode = process.env.DEPLOYMENT_MODE === 'local';
        const normalizedMembershipData = isLocalSqliteMode
          ? (() => {
              const source = membership as Record<string, unknown>;
              return {
                ...membership,
                id: typeof source.id === 'string' && source.id.trim().length > 0 ? source.id : randomUUID(),
                role: typeof source.role === 'string' && source.role.trim().length > 0 ? source.role : 'member',
                joinedAt: coerceLocalDateValue(source.joinedAt) ?? new Date(),
              };
            })()
          : membership;
    
        const [userOrg] = await db
          .insert(userOrganizations)
          .values(normalizedMembershipData)
          .returning();
        return userOrg;
      },

    async removeUserFromOrganization(userId: string, organizationId: string): Promise<boolean> {
        const result = await db
          .delete(userOrganizations)
          .where(and(
            eq(userOrganizations.userId, userId),
            eq(userOrganizations.organizationId, organizationId)
          ));
        return (result.affectedRows ?? 0) > 0;
      },

  };
}


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

export function createUsersRepository(dbClient: typeof db) {
  return {
    async getUser(id: string): Promise<User | undefined> {
        const [user] = await dbClient.select().from(users).where(eq(users.id, id));
        return user || undefined;
      },

    async getUserByEmail(email: string): Promise<User | undefined> {
        const [user] = await dbClient.select().from(users).where(eq(users.email, email));
        return user || undefined;
      },

    async createUser(insertUser: InsertUser): Promise<User> {
        const isLocalSqliteMode = process.env.DEPLOYMENT_MODE === 'local';
        const normalizedInsertData = isLocalSqliteMode
          ? normalizeLocalUserWriteValues(insertUser as Record<string, unknown>)
          : insertUser;
    
        const [user] = await db
          .insert(users)
          .values(normalizedInsertData)
          .returning();
        return user;
      },

    async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
        const [user] = await db
          .update(users)
          .set({ ...updateData, updatedAt: new Date() })
          .where(eq(users.id, id))
          .returning();
        return user || undefined;
      },

    async upsertUser(userData: UpsertUser): Promise<User> {
        const isLocalSqliteMode = process.env.DEPLOYMENT_MODE === 'local';
        const normalizedUserData = isLocalSqliteMode
          ? normalizeLocalUserWriteValues(userData as Record<string, unknown>)
          : userData;
    
        const conflictSet = { ...(normalizedUserData as Record<string, unknown>) };
        // Preserve original creation time on upsert updates.
        delete conflictSet.createdAt;
        conflictSet.updatedAt = isLocalSqliteMode
          ? (coerceLocalDateValue(conflictSet.updatedAt) ?? new Date())
          : sql`CURRENT_TIMESTAMP`;
    
        const [user] = await db
          .insert(users)
          .values(normalizedUserData)
          .onConflictDoUpdate({
            target: users.id,
            set: conflictSet as any,
          })
          .returning();
        return user;
      },

    async getAllUsers(filters?: UserFilters, pagination?: PaginationParams): Promise<PaginatedResult<User>> {
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 20;
        const offset = (page - 1) * limit;
    
        const conditions: any[] = [];
    
        if (filters?.search) {
          const searchConditions = [
            ilike(users.email, `%${filters.search}%`),
          ];
          if (filters.search) {
            searchConditions.push(
              ilike(users.firstName, `%${filters.search}%`),
              ilike(users.lastName, `%${filters.search}%`)
            );
          }
          conditions.push(or(...searchConditions));
        }
    
        if (filters?.role) {
          conditions.push(eq(users.role, filters.role as any));
        }
    
        if (filters?.status) {
          conditions.push(eq(users.accountStatus, filters.status as any));
        }
    
        if (filters?.isActive !== undefined) {
          conditions.push(eq(users.isActive, filters.isActive));
        }
    
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        
        const [totalResult] = await db
          .select({ count: count() })
          .from(users)
          .where(whereClause);
        
        const total = totalResult?.count || 0;
    
        // Build query with orderBy based on sorting parameters
        let data;
        if (pagination?.sortBy === 'createdAt') {
          data = await dbClient.select().from(users).where(whereClause)
            .orderBy(pagination.sortOrder === 'asc' ? asc(users.createdAt) : desc(users.createdAt))
            .limit(limit).offset(offset);
        } else if (pagination?.sortBy === 'email') {
          data = await dbClient.select().from(users).where(whereClause)
            .orderBy(pagination.sortOrder === 'asc' ? asc(users.email) : desc(users.email))
            .limit(limit).offset(offset);
        } else {
          data = await dbClient.select().from(users).where(whereClause)
            .orderBy(desc(users.createdAt))
            .limit(limit).offset(offset);
        }
        
        return {
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        };
      },

    async deleteUser(id: string): Promise<boolean> {
        const result = await dbClient.delete(users).where(eq(users.id, id));
        return (result.affectedRows ?? 0) > 0;
      },

    async suspendUser(id: string, _reason?: string): Promise<User | undefined> {
        const [user] = await db
          .update(users)
          .set({ 
            accountStatus: 'suspended', 
            isActive: false,
            updatedAt: new Date() 
          })
          .where(eq(users.id, id))
          .returning();
        return user || undefined;
      },

    async reactivateUser(id: string): Promise<User | undefined> {
        const [user] = await db
          .update(users)
          .set({ 
            accountStatus: 'active', 
            isActive: true,
            failedLoginAttempts: 0,
            accountLockedUntil: null,
            updatedAt: new Date() 
          })
          .where(eq(users.id, id))
          .returning();
        return user || undefined;
      },

    async bulkUpdateUsers(ids: string[], updates: Partial<InsertUser>): Promise<number> {
        if (ids.length === 0) return 0;
        
        let updated = 0;
        for (const id of ids) {
          const result = await db
            .update(users)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(users.id, id));
          if ((result.affectedRows ?? 0) > 0) updated++;
        }
        return updated;
      },

  };
}


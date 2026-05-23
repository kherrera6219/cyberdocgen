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

export function createGenerationJobsRepository(dbClient: typeof db) {
  return {
    async getGenerationJob(id: string): Promise<GenerationJob | undefined> {
        const [job] = await dbClient.select().from(generationJobs).where(eq(generationJobs.id, id));
        return job || undefined;
      },

    async getGenerationJobs(organizationId?: string): Promise<GenerationJob[]> {
        const DEFAULT_LIMIT = 500; // Prevent memory exhaustion
        if (organizationId) {
          return await dbClient.select()
            .from(generationJobs)
            .innerJoin(companyProfiles, eq(generationJobs.companyProfileId, companyProfiles.id))
            .where(eq(companyProfiles.organizationId, organizationId))
            .orderBy(desc(generationJobs.createdAt))
            .limit(DEFAULT_LIMIT)
            .then((results: any[]) => results.map((result: any) => result.generation_jobs));
        }
        return await dbClient.select().from(generationJobs).orderBy(desc(generationJobs.createdAt)).limit(DEFAULT_LIMIT);
      },

    async getGenerationJobsByCompanyProfile(companyProfileId: string): Promise<GenerationJob[]> {
        const DEFAULT_LIMIT = 200; // Prevent memory exhaustion
        return await dbClient.select()
          .from(generationJobs)
          .where(eq(generationJobs.companyProfileId, companyProfileId))
          .orderBy(desc(generationJobs.createdAt))
          .limit(DEFAULT_LIMIT);
      },

    async createGenerationJob(insertJob: InsertGenerationJob): Promise<GenerationJob> {
        let createdBy = insertJob.createdBy;
        if (!createdBy) {
          const [firstUser] = await dbClient.select({ id: users.id }).from(users).limit(1);
          createdBy = firstUser?.id ?? 'user-1';
        }
        const framework = insertJob.framework ?? 'ISO27001';
        const [job] = await dbClient.insert(generationJobs)
          .values([{ ...insertJob, createdBy, framework }])
          .returning();
        return job;
      },

    async updateGenerationJob(id: string, updateData: Partial<InsertGenerationJob>): Promise<GenerationJob | undefined> {
        const [job] = await dbClient.update(generationJobs)
          .set({ ...updateData, updatedAt: new Date() })
          .where(eq(generationJobs.id, id))
          .returning();
        return job || undefined;
      },

  };
}




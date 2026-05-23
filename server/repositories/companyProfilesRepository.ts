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

export function createCompanyProfilesRepository(dbClient: typeof db) {
  return {
    async getCompanyProfile(id: string): Promise<CompanyProfile | undefined> {
        const [profile] = await dbClient.select().from(companyProfiles).where(eq(companyProfiles.id, id));
        return profile || undefined;
      },

    async getCompanyProfiles(organizationId?: string): Promise<CompanyProfile[]> {
        const DEFAULT_LIMIT = 1000; // Prevent memory exhaustion
        if (organizationId) {
          return await dbClient.select()
            .from(companyProfiles)
            .where(eq(companyProfiles.organizationId, organizationId))
            .orderBy(desc(companyProfiles.updatedAt))
            .limit(DEFAULT_LIMIT);
        }
        return await dbClient.select().from(companyProfiles).orderBy(desc(companyProfiles.updatedAt)).limit(DEFAULT_LIMIT);
      },

    async createCompanyProfile(insertProfile: InsertCompanyProfile): Promise<CompanyProfile> {
        if (insertProfile.id) {
          const [existing] = await dbClient.select().from(companyProfiles).where(eq(companyProfiles.id, insertProfile.id)).limit(1);
          if (existing) {
            return existing;
          }
        }
        let createdBy = insertProfile.createdBy;
        if (!createdBy) {
          const [firstUser] = await dbClient.select({ id: users.id }).from(users).limit(1);
          createdBy = firstUser?.id ?? 'user-1';
        }
        const industry = insertProfile.industry ?? 'Technology';
        const companySize = insertProfile.companySize ?? '1-10';
        const headquarters = insertProfile.headquarters ?? 'USA';
        const dataClassification = insertProfile.dataClassification ?? 'Public';
        const businessApplications = insertProfile.businessApplications ?? 'None';
        const [profile] = await dbClient.insert(companyProfiles)
          .values([{ ...insertProfile, createdBy, industry, companySize, headquarters, dataClassification, businessApplications }])
          .returning();
        return profile;
      },

    async updateCompanyProfile(id: string, updateData: Partial<InsertCompanyProfile>): Promise<CompanyProfile | undefined> {
        const updateValues = {
          ...updateData,
          updatedAt: new Date(),
          // Ensure array fields are properly handled
          cloudInfrastructure: Array.isArray(updateData.cloudInfrastructure) ? updateData.cloudInfrastructure : undefined,
        };
        
        // Remove undefined values to prevent database errors
        const cleanUpdateValues = Object.fromEntries(
          Object.entries(updateValues).filter(([, value]) => value !== undefined)
        );
        
        const [profile] = await dbClient.update(companyProfiles)
          .set(cleanUpdateValues)
          .where(eq(companyProfiles.id, id))
          .returning();
        return profile || undefined;
      },

  };
}




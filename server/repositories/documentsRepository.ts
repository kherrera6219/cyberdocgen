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

export function createDocumentsRepository(dbClient: typeof db) {
  return {
    async getDocument(id: string): Promise<Document | undefined> {
        const [document] = await dbClient.select().from(documents).where(eq(documents.id, id));
        return document || undefined;
      },

    async getDocuments(organizationId?: string): Promise<Document[]> {
        const DEFAULT_LIMIT = 1000; // Prevent memory exhaustion
        if (organizationId) {
          return await db
            .select()
            .from(documents)
            .innerJoin(companyProfiles, eq(documents.companyProfileId, companyProfiles.id))
            .where(eq(companyProfiles.organizationId, organizationId))
            .orderBy(desc(documents.updatedAt))
            .limit(DEFAULT_LIMIT)
            .then((results: any[]) => results.map((result: any) => result.documents));
        }
        return await dbClient.select().from(documents).orderBy(desc(documents.updatedAt)).limit(DEFAULT_LIMIT);
      },

    async getDocumentsByCompanyProfile(companyProfileId: string): Promise<Document[]> {
        const DEFAULT_LIMIT = 500; // Prevent memory exhaustion
        return await db
          .select()
          .from(documents)
          .where(eq(documents.companyProfileId, companyProfileId))
          .orderBy(desc(documents.updatedAt))
          .limit(DEFAULT_LIMIT);
      },

    async createDocument(insertDocument: InsertDocument): Promise<Document> {
        const [document] = await db
          .insert(documents)
          .values([insertDocument])
          .returning();
        return document;
      },

    async updateDocument(id: string, updateData: Partial<InsertDocument>): Promise<Document | undefined> {
        const updateValues = {
          ...updateData,
          updatedAt: new Date(),
          // Ensure array fields are properly handled
          tags: Array.isArray(updateData.tags) ? updateData.tags : undefined,
        };
        
        // Remove undefined values to prevent database errors
        const cleanUpdateValues = Object.fromEntries(
          Object.entries(updateValues).filter(([, value]) => value !== undefined)
        );
        
        const [document] = await db
          .update(documents)
          .set(cleanUpdateValues)
          .where(eq(documents.id, id))
          .returning();
        return document || undefined;
      },

    async deleteDocument(id: string): Promise<boolean> {
        const result = await dbClient.delete(documents).where(eq(documents.id, id));
        return (result.rowCount ?? 0) > 0;
      },

    async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
        return await db
          .select()
          .from(documentVersions)
          .where(eq(documentVersions.documentId, documentId))
          .orderBy(desc(documentVersions.versionNumber));
      },

    async getDocumentVersion(documentId: string, versionNumber: number): Promise<DocumentVersion | undefined> {
        const [version] = await db
          .select()
          .from(documentVersions)
          .where(
            and(
              eq(documentVersions.documentId, documentId),
              eq(documentVersions.versionNumber, versionNumber)
            )
          )
          .limit(1);
        return version || undefined;
      },

    async createDocumentVersion(insertVersion: InsertDocumentVersion): Promise<DocumentVersion> {
        const [version] = await db
          .insert(documentVersions)
          .values(insertVersion)
          .returning();
        return version;
      },

    async deleteDocumentVersion(documentId: string, versionNumber: number): Promise<boolean> {
        const result = await db
          .delete(documentVersions)
          .where(
            and(
              eq(documentVersions.documentId, documentId),
              eq(documentVersions.versionNumber, versionNumber)
            )
          );
        return (result.rowCount ?? 0) > 0;
      },

  };
}

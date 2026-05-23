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

export function createGapAnalysisRepository(dbClient: typeof db) {
  return {
    async createGapAnalysisReport(report: InsertGapAnalysisReport): Promise<GapAnalysisReport> {
        const [newReport] = await db
          .insert(gapAnalysisReports)
          .values(report)
          .returning();
        return newReport;
      },

    async getGapAnalysisReports(organizationId: string): Promise<GapAnalysisReport[]> {
        const DEFAULT_LIMIT = 500; // Prevent memory exhaustion
        return db
          .select()
          .from(gapAnalysisReports)
          .where(eq(gapAnalysisReports.organizationId, organizationId))
          .orderBy(desc(gapAnalysisReports.createdAt))
          .limit(DEFAULT_LIMIT);
      },

    async getGapAnalysisReport(id: string): Promise<GapAnalysisReport | undefined> {
        const [report] = await db
          .select()
          .from(gapAnalysisReports)
          .where(eq(gapAnalysisReports.id, id));
        return report || undefined;
      },

    async updateGapAnalysisReport(id: string, updates: Partial<GapAnalysisReport>): Promise<GapAnalysisReport> {
        const [updated] = await db
          .update(gapAnalysisReports)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(gapAnalysisReports.id, id))
          .returning();
        if (!updated) {
          throw new Error("Report not found");
        }
        return updated;
      },

    async createGapAnalysisFinding(finding: InsertGapAnalysisFinding): Promise<GapAnalysisFinding> {
        const [newFinding] = await db
          .insert(gapAnalysisFindings)
          .values(finding)
          .returning();
        return newFinding;
      },

    async getGapAnalysisFindings(reportId: string): Promise<GapAnalysisFinding[]> {
        return db
          .select()
          .from(gapAnalysisFindings)
          .where(eq(gapAnalysisFindings.reportId, reportId))
          .orderBy(desc(gapAnalysisFindings.createdAt));
      },

    async getGapAnalysisFinding(id: string): Promise<GapAnalysisFinding | undefined> {
        const [finding] = await db
          .select()
          .from(gapAnalysisFindings)
          .where(eq(gapAnalysisFindings.id, id));
        return finding || undefined;
      },

    async createRemediationRecommendation(recommendation: InsertRemediationRecommendation): Promise<RemediationRecommendation> {
        const [newRecommendation] = await db
          .insert(remediationRecommendations)
          .values(recommendation)
          .returning();
        return newRecommendation;
      },

    async getRemediationRecommendations(findingId: string): Promise<RemediationRecommendation[]> {
        return db
          .select()
          .from(remediationRecommendations)
          .where(eq(remediationRecommendations.findingId, findingId))
          .orderBy(desc(remediationRecommendations.createdAt));
      },

    async getRemediationRecommendation(id: string): Promise<RemediationRecommendation | undefined> {
        const [recommendation] = await db
          .select()
          .from(remediationRecommendations)
          .where(eq(remediationRecommendations.id, id));
        return recommendation || undefined;
      },

    async updateRemediationRecommendation(id: string, updates: Partial<RemediationRecommendation>): Promise<RemediationRecommendation> {
        const [updated] = await db
          .update(remediationRecommendations)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(remediationRecommendations.id, id))
          .returning();
    
        if (!updated) {
          throw new Error("Recommendation not found");
        }
    
        return updated;
      },

  };
}

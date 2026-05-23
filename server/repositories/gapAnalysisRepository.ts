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
        const overallScore = report.overallScore ?? 0;
        const framework = (report.framework ? report.framework.toLowerCase() : 'soc2') as any;
        const [newReport] = await dbClient.insert(gapAnalysisReports)
          .values({ ...report, overallScore, framework })
          .returning();
        return newReport;
      },

    async getGapAnalysisReports(organizationId: string): Promise<GapAnalysisReport[]> {
        const DEFAULT_LIMIT = 500; // Prevent memory exhaustion
        return dbClient.select()
          .from(gapAnalysisReports)
          .where(eq(gapAnalysisReports.organizationId, organizationId))
          .orderBy(desc(gapAnalysisReports.createdAt))
          .limit(DEFAULT_LIMIT);
      },

    async getGapAnalysisReport(id: string): Promise<GapAnalysisReport | undefined> {
        const [report] = await dbClient.select()
          .from(gapAnalysisReports)
          .where(eq(gapAnalysisReports.id, id));
        return report || undefined;
      },

    async updateGapAnalysisReport(id: string, updates: Partial<GapAnalysisReport>): Promise<GapAnalysisReport> {
        const [updated] = await dbClient.update(gapAnalysisReports)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(gapAnalysisReports.id, id))
          .returning();
        if (!updated) {
          throw new Error("Report not found");
        }
        return updated;
      },

    async createGapAnalysisFinding(finding: InsertGapAnalysisFinding): Promise<GapAnalysisFinding> {
        const controlId = finding.controlId ?? 'CTRL-1';
        const controlTitle = finding.controlTitle ?? (finding as any).title ?? 'Default Title';
        const currentStatus = finding.currentStatus ?? 'not_implemented';
        const riskLevel = finding.riskLevel ?? 'medium';
        const gapDescription = finding.gapDescription ?? 'Gap description';
        const businessImpact = finding.businessImpact ?? 'Business impact';
        const complianceScore = finding.complianceScore ?? 0;
        const priority = finding.priority ?? 1;
        const [newFinding] = await dbClient.insert(gapAnalysisFindings)
          .values({ 
            ...finding,
            controlId,
            controlTitle,
            currentStatus,
            riskLevel,
            gapDescription,
            businessImpact,
            complianceScore,
            priority
          } as any)
          .returning();
        return newFinding;
      },

    async getGapAnalysisFindings(reportId: string): Promise<GapAnalysisFinding[]> {
        return dbClient.select()
          .from(gapAnalysisFindings)
          .where(eq(gapAnalysisFindings.reportId, reportId))
          .orderBy(desc(gapAnalysisFindings.createdAt));
      },

    async getGapAnalysisFinding(id: string): Promise<GapAnalysisFinding | undefined> {
        const [finding] = await dbClient.select()
          .from(gapAnalysisFindings)
          .where(eq(gapAnalysisFindings.id, id));
        return finding || undefined;
      },

    async createRemediationRecommendation(recommendation: InsertRemediationRecommendation): Promise<RemediationRecommendation> {
        const title = recommendation.title ?? 'Remediation';
        const description = recommendation.description ?? 'Description';
        const implementation = recommendation.implementation ?? 'Implementation details';
        const timeframe = recommendation.timeframe ?? 'short_term';
        const priority = recommendation.priority ?? 3;
        const [newRecommendation] = await dbClient.insert(remediationRecommendations)
          .values({
            ...recommendation,
            title,
            description,
            implementation,
            timeframe,
            priority
          } as any)
          .returning();
        return newRecommendation;
      },

    async getRemediationRecommendations(findingId: string): Promise<RemediationRecommendation[]> {
        return dbClient.select()
          .from(remediationRecommendations)
          .where(eq(remediationRecommendations.findingId, findingId))
          .orderBy(desc(remediationRecommendations.createdAt));
      },

    async getRemediationRecommendation(id: string): Promise<RemediationRecommendation | undefined> {
        const [recommendation] = await dbClient.select()
          .from(remediationRecommendations)
          .where(eq(remediationRecommendations.id, id));
        return recommendation || undefined;
      },

    async updateRemediationRecommendation(id: string, updates: Partial<RemediationRecommendation>): Promise<RemediationRecommendation> {
        const [updated] = await dbClient.update(remediationRecommendations)
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




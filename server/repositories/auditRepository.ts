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

export function createAuditRepository(dbClient: typeof db) {
  return {
    async createAuditEntry(entry: InsertAuditLog): Promise<AuditLog> {
        const timestamp = entry.timestamp ?? new Date();
        const ipAddress = entry.ipAddress ?? '127.0.0.1';
        const resourceType = entry.resourceType ?? 'system';
        const previousSignature = entry.previousSignature ?? await this.getLatestAuditSignature();
        const signature = entry.signature ?? computeAuditSignature(
          buildAuditSignableData({
            userId: entry.userId ?? null,
            organizationId: entry.organizationId ?? null,
            action: entry.action,
            resourceType,
            resourceId: entry.resourceId ?? null,
            timestamp,
          } as AuditLog),
          previousSignature
        );
        const [audit] = await dbClient.insert(auditLogs)
          .values({
            ...entry,
            resourceType,
            timestamp,
            ipAddress,
            previousSignature,
            signature,
          })
          .returning();
        return audit;
      },

    async getLatestAuditSignature(): Promise<string | null> {
        const [latest] = await dbClient.select({ signature: auditLogs.signature })
          .from(auditLogs)
          .orderBy(desc(auditLogs.timestamp))
          .limit(1);
        return latest?.signature ?? null;
      },

    async getAuditLogById(id: string, organizationId: string): Promise<AuditLog | null> {
        const [log] = await dbClient.select()
          .from(auditLogs)
          .where(and(eq(auditLogs.id, id), eq(auditLogs.organizationId, organizationId)))
          .limit(1);
        return log || null;
      },

    async getAuditLogsByDateRange(startDate: Date, endDate: Date, organizationId?: string): Promise<AuditLog[]> {
        const conditions = [
          gte(auditLogs.timestamp, startDate),
          lte(auditLogs.timestamp, endDate)
        ];
        if (organizationId) {
          conditions.push(eq(auditLogs.organizationId, organizationId));
        }
        return await dbClient.select()
          .from(auditLogs)
          .where(and(...conditions))
          .orderBy(desc(auditLogs.timestamp));
      },

    async verifyAuditChain(limit: number): Promise<{ valid: boolean; failedId?: string; count: number }> {
        const boundedLimit = Math.max(0, limit);
        const logs = await dbClient.select()
          .from(auditLogs)
          .orderBy(desc(auditLogs.timestamp))
          .limit(boundedLimit);
    
        if (logs.length === 0) {
          return { valid: true, count: 0 };
        }
    
        const orderedLogs = logs.slice().sort((a, b) =>
          (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0)
        );
    
        let expectedPreviousSignature = orderedLogs[0].previousSignature ?? null;
        for (const [index, log] of orderedLogs.entries()) {
          const signature = log.signature ?? null;
          if (!signature) {
            const previousSignature = log.previousSignature ?? null;
            if (previousSignature) {
              return { valid: false, failedId: log.id, count: index + 1 };
            }
            // Legacy entries may not have signatures; treat as chain reset.
            expectedPreviousSignature = null;
            continue;
          }
    
          if ((log.previousSignature ?? null) !== expectedPreviousSignature) {
            return { valid: false, failedId: log.id, count: index + 1 };
          }
    
          const expectedSignature = computeAuditSignature(
            buildAuditSignableData(log),
            expectedPreviousSignature
          );
    
          if (signature !== expectedSignature) {
            return { valid: false, failedId: log.id, count: index + 1 };
          }
    
          expectedPreviousSignature = signature;
        }
    
        return { valid: true, count: orderedLogs.length };
      },

    async getAuditLogsDetailed(
        organizationId: string,
        query: {
          page?: number;
          limit?: number;
          entityType?: string;
          action?: string;
          dateFrom?: Date;
          dateTo?: Date;
        }
      ): Promise<{ data: AuditLog[]; total: number }> {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 50, 100);
        const offset = (page - 1) * limit;
    
        const conditions = [eq(auditLogs.organizationId, organizationId)];
        if (query.entityType) conditions.push(eq(auditLogs.resourceType, query.entityType));
        if (query.action) conditions.push(eq(auditLogs.action, query.action));
        if (query.dateFrom) conditions.push(gte(auditLogs.timestamp, query.dateFrom));
        if (query.dateTo) conditions.push(lte(auditLogs.timestamp, query.dateTo));
    
        const [countResult] = await dbClient.select({ total: count() })
          .from(auditLogs)
          .where(and(...conditions));
        
        const total = countResult?.total ?? 0;
    
        const data = await dbClient.select()
          .from(auditLogs)
          .where(and(...conditions))
          .orderBy(desc(auditLogs.timestamp))
          .limit(limit)
          .offset(offset);
    
        return { data, total };
      },

    async getAuditStats(organizationId: string): Promise<{
        totalEvents: number;
        highRiskEvents: number;
        actions: Record<string, number>;
        entities: Record<string, number>;
        totalActions: number;
        activeUsers: number;
        actionsByType: Record<string, number>;
        recentActivity: Array<{ date: string; count: number }>;
      }> {
        const results = await dbClient.select()
          .from(auditLogs)
          .where(eq(auditLogs.organizationId, organizationId))
          .limit(10000);
    
        const actions = {} as Record<string, number>;
        const entities = {} as Record<string, number>;
        const activeUsersSet = new Set<string>();
        
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        let recentCount = 0;
        
        for (const log of results) {
          if (log.action) {
            actions[log.action] = (actions[log.action] || 0) + 1;
          }
          if (log.resourceType) {
            entities[log.resourceType] = (entities[log.resourceType] || 0) + 1;
          }
          if (log.userId) {
            activeUsersSet.add(log.userId);
          }
          if (log.timestamp && new Date(log.timestamp) >= oneDayAgo) {
            recentCount++;
          }
        }
        
        return {
          totalEvents: results.length,
          highRiskEvents: results.filter((r: any) => r.riskLevel === 'high' || r.riskLevel === 'critical').length,
          actions,
          entities,
          
          totalActions: results.length,
          activeUsers: activeUsersSet.size,
          actionsByType: actions,
          recentActivity: [
            {
              date: "Last 24h",
              count: recentCount
            }
          ]
        };
      },

  };
}




import type { InsertAuditTrail } from "@shared/schema";

/**
 * Audit Service for logging all system activities
 * Provides methods to create audit trail entries for different actions
 */
export class AuditService {
  
  /**
   * Log document-related activities
   */
  static async logDocumentActivity(data: {
    action: "create" | "update" | "delete" | "view" | "download" | "approve" | "reject" | "publish" | "archive";
    documentId: string;
    userId: string;
    userEmail?: string;
    userName?: string;
    organizationId?: string;
    oldValues?: any;
    newValues?: any;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }): Promise<void> {
    const auditEntry: InsertAuditTrail = {
      entityType: "document",
      entityId: data.documentId,
      action: data.action,
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      organizationId: data.organizationId,
      oldValues: data.oldValues,
      newValues: data.newValues,
      metadata: {
        ...data.metadata,
        timestamp: new Date().toISOString(),
        source: "document_service"
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      sessionId: data.sessionId,
    };

    // In real implementation, save to database
    console.log("Audit Log:", auditEntry);
  }

  /**
   * Log company profile activities
   */
  static async logCompanyProfileActivity(data: {
    action: "create" | "update" | "delete" | "view";
    profileId: string;
    userId: string;
    userEmail?: string;
    userName?: string;
    organizationId?: string;
    oldValues?: any;
    newValues?: any;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }): Promise<void> {
    const auditEntry: InsertAuditTrail = {
      entityType: "company_profile",
      entityId: data.profileId,
      action: data.action,
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      organizationId: data.organizationId,
      oldValues: data.oldValues,
      newValues: data.newValues,
      metadata: {
        ...data.metadata,
        timestamp: new Date().toISOString(),
        source: "company_profile_service"
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      sessionId: data.sessionId,
    };

    console.log("Audit Log:", auditEntry);
  }

  /**
   * Log user activities
   */
  static async logUserActivity(data: {
    action: "create" | "update" | "delete" | "view";
    targetUserId: string;
    actorUserId: string;
    actorEmail?: string;
    actorName?: string;
    organizationId?: string;
    oldValues?: any;
    newValues?: any;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }): Promise<void> {
    const auditEntry: InsertAuditTrail = {
      entityType: "user",
      entityId: data.targetUserId,
      action: data.action,
      userId: data.actorUserId,
      userEmail: data.actorEmail,
      userName: data.actorName,
      organizationId: data.organizationId,
      oldValues: data.oldValues,
      newValues: data.newValues,
      metadata: {
        ...data.metadata,
        timestamp: new Date().toISOString(),
        source: "user_service"
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      sessionId: data.sessionId,
    };

    console.log("Audit Log:", auditEntry);
  }

  /**
   * Log organization activities
   */
  static async logOrganizationActivity(data: {
    action: "create" | "update" | "delete" | "view";
    organizationId: string;
    userId: string;
    userEmail?: string;
    userName?: string;
    oldValues?: any;
    newValues?: any;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }): Promise<void> {
    const auditEntry: InsertAuditTrail = {
      entityType: "organization",
      entityId: data.organizationId,
      action: data.action,
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      organizationId: data.organizationId,
      oldValues: data.oldValues,
      newValues: data.newValues,
      metadata: {
        ...data.metadata,
        timestamp: new Date().toISOString(),
        source: "organization_service"
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      sessionId: data.sessionId,
    };

    console.log("Audit Log:", auditEntry);
  }

  /**
   * Log template activities
   */
  static async logTemplateActivity(data: {
    action: "create" | "update" | "delete" | "view";
    templateId: string;
    userId: string;
    userEmail?: string;
    userName?: string;
    organizationId?: string;
    oldValues?: any;
    newValues?: any;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }): Promise<void> {
    const auditEntry: InsertAuditTrail = {
      entityType: "template",
      entityId: data.templateId,
      action: data.action,
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      organizationId: data.organizationId,
      oldValues: data.oldValues,
      newValues: data.newValues,
      metadata: {
        ...data.metadata,
        timestamp: new Date().toISOString(),
        source: "template_service"
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      sessionId: data.sessionId,
    };

    console.log("Audit Log:", auditEntry);
  }

  /**
   * Get audit trail entries with filtering
   */
  static async getAuditTrail(filters: {
    entityType?: string;
    entityId?: string;
    action?: string;
    userId?: string;
    organizationId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    // In real implementation, query database with filters
    // For now, return mock data
    return [];
  }

  /**
   * Get audit statistics
   */
  static async getAuditStatistics(organizationId?: string): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByAction: Record<string, number>;
    topUsers: Array<{ userId: string; userName: string; eventCount: number; }>;
    recentActivity: any[];
  }> {
    // In real implementation, aggregate from database
    return {
      totalEvents: 0,
      eventsByType: {},
      eventsByAction: {},
      topUsers: [],
      recentActivity: []
    };
  }
}
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { storage } from '../storage';
import { logger } from '../utils/logger';
import { isLocalMode } from '../config/runtime';
import { type AuditLog, type AuditActionType } from '@shared/schema';

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

export const AuditAction = {
  READ: 'view',
  VIEW: 'view',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  DOWNLOAD: 'download',
  APPROVE: 'approve',
  REJECT: 'reject',
  PUBLISH: 'publish',
  ARCHIVE: 'archive',
  GENERATE_INSIGHTS: 'generate_insights',
  ANALYZE: 'analyze',
  EXTRACT: 'extract',
  CHAT: 'chat',
  ASSESS: 'assess',
  SCORE: 'score',
  DATA_EXPORT: 'download'
} as const;

export interface AuditLogEntry {
  userId?: string;
  organizationId?: string;
  action: AuditActionType | string;
  resourceType?: string;
  resourceId?: string;
  entityType?: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  riskLevel?: RiskLevel;
  additionalContext?: Record<string, any>;
  details?: Record<string, any>;
}

export class AuditService {
  /**
   * Log an audit event
   */
  async logEvent(entry: AuditLogEntry): Promise<void> {
    await this.logAuditEvent(entry);
  }

  /**
   * Alias for logEvent to match legacy API
   */
  async logAudit(entry: AuditLogEntry): Promise<void> {
    await this.logAuditEvent(entry);
  }

  /**
   * Alias for logEvent to match legacy API from errorHandling
   */
  async logAction(entry: AuditLogEntry): Promise<void> {
    await this.logAuditEvent(entry);
  }

  async logAuditEvent(entry: AuditLogEntry): Promise<void> {
    try {
      const resourceType = entry.resourceType || entry.entityType || 'unknown';
      const resourceId = entry.resourceId || entry.entityId;
      const metadata = entry.metadata ?? entry.additionalContext ?? entry.details;
      const riskLevel = entry.riskLevel ?? RiskLevel.LOW;
      const auditId = isLocalMode()
        ? `${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
        : crypto.randomUUID();

      const auditRecord = {
        id: auditId,
        userId: entry.userId || null,
        organizationId: entry.organizationId || null,
        action: entry.action,
        resourceType,
        resourceId: resourceId || null,
        oldValues: entry.oldValues || null,
        newValues: entry.newValues || null,
        ipAddress: entry.ipAddress || 'unknown',
        userAgent: entry.userAgent || null,
        riskLevel,
        additionalContext: metadata || null,
        timestamp: new Date()
      };

      // HMAC Chaining for integrity
      const previousSignature = await this.getLastSignature();
      const signableData = JSON.stringify({
        userId: auditRecord.userId,
        orgId: auditRecord.organizationId,
        action: auditRecord.action,
        resource: `${auditRecord.resourceType}:${auditRecord.resourceId}`,
        timestamp: auditRecord.timestamp.toISOString()
      });
      
      const signature = this.computeSignature(signableData, previousSignature);

      // Insert into database via storage
      await storage.createAuditEntry({
        ...auditRecord,
        signature,
        previousSignature
      } as any);

      // Log to application logs
      logger.info('AUDIT', {
        action: entry.action,
        resource: `${resourceType}:${resourceId ?? 'unknown'}`,
        userId: entry.userId,
        organizationId: entry.organizationId,
        riskLevel,
        ip: entry.ipAddress
      });

      if (riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL) {
        logger.warn('HIGH_RISK_AUDIT_EVENT', {
          ...auditRecord,
          severity: 'HIGH_RISK'
        });
      }

    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to log audit event', { 
        error: errMessage, 
        auditEntry: entry 
      });
    }
  }

  /**
   * Create audit log from Express request
   */
  async auditFromRequest(
    req: Request, 
    action: string,
    resourceType: string,
    resourceId?: string,
    additionalContext?: Record<string, any>
  ): Promise<void> {
    const entry: AuditLogEntry = {
      userId: (req as any).user?.id,
      organizationId: (req as any).user?.organizationId || (req as any).organizationId,
      action,
      resourceType,
      resourceId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      riskLevel: this.calculateRiskLevel(action, resourceType),
      additionalContext
    };

    await this.logAuditEvent(entry);
  }

  /**
   * Retrieve audit logs with filtering and pagination
   */
  async retrieve(organizationId: string, filters: any = {}): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 50;

      const { data, total } = await storage.getAuditLogsDetailed(organizationId, {
        page,
        limit,
        entityType: filters.entityType,
        action: filters.action,
        dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
      });

      return {
        data,
        total,
        page,
        limit
      };
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to retrieve audit logs', { error: errMessage });
      return { data: [], total: 0, page: 1, limit: 50 };
    }
  }

  /**
   * Alias for retrieve() to match test expectations
   */
  async getAuditLogs(organizationId: string, filters: any = {}): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.retrieve(organizationId, filters);
  }

  /**
   * Get a specific audit log by ID
   */
  async getAuditById(id: string, organizationId: string): Promise<AuditLog | null> {
    try {
      return await storage.getAuditLogById(id, organizationId);
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get audit log by ID', { id, organizationId, error: errMessage });
      return null;
    }
  }

  /**
   * Get audit statistics for dashboard
   */
  async getStats(organizationId: string): Promise<any> {
    try {
      return await storage.getAuditStats(organizationId);
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get audit statistics', { error: errMessage });
      return {
        totalEvents: 0,
        highRiskEvents: 0,
        actions: {},
        entities: {}
      };
    }
  }

  /**
   * Alias for getStats() to match test expectations
   */
  async getAuditStats(organizationId: string): Promise<any> {
    return this.getStats(organizationId);
  }

  /**
   * Log a data access event
   */
  async auditDataAccess(
    userId: string,
    organizationId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    req?: Request
  ): Promise<void> {
    const entry: AuditLogEntry = {
      userId,
      organizationId,
      action,
      resourceType,
      resourceId,
      ipAddress: req?.ip || 'unknown',
      userAgent: req?.get('User-Agent'),
      riskLevel: this.calculateRiskLevel(action, resourceType)
    };

    await this.logAuditEvent(entry);
  }

  /**
   * Log an authentication event
   */
  async auditAuthEvent(
    action: string,
    userId: string | null,
    organizationId: string | null,
    req?: Request,
    success: boolean = true
  ): Promise<void> {
    const riskLevel = action === 'failed_login' ? RiskLevel.MEDIUM : RiskLevel.LOW;

    const entry: AuditLogEntry = {
      userId: userId || undefined,
      organizationId: organizationId || undefined,
      action,
      resourceType: 'authentication',
      ipAddress: req?.ip || 'unknown',
      userAgent: req?.get('User-Agent'),
      riskLevel,
      additionalContext: { success }
    };

    await this.logAuditEvent(entry);
  }

  /**
   * Verify the integrity of the audit log chain
   */
  async verifyChain(limit = 100): Promise<{ valid: boolean; failedId?: string; count: number }> {
    try {
      // Direct storage access for verification
      const result = await storage.verifyAuditChain(limit);
      return result;
    } catch (error) {
      logger.error('Error during audit chain verification', { error });
      return { valid: false, count: 0 };
    }
  }

  /**
   * Compute HMAC signature for audit log chaining
   */
  private computeSignature(data: string, previousSignature: string | null): string {
    const secret = process.env.AUDIT_LOG_SECRET || 'dev-audit-secret-key-32-chars-long';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    if (previousSignature) {
      hmac.update(previousSignature);
    }
    return hmac.digest('hex');
  }

  /**
   * Get the most recent audit log signature
   */
  private async getLastSignature(): Promise<string | null> {
    try {
      // This is a bit of a circular dependency if we use storage.getLastAuditSignature
      // But we can implement a specific method in storage for this.
      // For now, let's assume we can get it from storage.
      const stats = await storage.getAuditLogsDetailed('any', { limit: 1 });
      return stats.data[0]?.signature || null;
    } catch {
      return null;
    }
  }

  /**
   * Generate a comprehensive audit report
   */
  async generateAuditReport(startDate: Date, endDate: Date, organizationId: string): Promise<any> {
    const logs = await storage.getAuditLogsByDateRange(startDate, endDate, organizationId);
    
    // Calculate stats
    const stats = {
      totalEvents: logs.length,
      byAction: {} as Record<string, number>,
      byUser: {} as Record<string, number>,
      byRisk: {
        [RiskLevel.LOW]: 0,
        [RiskLevel.MEDIUM]: 0,
        [RiskLevel.HIGH]: 0,
        [RiskLevel.CRITICAL]: 0
      }
    };

    logs.forEach(log => {
      // Action stats
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      
      // User stats
      if (log.userId) {
        stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;
      }

      // Risk stats
      const risk = (log.riskLevel as RiskLevel) || RiskLevel.LOW;
      if (risk in stats.byRisk) {
        stats.byRisk[risk]++;
      }
    });

    return {
      period: { startDate, endDate },
      organizationId,
      summary: stats,
      events: logs
    };
  }

  private calculateRiskLevel(action: string, resourceType: string): RiskLevel {
    const actionLower = action.toLowerCase();
    const resourceLower = resourceType.toLowerCase();

    // Critical: delete user accounts
    if (actionLower === 'delete' && resourceLower === 'user') {
      return RiskLevel.CRITICAL;
    }

    // High: general delete, archive, reject actions
    const highRiskActions = ['delete', 'archive', 'reject'];
    if (highRiskActions.includes(actionLower)) {
      return RiskLevel.HIGH;
    }

    // Medium: failed login attempts
    if (actionLower === 'failed_login') {
      return RiskLevel.MEDIUM;
    }

    // Medium: update actions
    if (actionLower === 'update') {
      return RiskLevel.MEDIUM;
    }

    // Low: read, view, create, and other actions
    return RiskLevel.LOW;
  }
}

export const auditService = new AuditService();

// Middleware to automatically audit API requests
export function auditMiddleware(action: string, resourceType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await auditService.auditFromRequest(req, action, resourceType);
      next();
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Audit middleware failed', { error: errMessage });
      next(); // Continue even if audit fails
    }
  };
}

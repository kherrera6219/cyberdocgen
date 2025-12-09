import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { logger } from '../utils/logger';

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ', 
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  FAILED_LOGIN = 'FAILED_LOGIN',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  DATA_EXPORT = 'DATA_EXPORT',
  SENSITIVE_ACCESS = 'SENSITIVE_ACCESS',
  CONFIG_CHANGE = 'CONFIG_CHANGE'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AuditLogEntry {
  userId?: string;
  organizationId?: string;
  action: AuditAction;
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

  // Backwards compatibility wrapper
  async logAudit(entry: AuditLogEntry): Promise<void> {
    await this.logAuditEvent(entry);
  }

  async logAction(entry: Omit<AuditLogEntry, 'action'> & { action: AuditAction | string }): Promise<void> {
    const normalizedAction = (Object.values(AuditAction) as string[]).includes(entry.action)
      ? (entry.action as AuditAction)
      : AuditAction.CREATE;

    await this.logAuditEvent({ ...entry, action: normalizedAction });
  }

  /**
   * Log an audit event
   */
  async logAuditEvent(entry: AuditLogEntry): Promise<void> {
    try {
      const resourceType = entry.resourceType || entry.entityType || 'unknown';
      const resourceId = entry.resourceId || entry.entityId;
      const metadata = entry.metadata ?? entry.additionalContext ?? entry.details;
      const riskLevel = entry.riskLevel ?? RiskLevel.LOW;

      // Insert into audit_logs table (to be created in database)
      const auditRecord = {
        id: crypto.randomUUID(),
        userId: entry.userId,
        organizationId: entry.organizationId,
        action: entry.action,
        resourceType,
        resourceId,
        oldValues: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        newValues: entry.newValues ? JSON.stringify(entry.newValues) : null,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        riskLevel,
        additionalContext: metadata ? JSON.stringify(metadata) : null,
        timestamp: new Date()
      };

      // Insert into database audit_logs table
      try {
        const { auditLogs } = await import('../../shared/schema');
        await db.insert(auditLogs).values(auditRecord);
      } catch (dbError: any) {
        logger.error('Failed to insert audit log to database', { error: dbError?.message || 'Unknown error' });
        // Continue with application logging even if database insert fails
      }

      // Log to application logs
      logger.info('AUDIT', {
        action: entry.action,
        resource: `${resourceType}:${resourceId ?? 'unknown'}`,
        userId: entry.userId,
        organizationId: entry.organizationId,
        riskLevel,
        ip: entry.ipAddress
      });

      // High-risk events get additional logging
      if (riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL) {
        logger.warn('HIGH_RISK_AUDIT_EVENT', {
          ...auditRecord,
          severity: 'HIGH_RISK'
        });
      }

    } catch (error: any) {
      logger.error('Failed to log audit event', { 
        error: error?.message || 'Unknown error', 
        auditEntry: entry 
      });
    }
  }

  /**
   * Create audit log from Express request
   */
  async auditFromRequest(
    req: Request, 
    action: AuditAction,
    resourceType: string,
    resourceId?: string,
    additionalContext?: Record<string, any>
  ): Promise<void> {
    const entry: AuditLogEntry = {
      userId: (req as any).user?.id,
      organizationId: (req as any).user?.organizationId,
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
   * Log data access for sensitive information
   */
  async auditDataAccess(
    userId: string,
    organizationId: string,
    dataType: string,
    dataId: string,
    accessType: 'VIEW' | 'DOWNLOAD' | 'EXPORT',
    req: Request
  ): Promise<void> {
    await this.logAuditEvent({
      userId,
      organizationId,
      action: AuditAction.SENSITIVE_ACCESS,
      resourceType: `sensitive_${dataType}`,
      resourceId: dataId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      riskLevel: RiskLevel.HIGH,
      additionalContext: { accessType }
    });
  }

  /**
   * Log authentication events
   */
  async auditAuthEvent(
    action: AuditAction.LOGIN | AuditAction.LOGOUT | AuditAction.FAILED_LOGIN,
    userId?: string,
    req?: Request,
    additionalContext?: Record<string, any>
  ): Promise<void> {
    await this.logAuditEvent({
      userId,
      action,
      resourceType: 'authentication',
      ipAddress: req?.ip || 'unknown',
      userAgent: req?.get('User-Agent'),
      riskLevel: action === AuditAction.FAILED_LOGIN ? RiskLevel.MEDIUM : RiskLevel.LOW,
      additionalContext
    });
  }

  async getAuditLogs(query: {
    page?: number;
    limit?: number;
    entityType?: string;
    action?: string;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{ data: AuditLogEntry[]; page: number; limit: number; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    // Minimal placeholder implementation until full audit trail querying is wired up
    return {
      data: [],
      page,
      limit,
      total: 0,
    };
  }

  async getAuditStats(): Promise<{
    totalEvents: number;
    highRiskEvents: number;
    actions: Record<string, number>;
    entities: Record<string, number>;
  }> {
    return {
      totalEvents: 0,
      highRiskEvents: 0,
      actions: {},
      entities: {},
    };
  }

  /**
   * Calculate risk level based on action and resource type
   */
  private calculateRiskLevel(action: AuditAction, resourceType: string): RiskLevel {
    // High risk actions
    if ([
      AuditAction.DELETE,
      AuditAction.DATA_EXPORT,
      AuditAction.CONFIG_CHANGE,
      AuditAction.UNAUTHORIZED_ACCESS
    ].includes(action)) {
      return RiskLevel.HIGH;
    }

    // Medium risk for sensitive resources
    if (resourceType.includes('profile') || resourceType.includes('document')) {
      if (action === AuditAction.UPDATE) return RiskLevel.MEDIUM;
      if (action === AuditAction.CREATE) return RiskLevel.MEDIUM;
    }

    // Failed authentication is medium risk
    if (action === AuditAction.FAILED_LOGIN) {
      return RiskLevel.MEDIUM;
    }

    return RiskLevel.LOW;
  }

  /**
   * Generate audit report for compliance
   */
  async generateAuditReport(
    startDate: Date,
    endDate: Date,
    organizationId?: string
  ): Promise<{
    totalEvents: number;
    eventsByRisk: Record<RiskLevel, number>;
    eventsByAction: Record<AuditAction, number>;
    highRiskEvents: AuditLogEntry[];
  }> {
    // Initialize counters - placeholder until full database query is implemented
    const eventsByRisk: Record<RiskLevel, number> = {
      [RiskLevel.LOW]: 0,
      [RiskLevel.MEDIUM]: 0,
      [RiskLevel.HIGH]: 0,
      [RiskLevel.CRITICAL]: 0
    };

    const eventsByAction: Record<string, number> = {};
    const highRiskEvents: AuditLogEntry[] = [];

    // Note: Full implementation would query database with date range and organizationId filters
    // For now, return empty report structure
    logger.info('Generating audit report', { startDate, endDate, organizationId });

    return {
      totalEvents: 0,
      eventsByRisk,
      eventsByAction: eventsByAction as Record<AuditAction, number>,
      highRiskEvents
    };
  }
}

export const auditService = new AuditService();

// Legacy method aliases for backward compatibility
(auditService as any).logAction = async (params: any) => {
  // Convert old format to new format
  const req = {
    ip: params.ipAddress,
    get: (header: string) => header === 'User-Agent' ? params.userAgent : undefined,
    user: { id: params.userId }
  } as any;
  
  const action = params.action === 'view' ? AuditAction.READ : 
                params.action === 'create' ? AuditAction.CREATE :
                params.action === 'update' ? AuditAction.UPDATE :
                params.action === 'delete' ? AuditAction.DELETE :
                AuditAction.READ;
  
  return auditService.auditFromRequest(req, action, params.entityType, params.entityId, params.metadata);
};

(auditService as any).logAudit = (auditService as any).logAction;

// Middleware to automatically audit API requests
export function auditMiddleware(action: AuditAction, resourceType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await auditService.auditFromRequest(req, action, resourceType);
      next();
    } catch (error: any) {
      logger.error('Audit middleware failed', { error: error?.message || 'Unknown error' });
      next(); // Continue even if audit fails
    }
  };
}
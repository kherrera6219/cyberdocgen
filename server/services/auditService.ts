import { db } from "../db";
import { auditTrail, type InsertAuditTrail } from "@shared/schema";
import { logger } from "../utils/logger";
import { eq, desc, and, gte, lte, ilike, count } from "drizzle-orm";

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditQuery {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  search?: string;
}

export interface AuditStats {
  totalActions: number;
  actionsByType: Record<string, number>;
  activeUsers: number;
  recentActivity: {
    period: string;
    count: number;
  }[];
}

class AuditService {
  async logAction(entry: AuditLogEntry): Promise<void> {
    try {
      const auditEntry: InsertAuditTrail = {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        userId: entry.userId,
        details: entry.details || {},
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        timestamp: new Date(),
      };

      await db.insert(auditTrail).values(auditEntry);
      
      logger.audit(
        entry.action,
        `${entry.entityType}:${entry.entityId}`,
        entry.userId,
        entry.details
      );
    } catch (error: any) {
      logger.error("Failed to log audit action", {
        error: error.message,
        entry,
      });
      throw error;
    }
  }

  async getAuditLogs(query: AuditQuery): Promise<{
    logs: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const { page = 1, limit = 50, search, dateFrom, dateTo, ...filters } = query;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [];
      
      if (filters.userId) {
        conditions.push(eq(auditTrail.userId, filters.userId));
      }
      
      if (filters.entityType) {
        conditions.push(eq(auditTrail.entityType, filters.entityType));
      }
      
      if (filters.entityId) {
        conditions.push(eq(auditTrail.entityId, filters.entityId));
      }
      
      if (filters.action) {
        conditions.push(eq(auditTrail.action, filters.action));
      }
      
      if (dateFrom) {
        conditions.push(gte(auditTrail.timestamp, dateFrom));
      }
      
      if (dateTo) {
        conditions.push(lte(auditTrail.timestamp, dateTo));
      }
      
      if (search) {
        conditions.push(ilike(auditTrail.action, `%${search}%`));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [{ count: total }] = await db
        .select({ count: count() })
        .from(auditTrail)
        .where(whereClause);

      // Get paginated results
      const logs = await db
        .select()
        .from(auditTrail)
        .where(whereClause)
        .orderBy(desc(auditTrail.timestamp))
        .offset(offset)
        .limit(limit);

      return {
        logs,
        total,
        page,
        limit,
      };
    } catch (error) {
      logger.error("Failed to retrieve audit logs", {
        error: error.message,
        query,
      });
      throw error;
    }
  }

  async getAuditStats(dateFrom?: Date, dateTo?: Date): Promise<AuditStats> {
    try {
      const conditions = [];
      
      if (dateFrom) {
        conditions.push(gte(auditTrail.timestamp, dateFrom));
      }
      
      if (dateTo) {
        conditions.push(lte(auditTrail.timestamp, dateTo));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total actions
      const [{ count: totalActions }] = await db
        .select({ count: count() })
        .from(auditTrail)
        .where(whereClause);

      // Get actions by type
      const actionTypes = await db
        .select({
          action: auditTrail.action,
          count: count(),
        })
        .from(auditTrail)
        .where(whereClause)
        .groupBy(auditTrail.action);

      const actionsByType = actionTypes.reduce((acc, { action, count }) => {
        acc[action] = count;
        return acc;
      }, {} as Record<string, number>);

      // Get active users count
      const activeUsersResult = await db
        .selectDistinct({ userId: auditTrail.userId })
        .from(auditTrail)
        .where(whereClause);

      const activeUsers = activeUsersResult.length;

      // Get recent activity (placeholder for time-based aggregation)
      const recentActivity = [
        { period: "Today", count: Math.floor(totalActions * 0.3) },
        { period: "This Week", count: Math.floor(totalActions * 0.7) },
        { period: "This Month", count: totalActions },
      ];

      return {
        totalActions,
        actionsByType,
        activeUsers,
        recentActivity,
      };
    } catch (error) {
      logger.error("Failed to retrieve audit statistics", {
        error: error.message,
      });
      throw error;
    }
  }

  async deleteOldAuditLogs(olderThan: Date): Promise<number> {
    try {
      const result = await db
        .delete(auditTrail)
        .where(lte(auditTrail.timestamp, olderThan));

      logger.info(`Deleted ${result.rowCount || 0} old audit log entries`, {
        olderThan: olderThan.toISOString(),
      });

      return result.rowCount || 0;
    } catch (error) {
      logger.error("Failed to delete old audit logs", {
        error: error.message,
        olderThan: olderThan.toISOString(),
      });
      throw error;
    }
  }
}

export const auditService = new AuditService();
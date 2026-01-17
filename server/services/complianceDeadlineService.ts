/**
 * Compliance Deadline Tracking Service - Phase 5
 * Manages compliance deadlines, reminders, and overdue tracking
 */

import { db } from "../db";
import { logger } from "../utils/logger";
import { storage } from "../storage";
import { auditService, AuditAction, RiskLevel } from "./auditService";

export interface ComplianceDeadline {
  id: string;
  organizationId: string;
  framework: string;
  controlId?: string;
  title: string;
  description?: string;
  dueDate: Date;
  status: "pending" | "in_progress" | "completed" | "overdue" | "extended";
  priority: "low" | "normal" | "high" | "critical";
  assigneeId?: string;
  reminders: ReminderConfig[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  extendedTo?: Date;
  extensionReason?: string;
}

export interface ReminderConfig {
  daysBefore: number;
  sent: boolean;
  sentAt?: Date;
}

export interface DeadlineStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  upcomingThisWeek: number;
  upcomingThisMonth: number;
}

export interface DeadlineCreateRequest {
  organizationId: string;
  framework: string;
  controlId?: string;
  title: string;
  description?: string;
  dueDate: Date;
  priority?: "low" | "normal" | "high" | "critical";
  assigneeId?: string;
  reminderDays?: number[];
  createdBy: string;
}

export interface DeadlineUpdateRequest {
  title?: string;
  description?: string;
  dueDate?: Date;
  status?: "pending" | "in_progress" | "completed" | "overdue" | "extended";
  priority?: "low" | "normal" | "high" | "critical";
  assigneeId?: string;
}

export class ComplianceDeadlineService {
  private deadlines: Map<string, ComplianceDeadline> = new Map();
  private deadlineCounter = 0;

  /**
   * Create a new compliance deadline
   */
  async createDeadline(request: DeadlineCreateRequest): Promise<ComplianceDeadline> {
    try {
      const id = `deadline-${++this.deadlineCounter}-${Date.now()}`;
      const now = new Date();

      const reminders: ReminderConfig[] = (request.reminderDays || [30, 14, 7, 1]).map(
        (days) => ({ daysBefore: days, sent: false })
      );

      const deadline: ComplianceDeadline = {
        id,
        organizationId: request.organizationId,
        framework: request.framework,
        controlId: request.controlId,
        title: request.title,
        description: request.description,
        dueDate: request.dueDate,
        status: "pending",
        priority: request.priority || "normal",
        assigneeId: request.assigneeId,
        reminders,
        createdBy: request.createdBy,
        createdAt: now,
        updatedAt: now,
      };

      this.deadlines.set(id, deadline);

      await auditService.logAuditEvent({
        action: AuditAction.CREATE,
        resourceType: "compliance_deadline",
        resourceId: id,
        userId: request.createdBy,
        organizationId: request.organizationId,
        ipAddress: "system",
        riskLevel: RiskLevel.LOW,
        additionalContext: {
          framework: request.framework,
          dueDate: request.dueDate.toISOString(),
          priority: request.priority,
        },
      });

      logger.info("Compliance deadline created", {
        id,
        framework: request.framework,
        dueDate: request.dueDate.toISOString(),
      });

      return deadline;
    } catch (error: any) {
      logger.error("Failed to create compliance deadline", { error: error.message });
      throw error;
    }
  }

  /**
   * Get a deadline by ID
   */
  async getDeadline(id: string): Promise<ComplianceDeadline | null> {
    return this.deadlines.get(id) || null;
  }

  /**
   * Get all deadlines for an organization
   */
  async getDeadlinesByOrganization(
    organizationId: string,
    filters?: {
      framework?: string;
      status?: string;
      priority?: string;
      assigneeId?: string;
    }
  ): Promise<ComplianceDeadline[]> {
    let deadlines = Array.from(this.deadlines.values()).filter(
      (d) => d.organizationId === organizationId
    );

    if (filters) {
      if (filters.framework) {
        deadlines = deadlines.filter((d) => d.framework === filters.framework);
      }
      if (filters.status) {
        deadlines = deadlines.filter((d) => d.status === filters.status);
      }
      if (filters.priority) {
        deadlines = deadlines.filter((d) => d.priority === filters.priority);
      }
      if (filters.assigneeId) {
        deadlines = deadlines.filter((d) => d.assigneeId === filters.assigneeId);
      }
    }

    return deadlines.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /**
   * Update a deadline
   */
  async updateDeadline(
    id: string,
    updates: DeadlineUpdateRequest,
    userId: string
  ): Promise<ComplianceDeadline | null> {
    const deadline = this.deadlines.get(id);
    if (!deadline) {
      return null;
    }

    const oldValues = { ...deadline };

    if (updates.title !== undefined) deadline.title = updates.title;
    if (updates.description !== undefined) deadline.description = updates.description;
    if (updates.dueDate !== undefined) deadline.dueDate = updates.dueDate;
    if (updates.status !== undefined) {
      deadline.status = updates.status;
      if (updates.status === "completed") {
        deadline.completedAt = new Date();
      }
    }
    if (updates.priority !== undefined) deadline.priority = updates.priority;
    if (updates.assigneeId !== undefined) deadline.assigneeId = updates.assigneeId;

    deadline.updatedAt = new Date();

    this.deadlines.set(id, deadline);

    await auditService.logAuditEvent({
      action: AuditAction.UPDATE,
      resourceType: "compliance_deadline",
      resourceId: id,
      userId,
      organizationId: deadline.organizationId,
      ipAddress: "system",
      riskLevel: RiskLevel.LOW,
      oldValues,
      newValues: updates,
    });

    logger.info("Compliance deadline updated", { id, updates });

    return deadline;
  }

  /**
   * Extend a deadline
   */
  async extendDeadline(
    id: string,
    newDueDate: Date,
    reason: string,
    userId: string
  ): Promise<ComplianceDeadline | null> {
    const deadline = this.deadlines.get(id);
    if (!deadline) {
      return null;
    }

    const oldDueDate = deadline.dueDate;
    deadline.dueDate = newDueDate;
    deadline.status = "extended";
    deadline.extendedTo = newDueDate;
    deadline.extensionReason = reason;
    deadline.updatedAt = new Date();

    // Reset reminders for new date
    deadline.reminders = deadline.reminders.map((r) => ({ ...r, sent: false }));

    this.deadlines.set(id, deadline);

    await auditService.logAuditEvent({
      action: AuditAction.UPDATE,
      resourceType: "compliance_deadline",
      resourceId: id,
      userId,
      organizationId: deadline.organizationId,
      ipAddress: "system",
      riskLevel: RiskLevel.MEDIUM,
      additionalContext: {
        action: "extension",
        oldDueDate: oldDueDate.toISOString(),
        newDueDate: newDueDate.toISOString(),
        reason,
      },
    });

    logger.info("Compliance deadline extended", {
      id,
      oldDueDate: oldDueDate.toISOString(),
      newDueDate: newDueDate.toISOString(),
      reason,
    });

    return deadline;
  }

  /**
   * Mark a deadline as completed
   */
  async completeDeadline(id: string, userId: string): Promise<ComplianceDeadline | null> {
    return this.updateDeadline(id, { status: "completed" }, userId);
  }

  /**
   * Get deadline statistics for an organization
   */
  async getDeadlineStats(organizationId: string): Promise<DeadlineStats> {
    const deadlines = await this.getDeadlinesByOrganization(organizationId);
    const now = new Date();
    const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      total: deadlines.length,
      pending: deadlines.filter((d) => d.status === "pending").length,
      inProgress: deadlines.filter((d) => d.status === "in_progress").length,
      completed: deadlines.filter((d) => d.status === "completed").length,
      overdue: deadlines.filter((d) => d.status === "overdue" || (d.status !== "completed" && d.dueDate < now)).length,
      upcomingThisWeek: deadlines.filter(
        (d) => d.status !== "completed" && d.dueDate >= now && d.dueDate <= oneWeek
      ).length,
      upcomingThisMonth: deadlines.filter(
        (d) => d.status !== "completed" && d.dueDate >= now && d.dueDate <= oneMonth
      ).length,
    };
  }

  /**
   * Get overdue deadlines
   */
  async getOverdueDeadlines(organizationId: string): Promise<ComplianceDeadline[]> {
    const now = new Date();
    const deadlines = await this.getDeadlinesByOrganization(organizationId);

    return deadlines.filter(
      (d) => d.status !== "completed" && d.dueDate < now
    );
  }

  /**
   * Get upcoming deadlines
   */
  async getUpcomingDeadlines(
    organizationId: string,
    days: number = 30
  ): Promise<ComplianceDeadline[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const deadlines = await this.getDeadlinesByOrganization(organizationId);

    return deadlines.filter(
      (d) => d.status !== "completed" && d.dueDate >= now && d.dueDate <= futureDate
    );
  }

  /**
   * Check and update overdue deadlines
   */
  async checkOverdueDeadlines(): Promise<number> {
    const now = new Date();
    let updatedCount = 0;

    for (const [id, deadline] of this.deadlines) {
      if (
        deadline.status !== "completed" &&
        deadline.status !== "overdue" &&
        deadline.dueDate < now
      ) {
        deadline.status = "overdue";
        deadline.updatedAt = now;
        this.deadlines.set(id, deadline);
        updatedCount++;

        logger.warn("Deadline marked as overdue", {
          id,
          title: deadline.title,
          dueDate: deadline.dueDate.toISOString(),
        });
      }
    }

    if (updatedCount > 0) {
      logger.info("Overdue deadline check completed", { updatedCount });
    }

    return updatedCount;
  }

  /**
   * Process pending reminders
   */
  async processReminders(): Promise<{ sent: number; deadlines: string[] }> {
    const now = new Date();
    const sentReminders: string[] = [];

    for (const [id, deadline] of this.deadlines) {
      if (deadline.status === "completed") continue;

      for (const reminder of deadline.reminders) {
        if (reminder.sent) continue;

        const reminderDate = new Date(
          deadline.dueDate.getTime() - reminder.daysBefore * 24 * 60 * 60 * 1000
        );

        if (now >= reminderDate) {
          reminder.sent = true;
          reminder.sentAt = now;
          sentReminders.push(id);

          // Create notification for assignee
          if (deadline.assigneeId) {
            await this.createReminderNotification(deadline, reminder.daysBefore);
          }

          logger.info("Deadline reminder sent", {
            deadlineId: id,
            daysBefore: reminder.daysBefore,
            dueDate: deadline.dueDate.toISOString(),
          });
        }
      }

      this.deadlines.set(id, deadline);
    }

    return { sent: sentReminders.length, deadlines: sentReminders };
  }

  /**
   * Get deadlines grouped by framework
   */
  async getDeadlinesByFramework(
    organizationId: string
  ): Promise<Record<string, ComplianceDeadline[]>> {
    const deadlines = await this.getDeadlinesByOrganization(organizationId);
    const grouped: Record<string, ComplianceDeadline[]> = {};

    for (const deadline of deadlines) {
      if (!grouped[deadline.framework]) {
        grouped[deadline.framework] = [];
      }
      grouped[deadline.framework].push(deadline);
    }

    return grouped;
  }

  /**
   * Delete a deadline
   */
  async deleteDeadline(id: string, userId: string): Promise<boolean> {
    const deadline = this.deadlines.get(id);
    if (!deadline) {
      return false;
    }

    this.deadlines.delete(id);

    await auditService.logAuditEvent({
      action: AuditAction.DELETE,
      resourceType: "compliance_deadline",
      resourceId: id,
      userId,
      organizationId: deadline.organizationId,
      ipAddress: "system",
      riskLevel: RiskLevel.MEDIUM,
      additionalContext: {
        title: deadline.title,
        framework: deadline.framework,
      },
    });

    logger.info("Compliance deadline deleted", { id });

    return true;
  }

  private async createReminderNotification(
    deadline: ComplianceDeadline,
    daysBefore: number
  ): Promise<void> {
    if (!deadline.assigneeId) return;

    try {
      const message =
        daysBefore === 1
          ? `Compliance deadline "${deadline.title}" is due tomorrow!`
          : `Compliance deadline "${deadline.title}" is due in ${daysBefore} days`;

      await storage.createNotification({
        userId: deadline.assigneeId,
        type: "compliance",
        title: "Deadline Reminder",
        message,
        link: `/compliance/deadlines/${deadline.id}`,
        metadata: { 
          entityType: "compliance_deadline", 
          entityId: deadline.id,
          severity: deadline.priority === "critical" ? "critical" : deadline.priority === "high" ? "high" : "medium"
        },
      });
    } catch (error: any) {
      logger.error("Failed to create reminder notification", { error: error.message });
    }
  }
}

export const complianceDeadlineService = new ComplianceDeadlineService();

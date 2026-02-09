/**
 * Document Workflow Service - Phase 5
 * Automates document lifecycle management, approval workflows, and status transitions
 */

import { db } from "../db";
import { logger } from "../utils/logger";
import { auditService, AuditAction, RiskLevel } from "./auditService";
import { storage } from "../storage";
import { documents, documentApprovals, notifications } from "../../shared/schema";
import { eq, and, sql, inArray } from "drizzle-orm";

export type DocumentStatus = "draft" | "review" | "approved" | "published" | "archived";
export type WorkflowAction = "submit_for_review" | "approve" | "reject" | "publish" | "archive" | "restore";

export interface WorkflowTransition {
  from: DocumentStatus;
  to: DocumentStatus;
  action: WorkflowAction;
  requiresApproval: boolean;
  autoNotify: boolean;
}

export interface WorkflowConfig {
  transitions: WorkflowTransition[];
  approvalRequired: DocumentStatus[];
  autoArchiveDays?: number;
}

export interface WorkflowResult {
  success: boolean;
  documentId: string;
  previousStatus: DocumentStatus;
  newStatus: DocumentStatus;
  action: WorkflowAction;
  message: string;
  approvalCreated?: boolean;
  notificationsSent?: number;
}

export interface ApprovalRequest {
  documentId: string;
  requestedBy: string;
  approverIds: string[];
  comments?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  dueDate?: Date;
}

class DocumentWorkflowService {
  private readonly defaultConfig: WorkflowConfig = {
    transitions: [
      { from: "draft", to: "review", action: "submit_for_review", requiresApproval: false, autoNotify: true },
      { from: "review", to: "approved", action: "approve", requiresApproval: true, autoNotify: true },
      { from: "review", to: "draft", action: "reject", requiresApproval: true, autoNotify: true },
      { from: "approved", to: "published", action: "publish", requiresApproval: false, autoNotify: true },
      { from: "published", to: "archived", action: "archive", requiresApproval: false, autoNotify: false },
      { from: "archived", to: "draft", action: "restore", requiresApproval: false, autoNotify: false },
    ],
    approvalRequired: ["approved", "published"],
    autoArchiveDays: 365,
  };

  /**
   * Execute a workflow transition on a document
   */
  async executeTransition(
    documentId: string,
    action: WorkflowAction,
    userId: string,
    comments?: string
  ): Promise<WorkflowResult> {
    try {
      const document = await storage.getDocument(documentId);
      if (!document) {
        return {
          success: false,
          documentId,
          previousStatus: "draft",
          newStatus: "draft",
          action,
          message: "Document not found",
        };
      }

      const currentStatus = document.status as DocumentStatus;
      const transition = this.findTransition(currentStatus, action);

      if (!transition) {
        return {
          success: false,
          documentId,
          previousStatus: currentStatus,
          newStatus: currentStatus,
          action,
          message: `Invalid transition: Cannot ${action} from ${currentStatus} status`,
        };
      }

      // Check if approval is required
      if (transition.requiresApproval) {
        const hasApproval = await this.checkApprovalStatus(documentId);
        if (!hasApproval) {
          return {
            success: false,
            documentId,
            previousStatus: currentStatus,
            newStatus: currentStatus,
            action,
            message: "Approval required before this transition",
          };
        }
      }

      // Execute the transition
      await storage.updateDocument(documentId, {
        status: transition.to,
      });

      // Log audit event
      await auditService.logAuditEvent({
        action: AuditAction.UPDATE,
        resourceType: "document",
        resourceId: documentId,
        userId,
        ipAddress: "system",
        riskLevel: RiskLevel.MEDIUM,
        additionalContext: {
          workflowAction: action,
          previousStatus: currentStatus,
          newStatus: transition.to,
          comments,
        },
      });

      // Send notifications if configured
      let notificationsSent = 0;
      if (transition.autoNotify) {
        notificationsSent = await this.sendWorkflowNotifications(
          documentId,
          document.title || "Untitled Document",
          action,
          transition.to,
          userId
        );
      }

      logger.info("Document workflow transition completed", {
        documentId,
        action,
        from: currentStatus,
        to: transition.to,
        userId,
      });

      return {
        success: true,
        documentId,
        previousStatus: currentStatus,
        newStatus: transition.to,
        action,
        message: `Document ${action.replace("_", " ")} successfully`,
        notificationsSent,
      };
    } catch (error: any) {
      logger.error("Workflow transition failed", {
        documentId,
        action,
        error: error.message,
      });

      return {
        success: false,
        documentId,
        previousStatus: "draft",
        newStatus: "draft",
        action,
        message: `Workflow transition failed: ${error.message}`,
      };
    }
  }

  /**
   * Submit a document for review
   */
  async submitForReview(documentId: string, userId: string): Promise<WorkflowResult> {
    return this.executeTransition(documentId, "submit_for_review", userId);
  }

  /**
   * Create an approval request for a document
   */
  async createApprovalRequest(request: ApprovalRequest): Promise<{ success: boolean; approvalId?: string; message: string }> {
    try {
      const document = await storage.getDocument(request.documentId);
      if (!document) {
        return { success: false, message: "Document not found" };
      }

      if (document.status !== "review") {
        return { success: false, message: "Document must be in review status to request approval" };
      }

      // Create approval record
      const approval = await storage.createDocumentApproval({
        documentId: request.documentId,
        requestedBy: request.requestedBy,
        approverRole: "compliance_officer",
        assignedTo: request.approverIds[0],
        status: "pending",
        comments: request.comments,
        priority: request.priority || "medium",
        dueDate: request.dueDate,
      });

      // Send notifications to approvers
      for (const approverId of request.approverIds) {
        await this.createNotification(
          approverId,
          "compliance",
          `Document "${document.title}" requires your approval`,
          request.documentId
        );
      }

      logger.info("Approval request created", {
        documentId: request.documentId,
        approvalId: approval.id,
        approvers: request.approverIds.length,
      });

      return {
        success: true,
        approvalId: approval.id,
        message: "Approval request created successfully",
      };
    } catch (error: any) {
      logger.error("Failed to create approval request", {
        documentId: request.documentId,
        error: error.message,
      });
      return { success: false, message: error.message };
    }
  }

  /**
   * Process an approval decision
   */
  async processApproval(
    approvalId: string,
    decision: "approved" | "rejected",
    approverId: string,
    comments?: string
  ): Promise<WorkflowResult> {
    try {
      const approval = await storage.getDocumentApproval(approvalId);
      if (!approval) {
        return {
          success: false,
          documentId: "",
          previousStatus: "review",
          newStatus: "review",
          action: decision === "approved" ? "approve" : "reject",
          message: "Approval not found",
        };
      }

      // Update approval record
      await storage.updateDocumentApproval(approvalId, {
        status: decision,
        comments,
        approvedAt: decision === "approved" ? new Date() : undefined,
        rejectedAt: decision === "rejected" ? new Date() : undefined,
      });

      // Execute the workflow transition
      const action: WorkflowAction = decision === "approved" ? "approve" : "reject";
      const result = await this.executeTransition(
        approval.documentId,
        action,
        approverId,
        comments
      );

      return result;
    } catch (error: any) {
      logger.error("Failed to process approval", {
        approvalId,
        error: error.message,
      });

      return {
        success: false,
        documentId: "",
        previousStatus: "review",
        newStatus: "review",
        action: decision === "approved" ? "approve" : "reject",
        message: error.message,
      };
    }
  }

  /**
   * Get workflow status for a document
   */
  async getWorkflowStatus(documentId: string): Promise<{
    currentStatus: DocumentStatus;
    availableActions: WorkflowAction[];
    pendingApprovals: number;
    history: Array<{ action: string; timestamp: Date; userId: string }>;
  }> {
    const document = await storage.getDocument(documentId);
    if (!document) {
      return {
        currentStatus: "draft",
        availableActions: [],
        pendingApprovals: 0,
        history: [],
      };
    }

    const currentStatus = document.status as DocumentStatus;
    const availableActions = this.getAvailableActions(currentStatus);
    const pendingApprovals = await this.getPendingApprovalCount(documentId);

    return {
      currentStatus,
      availableActions,
      pendingApprovals,
      history: [],
    };
  }

  /**
   * Get documents awaiting approval
   */
  async getDocumentsAwaitingApproval(approverId: string): Promise<Array<{
    documentId: string;
    title: string;
    requestedBy: string;
    requestedAt: Date;
    priority: string;
  }>> {
    try {
      const approvals = await storage.getDocumentApprovals("pending");
      const filtered = approvals.filter(a => a.requestedBy === approverId || a.documentId);
      
      const results = await Promise.all(
        filtered.map(async (approval) => {
          const document = await storage.getDocument(approval.documentId);
          return {
            documentId: approval.documentId,
            title: document?.title || "Unknown",
            requestedBy: approval.requestedBy || "Unknown",
            requestedAt: approval.createdAt || new Date(),
            priority: approval.priority || "normal",
          };
        })
      );

      return results;
    } catch (error: any) {
      logger.error("Failed to get documents awaiting approval", { error: error.message });
      return [];
    }
  }

  /**
   * Bulk update document statuses
   */
  async bulkTransition(
    documentIds: string[],
    action: WorkflowAction,
    userId: string
  ): Promise<{ success: number; failed: number; results: WorkflowResult[] }> {
    const results: WorkflowResult[] = [];
    let success = 0;
    let failed = 0;

    for (const documentId of documentIds) {
      const result = await this.executeTransition(documentId, action, userId);
      results.push(result);
      if (result.success) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed, results };
  }

  private findTransition(from: DocumentStatus, action: WorkflowAction): WorkflowTransition | undefined {
    return this.defaultConfig.transitions.find(
      (t) => t.from === from && t.action === action
    );
  }

  private getAvailableActions(status: DocumentStatus): WorkflowAction[] {
    return this.defaultConfig.transitions
      .filter((t) => t.from === status)
      .map((t) => t.action);
  }

  private async checkApprovalStatus(documentId: string): Promise<boolean> {
    try {
      const approvals = await storage.getDocumentApprovals("approved");
      return approvals.some((a) => a.documentId === documentId);
    } catch {
      return false;
    }
  }

  private async getPendingApprovalCount(documentId: string): Promise<number> {
    try {
      const approvals = await storage.getDocumentApprovals("pending");
      return approvals.filter((a) => a.documentId === documentId).length;
    } catch {
      return 0;
    }
  }

  private async sendWorkflowNotifications(
    documentId: string,
    documentTitle: string,
    action: WorkflowAction,
    newStatus: DocumentStatus,
    triggeredBy: string
  ): Promise<number> {
    try {
      const messages: Record<WorkflowAction, string> = {
        submit_for_review: `Document "${documentTitle}" has been submitted for review`,
        approve: `Document "${documentTitle}" has been approved`,
        reject: `Document "${documentTitle}" has been rejected`,
        publish: `Document "${documentTitle}" has been published`,
        archive: `Document "${documentTitle}" has been archived`,
        restore: `Document "${documentTitle}" has been restored`,
      };
      const messageMap = new Map(Object.entries(messages));
      const notificationMessage = messageMap.get(action) || `Document "${documentTitle}" workflow updated`;

      await this.createNotification(
        triggeredBy,
        "document",
        notificationMessage,
        documentId
      );

      return 1;
    } catch (error: any) {
      logger.error("Failed to send workflow notifications", { error: error.message });
      return 0;
    }
  }

  private async createNotification(
    userId: string,
    type: "system" | "document" | "compliance" | "security" | "team" | "ai",
    message: string,
    resourceId: string
  ): Promise<void> {
    try {
      await storage.createNotification({
        userId,
        type,
        title: type === "compliance" ? "Approval Required" : "Workflow Update",
        message,
        link: `/documents/${resourceId}`,
        metadata: { entityType: "document", entityId: resourceId },
      });
    } catch (error: any) {
      logger.error("Failed to create notification", { error: error.message });
    }
  }
}

export const documentWorkflowService = new DocumentWorkflowService();

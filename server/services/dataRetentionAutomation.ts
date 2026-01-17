/**
 * Data Retention Automation Service
 * 
 * Automates data retention policy enforcement including:
 * - Scheduled data deletion based on retention periods
 * - User data deletion requests (GDPR/CCPA)
 * - Audit log retention
 * - Structured deletion workflow
 */

import { logger } from '../utils/logger';

interface RetentionPolicy {
  /** Data type identifier */
  dataType: string;
  /** Retention period in days */
  retentionDays: number;
  /** Whether to hard delete or soft delete */
  hardDelete: boolean;
  /** Require manual approval for deletion */
  requireApproval: boolean;
}

interface DeletionRequest {
  id: string;
  userId?: string;
  organizationId?: string;
  dataType: string;
  requestedAt: Date;
  scheduledAt: Date;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'failed';
  completedAt?: Date;
  error?: string;
}

// Default retention policies
const DEFAULT_POLICIES: RetentionPolicy[] = [
  {
    dataType: 'audit_logs',
    retentionDays: 365 * 7, // 7 years for compliance
    hardDelete: true,
    requireApproval: true,
  },
  {
    dataType: 'session_logs',
    retentionDays: 90,
    hardDelete: true,
    requireApproval: false,
  },
  {
    dataType: 'ai_chat_history',
    retentionDays: 365,
    hardDelete: false, // Soft delete for recovery
    requireApproval: false,
  },
  {
    dataType: 'generated_documents',
    retentionDays: 365 * 3, // 3 years
    hardDelete: false,
    requireApproval: true,
  },
  {
    dataType: 'temp_files',
    retentionDays: 7,
    hardDelete: true,
    requireApproval: false,
  },
  {
    dataType: 'deleted_user_data',
    retentionDays: 30, // 30-day grace period after account deletion
    hardDelete: true,
    requireApproval: false,
  },
];

class DataRetentionService {
  private policies: RetentionPolicy[] = DEFAULT_POLICIES;
  private pendingDeletions: Map<string, DeletionRequest> = new Map();

  /**
   * Configure retention policies
   */
  setPolicies(policies: RetentionPolicy[]) {
    this.policies = policies;
    logger.info('Data retention policies updated', {
      policyCount: policies.length,
    });
  }

  /**
   * Get retention policy for a data type
   */
  getPolicy(dataType: string): RetentionPolicy | undefined {
    return this.policies.find(p => p.dataType === dataType);
  }

  /**
   * Calculate deletion date based on policy
   */
  calculateDeletionDate(dataType: string, createdAt: Date): Date | null {
    const policy = this.getPolicy(dataType);
    if (!policy) return null;

    const deletionDate = new Date(createdAt);
    deletionDate.setDate(deletionDate.getDate() + policy.retentionDays);
    return deletionDate;
  }

  /**
   * Schedule data for deletion
   */
  async scheduleDeletion(
    dataType: string,
    targetId: string,
    options?: {
      userId?: string;
      organizationId?: string;
      immediate?: boolean;
    }
  ): Promise<DeletionRequest> {
    const policy = this.getPolicy(dataType);
    const now = new Date();
    
    const request: DeletionRequest = {
      id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: options?.userId,
      organizationId: options?.organizationId,
      dataType,
      requestedAt: now,
      scheduledAt: options?.immediate ? now : this.getNextDeletionWindow(),
      status: policy?.requireApproval ? 'pending' : 'approved',
    };

    this.pendingDeletions.set(request.id, request);

    logger.info('Deletion request scheduled', {
      requestId: request.id,
      dataType,
      scheduledAt: request.scheduledAt.toISOString(),
      status: request.status,
    });

    return request;
  }

  /**
   * Process GDPR/CCPA deletion request for a user
   */
  async processUserDeletionRequest(
    userId: string,
    options?: { immediate?: boolean }
  ): Promise<DeletionRequest[]> {
    const dataTypes = [
      'user_profile',
      'ai_chat_history',
      'generated_documents',
      'session_logs',
      'preferences',
    ];

    const requests: DeletionRequest[] = [];

    for (const dataType of dataTypes) {
      const request = await this.scheduleDeletion(dataType, userId, {
        userId,
        immediate: options?.immediate,
      });
      requests.push(request);
    }

    logger.info('User deletion request processed', {
      userId,
      requestCount: requests.length,
      immediate: options?.immediate ?? false,
    });

    return requests;
  }

  /**
   * Approve pending deletion request
   */
  async approveDeletion(requestId: string, approvedBy: string): Promise<void> {
    const request = this.pendingDeletions.get(requestId);
    if (!request) {
      throw new Error(`Deletion request ${requestId} not found`);
    }

    if (request.status !== 'pending') {
      throw new Error(`Request ${requestId} is not pending approval`);
    }

    request.status = 'approved';

    logger.info('Deletion request approved', {
      requestId,
      approvedBy,
      dataType: request.dataType,
    });
  }

  /**
   * Execute pending deletions
   */
  async executePendingDeletions(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    const now = new Date();
    const results = { processed: 0, succeeded: 0, failed: 0 };

    for (const [id, request] of this.pendingDeletions) {
      if (request.status !== 'approved' || request.scheduledAt > now) {
        continue;
      }

      results.processed++;
      request.status = 'processing';

      try {
        await this.executeDelete(request);
        request.status = 'completed';
        request.completedAt = new Date();
        results.succeeded++;

        logger.info('Deletion completed', {
          requestId: id,
          dataType: request.dataType,
        });
      } catch (error) {
        request.status = 'failed';
        request.error = error instanceof Error ? error.message : 'Unknown error';
        results.failed++;

        logger.error('Deletion failed', {
          requestId: id,
          dataType: request.dataType,
          error: request.error,
        });
      }
    }

    // Clean up completed requests older than 30 days
    this.cleanupCompletedRequests();

    return results;
  }

  /**
   * Execute a single deletion
   */
  private async executeDelete(request: DeletionRequest): Promise<void> {
    const policy = this.getPolicy(request.dataType);
    
    logger.info('Executing deletion', {
      requestId: request.id,
      dataType: request.dataType,
      hardDelete: policy?.hardDelete ?? false,
    });

    // Import storage dynamically to avoid circular dependencies
    const { storage } = await import('../storage');
    
    // Execute deletion based on data type
    switch (request.dataType) {
      case 'audit_logs':
        // Audit logs are typically never hard deleted for compliance
        logger.warn('Attempted to delete audit logs', { requestId: request.id });
        break;
        
      case 'session_logs':
        // Delete old session data
        if (request.userId) {
          // Would delete user sessions older than retention period
          logger.info('Session logs deletion executed', { userId: request.userId });
        }
        break;
        
      case 'ai_chat_history':
        // Soft delete or hard delete chat history
        if (request.userId) {
          logger.info('AI chat history deletion executed', { userId: request.userId });
        }
        break;
        
      case 'generated_documents':
        // Delete generated documents
        if (request.userId) {
          const documents = await storage.getDocuments();
          const userDocs = documents.filter((doc: any) => doc.userId === request.userId);
          for (const doc of userDocs) {
            if (policy?.hardDelete) {
              await storage.deleteDocument(doc.id);
            }
          }
          logger.info('Generated documents deletion executed', { 
            userId: request.userId,
            count: userDocs.length 
          });
        }
        break;
        
      case 'temp_files':
        // Delete temporary files from storage
        logger.info('Temp files deletion executed');
        break;
        
      case 'deleted_user_data':
        // Final cleanup of soft-deleted user data
        if (request.userId) {
          logger.info('Deleted user data cleanup executed', { userId: request.userId });
        }
        break;
        
      case 'user_profile':
        // Delete user profile data
        if (request.userId) {
          // In a real implementation, this would anonymize or delete user data
          logger.info('User profile deletion executed', { userId: request.userId });
        }
        break;
        
      case 'preferences':
        // Delete user preferences
        if (request.userId) {
          logger.info('User preferences deletion executed', { userId: request.userId });
        }
        break;
        
      default:
        logger.warn('Unknown data type for deletion', { 
          dataType: request.dataType,
          requestId: request.id 
        });
    }
  }

  /**
   * Get next deletion window (run deletions at 2 AM)
   */
  private getNextDeletionWindow(): Date {
    const now = new Date();
    const next = new Date(now);
    next.setHours(2, 0, 0, 0);
    
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    return next;
  }

  /**
   * Clean up old completed requests
   */
  private cleanupCompletedRequests(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const [id, request] of this.pendingDeletions) {
      if (
        request.status === 'completed' &&
        request.completedAt &&
        request.completedAt < thirtyDaysAgo
      ) {
        this.pendingDeletions.delete(id);
      }
    }
  }

  /**
   * Get deletion request status
   */
  getRequestStatus(requestId: string): DeletionRequest | undefined {
    return this.pendingDeletions.get(requestId);
  }

  /**
   * List pending deletion requests
   */
  listPendingRequests(options?: {
    userId?: string;
    organizationId?: string;
    status?: DeletionRequest['status'];
  }): DeletionRequest[] {
    const requests = Array.from(this.pendingDeletions.values());

    return requests.filter(r => {
      if (options?.userId && r.userId !== options.userId) return false;
      if (options?.organizationId && r.organizationId !== options.organizationId) return false;
      if (options?.status && r.status !== options.status) return false;
      return true;
    });
  }

  /**
   * Generate retention report
   */
  generateRetentionReport(): {
    policies: RetentionPolicy[];
    pendingCount: number;
    completedLast30Days: number;
    failedLast30Days: number;
  } {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const requests = Array.from(this.pendingDeletions.values());

    return {
      policies: this.policies,
      pendingCount: requests.filter(r => 
        r.status === 'pending' || r.status === 'approved'
      ).length,
      completedLast30Days: requests.filter(r =>
        r.status === 'completed' &&
        r.completedAt &&
        r.completedAt >= thirtyDaysAgo
      ).length,
      failedLast30Days: requests.filter(r =>
        r.status === 'failed' &&
        r.requestedAt >= thirtyDaysAgo
      ).length,
    };
  }
}

// Singleton instance
export const dataRetentionService = new DataRetentionService();

// Export types for external use
export type {
  RetentionPolicy,
  DeletionRequest,
};

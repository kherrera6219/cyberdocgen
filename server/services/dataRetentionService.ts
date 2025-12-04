/**
 * Data Retention Service - Phase 3
 * Manages data lifecycle, retention policies, and automated cleanup
 */

import { db } from "../db";
import { dataRetentionPolicies } from "../../shared/schema";
import { logger } from "../utils/logger";
import { eq, and, lt } from "drizzle-orm";

export interface DataRetentionPolicy {
  id: string;
  organizationId: string;
  policyName: string;
  dataType: string;
  retentionDays: number;
  deleteAfterExpiry: boolean;
  archiveBeforeDelete: boolean;
  archiveLocation?: string;
  complianceFramework?: string;
  status: "active" | "inactive" | "pending";
  lastEnforcedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRetentionPolicyInput {
  organizationId: string;
  policyName: string;
  dataType: string;
  retentionDays: number;
  deleteAfterExpiry?: boolean;
  archiveBeforeDelete?: boolean;
  archiveLocation?: string;
  complianceFramework?: string;
  createdBy: string;
}

class DataRetentionService {
  /**
   * Create a new data retention policy
   */
  async createPolicy(input: CreateRetentionPolicyInput): Promise<DataRetentionPolicy> {
    try {
      logger.info("Creating data retention policy", {
        organizationId: input.organizationId,
        policyName: input.policyName,
        dataType: input.dataType,
      });

      const [policy] = await db
        .insert(dataRetentionPolicies)
        .values({
          organizationId: input.organizationId,
          policyName: input.policyName,
          dataType: input.dataType,
          retentionDays: input.retentionDays,
          deleteAfterExpiry: input.deleteAfterExpiry ?? true,
          archiveBeforeDelete: input.archiveBeforeDelete ?? true,
          archiveLocation: input.archiveLocation,
          complianceFramework: input.complianceFramework,
          status: "active",
          createdBy: input.createdBy,
        })
        .returning();

      logger.info("Data retention policy created", { policyId: policy.id });

      return policy as DataRetentionPolicy;
    } catch (error: any) {
      logger.error("Failed to create data retention policy", {
        error: error.message,
        input,
      });
      throw new Error(`Failed to create data retention policy: ${error.message}`);
    }
  }

  /**
   * Get all policies for an organization
   */
  async getPoliciesByOrganization(organizationId: string): Promise<DataRetentionPolicy[]> {
    try {
      const policies = await db
        .select()
        .from(dataRetentionPolicies)
        .where(eq(dataRetentionPolicies.organizationId, organizationId));

      return policies as DataRetentionPolicy[];
    } catch (error: any) {
      logger.error("Failed to fetch retention policies", {
        error: error.message,
        organizationId,
      });
      throw new Error(`Failed to fetch retention policies: ${error.message}`);
    }
  }

  /**
   * Get active policies for an organization
   */
  async getActivePolicies(organizationId: string): Promise<DataRetentionPolicy[]> {
    try {
      const policies = await db
        .select()
        .from(dataRetentionPolicies)
        .where(
          and(
            eq(dataRetentionPolicies.organizationId, organizationId),
            eq(dataRetentionPolicies.status, "active")
          )
        );

      return policies as DataRetentionPolicy[];
    } catch (error: any) {
      logger.error("Failed to fetch active retention policies", {
        error: error.message,
        organizationId,
      });
      throw new Error(`Failed to fetch active retention policies: ${error.message}`);
    }
  }

  /**
   * Get policy for a specific data type
   */
  async getPolicyForDataType(
    organizationId: string,
    dataType: string
  ): Promise<DataRetentionPolicy | null> {
    try {
      const [policy] = await db
        .select()
        .from(dataRetentionPolicies)
        .where(
          and(
            eq(dataRetentionPolicies.organizationId, organizationId),
            eq(dataRetentionPolicies.dataType, dataType),
            eq(dataRetentionPolicies.status, "active")
          )
        )
        .limit(1);

      return (policy as DataRetentionPolicy) || null;
    } catch (error: any) {
      logger.error("Failed to fetch retention policy for data type", {
        error: error.message,
        organizationId,
        dataType,
      });
      return null;
    }
  }

  /**
   * Check if data should be retained or deleted
   */
  async shouldRetain(
    organizationId: string,
    dataType: string,
    dataCreatedAt: Date
  ): Promise<{ retain: boolean; policy?: DataRetentionPolicy; daysRemaining?: number }> {
    try {
      const policy = await this.getPolicyForDataType(organizationId, dataType);

      if (!policy) {
        // No policy - retain by default
        return { retain: true };
      }

      const daysSinceCreation = Math.floor(
        (Date.now() - dataCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      const daysRemaining = policy.retentionDays - daysSinceCreation;

      return {
        retain: daysRemaining > 0,
        policy,
        daysRemaining: Math.max(0, daysRemaining),
      };
    } catch (error: any) {
      logger.error("Failed to check retention status", {
        error: error.message,
        organizationId,
        dataType,
      });
      // Fail safe - retain if check fails
      return { retain: true };
    }
  }

  /**
   * Enforce retention policies (cleanup expired data)
   * This should be run as a cron job or scheduled task
   */
  async enforceRetentionPolicies(organizationId: string): Promise<{
    archived: number;
    deleted: number;
    errors: number;
  }> {
    try {
      logger.info("Enforcing retention policies", { organizationId });

      let archivedCount = 0;
      let deletedCount = 0;
      let errorCount = 0;

      const policies = await this.getActivePolicies(organizationId);

      for (const policy of policies) {
        try {
          const result = await this.enforcePolicyForDataType(policy);
          archivedCount += result.archived;
          deletedCount += result.deleted;

          // Update last enforced timestamp
          await db
            .update(dataRetentionPolicies)
            .set({ lastEnforcedAt: new Date(), updatedAt: new Date() })
            .where(eq(dataRetentionPolicies.id, policy.id));
        } catch (error: any) {
          errorCount++;
          logger.error("Failed to enforce retention policy", {
            error: error.message,
            policyId: policy.id,
          });
        }
      }

      logger.info("Retention policy enforcement complete", {
        organizationId,
        archived: archivedCount,
        deleted: deletedCount,
        errors: errorCount,
      });

      return {
        archived: archivedCount,
        deleted: deletedCount,
        errors: errorCount,
      };
    } catch (error: any) {
      logger.error("Failed to enforce retention policies", {
        error: error.message,
        organizationId,
      });
      throw new Error(`Failed to enforce retention policies: ${error.message}`);
    }
  }

  /**
   * Enforce policy for a specific data type
   */
  private async enforcePolicyForDataType(
    policy: DataRetentionPolicy
  ): Promise<{ archived: number; deleted: number }> {
    logger.info("Enforcing retention policy for data type", {
      policyId: policy.id,
      dataType: policy.dataType,
    });

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - policy.retentionDays);

    // TODO: Implement actual data cleanup based on dataType
    // This would query specific tables (documents, aiGuardrailsLogs, etc.)
    // and archive/delete records older than expiryDate

    // Mock implementation
    const archived = 0;
    const deleted = 0;

    logger.info("Retention policy enforced", {
      policyId: policy.id,
      dataType: policy.dataType,
      archived,
      deleted,
    });

    return { archived, deleted };
  }

  /**
   * Update policy status
   */
  async updatePolicyStatus(
    policyId: string,
    status: "active" | "inactive" | "pending"
  ): Promise<void> {
    try {
      await db
        .update(dataRetentionPolicies)
        .set({ status, updatedAt: new Date() })
        .where(eq(dataRetentionPolicies.id, policyId));

      logger.info("Data retention policy status updated", { policyId, status });
    } catch (error: any) {
      logger.error("Failed to update policy status", {
        error: error.message,
        policyId,
        status,
      });
      throw new Error(`Failed to update policy status: ${error.message}`);
    }
  }

  /**
   * Delete a policy
   */
  async deletePolicy(policyId: string): Promise<void> {
    try {
      // First set to inactive
      await this.updatePolicyStatus(policyId, "inactive");

      logger.info("Data retention policy deactivated", { policyId });
    } catch (error: any) {
      logger.error("Failed to delete policy", {
        error: error.message,
        policyId,
      });
      throw new Error(`Failed to delete policy: ${error.message}`);
    }
  }
}

export const dataRetentionService = new DataRetentionService();

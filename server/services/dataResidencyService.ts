/**
 * Data Residency Service - Phase 3
 * Manages tenant-level geographic data controls and compliance
 */

import { db } from "../db";
import { dataResidencyPolicies } from "../../shared/schema";
import { logger } from "../utils/logger";
import { eq, and } from "drizzle-orm";

export interface DataResidencyPolicy {
  id: string;
  organizationId: string;
  policyName: string;
  region: string;
  dataTypes: string[];
  enforceStrict: boolean;
  allowedRegions: string[];
  blockedRegions: string[];
  status: "active" | "inactive" | "pending";
  validatedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateResidencyPolicyInput {
  organizationId: string;
  policyName: string;
  region: string;
  dataTypes: string[];
  enforceStrict?: boolean;
  allowedRegions?: string[];
  blockedRegions?: string[];
  createdBy: string;
}

class DataResidencyService {
  /**
   * Create a new data residency policy
   */
  async createPolicy(input: CreateResidencyPolicyInput): Promise<DataResidencyPolicy> {
    try {
      logger.info("Creating data residency policy", {
        organizationId: input.organizationId,
        policyName: input.policyName,
      });

      const [policy] = await db
        .insert(dataResidencyPolicies)
        .values({
          organizationId: input.organizationId,
          policyName: input.policyName,
          region: input.region,
          dataTypes: input.dataTypes,
          enforceStrict: input.enforceStrict ?? true,
          allowedRegions: input.allowedRegions ?? [],
          blockedRegions: input.blockedRegions ?? [],
          status: "active",
          createdBy: input.createdBy,
        })
        .returning();

      logger.info("Data residency policy created", { policyId: policy.id });

      return policy as DataResidencyPolicy;
    } catch (error: any) {
      logger.error("Failed to create data residency policy", {
        error: error.message,
        input,
      });
      throw new Error(`Failed to create data residency policy: ${error.message}`);
    }
  }

  /**
   * Get all policies for an organization
   */
  async getPoliciesByOrganization(organizationId: string): Promise<DataResidencyPolicy[]> {
    try {
      const policies = await db
        .select()
        .from(dataResidencyPolicies)
        .where(eq(dataResidencyPolicies.organizationId, organizationId));

      return policies as DataResidencyPolicy[];
    } catch (error: any) {
      logger.error("Failed to fetch residency policies", {
        error: error.message,
        organizationId,
      });
      throw new Error(`Failed to fetch residency policies: ${error.message}`);
    }
  }

  /**
   * Get active policies for an organization
   */
  async getActivePolicies(organizationId: string): Promise<DataResidencyPolicy[]> {
    try {
      const policies = await db
        .select()
        .from(dataResidencyPolicies)
        .where(
          and(
            eq(dataResidencyPolicies.organizationId, organizationId),
            eq(dataResidencyPolicies.status, "active")
          )
        );

      return policies as DataResidencyPolicy[];
    } catch (error: any) {
      logger.error("Failed to fetch active residency policies", {
        error: error.message,
        organizationId,
      });
      throw new Error(`Failed to fetch active residency policies: ${error.message}`);
    }
  }

  /**
   * Validate if a region is allowed for a specific data type
   */
  async validateRegion(
    organizationId: string,
    dataType: string,
    targetRegion: string
  ): Promise<{ allowed: boolean; reason?: string; policy?: DataResidencyPolicy }> {
    try {
      const policies = await this.getActivePolicies(organizationId);

      // Find policies that apply to this data type
      const applicablePolicies = policies.filter((p) =>
        p.dataTypes.includes(dataType)
      );

      if (applicablePolicies.length === 0) {
        // No policies - allow by default
        return { allowed: true };
      }

      // Check each applicable policy
      for (const policy of applicablePolicies) {
        // Check blocked regions first
        if (policy.blockedRegions.includes(targetRegion)) {
          return {
            allowed: false,
            reason: `Region ${targetRegion} is blocked by policy: ${policy.policyName}`,
            policy,
          };
        }

        // If strict enforcement and not in allowed regions
        if (
          policy.enforceStrict &&
          policy.allowedRegions.length > 0 &&
          !policy.allowedRegions.includes(targetRegion)
        ) {
          return {
            allowed: false,
            reason: `Region ${targetRegion} is not in allowed regions for policy: ${policy.policyName}`,
            policy,
          };
        }
      }

      return { allowed: true };
    } catch (error: any) {
      logger.error("Failed to validate region", {
        error: error.message,
        organizationId,
        dataType,
        targetRegion,
      });
      // Fail secure - if validation fails, block access
      return {
        allowed: false,
        reason: "Region validation failed",
      };
    }
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
        .update(dataResidencyPolicies)
        .set({ status, updatedAt: new Date() })
        .where(eq(dataResidencyPolicies.id, policyId));

      logger.info("Data residency policy status updated", { policyId, status });
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
   * Mark policy as validated
   */
  async markPolicyValidated(policyId: string): Promise<void> {
    try {
      await db
        .update(dataResidencyPolicies)
        .set({ validatedAt: new Date(), updatedAt: new Date() })
        .where(eq(dataResidencyPolicies.id, policyId));

      logger.info("Data residency policy marked as validated", { policyId });
    } catch (error: any) {
      logger.error("Failed to mark policy as validated", {
        error: error.message,
        policyId,
      });
      throw new Error(`Failed to mark policy as validated: ${error.message}`);
    }
  }

  /**
   * Delete a policy
   */
  async deletePolicy(policyId: string): Promise<void> {
    try {
      // First set to inactive, then delete after verification
      await this.updatePolicyStatus(policyId, "inactive");

      // In production, you might want to keep historical records
      // await db.delete(dataResidencyPolicies).where(eq(dataResidencyPolicies.id, policyId));

      logger.info("Data residency policy deactivated", { policyId });
    } catch (error: any) {
      logger.error("Failed to delete policy", {
        error: error.message,
        policyId,
      });
      throw new Error(`Failed to delete policy: ${error.message}`);
    }
  }
}

export const dataResidencyService = new DataResidencyService();

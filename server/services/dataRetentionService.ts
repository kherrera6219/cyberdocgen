/**
 * Data Retention Service - Phase 3
 * Manages data lifecycle, retention policies, and automated cleanup
 */

import { db } from "../db";
import { dataRetentionPolicies, documents, aiGuardrailsLogs, auditLogs, cloudFiles, documentVersions, companyProfiles } from "../../shared/schema";
import { logger } from "../utils/logger";
import { eq, and, lt, inArray } from "drizzle-orm";

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

export class DataRetentionService {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to create data retention policy", {
        error: errorMessage,
        input,
      });
      throw new Error(`Failed to create data retention policy: ${errorMessage}`);
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to fetch retention policies", {
        error: errorMessage,
        organizationId,
      });
      throw new Error(`Failed to fetch retention policies: ${errorMessage}`);
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to fetch active retention policies", {
        error: errorMessage,
        organizationId,
      });
      throw new Error(`Failed to fetch active retention policies: ${errorMessage}`);
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to fetch retention policy for data type", {
        error: errorMessage,
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to check retention status", {
        error: errorMessage,
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
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errorCount++;
          logger.error("Failed to enforce retention policy", {
            error: errorMessage,
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to enforce retention policies", {
        error: errorMessage,
        organizationId,
      });
      throw new Error(`Failed to enforce retention policies: ${errorMessage}`);
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

    let archived = 0;
    let deleted = 0;

    // Implement data cleanup based on dataType
    try {
      switch (policy.dataType.toLowerCase()) {
        case 'documents': {
          let oldDocumentIds: string[] = [];
          const baseDocumentSelect = db.select({ id: documents.id }).from(documents);
          const supportsDocumentJoin =
            Boolean((companyProfiles as any)?.id)
            && typeof baseDocumentSelect.innerJoin === 'function'
            && Boolean(documents.id);

          if (supportsDocumentJoin) {
            const oldDocuments = await baseDocumentSelect
              .innerJoin(companyProfiles, eq(documents.companyProfileId, (companyProfiles as any).id))
              .where(
                and(
                  eq((companyProfiles as any).organizationId, policy.organizationId),
                  lt(documents.createdAt, expiryDate)
                )
              );
            oldDocumentIds = oldDocuments
              .map((document: any) => document.id)
              .filter((documentId: string | undefined): documentId is string => Boolean(documentId));
          } else {
            const oldDocuments = await db
              .select()
              .from(documents)
              .where(
                and(
                  eq(documents.companyProfileId, policy.organizationId),
                  lt(documents.createdAt, expiryDate)
                )
              );
            oldDocumentIds = oldDocuments
              .map((document: any) => document.id)
              .filter((documentId: string | undefined): documentId is string => Boolean(documentId));
          }

          if (policy.deleteAfterExpiry) {
            if (oldDocumentIds.length > 0 && (documents as any).id) {
              await db
                .delete(documents)
                .where(inArray((documents as any).id, oldDocumentIds));
            } else if (oldDocumentIds.length > 0) {
              await db
                .delete(documents)
                .where(
                  and(
                    eq(documents.companyProfileId, policy.organizationId),
                    lt(documents.createdAt, expiryDate)
                  )
                );
            }
            deleted = oldDocumentIds.length;
          } else {
            // Archive logic would go here
            archived = oldDocumentIds.length;
          }
          break;
        }

        case 'ai_guardrails_logs': {
          // Clean up old AI guardrail logs
          const oldGuardrailLogs = await db
            .select()
            .from(aiGuardrailsLogs)
            .where(
              and(
                eq(aiGuardrailsLogs.organizationId, policy.organizationId),
                lt(aiGuardrailsLogs.createdAt, expiryDate)
              )
            );

          if (policy.deleteAfterExpiry) {
            await db
              .delete(aiGuardrailsLogs)
              .where(
                and(
                  eq(aiGuardrailsLogs.organizationId, policy.organizationId),
                  lt(aiGuardrailsLogs.createdAt, expiryDate)
                )
              );
            deleted = oldGuardrailLogs.length;
          } else {
            archived = oldGuardrailLogs.length;
          }
          break;
        }

        case 'audit_logs': {
          // Clean up old audit logs
          const oldAuditLogs = await db
            .select()
            .from(auditLogs)
            .where(
              and(
                eq(auditLogs.organizationId, policy.organizationId),
                lt(auditLogs.timestamp, expiryDate)
              )
            );

          if (policy.deleteAfterExpiry) {
            await db
              .delete(auditLogs)
              .where(
                and(
                  eq(auditLogs.organizationId, policy.organizationId),
                  lt(auditLogs.timestamp, expiryDate)
                )
              );
            deleted = oldAuditLogs.length;
          } else {
            archived = oldAuditLogs.length;
          }
          break;
        }

        case 'cloud_files': {
          // Clean up old cloud files
          const oldCloudFiles = await db
            .select()
            .from(cloudFiles)
            .where(
              and(
                eq(cloudFiles.organizationId, policy.organizationId),
                lt(cloudFiles.createdAt, expiryDate)
              )
            );

          if (policy.deleteAfterExpiry) {
            await db
              .delete(cloudFiles)
              .where(
                and(
                  eq(cloudFiles.organizationId, policy.organizationId),
                  lt(cloudFiles.createdAt, expiryDate)
                )
              );
            deleted = oldCloudFiles.length;
          } else {
            archived = oldCloudFiles.length;
          }
          break;
        }

        case 'document_versions': {
          let oldVersionIds: string[] = [];
          const versionSelect = db.select({ id: documentVersions.id }).from(documentVersions);
          const supportsVersionJoin =
            Boolean(documentVersions.id)
            && Boolean((documents as any).id)
            && Boolean((companyProfiles as any)?.id)
            && typeof versionSelect.innerJoin === 'function';

          if (supportsVersionJoin) {
            const oldVersions = await versionSelect
              .innerJoin(documents, eq((documentVersions as any).documentId, (documents as any).id))
              .innerJoin(companyProfiles, eq((documents as any).companyProfileId, (companyProfiles as any).id))
              .where(
                and(
                  eq((companyProfiles as any).organizationId, policy.organizationId),
                  lt(documentVersions.createdAt, expiryDate)
                )
              );

            oldVersionIds = oldVersions
              .map((version: any) => version.id)
              .filter((versionId: string | undefined): versionId is string => Boolean(versionId));
          } else {
            const oldVersions = await db
              .select()
              .from(documentVersions)
              .where(lt(documentVersions.createdAt, expiryDate));
            oldVersionIds = oldVersions
              .map((version: any) => version.id)
              .filter((versionId: string | undefined): versionId is string => Boolean(versionId));
          }

          if (policy.deleteAfterExpiry) {
            if (oldVersionIds.length > 0 && (documentVersions as any).id) {
              await db
                .delete(documentVersions)
                .where(inArray((documentVersions as any).id, oldVersionIds));
            } else if (oldVersionIds.length > 0) {
              await db
                .delete(documentVersions)
                .where(lt(documentVersions.createdAt, expiryDate));
            }
            deleted = oldVersionIds.length;
          } else {
            archived = oldVersionIds.length;
          }
          break;
        }

        default:
          logger.warn("Unknown data type for retention policy", {
            dataType: policy.dataType,
            policyId: policy.id
          });
      }

      logger.info("Retention policy enforced", {
        policyId: policy.id,
        dataType: policy.dataType,
        archived,
        deleted,
        expiryDate
      });

      return { archived, deleted };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to enforce retention policy", {
        error: errorMessage,
        policyId: policy.id,
        dataType: policy.dataType
      });
      throw error;
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
        .update(dataRetentionPolicies)
        .set({ status, updatedAt: new Date() })
        .where(eq(dataRetentionPolicies.id, policyId));

      logger.info("Data retention policy status updated", { policyId, status });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to update policy status", {
        error: errorMessage,
        policyId,
        status,
      });
      throw new Error(`Failed to update policy status: ${errorMessage}`);
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to delete policy", {
        error: errorMessage,
        policyId,
      });
      throw new Error(`Failed to delete policy: ${errorMessage}`);
    }
  }
}

export const dataRetentionService = new DataRetentionService();

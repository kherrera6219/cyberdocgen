/**
 * Repository Findings Service
 * 
 * Manages repository analysis findings lifecycle:
 * - Create findings from code signal analysis
 * - Retrieve findings with filtering and pagination
 * - Update finding status (human review/override)
 * - Generate tasks from findings
 * 
 * Features:
 * - Multi-tenant isolation
 * - Audit logging
 * - Transaction support
 * - Error handling
 */

import { db } from '../db';
import {
  repositoryFindings,
  repositoryTasks,
  repositorySnapshots,
  type InsertRepositoryFinding,
  type RepositoryFinding,
  type InsertRepositoryTask,
  type RepositoryTask,
} from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, ValidationError } from '../utils/errorHandling';
import { auditService } from './auditService';
import type { ControlFinding } from './controlMappingService';

export interface FindingFilters {
  framework?: string;
  status?: string;
  confidenceLevel?: string;
  signalType?: string;
  controlId?: string;
  page?: number;
  limit?: number;
}

export interface FindingSummary {
  total: number;
  byStatus: Record<string, number>;
  byFramework: Record<string, number>;
  byConfidence: Record<string, number>;
  criticalCount: number;
}

export class RepositoryFindingsService {
  /**
   * Create findings from control mappings
   */
  async createFindings(
    snapshotId: string,
    organizationId: string,
    controlFindings: ControlFinding[],
    userId: string
  ): Promise<RepositoryFinding[]> {
    try {
      // Verify snapshot exists and belongs to organization
      const [snapshot] = await db.select()
        .from(repositorySnapshots)
        .where(and(
          eq(repositorySnapshots.id, snapshotId),
          eq(repositorySnapshots.organizationId, organizationId)
        ));

      if (!snapshot) {
        throw new NotFoundError('Repository snapshot not found');
      }

      const findings: RepositoryFinding[] = [];

      // Batch insert findings
      for (const controlFinding of controlFindings) {
        const [finding] = await db.insert(repositoryFindings).values({
          snapshotId,
          controlId: controlFinding.controlId,
          framework: controlFinding.framework,
          status: controlFinding.status,
          confidenceLevel: controlFinding.confidenceLevel,
          signalType: controlFinding.signalType,
          summary: controlFinding.summary,
          details: controlFinding.details,
          evidenceReferences: controlFinding.evidenceReferences,
          recommendation: controlFinding.recommendation,
          aiModel: controlFinding.aiModel,
        } as InsertRepositoryFinding).returning();

        findings.push(finding);

        // Auto-generate tasks for failed/partial controls
        if (controlFinding.status === 'fail' || controlFinding.status === 'partial') {
          await this.createTaskFromFinding(finding, userId);
        }
      }

      // Audit log
      await auditService.logAction({
        action: 'create',
        entityType: 'repository_findings',
        entityId: snapshotId,
        userId,
        organizationId,
        ipAddress: 'system',
        metadata: {
          findingsCreated: findings.length,
          framework: controlFindings[0]?.framework,
        },
      });

      logger.info('Repository findings created', {
        snapshotId,
        count: findings.length,
        organizationId,
      });

      return findings;

    } catch (error) {
      logger.error('Failed to create repository findings', {
        snapshotId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error instanceof AppError ? error : new AppError(
        'Failed to create repository findings',
        500,
        'FINDINGS_CREATE_ERROR'
      );
    }
  }

  /**
   * Get findings for a snapshot with filtering
   */
  async getFindings(
    snapshotId: string,
    organizationId: string,
    filters: FindingFilters = {}
  ): Promise<{
    findings: RepositoryFinding[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      // Verify snapshot belongs to organization
      const [snapshot] = await db.select()
        .from(repositorySnapshots)
        .where(and(
          eq(repositorySnapshots.id, snapshotId),
          eq(repositorySnapshots.organizationId, organizationId)
        ));

      if (!snapshot) {
        throw new NotFoundError('Repository snapshot not found');
      }

      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 50, 100);
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [eq(repositoryFindings.snapshotId, snapshotId)];
      const validStatuses: RepositoryFinding['status'][] = ['pass', 'partial', 'fail', 'not_observed', 'needs_human'];
      const validConfidenceLevels: RepositoryFinding['confidenceLevel'][] = ['low', 'medium', 'high'];

      if (filters.framework) {
        conditions.push(eq(repositoryFindings.framework, filters.framework));
      }
      if (filters.status && validStatuses.includes(filters.status as RepositoryFinding['status'])) {
        conditions.push(eq(repositoryFindings.status, filters.status as RepositoryFinding['status']));
      }
      if (
        filters.confidenceLevel &&
        validConfidenceLevels.includes(filters.confidenceLevel as RepositoryFinding['confidenceLevel'])
      ) {
        conditions.push(eq(
          repositoryFindings.confidenceLevel,
          filters.confidenceLevel as RepositoryFinding['confidenceLevel']
        ));
      }
      if (filters.signalType) {
        conditions.push(eq(repositoryFindings.signalType, filters.signalType));
      }
      if (filters.controlId) {
        conditions.push(eq(repositoryFindings.controlId, filters.controlId));
      }

      // Get findings with pagination
      const findings = await db.select()
        .from(repositoryFindings)
        .where(and(...conditions))
        .orderBy(desc(repositoryFindings.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const [countResult] = await db.select({ count: sql<number>`count(*)` })
        .from(repositoryFindings)
        .where(and(...conditions));

      const total = Number(countResult.count);

      logger.info('Retrieved repository findings', {
        snapshotId,
        count: findings.length,
        total,
        filters,
      });

      return {
        findings,
        total,
        page,
        limit,
      };

    } catch (error) {
      logger.error('Failed to get repository findings', {
        snapshotId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error instanceof AppError ? error : new AppError(
        'Failed to retrieve repository findings',
        500,
        'FINDINGS_RETRIEVE_ERROR'
      );
    }
  }

  /**
   * Get a single finding by ID
   */
  async getFindingById(
    findingId: string,
    organizationId: string
  ): Promise<RepositoryFinding> {
    try {
      const [finding] = await db.select()
        .from(repositoryFindings)
        .innerJoin(
          repositorySnapshots,
          eq(repositoryFindings.snapshotId, repositorySnapshots.id)
        )
        .where(and(
          eq(repositoryFindings.id, findingId),
          eq(repositorySnapshots.organizationId, organizationId)
        ));

      if (!finding) {
        throw new NotFoundError('Finding not found');
      }

      return finding.repository_findings;

    } catch (error) {
      logger.error('Failed to get finding by ID', {
        findingId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error instanceof AppError ? error : new AppError(
        'Failed to retrieve finding',
        500,
        'FINDING_RETRIEVE_ERROR'
      );
    }
  }

  /**
   * Review/override a finding (human in the loop)
   */
  async reviewFinding(
    findingId: string,
    organizationId: string,
    userId: string,
    updates: {
      status?: 'pass' | 'partial' | 'fail' | 'not_observed' | 'needs_human';
      humanOverride?: {
        originalStatus: string;
        newStatus: string;
        reason: string;
        evidence?: string;
      };
    }
  ): Promise<RepositoryFinding> {
    try {
      // Verify finding exists and belongs to organization
      const existing = await this.getFindingById(findingId, organizationId);

      const [updated] = await db.update(repositoryFindings)
        .set({
          ...(updates.status && { status: updates.status }),
          ...(updates.humanOverride && { humanOverride: updates.humanOverride }),
          reviewedBy: userId,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(repositoryFindings.id, findingId))
        .returning();

      // Audit log
      await auditService.logAction({
        action: 'update',
        entityType: 'repository_finding',
        entityId: findingId,
        userId,
        organizationId,
        ipAddress: 'system',
        metadata: {
          originalStatus: existing.status,
          newStatus: updates.status,
          hadHumanOverride: !!updates.humanOverride,
        },
      });

      logger.info('Finding reviewed', {
        findingId,
        userId,
        originalStatus: existing.status,
        newStatus: updates.status,
      });

      return updated;

    } catch (error) {
      logger.error('Failed to review finding', {
        findingId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error instanceof AppError ? error : new AppError(
        'Failed to review finding',
        500,
        'FINDING_REVIEW_ERROR'
      );
    }
  }

  /**
   * Get findings summary/statistics
   */
  async getFindingsSummary(
    snapshotId: string,
    organizationId: string
  ): Promise<FindingSummary> {
    try {
      // Verify snapshot
      const [snapshot] = await db.select()
        .from(repositorySnapshots)
        .where(and(
          eq(repositorySnapshots.id, snapshotId),
          eq(repositorySnapshots.organizationId, organizationId)
        ));

      if (!snapshot) {
        throw new NotFoundError('Repository snapshot not found');
      }

      const findings = await db.select()
        .from(repositoryFindings)
        .where(eq(repositoryFindings.snapshotId, snapshotId));

      const summary: FindingSummary = {
        total: findings.length,
        byStatus: {},
        byFramework: {},
        byConfidence: {},
        criticalCount: 0,
      };

      for (const finding of findings) {
        // Count by status
        summary.byStatus[finding.status] = (summary.byStatus[finding.status] || 0) + 1;

        // Count by framework
        summary.byFramework[finding.framework] = (summary.byFramework[finding.framework] || 0) + 1;

        // Count by confidence
        summary.byConfidence[finding.confidenceLevel] = (summary.byConfidence[finding.confidenceLevel] || 0) + 1;

        // Count critical (fail status + high confidence)
        if (finding.status === 'fail' && finding.confidenceLevel === 'high') {
          summary.criticalCount++;
        }
      }

      return summary;

    } catch (error) {
      logger.error('Failed to get findings summary', {
        snapshotId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error instanceof AppError ? error : new AppError(
        'Failed to retrieve findings summary',
        500,
        'FINDINGS_SUMMARY_ERROR'
      );
    }
  }

  /**
   * Create a task from a finding
   */
  private async createTaskFromFinding(
    finding: RepositoryFinding,
    userId: string
  ): Promise<void> {
    try {
      const title = finding.status === 'fail'
        ? `❌ Fix: ${finding.controlId} - ${finding.summary}`
        : `⚠️ Review: ${finding.controlId} - ${finding.summary}`;

      const description = `
**Control:** ${finding.controlId} (${finding.framework})
**Status:** ${finding.status}
**Confidence:** ${finding.confidenceLevel}

**Summary:**
${finding.summary}

**Recommendation:**
${finding.recommendation}

**Evidence:**
${(finding.evidenceReferences ?? []).map((ref: any) => `- ${ref.filePath}`).join('\n')}
      `.trim();

      const priority = finding.status === 'fail' && finding.confidenceLevel === 'high'
        ? 'critical'
        : finding.status === 'fail'
        ? 'high'
        : 'medium';

      const category = finding.status === 'fail'
        ? 'code_change'
        : 'missing_evidence';

      await db.insert(repositoryTasks).values({
        snapshotId: finding.snapshotId,
        findingId: finding.id,
        title,
        description,
        category,
        priority,
        status: 'open',
        assignedToRole: 'user',
      } as InsertRepositoryTask);

      logger.info('Task created from finding', {
        findingId: finding.id,
        controlId: finding.controlId,
        priority,
      });

    } catch (error) {
      logger.warn('Failed to create task from finding', {
        findingId: finding.id,
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw - task creation failure shouldn't block finding creation
    }
  }

  /**
   * Delete all findings for a snapshot (when snapshot is deleted)
   */
  async deleteSnapshotFindings(
    snapshotId: string,
    organizationId: string,
    userId: string
  ): Promise<void> {
    try {
      // Verify snapshot
      const [snapshot] = await db.select()
        .from(repositorySnapshots)
        .where(and(
          eq(repositorySnapshots.id, snapshotId),
          eq(repositorySnapshots.organizationId, organizationId)
        ));

      if (!snapshot) {
        throw new NotFoundError('Repository snapshot not found');
      }

      // Delete findings (cascade will handle tasks)
      const result = await db.delete(repositoryFindings)
        .where(eq(repositoryFindings.snapshotId, snapshotId));

      // Audit log
      await auditService.logAction({
        action: 'delete',
        entityType: 'repository_findings',
        entityId: snapshotId,
        userId,
        organizationId,
        ipAddress: 'system',
        metadata: {
          operation: 'bulk_delete',
        },
      });

      logger.info('Deleted snapshot findings', {
        snapshotId,
        organizationId,
      });

    } catch (error) {
      logger.error('Failed to delete snapshot findings', {
        snapshotId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error instanceof AppError ? error : new AppError(
        'Failed to delete findings',
        500,
        'FINDINGS_DELETE_ERROR'
      );
    }
  }
}

export const repositoryFindingsService = new RepositoryFindingsService();

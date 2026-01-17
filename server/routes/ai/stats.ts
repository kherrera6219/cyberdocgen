// AI Statistics Routes
// Usage statistics and monitoring
import { Router } from 'express';
import { db } from '../../db';
import { aiGuardrailsLogs, aiUsageDisclosures, documents } from '@shared/schema';
import { count, sql } from 'drizzle-orm';
import {
  isAuthenticated,
  asyncHandler
} from './shared';

export function registerStatsRoutes(router: Router) {
  /**
   * GET /api/ai/stats
   * Get AI usage statistics
   */
  router.get("/stats", isAuthenticated, asyncHandler(async (req, res) => {
    const { organizationId, timeRange = '30d' } = req.query;

    // Calculate time filter
    const now = new Date();
    const startDate = new Date();
    if (timeRange === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === '30d') {
      startDate.setDate(now.getDate() - 30);
    } else if (timeRange === '90d') {
      startDate.setDate(now.getDate() - 90);
    } else if (timeRange === '1y') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // Get guardrail statistics
    const guardrailsQuery = organizationId
      ? db.select({
          action: aiGuardrailsLogs.action,
          severity: aiGuardrailsLogs.severity,
          count: count()
        })
        .from(aiGuardrailsLogs)
        .where(sql`${aiGuardrailsLogs.organizationId} = ${organizationId} AND ${aiGuardrailsLogs.createdAt} >= ${startDate}`)
        .groupBy(aiGuardrailsLogs.action, aiGuardrailsLogs.severity)
      : db.select({
          action: aiGuardrailsLogs.action,
          severity: aiGuardrailsLogs.severity,
          count: count()
        })
        .from(aiGuardrailsLogs)
        .where(sql`${aiGuardrailsLogs.createdAt} >= ${startDate}`)
        .groupBy(aiGuardrailsLogs.action, aiGuardrailsLogs.severity);

    // Get efficiency stats (documents generated vs manual)
    const efficiencyQuery = organizationId
      ? db.select({
          aiGenerated: documents.aiGenerated,
          count: count()
        })
        .from(documents)
        .where(sql`${documents.companyProfileId} = ${organizationId} AND ${documents.createdAt} >= ${startDate}`)
        .groupBy(documents.aiGenerated)
      : db.select({
          aiGenerated: documents.aiGenerated,
          count: count()
        })
        .from(documents)
        .where(sql`${documents.createdAt} >= ${startDate}`)
        .groupBy(documents.aiGenerated);
        
    // Get cost estimates
    const costQuery = organizationId
      ? db.select({
          estimatedCost: sql<number>`sum(${aiUsageDisclosures.costEstimate})`
        })
        .from(aiUsageDisclosures)
        .where(sql`${aiUsageDisclosures.organizationId} = ${organizationId} AND ${aiUsageDisclosures.createdAt} >= ${startDate}`)
      : db.select({
          estimatedCost: sql<number>`sum(${aiUsageDisclosures.costEstimate})`
        })
        .from(aiUsageDisclosures)
        .where(sql`${aiUsageDisclosures.createdAt} >= ${startDate}`);

    // Execute queries
    const [guardrailsStats, efficiencyStats, costStats] = await Promise.all([
      guardrailsQuery,
      efficiencyQuery,
      costQuery
    ]);

    res.json({
      guardrails: guardrailsStats,
      efficiency: efficiencyStats,
      estimatedCost: costStats[0]?.estimatedCost || 0,
      timeRange
    });
  }));
}

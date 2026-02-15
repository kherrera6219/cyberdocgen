// AI Statistics Routes
// Usage statistics and monitoring
import { Router, Response, NextFunction } from 'express';
import { db } from '../../db';
import { aiGuardrailsLogs, aiUsageDisclosures, documents, companyProfiles } from '@shared/schema';
import { count, sql, eq, and, gte } from 'drizzle-orm';
import {
  isAuthenticated,
  secureHandler,
  requireOrganization,
  type MultiTenantRequest
} from './shared';

export function registerStatsRoutes(router: Router) {
  /**
   * GET /api/ai/stats
   * Get AI usage statistics
   */
  router.get("/stats", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const { timeRange = '30d' } = req.query;

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
    const guardrailsStats = await db.select({
      action: aiGuardrailsLogs.action,
      severity: aiGuardrailsLogs.severity,
      count: count()
    })
    .from(aiGuardrailsLogs)
    .where(and(
      eq(aiGuardrailsLogs.organizationId, organizationId),
      gte(aiGuardrailsLogs.createdAt, startDate)
    ))
    .groupBy(aiGuardrailsLogs.action, aiGuardrailsLogs.severity);

    // Get efficiency stats (documents generated vs manual)
    const efficiencyStats = await db.select({
      aiGenerated: documents.aiGenerated,
      count: count()
    })
    .from(documents)
    .innerJoin(companyProfiles, eq(documents.companyProfileId, companyProfiles.id))
    .where(and(
      eq(companyProfiles.organizationId, organizationId),
      gte(documents.createdAt, startDate)
    ))
    .groupBy(documents.aiGenerated);
        
    // Get cost estimates
    const costStats = await db.select({
      estimatedCost: sql<number>`sum(${aiUsageDisclosures.costEstimate})`
    })
    .from(aiUsageDisclosures)
    .where(and(
      eq(aiUsageDisclosures.organizationId, organizationId),
      gte(aiUsageDisclosures.createdAt, startDate)
    ));

    const tokenStats = await db.select({
      totalTokens: sql<number>`coalesce(sum(${aiUsageDisclosures.tokensUsed}), 0)`
    })
    .from(aiUsageDisclosures)
    .where(and(
      eq(aiUsageDisclosures.organizationId, organizationId),
      gte(aiUsageDisclosures.createdAt, startDate)
    ));

    res.json({
      success: true,
      data: {
        guardrails: guardrailsStats,
        efficiency: efficiencyStats,
        estimatedCost: costStats[0]?.estimatedCost || 0,
        totalTokens: tokenStats[0]?.totalTokens || 0,
        budgets: {
          userDailyTokens: Number(process.env.AI_TOKEN_BUDGET_USER_DAILY || "200000"),
          orgDailyTokens: Number(process.env.AI_TOKEN_BUDGET_ORG_DAILY || "2000000"),
          userMonthlyCostUsd: Number(process.env.AI_COST_BUDGET_USER_MONTHLY_USD || "100"),
          orgMonthlyCostUsd: Number(process.env.AI_COST_BUDGET_ORG_MONTHLY_USD || "1000"),
        },
        timeRange
      }
    });
  }));
}

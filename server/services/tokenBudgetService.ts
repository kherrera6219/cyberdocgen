import { and, eq, gte, sql } from "drizzle-orm";
import { aiUsageDisclosures } from "@shared/schema";
import { db } from "../db";
import { logger } from "../utils/logger";

export interface TokenBudgetCheckInput {
  userId?: string;
  organizationId?: string;
  estimatedTokens: number;
  estimatedCostUsd: number;
  actionType: string;
}

export interface TokenBudgetCheckResult {
  allowed: boolean;
  reason?: string;
  projectedUserDailyTokens?: number;
  projectedOrgDailyTokens?: number;
  projectedUserMonthlyCostUsd?: number;
  projectedOrgMonthlyCostUsd?: number;
}

interface UsageAggregate {
  tokens: number;
  costUsd: number;
}

type BudgetEnvName =
  | "AI_TOKEN_BUDGET_USER_DAILY"
  | "AI_TOKEN_BUDGET_ORG_DAILY"
  | "AI_COST_BUDGET_USER_MONTHLY_USD"
  | "AI_COST_BUDGET_ORG_MONTHLY_USD";

function readBudgetEnvValue(envName: BudgetEnvName): string | undefined {
  switch (envName) {
    case "AI_TOKEN_BUDGET_USER_DAILY":
      return process.env.AI_TOKEN_BUDGET_USER_DAILY;
    case "AI_TOKEN_BUDGET_ORG_DAILY":
      return process.env.AI_TOKEN_BUDGET_ORG_DAILY;
    case "AI_COST_BUDGET_USER_MONTHLY_USD":
      return process.env.AI_COST_BUDGET_USER_MONTHLY_USD;
    case "AI_COST_BUDGET_ORG_MONTHLY_USD":
      return process.env.AI_COST_BUDGET_ORG_MONTHLY_USD;
    default: {
      const exhaustiveCheck: never = envName;
      throw new Error(`Unsupported budget env variable: ${exhaustiveCheck}`);
    }
  }
}

function readNumericBudget(envName: BudgetEnvName, fallback: number): number {
  const rawValue = readBudgetEnvValue(envName);
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

class TokenBudgetService {
  private readonly userDailyTokenBudget = readNumericBudget("AI_TOKEN_BUDGET_USER_DAILY", 200000);
  private readonly orgDailyTokenBudget = readNumericBudget("AI_TOKEN_BUDGET_ORG_DAILY", 2000000);
  private readonly userMonthlyCostBudget = readNumericBudget("AI_COST_BUDGET_USER_MONTHLY_USD", 100);
  private readonly orgMonthlyCostBudget = readNumericBudget("AI_COST_BUDGET_ORG_MONTHLY_USD", 1000);

  private async getUserDailyUsage(userId: string, startDate: Date): Promise<UsageAggregate> {
    const [row] = await db
      .select({
        tokens: sql<number>`coalesce(sum(${aiUsageDisclosures.tokensUsed}), 0)`,
        costUsd: sql<number>`coalesce(sum(${aiUsageDisclosures.costEstimate}), 0)`,
      })
      .from(aiUsageDisclosures)
      .where(and(eq(aiUsageDisclosures.userId, userId), gte(aiUsageDisclosures.createdAt, startDate)));

    return {
      tokens: toNumber(row?.tokens),
      costUsd: toNumber(row?.costUsd),
    };
  }

  private async getOrganizationDailyUsage(organizationId: string, startDate: Date): Promise<UsageAggregate> {
    const [row] = await db
      .select({
        tokens: sql<number>`coalesce(sum(${aiUsageDisclosures.tokensUsed}), 0)`,
        costUsd: sql<number>`coalesce(sum(${aiUsageDisclosures.costEstimate}), 0)`,
      })
      .from(aiUsageDisclosures)
      .where(and(eq(aiUsageDisclosures.organizationId, organizationId), gte(aiUsageDisclosures.createdAt, startDate)));

    return {
      tokens: toNumber(row?.tokens),
      costUsd: toNumber(row?.costUsd),
    };
  }

  private async getUserMonthlyUsage(userId: string, startDate: Date): Promise<UsageAggregate> {
    const [row] = await db
      .select({
        tokens: sql<number>`coalesce(sum(${aiUsageDisclosures.tokensUsed}), 0)`,
        costUsd: sql<number>`coalesce(sum(${aiUsageDisclosures.costEstimate}), 0)`,
      })
      .from(aiUsageDisclosures)
      .where(and(eq(aiUsageDisclosures.userId, userId), gte(aiUsageDisclosures.createdAt, startDate)));

    return {
      tokens: toNumber(row?.tokens),
      costUsd: toNumber(row?.costUsd),
    };
  }

  private async getOrganizationMonthlyUsage(organizationId: string, startDate: Date): Promise<UsageAggregate> {
    const [row] = await db
      .select({
        tokens: sql<number>`coalesce(sum(${aiUsageDisclosures.tokensUsed}), 0)`,
        costUsd: sql<number>`coalesce(sum(${aiUsageDisclosures.costEstimate}), 0)`,
      })
      .from(aiUsageDisclosures)
      .where(and(eq(aiUsageDisclosures.organizationId, organizationId), gte(aiUsageDisclosures.createdAt, startDate)));

    return {
      tokens: toNumber(row?.tokens),
      costUsd: toNumber(row?.costUsd),
    };
  }

  async checkBudget(input: TokenBudgetCheckInput): Promise<TokenBudgetCheckResult> {
    if (process.env.NODE_ENV === "test") {
      return { allowed: true, reason: "test_mode" };
    }

    if (!input.userId && !input.organizationId) {
      return { allowed: true, reason: "anonymous_scope" };
    }

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
      let projectedUserDailyTokens: number | undefined;
      let projectedOrgDailyTokens: number | undefined;
      let projectedUserMonthlyCostUsd: number | undefined;
      let projectedOrgMonthlyCostUsd: number | undefined;

      if (input.userId) {
        const userDaily = await this.getUserDailyUsage(input.userId, dayStart);
        const userMonthly = await this.getUserMonthlyUsage(input.userId, monthStart);
        projectedUserDailyTokens = userDaily.tokens + input.estimatedTokens;
        projectedUserMonthlyCostUsd = userMonthly.costUsd + input.estimatedCostUsd;

        if (projectedUserDailyTokens > this.userDailyTokenBudget) {
          return {
            allowed: false,
            reason: "user_daily_token_budget_exceeded",
            projectedUserDailyTokens,
            projectedUserMonthlyCostUsd,
          };
        }

        if (projectedUserMonthlyCostUsd > this.userMonthlyCostBudget) {
          return {
            allowed: false,
            reason: "user_monthly_cost_budget_exceeded",
            projectedUserDailyTokens,
            projectedUserMonthlyCostUsd,
          };
        }
      }

      if (input.organizationId) {
        const orgDaily = await this.getOrganizationDailyUsage(input.organizationId, dayStart);
        const orgMonthly = await this.getOrganizationMonthlyUsage(input.organizationId, monthStart);
        projectedOrgDailyTokens = orgDaily.tokens + input.estimatedTokens;
        projectedOrgMonthlyCostUsd = orgMonthly.costUsd + input.estimatedCostUsd;

        if (projectedOrgDailyTokens > this.orgDailyTokenBudget) {
          return {
            allowed: false,
            reason: "org_daily_token_budget_exceeded",
            projectedOrgDailyTokens,
            projectedOrgMonthlyCostUsd,
          };
        }

        if (projectedOrgMonthlyCostUsd > this.orgMonthlyCostBudget) {
          return {
            allowed: false,
            reason: "org_monthly_cost_budget_exceeded",
            projectedOrgDailyTokens,
            projectedOrgMonthlyCostUsd,
          };
        }
      }

      return {
        allowed: true,
        projectedUserDailyTokens,
        projectedOrgDailyTokens,
        projectedUserMonthlyCostUsd,
        projectedOrgMonthlyCostUsd,
      };
    } catch (error) {
      logger.warn("Token budget enforcement skipped due to evaluation error", {
        error: error instanceof Error ? error.message : String(error),
        actionType: input.actionType,
      });
      return { allowed: true, reason: "budget_evaluation_failed_open" };
    }
  }
}

export const tokenBudgetService = new TokenBudgetService();

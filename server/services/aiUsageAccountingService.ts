import { logger } from "../utils/logger";
import { modelTransparencyService } from "./modelTransparencyService";
import { modelVersionCatalog } from "./modelVersionCatalog";
import { tokenBudgetService } from "./tokenBudgetService";

export interface AIBudgetCheckInput {
  userId?: string;
  organizationId?: string;
  actionType: string;
  model: string;
  prompt: string;
  expectedResponseTokens?: number;
}

export interface AIBudgetCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface AIUsageRecordInput {
  userId?: string;
  organizationId?: string;
  actionType: string;
  model: string;
  prompt: string;
  response: string;
  purposeDescription: string;
  dataUsed?: string[];
  aiContribution?: "full" | "partial" | "assisted" | "review";
  humanOversight?: boolean;
}

export interface AIUsageRecordResult {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

class AIUsageAccountingService {
  estimateTokensFromText(text: string): number {
    const content = text || "";
    // Conservative approximation: ~4 chars/token for English prose.
    return Math.max(1, Math.ceil(content.length / 4));
  }

  estimateCostUsd(model: string, promptTokens: number, completionTokens: number): number {
    const entry = modelVersionCatalog.resolve(model);
    if (!entry) {
      return 0;
    }

    const inputCost = (promptTokens / 1_000_000) * entry.inputCostPerMillionUsd;
    const outputCost = (completionTokens / 1_000_000) * entry.outputCostPerMillionUsd;
    return Number((inputCost + outputCost).toFixed(6));
  }

  async checkBudget(input: AIBudgetCheckInput): Promise<AIBudgetCheckResult> {
    const promptTokens = this.estimateTokensFromText(input.prompt);
    const completionTokens = Math.max(1, input.expectedResponseTokens || 1200);
    const estimatedCostUsd = this.estimateCostUsd(input.model, promptTokens, completionTokens);

    const budgetCheck = await tokenBudgetService.checkBudget({
      userId: input.userId,
      organizationId: input.organizationId,
      estimatedTokens: promptTokens + completionTokens,
      estimatedCostUsd,
      actionType: input.actionType,
    });

    if (!budgetCheck.allowed) {
      logger.warn("AI budget check rejected operation", {
        actionType: input.actionType,
        userId: input.userId,
        organizationId: input.organizationId,
        reason: budgetCheck.reason,
      });
      return {
        allowed: false,
        reason: budgetCheck.reason || "budget_exceeded",
      };
    }

    return { allowed: true };
  }

  async recordUsage(input: AIUsageRecordInput): Promise<AIUsageRecordResult> {
    const promptTokens = this.estimateTokensFromText(input.prompt);
    const completionTokens = this.estimateTokensFromText(input.response);
    const totalTokens = promptTokens + completionTokens;
    const estimatedCostUsd = this.estimateCostUsd(input.model, promptTokens, completionTokens);

    if (!input.userId) {
      return {
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCostUsd,
      };
    }

    const modelEntry = modelVersionCatalog.resolve(input.model);
    const modelProvider = modelEntry?.provider || "unknown";
    const modelName = modelEntry?.apiModel || input.model;

    try {
      await modelTransparencyService.recordUsageDisclosure({
        organizationId: input.organizationId,
        userId: input.userId,
        actionType: input.actionType,
        modelProvider,
        modelName,
        purposeDescription: input.purposeDescription,
        dataUsed: input.dataUsed || [],
        dataRetentionDays: Number(process.env.AI_USAGE_RETENTION_DAYS || "30"),
        dataStorageRegion: process.env.AI_DATA_STORAGE_REGION || "us",
        userConsented: true,
        consentVersion: process.env.AI_CONSENT_VERSION || "v1",
        aiContribution: input.aiContribution || "assisted",
        humanOversight: input.humanOversight ?? true,
        tokensUsed: totalTokens,
        costEstimate: estimatedCostUsd,
      });
    } catch (error) {
      logger.warn("Failed to persist AI usage disclosure", {
        error: error instanceof Error ? error.message : String(error),
        actionType: input.actionType,
        userId: input.userId,
      });
    }

    return {
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCostUsd,
    };
  }
}

export const aiUsageAccountingService = new AIUsageAccountingService();

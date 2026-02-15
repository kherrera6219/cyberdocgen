import { auditService } from "./auditService";
import { modelVersionCatalog } from "./modelVersionCatalog";
import { logger } from "../utils/logger";

export interface AIMetadataAuditInput {
  actionType: string;
  model: string;
  userId?: string;
  organizationId?: string;
  promptTemplateKey?: string;
  promptTemplateVersion?: string;
  requestId?: string;
  outputClassification?: {
    label: string;
    score: number;
    tags: string[];
  };
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
  };
  metadata?: Record<string, unknown>;
}

class AIMetadataAuditService {
  async record(input: AIMetadataAuditInput): Promise<void> {
    const modelEntry = modelVersionCatalog.resolve(input.model);
    const timestamp = new Date().toISOString();

    const auditMetadata = {
      actionType: input.actionType,
      modelRoute: input.model,
      modelProvider: modelEntry?.provider || "unknown",
      modelApiName: modelEntry?.apiModel || input.model,
      modelVersion: modelEntry?.version || "unknown",
      timestamp,
      promptTemplateKey: input.promptTemplateKey || null,
      promptTemplateVersion: input.promptTemplateVersion || null,
      requestId: input.requestId || null,
      outputClassification: input.outputClassification || null,
      usage: input.usage || null,
      ...input.metadata,
    };

    try {
      await auditService.logAction({
        userId: input.userId,
        organizationId: input.organizationId,
        action: "ai_metadata_audit",
        entityType: "ai_operation",
        entityId: `${input.actionType}:${input.requestId || timestamp}`,
        ipAddress: "internal",
        metadata: auditMetadata,
      });
    } catch (error) {
      logger.warn("Failed to persist AI metadata audit event", {
        error: error instanceof Error ? error.message : String(error),
        actionType: input.actionType,
      });
    }
  }
}

export const aiMetadataAuditService = new AIMetadataAuditService();

/**
 * Model Transparency Service - Phase 3
 * Manages AI model cards and usage transparency disclosures
 */

import { db } from "../db";
import { modelCards, aiUsageDisclosures } from "../../shared/schema";
import { logger } from "../utils/logger";
import { eq, and } from "drizzle-orm";

export interface ModelCard {
  id: string;
  modelProvider: string;
  modelName: string;
  modelVersion: string;
  description: string;
  intendedUse: string;
  limitations: string;
  trainingData?: string;
  performanceMetrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    latencyMs?: number;
    customMetrics?: Record<string, number>;
  };
  biasAssessment?: string;
  fairnessMetrics?: {
    demographicParity?: number;
    equalOpportunity?: number;
    notes?: string;
  };
  safetyEvaluations?: string;
  ethicalConsiderations?: string;
  privacyFeatures?: string[];
  dataRetentionPolicy?: string;
  dataResidency?: string;
  complianceFrameworks?: string[];
  certifications?: string[];
  contactInfo?: {
    supportEmail?: string;
    documentation?: string;
    responsible?: string;
  };
  status: "active" | "deprecated" | "experimental";
  publishedAt?: Date;
  lastReviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateModelCardInput {
  modelProvider: string;
  modelName: string;
  modelVersion: string;
  description: string;
  intendedUse: string;
  limitations: string;
  trainingData?: string;
  performanceMetrics?: any;
  biasAssessment?: string;
  fairnessMetrics?: any;
  safetyEvaluations?: string;
  ethicalConsiderations?: string;
  privacyFeatures?: string[];
  dataRetentionPolicy?: string;
  dataResidency?: string;
  complianceFrameworks?: string[];
  certifications?: string[];
  contactInfo?: any;
}

export interface AIUsageDisclosure {
  id: string;
  organizationId?: string;
  userId: string;
  actionType: string;
  modelProvider: string;
  modelName: string;
  modelCardId?: string;
  purposeDescription: string;
  dataUsed?: string[];
  dataRetentionDays?: number;
  dataStorageRegion?: string;
  userConsented: boolean;
  consentedAt?: Date;
  consentVersion?: string;
  aiContribution: string;
  humanOversight: boolean;
  tokensUsed?: number;
  costEstimate?: string;
  createdAt: Date;
}

class ModelTransparencyService {
  /**
   * Create or update a model card
   */
  async upsertModelCard(input: CreateModelCardInput): Promise<ModelCard> {
    try {
      logger.info("Creating/updating model card", {
        modelProvider: input.modelProvider,
        modelName: input.modelName,
        modelVersion: input.modelVersion,
      });

      // Check if model card already exists
      const [existing] = await db
        .select()
        .from(modelCards)
        .where(
          and(
            eq(modelCards.modelProvider, input.modelProvider),
            eq(modelCards.modelName, input.modelName),
            eq(modelCards.modelVersion, input.modelVersion)
          )
        )
        .limit(1);

      if (existing) {
        // Update existing
        const [updated] = await db
          .update(modelCards)
          .set({
            ...input,
            updatedAt: new Date(),
            lastReviewedAt: new Date(),
          })
          .where(eq(modelCards.id, existing.id))
          .returning();

        logger.info("Model card updated", { modelCardId: updated.id });
        return updated as ModelCard;
      } else {
        // Create new
        const [created] = await db
          .insert(modelCards)
          .values({
            ...input,
            status: "active",
            publishedAt: new Date(),
          })
          .returning();

        logger.info("Model card created", { modelCardId: created.id });
        return created as ModelCard;
      }
    } catch (error: any) {
      logger.error("Failed to upsert model card", {
        error: error.message,
        input,
      });
      throw new Error(`Failed to upsert model card: ${error.message}`);
    }
  }

  /**
   * Get model card by provider and name
   */
  async getModelCard(
    modelProvider: string,
    modelName: string,
    modelVersion?: string
  ): Promise<ModelCard | null> {
    try {
      let query = db
        .select()
        .from(modelCards)
        .where(
          and(
            eq(modelCards.modelProvider, modelProvider),
            eq(modelCards.modelName, modelName),
            eq(modelCards.status, "active")
          )
        );

      if (modelVersion) {
        query = query.where(eq(modelCards.modelVersion, modelVersion));
      }

      const [card] = await query.limit(1);

      return (card as ModelCard) || null;
    } catch (error: any) {
      logger.error("Failed to fetch model card", {
        error: error.message,
        modelProvider,
        modelName,
      });
      return null;
    }
  }

  /**
   * Get all active model cards
   */
  async getAllActiveModelCards(): Promise<ModelCard[]> {
    try {
      const cards = await db
        .select()
        .from(modelCards)
        .where(eq(modelCards.status, "active"));

      return cards as ModelCard[];
    } catch (error: any) {
      logger.error("Failed to fetch model cards", { error: error.message });
      return [];
    }
  }

  /**
   * Record AI usage disclosure
   */
  async recordUsageDisclosure(input: {
    organizationId?: string;
    userId: string;
    actionType: string;
    modelProvider: string;
    modelName: string;
    purposeDescription: string;
    dataUsed?: string[];
    dataRetentionDays?: number;
    dataStorageRegion?: string;
    userConsented?: boolean;
    consentVersion?: string;
    aiContribution: "full" | "partial" | "assisted" | "review";
    humanOversight?: boolean;
    tokensUsed?: number;
    costEstimate?: number;
  }): Promise<AIUsageDisclosure> {
    try {
      // Get model card ID if available
      const modelCard = await this.getModelCard(input.modelProvider, input.modelName);

      const [disclosure] = await db
        .insert(aiUsageDisclosures)
        .values({
          organizationId: input.organizationId,
          userId: input.userId,
          actionType: input.actionType,
          modelProvider: input.modelProvider,
          modelName: input.modelName,
          modelCardId: modelCard?.id,
          purposeDescription: input.purposeDescription,
          dataUsed: input.dataUsed || [],
          dataRetentionDays: input.dataRetentionDays,
          dataStorageRegion: input.dataStorageRegion,
          userConsented: input.userConsented ?? false,
          consentedAt: input.userConsented ? new Date() : null,
          consentVersion: input.consentVersion,
          aiContribution: input.aiContribution,
          humanOversight: input.humanOversight ?? false,
          tokensUsed: input.tokensUsed,
          costEstimate: input.costEstimate?.toString(),
        })
        .returning();

      logger.info("AI usage disclosure recorded", {
        disclosureId: disclosure.id,
        actionType: input.actionType,
      });

      return disclosure as AIUsageDisclosure;
    } catch (error: any) {
      logger.error("Failed to record usage disclosure", {
        error: error.message,
        input,
      });
      throw new Error(`Failed to record usage disclosure: ${error.message}`);
    }
  }

  /**
   * Get usage disclosures for a user
   */
  async getUserDisclosures(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<AIUsageDisclosure[]> {
    try {
      let query = db
        .select()
        .from(aiUsageDisclosures)
        .where(eq(aiUsageDisclosures.userId, userId))
        .orderBy(aiUsageDisclosures.createdAt);

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.offset(options.offset);
      }

      const disclosures = await query;

      return disclosures as AIUsageDisclosure[];
    } catch (error: any) {
      logger.error("Failed to fetch user disclosures", {
        error: error.message,
        userId,
      });
      return [];
    }
  }

  /**
   * Get usage disclosures for an organization
   */
  async getOrganizationDisclosures(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<AIUsageDisclosure[]> {
    try {
      let query = db
        .select()
        .from(aiUsageDisclosures)
        .where(eq(aiUsageDisclosures.organizationId, organizationId))
        .orderBy(aiUsageDisclosures.createdAt);

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.offset(options.offset);
      }

      const disclosures = await query;

      return disclosures as AIUsageDisclosure[];
    } catch (error: any) {
      logger.error("Failed to fetch organization disclosures", {
        error: error.message,
        organizationId,
      });
      return [];
    }
  }

  /**
   * Initialize default model cards for common models
   */
  async initializeDefaultModelCards(): Promise<void> {
    const defaultCards: CreateModelCardInput[] = [
      {
        modelProvider: "openai",
        modelName: "gpt-4o",
        modelVersion: "2024-08-06",
        description: "GPT-4o is OpenAI's most advanced multimodal model, capable of processing text and images.",
        intendedUse: "Enterprise compliance document generation, analysis, and risk assessment.",
        limitations: "May occasionally produce incorrect information. Should be reviewed by compliance professionals for critical use cases.",
        trainingData: "Trained on diverse internet text data up to October 2023.",
        performanceMetrics: {
          accuracy: 0.92,
          latencyMs: 2000,
        },
        privacyFeatures: ["encryption_in_transit", "no_training_on_customer_data", "pii_filtering"],
        dataRetentionPolicy: "Customer data retained for 30 days per OpenAI policy",
        dataResidency: "us-east-1",
        complianceFrameworks: ["SOC2", "ISO27001"],
        contactInfo: {
          supportEmail: "support@openai.com",
          documentation: "https://platform.openai.com/docs",
          responsible: "OpenAI Compliance Team",
        },
      },
      {
        modelProvider: "anthropic",
        modelName: "claude-3-5-sonnet",
        modelVersion: "20241022",
        description: "Claude 3.5 Sonnet is Anthropic's balanced model offering strong performance with enhanced safety features.",
        intendedUse: "Enterprise compliance analysis, document review, and policy generation with strong safety guarantees.",
        limitations: "May decline to answer questions about harmful or regulated content. Best suited for professional and compliance use cases.",
        trainingData: "Trained with Constitutional AI principles on diverse text data.",
        performanceMetrics: {
          accuracy: 0.94,
          latencyMs: 1800,
        },
        privacyFeatures: ["encryption_in_transit", "no_training_on_conversations", "pii_detection", "data_minimization"],
        dataRetentionPolicy: "Customer conversations retained for 90 days for safety monitoring, then deleted",
        dataResidency: "us-east-1, eu-west-1",
        complianceFrameworks: ["SOC2", "GDPR"],
        safetyEvaluations: "Undergoes extensive red-teaming and safety testing before deployment",
        ethicalConsiderations: "Designed with Constitutional AI to be helpful, harmless, and honest",
        contactInfo: {
          supportEmail: "support@anthropic.com",
          documentation: "https://docs.anthropic.com",
          responsible: "Anthropic Safety Team",
        },
      },
    ];

    for (const card of defaultCards) {
      try {
        await this.upsertModelCard(card);
      } catch (error) {
        logger.error("Failed to initialize default model card", {
          modelProvider: card.modelProvider,
          modelName: card.modelName,
        });
      }
    }

    logger.info("Default model cards initialized");
  }
}

export const modelTransparencyService = new ModelTransparencyService();

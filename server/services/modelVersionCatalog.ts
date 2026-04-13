import { logger } from "../utils/logger";

export type GovernedModel = "gpt-5.4" | "claude-sonnet-4-6" | "gemini-3.1-pro-preview";

export interface ModelCatalogEntry {
  routeModel: GovernedModel;
  provider: "openai" | "anthropic" | "google";
  apiModel: string;
  version: string;
  releasedAt: string;
  inputCostPerMillionUsd: number;
  outputCostPerMillionUsd: number;
}

const MODEL_CATALOG: Record<GovernedModel, ModelCatalogEntry> = {
  "gpt-5.4": {
    routeModel: "gpt-5.4",
    provider: "openai",
    apiModel: "gpt-5.4",
    version: "2026-03",
    releasedAt: "2026-03-05",
    inputCostPerMillionUsd: 5,
    outputCostPerMillionUsd: 15,
  },
  "claude-sonnet-4-6": {
    routeModel: "claude-sonnet-4-6",
    provider: "anthropic",
    apiModel: "claude-sonnet-4-6",
    version: "2026-02-17",
    releasedAt: "2026-02-17",
    inputCostPerMillionUsd: 3,
    outputCostPerMillionUsd: 15,
  },
  "gemini-3.1-pro-preview": {
    routeModel: "gemini-3.1-pro-preview",
    provider: "google",
    apiModel: "gemini-3.1-pro-preview",
    version: "2026-02-preview",
    releasedAt: "2026-02-19",
    inputCostPerMillionUsd: 0.35,
    outputCostPerMillionUsd: 1.5,
  },
};

class ModelVersionCatalog {
  resolve(model: string): ModelCatalogEntry | null {
    const entry = MODEL_CATALOG[model as GovernedModel];
    if (!entry) {
      logger.warn("Unknown model requested in catalog", { model });
      return null;
    }
    return entry;
  }

  list(): ModelCatalogEntry[] {
    return Object.values(MODEL_CATALOG);
  }
}

export const modelVersionCatalog = new ModelVersionCatalog();

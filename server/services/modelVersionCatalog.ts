import { logger } from "../utils/logger";

export type GovernedModel = "gpt-5.1" | "claude-sonnet-4" | "gemini-3-pro";

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
  "gpt-5.1": {
    routeModel: "gpt-5.1",
    provider: "openai",
    apiModel: "gpt-5.1",
    version: "2025-08",
    releasedAt: "2025-08-01",
    inputCostPerMillionUsd: 5,
    outputCostPerMillionUsd: 15,
  },
  "claude-sonnet-4": {
    routeModel: "claude-sonnet-4",
    provider: "anthropic",
    apiModel: "claude-sonnet-4-20250514",
    version: "2025-05-14",
    releasedAt: "2025-05-14",
    inputCostPerMillionUsd: 3,
    outputCostPerMillionUsd: 15,
  },
  "gemini-3-pro": {
    routeModel: "gemini-3-pro",
    provider: "google",
    apiModel: "gemini-2.0-flash",
    version: "2.0-flash",
    releasedAt: "2024-12-11",
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

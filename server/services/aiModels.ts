/**
 * AI Model Configurations — March 2026
 *
 * OpenAI    : gpt-5.4           — released March 5, 2026, 272K context, configurable reasoning
 *             gpt-5-mini         — smaller/faster variant for low-latency calls
 * Anthropic : claude-sonnet-4-6  — released Feb 17, 2026, 1M token context (beta)
 *             claude-opus-4-6    — released Feb 5, 2026, 1M token context
 * Google    : gemini-3.1-pro-preview — released Feb 19, 2026 (3.0-pro shut down Mar 9, 2026)
 *             gemini-3.1-flash-lite-preview — released Mar 3, 2026
 */

export const AI_MODELS = {
  // OpenAI — GPT-5.4: frontier model for complex professional work and reasoning
  OPENAI: {
    primary: "gpt-5.4",
    fallback: "gpt-5-mini",
    description: "GPT-5.4: frontier model with 272K context, configurable reasoning effort, computer use API (March 2026)",
    capabilities: ["advanced reasoning", "coding", "computer use", "272K context", "configurable reasoning effort"],
    maxTokens: 272_000,
    released: "2026-03-01",
  },

  // Anthropic — Claude Sonnet 4.6: best Sonnet ever, 1M token context window in beta
  ANTHROPIC: {
    primary: "claude-sonnet-4-6",
    fallback: "claude-opus-4-6",
    description: "Claude Sonnet 4.6: Anthropic's best Sonnet, 1M token context (beta), top coding & long-context reasoning (Feb 17, 2026)",
    capabilities: ["1M token context (beta)", "advanced coding", "computer use", "agent planning", "long-context reasoning"],
    maxTokens: 1_000_000,
    released: "2026-02-17",
  },

  // Google — Gemini 3.1 Pro Preview: latest Gemini, successor to 3.0 Pro
  GOOGLE: {
    primary: "gemini-3.1-pro-preview",
    fallback: "gemini-3.1-flash-lite-preview",
    description: "Gemini 3.1 Pro Preview: latest Gemini, replaces shut down Gemini 3.0 Pro (Feb 19, 2026)",
    capabilities: ["multimodal input/output", "advanced reasoning", "1M token context", "custom tool use"],
    maxTokens: 1_000_000,
    released: "2026-02-19",
  },
} as const;

export const MODEL_SELECTION_STRATEGY = {
  // Compliance document generation — GPT-5.4 for quality + configurable reasoning depth
  COMPLIANCE_GENERATION: {
    primary: AI_MODELS.OPENAI.primary,
    secondary: AI_MODELS.ANTHROPIC.primary,
    rationale: "GPT-5.4 for high-quality generation with configurable reasoning; Sonnet 4.6 for policy-heavy content with 1M context",
  },

  // Risk analysis — Claude Sonnet 4.6 excels at long-context reasoning and agent planning
  RISK_ANALYSIS: {
    primary: AI_MODELS.ANTHROPIC.primary,
    secondary: AI_MODELS.OPENAI.primary,
    rationale: "Claude Sonnet 4.6 for deep analytical reasoning over large compliance contexts",
  },

  // Large context processing — Gemini 3.1 Pro handles massive document sets
  LARGE_CONTEXT: {
    primary: AI_MODELS.GOOGLE.primary,
    secondary: AI_MODELS.GOOGLE.fallback,
    rationale: "Gemini 3.1 Pro Preview for 1M token multi-document context analysis",
  },
} as const;

const modelStrategyMap = new Map(Object.entries(MODEL_SELECTION_STRATEGY));

export const getOptimalModel = (taskType: keyof typeof MODEL_SELECTION_STRATEGY) => {
  return modelStrategyMap.get(taskType);
};

export const getAllModels = () => AI_MODELS;

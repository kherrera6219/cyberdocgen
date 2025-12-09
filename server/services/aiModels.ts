/**
 * Latest AI Model Configurations
 * Updated to use the most advanced available models as of January 2025
 */

export const AI_MODELS = {
  // OpenAI - GPT-4o (Latest stable model)
  OPENAI: {
    primary: "gpt-4o",
    fallback: "gpt-4o-mini",
    description: "Latest GPT-4o with advanced reasoning and multi-modal capabilities",
    capabilities: ["advanced reasoning", "coding", "document generation", "multi-modal"],
    maxTokens: 128000,
    released: "2024-05-13",
  },

  // Anthropic - Claude Opus 4.1 (Released August 5, 2025) 
  ANTHROPIC: {
    primary: "claude-opus-4-1",
    fallback: "claude-sonnet-4",
    description: "World's best coding model with hybrid reasoning capabilities",
    capabilities: ["hybrid reasoning", "advanced coding", "7-hour autonomous tasks", "extended thinking"],
    maxTokens: 500000,
    released: "2025-08-05",
  },

  // Google - Gemini 2.5 Pro (Available now with thinking)
  GOOGLE: {
    primary: "gemini-2.5-pro",
    fallback: "gemini-2.5-pro-preview-06-05",
    description: "Latest Gemini with built-in thinking capabilities and 1M token context",
    capabilities: ["thinking model", "multimodal", "1M token context", "adaptive reasoning"],
    maxTokens: 1000000,
    released: "2025-03-01",
  },
} as const;

export const MODEL_SELECTION_STRATEGY = {
  // For compliance document generation
  COMPLIANCE_GENERATION: {
    primary: AI_MODELS.OPENAI.primary,
    secondary: AI_MODELS.ANTHROPIC.primary,
    rationale: "GPT-4o for quality generation, Claude for analytical backup"
  },

  // For risk analysis and reasoning
  RISK_ANALYSIS: {
    primary: AI_MODELS.ANTHROPIC.primary,
    secondary: AI_MODELS.OPENAI.primary,
    rationale: "Claude excels at analytical reasoning and risk assessment"
  },

  // For large document processing
  LARGE_CONTEXT: {
    primary: AI_MODELS.GOOGLE.primary,
    secondary: AI_MODELS.GOOGLE.fallback,
    rationale: "Gemini handles massive context windows best"
  },
} as const;

export const getOptimalModel = (taskType: keyof typeof MODEL_SELECTION_STRATEGY) => {
  return MODEL_SELECTION_STRATEGY[taskType];
};

export const getAllModels = () => AI_MODELS;
/**
 * Latest AI Model Configurations
 * Updated to use the most advanced available models as of December 2024
 */

export const AI_MODELS = {
  // OpenAI - GPT-4.1 (Latest coding-focused model with 1M token context)
  OPENAI: {
    primary: "gpt-5.1",
    fallback: "gpt-4.1-mini",
    description: "Latest GPT-4.1 with 1M token context, 54.6% on SWE-bench, optimized for coding",
    capabilities: ["advanced reasoning", "coding", "document generation", "1M token context"],
    maxTokens: 1000000,
    released: "2024-04-14",
  },

  // Anthropic - Claude Opus 4.1 (Released August 5, 2025) 
  ANTHROPIC: {
    primary: "claude-opus-4-5",
    fallback: "claude-sonnet-4",
    description: "World's best coding model with hybrid reasoning capabilities",
    capabilities: ["hybrid reasoning", "advanced coding", "7-hour autonomous tasks", "extended thinking"],
    maxTokens: 500000,
    released: "2025-08-05",
  },

  // Google - Gemini 2.0 Flash (Latest multimodal model)
  GOOGLE: {
    primary: "gemini-3.0-pro",
    fallback: "gemini-1.5-pro",
    description: "Latest Gemini 2.0 with native multimodal output, 2x faster than 1.5 Pro",
    capabilities: ["multimodal input/output", "native tool use", "1M token context", "image generation"],
    maxTokens: 1000000,
    released: "2024-12-11",
  },
} as const;

export const MODEL_SELECTION_STRATEGY = {
  // For compliance document generation
  COMPLIANCE_GENERATION: {
    primary: AI_MODELS.OPENAI.primary,
    secondary: AI_MODELS.ANTHROPIC.primary,
    rationale: "GPT-4.1 for quality generation with 1M context, Claude for analytical backup"
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
    rationale: "Gemini 2.0 Flash handles massive context with multimodal capabilities"
  },
} as const;

const modelStrategyMap = new Map(Object.entries(MODEL_SELECTION_STRATEGY));

export const getOptimalModel = (taskType: keyof typeof MODEL_SELECTION_STRATEGY) => {
  return modelStrategyMap.get(taskType);
};

export const getAllModels = () => AI_MODELS;

/**
 * Latest AI Model Configurations
 * Updated to use the most advanced available models as of January 2025
 */

export const AI_MODELS = {
  // OpenAI - GPT-4o (latest available)
  OPENAI: {
    primary: "gpt-4o",
    fallback: "gpt-4-turbo",
    description: "Most advanced OpenAI model available",
    capabilities: ["advanced reasoning", "code generation", "document analysis"],
    maxTokens: 128000,
  },

  // Anthropic - Claude 3.5 Sonnet (latest stable)
  ANTHROPIC: {
    primary: "claude-3-5-sonnet-20241022",
    fallback: "claude-3-haiku-20240307",
    description: "Latest stable Claude model with superior reasoning",
    capabilities: ["analytical reasoning", "compliance analysis", "risk assessment"],
    maxTokens: 200000,
  },

  // Google - Gemini 2.0 Flash (experimental latest)
  GOOGLE: {
    primary: "gemini-2.0-flash-exp",
    fallback: "gemini-1.5-flash",
    description: "Latest experimental Gemini with massive context",
    capabilities: ["large context", "multimodal analysis", "document processing"],
    maxTokens: 1000000,
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
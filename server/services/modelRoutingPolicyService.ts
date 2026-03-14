import { logger } from "../utils/logger";

// Model IDs — March 2026. Must match AIModel type in aiOrchestrator.ts exactly.
export type RouteModel = "gpt-5.4" | "claude-sonnet-4-6" | "gemini-3.1-pro-preview" | "auto";
export type RoutedModel = Exclude<RouteModel, "auto">;

export interface ModelRoutingRequest {
  requestedModel?: RouteModel;
  operation:
    | "document_generation"
    | "content_generation"
    | "chat_response"
    | "export_generation"
    | "mcp_agent";
  framework?: string;
  templateCategory?: string;
  promptLength?: number;
}

export interface ModelRoutingResult {
  selectedModel: RoutedModel;
  fallbackModel: RoutedModel;
  reason: string;
}

class ModelRoutingPolicyService {
  route(request: ModelRoutingRequest): ModelRoutingResult {
    const requestedModel = request.requestedModel || "auto";
    if (requestedModel !== "auto") {
      return {
        selectedModel: requestedModel,
        fallbackModel: this.getFallbackModel(requestedModel),
        reason: "explicit_model_request",
      };
    }

    // Chat responses — Claude Sonnet 4.6 has 1M ctx for conversation history
    if (request.operation === "chat_response") {
      return {
        selectedModel: "claude-sonnet-4-6",
        fallbackModel: "gpt-5.4",
        reason: "chat_reasoning_policy",
      };
    }

    // Export generation — GPT-5.4 for structured output quality
    if (request.operation === "export_generation") {
      return {
        selectedModel: "gpt-5.4",
        fallbackModel: "claude-sonnet-4-6",
        reason: "export_quality_policy",
      };
    }

    if (request.operation === "document_generation") {
      const category = (request.templateCategory || "").toLowerCase();
      if (category.includes("policy")) {
        return {
          selectedModel: "claude-sonnet-4-6",
          fallbackModel: "gpt-5.4",
          reason: "policy_document_preference",
        };
      }
      if (category.includes("analysis") || category.includes("assessment")) {
        return {
          // Gemini 3.1 Pro for long-context analysis
          selectedModel: "gemini-3.1-pro-preview",
          fallbackModel: "claude-sonnet-4-6",
          reason: "analysis_document_preference",
        };
      }
    }

    // Large prompts — Gemini 3.1 Pro has 1M token context
    if ((request.promptLength || 0) > 15000) {
      return {
        selectedModel: "gemini-3.1-pro-preview",
        fallbackModel: "claude-sonnet-4-6",
        reason: "large_prompt_policy",
      };
    }

    const framework = (request.framework || "").toLowerCase();
    if (framework.includes("iso") || framework.includes("soc")) {
      return {
        selectedModel: "claude-sonnet-4-6",
        fallbackModel: "gpt-5.4",
        reason: "framework_policy_default",
      };
    }

    return {
      selectedModel: "gpt-5.4",
      fallbackModel: "gemini-3.1-pro-preview",
      reason: "default_policy",
    };
  }

  getFallbackModel(model: RoutedModel): RoutedModel {
    switch (model) {
      case "gpt-5.4":
        return "gemini-3.1-pro-preview";
      case "gemini-3.1-pro-preview":
        return "claude-sonnet-4-6";
      case "claude-sonnet-4-6":
      default:
        return "gpt-5.4";
    }
  }

  logRoutingDecision(request: ModelRoutingRequest, result: ModelRoutingResult): void {
    logger.info("Model routing policy decision", {
      requestedModel: request.requestedModel || "auto",
      operation: request.operation,
      framework: request.framework,
      selectedModel: result.selectedModel,
      fallbackModel: result.fallbackModel,
      reason: result.reason,
    });
  }
}

export const modelRoutingPolicyService = new ModelRoutingPolicyService();

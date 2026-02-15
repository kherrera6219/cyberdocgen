import { logger } from "../utils/logger";

export type RouteModel = "gpt-5.1" | "claude-sonnet-4" | "gemini-3-pro" | "auto";
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

    if (request.operation === "chat_response") {
      return {
        selectedModel: "claude-sonnet-4",
        fallbackModel: "gpt-5.1",
        reason: "chat_reasoning_policy",
      };
    }

    if (request.operation === "export_generation") {
      return {
        selectedModel: "gpt-5.1",
        fallbackModel: "claude-sonnet-4",
        reason: "export_quality_policy",
      };
    }

    if (request.operation === "document_generation") {
      const category = (request.templateCategory || "").toLowerCase();
      if (category.includes("policy")) {
        return {
          selectedModel: "claude-sonnet-4",
          fallbackModel: "gpt-5.1",
          reason: "policy_document_preference",
        };
      }
      if (category.includes("analysis") || category.includes("assessment")) {
        return {
          selectedModel: "gemini-3-pro",
          fallbackModel: "claude-sonnet-4",
          reason: "analysis_document_preference",
        };
      }
    }

    if ((request.promptLength || 0) > 15000) {
      return {
        selectedModel: "gemini-3-pro",
        fallbackModel: "claude-sonnet-4",
        reason: "large_prompt_policy",
      };
    }

    const framework = (request.framework || "").toLowerCase();
    if (framework.includes("iso") || framework.includes("soc")) {
      return {
        selectedModel: "claude-sonnet-4",
        fallbackModel: "gpt-5.1",
        reason: "framework_policy_default",
      };
    }

    return {
      selectedModel: "gpt-5.1",
      fallbackModel: "gemini-3-pro",
      reason: "default_policy",
    };
  }

  getFallbackModel(model: RoutedModel): RoutedModel {
    switch (model) {
      case "gpt-5.1":
        return "gemini-3-pro";
      case "gemini-3-pro":
        return "claude-sonnet-4";
      case "claude-sonnet-4":
      default:
        return "gpt-5.1";
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

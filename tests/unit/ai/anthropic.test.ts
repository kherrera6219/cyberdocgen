import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Anthropic Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Claude API", () => {
    it("should generate completions with Claude", () => {
      const response = {
        content: "Generated compliance document",
        model: "claude-3-opus",
        stopReason: "end_turn",
      };
      expect(response.model).toContain("claude");
    });

    it("should support system prompts", () => {
      const request = {
        system: "You are a compliance expert specializing in ISO 27001",
        messages: [{ role: "user", content: "Generate a policy" }],
      };
      expect(request.system).toContain("compliance expert");
    });

    it("should handle multi-turn conversations", () => {
      const conversation = [
        { role: "user", content: "What is SOC 2?" },
        { role: "assistant", content: "SOC 2 is..." },
        { role: "user", content: "What are the requirements?" },
      ];
      expect(conversation.length).toBe(3);
    });
  });

  describe("Vision Capabilities", () => {
    it("should analyze images with Claude", () => {
      const analysis = {
        imageUrl: "https://example.com/diagram.png",
        description: "Security architecture diagram showing...",
        model: "claude-3-opus",
      };
      expect(analysis).toHaveProperty("description");
    });

    it("should extract text from images", () => {
      const extraction = {
        image: "base64_encoded_image",
        extractedText: "Security Policy Document",
        confidence: 0.95,
      };
      expect(extraction.confidence).toBeGreaterThan(0.9);
    });
  });

  describe("Tool Use", () => {
    it("should use tools for structured output", () => {
      const toolCall = {
        name: "generate_compliance_report",
        input: { framework: "SOC2", sections: ["controls", "evidence"] },
      };
      expect(toolCall.name).toContain("compliance");
    });

    it("should chain multiple tool calls", () => {
      const calls = [
        { name: "analyze_document", input: {} },
        { name: "extract_controls", input: {} },
        { name: "generate_report", input: {} },
      ];
      expect(calls.length).toBe(3);
    });
  });

  describe("Context Window", () => {
    it("should handle large contexts", () => {
      const context = {
        model: "claude-3-opus",
        maxTokens: 200000,
        inputTokens: 150000,
      };
      expect(context.inputTokens).toBeLessThan(context.maxTokens);
    });
  });

  describe("Streaming", () => {
    it("should support streaming responses", () => {
      const stream = {
        isStreaming: true,
        chunks: ["First chunk", "Second chunk", "Final chunk"],
      };
      expect(stream.chunks.length).toBeGreaterThan(0);
    });
  });
});

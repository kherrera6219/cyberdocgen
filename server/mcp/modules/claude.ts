import { Anthropic } from "@anthropic-ai/sdk";
import type { MCPModule, MCPRequest, MCPResponse } from "../module";

export class ClaudeModule implements MCPModule {
  name = "claude";
  private client!: Anthropic;

  async init(): Promise<void> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    this.client = new Anthropic({ apiKey });
  }

  async sendRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      const response = await this.client.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        messages: [{ role: "user", content: request.prompt }],
      });
      const block = response.content[0];
      const output = block && block.type === "text" ? block.text : "";
      return { success: true, output };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }
}

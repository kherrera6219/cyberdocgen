import OpenAI from "openai";
import type { MCPModule, MCPRequest, MCPResponse } from "../module";

export class OpenAIModule implements MCPModule {
  name = "openai";
  private client!: OpenAI;

  async init(): Promise<void> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    this.client = new OpenAI({ apiKey });
  }

  async sendRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: request.prompt }],
      });
      const output = completion.choices?.[0]?.message?.content ?? "";
      return { success: true, output };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }
}

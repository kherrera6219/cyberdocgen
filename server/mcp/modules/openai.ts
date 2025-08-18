import OpenAI from "openai";
import type { MCPModule, MCPRequest, MCPResponse } from "../module";

export class OpenAIModule implements MCPModule {
  name = "openai";
  private client!: OpenAI;

  async init(): Promise<void> {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async sendRequest(request: MCPRequest): Promise<MCPResponse> {
    const completion = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: request.prompt }],
    });
    const output = completion.choices?.[0]?.message?.content ?? "";
    return { success: true, output };
  }
}

import { GoogleGenerativeAI } from "@google/genai";
import type { MCPModule, MCPRequest, MCPResponse } from "../module";

export class GeminiModule implements MCPModule {
  name = "gemini";
  private model: any;

  async init(): Promise<void> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is not set");
    }
    const client = new GoogleGenerativeAI(apiKey);
    this.model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async sendRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      const result = await this.model.generateContent(request.prompt);
      const output = result.response?.text() ?? "";
      return { success: true, output };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }
}

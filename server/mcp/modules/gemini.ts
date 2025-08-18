import { GoogleGenerativeAI } from "@google/genai";
import type { MCPModule, MCPRequest, MCPResponse } from "../module";

export class GeminiModule implements MCPModule {
  name = "gemini";
  private model: any;

  async init(): Promise<void> {
    const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? "");
    this.model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async sendRequest(request: MCPRequest): Promise<MCPResponse> {
    const result = await this.model.generateContent(request.prompt);
    const output = result.response?.text() ?? "";
    return { success: true, output };
  }
}

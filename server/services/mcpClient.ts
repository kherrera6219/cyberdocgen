import { createOperationsAgent } from "../mcp";
import type { MCPResponse } from "../mcp/module";

const agentPromise = createOperationsAgent();

export async function sendMCPRequest(prompt: string, module?: string): Promise<string> {
  const agent = await agentPromise;
  const response: MCPResponse = await agent.handleRequest({ prompt, module });
  if (!response.success) {
    throw new Error(response.output);
  }
  return response.output;
}

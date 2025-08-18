import type { MCPModule, MCPRequest, MCPResponse } from "./module";

export class OperationsAgent {
  private modules = new Map<string, MCPModule>();

  async registerModule(module: MCPModule, config?: Record<string, unknown>): Promise<void> {
    if (module.init) {
      await module.init(config);
    }
    this.modules.set(module.name, module);
  }

  private selectModule(request: MCPRequest): string {
    if (request.module && this.modules.has(request.module)) {
      return request.module;
    }
    // Basic heuristic: default to OpenAI
    return "openai";
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    const moduleName = this.selectModule(request);
    const mod = this.modules.get(moduleName);
    if (!mod) {
      return { success: false, output: `Module ${moduleName} not available` };
    }
    return mod.sendRequest(request);
  }
}

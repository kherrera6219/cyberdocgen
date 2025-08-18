export interface MCPRequest {
  prompt: string;
  module?: string;
}

export interface MCPResponse {
  success: boolean;
  output: string;
}

export interface MCPModule {
  name: string;
  init?(config?: Record<string, unknown>): Promise<void>;
  sendRequest(request: MCPRequest): Promise<MCPResponse>;
  terminate?(): Promise<void>;
}

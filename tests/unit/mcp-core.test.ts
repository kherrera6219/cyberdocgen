import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies MUST be defined BEFORE target files are imported
vi.mock('../../server/mcp/toolRegistry', () => ({
  toolRegistry: {
    registerTool: vi.fn(),
    getAllTools: vi.fn().mockReturnValue(new Array(5)),
    getAllToolDocumentation: vi.fn(),
    executeTool: vi.fn(),
    unregisterTool: vi.fn(),
    getTool: vi.fn(),
    getToolsByType: vi.fn(),
    listToolNames: vi.fn()
  }
}));

vi.mock('../../server/mcp/agentClient', () => ({
  agentClient: {
    registerAgent: vi.fn(),
    listAgents: vi.fn().mockReturnValue(new Array(3)),
    execute: vi.fn(),
    getAgent: vi.fn(),
    clearConversation: vi.fn()
  }
}));

vi.mock('../../server/services/chatbot', () => ({
  complianceChatbot: {
    processMessage: vi.fn(),
    getSuggestedQuestions: vi.fn()
  }
}));

vi.mock('../../server/services/aiOrchestrator', () => ({
  aiOrchestrator: {
    generateDocument: vi.fn(),
    generateComplianceDocuments: vi.fn(),
    generateInsights: vi.fn(),
    analyzeQuality: vi.fn(),
    healthCheck: vi.fn()
  }
}));

vi.mock('../../server/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

import { initializeMCP, getRecommendedAgent } from '../../server/mcp/initialize';
import { toolRegistry } from '../../server/mcp/toolRegistry';
import { agentClient } from '../../server/mcp/agentClient';
import { 
  processChatMessage, 
  generateWithExistingService, 
  batchGenerateWithExistingService,
  getComplianceInsights,
  analyzeQualityWithExistingService,
  checkAIServiceHealth,
  MCPLegacyAdapter
} from '../../server/mcp/integration';
import { complianceChatbot } from '../../server/services/chatbot';
import { aiOrchestrator } from '../../server/services/aiOrchestrator';

describe('MCP Core Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialize.ts', () => {
    it('initializeMCP should register tools and agents', () => {
      initializeMCP();
      expect(toolRegistry.registerTool).toHaveBeenCalled();
      expect(agentClient.registerAgent).toHaveBeenCalled();
    });

    it('getRecommendedAgent should return correct agent IDs', () => {
      expect(getRecommendedAgent('generate a policy')).toBe('document-generator');
      expect(getRecommendedAgent('perform risk assessment')).toBe('risk-assessment');
      expect(getRecommendedAgent('conduct gap analysis')).toBe('compliance-assistant');
      expect(getRecommendedAgent('extract data from pdf')).toBe('data-extractor');
      expect(getRecommendedAgent('hello')).toBe('compliance-chat');
    });
  });

  describe('integration.ts', () => {
    const mockContext = { userId: 'user-1', sessionId: 'sess-1' };

    it('processChatMessage should wrap chatbot service', async () => {
      (complianceChatbot.processMessage as any).mockResolvedValue({
        message: 'hello',
        confidence: 0.9,
        sources: []
      });

      const result = await processChatMessage('hi', mockContext);
      expect(result.success).toBe(true);
      expect(result.data.message).toBe('hello');
      expect(complianceChatbot.processMessage).toHaveBeenCalledWith('hi', 'user-1', 'sess-1', undefined);
    });

    it('processChatMessage should handle errors', async () => {
      (complianceChatbot.processMessage as any).mockRejectedValue(new Error('fail'));
      const result = await processChatMessage('hi', mockContext);
      expect(result.success).toBe(false);
      expect(result.error).toBe('fail');
    });

    it('generateWithExistingService should wrap aiOrchestrator', async () => {
      (aiOrchestrator.generateDocument as any).mockResolvedValue({ qualityScore: 85, model: 'gpt-4' });
      const result = await generateWithExistingService({}, {}, 'NIST');
      expect(result.success).toBe(true);
      expect(result.metadata!.qualityScore).toBe(85);
    });

    it('batchGenerateWithExistingService should wrap aiOrchestrator', async () => {
      (aiOrchestrator.generateComplianceDocuments as any).mockResolvedValue([
        { qualityScore: 80 }, { qualityScore: 90 }
      ]);
      const result = await batchGenerateWithExistingService({}, 'SOC2');
      expect(result.success).toBe(true);
      expect(result.metadata!.count).toBe(2);
      expect(result.metadata!.averageQuality).toBe(85);
    });

    it('getComplianceInsights should wrap aiOrchestrator', async () => {
      (aiOrchestrator.generateInsights as any).mockResolvedValue({ 
        riskScore: 70, 
        keyRisks: [1, 2] 
      });
      const result = await getComplianceInsights({}, 'ISO27001');
      expect(result.success).toBe(true);
      expect(result.metadata!.riskScore).toBe(70);
    });

    it('analyzeQualityWithExistingService should wrap aiOrchestrator', async () => {
      (aiOrchestrator.analyzeQuality as any).mockResolvedValue({ 
        score: 95, 
        suggestions: ['fix this'] 
      });
      const result = await analyzeQualityWithExistingService('content', 'NIST');
      expect(result.success).toBe(true);
      expect(result.metadata!.score).toBe(95);
    });

    it('checkAIServiceHealth should wrap aiOrchestrator', async () => {
      (aiOrchestrator.healthCheck as any).mockResolvedValue({
        status: 'healthy',
        models: {
          'gpt-5.1': true,
          'claude-sonnet-4': true,
          'gemini-3-pro': true,
        },
      });
      const result = await checkAIServiceHealth();
      expect(result.success).toBe(true);
      expect(result.metadata!.allHealthy).toBe(true);
    });

    it('checkAIServiceHealth should handle errors', async () => {
      (aiOrchestrator.healthCheck as any).mockRejectedValue(new Error('unhealthy'));
      const result = await checkAIServiceHealth();
      expect(result.success).toBe(false);
      expect(result.error).toBe('unhealthy');
    });

    it('batchGenerateWithExistingService should handle errors', async () => {
      (aiOrchestrator.generateComplianceDocuments as any).mockRejectedValue(new Error('batch fail'));
      const result = await batchGenerateWithExistingService({}, 'NIST');
      expect(result.success).toBe(false);
      expect(result.error).toBe('batch fail');
    });

    it('getComplianceInsights should handle errors', async () => {
      (aiOrchestrator.generateInsights as any).mockRejectedValue(new Error('insight fail'));
      const result = await getComplianceInsights({}, 'NIST');
      expect(result.success).toBe(false);
      expect(result.error).toBe('insight fail');
    });

    it('analyzeQualityWithExistingService should handle errors', async () => {
      (aiOrchestrator.analyzeQuality as any).mockRejectedValue(new Error('quality fail'));
      const result = await analyzeQualityWithExistingService('content', 'NIST');
      expect(result.success).toBe(false);
      expect(result.error).toBe('quality fail');
    });

    describe('Factory functions', () => {
      it('createMCPChatbotWrapper should return functioning wrapper', async () => {
        const { createMCPChatbotWrapper } = await import('../../server/mcp/integration');
        const wrapper = createMCPChatbotWrapper();
        (complianceChatbot.processMessage as any).mockResolvedValue({ 
          message: 'hi', 
          confidence: 1, 
          sources: [] 
        });
        const result = await wrapper.processMessage('hello', 'user-1');
        expect(result.success).toBe(true);
        expect(complianceChatbot.processMessage).toHaveBeenCalled();
      });

      it('createAgentDocumentGenerator should return functioning generator', async () => {
        const { createAgentDocumentGenerator } = await import('../../server/mcp/integration');
        const generator = createAgentDocumentGenerator();
        (agentClient.execute as any).mockResolvedValue({ output: 'done' });
        const result = await generator.generate({ title: 'T' }, { name: 'C' }, 'NIST', 'user-1') as any;
        expect(result.output).toBe('done');
        expect(agentClient.execute).toHaveBeenCalled();
      });

      it('createAgentRiskAssessor should return functioning assessor', async () => {
        const { createAgentRiskAssessor } = await import('../../server/mcp/integration');
        const assessor = createAgentRiskAssessor();
        (agentClient.execute as any).mockResolvedValue({ output: 'safe' });
        const result = await assessor.assess({ name: 'C' }, ['ISO'], 'user-1') as any;
        expect(result.output).toBe('safe');
        expect(agentClient.execute).toHaveBeenCalled();
      });
    });

    describe('MCPLegacyAdapter', () => {
      it('executeTool should call toolRegistry', async () => {
        (toolRegistry.executeTool as any).mockResolvedValue({ success: true, data: 'ok' });
        const result = await MCPLegacyAdapter.executeTool('my-tool', { x: 1 }, 'user-1');
        expect(result).toBe('ok');
        expect(toolRegistry.executeTool).toHaveBeenCalled();
      });

      it('executeAgent should call agentClient', async () => {
        (agentClient.execute as any).mockResolvedValue({ output: 'hi' });
        const result = await MCPLegacyAdapter.executeAgent('agent-1', 'prompt', 'user-1');
        expect(result.output).toBe('hi');
        expect(agentClient.execute).toHaveBeenCalled();
      });
    });
  });
});

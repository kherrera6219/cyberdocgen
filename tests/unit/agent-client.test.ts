
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as agentClientMod from '../../server/mcp/agentClient';
const { agentClient } = agentClientMod;
import { toolRegistry } from '../../server/mcp/toolRegistry';
import { AgentCapability } from '../../server/mcp/types';

// Mock OpenAI and Anthropic
const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'AI Response', role: 'assistant' } }]
      })
    }
  }
};

const mockAnthropic = {
  messages: {
    create: vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'Claude Response' }],
      role: 'assistant',
      usage: { input_tokens: 10, output_tokens: 10 }
    })
  }
};

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => mockOpenAI)
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => mockAnthropic)
}));

describe('AgentClient', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.clearAllMocks();
    agentClient.clearConversation('test-conv');
    // Spy and bypass env checks
    vi.spyOn(agentClientMod as any, 'getOpenAIClient').mockReturnValue(mockOpenAI as any);
    vi.spyOn(agentClientMod as any, 'getAnthropicClient').mockReturnValue(mockAnthropic as any);
  });

  it('should register and list agents', () => {
    const config = {
      id: 'agent1',
      name: 'Agent One',
      description: 'Test agent description',
      provider: 'openai' as const,
      model: 'gpt-5.1' as const,
      systemPrompt: 'Be a helper',
      tools: [],
      capabilities: [AgentCapability.CHAT_INTERACTION]
    };
    agentClient.registerAgent(config);
    expect(agentClient.getAgent('agent1')).toEqual(config);
    expect(agentClient.listAgents()).toContainEqual(config);
  });

  it('should manage conversation history', () => {
    const messages = [{ role: 'user', content: 'hello' }];
    (agentClient as any).saveConversationHistory('c1', messages);
    expect((agentClient as any).getConversationHistory('c1')).toEqual(messages);
    
    agentClient.clearConversation('c1');
    expect((agentClient as any).getConversationHistory('c1')).toEqual([]);
  });

  it('should prepare tools for agents', () => {
    vi.spyOn(toolRegistry, 'getTool').mockReturnValue({
      name: 't1',
      description: 'desc',
      parameters: [{ name: 'p', type: 'string', required: true }]
    } as any);

    const tools = (agentClient as any).prepareTools(['t1']);
    expect(tools).toHaveLength(1);
    expect(tools[0].function.name).toBe('t1');
  });

  it('should execute OpenAI agent requests', async () => {
    const config = {
      id: 'oa1',
      name: 'OA',
      description: 'OA desc',
      provider: 'openai' as const,
      model: 'gpt-5.1' as const,
      systemPrompt: 'v',
      tools: [],
      capabilities: [AgentCapability.CHAT_INTERACTION]
    };
    agentClient.registerAgent(config);
    
    const result = await agentClient.execute({
      agentId: 'oa1',
      prompt: 'hello',
      conversationId: 'c2',
      tools: []
    } as any, { userId: 'u1' });

    expect(result.content).toBe('AI Response');
  });

  it('should execute Anthropic agent requests', async () => {
    const config = {
      id: 'an1',
      name: 'AN',
      description: 'AN desc',
      provider: 'anthropic' as const,
      model: 'claude-sonnet-4' as const,
      systemPrompt: 'v',
      tools: [],
      capabilities: [AgentCapability.CHAT_INTERACTION]
    };
    agentClient.registerAgent(config);
    
    const result = await agentClient.execute({
      agentId: 'an1',
      prompt: 'hello',
      conversationId: 'c3',
      tools: []
    } as any, { userId: 'u1' });

    expect(result.content).toBe('Claude Response');
  });
});

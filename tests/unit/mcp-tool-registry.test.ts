
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toolRegistry } from '../../server/mcp/toolRegistry';
import { Tool, ToolType, ToolContext } from '../../server/mcp/types';

process.env.NODE_ENV = 'development';

describe('ToolRegistry', () => {
  beforeEach(() => {
    // Access non-public methods if needed or rely on public ones
    // Many registries are singletons, so we might need a reset or just unique names
    // toolRegistry.getAllTools().forEach(t => toolRegistry.unregisterTool(t.name));
  });

  const mockTool: Tool = {
    name: 'test_tool',
    description: 'A test tool',
    type: 'internal' as ToolType,
    parameters: [
      { name: 'param1', type: 'string', required: true, description: 'p1' },
      { name: 'param2', type: 'number', required: false, description: 'p2' }
    ],
    returns: { type: 'object', description: 'ret' },
    handler: async (params) => ({ success: true, data: params })
  };

  it('should register and unregister tools', () => {
    toolRegistry.registerTool(mockTool);
    expect(toolRegistry.getTool('test_tool')).toBe(mockTool);
    expect(toolRegistry.listToolNames()).toContain('test_tool');
    
    toolRegistry.unregisterTool('test_tool');
    expect(toolRegistry.getTool('test_tool')).toBeUndefined();
  });

  it('should get tools by type', () => {
    toolRegistry.registerTool(mockTool);
    const internalTools = toolRegistry.getToolsByType('internal' as ToolType);
    expect(internalTools.some(t => t.name === 'test_tool')).toBe(true);
    toolRegistry.unregisterTool('test_tool');
  });

  it('should validate parameters correctly', async () => {
    toolRegistry.registerTool(mockTool);
    const context: ToolContext = { userId: 'user1', organizationId: 'org1' };
    
    // Missing required param
    const result1 = await toolRegistry.executeTool('test_tool', {}, context);
    expect(result1.success).toBe(false);
    expect(result1.error).toContain('Missing required parameter');

    // Wrong type
    const result2 = await toolRegistry.executeTool('test_tool', { param1: 123 }, context);
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('must be of type string');

    // Correct types
    const result3 = await toolRegistry.executeTool('test_tool', { param1: 'val', param2: 123 }, context);
    expect(result3.success).toBe(true);
    expect(result3.data).toEqual({ param1: 'val', param2: 123 });
    
    toolRegistry.unregisterTool('test_tool');
  });

  it('should enforce authentication', async () => {
    const secureTool: Tool = {
      ...mockTool,
      name: 'secure_tool',
      requiresAuth: true
    };
    toolRegistry.registerTool(secureTool);

    const result = await toolRegistry.executeTool('secure_tool', { param1: 'v' }, {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('Authentication required');
    
    toolRegistry.unregisterTool('secure_tool');
  });

  it('should enforce rate limits', async () => {
    const limitedTool: Tool = {
      ...mockTool,
      name: 'limited_tool',
      rateLimit: { maxCalls: 2, windowMs: 1000 }
    };
    toolRegistry.registerTool(limitedTool);
    const context = { userId: 'u1' };

    await toolRegistry.executeTool('limited_tool', { param1: 'v' }, context); // 1
    await toolRegistry.executeTool('limited_tool', { param1: 'v' }, context); // 2
    const result = await toolRegistry.executeTool('limited_tool', { param1: 'v' }, context); // 3
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Rate limit exceeded');
    
    toolRegistry.unregisterTool('limited_tool');
  });

  it('should provide documentation', () => {
    toolRegistry.registerTool(mockTool);
    const doc = toolRegistry.getToolDocumentation('test_tool');
    expect(doc.name).toBe('test_tool');
    expect(doc.parameters).toHaveLength(2);

    const allDocs = toolRegistry.getAllToolDocumentation();
    expect(allDocs.some(d => d.name === 'test_tool')).toBe(true);
    
    toolRegistry.unregisterTool('test_tool');
  });

  it('should handle handler errors gracefully', async () => {
    const errorTool: Tool = {
      ...mockTool,
      name: 'error_tool',
      handler: async () => { throw new Error('Boom'); }
    };
    toolRegistry.registerTool(errorTool);

    const result = await toolRegistry.executeTool('error_tool', { param1: 'v' }, {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('Tool execution failed: Boom');
    
    toolRegistry.unregisterTool('error_tool');
  });
});

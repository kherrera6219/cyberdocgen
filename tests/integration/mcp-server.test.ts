import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { mcpRouter } from '../../server/mcp/server';
import { toolRegistry } from '../../server/mcp/toolRegistry';
import { agentClient } from '../../server/mcp/agentClient';
import { auditService } from '../../server/services/auditService';

// Mock dependencies
vi.mock('../../server/mcp/toolRegistry', () => ({
  toolRegistry: {
    getAllToolDocumentation: vi.fn(),
    getToolDocumentation: vi.fn(),
    executeTool: vi.fn(),
    getAllTools: vi.fn().mockReturnValue([])
  }
}));

vi.mock('../../server/mcp/agentClient', () => ({
  agentClient: {
    listAgents: vi.fn(),
    getAgent: vi.fn(),
    execute: vi.fn(),
    clearConversation: vi.fn()
  }
}));

vi.mock('../../server/services/auditService', () => ({
  auditService: {
    logAudit: vi.fn().mockResolvedValue({}),
    logEvent: vi.fn().mockResolvedValue({}),
    logAuditEvent: vi.fn().mockResolvedValue({})
  },
  AuditAction: {
    READ: 'READ',
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE'
  }
}));

vi.mock('../../server/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn()
  }
}));

describe('MCP Server Integration Tests', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    // Mock user and session
    app.use((req: any, _res, next) => {
      req.user = { claims: { sub: 'user-123' }, organization: { id: 'org-123' } };
      req.sessionID = 'test-session';
      next();
    });
    app.use('/api/mcp', mcpRouter);
  });

  describe('GET /api/mcp/tools', () => {
    it('returns list of tools', async () => {
      (toolRegistry.getAllToolDocumentation as any).mockReturnValue([{ name: 'tool-1' }]);
      const response = await request(app).get('/api/mcp/tools');
      expect(response.status).toBe(200);
      expect(response.body.tools).toHaveLength(1);
    });

    it('returns 500 on failure', async () => {
      (toolRegistry.getAllToolDocumentation as any).mockImplementation(() => {
        throw new Error('db down');
      });
      const response = await request(app).get('/api/mcp/tools');
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('db down');
    });
  });

  describe('GET /api/mcp/tools/:name', () => {
    it('returns tool documentation', async () => {
      (toolRegistry.getToolDocumentation as any).mockReturnValue({ name: 'tool-1' });
      const response = await request(app).get('/api/mcp/tools/tool-1');
      expect(response.status).toBe(200);
      expect(response.body.tool.name).toBe('tool-1');
    });

    it('returns 404 if tool not found', async () => {
      (toolRegistry.getToolDocumentation as any).mockReturnValue(null);
      const response = await request(app).get('/api/mcp/tools/ghost');
      expect(response.status).toBe(404);
    });

    it('returns 500 on failure', async () => {
      (toolRegistry.getToolDocumentation as any).mockImplementation(() => {
        throw new Error('error');
      });
      const response = await request(app).get('/api/mcp/tools/tool-1');
      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/mcp/tools/:name/execute', () => {
    it('executes tool successfully', async () => {
      (toolRegistry.executeTool as any).mockResolvedValue({ success: true, data: 'result' });
      const response = await request(app)
        .post('/api/mcp/tools/tool-1/execute')
        .send({ parameters: { p: 1 } });
      
      expect(response.status).toBe(200);
      expect(response.body.result.data).toBe('result');
      expect((auditService as any).logAudit).toHaveBeenCalled();
    });

    it('returns 500 on failure', async () => {
      (toolRegistry.executeTool as any).mockRejectedValue(new Error('crash'));
      const response = await request(app)
        .post('/api/mcp/tools/tool-1/execute')
        .send({ parameters: { p: 1 } });
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('crash');
    });
  });

  describe('GET /api/mcp/agents', () => {
    it('returns list of agents', async () => {
      (agentClient.listAgents as any).mockReturnValue([{ id: 'agent-1', name: 'Agent 1' }]);
      const response = await request(app).get('/api/mcp/agents');
      expect(response.status).toBe(200);
      expect(response.body.agents).toHaveLength(1);
    });

    it('returns 500 on failure', async () => {
      (agentClient.listAgents as any).mockImplementation(() => {
        throw new Error('agent error');
      });
      const response = await request(app).get('/api/mcp/agents');
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/mcp/agents/:id', () => {
    it('returns agent details', async () => {
      (agentClient.getAgent as any).mockReturnValue({ id: 'agent-1', name: 'Agent 1' });
      const response = await request(app).get('/api/mcp/agents/agent-1');
      expect(response.status).toBe(200);
      expect(response.body.agent.id).toBe('agent-1');
    });

    it('returns 404 if agent not found', async () => {
      (agentClient.getAgent as any).mockReturnValue(null);
      const response = await request(app).get('/api/mcp/agents/ghost');
      expect(response.status).toBe(404);
    });

    it('returns 500 on error', async () => {
      (agentClient.getAgent as any).mockImplementation(() => { throw new Error('e'); });
      const response = await request(app).get('/api/mcp/agents/agent-1');
      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/mcp/agents/:id/execute', () => {
    it('executes agent successfully', async () => {
      (agentClient.execute as any).mockResolvedValue({ output: 'hi' });
      const response = await request(app)
        .post('/api/mcp/agents/agent-1/execute')
        .send({ prompt: 'hello' });
      
      expect(response.status).toBe(200);
      expect(response.body.response.output).toBe('hi');
    });

    it('returns 400 if prompt is missing', async () => {
      const response = await request(app).post('/api/mcp/agents/agent-1/execute').send({});
      expect(response.status).toBe(400);
    });

    it('returns 500 on failure', async () => {
      (agentClient.execute as any).mockRejectedValue(new Error('agent crash'));
      const response = await request(app)
        .post('/api/mcp/agents/agent-1/execute')
        .send({ prompt: 'hello' });
      
      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/mcp/agents/:id/clear', () => {
    it('clears conversation', async () => {
      const response = await request(app).post('/api/mcp/agents/agent-1/clear').send();
      expect(response.status).toBe(200);
      expect(agentClient.clearConversation).toHaveBeenCalled();
    });

    it('handles errors', async () => {
      (agentClient.clearConversation as any).mockImplementation(() => { throw new Error('fail'); });
      const response = await request(app).post('/api/mcp/agents/agent-1/clear').send();
      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/mcp/tools/batch', () => {
    it('executes tools in batch', async () => {
      (toolRegistry.executeTool as any).mockResolvedValue({ success: true, data: 'ok' });
      const response = await request(app)
        .post('/api/mcp/tools/batch')
        .send({ executions: [{ toolName: 't1', parameters: {} }] });
      
      expect(response.status).toBe(200);
      expect(response.body.results).toHaveLength(1);
    });

    it('returns 400 if executions is not an array', async () => {
      const response = await request(app).post('/api/mcp/tools/batch').send({ executions: {} });
      expect(response.status).toBe(400);
    });

    it('handles errors in batch execution', async () => {
      (toolRegistry.executeTool as any).mockImplementation(() => { throw new Error('batch crash'); });
      const response = await request(app)
        .post('/api/mcp/tools/batch')
        .send({ executions: [{ toolName: 't1' }] });
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/mcp/health', () => {
    it('returns healthy status', async () => {
      const response = await request(app).get('/api/mcp/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });
  });
});

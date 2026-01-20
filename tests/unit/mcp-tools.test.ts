
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDocumentTemplatesTool, getFrameworkInfoTool, batchGenerateDocumentsTool, calculateComplianceScoreTool } from '../../server/mcp/tools/advanced';
import { getCompanyProfileTool, getDocumentsTool, generateDocumentTool } from '../../server/mcp/tools/internal';
import { webSearchTool, fetchUrlTool } from '../../server/mcp/tools/external';

// Mock Services
vi.mock('../../server/storage', () => ({
  storage: {
    getCompanyProfile: vi.fn(),
    getDocuments: vi.fn(),
    getDocumentsByCompanyProfile: vi.fn(),
    getDocumentsByFramework: vi.fn(),
  }
}));

vi.mock('../../server/services/aiOrchestrator', () => ({
  aiOrchestrator: {
    generateComplianceDocuments: vi.fn(),
    generateDocument: vi.fn(),
    healthCheck: vi.fn(),
  }
}));

vi.mock('../../server/services/documentTemplates', () => ({
  DocumentTemplateService: {
    getTemplatesByFramework: vi.fn(),
    getAllTemplates: vi.fn(),
    getRequiredTemplates: vi.fn(),
  }
}));

import { storage } from '../../server/storage';
import { aiOrchestrator } from '../../server/services/aiOrchestrator';
import { DocumentTemplateService } from '../../server/services/documentTemplates';

describe('MCP Tools Implementation', () => {
  const context = { userId: 'user1', organizationId: 'org1' };

  describe('Advanced Tools', () => {
    it('getDocumentTemplatesTool should fetch templates', async () => {
      vi.mocked(DocumentTemplateService.getTemplatesByFramework).mockReturnValue([{ id: 't1', category: 'policy' }] as any);
      
      const result = await getDocumentTemplatesTool.handler({ framework: 'ISO27001' }, context);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(DocumentTemplateService.getTemplatesByFramework).toHaveBeenCalledWith('ISO27001');
    });

    it('getFrameworkInfoTool should return framework details', async () => {
      const result = await getFrameworkInfoTool.handler({ framework: 'SOC2' }, context);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('SOC 2');
    });

    it('batchGenerateDocumentsTool should orchestrate generation', async () => {
      vi.mocked(storage.getCompanyProfile).mockResolvedValue({ id: 'p1', name: 'Test Corp' } as any);
      vi.mocked(aiOrchestrator.generateComplianceDocuments).mockResolvedValue([{ title: 'Doc 1', qualityScore: 85 }] as any);

      const result = await batchGenerateDocumentsTool.handler({ companyProfileId: 'p1', framework: 'ISO27001' }, context);
      expect(result.success).toBe(true);
      expect(result.metadata?.averageQuality).toBe(85);
    });

    it('calculateComplianceScoreTool should compute scores', async () => {
      vi.mocked(storage.getDocumentsByFramework).mockResolvedValue([{ category: 'policy', qualityScore: 80 }] as any);
      vi.mocked(storage.getCompanyProfile).mockResolvedValue({ id: 'p1' } as any);
      vi.mocked(DocumentTemplateService.getRequiredTemplates).mockReturnValue([{}, {}] as any);

      const result = await calculateComplianceScoreTool.handler({ framework: 'ISO27001', companyProfileId: 'p1' }, context);
      expect(result.success).toBe(true);
      expect(result.data.overallScore).toBeDefined();
    });
  });

  describe('Internal Tools', () => {
    it('getCompanyProfileTool should fetch profile', async () => {
      vi.mocked(storage.getCompanyProfile).mockResolvedValue({ id: 'p1', name: 'Test Corp' } as any);
      
      const result = await getCompanyProfileTool.handler({ profileId: 'p1' }, context);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Test Corp');
    });

    it('getDocumentsTool should filter documents', async () => {
      vi.mocked(storage.getDocumentsByFramework).mockResolvedValue([{ id: 'd1' }] as any);
      
      const result = await getDocumentsTool.handler({ framework: 'ISO27001' }, context);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('generateDocumentTool should call orchestrator', async () => {
      vi.mocked(aiOrchestrator.generateDocument).mockResolvedValue({ content: 'Generated content' } as any);
      
      const params = { template: {}, companyProfile: {}, framework: 'ISO27001' };
      const result = await generateDocumentTool.handler(params, context);
      expect(result.success).toBe(true);
      expect(result.data.content).toBe('Generated content');
    });
  });

  describe('External Tools', () => {
    it('webSearchTool should return simulated results', async () => {
      const result = await webSearchTool.handler({ query: 'compliance' }, context);
      expect(result.success).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('fetchUrlTool should block local addresses', async () => {
      const result = await fetchUrlTool.handler({ url: 'http://localhost/bad' }, context);
      expect(result.success).toBe(false);
      expect(result.error).toContain('private or local');
    });
  });
});

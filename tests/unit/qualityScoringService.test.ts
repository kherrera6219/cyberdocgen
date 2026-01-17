import { describe, it, expect, vi, beforeEach } from 'vitest';
import { qualityScoringService } from '../../server/services/qualityScoring.ts';

// Mock AI Clients
const mockAnthropicCreate = vi.fn().mockImplementation(async (params) => {
  return {
    content: [{ 
      text: JSON.stringify({
        overallScore: 85,
        grade: 'B',
        metrics: [],
        strengths: ['Good'],
        weaknesses: [],
        recommendations: [],
        benchmarkComparison: {}
      }) 
    }] 
  };
});

const mockOpenAICreate = vi.fn().mockImplementation(async (params) => {
  return {
    choices: [{ 
      message: { 
        content: JSON.stringify({
          clarity: 80,
          completeness: 80,
          accuracy: 80,
          consistency: 80,
          usability: 80,
          compliance: 80,
          quickFixes: [],
          mediumTermImprovements: [],
          strategicEnhancements: [],
          priorityOrder: [],
          estimatedEffort: {}
        }) 
      } 
    }]
  };
});

vi.mock('../../server/services/aiClients', () => ({
  getAnthropicClient: vi.fn(() => ({
    messages: { create: mockAnthropicCreate }
  })),
  getOpenAIClient: vi.fn(() => ({
    chat: { completions: { create: mockOpenAICreate } }
  }))
}));

vi.mock('../../server/utils/logger', () => ({
  logger: { error: vi.fn() }
}));

describe('QualityScoringService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeDocumentQuality', () => {
    it('should analyze quality successfully', async () => {
      const result = await qualityScoringService.analyzeDocumentQuality(
        'content', 
        'Title', 
        'ISO 27001', 
        'Policy'
      );

      expect(result.overallScore).toBe(85);
      expect(result.grade).toBe('B');
    });
  });

  describe('analyzeContentStructure', () => {
    it('should analyze structure', async () => {
      const result = await qualityScoringService.analyzeContentStructure('content');

      expect(result.clarity).toBe(80);
    });
  });

  describe('checkFrameworkAlignment', () => {
    it('should check alignment', async () => {
      // Mock Anthropic response specifically for this?
      // The default mock returns the quality result structure, but checkFrameworkAlignment expects different JSON.
      // We should update the mock implementation to return different JSON based on context or just make it generic enough to not crash, 
      // or override the mock for this test.
      
      const mockAlignResponse = {
        framework: 'ISO 27001',
        alignmentScore: 90,
        coveredRequirements: [],
        missingRequirements: [],
        gapAnalysis: 'Good'
      };

      // Override mock behavior
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ text: JSON.stringify(mockAlignResponse) }]
      });

      const result = await qualityScoringService.checkFrameworkAlignment('content', 'ISO 27001', 'Policy');

      expect(result.alignmentScore).toBe(90);
    });
  });

  describe('trackQualityTrends', () => {
    it('should track improving trend', async () => {
      const history = [
        { date: new Date('2024-01-01'), score: 70 },
        { date: new Date('2024-01-02'), score: 75 },
        { date: new Date('2024-01-03'), score: 80 }, // +5 avg
      ];

      const result = await qualityScoringService.trackQualityTrends('d1', 85, history);

      expect(result.trend).toBe('improving');
      expect(result.changeRate).toBeGreaterThan(0);
    });

    it('should handle insufficient data', async () => {
      const result = await qualityScoringService.trackQualityTrends('d1', 85, []);
      expect(result.trend).toBe('stable');
    });
  });
});

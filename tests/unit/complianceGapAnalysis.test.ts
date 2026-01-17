import { describe, it, expect, vi, beforeEach } from 'vitest';
import { complianceGapAnalysisService } from '../../server/services/complianceGapAnalysis';
import { aiOrchestrator } from '../../server/services/aiOrchestrator';
import { CompanyProfile } from '@shared/schema';

// Mock aiOrchestrator
vi.mock('../../server/services/aiOrchestrator', () => ({
  aiOrchestrator: {
    generateContent: vi.fn()
  }
}));

describe('ComplianceGapAnalysisService', () => {
  const mockProfile: CompanyProfile = {
    id: 1,
    userId: 1,
    companyName: 'Test Corp',
    industry: 'Technology',
    companySize: '51-200',
    complianceFrameworks: ['iso27001'],
    onboardingCompleted: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockFindings = {
    findings: [
      {
        controlId: 'A.5.1',
        controlTitle: 'Information security policies',
        currentStatus: 'partially_implemented',
        riskLevel: 'high',
        gapDescription: 'Policies exist but not reviewed',
        businessImpact: 'Compliance risk',
        complianceScore: 50,
        priority: 4,
        estimatedEffort: 'medium'
      },
      {
        controlId: 'A.5.2',
        controlTitle: 'Roles and responsibilities',
        currentStatus: 'implemented',
        riskLevel: 'low',
        gapDescription: 'Defined but needs update',
        businessImpact: 'Operational efficiency',
        complianceScore: 80,
        priority: 2,
        estimatedEffort: 'low'
      }
    ]
  };

  const mockRemediation = {
    recommendations: [
      {
        title: 'Update Policies',
        description: 'Review and update all policies',
        implementation: 'Schedule quarterly reviews',
        resources: { templates: [], tools: [], references: [] },
        timeframe: 'short_term',
        cost: 'low',
        priority: 4
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeComplianceGaps', () => {
    it('successfully performs gap analysis with maturity assessment', async () => {
      // Mock main analysis response
      (aiOrchestrator.generateContent as any)
        .mockResolvedValueOnce({
          result: { content: JSON.stringify(mockFindings) }
        })
        // Mock remediation response
        .mockResolvedValueOnce({
          result: { content: JSON.stringify(mockRemediation) }
        });

      const result = await complianceGapAnalysisService.analyzeComplianceGaps(
        'org-1',
        mockProfile,
        {
          framework: 'iso27001',
          includeMaturityAssessment: true
        }
      );

      // Verify structure
      expect(result.report).toBeDefined();
      expect(result.report.overallScore).toBe(65); // (50 + 80) / 2
      expect(result.findings).toHaveLength(2);
      expect(result.recommendations).toHaveLength(1);
      expect(result.maturityAssessment).toBeDefined();
      expect(result.maturityAssessment?.maturityLevel).toBeGreaterThan(0);
      expect(result.executiveSummary).toBeDefined();
      expect(result.executiveSummary.criticalGaps).toBeDefined();

      // Verify calls
      expect(aiOrchestrator.generateContent).toHaveBeenCalledTimes(2);
    });

    it('handles unsupported frameworks gracefully', async () => {
      await expect(complianceGapAnalysisService.analyzeComplianceGaps(
        'org-1',
        mockProfile,
        {
          framework: 'invalid-framework' as any,
          includeMaturityAssessment: false
        }
      )).rejects.toThrow('Framework invalid-framework not supported');
    });

    it('handles AI service errors', async () => {
      (aiOrchestrator.generateContent as any).mockRejectedValue(new Error('AI Service Down'));

      await expect(complianceGapAnalysisService.analyzeComplianceGaps(
        'org-1',
        mockProfile,
        {
          framework: 'soc2',
          includeMaturityAssessment: false
        }
      )).rejects.toThrow('AI Service Down');
    });

    it('handles malformed AI response', async () => {
      (aiOrchestrator.generateContent as any).mockResolvedValue({
        result: { content: 'Not valid JSON' }
      });

      await expect(complianceGapAnalysisService.analyzeComplianceGaps(
        'org-1',
        mockProfile,
        {
          framework: 'iso27001',
          includeMaturityAssessment: false
        }
      )).rejects.toThrow('Failed to parse gap analysis results');
    });

    it('calculates executive summary correctly', async () => {
       (aiOrchestrator.generateContent as any)
        .mockResolvedValueOnce({ result: { content: JSON.stringify(mockFindings) } })
        .mockResolvedValueOnce({ result: { content: JSON.stringify(mockRemediation) } });

      const result = await complianceGapAnalysisService.analyzeComplianceGaps(
        'org-1',
        mockProfile,
        { framework: 'iso27001', includeMaturityAssessment: false }
      );

      expect(result.executiveSummary.topRisks).toBeInstanceOf(Array);
      expect(result.executiveSummary.estimatedRemediationTime).toBeDefined();
    });
  });
});

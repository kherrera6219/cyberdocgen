import { describe, it, expect, vi, beforeEach } from 'vitest';
import { riskAssessmentService } from '../../server/services/riskAssessment';
import { getOpenAIClient, getAnthropicClient } from '../../server/services/aiClients';
import { CompanyProfile } from '@shared/schema';

// Mock aiClients
vi.mock('../../server/services/aiClients', () => ({
  getOpenAIClient: vi.fn(),
  getAnthropicClient: vi.fn(),
}));

describe('RiskAssessmentService', () => {
    const mockProfile: CompanyProfile = {
        id: 1,
        userId: 1,
        companyName: 'Risk Corp',
        industry: 'Finance',
        companySize: '1000+',
        cloudInfrastructure: ['AWS', 'Azure'],
        dataClassification: 'Strict',
        businessApplications: 'SAP',
        complianceFrameworks: ['iso27001', 'soc2'],
        onboardingCompleted: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockOpenAIClient = {
        chat: { completions: { create: vi.fn() } }
    };

    const mockAnthropicClient = {
        messages: { create: vi.fn() }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (getOpenAIClient as any).mockReturnValue(mockOpenAIClient);
        (getAnthropicClient as any).mockReturnValue(mockAnthropicClient);
    });

    describe('assessOrganizationalRisk', () => {
        it('parses JSON response correctly', async () => {
            const mockResult = {
                overallRiskScore: 45,
                riskLevel: 'medium',
                riskFactors: [],
                complianceGaps: [],
                prioritizedActions: { immediate: [], shortTerm: [], longTerm: [] },
                frameworkReadiness: {},
                recommendations: { strategic: [], tactical: [], operational: [] }
            };

            mockAnthropicClient.messages.create.mockResolvedValue({
                content: [{ type: 'text', text: JSON.stringify(mockResult) }]
            });

            const result = await riskAssessmentService.assessOrganizationalRisk(mockProfile, ['iso27001']);
            expect(result.overallRiskScore).toBe(45);
        });

        it('falls back to text parsing on JSON error', async () => {
             mockAnthropicClient.messages.create.mockResolvedValue({
                content: [{ type: 'text', text: 'Analysis: Risk Score: 65. End.' }]
            });

            const result = await riskAssessmentService.assessOrganizationalRisk(mockProfile, ['iso27001']);
            expect(result.overallRiskScore).toBe(65);
            expect(result.riskLevel).toBe('high');
        });
    });

    describe('analyzeThreatLandscape', () => {
        it('returns structured threat assessment', async () => {
             const mockThreats = {
                industry: 'Finance',
                threatLandscape: [],
                vulnerabilities: [],
                complianceAlignment: []
            };

            mockOpenAIClient.chat.completions.create.mockResolvedValue({
                choices: [{ message: { content: JSON.stringify(mockThreats) } }]
            });

            const result = await riskAssessmentService.analyzeThreatLandscape('Finance', 'Large', ['iso27001']);
            expect(result.industry).toBe('Finance');
        });
    });

    describe('calculateComplianceReadiness', () => {
        it('calculates readiness score', async () => {
            const mockReadiness = {
                readinessScore: 78,
                criticalGaps: [],
                quickWins: [],
                majorInitiatives: [],
                timelineEstimate: '6 months'
            };

            mockAnthropicClient.messages.create.mockResolvedValue({
                content: [{ type: 'text', text: JSON.stringify(mockReadiness) }]
            });

            const result = await riskAssessmentService.calculateComplianceReadiness('iso27001', mockProfile, []);
            expect(result.readinessScore).toBe(78);
        });
    });

    describe('generateMitigationRoadmap', () => {
        it('generates roadmap phases', async () => {
            const mockRoadmap = {
                phases: [{ phase: 1, title: 'Phase 1', duration: '1m', actions: [], deliverables: [], resources: [] }],
                totalCost: '$10k',
                riskReduction: 20,
                complianceImprovement: 30
            };

            mockOpenAIClient.chat.completions.create.mockResolvedValue({
                choices: [{ message: { content: JSON.stringify(mockRoadmap) } }]
            });

            const result = await riskAssessmentService.generateMitigationRoadmap([], [], 'medium', 'short');
            expect(result.phases).toHaveLength(1);
            expect(result.totalCost).toBe('$10k');
        });
    });
});

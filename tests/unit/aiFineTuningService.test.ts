import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIFineTuningService } from '../../server/services/aiFineTuningService';
import { getOpenAIClient, getAnthropicClient } from '../../server/services/aiClients';
import { logger } from '../../server/utils/logger';

// Mocks
vi.mock('../../server/services/aiClients', () => ({
  getOpenAIClient: vi.fn(),
  getAnthropicClient: vi.fn(),
}));
vi.mock('../../server/utils/logger');

describe('AIFineTuningService', () => {
    let service: AIFineTuningService;
    const mockOpenAI = {
        chat: { completions: { create: vi.fn() } }
    };
    const mockAnthropic = {
        messages: { create: vi.fn() }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        service = new AIFineTuningService();
        (getOpenAIClient as any).mockReturnValue(mockOpenAI);
        (getAnthropicClient as any).mockReturnValue(mockAnthropic);
    });

    describe('Industry Configuration', () => {
        it('retrieves all configurations', () => {
            const configs = service.getIndustryConfigurations();
            expect(configs.length).toBeGreaterThan(0);
            expect(configs.find(c => c.id === 'healthcare')).toBeDefined();
        });

        it('retrieves specific configuration', () => {
            const config = service.getIndustryConfiguration('financial');
            expect(config).toBeDefined();
            expect(config?.id).toBe('financial');
        });

        it('returns null for invalid industry', () => {
            const config = service.getIndustryConfiguration('invalid');
            expect(config).toBeNull();
        });
    });

    describe('createCustomConfiguration', () => {
        it('creates configuration successfully', async () => {
            const request = {
                industryId: 'healthcare',
                organizationId: 'org-1',
                requirements: ['req1', 'req2'],
                customInstructions: 'test instruction',
                priority: 'high' as const
            };

            const result = await service.createCustomConfiguration(request);

            expect(result.configId).toContain('org-1-healthcare');
            expect(result.accuracy).toBeGreaterThan(0.8);
            expect(result.customPrompts.documentGeneration).toContain('test instruction');
            expect(result.customPrompts.documentGeneration).toContain('req1');
        });

        it('throws error for invalid industry', async () => {
             const request = {
                industryId: 'invalid',
                organizationId: 'org-1',
                requirements: [],
                priority: 'low' as const
            };

            await expect(service.createCustomConfiguration(request))
                .rejects.toThrow('Industry configuration not found');
        });
    });

    describe('generateOptimizedDocument', () => {
        it('generates using Anthropic (preferred)', async () => {
            mockAnthropic.messages.create.mockResolvedValue({
                content: [{ type: 'text', text: 'Anthropic content' }]
            });

            const context = { industry: 'healthcare' }; // Healthcare prefers Anthropic
            const content = await service.generateOptimizedDocument('config-1', 'Policy', context);

            expect(content).toBe('Anthropic content');
            expect(mockAnthropic.messages.create).toHaveBeenCalled();
        });

        it('generates using OpenAI (preferred)', async () => {
             mockOpenAI.chat.completions.create.mockResolvedValue({
                choices: [{ message: { content: 'OpenAI content' } }]
            });

            const context = { industry: 'financial' }; // Financial prefers OpenAI
            const content = await service.generateOptimizedDocument('config-1', 'Report', context);

            expect(content).toBe('OpenAI content');
            expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
        });

        it('handles unknown industry defaulting to technology (OpenAI)', async () => {
             mockOpenAI.chat.completions.create.mockResolvedValue({
                choices: [{ message: { content: 'Default content' } }]
            });

            // Pass empty context to trigger default 'technology' fallback
            const context = {}; 
            const content = await service.generateOptimizedDocument('config-1', 'Report', context);

            expect(content).toBe('Default content');
        });
    });

    describe('assessIndustryRisks', () => {
        it('generates risk assessment successfully', async () => {
             const mockRiskResponse = {
                 riskScore: 75,
                 identifiedRisks: [],
                 recommendations: []
             };
             
             mockAnthropic.messages.create.mockResolvedValue({
                content: [{ type: 'text', text: JSON.stringify(mockRiskResponse) }]
            });

            const result = await service.assessIndustryRisks('financial', { size: 'large' });
            
            expect(result.riskScore).toBe(75);
            expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    temperature: 0.2 // from financial settings
                })
            );
        });

        it('throws on invalid industry', async () => {
            await expect(service.assessIndustryRisks('invalid', {}))
                .rejects.toThrow('Industry configuration not found');
        });
    });
});

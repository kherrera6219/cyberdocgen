import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIFineTuningService } from '../../server/services/aiFineTuningService';

// Mock dependencies
const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn(),
    }
  }
};

const mockAnthropic = {
  messages: {
    create: vi.fn(),
  }
};

vi.mock('../../server/services/aiClients', () => ({
  getOpenAIClient: vi.fn(() => mockOpenAI),
  getAnthropicClient: vi.fn(() => mockAnthropic),
}));

vi.mock('../../server/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('AIFineTuningService', () => {
    let service: AIFineTuningService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new AIFineTuningService();
    });

    describe('createCustomConfiguration', () => {
        it('creates custom configuration based on industry template', async () => {
             const request: any = {
                 industryId: 'healthcare',
                 organizationId: 'org1',
                 requirements: ['HIPAA compliance', 'Patient privacy'],
                 priority: 'high'
             };

             const result = await service.createCustomConfiguration(request);

             expect(result).toBeDefined();
             expect(result.industryId).toBe('healthcare');
             expect(result.status).toBe('complete');
             // High priority should lower temperature -> 0.3 - 0.1 = 0.2 (min 0.1)
             // Base healthcare temp is 0.3.
             expect(result.modelSettings.temperature).toBeCloseTo(0.2); 
        });

        it('throws error for invalid industry', async () => {
             const request: any = {
                 industryId: 'invalid-industry',
                 organizationId: 'org1',
                 requirements: []
             };
             
             await expect(service.createCustomConfiguration(request)).rejects.toThrow('Industry configuration not found');
        });
    });

    describe('generateOptimizedDocument', () => {
        it('uses Anthropic for healthcare (preferred model)', async () => {
             const context = { industry: 'healthcare' };
             mockAnthropic.messages.create.mockResolvedValue({
                 content: [{ text: 'Generated Document' }]
             });

             const result = await service.generateOptimizedDocument('config1', 'Policy', context);

             expect(mockAnthropic.messages.create).toHaveBeenCalled();
             expect(result).toBe('Generated Document');
        });

        it('uses OpenAI for technology (preferred model)', async () => {
             const context = { industry: 'technology' };
             mockOpenAI.chat.completions.create.mockResolvedValue({
                 choices: [{ message: { content: 'Generated Document' } }]
             });

             const result = await service.generateOptimizedDocument('config1', 'Policy', context);

             expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
             expect(result).toBe('Generated Document');
        });
    });

    describe('assessIndustryRisks', () => {
        it('parses risk assessment response', async () => {
             const mockResponse = {
                 riskScore: 85,
                 identifiedRisks: [],
                 recommendations: []
             };
             
             mockAnthropic.messages.create.mockResolvedValue({
                 content: [{ text: JSON.stringify(mockResponse) }]
             });

             const result = await service.assessIndustryRisks('financial', {});

             expect(result).toEqual(mockResponse);
        });
    });
});

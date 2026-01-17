import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateDocument, generateComplianceDocuments } from '../../server/services/openai';
import { generateDocumentWithClaude, analyzeDocumentQuality, generateComplianceInsights } from '../../server/services/anthropic';
import { getOpenAIClient, getAnthropicClient } from '../../server/services/aiClients';
import { CompanyProfile } from '@shared/schema';

// Mock aiClients
vi.mock('../../server/services/aiClients', () => ({
  getOpenAIClient: vi.fn(),
  getAnthropicClient: vi.fn(),
}));

// Mock logger
vi.mock('../../server/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock documentTemplates/AllDocumentTemplates
vi.mock('../../server/services/documentTemplates', () => ({
  AllDocumentTemplates: {
    'iso27001': [
      { title: 'ISO Policy', category: 'Policy', priority: 1, description: 'Test policy' }
    ]
  }
}));

describe('AI Services', () => {
  const mockProfile: CompanyProfile = {
    id: 1,
    userId: 1,
    companyName: 'Test Corp',
    industry: 'Tech',
    companySize: '100',
    cloudInfrastructure: ['AWS'],
    dataClassification: 'Confidential',
    businessApplications: 'Jira',
    complianceFrameworks: ['iso27001'],
    onboardingCompleted: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockOpenAIClient = {
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  };

  const mockAnthropicClient = {
    messages: {
      create: vi.fn()
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getOpenAIClient as any).mockReturnValue(mockOpenAIClient);
    (getAnthropicClient as any).mockReturnValue(mockAnthropicClient);
  });

  describe('OpenAI Service', () => {
    describe('generateDocument', () => {
      it('generates content successfully', async () => {
        mockOpenAIClient.chat.completions.create.mockResolvedValue({
          choices: [{ message: { content: 'Generated Content' } }]
        });

        const content = await generateDocument(
          { title: 'Test', category: 'Policy', priority: 1, description: 'desc' },
          mockProfile,
          'iso27001'
        );

        expect(content).toBe('Generated Content');
      });

      it('handles errors', async () => {
        mockOpenAIClient.chat.completions.create.mockRejectedValue(new Error('API Error'));

        await expect(generateDocument(
          { title: 'Test', category: 'Policy', priority: 1, description: 'desc' },
          mockProfile,
          'iso27001'
        )).rejects.toThrow('Failed to generate document');
      });
    });

    describe('generateComplianceDocuments', () => {
       it('generates multiple documents', async () => {
           mockOpenAIClient.chat.completions.create.mockResolvedValue({
               choices: [{ message: { content: 'Doc Content' } }]
           });

           const docs = await generateComplianceDocuments(mockProfile, 'iso27001');
           expect(docs).toHaveLength(1);
           expect(docs[0]).toBe('Doc Content');
       });
    });
  });

  describe('Anthropic Service', () => {
      describe('generateDocumentWithClaude', () => {
          it('generates content successfully', async () => {
              mockAnthropicClient.messages.create.mockResolvedValue({
                  content: [{ type: 'text', text: 'Claude Content' }]
              });

              const content = await generateDocumentWithClaude(
                  { title: 'Test', category: 'Policy', priority: 1, description: 'desc' },
                  mockProfile,
                  'iso27001'
              );
              expect(content).toBe('Claude Content');
          });
      });

      describe('analyzeDocumentQuality', () => {
          it('analyzes quality successfully', async () => {
              const analysisResult = {
                  score: 85,
                  feedback: 'Good',
                  suggestions: ['Improve x']
              };

              mockAnthropicClient.messages.create.mockResolvedValue({
                  content: [{ type: 'text', text: JSON.stringify(analysisResult) }]
              });

              const result = await analyzeDocumentQuality('Doc content', 'iso27001');
              expect(result.score).toBe(85);
              expect(result.suggestions).toHaveLength(1);
          });

          it('handles parsing errors gracefully', async () => {
              mockAnthropicClient.messages.create.mockResolvedValue({
                  content: [{ type: 'text', text: 'Invalid JSON' }]
              });

              const result = await analyzeDocumentQuality('Doc content', 'iso27001');
              expect(result.score).toBe(75); // Check fallback
              expect(result.feedback).toContain('Quality analysis unavailable');
          });
      });

      describe('generateComplianceInsights', () => {
          it('generates insights successfully', async () => {
               const insightsResult = {
                  riskScore: 30,
                  keyRisks: ['Risk 1'],
                  recommendations: ['Rec 1'],
                  priorityActions: ['Act 1']
              };

              mockAnthropicClient.messages.create.mockResolvedValue({
                  content: [{ type: 'text', text: JSON.stringify(insightsResult) }]
              });

              const result = await generateComplianceInsights(mockProfile, 'iso27001');
              expect(result.riskScore).toBe(30);
              expect(result.keyRisks).toHaveLength(1);
          });
      });
  });
});

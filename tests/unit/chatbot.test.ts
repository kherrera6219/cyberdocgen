import { describe, it, expect, vi, beforeEach } from 'vitest';
import { complianceChatbot } from '../../server/services/chatbot';
import { aiGuardrailsService } from '../../server/services/aiGuardrailsService';
import { documentAnalysisService } from '../../server/services/documentAnalysis';
import { storage } from '../../server/storage';
import { getOpenAIClient, getAnthropicClient } from '../../server/services/aiClients';
import crypto from 'crypto';

// Mocks
vi.mock('../../server/services/aiGuardrailsService');
vi.mock('../../server/services/documentAnalysis');
vi.mock('../../server/storage');
vi.mock('../../server/services/aiClients', () => ({
  getOpenAIClient: vi.fn(),
  getAnthropicClient: vi.fn(),
}));
vi.mock('../../server/utils/logger');
vi.mock('crypto', () => ({
  default: {
    randomUUID: () => 'test-uuid'
  }
}));

describe('ComplianceChatbot', () => {
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
        
        // Default mocks
        (aiGuardrailsService.checkGuardrails as any).mockResolvedValue({ allowed: true });
        (documentAnalysisService.searchSimilarContent as any).mockResolvedValue([]);
        (storage.getDocuments as any).mockResolvedValue([]);
    });

    describe('processMessage', () => {
        it('blocks disallowed input', async () => {
            (aiGuardrailsService.checkGuardrails as any).mockResolvedValueOnce({ allowed: false, action: 'blocked' });
            
            const response = await complianceChatbot.processMessage('bad input', 'user-1');
            
            expect(response.content).toContain('unable to process');
            expect(response.confidence).toBe(0);
        });

        it('sanitizes input before processing', async () => {
             (aiGuardrailsService.checkGuardrails as any).mockResolvedValueOnce({ allowed: true, sanitizedPrompt: 'clean input' });
             mockAnthropicClient.messages.create.mockResolvedValue({
                 content: [{ type: 'text', text: JSON.stringify({ content: 'response' }) }]
             });

             await complianceChatbot.processMessage('dirty input', 'user-1');
             
             // Check Anthropic called with sanitized input
             expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
                 expect.objectContaining({
                     messages: expect.arrayContaining([{ 
                         role: 'user', 
                         content: expect.stringContaining('clean input') 
                     }])
                 })
             );
        });

        it('returns parsed structured response', async () => {
            const mockResponse = {
                content: 'Test response',
                confidence: 90,
                sources: ['doc1.pdf'],
                suggestions: ['read doc'],
                followUpQuestions: ['why?']
            };
            
            mockAnthropicClient.messages.create.mockResolvedValue({
                 content: [{ type: 'text', text: JSON.stringify(mockResponse) }]
             });

            const result = await complianceChatbot.processMessage('question', 'user-1');
            
            expect(result.content).toBe('Test response');
            expect(result.confidence).toBe(90);
        });

         it('falls back to text analysis if JSON parsing fails', async () => {
            mockAnthropicClient.messages.create.mockResolvedValue({
                 content: [{ type: 'text', text: 'Just plain text response' }]
             });

            const result = await complianceChatbot.processMessage('question', 'user-1');
            
            expect(result.content).toBe('Just plain text response');
            expect(result.confidence).toBe(80); // Default for fallback parsing
        });

        it('falls back to OpenAI if Anthropic fails', async () => {
            mockAnthropicClient.messages.create.mockRejectedValue(new Error('Anthropic Down'));
            
            mockOpenAIClient.chat.completions.create.mockResolvedValue({
                choices: [{ message: { content: 'OpenAI Fallback' } }]
            });

            const result = await complianceChatbot.processMessage('question', 'user-1');
            
            expect(result.content).toBe('OpenAI Fallback');
            expect(result.confidence).toBe(70); // Default for fallback
        });
        
         it('handles output guardrails blocking', async () => {
            // Input ok
            (aiGuardrailsService.checkGuardrails as any).mockResolvedValueOnce({ allowed: true });
            
            // Output blocked
             mockAnthropicClient.messages.create.mockResolvedValue({
                 content: [{ type: 'text', text: JSON.stringify({ content: 'bad response' }) }]
             });
            (aiGuardrailsService.checkGuardrails as any).mockResolvedValueOnce({ allowed: false, action: 'blocked' });

            const result = await complianceChatbot.processMessage('question', 'user-1');
            
            expect(result.content).toContain('apologize');
            expect(result.confidence).toBe(0);
        });
    });

    describe('generateConversationTitle', () => {
        it('generates title using OpenAI', async () => {
            mockOpenAIClient.chat.completions.create.mockResolvedValue({
                choices: [{ message: { content: 'Test Title' } }]
            });

            const title = await complianceChatbot.generateConversationTitle('message');
            expect(title).toBe('Test Title');
        });

        it('returns default title on failure', async () => {
            mockOpenAIClient.chat.completions.create.mockRejectedValue(new Error('Fail'));

            const title = await complianceChatbot.generateConversationTitle('message');
            expect(title).toBe('Compliance Discussion');
        });
    });

    describe('getSuggestedQuestions', () => {
        it('returns framework specific questions', () => {
            const questions = complianceChatbot.getSuggestedQuestions('iso27001');
            expect(questions[0]).toContain('ISO 27001');
        });

        it('returns default questions for unknown framework', () => {
            const questions = complianceChatbot.getSuggestedQuestions();
            expect(questions[0]).toContain('requirements');
        });
    });
});

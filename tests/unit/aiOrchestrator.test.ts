import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiOrchestrator } from '../../server/services/aiOrchestrator';
import { aiGuardrailsService } from '../../server/services/aiGuardrailsService';
import { circuitBreakers } from '../../server/utils/circuitBreaker';

// Mocks
vi.mock('../../server/services/aiGuardrailsService');
vi.mock('../../server/utils/logger');
vi.mock('../../server/services/openai', () => ({
    generateDocument: vi.fn(),
    frameworkTemplates: {}
}));
vi.mock('../../server/services/anthropic', () => ({
    generateDocumentWithClaude: vi.fn(),
    analyzeDocumentQuality: vi.fn()
}));
vi.mock('../../server/utils/circuitBreaker', () => ({
    circuitBreakers: {
        openai: { execute: vi.fn() },
        anthropic: { execute: vi.fn() }
    }
}));

describe('AIOrchestrator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default safe guardrails
        (aiGuardrailsService.checkGuardrails as any).mockResolvedValue({ 
            allowed: true, 
            action: 'allowed' 
        });
    });

    describe('generateDocument', () => {
        const mockTemplate = { 
            id: 't1', title: 'Test', category: 'Policy', framework: 'ISO',
            documentType: 'policy', required: true, templateContent: 'content', templateVariables: {},
            description: 'Test Description', priority: 1,
        };
        const mockProfile = { 
            companyName: 'Acme', industry: 'Tech', id: 1 
        } as any;

        it('generates document using optimal model (Claude for Policy)', async () => {
             (circuitBreakers.anthropic.execute as any).mockResolvedValue('Claude Content');
             
             const result = await aiOrchestrator.generateDocument(mockTemplate, mockProfile, 'ISO');
             
             expect(result.content).toBe('Claude Content');
             expect(result.model).toBe('claude-sonnet-4');
             expect(circuitBreakers.anthropic.execute).toHaveBeenCalled();
        });

        it('fails gracefully if guardrails block input', async () => {
             (aiGuardrailsService.checkGuardrails as any).mockResolvedValueOnce({ 
                 allowed: false, 
                 action: 'blocked' 
             });

             const result = await aiOrchestrator.generateDocument(mockTemplate, mockProfile, 'ISO');
             
             expect(result.model).toBe('blocked');
             expect(result.content).toContain('blocked');
             expect(circuitBreakers.anthropic.execute).not.toHaveBeenCalled();
        });

        it('falls back to OpenAI if Claude fails', async () => {
             // Mock Claude failure
             (circuitBreakers.anthropic.execute as any).mockRejectedValue(new Error('Claude Down'));
             // Mock OpenAI success
             (circuitBreakers.openai.execute as any).mockResolvedValue('OpenAI Content');

             const result = await aiOrchestrator.generateDocument(mockTemplate, mockProfile, 'ISO');
             
             expect(result.content).toBe('OpenAI Content');
             expect(result.model).toBe('gpt-5.1'); // It switches model on fallback
        });

        it('sanitizes output if guardrails require it', async () => {
             (circuitBreakers.anthropic.execute as any).mockResolvedValue('Sensitive Content');
             
             // Input check passes
             (aiGuardrailsService.checkGuardrails as any).mockResolvedValueOnce({ allowed: true });
             // Output check returns sanitized version
             (aiGuardrailsService.checkGuardrails as any).mockResolvedValueOnce({ 
                 allowed: true, 
                 sanitizedResponse: 'Clean Content' 
             });

             const result = await aiOrchestrator.generateDocument(mockTemplate, mockProfile, 'ISO');
             
             expect(result.content).toBe('Clean Content');
        });
    });

    describe('generateContent', () => {
        it('generates content successfully', async () => {
            (circuitBreakers.openai.execute as any).mockResolvedValue('Generated content');
            
            const result = await aiOrchestrator.generateContent({ prompt: 'test' });
            
            expect(result.result.content).toBe('Generated content');
            expect(result.blocked).toBe(false);
        });

        it('reports blocked content', async () => {
            (aiGuardrailsService.checkGuardrails as any).mockResolvedValueOnce({ 
                 allowed: false, 
                 action: 'blocked',
                 severity: 'high'
             });

            const result = await aiOrchestrator.generateContent({ prompt: 'bad things' });
            
            expect(result.blocked).toBe(true);
            expect(result.result.content).toBe('');
        });
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiOrchestrator } from '../../server/services/aiOrchestrator';
import { aiGuardrailsService } from '../../server/services/aiGuardrailsService';
import { circuitBreakers } from '../../server/utils/circuitBreaker';

// Mocks
vi.mock('../../server/services/aiGuardrailsService');
vi.mock('../../server/utils/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    }
}));
vi.mock('../../server/services/openai', () => ({
    openai: {
        generateContent: vi.fn(),
    },
    getOpenAIClient: vi.fn(() => ({
        chat: { completions: { create: vi.fn().mockResolvedValue({ choices: [{ message: { content: 'test' } }] }) } }
    })),
    frameworkTemplates: {
        SOC2: [{ id: 's1', title: 'SOC2 Policy', category: 'Policy', framework: 'SOC2', documentType: 'policy', required: true, templateContent: '', templateVariables: {}, description: '', priority: 1 }],
        ISO27001: [{ id: 'i1', title: 'ISO Policy', category: 'Policy', framework: 'ISO27001', documentType: 'policy', required: true, templateContent: '', templateVariables: {}, description: '', priority: 1 }]
    }
}));
vi.mock('../../server/services/anthropic', () => ({
    anthropic: {
        generateDocumentWithClaude: vi.fn(),
    },
    analyzeDocumentQuality: vi.fn(),
    getAnthropicClient: vi.fn(() => ({
        messages: { create: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'test' }] }) }
    }))
}));
vi.mock('../../server/utils/circuitBreaker', () => ({
    circuitBreakers: {
        openai: { execute: vi.fn() },
        anthropic: { execute: vi.fn() },
        gemini: { execute: vi.fn() }
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
            companyName: 'Acme', industry: 'Tech', id: '1' 
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
             (circuitBreakers.anthropic.execute as any).mockRejectedValue(new Error('Claude Down'));
             (circuitBreakers.openai.execute as any).mockResolvedValue('OpenAI Content');

             const result = await aiOrchestrator.generateDocument(mockTemplate, mockProfile, 'ISO');
             
             expect(result.content).toBe('OpenAI Content');
             expect(result.model).toBe('gpt-5.1');
        });
    });

    describe('generateContent', () => {
        it('generates content successfully', async () => {
            (circuitBreakers.openai.execute as any).mockResolvedValue('Generated content');
            
            const result = await aiOrchestrator.generateContent({ prompt: 'test' });
            
            expect(result.result.content).toBe('Generated content');
            expect(result.blocked).toBe(false);
        });

        it('generates content successfully with Anthropic fallback', async () => {
            vi.mocked(circuitBreakers.openai.execute).mockRejectedValueOnce(new Error('OpenAI Down'));
            vi.mocked(circuitBreakers.anthropic.execute).mockResolvedValueOnce('Anthropic Fallback');

            const result = await aiOrchestrator.generateContent({ prompt: 'test' });
            
            expect(result.result.content).toBe('Anthropic Fallback');
            expect(result.result.model).toBe('claude-sonnet-4');
        });
    });

    describe('generateComplianceDocuments', () => {
        it('generates multiple documents for a framework', async () => {
            (circuitBreakers.anthropic.execute as any).mockResolvedValue('Compliance Content');
            const mockProfile = { id: 'p1', companyName: 'Acme' } as any;

            const results = await aiOrchestrator.generateComplianceDocuments(mockProfile, 'SOC2');
            
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].content).toBe('Compliance Content');
        });
    });

    describe('healthCheck', () => {
        it('returns healthy status when models are responsive', async () => {
            const health = await aiOrchestrator.healthCheck();
            expect(health.status).toBe('healthy');
        });

        it('performs real health checks if NODE_ENV is not test', async () => {
            vi.stubEnv('NODE_ENV', 'production');
            vi.stubEnv('OPENAI_API_KEY', 'test-key');
            
            const health = await aiOrchestrator.healthCheck();
            expect(health.status).toBeDefined();
            
            vi.unstubAllEnvs();
        });
    });

    describe('selectOptimalModel', () => {
        it('selects Claude for Policies', () => {
            const mockTemplate = { category: 'Policy' } as any;
            const model = (aiOrchestrator as any).selectOptimalModel(mockTemplate, 'SOC 2');
            expect(model).toBe('claude-sonnet-4');
        });

        it('selects OpenAI for technical documents', () => {
            const mockTemplate = { category: 'Technical Procedure' } as any;
            const model = (aiOrchestrator as any).selectOptimalModel(mockTemplate, 'NIST');
            expect(model).toBe('gpt-5.1');
        });
    });

    describe('analyzeQuality', () => {
        it('analyzes document quality', async () => {
            const mockSuggestion = 'Add more details';
            const { analyzeDocumentQuality } = await import('../../server/services/anthropic');
            vi.mocked(analyzeDocumentQuality).mockResolvedValue({
                score: 85,
                feedback: 'Good',
                suggestions: [mockSuggestion]
            });

            const result = await aiOrchestrator.analyzeQuality('content', 'SOC2');
            expect(result.score).toBe(85);
            expect(result.suggestions).toContain(mockSuggestion);
        });
    });

    describe('getAvailableModels', () => {
        it('returns the list of supported models', () => {
            const models = aiOrchestrator.getAvailableModels();
            expect(models).toContain('gpt-5.1');
            expect(models).toContain('claude-sonnet-4');
            expect(models).toContain('auto');
        });
    });
});

import { describe, it, expect } from 'vitest';
import { AI_MODELS, getOptimalModel, getAllModels, MODEL_SELECTION_STRATEGY } from '../../server/services/aiModels';

describe('AI Models Configuration', () => {
    it('should have defined model configurations', () => {
        const models = getAllModels();
        expect(models).toBeDefined();
        expect(models.OPENAI).toBeDefined();
        expect(models.ANTHROPIC).toBeDefined();
        expect(models.GOOGLE).toBeDefined();
    });

    it('should have correct OPENAI configuration', () => {
        const openai = AI_MODELS.OPENAI;
        expect(openai.primary).toContain('gpt');
        expect(openai.maxTokens).toBeGreaterThan(0);
        expect(openai.capabilities).toBeInstanceOf(Array);
        expect(openai.capabilities.length).toBeGreaterThan(0);
    });

    it('should have correct ANTHROPIC configuration', () => {
        const anthropic = AI_MODELS.ANTHROPIC;
        expect(anthropic.primary).toContain('claude');
        expect(anthropic.maxTokens).toBeGreaterThan(0);
        expect(anthropic.capabilities).toContain('advanced coding');
    });

    it('should have correct GOOGLE configuration', () => {
        const google = AI_MODELS.GOOGLE;
        expect(google.primary).toContain('gemini');
        expect(google.maxTokens).toBeGreaterThan(0);
        expect(google.capabilities).toContain('multimodal input/output');
    });
});

describe('Model Selection Strategy', () => {
    it('should return correct strategy for COMPLIANCE_GENERATION', () => {
        const strategy = getOptimalModel('COMPLIANCE_GENERATION');
        expect(strategy).toEqual(MODEL_SELECTION_STRATEGY.COMPLIANCE_GENERATION);
        expect(strategy.primary).toBe(AI_MODELS.OPENAI.primary);
    });

    it('should return correct strategy for RISK_ANALYSIS', () => {
        const strategy = getOptimalModel('RISK_ANALYSIS');
        expect(strategy).toEqual(MODEL_SELECTION_STRATEGY.RISK_ANALYSIS);
        expect(strategy.primary).toBe(AI_MODELS.ANTHROPIC.primary);
    });

    it('should return correct strategy for LARGE_CONTEXT', () => {
        const strategy = getOptimalModel('LARGE_CONTEXT');
        expect(strategy).toEqual(MODEL_SELECTION_STRATEGY.LARGE_CONTEXT);
        expect(strategy.primary).toBe(AI_MODELS.GOOGLE.primary);
    });
});

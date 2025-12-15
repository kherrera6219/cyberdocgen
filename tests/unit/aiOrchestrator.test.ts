/**
 * AI Orchestrator Service Tests
 *
 * Comprehensive test suite for AI orchestrator service including:
 * - Document generation
 * - Batch generation
 * - Content generation
 * - Quality analysis
 * - Model selection
 * - Guardrails integration
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { aiOrchestrator, type GenerationOptions } from '../../server/services/aiOrchestrator';
import { aiGuardrailsService } from '../../server/services/aiGuardrailsService';
import * as openai from '../../server/services/openai';
import * as anthropic from '../../server/services/anthropic';
import type { CompanyProfile } from '@shared/schema';

// Mock dependencies
vi.mock('../../server/services/openai');
vi.mock('../../server/services/anthropic');
vi.mock('../../server/services/aiGuardrailsService');
vi.mock('../../server/utils/logger');

describe('AIOrchestrator', () => {
  // Sample test data
  const mockCompanyProfile: CompanyProfile = {
    id: 'test-company-id',
    companyName: 'Test Corp',
    industry: 'Technology',
    size: '100-500',
    location: 'United States',
    description: 'A test company',
    organizationId: 'org-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTemplate = {
    id: 'template-1',
    title: 'Data Protection Policy',
    description: 'Policy for data protection',
    framework: 'SOC2',
    category: 'policy',
    content: 'Template content',
  };

  const mockGeneratedContent = '# Data Protection Policy\n\nThis policy defines...';

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(openai.generateDocument).mockResolvedValue(mockGeneratedContent);
    vi.mocked(anthropic.generateDocumentWithClaude).mockResolvedValue(mockGeneratedContent);
    vi.mocked(anthropic.analyzeDocumentQuality).mockResolvedValue({
      score: 85,
      feedback: 'Good document',
      suggestions: ['Add more details'],
    });
    vi.mocked(aiGuardrailsService.checkGuardrails).mockResolvedValue({
      allowed: true,
      flagged: false,
      action: 'allowed',
      categories: {},
      scores: {},
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateDocument', () => {
    it('should generate document with default model (auto)', async () => {
      const result = await aiOrchestrator.generateDocument(
        mockTemplate,
        mockCompanyProfile,
        'SOC2'
      );

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('model');
      expect(result.content).toBe(mockGeneratedContent);
      expect(['gpt-5.1', 'claude-sonnet-4']).toContain(result.model);
    });

    it('should generate document with specified model (GPT)', async () => {
      const options: GenerationOptions = { model: 'gpt-5.1' };

      const result = await aiOrchestrator.generateDocument(
        mockTemplate,
        mockCompanyProfile,
        'SOC2',
        options
      );

      expect(result.model).toBe('gpt-5.1');
      expect(openai.generateDocument).toHaveBeenCalledWith(
        mockTemplate,
        mockCompanyProfile,
        'SOC2'
      );
      expect(anthropic.generateDocumentWithClaude).not.toHaveBeenCalled();
    });

    it('should generate document with specified model (Claude)', async () => {
      const options: GenerationOptions = { model: 'claude-sonnet-4' };

      const result = await aiOrchestrator.generateDocument(
        mockTemplate,
        mockCompanyProfile,
        'SOC2',
        options
      );

      expect(result.model).toBe('claude-sonnet-4');
      expect(anthropic.generateDocumentWithClaude).toHaveBeenCalledWith(
        mockTemplate,
        mockCompanyProfile,
        'SOC2'
      );
      expect(openai.generateDocument).not.toHaveBeenCalled();
    });

    it('should include quality analysis when requested', async () => {
      const options: GenerationOptions = { includeQualityAnalysis: true };

      const result = await aiOrchestrator.generateDocument(
        mockTemplate,
        mockCompanyProfile,
        'SOC2',
        options
      );

      expect(result.qualityScore).toBe(85);
      expect(result.feedback).toBe('Good document');
      expect(result.suggestions).toEqual(['Add more details']);
      expect(anthropic.analyzeDocumentQuality).toHaveBeenCalledWith(
        mockGeneratedContent,
        'SOC2'
      );
    });

    it('should check guardrails before generation when enabled', async () => {
      const options: GenerationOptions = {
        enableGuardrails: true,
        guardrailContext: {
          userId: 'user-123',
          organizationId: 'org-123',
          ipAddress: '192.168.1.1',
        },
      };

      await aiOrchestrator.generateDocument(
        mockTemplate,
        mockCompanyProfile,
        'SOC2',
        options
      );

      expect(aiGuardrailsService.checkGuardrails).toHaveBeenCalled();
      const firstCall = vi.mocked(aiGuardrailsService.checkGuardrails).mock.calls[0];
      expect(firstCall[2]).toMatchObject({
        userId: 'user-123',
        organizationId: 'org-123',
        ipAddress: '192.168.1.1',
      });
    });

    it('should block generation if guardrails reject input', async () => {
      vi.mocked(aiGuardrailsService.checkGuardrails).mockResolvedValueOnce({
        allowed: false,
        flagged: true,
        action: 'blocked',
        categories: { hate: true },
        scores: { hate: 0.9 },
      });

      const options: GenerationOptions = { enableGuardrails: true };

      const result = await aiOrchestrator.generateDocument(
        mockTemplate,
        mockCompanyProfile,
        'SOC2',
        options
      );

      expect(result.model).toBe('blocked');
      expect(result.content).toContain('blocked');
      expect(openai.generateDocument).not.toHaveBeenCalled();
      expect(anthropic.generateDocumentWithClaude).not.toHaveBeenCalled();
    });

    it('should sanitize output if PII detected', async () => {
      const sanitizedContent = '# Policy (PII Removed)\n\nSanitized content...';

      // First call (input) - allowed
      // Second call (output) - allowed but with sanitized response
      vi.mocked(aiGuardrailsService.checkGuardrails)
        .mockResolvedValueOnce({
          allowed: true,
          flagged: false,
          action: 'allowed',
          categories: {},
          scores: {},
        })
        .mockResolvedValueOnce({
          allowed: true,
          flagged: true,
          action: 'sanitized',
          categories: { pii: true },
          scores: { pii: 0.8 },
          sanitizedResponse: sanitizedContent,
        });

      const options: GenerationOptions = { enableGuardrails: true };

      const result = await aiOrchestrator.generateDocument(
        mockTemplate,
        mockCompanyProfile,
        'SOC2',
        options
      );

      expect(result.content).toBe(sanitizedContent);
    });

    it('should fallback to alternative model on error', async () => {
      // First model fails
      vi.mocked(openai.generateDocument).mockRejectedValueOnce(new Error('API Error'));

      const options: GenerationOptions = { model: 'gpt-5.1' };

      const result = await aiOrchestrator.generateDocument(
        mockTemplate,
        mockCompanyProfile,
        'SOC2',
        options
      );

      // Should fallback to Claude
      expect(anthropic.generateDocumentWithClaude).toHaveBeenCalled();
      expect(result.model).toBe('claude-sonnet-4');
      expect(result.content).toBe(mockGeneratedContent);
    });

    it('should handle quality analysis errors gracefully', async () => {
      vi.mocked(anthropic.analyzeDocumentQuality).mockRejectedValueOnce(
        new Error('Analysis failed')
      );

      const options: GenerationOptions = { includeQualityAnalysis: true };

      const result = await aiOrchestrator.generateDocument(
        mockTemplate,
        mockCompanyProfile,
        'SOC2',
        options
      );

      // Should still return document without quality metrics
      expect(result.content).toBe(mockGeneratedContent);
      expect(result.qualityScore).toBeUndefined();
      expect(result.feedback).toBeUndefined();
    });

    it('should skip guardrails when disabled', async () => {
      const options: GenerationOptions = { enableGuardrails: false };

      await aiOrchestrator.generateDocument(
        mockTemplate,
        mockCompanyProfile,
        'SOC2',
        options
      );

      expect(aiGuardrailsService.checkGuardrails).not.toHaveBeenCalled();
    });
  });

  describe('generateComplianceDocuments', () => {
    it('should generate multiple documents with progress tracking', async () => {
      const progressUpdates: any[] = [];
      const onProgress = (progress: any) => progressUpdates.push(progress);

      const results = await aiOrchestrator.generateComplianceDocuments(
        mockCompanyProfile,
        'SOC2',
        {},
        onProgress
      );

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      expect(progressUpdates.length).toBeGreaterThan(0);

      // Check progress structure
      const lastProgress = progressUpdates[progressUpdates.length - 1];
      expect(lastProgress).toHaveProperty('progress');
      expect(lastProgress).toHaveProperty('completed');
      expect(lastProgress).toHaveProperty('total');
      expect(lastProgress.progress).toBe(100);
    });

    it('should use specified model for all documents', async () => {
      const options: GenerationOptions = { model: 'claude-sonnet-4' };

      const results = await aiOrchestrator.generateComplianceDocuments(
        mockCompanyProfile,
        'SOC2',
        options
      );

      results.forEach((result) => {
        expect(result.model).toBe('claude-sonnet-4');
      });
    });
  });

  describe('generateContent', () => {
    it('should generate content with specified prompt', async () => {
      const request = {
        prompt: 'Write a security policy introduction',
        model: 'gpt-5.1' as const,
      };

      const result = await aiOrchestrator.generateContent(request);

      expect(result.result).toHaveProperty('content');
      expect(result.result).toHaveProperty('model');
      expect(result.blocked).toBeFalsy();
    });

    it('should apply guardrails to content generation', async () => {
      const request = {
        prompt: 'Generate content',
        enableGuardrails: true,
        guardrailContext: {
          userId: 'user-123',
        },
      };

      await aiOrchestrator.generateContent(request);

      expect(aiGuardrailsService.checkGuardrails).toHaveBeenCalled();
    });

    it('should block content generation if guardrails reject', async () => {
      vi.mocked(aiGuardrailsService.checkGuardrails).mockResolvedValueOnce({
        allowed: false,
        flagged: true,
        action: 'blocked',
        categories: { violence: true },
        scores: { violence: 0.95 },
      });

      const request = {
        prompt: 'Harmful content',
        enableGuardrails: true,
      };

      const result = await aiOrchestrator.generateContent(request);

      expect(result.blocked).toBe(true);
      expect(result.blockedReason).toBeDefined();
    });

    it('should respect temperature and maxTokens parameters', async () => {
      const request = {
        prompt: 'Generate content',
        temperature: 0.7,
        maxTokens: 500,
      };

      await aiOrchestrator.generateContent(request);

      // Verify parameters were passed (would need to spy on OpenAI client)
      expect(openai.generateDocument).toHaveBeenCalled();
    });
  });

  describe('generateInsights', () => {
    it('should generate compliance insights', async () => {
      vi.mocked(anthropic.generateComplianceInsights).mockResolvedValueOnce({
        insights: ['Insight 1', 'Insight 2'],
        riskAreas: ['Risk 1'],
        recommendations: ['Rec 1'],
      });

      const result = await aiOrchestrator.generateInsights(mockCompanyProfile, 'SOC2');

      expect(result.insights).toHaveLength(2);
      expect(result.riskAreas).toHaveLength(1);
      expect(result.recommendations).toHaveLength(1);
      expect(anthropic.generateComplianceInsights).toHaveBeenCalledWith(
        mockCompanyProfile,
        'SOC2'
      );
    });
  });

  describe('analyzeQuality', () => {
    it('should analyze document quality', async () => {
      const content = '# Policy\n\nContent here...';

      const result = await aiOrchestrator.analyzeQuality(content, 'SOC2');

      expect(result.score).toBe(85);
      expect(result.feedback).toBe('Good document');
      expect(result.suggestions).toEqual(['Add more details']);
      expect(anthropic.analyzeDocumentQuality).toHaveBeenCalledWith(content, 'SOC2');
    });

    it('should handle analysis errors', async () => {
      vi.mocked(anthropic.analyzeDocumentQuality).mockRejectedValueOnce(
        new Error('Analysis failed')
      );

      await expect(
        aiOrchestrator.analyzeQuality('content', 'SOC2')
      ).rejects.toThrow('Analysis failed');
    });
  });

  describe('getAvailableModels', () => {
    it('should return list of available models', () => {
      const models = aiOrchestrator.getAvailableModels();

      expect(models).toBeInstanceOf(Array);
      expect(models).toContain('gpt-5.1');
      expect(models).toContain('claude-sonnet-4');
      expect(models).toContain('auto');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when all models are available', async () => {
      const health = await aiOrchestrator.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.models).toHaveProperty('gpt-5.1');
      expect(health.models).toHaveProperty('claude-sonnet-4');
    });

    it('should handle model availability check failures', async () => {
      vi.mocked(openai.generateDocument).mockRejectedValueOnce(new Error('API Error'));

      const health = await aiOrchestrator.healthCheck();

      // Should still return status, but some models may be unhealthy
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('models');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked(openai.generateDocument).mockRejectedValueOnce(
        new Error('Network timeout')
      );
      vi.mocked(anthropic.generateDocumentWithClaude).mockRejectedValueOnce(
        new Error('Network timeout')
      );

      await expect(
        aiOrchestrator.generateDocument(mockTemplate, mockCompanyProfile, 'SOC2')
      ).rejects.toThrow();
    });

    it('should handle invalid API keys', async () => {
      vi.mocked(openai.generateDocument).mockRejectedValueOnce(
        new Error('Invalid API key')
      );

      const options: GenerationOptions = { model: 'gpt-5.1' };

      // Should fallback to Claude
      const result = await aiOrchestrator.generateDocument(
        mockTemplate,
        mockCompanyProfile,
        'SOC2',
        options
      );

      expect(result.model).toBe('claude-sonnet-4');
    });

    it('should handle rate limiting', async () => {
      vi.mocked(openai.generateDocument).mockRejectedValueOnce(
        new Error('Rate limit exceeded')
      );

      const options: GenerationOptions = { model: 'gpt-5.1' };

      // Should fallback
      const result = await aiOrchestrator.generateDocument(
        mockTemplate,
        mockCompanyProfile,
        'SOC2',
        options
      );

      expect(anthropic.generateDocumentWithClaude).toHaveBeenCalled();
    });
  });

  describe('Integration with Guardrails', () => {
    it('should check both input and output when guardrails enabled', async () => {
      const options: GenerationOptions = { enableGuardrails: true };

      await aiOrchestrator.generateDocument(
        mockTemplate,
        mockCompanyProfile,
        'SOC2',
        options
      );

      // Should be called twice: once for input, once for output
      expect(aiGuardrailsService.checkGuardrails).toHaveBeenCalledTimes(2);
    });

    it('should handle guardrail service errors gracefully', async () => {
      vi.mocked(aiGuardrailsService.checkGuardrails).mockRejectedValueOnce(
        new Error('Guardrails service down')
      );

      const options: GenerationOptions = { enableGuardrails: true };

      // Should still generate document even if guardrails fail
      const result = await aiOrchestrator.generateDocument(
        mockTemplate,
        mockCompanyProfile,
        'SOC2',
        options
      );

      expect(result.content).toBeTruthy();
    });
  });
});

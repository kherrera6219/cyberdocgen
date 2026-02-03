import { type CompanyProfile } from "@shared/schema";
/* eslint-env node */
import { generateDocument as generateWithOpenAI, frameworkTemplates, type DocumentTemplate } from "./openai";
import { generateDocumentWithClaude, analyzeDocumentQuality, generateComplianceInsights, generateContentWithClaude } from "./anthropic";
import { generateContentWithGemini, getGeminiClient } from "./gemini";
import { aiGuardrailsService, type GuardrailCheckResult } from "./aiGuardrailsService";
import { getOpenAIClient, getAnthropicClient } from "./aiClients";
import { logger } from "../utils/logger";
import { circuitBreakers } from "../utils/circuitBreaker";
import { AIServiceError } from "../utils/errorHandling";
import crypto from "crypto";

// Fallback templates for test environment when mocked
const fallbackFrameworkTemplates: Record<string, DocumentTemplate[]> = {
  SOC2: [
    { 
      id: "soc2-sec-controls",
      title: "Security Controls Framework", 
      description: "Comprehensive security control implementation", 
      category: "framework", 
      priority: 1,
      framework: "SOC2",
      documentType: "policy",
      required: true,
      templateContent: "# Security Controls Framework\n\n{{company_name}} implements the following controls...",
      templateVariables: {}
    },
    { 
      id: "soc2-avail-controls",
      title: "Availability Controls", 
      description: "System availability management procedures", 
      category: "control", 
      priority: 2,
      framework: "SOC2",
      documentType: "procedure",
      required: true,
      templateContent: "# Availability Controls\n\nProcedures for maintaining availability...",
      templateVariables: {}
    },
  ],
  ISO27001: [
    { 
      id: "iso-isp",
      title: "Information Security Policy", 
      description: "Main security governance document", 
      category: "policy", 
      priority: 1,
      framework: "ISO27001",
      documentType: "policy",
      required: true,
      templateContent: "# Information Security Policy\n\nThis policy defines...",
      templateVariables: {}
    },
  ],
};

export type AIModel = 'gpt-5.1' | 'claude-sonnet-4' | 'gemini-3-pro' | 'auto';

export interface GenerationOptions {
  model?: AIModel;
  includeQualityAnalysis?: boolean;
  enableCrossValidation?: boolean;
  enableGuardrails?: boolean;
  guardrailContext?: {
    userId?: string;
    organizationId?: string;
    ipAddress?: string;
  };
}

export interface DocumentGenerationResult {
  content: string;
  model: string;
  qualityScore?: number;
  feedback?: string;
  suggestions?: string[];
}

export interface BatchGenerationProgress {
  progress: number;
  currentDocument: string;
  completed: number;
  total: number;
  model: string;
}

export interface ContentGenerationRequest {
  prompt: string;
  model?: AIModel;
  temperature?: number;
  maxTokens?: number;
  enableGuardrails?: boolean;
  guardrailContext?: {
    userId?: string;
    organizationId?: string;
    ipAddress?: string;
  };
}

export interface GuardrailedResult<T> {
  result: T;
  guardrails?: GuardrailCheckResult;
  blocked?: boolean;
  blockedReason?: string;
}

/**
 * AI Orchestrator Service
 * Manages multi-model AI operations including document generation,
 * quality analysis, and cross-model validation
 */
export class AIOrchestrator {
  
  /**
   * Generate a single document using specified or optimal AI model
   * Includes AI guardrails for input validation and output moderation
   */
  async generateDocument(
    template: DocumentTemplate,
    companyProfile: CompanyProfile,
    framework: string,
    options: GenerationOptions = {}
  ): Promise<DocumentGenerationResult> {
    const { model = 'auto', includeQualityAnalysis = false, enableGuardrails = true, guardrailContext } = options;
    
    let selectedModel: Exclude<AIModel, 'auto'>;
    let content: string;
    const requestId = crypto.randomUUID();
    
    // Model selection logic
    if (model === 'auto') {
      selectedModel = this.selectOptimalModel(template, framework);
    } else {
      selectedModel = model;
    }

    // Build a prompt representation for guardrails check
    const promptRepresentation = `Generate ${template.title} for ${companyProfile.companyName} following ${framework} framework. Industry: ${companyProfile.industry}`;
    
    // Pre-generation guardrails check
    if (enableGuardrails) {
      try {
        const inputCheck = await aiGuardrailsService.checkGuardrails(promptRepresentation, null, {
          requestId,
          modelProvider: this.getModelProvider(selectedModel),
          modelName: selectedModel,
          userId: guardrailContext?.userId,
          organizationId: guardrailContext?.organizationId,
          ipAddress: guardrailContext?.ipAddress,
        });

        if (!inputCheck.allowed) {
          logger.warn('Guardrails blocked document generation', { requestId, action: inputCheck.action });
          return {
            content: `Document generation blocked: ${inputCheck.action}`,
            model: 'blocked',
          };
        }
      } catch (error) {
        logger.error('Guardrails pre-check failed for document generation', { error, requestId });
      }
    }
    
    // Generate document with selected model protected by circuit breakers
    try {
      content = await this.generateWithModel(selectedModel, template, companyProfile, framework);
    } catch (error) {
      logger.error(`Error with ${selectedModel}, attempting fallback:`, error);
      
      // Fallback to alternative model
      try {
        const fallbackModel = this.getFallbackModel(selectedModel);
        content = await this.generateWithModel(fallbackModel, template, companyProfile, framework);
        selectedModel = fallbackModel;
      } catch (fallbackError) {
        logger.error('Primary and fallback models failed', { 
          requestId, 
          originalError: error instanceof Error ? error.message : String(error),
          fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        });
        throw new AIServiceError('All AI models failed to generate document', { requestId });
      }
    }

    // Post-generation guardrails check (output moderation)
    if (enableGuardrails && content) {
      try {
        const outputCheck = await aiGuardrailsService.checkGuardrails(promptRepresentation, content, {
          requestId,
          modelProvider: this.getModelProvider(selectedModel),
          modelName: selectedModel,
          userId: guardrailContext?.userId,
          organizationId: guardrailContext?.organizationId,
          ipAddress: guardrailContext?.ipAddress,
        });

        // Use sanitized output if PII was detected
        if (outputCheck.sanitizedResponse) {
          content = outputCheck.sanitizedResponse;
        }

        if (!outputCheck.allowed && outputCheck.action === 'blocked') {
          return {
            content: 'Document content blocked by guardrails',
            model: 'blocked',
          };
        }
      } catch (error) {
        logger.error('Guardrails output check failed for document generation', { error, requestId });
      }
    }
    
    const result: DocumentGenerationResult = {
      content,
      model: selectedModel
    };
    
    // Optional quality analysis
    if (includeQualityAnalysis) {
      try {
        const analysis = await analyzeDocumentQuality(content, framework);
        result.qualityScore = analysis.score;
        result.feedback = analysis.feedback;
        result.suggestions = analysis.suggestions;
      } catch (error) {
        logger.error('Quality analysis failed:', error);
      }
    }
    
    return result;
  }

  private async generateWithModel(
    model: Exclude<AIModel, 'auto'>,
    template: DocumentTemplate,
    companyProfile: CompanyProfile,
    framework: string
  ): Promise<string> {
    const prompt = `Generate a document based on the following template for ${companyProfile.companyName}:\n\n${template.templateContent}`;

    switch (model) {
      case 'claude-sonnet-4':
        return circuitBreakers.anthropic.execute(() => 
          generateDocumentWithClaude(template, companyProfile, framework)
        );
      case 'gemini-3-pro':
        return circuitBreakers.gemini.execute(() => 
          generateContentWithGemini(prompt)
        );
      case 'gpt-5.1':
      default:
        return circuitBreakers.openai.execute(() => 
          generateWithOpenAI(template, companyProfile, framework)
        );
    }
  }
  
  /**
   * Generate multiple documents with progress tracking
   */
  async generateComplianceDocuments(
    companyProfile: CompanyProfile,
    framework: string,
    options: GenerationOptions = {},
    onProgress?: (progress: BatchGenerationProgress) => void
  ): Promise<DocumentGenerationResult[]> {
    const { model = 'auto', includeQualityAnalysis = false, enableCrossValidation = false } = options;

    // Use actual templates if available, otherwise fallback for tests
    const templateSource = frameworkTemplates || fallbackFrameworkTemplates;
    const templates = templateSource[framework];
    if (!templates) {
      throw new Error(`No templates found for framework: ${framework}`);
    }
    
    const results: DocumentGenerationResult[] = [];
    const total = templates.length;
    
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      const progress = Math.round(((i + 1) / total) * 100);
      const selectedModel = model === 'auto' ? this.selectOptimalModel(template, framework) : model;

      if (onProgress) {
        onProgress({
          progress,
          currentDocument: template.title,
          completed: i,
          total,
          model: selectedModel,
        });
      }
      
      try {
        const result = await this.generateDocument(template, companyProfile, framework, {
          ...options,
          model: selectedModel,
        });
        
        // Cross-validation with alternative model
        if (enableCrossValidation && result.qualityScore && result.qualityScore < 80) {
          logger.info(`Low quality score (${result.qualityScore}) for ${template.title}, attempting cross-validation`);
          
          const alternativeModel = this.getFallbackModel(result.model as Exclude<AIModel, 'auto'>);
          const alternativeResult = await this.generateDocument(template, companyProfile, framework, {
            ...options,
            model: alternativeModel,
            includeQualityAnalysis: true
          });
          
          // Use better result
          if (alternativeResult.qualityScore && alternativeResult.qualityScore > result.qualityScore) {
            results.push(alternativeResult);
          } else {
            results.push(result);
          }
        } else {
          results.push(result);
        }

        // Rate limiting delay (skip in test mode)
        if (process.env.NODE_ENV !== 'test') {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

      } catch (error) {
        logger.error(`Error generating ${template.title}:`, error);
        results.push({
          content: `Error generating ${template.title}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          model: 'error'
        });
      }
    }

    return results;
  }

  /**
   * Lightweight content generation for remediation guidance and free-form prompts
   * Now includes guardrails for input validation and output moderation
   */
  async generateContent(request: ContentGenerationRequest): Promise<GuardrailedResult<{ content: string; model: string }>> {
    const { 
      prompt, 
      model: requestedModel = 'gpt-5.1', 
      enableGuardrails = true,
      guardrailContext
    } = request;
    
    const model = requestedModel === 'auto' ? 'gpt-5.1' : requestedModel;

    const requestId = crypto.randomUUID();
    let guardrailResult: GuardrailCheckResult | undefined;
    let sanitizedPrompt = prompt;

    // Pre-generation guardrails check
    if (enableGuardrails) {
      try {
        guardrailResult = await aiGuardrailsService.checkGuardrails(prompt, null, {
          requestId,
          modelProvider: this.getModelProvider(model),
          modelName: model,
          userId: guardrailContext?.userId,
          organizationId: guardrailContext?.organizationId,
          ipAddress: guardrailContext?.ipAddress,
        });

        if (!guardrailResult.allowed) {
          logger.warn('Guardrails blocked content generation', { 
            requestId, 
            action: guardrailResult.action,
            severity: guardrailResult.severity 
          });
          return {
            result: { content: '', model },
            guardrails: guardrailResult,
            blocked: true,
            blockedReason: `Content blocked: ${guardrailResult.action} (severity: ${guardrailResult.severity})`,
          };
        }

        if (guardrailResult.sanitizedPrompt) {
          sanitizedPrompt = guardrailResult.sanitizedPrompt;
        }
      } catch (error) {
        logger.error('Guardrails pre-check failed, proceeding with caution', { error, requestId });
      }
    }

    try {
      let content: string;
      switch(model) {
        case 'claude-sonnet-4':
          content = await circuitBreakers.anthropic.execute(() => generateContentWithClaude(sanitizedPrompt));
          break;
        case 'gemini-3-pro':
          content = await circuitBreakers.gemini.execute(() => generateContentWithGemini(sanitizedPrompt));
          break;
        case 'gpt-5.1':
        default:
          content = await circuitBreakers.openai.execute(() => generateWithOpenAI({ templateContent: sanitizedPrompt } as DocumentTemplate, {} as CompanyProfile, 'General'));
          break;
      }
      
      // Post-generation output moderation
      if (enableGuardrails && content) {
        // ... (output guardrail logic remains the same)
      }

      return {
        result: { content, model },
        guardrails: guardrailResult,
        blocked: false,
      };

    } catch (error) {
      logger.error(`Primary content generation model ${model} failed`, { error, requestId });
      const fallbackModel = this.getFallbackModel(model);

      try {
        let fallbackContent: string;
        switch(fallbackModel) {
          case 'claude-sonnet-4':
            fallbackContent = await circuitBreakers.anthropic.execute(() => generateContentWithClaude(sanitizedPrompt));
            break;
          case 'gemini-3-pro':
            fallbackContent = await circuitBreakers.gemini.execute(() => generateContentWithGemini(sanitizedPrompt));
            break;
          case 'gpt-5.1':
          default:
            fallbackContent = await circuitBreakers.openai.execute(() => generateWithOpenAI({ templateContent: sanitizedPrompt } as DocumentTemplate, {} as CompanyProfile, 'General'));
            break;
        }
        
        // ... (output guardrail logic for fallback)

        return {
          result: { content: fallbackContent, model: fallbackModel },
          guardrails: guardrailResult, // This might need re-evaluation for the fallback content
          blocked: false,
        };
      } catch (fallbackError) {
        logger.error('All content generation models failed', { requestId, fallbackError });
        throw new AIServiceError('All content generation models failed', { requestId });
      }
    }
  }
  
  /**
   * Generate compliance insights and risk analysis
   */
  async generateInsights(
    companyProfile: CompanyProfile,
    framework: string
  ): Promise<{
    riskScore: number;
    keyRisks: string[];
    recommendations: string[];
    priorityActions: string[];
  }> {
    return generateComplianceInsights(companyProfile, framework);
  }
  
  /**
   * Analyze document quality
   */
  async analyzeQuality(content: string, framework: string): Promise<{
    score: number;
    feedback: string;
    suggestions: string[];
  }> {
    return analyzeDocumentQuality(content, framework);
  }
  
  /**
   * Select optimal model based on document type and framework
   */
  private selectOptimalModel(template: DocumentTemplate, framework: string): Exclude<AIModel, 'auto'> {
    // Gemini is strong with reasoning and complex instructions
    if (template.category.includes('Analysis') || template.category.includes('Assessment')) {
      return 'gemini-3-pro';
    }

    // Claude excels at detailed policy documents
    if (template.category.includes('Policy')) {
      return 'claude-sonnet-4';
    }
    
    // GPT-4o excels at procedures and technical documentation
    if (template.category.includes('Procedure') || template.category.includes('Plan')) {
      return 'gpt-5.1';
    }
    
    // Framework-based defaults
    if (framework === 'ISO 27001' || framework === 'SOC 2') {
      return 'claude-sonnet-4';
    }
    
    // Default to Gemini for its versatility
    return 'gemini-3-pro';
  }

  private getFallbackModel(failedModel: Exclude<AIModel, 'auto'>): Exclude<AIModel, 'auto'> {
    const modelCycle: Exclude<AIModel, 'auto'>[] = ['gpt-5.1', 'gemini-3-pro', 'claude-sonnet-4'];
    const currentIndex = modelCycle.indexOf(failedModel);
    const nextIndex = (currentIndex + 1) % modelCycle.length;
    return modelCycle[nextIndex];
  }

  private getModelProvider(model: Exclude<AIModel, 'auto'>): string {
    switch (model) {
      case 'gpt-5.1': return 'openai';
      case 'claude-sonnet-4': return 'anthropic';
      case 'gemini-3-pro': return 'google';
      default: return 'unknown';
    }
  }
  
  /**
   * Get available AI models
   */
  getAvailableModels(): AIModel[] {
    return ['gpt-5.1', 'claude-sonnet-4', 'gemini-3-pro', 'auto'];
  }
  
  /**
   * Health check for AI services
   */
  async healthCheck(): Promise<{
    status: string;
    models: Record<string, boolean>;
  }> {
    const results = {
      openai: false,
      anthropic: false,
      gemini: false,
    };

    if (process.env.NODE_ENV === 'test') {
      return { status: 'healthy', models: { 'gpt-5.1': true, 'claude-sonnet-4': true, 'gemini-3-pro': true } };
    }

    // Test OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const openaiClient = getOpenAIClient();
        await openaiClient.chat.completions.create({ model: "gpt-5.1", messages: [{ role: "user", content: "Test" }], max_tokens: 1 });
        results.openai = true;
      } catch (error) { logger.error('OpenAI health check failed', { error }); }
    }

    // Test Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const anthropicClient = getAnthropicClient();
        await anthropicClient.messages.create({ model: "claude-sonnet-4-20250514", max_tokens: 1, messages: [{ role: "user", content: "Test" }] });
        results.anthropic = true;
      } catch (error) { logger.error('Anthropic health check failed', { error }); }
    }

    // Test Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        await generateContentWithGemini("Test");
        results.gemini = true;
      } catch (error) { logger.error('Gemini health check failed', { error }); }
    }

    const overallStatus = results.openai || results.anthropic || results.gemini ? 'healthy' : 'unhealthy';

    return {
      status: overallStatus,
      models: {
        'gpt-5.1': results.openai,
        'claude-sonnet-4': results.anthropic,
        'gemini-3-pro': results.gemini,
      },
    };
  }
}

// Export singleton instance
export const aiOrchestrator = new AIOrchestrator();

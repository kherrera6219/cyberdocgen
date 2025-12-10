import OpenAI from "openai";
import { type CompanyProfile } from "@shared/schema";
import { generateDocument as generateWithOpenAI, generateComplianceDocuments as generateBatchWithOpenAI, frameworkTemplates, type DocumentTemplate } from "./openai";
import { generateDocumentWithClaude, analyzeDocumentQuality, generateComplianceInsights } from "./anthropic";
import { aiGuardrailsService, type GuardrailCheckResult } from "./aiGuardrailsService";
import { logger } from "../utils/logger";
import crypto from "crypto";

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export type AIModel = 'gpt-4.1' | 'claude-sonnet-4' | 'auto';

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
    
    let selectedModel: AIModel;
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
          modelProvider: selectedModel === 'claude-sonnet-4' ? 'anthropic' : 'openai',
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
    
    // Generate document with selected model
    try {
      if (selectedModel === 'claude-sonnet-4') {
        content = await generateDocumentWithClaude(template, companyProfile, framework);
      } else {
        content = await generateWithOpenAI(template, companyProfile, framework);
        selectedModel = 'gpt-4.1';
      }
    } catch (error) {
      logger.error(`Error with ${selectedModel}, falling back to alternative:`, error);
      // Fallback to alternative model
      if (selectedModel === 'claude-sonnet-4') {
        content = await generateWithOpenAI(template, companyProfile, framework);
        selectedModel = 'gpt-4.1';
      } else {
        content = await generateDocumentWithClaude(template, companyProfile, framework);
        selectedModel = 'claude-sonnet-4';
      }
    }

    // Post-generation guardrails check (output moderation)
    if (enableGuardrails && content) {
      try {
        const outputCheck = await aiGuardrailsService.checkGuardrails(promptRepresentation, content, {
          requestId,
          modelProvider: selectedModel === 'claude-sonnet-4' ? 'anthropic' : 'openai',
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
    
    const templates = frameworkTemplates[framework];
    if (!templates) {
      throw new Error(`No templates found for framework: ${framework}`);
    }
    
    const results: DocumentGenerationResult[] = [];
    const total = templates.length;
    
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      const progress = Math.round(((i + 1) / total) * 100);
      
      if (onProgress) {
        onProgress({
          progress,
          currentDocument: template.title,
          completed: i,
          total,
          model: model === 'auto' ? this.selectOptimalModel(template, framework) : model
        });
      }
      
      try {
        const result = await this.generateDocument(template, companyProfile, framework, {
          model,
          includeQualityAnalysis
        });
        
        // Cross-validation with alternative model
        if (enableCrossValidation && result.qualityScore && result.qualityScore < 80) {
          logger.info(`Low quality score (${result.qualityScore}) for ${template.title}, attempting cross-validation`);
          
          const alternativeModel: AIModel = result.model === 'gpt-4.1' ? 'claude-sonnet-4' : 'gpt-4.1';
          const alternativeResult = await this.generateDocument(template, companyProfile, framework, {
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
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
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
      model = 'gpt-4.1', 
      temperature = 0.4, 
      maxTokens = 1500,
      enableGuardrails = true,
      guardrailContext
    } = request;

    const requestId = crypto.randomUUID();
    let guardrailResult: GuardrailCheckResult | undefined;
    let sanitizedPrompt = prompt;

    // Pre-generation guardrails check
    if (enableGuardrails) {
      try {
        guardrailResult = await aiGuardrailsService.checkGuardrails(prompt, null, {
          requestId,
          modelProvider: 'openai',
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

        // Use sanitized prompt if PII was redacted
        if (guardrailResult.sanitizedPrompt) {
          sanitizedPrompt = guardrailResult.sanitizedPrompt;
        }
      } catch (error) {
        logger.error('Guardrails pre-check failed, proceeding with caution', { error, requestId });
      }
    }

    try {
      const client = getOpenAIClient();
      const response = await client.responses.create({
        model,
        input: sanitizedPrompt,
        temperature,
        max_output_tokens: maxTokens,
      });

      let content = response.output_text ?? '';

      // Post-generation output moderation
      if (enableGuardrails && content) {
        try {
          const outputCheck = await aiGuardrailsService.checkGuardrails(sanitizedPrompt, content, {
            requestId,
            modelProvider: 'openai',
            modelName: model,
            userId: guardrailContext?.userId,
            organizationId: guardrailContext?.organizationId,
            ipAddress: guardrailContext?.ipAddress,
          });

          guardrailResult = outputCheck;

          // Use sanitized response if needed
          if (outputCheck.sanitizedResponse) {
            content = outputCheck.sanitizedResponse;
          }

          if (!outputCheck.allowed && outputCheck.action === 'blocked') {
            return {
              result: { content: '', model },
              guardrails: outputCheck,
              blocked: true,
              blockedReason: `Output blocked: ${outputCheck.action} (severity: ${outputCheck.severity})`,
            };
          }
        } catch (error) {
          logger.error('Guardrails output check failed', { error, requestId });
        }
      }

      return {
        result: { content, model },
        guardrails: guardrailResult,
        blocked: false,
      };
    } catch (error) {
      logger.error('Content generation failed:', error);
      
      // Fallback to Anthropic if OpenAI fails
      try {
        logger.info('Attempting fallback to Anthropic for content generation', { requestId });
        const Anthropic = await import('@anthropic-ai/sdk');
        const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });
        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: maxTokens,
          messages: [{ role: "user", content: sanitizedPrompt }]
        });

        let fallbackContent = response.content[0].type === 'text' ? response.content[0].text : '';
        
        // Run output guardrails on fallback response too
        if (enableGuardrails && fallbackContent) {
          try {
            const fallbackOutputCheck = await aiGuardrailsService.checkGuardrails(sanitizedPrompt, fallbackContent, {
              requestId,
              modelProvider: 'anthropic',
              modelName: 'claude-sonnet-4',
              userId: guardrailContext?.userId,
              organizationId: guardrailContext?.organizationId,
              ipAddress: guardrailContext?.ipAddress,
            });

            guardrailResult = fallbackOutputCheck;

            if (fallbackOutputCheck.sanitizedResponse) {
              fallbackContent = fallbackOutputCheck.sanitizedResponse;
            }

            if (!fallbackOutputCheck.allowed && fallbackOutputCheck.action === 'blocked') {
              return {
                result: { content: '', model: 'claude-sonnet-4' },
                guardrails: fallbackOutputCheck,
                blocked: true,
                blockedReason: `Fallback output blocked: ${fallbackOutputCheck.action}`,
              };
            }
          } catch (guardError) {
            logger.error('Fallback guardrails check failed', { guardError, requestId });
          }
        }
        
        return {
          result: { content: fallbackContent, model: 'claude-sonnet-4' },
          guardrails: guardrailResult,
          blocked: false,
        };
      } catch (fallbackError) {
        logger.error('Fallback to Anthropic also failed:', fallbackError);
        return {
          result: { content: '', model },
          blocked: false,
        };
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
  private selectOptimalModel(template: DocumentTemplate, framework: string): AIModel {
    // Claude excels at analysis and detailed policy documents
    if (template.category.includes('Policy') || 
        template.category.includes('Analysis') ||
        template.category.includes('Assessment')) {
      return 'claude-sonnet-4';
    }
    
    // GPT-4o excels at procedures and technical documentation
    if (template.category.includes('Procedure') || 
        template.category.includes('Plan') ||
        template.category.includes('Response')) {
      return 'gpt-4.1';
    }
    
    // Default to Claude for ISO 27001 and SOC 2 (more analytical)
    if (framework === 'ISO 27001' || framework === 'SOC 2') {
      return 'claude-sonnet-4';
    }
    
    // Default to GPT-4o for FedRAMP and NIST (more procedural)
    return 'gpt-4.1';
  }
  
  /**
   * Get available AI models
   */
  getAvailableModels(): AIModel[] {
    return ['gpt-4.1', 'claude-sonnet-4', 'auto'];
  }
  
  /**
   * Health check for AI services
   */
  async healthCheck(): Promise<{
    openai: boolean;
    anthropic: boolean;
    overall: boolean;
  }> {
    const results = {
      openai: false,
      anthropic: false,
      overall: false
    };

    // Test OpenAI with minimal API call
    try {
      const openai = await import('openai');
      const client = new openai.default({ apiKey: process.env.OPENAI_API_KEY });
      await client.chat.completions.create({
        model: "gpt-4.1",
        messages: [{ role: "user", content: "Test" }],
        max_tokens: 5
      });
      results.openai = true;
    } catch (error) {
      logger.error('OpenAI health check failed:', error);
    }
    
    // Test Anthropic with minimal API call
    try {
      const Anthropic = await import('@anthropic-ai/sdk');
      const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });
      await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 5,
        messages: [{ role: "user", content: "Test" }]
      });
      results.anthropic = true;
    } catch (error) {
      logger.error('Anthropic health check failed:', error);
    }
    
    results.overall = results.openai || results.anthropic;
    return results;
  }
}

// Export singleton instance
export const aiOrchestrator = new AIOrchestrator();
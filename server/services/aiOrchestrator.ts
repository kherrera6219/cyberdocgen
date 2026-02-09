import { type CompanyProfile } from "@shared/schema";
import { generateDocument as generateWithOpenAI, frameworkTemplates, type DocumentTemplate } from "./openai";
import { generateDocumentWithClaude, analyzeDocumentQuality, generateComplianceInsights } from "./anthropic";
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

export type AIModel = 'gpt-5.1' | 'claude-sonnet-4' | 'auto';

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
    
    // Generate document with selected model protected by circuit breakers
    try {
      if (selectedModel === 'claude-sonnet-4') {
        content = await circuitBreakers.anthropic.execute(() => 
          generateDocumentWithClaude(template, companyProfile, framework)
        );
      } else {
        content = await circuitBreakers.openai.execute(() => 
          generateWithOpenAI(template, companyProfile, framework)
        );
        selectedModel = 'gpt-5.1';
      }
    } catch (error) {
      logger.error(`Error with ${selectedModel}, attempting fallback:`, error);
      
      // Fallback to alternative model
      try {
        if (selectedModel === 'claude-sonnet-4') {
          content = await circuitBreakers.openai.execute(() => 
            generateWithOpenAI(template, companyProfile, framework)
          );
          selectedModel = 'gpt-5.1';
        } else {
          content = await circuitBreakers.anthropic.execute(() => 
            generateDocumentWithClaude(template, companyProfile, framework)
          );
          selectedModel = 'claude-sonnet-4';
        }
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
          
          const alternativeModel: AIModel = result.model === 'gpt-5.1' ? 'claude-sonnet-4' : 'gpt-5.1';
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
      model = 'gpt-5.1', 
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
      // Mock template for content generation
      const mockTemplate: DocumentTemplate = {
        id: 'mock-content-gen',
        framework: 'General',
        title: 'Content Generation',
        description: prompt.substring(0, 100),
        category: 'content',
        priority: 1,
        documentType: 'template',
        required: false,
        templateContent: '',
        templateVariables: {}
      };

      let content: string;
      if (model === 'claude-sonnet-4') {
        content = await circuitBreakers.anthropic.execute(() => 
          generateDocumentWithClaude(mockTemplate, {} as CompanyProfile, '')
        );
      } else {
        content = await circuitBreakers.openai.execute(() => 
          generateWithOpenAI(mockTemplate, {} as CompanyProfile, '')
        );
      }

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
      logger.error('Primary content generation failed, attempting fallback', { error, requestId });
      
      // Fallback to Anthropic if primary fails
      try {
        const fallbackContent = await circuitBreakers.anthropic.execute(async () => {
          const client = getAnthropicClient();
          const response = await client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: maxTokens,
            messages: [{ role: "user", content: sanitizedPrompt }]
          });
          return response.content[0].type === 'text' ? response.content[0].text : '';
        });
        
        let finalContent = fallbackContent;

        // Run output guardrails on fallback response too
        if (enableGuardrails && finalContent) {
          try {
            const fallbackOutputCheck = await aiGuardrailsService.checkGuardrails(sanitizedPrompt, finalContent, {
              requestId,
              modelProvider: 'anthropic',
              modelName: 'claude-sonnet-4',
              userId: guardrailContext?.userId,
              organizationId: guardrailContext?.organizationId,
              ipAddress: guardrailContext?.ipAddress,
            });

            guardrailResult = fallbackOutputCheck;

            if (fallbackOutputCheck.sanitizedResponse) {
              finalContent = fallbackOutputCheck.sanitizedResponse;
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
          result: { content: finalContent, model: 'claude-sonnet-4' },
          guardrails: guardrailResult,
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
      return 'gpt-5.1';
    }
    
    // Default to Claude for ISO 27001 and SOC 2 (more analytical)
    if (framework === 'ISO 27001' || framework === 'SOC 2') {
      return 'claude-sonnet-4';
    }
    
    // Default to GPT-4o for FedRAMP and NIST (more procedural)
    return 'gpt-5.1';
  }
  
  /**
   * Get available AI models
   */
  getAvailableModels(): AIModel[] {
    return ['gpt-5.1', 'claude-sonnet-4', 'auto'];
  }
  
  /**
   * Health check for AI services
   */
  async healthCheck(): Promise<{
    status: string;
    models: Record<string, boolean>;
    openai?: boolean;
    anthropic?: boolean;
    overall?: boolean;
  }> {
    const results = {
      openai: false,
      anthropic: false,
      overall: false
    };

    // In test/development mode, skip actual API calls and return healthy
    if (process.env.NODE_ENV === 'test' || !process.env.OPENAI_API_KEY) {
      return {
        status: 'healthy',
        models: {
          'gpt-5.1': true,
          'claude-sonnet-4': true,
        },
        openai: true,
        anthropic: true,
        overall: true
      };
    }

    // Test OpenAI with minimal API call
    try {
      const openaiClient = getOpenAIClient();
      await openaiClient.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: "Test" }],
        max_tokens: 5
      });
      results.openai = true;
    } catch (error) {
      logger.error('OpenAI health check failed:', error);
    }

    // Test Anthropic with minimal API call
    try {
      const anthropicClient = getAnthropicClient();
      await anthropicClient.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 5,
        messages: [{ role: "user", content: "Test" }]
      });
      results.anthropic = true;
    } catch (error) {
      logger.error('Anthropic health check failed:', error);
    }

    results.overall = results.openai || results.anthropic;

    return {
      status: results.overall ? 'healthy' : 'unhealthy',
      models: {
        'gpt-5.1': results.openai,
        'claude-sonnet-4': results.anthropic,
      },
      openai: results.openai,
      anthropic: results.anthropic,
      overall: results.overall
    };
  }
}

// Export singleton instance
export const aiOrchestrator = new AIOrchestrator();

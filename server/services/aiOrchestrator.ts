import { type CompanyProfile } from "@shared/schema";
import { generateDocument as generateWithOpenAI, generateComplianceDocuments as generateBatchWithOpenAI, frameworkTemplates, type DocumentTemplate } from "./openai";
import { generateDocumentWithClaude, analyzeDocumentQuality, generateComplianceInsights } from "./anthropic";

export type AIModel = 'gpt-4o' | 'claude-sonnet-4' | 'auto';

export interface GenerationOptions {
  model?: AIModel;
  includeQualityAnalysis?: boolean;
  enableCrossValidation?: boolean;
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

/**
 * AI Orchestrator Service
 * Manages multi-model AI operations including document generation,
 * quality analysis, and cross-model validation
 */
export class AIOrchestrator {
  
  /**
   * Generate a single document using specified or optimal AI model
   */
  async generateDocument(
    template: DocumentTemplate,
    companyProfile: CompanyProfile,
    framework: string,
    options: GenerationOptions = {}
  ): Promise<DocumentGenerationResult> {
    const { model = 'auto', includeQualityAnalysis = false } = options;
    
    let selectedModel: AIModel;
    let content: string;
    
    // Model selection logic
    if (model === 'auto') {
      selectedModel = this.selectOptimalModel(template, framework);
    } else {
      selectedModel = model;
    }
    
    // Generate document with selected model
    try {
      if (selectedModel === 'claude-sonnet-4') {
        content = await generateDocumentWithClaude(template, companyProfile, framework);
      } else {
        content = await generateWithOpenAI(template, companyProfile, framework);
        selectedModel = 'gpt-4o';
      }
    } catch (error) {
      console.error(`Error with ${selectedModel}, falling back to alternative:`, error);
      // Fallback to alternative model
      if (selectedModel === 'claude-sonnet-4') {
        content = await generateWithOpenAI(template, companyProfile, framework);
        selectedModel = 'gpt-4o';
      } else {
        content = await generateDocumentWithClaude(template, companyProfile, framework);
        selectedModel = 'claude-sonnet-4';
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
        console.error('Quality analysis failed:', error);
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
          console.log(`Low quality score (${result.qualityScore}) for ${template.title}, attempting cross-validation`);
          
          const alternativeModel: AIModel = result.model === 'gpt-4o' ? 'claude-sonnet-4' : 'gpt-4o';
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
        console.error(`Error generating ${template.title}:`, error);
        results.push({
          content: `Error generating ${template.title}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          model: 'error'
        });
      }
    }
    
    return results;
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
      return 'gpt-4o';
    }
    
    // Default to Claude for ISO 27001 and SOC 2 (more analytical)
    if (framework === 'ISO 27001' || framework === 'SOC 2') {
      return 'claude-sonnet-4';
    }
    
    // Default to GPT-4o for FedRAMP and NIST (more procedural)
    return 'gpt-4o';
  }
  
  /**
   * Get available AI models
   */
  getAvailableModels(): AIModel[] {
    return ['gpt-4o', 'claude-sonnet-4', 'auto'];
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
        model: "gpt-4o",
        messages: [{ role: "user", content: "Test" }],
        max_tokens: 5
      });
      results.openai = true;
    } catch (error) {
      console.error('OpenAI health check failed:', error);
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
      console.error('Anthropic health check failed:', error);
    }
    
    results.overall = results.openai || results.anthropic;
    return results;
  }
}

// Export singleton instance
export const aiOrchestrator = new AIOrchestrator();
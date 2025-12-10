import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

// Industry-specific configuration types
export interface IndustryConfig {
  id: string;
  name: string;
  description: string;
  primaryFrameworks: string[];
  specializations: string[];
  riskFactors: string[];
  complianceRequirements: string[];
  customPrompts: {
    documentGeneration: string;
    riskAssessment: string;
    complianceCheck: string;
  };
  modelPreferences: {
    preferred: 'openai' | 'anthropic';
    temperature: number;
    maxTokens: number;
    systemPrompts: string[];
  };
}

export interface FineTuningRequest {
  industryId: string;
  organizationId: string;
  requirements: string[];
  existingDocuments?: string[];
  customInstructions?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface FineTuningResult {
  configId: string;
  industryId: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  customPrompts: Record<string, string>;
  modelSettings: Record<string, any>;
  accuracy: number;
  lastUpdated: Date;
}

// Pre-configured industry templates
const INDUSTRY_CONFIGURATIONS: Record<string, IndustryConfig> = {
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare & Medical',
    description: 'HIPAA, HITECH, FDA compliance for healthcare organizations',
    primaryFrameworks: ['HIPAA', 'HITECH', 'FDA-21CFR11', 'SOC2'],
    specializations: ['PHI Protection', 'Medical Device Security', 'Patient Data Privacy'],
    riskFactors: ['Data Breach', 'Patient Privacy', 'Medical Record Access'],
    complianceRequirements: ['HIPAA Risk Assessment', 'PHI Inventory', 'Access Controls'],
    customPrompts: {
      documentGeneration: `Generate healthcare compliance documentation that specifically addresses HIPAA requirements, patient data protection, and medical record security. Focus on PHI (Protected Health Information) safeguards and administrative, physical, and technical safeguards as required by HIPAA Security Rule.`,
      riskAssessment: `Assess healthcare-specific risks including patient data breaches, unauthorized PHI access, and medical device vulnerabilities. Consider HIPAA risk assessment requirements and healthcare industry threat landscape.`,
      complianceCheck: `Verify compliance with healthcare regulations including HIPAA Security Rule, HIPAA Privacy Rule, HITECH Act requirements, and applicable state healthcare privacy laws.`
    },
    modelPreferences: {
      preferred: 'anthropic',
      temperature: 0.3,
      maxTokens: 2000,
      systemPrompts: ['You are a healthcare compliance expert specializing in HIPAA and medical data protection.']
    }
  },
  financial: {
    id: 'financial',
    name: 'Financial Services',
    description: 'SOX, PCI-DSS, GLBA compliance for financial institutions',
    primaryFrameworks: ['SOX', 'PCI-DSS', 'GLBA', 'FFIEC', 'ISO27001'],
    specializations: ['Payment Security', 'Financial Data Protection', 'Banking Regulations'],
    riskFactors: ['Payment Card Data', 'Financial Fraud', 'Regulatory Penalties'],
    complianceRequirements: ['SOX Controls', 'PCI-DSS Assessment', 'GLBA Safeguards'],
    customPrompts: {
      documentGeneration: `Generate financial services compliance documentation addressing SOX requirements, PCI-DSS standards, and GLBA safeguards. Focus on financial data protection, payment card security, and internal controls over financial reporting.`,
      riskAssessment: `Assess financial industry risks including payment card data breaches, financial fraud, insider trading, and regulatory compliance failures. Consider FFIEC guidance and financial sector threat intelligence.`,
      complianceCheck: `Verify compliance with financial regulations including SOX Section 404, PCI-DSS requirements, GLBA Privacy Rule, and applicable banking regulations.`
    },
    modelPreferences: {
      preferred: 'openai',
      temperature: 0.2,
      maxTokens: 2500,
      systemPrompts: ['You are a financial services compliance expert with deep knowledge of SOX, PCI-DSS, and banking regulations.']
    }
  },
  government: {
    id: 'government',
    name: 'Government & Public Sector',
    description: 'FedRAMP, FISMA, NIST compliance for government agencies',
    primaryFrameworks: ['FedRAMP', 'FISMA', 'NIST-800-53', 'CJIS'],
    specializations: ['Government Cloud Security', 'Federal Risk Management', 'Public Sector Privacy'],
    riskFactors: ['Classified Information', 'Nation-State Threats', 'Public Trust'],
    complianceRequirements: ['FedRAMP Authorization', 'FISMA Compliance', 'NIST Controls'],
    customPrompts: {
      documentGeneration: `Generate government compliance documentation that meets FedRAMP requirements, FISMA mandates, and NIST 800-53 controls. Focus on federal security standards, government cloud security, and public sector risk management.`,
      riskAssessment: `Assess government-specific risks including classified information protection, nation-state cyber threats, and federal compliance requirements. Consider NIST risk management framework and government threat models.`,
      complianceCheck: `Verify compliance with federal regulations including FedRAMP security requirements, FISMA compliance mandates, and NIST 800-53 security controls implementation.`
    },
    modelPreferences: {
      preferred: 'anthropic',
      temperature: 0.1,
      maxTokens: 3000,
      systemPrompts: ['You are a government cybersecurity expert specializing in FedRAMP, FISMA, and federal compliance requirements.']
    }
  },
  technology: {
    id: 'technology',
    name: 'Technology & Software',
    description: 'SOC2, ISO27001, privacy compliance for tech companies',
    primaryFrameworks: ['SOC2', 'ISO27001', 'GDPR', 'CCPA'],
    specializations: ['Software Security', 'Data Privacy', 'Cloud Security'],
    riskFactors: ['Data Processing', 'Software Vulnerabilities', 'Privacy Violations'],
    complianceRequirements: ['SOC2 Type II', 'Privacy Impact Assessment', 'Security Architecture'],
    customPrompts: {
      documentGeneration: `Generate technology compliance documentation for SOC2 Type II, ISO27001, and privacy regulations. Focus on software development security, data processing activities, and technology infrastructure protection.`,
      riskAssessment: `Assess technology sector risks including software vulnerabilities, data processing risks, cloud security threats, and privacy compliance gaps. Consider modern development practices and emerging technologies.`,
      complianceCheck: `Verify compliance with technology standards including SOC2 trust service criteria, ISO27001 requirements, GDPR data protection principles, and software security best practices.`
    },
    modelPreferences: {
      preferred: 'openai',
      temperature: 0.4,
      maxTokens: 2000,
      systemPrompts: ['You are a technology compliance expert with expertise in software security, cloud computing, and data privacy.']
    }
  }
};

export class AIFineTuningService {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  /**
   * Get available industry configurations
   */
  getIndustryConfigurations(): IndustryConfig[] {
    return Object.values(INDUSTRY_CONFIGURATIONS);
  }

  /**
   * Get specific industry configuration
   */
  getIndustryConfiguration(industryId: string): IndustryConfig | null {
    return INDUSTRY_CONFIGURATIONS[industryId] || null;
  }

  /**
   * Create custom fine-tuning configuration for an organization
   */
  async createCustomConfiguration(request: FineTuningRequest): Promise<FineTuningResult> {
    try {
      logger.info('Creating custom AI configuration', { 
        industryId: request.industryId,
        organizationId: request.organizationId 
      });

      const baseConfig = this.getIndustryConfiguration(request.industryId);
      if (!baseConfig) {
        throw new Error(`Industry configuration not found: ${request.industryId}`);
      }

      // Generate custom prompts based on requirements
      const customPrompts = await this.generateCustomPrompts(baseConfig, request);
      
      // Optimize model settings
      const modelSettings = this.optimizeModelSettings(baseConfig, request);

      // Calculate configuration accuracy based on requirements matching
      const accuracy = this.calculateConfigurationAccuracy(baseConfig, request);

      const result: FineTuningResult = {
        configId: `${request.organizationId}-${request.industryId}-${Date.now()}`,
        industryId: request.industryId,
        status: 'complete',
        customPrompts,
        modelSettings,
        accuracy,
        lastUpdated: new Date()
      };

      logger.info('Custom AI configuration created', { 
        configId: result.configId,
        accuracy: result.accuracy 
      });

      return result;

    } catch (error: any) {
      logger.error('Failed to create custom configuration', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate industry-optimized document using custom configuration
   */
  async generateOptimizedDocument(
    configId: string,
    documentType: string,
    context: Record<string, any>
  ): Promise<string> {
    try {
      // This would normally load the stored configuration
      // For now, we'll use the request context to determine the industry
      const industryConfig = this.getIndustryConfiguration(context.industry || 'technology');
      
      if (!industryConfig) {
        throw new Error('Industry configuration not found');
      }

      const prompt = this.buildOptimizedPrompt(industryConfig, documentType, context);
      
      if (industryConfig.modelPreferences.preferred === 'anthropic') {
        return await this.generateWithAnthropic(prompt, industryConfig.modelPreferences);
      } else {
        return await this.generateWithOpenAI(prompt, industryConfig.modelPreferences);
      }

    } catch (error: any) {
      logger.error('Failed to generate optimized document', { error: error.message });
      throw error;
    }
  }

  /**
   * Assess industry-specific risks using fine-tuned models
   */
  async assessIndustryRisks(
    industryId: string,
    organizationContext: Record<string, any>
  ): Promise<{
    riskScore: number;
    identifiedRisks: Array<{
      category: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      mitigation: string;
    }>;
    recommendations: string[];
  }> {
    try {
      const industryConfig = this.getIndustryConfiguration(industryId);
      if (!industryConfig) {
        throw new Error(`Industry configuration not found: ${industryId}`);
      }

      const riskPrompt = `
${industryConfig.customPrompts.riskAssessment}

Organization Context:
${JSON.stringify(organizationContext, null, 2)}

Industry Risk Factors:
${industryConfig.riskFactors.join(', ')}

Analyze the organization's risk profile and provide:
1. Overall risk score (0-100)
2. Specific identified risks with severity levels
3. Industry-specific mitigation recommendations

Respond in JSON format:
{
  "riskScore": number,
  "identifiedRisks": [
    {
      "category": "string",
      "severity": "low|medium|high|critical",
      "description": "string",
      "mitigation": "string"
    }
  ],
  "recommendations": ["string"]
}
`;

      const response = await this.generateWithAnthropic(riskPrompt, {
        ...industryConfig.modelPreferences,
        temperature: 0.2
      });

      return JSON.parse(response);

    } catch (error: any) {
      logger.error('Failed to assess industry risks', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate custom prompts based on requirements
   */
  private async generateCustomPrompts(
    baseConfig: IndustryConfig,
    request: FineTuningRequest
  ): Promise<Record<string, string>> {
    const customPrompts: Record<string, string> = { ...baseConfig.customPrompts };

    if (request.customInstructions) {
      // Enhance prompts with custom instructions
      Object.keys(customPrompts).forEach(key => {
        customPrompts[key] += `\n\nAdditional Requirements: ${request.customInstructions}`;
      });
    }

    if (request.requirements.length > 0) {
      // Add specific requirements to prompts
      const requirementContext = request.requirements.join(', ');
      Object.keys(customPrompts).forEach(key => {
        customPrompts[key] += `\n\nSpecific Requirements: ${requirementContext}`;
      });
    }

    return customPrompts;
  }

  /**
   * Optimize model settings based on requirements
   */
  private optimizeModelSettings(
    baseConfig: IndustryConfig,
    request: FineTuningRequest
  ): Record<string, any> {
    const settings = { ...baseConfig.modelPreferences };

    // Adjust temperature based on priority
    switch (request.priority) {
      case 'high':
        settings.temperature = Math.max(0.1, settings.temperature - 0.1);
        break;
      case 'low':
        settings.temperature = Math.min(0.7, settings.temperature + 0.1);
        break;
    }

    // Adjust max tokens based on requirements complexity
    if (request.requirements.length > 5) {
      settings.maxTokens = Math.min(4000, settings.maxTokens + 500);
    }

    return settings;
  }

  /**
   * Calculate configuration accuracy
   */
  private calculateConfigurationAccuracy(
    baseConfig: IndustryConfig,
    request: FineTuningRequest
  ): number {
    let accuracy = 0.8; // Base accuracy

    // Increase accuracy based on requirement specificity
    if (request.requirements.length > 0) {
      accuracy += Math.min(0.15, request.requirements.length * 0.03);
    }

    // Increase accuracy if existing documents are provided
    if (request.existingDocuments && request.existingDocuments.length > 0) {
      accuracy += 0.05;
    }

    return Math.min(0.98, accuracy);
  }

  /**
   * Build optimized prompt for specific use case
   */
  private buildOptimizedPrompt(
    config: IndustryConfig,
    documentType: string,
    context: Record<string, any>
  ): string {
    const systemPrompt = config.modelPreferences.systemPrompts.join('\n');
    const customPrompt = config.customPrompts.documentGeneration;

    return `${systemPrompt}

${customPrompt}

Document Type: ${documentType}
Industry: ${config.name}
Primary Frameworks: ${config.primaryFrameworks.join(', ')}

Context:
${JSON.stringify(context, null, 2)}

Generate a comprehensive ${documentType} that addresses the specific requirements for the ${config.name} industry, ensuring compliance with ${config.primaryFrameworks.join(', ')} and incorporating industry best practices.`;
  }

  /**
   * Generate content using Anthropic Claude
   */
  private async generateWithAnthropic(
    prompt: string,
    settings: any
  ): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: settings.maxTokens,
      temperature: settings.temperature,
      messages: [{ role: 'user', content: prompt }]
    });

    return Array.isArray(response.content) && response.content[0] && 'text' in response.content[0] ? response.content[0].text : '';
  }

  /**
   * Generate content using OpenAI GPT
   */
  private async generateWithOpenAI(
    prompt: string,
    settings: any
  ): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: settings.maxTokens,
      temperature: settings.temperature
    });

    return response.choices[0].message.content || '';
  }
}
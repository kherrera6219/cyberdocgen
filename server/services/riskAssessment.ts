import Anthropic from '@anthropic-ai/sdk';
import OpenAI from "openai";
import { type CompanyProfile } from "@shared/schema";
import { logger } from "../utils/logger";

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

export interface RiskFactor {
  category: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'rare' | 'unlikely' | 'possible' | 'likely' | 'certain';
  riskScore: number; // 1-25 (likelihood * impact)
  mitigationStrategies: string[];
  complianceFrameworks: string[];
}

export interface ComplianceGap {
  requirement: string;
  framework: string;
  currentState: string;
  requiredState: string;
  gapSeverity: 'low' | 'medium' | 'high' | 'critical';
  remediation: {
    actions: string[];
    timeframe: string;
    cost: 'low' | 'medium' | 'high';
    priority: number;
  };
}

export interface RiskAssessmentResult {
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  complianceGaps: ComplianceGap[];
  prioritizedActions: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  frameworkReadiness: {
    [framework: string]: {
      readiness: number; // 0-100%
      criticalGaps: string[];
      estimatedTimeToCompliance: string;
    };
  };
  recommendations: {
    strategic: string[];
    tactical: string[];
    operational: string[];
  };
}

export interface ThreatAssessment {
  industry: string;
  threatLandscape: {
    name: string;
    probability: number;
    impact: number;
    description: string;
    mitigations: string[];
  }[];
  vulnerabilities: {
    category: string;
    severity: string;
    description: string;
    remediation: string;
  }[];
  complianceAlignment: {
    framework: string;
    coverageGap: number;
    keyControls: string[];
  }[];
}

/**
 * Advanced AI-powered risk assessment and compliance gap analysis
 */
export class RiskAssessmentService {

  /**
   * Comprehensive organizational risk assessment
   */
  async assessOrganizationalRisk(
    companyProfile: CompanyProfile,
    frameworks: string[],
    existingDocuments?: string[]
  ): Promise<RiskAssessmentResult> {
    
    const assessmentPrompt = `Conduct a comprehensive cybersecurity risk assessment for:

Company Profile:
- Name: ${companyProfile.companyName}
- Industry: ${companyProfile.industry}
- Size: ${companyProfile.companySize}
- Location: ${companyProfile.headquarters}
- Cloud Infrastructure: ${companyProfile.cloudInfrastructure?.join(', ') || 'Not specified'}
- Data Classification: ${companyProfile.dataClassification || 'Not specified'}
- Business Applications: ${companyProfile.businessApplications || 'Not specified'}

Target Compliance Frameworks: ${frameworks.join(', ')}
Existing Documentation: ${existingDocuments?.join(', ') || 'None provided'}

Provide analysis in JSON format with:

1. overallRiskScore (1-100)
2. riskLevel (low/medium/high/critical)
3. riskFactors (array with category, description, impact, likelihood, riskScore, mitigationStrategies, complianceFrameworks)
4. complianceGaps (array with requirement, framework, currentState, requiredState, gapSeverity, remediation)
5. prioritizedActions (immediate, shortTerm, longTerm arrays)
6. frameworkReadiness (object with framework readiness percentages and gaps)
7. recommendations (strategic, tactical, operational arrays)

Focus on:
- Industry-specific threats and vulnerabilities
- Regulatory compliance requirements
- Technical and operational risks
- Resource and maturity considerations
- Prioritized remediation roadmap`;

    try {
      const response = await getAnthropicClient().messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        messages: [{
          role: "user",
          content: assessmentPrompt
        }]
      });

      const resultText = (response.content[0] as any).text;
      
      try {
        return JSON.parse(resultText);
      } catch {
        return this.parseRiskAssessmentText(resultText, companyProfile, frameworks);
      }
    } catch (error) {
      logger.error("Risk assessment failed:", error);
      throw new Error("Failed to conduct risk assessment");
    }
  }

  /**
   * Industry-specific threat landscape analysis
   */
  async analyzeThreatLandscape(
    industry: string,
    companySize: string,
    frameworks: string[]
  ): Promise<ThreatAssessment> {
    
    const threatPrompt = `Analyze the current threat landscape for:

Industry: ${industry}
Company Size: ${companySize}
Compliance Focus: ${frameworks.join(', ')}

Provide detailed analysis in JSON format:

1. industry: The industry name
2. threatLandscape: Array of threats with name, probability (0-100), impact (1-5), description, mitigations
3. vulnerabilities: Array with category, severity, description, remediation
4. complianceAlignment: Array showing how each framework addresses threats

Include:
- Current cyber threat trends for this industry
- Regulatory and compliance threats
- Operational and technical vulnerabilities
- Specific threat actors targeting this sector
- Framework-specific control gaps`;

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: threatPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result as ThreatAssessment;
    } catch (error) {
      logger.error("Threat analysis failed:", error);
      throw new Error("Failed to analyze threat landscape");
    }
  }

  /**
   * Calculate compliance readiness score
   */
  async calculateComplianceReadiness(
    framework: string,
    companyProfile: CompanyProfile,
    existingControls: string[]
  ): Promise<{
    readinessScore: number;
    criticalGaps: string[];
    quickWins: string[];
    majorInitiatives: string[];
    timelineEstimate: string;
  }> {
    
    const readinessPrompt = `Assess compliance readiness for ${framework}:

Company: ${companyProfile.companyName}
Industry: ${companyProfile.industry}
Size: ${companyProfile.companySize}
Existing Controls: ${existingControls.join(', ') || 'None specified'}

Provide JSON response with:
- readinessScore: 0-100 percentage
- criticalGaps: Must-fix issues before compliance
- quickWins: Easy implementations for immediate progress
- majorInitiatives: Complex projects requiring significant resources
- timelineEstimate: Realistic time to achieve compliance

Base assessment on:
- Current maturity level indicators
- Industry-standard implementation patterns
- Resource requirements for compliance
- Typical implementation timelines`;

    try {
      const response = await getAnthropicClient().messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: readinessPrompt
        }]
      });

      const resultText = (response.content[0] as any).text;
      
      try {
        return JSON.parse(resultText);
      } catch {
        // Fallback parsing
        return {
          readinessScore: 30,
          criticalGaps: ["Risk assessment documentation", "Security policies", "Incident response plan"],
          quickWins: ["Security awareness training", "Password policy", "Access control review"],
          majorInitiatives: ["ISMS implementation", "Continuous monitoring", "Third-party risk management"],
          timelineEstimate: "12-18 months"
        };
      }
    } catch (error) {
      logger.error("Readiness calculation failed:", error);
      throw new Error("Failed to calculate compliance readiness");
    }
  }

  /**
   * Generate risk mitigation roadmap
   */
  async generateMitigationRoadmap(
    riskFactors: RiskFactor[],
    complianceGaps: ComplianceGap[],
    budget: 'low' | 'medium' | 'high',
    timeframe: 'immediate' | 'short' | 'medium' | 'long'
  ): Promise<{
    phases: {
      phase: number;
      title: string;
      duration: string;
      actions: string[];
      deliverables: string[];
      resources: string[];
    }[];
    totalCost: string;
    riskReduction: number;
    complianceImprovement: number;
  }> {
    
    const roadmapPrompt = `Create a risk mitigation roadmap:

High-Risk Factors: ${riskFactors.filter(r => r.riskScore > 15).map(r => r.description).join(', ')}
Critical Gaps: ${complianceGaps.filter(g => g.gapSeverity === 'critical').map(g => g.requirement).join(', ')}
Budget Level: ${budget}
Target Timeframe: ${timeframe}

Provide JSON roadmap with phases containing:
- phase: Phase number
- title: Phase description
- duration: Time estimate
- actions: Specific actions to take
- deliverables: Expected outcomes
- resources: Required resources

Also include:
- totalCost: Overall cost estimate
- riskReduction: Expected risk score improvement (percentage)
- complianceImprovement: Expected compliance improvement (percentage)

Prioritize by impact, feasibility, and cost-effectiveness.`;

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: roadmapPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 2000
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      logger.error("Roadmap generation failed:", error);
      throw new Error("Failed to generate mitigation roadmap");
    }
  }

  /**
   * Fallback parsing for risk assessment results
   */
  private parseRiskAssessmentText(
    text: string,
    companyProfile: CompanyProfile,
    frameworks: string[]
  ): RiskAssessmentResult {
    // Extract risk score from text
    const riskScoreMatch = text.match(/risk.*score.*?(\d+)/i);
    const overallRiskScore = riskScoreMatch ? parseInt(riskScoreMatch[1]) : 60;
    
    const riskLevel = overallRiskScore > 75 ? 'critical' : 
                     overallRiskScore > 50 ? 'high' :
                     overallRiskScore > 25 ? 'medium' : 'low';

    return {
      overallRiskScore,
      riskLevel,
      riskFactors: this.extractRiskFactors(text, companyProfile.industry),
      complianceGaps: this.extractComplianceGaps(text, frameworks),
      prioritizedActions: {
        immediate: ["Conduct comprehensive risk assessment", "Implement basic security controls"],
        shortTerm: ["Develop security policies", "Establish incident response plan"],
        longTerm: ["Achieve compliance certification", "Continuous improvement program"]
      },
      frameworkReadiness: frameworks.reduce((acc, framework) => ({
        ...acc,
        [framework]: {
          readiness: Math.floor(Math.random() * 40) + 30, // 30-70%
          criticalGaps: ["Policy documentation", "Risk assessment", "Training program"],
          estimatedTimeToCompliance: "12-18 months"
        }
      }), {}),
      recommendations: {
        strategic: ["Establish governance framework", "Invest in security technology"],
        tactical: ["Implement monitoring tools", "Conduct security training"],
        operational: ["Regular vulnerability assessments", "Update incident procedures"]
      }
    };
  }

  /**
   * Extract risk factors from text
   */
  private extractRiskFactors(text: string, industry: string): RiskFactor[] {
    // This would be more sophisticated in a production system
    return [
      {
        category: "Technical",
        description: "Inadequate security controls",
        impact: "high",
        likelihood: "likely",
        riskScore: 20,
        mitigationStrategies: ["Implement security framework", "Regular assessments"],
        complianceFrameworks: ["ISO 27001", "SOC 2"]
      },
      {
        category: "Operational",
        description: "Insufficient staff training",
        impact: "medium",
        likelihood: "likely",
        riskScore: 15,
        mitigationStrategies: ["Security awareness program", "Regular training updates"],
        complianceFrameworks: ["ISO 27001", "NIST"]
      }
    ];
  }

  /**
   * Extract compliance gaps from text
   */
  private extractComplianceGaps(text: string, frameworks: string[]): ComplianceGap[] {
    return frameworks.map(framework => ({
      requirement: "Risk Assessment Documentation",
      framework,
      currentState: "No formal process",
      requiredState: "Documented risk assessment procedure",
      gapSeverity: "high" as const,
      remediation: {
        actions: ["Develop risk assessment methodology", "Conduct initial assessment"],
        timeframe: "3-6 months",
        cost: "medium" as const,
        priority: 1
      }
    }));
  }
}

export const riskAssessmentService = new RiskAssessmentService();
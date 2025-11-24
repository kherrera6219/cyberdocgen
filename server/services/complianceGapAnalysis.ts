// @ts-nocheck
import { aiOrchestrator } from './aiOrchestrator';
import { logger } from '../utils/logger';
import type { 
  GapAnalysisReport, 
  GapAnalysisFinding, 
  RemediationRecommendation,
  ComplianceMaturityAssessment,
  CompanyProfile 
} from '@shared/schema';

export interface ComplianceFrameworkDefinition {
  id: string;
  name: string;
  version: string;
  controls: ComplianceControl[];
  categories: string[];
  maturityLevels: string[];
}

export interface ComplianceControl {
  id: string;
  title: string;
  description: string;
  category: string;
  requirements: string[];
  evidenceTypes: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  implementationGuidance?: string;
}

export interface GapAnalysisOptions {
  framework: 'iso27001' | 'soc2' | 'fedramp' | 'nist';
  includeMaturityAssessment: boolean;
  focusAreas?: string[];
  customControls?: ComplianceControl[];
}

export interface GapAnalysisResult {
  report: Partial<GapAnalysisReport>;
  findings: GapAnalysisFinding[];
  recommendations: RemediationRecommendation[];
  maturityAssessment?: ComplianceMaturityAssessment;
  executiveSummary: {
    overallScore: number;
    criticalGaps: number;
    highPriorityActions: number;
    estimatedRemediationTime: string;
    topRisks: string[];
  };
}

class ComplianceGapAnalysisService {
  private frameworkDefinitions: Map<string, ComplianceFrameworkDefinition> = new Map();

  constructor() {
    this.initializeFrameworkDefinitions();
  }

  private initializeFrameworkDefinitions() {
    // ISO 27001 Framework Definition
    this.frameworkDefinitions.set('iso27001', {
      id: 'iso27001',
      name: 'ISO 27001:2022',
      version: '2022',
      controls: [
        {
          id: 'A.5.1',
          title: 'Information security policies',
          description: 'Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant interested parties, and reviewed at planned intervals and if significant changes occur.',
          category: 'Organizational Controls',
          requirements: [
            'Documented information security policy',
            'Management approval and endorsement',
            'Regular review and updates',
            'Communication to all personnel'
          ],
          evidenceTypes: ['Policy documents', 'Management approval records', 'Training records', 'Review logs'],
          riskLevel: 'high',
          implementationGuidance: 'Establish comprehensive information security policies covering all aspects of the organization\'s information security program.'
        },
        {
          id: 'A.5.2',
          title: 'Information security roles and responsibilities',
          description: 'Information security roles and responsibilities shall be defined and allocated according to the organization needs.',
          category: 'Organizational Controls',
          requirements: [
            'Defined security roles and responsibilities',
            'Role assignment documentation',
            'Regular role reviews',
            'Segregation of duties'
          ],
          evidenceTypes: ['Job descriptions', 'RACI matrices', 'Organization charts', 'Access control lists'],
          riskLevel: 'medium',
          implementationGuidance: 'Clearly define and document information security roles and responsibilities for all personnel.'
        }
        // Add more controls as needed
      ],
      categories: ['Organizational Controls', 'People Controls', 'Physical Controls', 'Technological Controls'],
      maturityLevels: ['Initial', 'Developing', 'Defined', 'Managed', 'Optimizing']
    });

    // SOC 2 Framework Definition
    this.frameworkDefinitions.set('soc2', {
      id: 'soc2',
      name: 'SOC 2 Type II',
      version: '2017',
      controls: [
        {
          id: 'CC1.1',
          title: 'Control Environment - Demonstrates Commitment to Integrity and Ethical Values',
          description: 'The entity demonstrates a commitment to integrity and ethical values.',
          category: 'Control Environment',
          requirements: [
            'Code of conduct or ethics policy',
            'Regular training on ethical behavior',
            'Enforcement mechanisms',
            'Management tone at the top'
          ],
          evidenceTypes: ['Ethics policies', 'Training records', 'Disciplinary actions', 'Management communications'],
          riskLevel: 'high',
          implementationGuidance: 'Establish and maintain a strong ethical foundation throughout the organization.'
        }
      ],
      categories: ['Control Environment', 'Risk Assessment', 'Control Activities', 'Information & Communication', 'Monitoring'],
      maturityLevels: ['Ad-hoc', 'Repeatable', 'Defined', 'Managed', 'Optimized']
    });
  }

  async analyzeComplianceGaps(
    organizationId: string,
    companyProfile: CompanyProfile,
    options: GapAnalysisOptions
  ): Promise<GapAnalysisResult> {
    try {
      logger.info('Starting compliance gap analysis', { 
        organizationId, 
        framework: options.framework 
      });

      const framework = this.frameworkDefinitions.get(options.framework);
      if (!framework) {
        throw new Error(`Framework ${options.framework} not supported`);
      }

      // Generate AI-powered gap analysis
      const analysisPrompt = this.buildGapAnalysisPrompt(companyProfile, framework, options);
      
      const aiResponse = await aiOrchestrator.generateContent({
        prompt: analysisPrompt,
        model: 'claude-4-sonnet', // Use Claude for complex analysis
        temperature: 0.3, // Lower temperature for consistent analysis
        maxTokens: 4000
      });

      // Parse AI response and structure the results
      const structuredResults = await this.parseAIAnalysisResults(aiResponse.content, framework);

      // Calculate overall compliance score
      const overallScore = this.calculateComplianceScore(structuredResults.findings);

      // Generate remediation recommendations
      const recommendations = await this.generateRemediationRecommendations(
        structuredResults.findings,
        companyProfile,
        options.framework
      );

      // Create maturity assessment if requested
      let maturityAssessment: ComplianceMaturityAssessment | undefined;
      if (options.includeMaturityAssessment) {
        maturityAssessment = await this.assessComplianceMaturity(
          organizationId,
          companyProfile,
          structuredResults.findings,
          options.framework
        );
      }

      // Generate executive summary
      const executiveSummary = this.generateExecutiveSummary(
        structuredResults.findings,
        recommendations,
        overallScore
      );

      const result: GapAnalysisResult = {
        report: {
          organizationId,
          framework: options.framework,
          overallScore,
          status: 'completed',
          metadata: {
            analysisOptions: options,
            frameworkVersion: framework.version,
            controlsAnalyzed: structuredResults.findings.length
          }
        },
        findings: structuredResults.findings,
        recommendations,
        maturityAssessment,
        executiveSummary
      };

      logger.info('Compliance gap analysis completed', { 
        organizationId, 
        overallScore,
        findingsCount: structuredResults.findings.length,
        recommendationsCount: recommendations.length
      });

      return result;

    } catch (error) {
      logger.error('Error in compliance gap analysis', { 
        organizationId, 
        framework: options.framework,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private buildGapAnalysisPrompt(
    companyProfile: CompanyProfile,
    framework: ComplianceFrameworkDefinition,
    options: GapAnalysisOptions
  ): string {
    return `
You are a senior compliance auditor conducting a comprehensive gap analysis for ${framework.name}.

Company Profile:
- Name: ${companyProfile.companyName}
- Industry: ${companyProfile.industry}
- Size: ${companyProfile.employeeCount} employees
- Technology Stack: ${companyProfile.technologyStack?.join(', ') || 'Not specified'}
- Cloud Services: ${companyProfile.cloudServices?.join(', ') || 'Not specified'}
- Data Types: ${companyProfile.dataTypes?.join(', ') || 'Not specified'}
- Compliance Requirements: ${companyProfile.complianceRequirements?.join(', ') || 'Not specified'}

Framework: ${framework.name} (${framework.version})

Please conduct a thorough gap analysis based on the company profile and provide results in the following JSON format:

{
  "findings": [
    {
      "controlId": "string",
      "controlTitle": "string",
      "currentStatus": "not_implemented|partially_implemented|implemented|fully_compliant",
      "riskLevel": "low|medium|high|critical",
      "gapDescription": "string",
      "businessImpact": "string",
      "evidenceRequired": "string",
      "complianceScore": number (0-100),
      "priority": number (1-5),
      "estimatedEffort": "low|medium|high"
    }
  ]
}

Focus on:
1. Current state assessment based on typical ${companyProfile.industry} implementations
2. Specific gaps that need immediate attention
3. Risk-based prioritization
4. Business impact analysis
5. Realistic effort estimation

Analyze at least 15-20 key controls from the framework, focusing on the most critical ones for this industry and company size.
`;
  }

  private async parseAIAnalysisResults(
    aiContent: string,
    framework: ComplianceFrameworkDefinition
  ): Promise<{ findings: GapAnalysisFinding[] }> {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const parsedResults = JSON.parse(jsonMatch[0]);
      
      // Map AI results to our schema format
      const findings: GapAnalysisFinding[] = parsedResults.findings.map((finding: any) => ({
        id: '', // Will be set when saving to database
        reportId: '', // Will be set when saving to database
        controlId: finding.controlId,
        controlTitle: finding.controlTitle,
        currentStatus: finding.currentStatus,
        riskLevel: finding.riskLevel,
        gapDescription: finding.gapDescription,
        businessImpact: finding.businessImpact,
        evidenceRequired: finding.evidenceRequired || 'Documentation and evidence of implementation',
        complianceScore: Math.max(0, Math.min(100, finding.complianceScore)),
        priority: Math.max(1, Math.min(5, finding.priority)),
        estimatedEffort: finding.estimatedEffort,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      return { findings };
    } catch (error) {
      logger.error('Error parsing AI analysis results', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw new Error('Failed to parse gap analysis results');
    }
  }

  private calculateComplianceScore(findings: GapAnalysisFinding[]): number {
    if (findings.length === 0) return 0;
    
    const totalScore = findings.reduce((sum, finding) => sum + finding.complianceScore, 0);
    return Math.round(totalScore / findings.length);
  }

  private async generateRemediationRecommendations(
    findings: GapAnalysisFinding[],
    companyProfile: CompanyProfile,
    framework: string
  ): Promise<RemediationRecommendation[]> {
    const recommendations: RemediationRecommendation[] = [];

    // Focus on high-priority and critical findings
    const priorityFindings = findings.filter(f => 
      f.riskLevel === 'critical' || f.riskLevel === 'high' || f.priority >= 4
    );

    for (const finding of priorityFindings) {
      const remediationPrompt = `
Generate specific, actionable remediation recommendations for this compliance gap:

Control: ${finding.controlTitle} (${finding.controlId})
Current Status: ${finding.currentStatus}
Risk Level: ${finding.riskLevel}
Gap Description: ${finding.gapDescription}

Company Context:
- Industry: ${companyProfile.industry}
- Size: ${companyProfile.employeeCount} employees
- Technology: ${companyProfile.technologyStack?.join(', ') || 'Not specified'}

Provide 2-3 specific remediation recommendations in JSON format:
{
  "recommendations": [
    {
      "title": "string",
      "description": "string",
      "implementation": "string",
      "resources": {
        "templates": ["string"],
        "tools": ["string"],
        "references": ["string"]
      },
      "timeframe": "immediate|short_term|medium_term|long_term",
      "cost": "low|medium|high",
      "priority": number (1-5)
    }
  ]
}
`;

      try {
        const aiResponse = await aiOrchestrator.generateContent({
          prompt: remediationPrompt,
          model: 'gpt-4o',
          temperature: 0.4,
          maxTokens: 1500
        });

        const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedRecommendations = JSON.parse(jsonMatch[0]);
          
          for (const rec of parsedRecommendations.recommendations) {
            recommendations.push({
              id: '',
              findingId: finding.id,
              title: rec.title,
              description: rec.description,
              implementation: rec.implementation,
              resources: rec.resources,
              timeframe: rec.timeframe,
              cost: rec.cost,
              priority: rec.priority,
              status: 'pending',
              assignedTo: null,
              dueDate: null,
              completedDate: null,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      } catch (error) {
        logger.warn('Failed to generate remediation for finding', { 
          controlId: finding.controlId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return recommendations;
  }

  private async assessComplianceMaturity(
    organizationId: string,
    companyProfile: CompanyProfile,
    findings: GapAnalysisFinding[],
    framework: string
  ): Promise<ComplianceMaturityAssessment> {
    // Calculate maturity based on implementation levels
    const implementationLevels = findings.map(f => {
      switch (f.currentStatus) {
        case 'fully_compliant': return 5;
        case 'implemented': return 4;
        case 'partially_implemented': return 2;
        case 'not_implemented': return 1;
        default: return 1;
      }
    });

    const averageMaturity = implementationLevels.reduce((sum, level) => sum + level, 0) / implementationLevels.length;
    const maturityLevel = Math.round(averageMaturity);

    const maturityLabels = ['', 'Initial', 'Developing', 'Defined', 'Managed', 'Optimizing'];
    
    return {
      id: '',
      organizationId,
      framework: framework as any,
      maturityLevel,
      assessmentData: {
        maturityLabel: maturityLabels[maturityLevel],
        averageScore: Math.round(averageMaturity * 20), // Convert to 0-100 scale
        controlsAssessed: findings.length,
        implementationBreakdown: {
          notImplemented: findings.filter(f => f.currentStatus === 'not_implemented').length,
          partiallyImplemented: findings.filter(f => f.currentStatus === 'partially_implemented').length,
          implemented: findings.filter(f => f.currentStatus === 'implemented').length,
          fullyCompliant: findings.filter(f => f.currentStatus === 'fully_compliant').length
        }
      },
      recommendations: {
        nextSteps: [
          'Focus on critical and high-risk findings first',
          'Establish formal documentation processes',
          'Implement regular review and monitoring procedures',
          'Consider engaging external compliance consultants for complex requirements'
        ],
        improvementAreas: findings
          .filter(f => f.riskLevel === 'critical' || f.riskLevel === 'high')
          .map(f => f.controlTitle)
          .slice(0, 5)
      },
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private generateExecutiveSummary(
    findings: GapAnalysisFinding[],
    recommendations: RemediationRecommendation[],
    overallScore: number
  ) {
    const criticalGaps = findings.filter(f => f.riskLevel === 'critical').length;
    const highPriorityActions = recommendations.filter(r => r.priority >= 4).length;
    
    // Estimate remediation time based on effort levels
    const effortCounts = {
      low: recommendations.filter(r => r.timeframe === 'immediate' || r.timeframe === 'short_term').length,
      medium: recommendations.filter(r => r.timeframe === 'medium_term').length,
      high: recommendations.filter(r => r.timeframe === 'long_term').length
    };

    let estimatedTime = '3-6 months';
    if (effortCounts.high > 5) estimatedTime = '9-12 months';
    else if (effortCounts.medium > 10) estimatedTime = '6-9 months';

    const topRisks = findings
      .filter(f => f.riskLevel === 'critical' || f.riskLevel === 'high')
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5)
      .map(f => f.controlTitle);

    return {
      overallScore,
      criticalGaps,
      highPriorityActions,
      estimatedRemediationTime: estimatedTime,
      topRisks
    };
  }
}

export const complianceGapAnalysisService = new ComplianceGapAnalysisService();
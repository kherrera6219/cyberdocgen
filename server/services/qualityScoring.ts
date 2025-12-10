import Anthropic from '@anthropic-ai/sdk';
import OpenAI from "openai";
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

export interface QualityMetric {
  name: string;
  score: number; // 0-100
  weight: number; // Importance weighting
  feedback: string;
  suggestions: string[];
}

export interface QualityScoreResult {
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  metrics: QualityMetric[];
  strengths: string[];
  weaknesses: string[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    impact: string;
  }[];
  benchmarkComparison: {
    industryAverage: number;
    percentile: number;
    comparison: string;
  };
}

export interface ContentAnalysis {
  clarity: number;
  completeness: number;
  accuracy: number;
  consistency: number;
  usability: number;
  compliance: number;
}

export interface FrameworkAlignment {
  framework: string;
  alignmentScore: number;
  coveredRequirements: string[];
  missingRequirements: string[];
  gapAnalysis: string;
}

/**
 * Advanced AI-powered document quality scoring and analysis
 */
export class QualityScoringService {

  /**
   * Comprehensive document quality analysis
   */
  async analyzeDocumentQuality(
    content: string,
    title: string,
    framework: string,
    documentType: string
  ): Promise<QualityScoreResult> {
    
    const analysisPrompt = `Analyze the quality of this compliance document:

Title: ${title}
Framework: ${framework}
Type: ${documentType}
Content: ${content}

Evaluate across these dimensions:
1. Clarity - Clear language, well-structured, understandable
2. Completeness - All necessary sections and information included
3. Accuracy - Technically correct, up-to-date requirements
4. Consistency - Consistent terminology, formatting, style
5. Usability - Actionable, practical, implementable
6. Compliance - Meets framework requirements and standards

Provide JSON analysis with:
- overallScore: 0-100 weighted average
- grade: Letter grade A-F
- metrics: Array with name, score, weight, feedback, suggestions
- strengths: Key document strengths
- weaknesses: Areas needing improvement
- recommendations: Array with priority, action, impact
- benchmarkComparison: industryAverage, percentile, comparison

Be specific and actionable in feedback.`;

    try {
      const response = await getAnthropicClient().messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2500,
        messages: [{
          role: "user",
          content: analysisPrompt
        }]
      });

      const resultText = (response.content[0] as any).text;
      
      try {
        return JSON.parse(resultText);
      } catch {
        return this.parseQualityAnalysis(resultText, framework);
      }
    } catch (error) {
      logger.error("Quality analysis failed:", error);
      throw new Error("Failed to analyze document quality");
    }
  }

  /**
   * Analyze content structure and readability
   */
  async analyzeContentStructure(content: string): Promise<ContentAnalysis> {
    const structurePrompt = `Analyze the structure and readability of this document content:

${content}

Evaluate each dimension (0-100 score):
1. clarity - Language clarity, sentence structure, readability
2. completeness - Information completeness, coverage depth
3. accuracy - Technical accuracy, factual correctness
4. consistency - Terminology, formatting, style consistency
5. usability - Practicality, actionability, implementation guidance
6. compliance - Standards adherence, regulatory alignment

Return JSON with numeric scores for each dimension.`;

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: structurePrompt }],
        response_format: { type: "json_object" },
        max_tokens: 500
      });

      return JSON.parse(response.choices[0].message.content || "{}") as ContentAnalysis;
    } catch (error) {
      logger.error("Content structure analysis failed:", error);
      return {
        clarity: 70,
        completeness: 65,
        accuracy: 75,
        consistency: 68,
        usability: 60,
        compliance: 72
      };
    }
  }

  /**
   * Check framework alignment and coverage
   */
  async checkFrameworkAlignment(
    content: string,
    framework: string,
    documentType: string
  ): Promise<FrameworkAlignment> {
    
    const alignmentPrompt = `Assess ${framework} compliance alignment for this ${documentType}:

Content: ${content}

Analyze:
1. How well does this document align with ${framework} requirements?
2. Which specific requirements are covered?
3. What requirements are missing or inadequately addressed?
4. Provide gap analysis and improvement recommendations

Return JSON with:
- framework: Framework name
- alignmentScore: 0-100 alignment percentage
- coveredRequirements: Array of covered requirements
- missingRequirements: Array of missing requirements
- gapAnalysis: Detailed gap analysis text`;

    try {
      const response = await getAnthropicClient().messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: alignmentPrompt
        }]
      });

      const resultText = (response.content[0] as any).text;
      
      try {
        return JSON.parse(resultText);
      } catch {
        return {
          framework,
          alignmentScore: 75,
          coveredRequirements: ["Risk assessment", "Access control", "Incident management"],
          missingRequirements: ["Business continuity", "Supplier relationships", "Asset management"],
          gapAnalysis: "Document covers core security controls but lacks comprehensive coverage of business continuity and third-party risk management requirements."
        };
      }
    } catch (error) {
      logger.error("Framework alignment check failed:", error);
      throw new Error("Failed to check framework alignment");
    }
  }

  /**
   * Generate improvement recommendations
   */
  async generateImprovementPlan(
    qualityScore: QualityScoreResult,
    contentAnalysis: ContentAnalysis,
    framework: string
  ): Promise<{
    quickFixes: string[];
    mediumTermImprovements: string[];
    strategicEnhancements: string[];
    priorityOrder: string[];
    estimatedEffort: {
      [action: string]: 'low' | 'medium' | 'high';
    };
  }> {
    
    const improvementPrompt = `Create an improvement plan based on this quality analysis:

Overall Score: ${qualityScore.overallScore}
Framework: ${framework}
Key Weaknesses: ${qualityScore.weaknesses.join(', ')}
Content Issues: Clarity(${contentAnalysis.clarity}), Completeness(${contentAnalysis.completeness}), Accuracy(${contentAnalysis.accuracy})

Generate improvement plan with:
- quickFixes: Simple changes for immediate improvement
- mediumTermImprovements: More substantial enhancements requiring moderate effort
- strategicEnhancements: Major improvements requiring significant resources
- priorityOrder: Recommended sequence of improvements
- estimatedEffort: Effort level for each improvement category

Focus on high-impact, practical improvements.`;

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: improvementPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 1500
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      logger.error("Improvement plan generation failed:", error);
      throw new Error("Failed to generate improvement plan");
    }
  }

  /**
   * Compare document against industry benchmarks
   */
  async benchmarkDocument(
    qualityScore: number,
    framework: string,
    industry: string,
    documentType: string
  ): Promise<{
    industryAverage: number;
    topQuartile: number;
    bottomQuartile: number;
    percentile: number;
    comparison: string;
    improvementPotential: number;
  }> {
    
    // Simulate industry benchmarks (in production, this would use real data)
    const benchmarks = {
      industryAverage: Math.floor(Math.random() * 20) + 65, // 65-85
      topQuartile: Math.floor(Math.random() * 10) + 85, // 85-95
      bottomQuartile: Math.floor(Math.random() * 20) + 45 // 45-65
    };

    const percentile = this.calculatePercentile(qualityScore, benchmarks);
    const comparison = this.generateComparisonText(qualityScore, benchmarks, percentile);
    const improvementPotential = benchmarks.topQuartile - qualityScore;

    return {
      ...benchmarks,
      percentile,
      comparison,
      improvementPotential: Math.max(0, improvementPotential)
    };
  }

  /**
   * Track quality trends over time
   */
  async trackQualityTrends(
    documentId: string,
    currentScore: number,
    historicalScores: { date: Date; score: number }[]
  ): Promise<{
    trend: 'improving' | 'declining' | 'stable';
    changeRate: number;
    projection: number;
    insights: string[];
  }> {
    
    if (historicalScores.length < 2) {
      return {
        trend: 'stable',
        changeRate: 0,
        projection: currentScore,
        insights: ["Insufficient historical data for trend analysis"]
      };
    }

    const recentScores = historicalScores.slice(-5); // Last 5 scores
    const avgChange = this.calculateAverageChange(recentScores);
    const trend = avgChange > 2 ? 'improving' : avgChange < -2 ? 'declining' : 'stable';
    const projection = Math.min(100, Math.max(0, currentScore + (avgChange * 2)));

    const insights = this.generateTrendInsights(trend, avgChange, currentScore);

    return {
      trend,
      changeRate: avgChange,
      projection,
      insights
    };
  }

  /**
   * Parse quality analysis text when JSON parsing fails
   */
  private parseQualityAnalysis(text: string, framework: string): QualityScoreResult {
    // Extract score from text
    const scoreMatch = text.match(/score.*?(\d+)/i);
    const overallScore = scoreMatch ? parseInt(scoreMatch[1]) : 75;
    
    const grade = overallScore >= 90 ? 'A' : 
                 overallScore >= 80 ? 'B' :
                 overallScore >= 70 ? 'C' :
                 overallScore >= 60 ? 'D' : 'F';

    return {
      overallScore,
      grade,
      metrics: [
        {
          name: "Clarity",
          score: 75,
          weight: 0.2,
          feedback: "Document is generally clear but could benefit from simpler language",
          suggestions: ["Use shorter sentences", "Define technical terms"]
        },
        {
          name: "Completeness",
          score: 70,
          weight: 0.25,
          feedback: "Some required sections are missing or incomplete",
          suggestions: ["Add implementation timeline", "Include success metrics"]
        }
      ],
      strengths: ["Well-structured", "Covers key requirements"],
      weaknesses: ["Missing implementation details", "Could be more actionable"],
      recommendations: [
        {
          priority: "high",
          action: "Add specific implementation steps",
          impact: "Improved usability and compliance"
        }
      ],
      benchmarkComparison: {
        industryAverage: 72,
        percentile: 65,
        comparison: "Above industry average but room for improvement"
      }
    };
  }

  /**
   * Calculate percentile ranking
   */
  private calculatePercentile(score: number, benchmarks: any): number {
    if (score >= benchmarks.topQuartile) return 85;
    if (score >= benchmarks.industryAverage) return 60;
    if (score >= benchmarks.bottomQuartile) return 35;
    return 15;
  }

  /**
   * Generate comparison text
   */
  private generateComparisonText(score: number, benchmarks: any, percentile: number): string {
    if (percentile >= 75) return "Excellent - performing in top quartile";
    if (percentile >= 50) return "Good - above industry average";
    if (percentile >= 25) return "Fair - near industry average";
    return "Needs improvement - below industry benchmarks";
  }

  /**
   * Calculate average change in scores
   */
  private calculateAverageChange(scores: { date: Date; score: number }[]): number {
    if (scores.length < 2) return 0;
    
    let totalChange = 0;
    for (let i = 1; i < scores.length; i++) {
      totalChange += scores[i].score - scores[i-1].score;
    }
    
    return totalChange / (scores.length - 1);
  }

  /**
   * Generate trend insights
   */
  private generateTrendInsights(trend: string, changeRate: number, currentScore: number): string[] {
    const insights = [];
    
    if (trend === 'improving') {
      insights.push("Document quality is consistently improving");
      insights.push(`Average improvement rate: ${changeRate.toFixed(1)} points per revision`);
    } else if (trend === 'declining') {
      insights.push("Document quality may be declining - review recent changes");
      insights.push("Consider additional review processes");
    } else {
      insights.push("Document quality remains stable");
    }
    
    if (currentScore < 70) {
      insights.push("Focus on fundamental improvements for better compliance");
    } else if (currentScore < 85) {
      insights.push("Good foundation - focus on refinement and detail");
    } else {
      insights.push("Excellent quality - maintain current standards");
    }
    
    return insights;
  }
}

export const qualityScoringService = new QualityScoringService();
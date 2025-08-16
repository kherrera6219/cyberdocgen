// @ts-nocheck
import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { type CompanyProfile } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface DocumentAnalysisResult {
  summary: string;
  keyFindings: string[];
  complianceGaps: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  extractedData: {
    companyInfo?: Partial<CompanyProfile>;
    policies?: string[];
    controls?: string[];
    procedures?: string[];
  };
}

export interface RAGContext {
  documentId: string;
  content: string;
  metadata: {
    type: string;
    framework?: string;
    uploadDate: string;
    filename: string;
  };
}

/**
 * Advanced document analysis using multi-model AI
 */
export class DocumentAnalysisService {
  
  /**
   * Analyze uploaded document for compliance information
   */
  async analyzeDocument(
    content: string,
    filename: string,
    framework?: string
  ): Promise<DocumentAnalysisResult> {
    const analysisPrompt = `Analyze this compliance document and extract key information:

Document: ${filename}
Framework Context: ${framework || 'General compliance'}
Content: ${content}

Provide analysis in JSON format with:
1. summary - Brief overview of document purpose and scope
2. keyFindings - Important policies, controls, or procedures identified
3. complianceGaps - Areas where compliance may be insufficient
4. recommendations - Specific actionable improvements
5. riskLevel - Overall risk assessment (low/medium/high/critical)
6. extractedData - Structured data including:
   - companyInfo (name, industry, size if mentioned)
   - policies (list of identified policies)
   - controls (security controls mentioned)
   - procedures (operational procedures)

Focus on cybersecurity, data protection, and compliance aspects.`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: analysisPrompt
        }]
      });

      const analysisText = (response.content[0] as any).text;
      
      // Parse JSON response or create structured response
      try {
        return JSON.parse(analysisText);
      } catch {
        // Fallback parsing if JSON is malformed
        return this.parseAnalysisText(analysisText, filename);
      }
    } catch (error) {
      logger.error("Document analysis failed:", error);
      throw new Error("Failed to analyze document");
    }
  }

  /**
   * Extract company profile information from documents
   */
  async extractCompanyProfile(content: string): Promise<Partial<CompanyProfile>> {
    const extractionPrompt = `Extract company profile information from this document:

${content}

Return JSON with these fields (only include if explicitly mentioned):
- companyName
- industry  
- companySize
- headquarters
- cloudInfrastructure (array)
- dataClassification
- businessApplications
- complianceFrameworks (array)

Only include fields with actual values found in the document.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: extractionPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      logger.error("Company profile extraction failed:", error);
      return {};
    }
  }

  /**
   * Generate embeddings for document content for RAG
   */
  async generateEmbeddings(content: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: content,
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error("Embedding generation failed:", error);
      throw new Error("Failed to generate embeddings");
    }
  }

  /**
   * Search similar documents using RAG
   */
  async searchSimilarContent(
    query: string,
    ragContexts: RAGContext[],
    topK: number = 5
  ): Promise<RAGContext[]> {
    // Generate query embedding
    const queryEmbedding = await this.generateEmbeddings(query);
    
    // In a production system, this would use a vector database
    // For now, we'll use a simple text similarity approach
    const similarities = ragContexts.map(context => ({
      context,
      score: this.calculateTextSimilarity(query, context.content)
    }));

    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.context);
  }

  /**
   * Generate insights from multiple documents using RAG
   */
  async generateRAGInsights(
    query: string,
    relevantDocs: RAGContext[],
    framework: string
  ): Promise<string> {
    const contextText = relevantDocs
      .map(doc => `Document: ${doc.metadata.filename}\n${doc.content}`)
      .join('\n\n---\n\n');

    const ragPrompt = `Based on the following documents, answer this query about ${framework} compliance:

Query: ${query}

Relevant Documents:
${contextText}

Provide a comprehensive answer that:
1. References specific documents where appropriate
2. Identifies compliance requirements and gaps
3. Suggests practical implementation steps
4. Highlights any conflicting information between documents

Keep the response focused and actionable.`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: ragPrompt
        }]
      });

      return (response.content[0] as any).text;
    } catch (error) {
      logger.error("RAG insights generation failed:", error);
      throw new Error("Failed to generate insights");
    }
  }

  /**
   * Fallback text parsing for analysis results
   */
  private parseAnalysisText(text: string, filename: string): DocumentAnalysisResult {
    return {
      summary: `Analysis of ${filename}`,
      keyFindings: this.extractBulletPoints(text, 'findings'),
      complianceGaps: this.extractBulletPoints(text, 'gaps'),
      recommendations: this.extractBulletPoints(text, 'recommendations'),
      riskLevel: this.extractRiskLevel(text),
      extractedData: {
        companyInfo: {},
        policies: [],
        controls: [],
        procedures: []
      }
    };
  }

  /**
   * Simple text similarity calculation
   */
  private calculateTextSimilarity(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    
    const intersection = queryWords.filter(word => contentWords.includes(word));
    return intersection.length / Math.max(queryWords.length, contentWords.length);
  }

  /**
   * Extract bullet points from text
   */
  private extractBulletPoints(text: string, section: string): string[] {
    const lines = text.split('\n');
    const sectionStart = lines.findIndex(line => 
      line.toLowerCase().includes(section)
    );
    
    if (sectionStart === -1) return [];
    
    const bullets = [];
    for (let i = sectionStart + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
        bullets.push(line.substring(1).trim());
      } else if (line === '' || bullets.length > 0) {
        continue;
      } else {
        break;
      }
    }
    
    return bullets;
  }

  /**
   * Extract risk level from text
   */
  private extractRiskLevel(text: string): 'low' | 'medium' | 'high' | 'critical' {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('critical')) return 'critical';
    if (lowerText.includes('high')) return 'high';
    if (lowerText.includes('medium')) return 'medium';
    return 'low';
  }
}

export const documentAnalysisService = new DocumentAnalysisService();
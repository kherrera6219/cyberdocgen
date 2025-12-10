import { logger } from "../utils/logger";
import { aiOrchestrator } from "./aiOrchestrator";

export interface ExtractedCompanyData {
  companyName?: string;
  industry?: string;
  headquarters?: string;
  websiteUrl?: string;
  organizationStructure?: {
    legalEntityType?: string;
    totalEmployees?: number;
    departments?: { name: string; head?: string; }[];
  };
  keyPersonnel?: {
    ceo?: { name: string; email?: string; };
    cfo?: { name: string; email?: string; };
    cto?: { name: string; email?: string; };
    ciso?: { name: string; email?: string; };
    [key: string]: any;
  };
  productsAndServices?: {
    primaryProducts?: { name: string; description?: string; }[];
    primaryServices?: { name: string; description?: string; }[];
    customerSegments?: string[];
  };
  geographicOperations?: {
    countriesOfOperation?: string[];
    officeLocations?: { address: string; type: string; }[];
  };
  securityInfrastructure?: {
    firewallVendor?: string;
    siemSolution?: string;
    identityProvider?: string;
  };
  contactInfo?: {
    primaryContact?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  confidence: number;
  source: 'document' | 'website' | 'research';
  extractedAt: string;
}

export interface DocumentExtractionRequest {
  documentContent: string;
  documentType: 'incorporation' | 'registration' | 'profile' | 'org_chart' | 'policy';
  filename: string;
}

export interface WebsiteExtractionRequest {
  url: string;
  htmlContent?: string;
}

export interface ResearchRequest {
  companyName: string;
  industry?: string;
  headquarters?: string;
}

class CompanyDataExtractionService {
  async extractFromDocument(request: DocumentExtractionRequest): Promise<ExtractedCompanyData> {
    const { documentContent, documentType, filename } = request;
    
    const prompt = `You are an expert at extracting structured company information from documents.
    
Document Type: ${documentType}
Filename: ${filename}

Extract the following information if present:
- Company name
- Industry/sector
- Headquarters location
- Legal entity type
- Key personnel (CEO, CFO, CTO, CISO, etc. with names and emails if available)
- Department structure
- Total employees
- Products and services
- Geographic operations (countries, offices)
- Contact information

Document Content:
${documentContent.substring(0, 15000)}

Respond with a JSON object containing the extracted data. Use null for fields not found.
Only include fields where data was actually found in the document.

JSON Response:`;

    try {
      const response = await aiOrchestrator.generateContent({
        prompt,
        model: 'gpt-4.1',
        temperature: 0.2,
        maxTokens: 2000,
      });

      if (response.content) {
        const cleanedContent = response.content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        
        const parsed = JSON.parse(cleanedContent);
        
        return {
          ...parsed,
          confidence: 0.8,
          source: 'document',
          extractedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      logger.error('Document extraction failed:', error);
    }

    return {
      confidence: 0,
      source: 'document',
      extractedAt: new Date().toISOString(),
    };
  }

  async extractFromWebsite(request: WebsiteExtractionRequest): Promise<ExtractedCompanyData> {
    const { url, htmlContent } = request;
    
    let contentToAnalyze = htmlContent;
    
    if (!contentToAnalyze) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ComplianceBot/1.0)',
          },
        });
        contentToAnalyze = await response.text();
      } catch (error) {
        logger.error('Failed to fetch website content:', error);
        return {
          confidence: 0,
          source: 'website',
          extractedAt: new Date().toISOString(),
        };
      }
    }

    const textContent = this.extractTextFromHtml(contentToAnalyze);

    const prompt = `You are an expert at extracting company information from website content.

Website URL: ${url}

Extract the following information if present:
- Company name
- Industry/sector
- Headquarters location
- Key personnel (executives, leadership team)
- Products and services offered
- Customer segments (B2B, B2C, Government, Enterprise, SMB)
- Geographic operations (countries, offices)
- Contact information
- Any security or compliance certifications mentioned

Website Content:
${textContent.substring(0, 20000)}

Respond with a JSON object containing the extracted data. Use null for fields not found.
Only include fields where data was actually found on the website.

JSON Response:`;

    try {
      const response = await aiOrchestrator.generateContent({
        prompt,
        model: 'gpt-4.1',
        temperature: 0.2,
        maxTokens: 2000,
      });

      if (response.content) {
        const cleanedContent = response.content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        
        const parsed = JSON.parse(cleanedContent);
        
        return {
          ...parsed,
          websiteUrl: url,
          confidence: 0.7,
          source: 'website',
          extractedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      logger.error('Website extraction failed:', error);
    }

    return {
      websiteUrl: url,
      confidence: 0,
      source: 'website',
      extractedAt: new Date().toISOString(),
    };
  }

  async researchCompany(request: ResearchRequest): Promise<ExtractedCompanyData> {
    const { companyName, industry, headquarters } = request;

    const prompt = `You are a business intelligence expert. Based on your knowledge, provide information about this company.

Company Name: ${companyName}
${industry ? `Industry: ${industry}` : ''}
${headquarters ? `Known Location: ${headquarters}` : ''}

Provide the following information based on what you know about this company:
- Full company name and any parent/subsidiary relationships
- Industry classification
- Headquarters and key office locations
- Known leadership/executives (CEO, CTO, CISO if public company or well-known)
- Main products and services
- Customer segments
- Geographic operations
- Any known compliance certifications (SOC 2, ISO 27001, FedRAMP, etc.)
- Company size estimate if known

IMPORTANT: Only provide information you are confident about. Mark uncertain information as such.
If this is a small/unknown company, acknowledge that and provide minimal data.

Respond with a JSON object containing the data. Include a "dataQuality" field indicating:
- "high" for well-known public companies with verified information
- "medium" for known companies with some public information  
- "low" for less known companies where data may be limited
- "unknown" if you have no reliable information about this company

JSON Response:`;

    try {
      const response = await aiOrchestrator.generateContent({
        prompt,
        model: 'gpt-4.1',
        temperature: 0.3,
        maxTokens: 2000,
      });

      if (response.content) {
        const cleanedContent = response.content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        
        const parsed = JSON.parse(cleanedContent);
        const dataQuality = parsed.dataQuality || 'unknown';
        
        const confidenceMap: Record<string, number> = {
          'high': 0.9,
          'medium': 0.6,
          'low': 0.4,
          'unknown': 0.2,
        };

        return {
          ...parsed,
          confidence: confidenceMap[dataQuality] || 0.3,
          source: 'research',
          extractedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      logger.error('Company research failed:', error);
    }

    return {
      companyName,
      confidence: 0,
      source: 'research',
      extractedAt: new Date().toISOString(),
    };
  }

  mergeExtractedData(
    existing: Partial<ExtractedCompanyData>,
    newData: ExtractedCompanyData
  ): ExtractedCompanyData {
    const merged: ExtractedCompanyData = {
      ...existing,
      confidence: Math.max(existing.confidence || 0, newData.confidence),
      source: newData.source,
      extractedAt: newData.extractedAt,
    };

    for (const [key, value] of Object.entries(newData)) {
      if (value !== null && value !== undefined) {
        const existingValue = (existing as any)[key];
        
        if (!existingValue) {
          (merged as any)[key] = value;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          (merged as any)[key] = { ...existingValue, ...value };
        } else if (Array.isArray(value) && Array.isArray(existingValue)) {
          const uniqueItems = new Map();
          [...existingValue, ...value].forEach(item => {
            const key = typeof item === 'object' ? JSON.stringify(item) : item;
            uniqueItems.set(key, item);
          });
          (merged as any)[key] = Array.from(uniqueItems.values());
        }
      }
    }

    return merged;
  }

  private extractTextFromHtml(html: string): string {
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    
    return text;
  }
}

export const companyDataExtractionService = new CompanyDataExtractionService();

import OpenAI from "openai";
import { logger } from "../utils/logger";
import { type CompanyProfile } from "@shared/schema";
import { getOpenAIClient } from "./aiClients";
import { AllDocumentTemplates, type DocumentTemplate } from "./documentTemplates";

// Re-export DocumentTemplate type for backward compatibility
export type { DocumentTemplate };

// Re-export frameworkTemplates from centralized documentTemplates service
export const frameworkTemplates = AllDocumentTemplates;

export async function generateDocument(
  template: DocumentTemplate,
  companyProfile: CompanyProfile,
  framework: string
): Promise<string> {
  const systemPrompt = `You are a cybersecurity compliance expert specializing in ${framework}. Generate comprehensive, professional compliance documentation that meets industry standards and regulatory requirements.

The document should be:
- Detailed and actionable
- Specific to the company's profile and industry
- Compliant with ${framework} standards
- Professional in tone and structure
- Include specific implementation guidance
- Contain measurable objectives and controls

Company Profile Context:
- Company: ${companyProfile.companyName}
- Industry: ${companyProfile.industry}
- Size: ${companyProfile.companySize}
- Location: ${companyProfile.headquarters}
- Cloud Infrastructure: ${companyProfile.cloudInfrastructure.join(', ')}
- Data Classification: ${companyProfile.dataClassification}
- Business Applications: ${companyProfile.businessApplications}

Document Requirements:
- Title: ${template.title}
- Category: ${template.category}
- Framework: ${framework}

Generate a complete, professional document with sections including:
1. Purpose and Scope
2. Policy/Procedure Statement
3. Roles and Responsibilities
4. Implementation Guidelines
5. Compliance Requirements
6. Review and Update Procedures
7. Related Documents/References

Format the response as a structured document with clear headings and detailed content.`;

  const userPrompt = `Generate a comprehensive ${template.title} document for ${companyProfile.companyName}. 

This document should be tailored specifically for:
- A ${companyProfile.companySize} ${companyProfile.industry} company
- Using ${companyProfile.cloudInfrastructure.join(' and ')} infrastructure
- Handling ${companyProfile.dataClassification} data
- With the following business applications: ${companyProfile.businessApplications}

The document must comply with ${framework} standards and include specific, actionable guidance that ${companyProfile.companyName} can implement immediately.

Make the document practical and implementable, with specific controls, procedures, and measurable objectives that align with ${framework} requirements.`;

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-5.1",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 4000,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    logger.error("Error generating document:", error);
    throw new Error(`Failed to generate document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateComplianceDocuments(
  companyProfile: CompanyProfile,
  framework: string,
  onProgress?: (progress: number, current: string) => void
): Promise<string[]> {
  const templates = frameworkTemplates[framework];
  if (!templates) {
    throw new Error(`No templates found for framework: ${framework}`);
  }

  const documents: string[] = [];
  const total = templates.length;

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const progress = Math.round(((i + 1) / total) * 100);
    
    if (onProgress) {
      onProgress(progress, template.title);
    }

    try {
      const content = await generateDocument(template, companyProfile, framework);
      documents.push(content);
      
      // Add small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error(`Error generating ${template.title}:`, error);
      // Continue with other documents even if one fails
      documents.push(`Error generating ${template.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return documents;
}

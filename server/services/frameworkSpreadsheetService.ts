import { type CompanyProfile } from "@shared/schema";
import { ISO27001Templates, AdditionalISO27001Templates, type DocumentTemplate } from "./documentTemplates";
import { aiOrchestrator } from "./aiOrchestrator";
import { logger } from "../utils/logger";

export interface SpreadsheetField {
  id: string;
  fieldName: string;
  variableKey: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  currentValue: string;
  status: 'empty' | 'mapped' | 'ai_filled' | 'manual';
  required: boolean;
  options?: string[];
  templateId: string;
  templateTitle: string;
}

export interface SpreadsheetTemplate {
  templateId: string;
  templateTitle: string;
  templateDescription: string;
  category: string;
  fields: SpreadsheetField[];
}

export interface AutofillResult {
  fieldId: string;
  value: string;
  confidence: number;
  source: 'company_profile' | 'ai_generated';
}

const FRAMEWORK_TEMPLATES: Record<string, DocumentTemplate[]> = {
  'ISO27001': [...ISO27001Templates, ...AdditionalISO27001Templates],
};

/**
 * Maps company profile data to template variables
 */
function mapCompanyProfileToVariables(companyProfile: CompanyProfile): Record<string, string> {
  const keyPersonnel = companyProfile.keyPersonnel as {
    ceo?: { name: string; email?: string };
    ciso?: { name: string; email?: string };
    securityOfficer?: { name: string; email?: string };
    complianceOfficer?: { name: string; email?: string };
    itManager?: { name: string; email?: string };
    legalCounsel?: { name: string; email?: string };
  } | null;

  const contactInfo = companyProfile.contactInfo as {
    primaryContact?: string;
    email?: string;
    phone?: string;
    address?: string;
  } | null;

  return {
    company_name: companyProfile.companyName || '',
    industry: companyProfile.industry || '',
    company_size: companyProfile.companySize || '',
    headquarters: companyProfile.headquarters || '',
    data_classification: companyProfile.dataClassification || '',
    business_applications: companyProfile.businessApplications || '',
    cloud_infrastructure: Array.isArray(companyProfile.cloudInfrastructure) 
      ? companyProfile.cloudInfrastructure.join(', ') 
      : '',
    compliance_frameworks: Array.isArray(companyProfile.complianceFrameworks)
      ? companyProfile.complianceFrameworks.join(', ')
      : '',
    primary_contact: contactInfo?.primaryContact || '',
    contact_email: contactInfo?.email || '',
    contact_phone: contactInfo?.phone || '',
    contact_address: contactInfo?.address || '',
    ceo_name: keyPersonnel?.ceo?.name || '',
    ciso_name: keyPersonnel?.ciso?.name || '',
    security_officer: keyPersonnel?.securityOfficer?.name || '',
    compliance_officer: keyPersonnel?.complianceOfficer?.name || '',
    it_manager: keyPersonnel?.itManager?.name || '',
    legal_counsel: keyPersonnel?.legalCounsel?.name || '',
    approved_by: keyPersonnel?.ciso?.name || keyPersonnel?.ceo?.name || '',
    document_owner: keyPersonnel?.complianceOfficer?.name || keyPersonnel?.ciso?.name || '',
  };
}

/**
 * Converts template variables to spreadsheet fields
 */
function templateToSpreadsheetFields(
  template: DocumentTemplate,
  mappedValues: Record<string, string>
): SpreadsheetField[] {
  const fields: SpreadsheetField[] = [];

  for (const [key, variable] of Object.entries(template.templateVariables)) {
    const mappedValue = mappedValues[key] || '';
    
    fields.push({
      id: `${template.id}-${key}`,
      fieldName: variable.label,
      variableKey: key,
      label: variable.label,
      type: variable.type,
      currentValue: mappedValue,
      status: mappedValue ? 'mapped' : 'empty',
      required: variable.required,
      options: variable.options,
      templateId: template.id,
      templateTitle: template.title,
    });
  }

  return fields;
}

class FrameworkSpreadsheetService {
  /**
   * Get all spreadsheet templates for a framework with company data pre-filled
   */
  async getSpreadsheetTemplates(
    framework: string,
    companyProfile: CompanyProfile | null
  ): Promise<SpreadsheetTemplate[]> {
    const templates = FRAMEWORK_TEMPLATES[framework];
    
    if (!templates) {
      throw new Error(`No templates found for framework: ${framework}`);
    }

    const mappedValues = companyProfile 
      ? mapCompanyProfileToVariables(companyProfile) 
      : {};

    return templates.map(template => ({
      templateId: template.id,
      templateTitle: template.title,
      templateDescription: template.description,
      category: template.category,
      fields: templateToSpreadsheetFields(template, mappedValues),
    }));
  }

  /**
   * AI autofill for template fields that couldn't be mapped from company profile
   */
  async autofillTemplateFields(
    framework: string,
    templateId: string,
    emptyFields: Array<{ fieldId: string; variableKey: string; label: string; type: string }>,
    companyProfile: CompanyProfile
  ): Promise<AutofillResult[]> {
    const results: AutofillResult[] = [];
    
    if (emptyFields.length === 0) {
      return results;
    }

    const companyContext = `
Company: ${companyProfile.companyName}
Industry: ${companyProfile.industry}
Size: ${companyProfile.companySize}
Headquarters: ${companyProfile.headquarters}
Data Classification: ${companyProfile.dataClassification}
Business Applications: ${companyProfile.businessApplications}
Compliance Frameworks: ${Array.isArray(companyProfile.complianceFrameworks) ? companyProfile.complianceFrameworks.join(', ') : ''}
    `.trim();

    const fieldPrompts = emptyFields.map(f => `- ${f.label} (${f.variableKey}): ${f.type}`).join('\n');

    const prompt = `You are a compliance documentation expert. Based on the following company profile, generate appropriate values for these ${framework} compliance template fields.

${companyContext}

Fields to fill (generate realistic, professional values appropriate for this company):
${fieldPrompts}

Respond with a JSON array where each object has:
- fieldId: the field identifier
- value: the generated value (string)
- confidence: 0.0-1.0 indicating how confident you are in this value

Generate realistic values that would be typical for a company of this type and size. For date fields, use YYYY-MM-DD format. For select fields, pick the most appropriate option. Be concise but professional.

Respond ONLY with the JSON array, no additional text.`;

    try {
      const response = await aiOrchestrator.generateContent({
        prompt,
        model: 'gpt-4o',
        temperature: 0.3,
        maxTokens: 2000,
      });

      if (response.content) {
        const cleanedContent = response.content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        
        const parsed = JSON.parse(cleanedContent);
        
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const matchingField = emptyFields.find(f => 
              f.fieldId === item.fieldId || f.variableKey === item.fieldId
            );
            
            if (matchingField) {
              results.push({
                fieldId: matchingField.fieldId,
                value: String(item.value || ''),
                confidence: typeof item.confidence === 'number' ? item.confidence : 0.7,
                source: 'ai_generated',
              });
            }
          }
        }
      }
    } catch (error) {
      logger.error('AI autofill failed:', error);
      
      for (const field of emptyFields) {
        results.push({
          fieldId: field.fieldId,
          value: this.getDefaultValue(field.variableKey, field.type, companyProfile),
          confidence: 0.5,
          source: 'ai_generated',
        });
      }
    }

    return results;
  }

  /**
   * Get default values for common fields when AI fails
   */
  private getDefaultValue(
    variableKey: string,
    type: string,
    companyProfile: CompanyProfile
  ): string {
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    const defaults: Record<string, string> = {
      approval_date: today.toISOString().split('T')[0],
      next_review_date: nextYear.toISOString().split('T')[0],
      risk_scale_type: 'Qualitative (5x5 matrix)',
      risk_appetite: 'Moderate',
      risk_tolerance: 'Medium',
      likelihood_method: 'Historical data and expert judgment',
      primary_locations: companyProfile.headquarters || 'Corporate Headquarters',
      data_centers: 'Primary and Disaster Recovery sites',
      remote_locations: 'Remote workforce enabled',
      exclusions: 'No significant exclusions',
      legal_requirements: 'GDPR, CCPA, and applicable industry regulations',
    };

    if (type === 'date') {
      return today.toISOString().split('T')[0];
    }

    return defaults[variableKey] || '';
  }

  /**
   * Save edited template field values (stored in memory for now, could be persisted to DB)
   */
  private savedTemplateData: Map<string, Record<string, string>> = new Map();

  async saveTemplateData(
    framework: string,
    companyProfileId: string,
    fieldUpdates: Array<{ fieldId: string; value: string }>
  ): Promise<void> {
    const key = `${framework}-${companyProfileId}`;
    const existing = this.savedTemplateData.get(key) || {};
    
    for (const update of fieldUpdates) {
      existing[update.fieldId] = update.value;
    }
    
    this.savedTemplateData.set(key, existing);
    logger.info(`Saved ${fieldUpdates.length} template field updates for ${key}`);
  }

  async getSavedTemplateData(
    framework: string,
    companyProfileId: string
  ): Promise<Record<string, string>> {
    const key = `${framework}-${companyProfileId}`;
    return this.savedTemplateData.get(key) || {};
  }
}

export const frameworkSpreadsheetService = new FrameworkSpreadsheetService();

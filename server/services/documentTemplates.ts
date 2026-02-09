import { logger } from '../utils/logger';
import { z } from 'zod';
import {
  createDynamicVariableSchema,
  generateFromTemplateSchema,
  templateListQuerySchema,
  extractTemplateVariables,
  validateTemplateStructure,
  type TemplateGenerationResult,
  type SimpleTemplateVariableConfig
} from '../validation/templateSchemas';
import type { DocumentTemplate, TemplateVariable } from './types';

// Import Modularized Templates
import { ISO27001Templates, AdditionalISO27001Templates, ExtendedISO27001Templates } from './documentTemplates/iso27001';
import { SOC2Templates, AdditionalSOC2OperationalTemplates, ExtendedSOC2Templates } from './documentTemplates/soc2';
import { FedRAMPLowTemplates, FedRAMPModerateTemplates, FedRAMPHighTemplates, FedRAMPCoreTemplates, FedRAMPAttachmentTemplates } from './documentTemplates/fedramp';
import { NISTTemplates } from './documentTemplates/nist';
import { OperationalTemplates, CertificationDocumentTemplates } from './documentTemplates/operational';

// Re-export types for backward compatibility or external use
export type { DocumentTemplate, TemplateVariable };
// Export individual template sets if needed (though usually accessed via service/AllDocumentTemplates)
export { ISO27001Templates, AdditionalISO27001Templates, ExtendedISO27001Templates };
export { SOC2Templates, AdditionalSOC2OperationalTemplates, ExtendedSOC2Templates };
export { FedRAMPLowTemplates, FedRAMPModerateTemplates, FedRAMPHighTemplates, FedRAMPCoreTemplates, FedRAMPAttachmentTemplates };
export { NISTTemplates };
export { OperationalTemplates, CertificationDocumentTemplates };

// Master template registry with complete template sets
export const AllDocumentTemplates: Record<string, DocumentTemplate[]> = {
  'ISO27001': [...ISO27001Templates, ...AdditionalISO27001Templates, ...ExtendedISO27001Templates],
  'SOC2': [...SOC2Templates, ...ExtendedSOC2Templates, ...AdditionalSOC2OperationalTemplates],
  'FedRAMP-Low': [...FedRAMPLowTemplates, ...FedRAMPCoreTemplates, ...FedRAMPAttachmentTemplates],
  'FedRAMP-Moderate': [...FedRAMPModerateTemplates, ...FedRAMPCoreTemplates, ...FedRAMPAttachmentTemplates],
  'FedRAMP-High': [...FedRAMPHighTemplates, ...FedRAMPCoreTemplates, ...FedRAMPAttachmentTemplates],
  'NIST-800-53': NISTTemplates,
  'General': OperationalTemplates,
  'Certification': CertificationDocumentTemplates
};

const TEMPLATE_PLACEHOLDER_OPEN = '{{';
const TEMPLATE_PLACEHOLDER_CLOSE = '}}';

const templateEntries = Object.entries(AllDocumentTemplates);

function getTemplatesForFramework(framework: string): DocumentTemplate[] {
  const match = templateEntries.find(([name]) => name === framework);
  return match ? match[1] : [];
}

function replaceTemplateToken(content: string, key: string, value: string): string {
  const token = `${TEMPLATE_PLACEHOLDER_OPEN}${key}${TEMPLATE_PLACEHOLDER_CLOSE}`;
  return content.split(token).join(value);
}

// Template management functions
export class DocumentTemplateService {
  
  // Get templates by framework
  static getTemplatesByFramework(framework: string): DocumentTemplate[] {
    return getTemplatesForFramework(framework);
  }

  // Get template by ID
  static getTemplateById(templateId: string): DocumentTemplate | null {
    for (const [, templates] of templateEntries) {
      const template = templates.find(t => t.id === templateId);
      if (template) return template;
    }
    return null;
  }

  // Get required templates for a framework
  static getRequiredTemplates(framework: string): DocumentTemplate[] {
    const templates = this.getTemplatesByFramework(framework);
    return templates.filter(t => t.required);
  }

  // Get templates by category
  static getTemplatesByCategory(framework: string, category: string): DocumentTemplate[] {
    const templates = this.getTemplatesByFramework(framework);
    return templates.filter(t => t.category === category);
  }

  // Validate template variables
  static validateTemplateVariables(templateId: string, variables: Record<string, any>): {
    valid: boolean;
    errors: string[];
  } {
    const template = this.getTemplateById(templateId);
    if (!template) {
      return { valid: false, errors: ['Template not found'] };
    }

    const errors: string[] = [];
    const providedVariables = new Map(Object.entries(variables));
    
    // Check if templateVariables exists
    if (template.templateVariables) {
      for (const [key, config] of Object.entries(template.templateVariables)) {
        const providedValue = providedVariables.get(key);
        if (config.required && !providedValue) {
          errors.push(`Required variable '${config.label}' is missing`);
        }
        
        if (providedValue && config.type === 'select' && config.options) {
          if (!config.options.includes(String(providedValue))) {
            errors.push(`Invalid value for '${config.label}'. Must be one of: ${config.options.join(', ')}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Generate document from template
  static generateDocument(templateId: string, variables: Record<string, any>): {
    success: boolean;
    content?: string;
    errors?: string[];
  } {
    const template = this.getTemplateById(templateId);
    if (!template) {
      return { success: false, errors: ['Template not found'] };
    }

    const validation = this.validateTemplateVariables(templateId, variables);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    let content = template.templateContent;
    
    // Replace variables in content
    for (const [key, value] of Object.entries(variables)) {
      content = replaceTemplateToken(content, key, String(value));
    }

    // Handle any remaining unfilled variables
    const remainingVars = content.match(/{{[\w_]+}}/g);
    if (remainingVars) {
      for (const remainingVar of remainingVars) {
        content = content.split(remainingVar).join('[TO BE COMPLETED]');
      }
    }

    return {
      success: true,
      content
    };
  }

  // Get template statistics
  static getTemplateStats(): {
    totalTemplates: number;
    byFramework: Record<string, number>;
    byCategory: Record<string, number>;
    requiredCount: number;
  } {
    let totalTemplates = 0;
    let requiredCount = 0;
    const byFramework = new Map<string, number>();
    const byCategory = new Map<string, number>();

    for (const [framework, templates] of Object.entries(AllDocumentTemplates)) {
      byFramework.set(framework, templates.length);
      totalTemplates += templates.length;

      templates.forEach(template => {
        if (template.required) requiredCount++;
        const categoryCount = byCategory.get(template.category) ?? 0;
        byCategory.set(template.category, categoryCount + 1);
      });
    }

    return {
      totalTemplates,
      byFramework: Object.fromEntries(byFramework),
      byCategory: Object.fromEntries(byCategory),
      requiredCount
    };
  }

  // Get certification-specific templates
  static getCertificationTemplates(): DocumentTemplate[] {
    return CertificationDocumentTemplates;
  }

  // Get all templates with certification requirements
  static getTemplatesWithCertificationDocs(): DocumentTemplate[] {
    return Object.values(AllDocumentTemplates).flat();
  }

  // Get all templates across all frameworks
  static getAllTemplates(): DocumentTemplate[] {
    return Object.values(AllDocumentTemplates).flat();
  }

  // Get templates by category across all frameworks
  static getAllTemplatesByCategory(category: string): DocumentTemplate[] {
    const allTemplates = Object.values(AllDocumentTemplates).flat();
    return allTemplates.filter(template => template.category === category);
  }

  // Log template usage
  static logTemplateUsage(templateId: string, framework: string, userId?: string) {
    logger.info('Document template used', {
      templateId,
      framework,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  // Zod-based deterministic document generation with full schema validation
  static generateDeterministicDocument(input: unknown): TemplateGenerationResult {
    // Step 1: Validate input structure with Zod
    const inputValidation = generateFromTemplateSchema.safeParse(input);
    if (!inputValidation.success) {
      return {
        success: false,
        templateId: (input as any)?.templateId || 'unknown',
        errors: inputValidation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
      };
    }

    const { templateId, variables, outputFormat, includeToc, includeMetadata, version } = inputValidation.data;

    // Step 2: Find template
    const template = this.getTemplateById(templateId);
    if (!template) {
      return {
        success: false,
        templateId,
        errors: [{ field: 'templateId', message: `Template '${templateId}' not found` }]
      };
    }

    // Step 3: Create dynamic schema for template variables and validate
    // Cast to simple config for schema creation
    const variableSchema = createDynamicVariableSchema(
      (template.templateVariables || {}) as Record<string, SimpleTemplateVariableConfig>
    );
    const variableValidation = variableSchema.safeParse(variables);

    if (!variableValidation.success) {
      return {
        success: false,
        templateId,
        errors: variableValidation.error.issues.map(issue => ({
          field: `variables.${issue.path.join('.')}`,
          message: issue.message,
          code: issue.code
        }))
      };
    }

    // Step 4: Generate deterministic content
    let content = template.templateContent;
    const validatedVars = variableValidation.data as Record<string, unknown>;

    // Replace all variables with validated values
    for (const [key, value] of Object.entries(validatedVars)) {
      if (value !== undefined && value !== null) {
        content = replaceTemplateToken(content, key, String(value));
      }
    }

    // Check for any remaining unfilled variables
    const warnings: string[] = [];
    const remainingVars = extractTemplateVariables(content);
    const templateVariables = new Map(Object.entries(template.templateVariables ?? {}));
    if (remainingVars.length > 0) {
      for (const remainingVar of remainingVars) {
        // Safe access to templateVariables
        const config = templateVariables.get(remainingVar);
        if (config && !config.required) {
          warnings.push(`Optional variable '${remainingVar}' was not provided`);
          content = replaceTemplateToken(content, remainingVar, '[Not Specified]');
        } else {
          content = replaceTemplateToken(content, remainingVar, '[TO BE COMPLETED]');
        }
      }
    }

    // Step 5: Add metadata if requested
    if (includeMetadata) {
      const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
      const sectionCount = (content.match(/^##?\s/gm) || []).length;

      // Step 6: Add table of contents if requested
      if (includeToc) {
        const headings = content.match(/^#{1,3}\s.+$/gm) || [];
        if (headings.length > 0) {
          const toc = headings.map(h => {
            const level = (h.match(/^#+/) || [''])[0].length;
            const text = h.replace(/^#+\s*/, '');
            const indent = '  '.repeat(level - 1);
            const anchor = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return `${indent}- [${text}](#${anchor})`;
          }).join('\n');
          content = `## Table of Contents\n\n${toc}\n\n---\n\n${content}`;
        }
      }

      this.logTemplateUsage(templateId, template.framework);

      return {
        success: true,
        templateId,
        content,
        metadata: {
          generatedAt: new Date().toISOString(),
          version,
          framework: template.framework,
          documentType: template.documentType,
          wordCount,
          sectionCount
        },
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }

    this.logTemplateUsage(templateId, template.framework);

    return {
      success: true,
      templateId,
      content,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  // Query templates with Zod-validated filters
  static queryTemplates(query: unknown): DocumentTemplate[] {
    const queryValidation = templateListQuerySchema.safeParse(query);
    if (!queryValidation.success) {
      logger.warn('Invalid template query', { errors: queryValidation.error.issues });
      return [];
    }

    const { framework, category, documentType, requiredOnly, sortBy, sortOrder } = queryValidation.data;

    let templates: DocumentTemplate[] = [];

    if (framework) {
      templates = this.getTemplatesByFramework(framework);
    } else {
      templates = this.getAllTemplates();
    }

    // Apply filters
    if (category) {
      templates = templates.filter(t => t.category === category);
    }
    if (documentType) {
      templates = templates.filter(t => t.documentType === documentType);
    }
    if (requiredOnly) {
      templates = templates.filter(t => t.required);
    }

    // Sort results
    templates.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'priority':
        default:
          comparison = a.priority - b.priority;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return templates;
  }

  // Validate a template structure (for custom templates)
  static validateTemplate(template: unknown): {
    valid: boolean;
    errors: Array<{ path: string; message: string }>;
  } {
    return validateTemplateStructure(template);
  }

  // Get variable schema for a template (for frontend form generation)
  static getTemplateVariableSchema(templateId: string): {
    schema: z.ZodObject<any> | null;
    variables: Record<string, SimpleTemplateVariableConfig>;
  } {
    const template = this.getTemplateById(templateId);
    if (!template) {
      return { schema: null, variables: {} };
    }

    const schema = createDynamicVariableSchema(
      (template.templateVariables || {}) as Record<string, SimpleTemplateVariableConfig>
    );

    return {
      schema,
      variables: (template.templateVariables || {}) as Record<string, SimpleTemplateVariableConfig>
    };
  }
}

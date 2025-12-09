import { z } from 'zod';

export const templateVariableTypes = ['text', 'number', 'date', 'select'] as const;

export const documentTypeValues = [
  'policy', 'procedure', 'plan', 'assessment', 'standard', 'control', 
  'framework', 'training', 'report', 'poster', 'appointment', 
  'specification', 'checklist', 'statement', 'memorandum'
] as const;

export const frameworkValues = [
  'ISO27001', 'SOC2', 'FedRAMP-Low', 'FedRAMP-Moderate', 'FedRAMP-High', 
  'NIST-800-53', 'HIPAA', 'PCI-DSS', 'GDPR', 'CMMC'
] as const;

export const templateVariableConfigSchema = z.object({
  type: z.enum(templateVariableTypes),
  label: z.string().min(1).max(100),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  minLength: z.number().positive().optional(),
  maxLength: z.number().positive().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  description: z.string().max(500).optional()
});

export const documentTemplateSchema = z.object({
  id: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'ID must be lowercase alphanumeric with hyphens'),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  framework: z.string().min(1).max(50),
  category: z.string().min(1).max(50),
  priority: z.number().int().positive().max(100),
  documentType: z.enum(documentTypeValues),
  required: z.boolean(),
  templateContent: z.string().min(10).max(100000),
  templateVariables: z.record(z.string(), templateVariableConfigSchema)
});

export type DocumentTemplateSchema = z.infer<typeof documentTemplateSchema>;
export type TemplateVariableConfig = z.infer<typeof templateVariableConfigSchema>;

export interface SimpleTemplateVariableConfig {
  type: 'text' | 'number' | 'date' | 'select';
  label: string;
  required: boolean;
  options?: string[];
}

export function createDynamicVariableSchema(
  templateVariables: Record<string, SimpleTemplateVariableConfig>
): z.ZodObject<any> {
  const schemaShape: Record<string, z.ZodTypeAny> = {};

  for (const [key, config] of Object.entries(templateVariables)) {
    let fieldSchema: z.ZodTypeAny;

    switch (config.type) {
      case 'text':
        fieldSchema = z.string().min(1);
        break;

      case 'number':
        fieldSchema = z.union([z.number(), z.string().transform(v => parseInt(v, 10))]);
        break;

      case 'date':
        fieldSchema = z.string().min(1);
        break;

      case 'select':
        if (config.options && config.options.length > 0) {
          fieldSchema = z.enum(config.options as [string, ...string[]]);
        } else {
          fieldSchema = z.string().min(1);
        }
        break;

      default:
        fieldSchema = z.string();
    }

    if (!config.required) {
      fieldSchema = fieldSchema.optional();
    }

    schemaShape[key] = fieldSchema;
  }

  return z.object(schemaShape);
}

export const generateFromTemplateSchema = z.object({
  templateId: z.string().min(1).max(50),
  variables: z.record(z.string(), z.unknown()),
  outputFormat: z.enum(['markdown', 'html', 'pdf']).optional().default('markdown'),
  includeToc: z.boolean().optional().default(false),
  includeMetadata: z.boolean().optional().default(true),
  version: z.string().optional().default('1.0.0')
});

export const templateListQuerySchema = z.object({
  framework: z.string().optional(),
  category: z.string().optional(),
  documentType: z.enum(documentTypeValues).optional(),
  requiredOnly: z.boolean().optional(),
  sortBy: z.enum(['priority', 'title', 'category']).optional().default('priority'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
});

export const templateGenerationResultSchema = z.object({
  success: z.boolean(),
  templateId: z.string(),
  content: z.string().optional(),
  metadata: z.object({
    generatedAt: z.string(),
    version: z.string(),
    framework: z.string(),
    documentType: z.string(),
    wordCount: z.number(),
    sectionCount: z.number()
  }).optional(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    code: z.string().optional()
  })).optional(),
  warnings: z.array(z.string()).optional()
});

export type GenerateFromTemplateInput = z.infer<typeof generateFromTemplateSchema>;
export type TemplateListQuery = z.infer<typeof templateListQuerySchema>;
export type TemplateGenerationResult = z.infer<typeof templateGenerationResultSchema>;

export function validateTemplateStructure(template: unknown): {
  valid: boolean;
  errors: Array<{ path: string; message: string }>;
} {
  const result = documentTemplateSchema.safeParse(template);
  
  if (result.success) {
    const templateVars = (result.data.templateContent.match(/{{[\w_]+}}/g) || [])
      .map(v => v.replace(/{{|}}/g, ''));
    
    const definedVars = Object.keys(result.data.templateVariables);
    const undefinedVars = templateVars.filter(v => !definedVars.includes(v));
    
    if (undefinedVars.length > 0) {
      return {
        valid: false,
        errors: undefinedVars.map(v => ({
          path: `templateVariables.${v}`,
          message: `Variable '{{${v}}}' is used in template content but not defined in templateVariables`
        }))
      };
    }
    
    return { valid: true, errors: [] };
  }
  
  return {
    valid: false,
    errors: result.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message
    }))
  };
}

export function extractTemplateVariables(templateContent: string): string[] {
  const matches = templateContent.match(/{{[\w_]+}}/g) || [];
  return Array.from(new Set(matches.map(v => v.replace(/{{|}}/g, ''))));
}

export interface TemplateVariable {
  type: 'text' | 'date' | 'select' | 'number' | 'multiselect';
  label: string;
  required: boolean;
  options?: string[]; // For select/multiselect
  defaultValue?: string | number | boolean;
  placeholder?: string;
  description?: string;
}

export interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  framework: string; // 'ISO27001', 'SOC2', 'FedRAMP', etc.
  category: string; // 'policy', 'procedure', 'plan', 'report'
  priority: number; // 1 (High) to 5 (Low)
  documentType: string; // For frontend categorization
  required: boolean;
  templateContent: string; // Markdown content with Handlebars-like variables {{var_name}}
  templateVariables?: Record<string, TemplateVariable>;
}

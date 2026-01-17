export interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  framework: string;
  category: string;
  priority: number;
  documentType:
    | 'policy'
    | 'procedure'
    | 'plan'
    | 'assessment'
    | 'standard'
    | 'control'
    | 'framework'
    | 'training'
    | 'report'
    | 'poster'
    | 'appointment'
    | 'specification'
    | 'checklist'
    | 'statement'
    | 'memorandum'
    | 'register'
    | 'manual'
    | 'methodology'
    | 'template'
    | 'notice'
    | 'agreement'
    | 'summary'
    | 'findings'
    | 'scorecard'
    | 'inventory'
    | 'form'
    | 'questionnaire'
    | 'diagram'
    | 'log'
    | 'registration'
    | 'record'
    | 'analysis'
    | 'program'
    | 'strategy'
    | 'architecture'
    | 'guide'
    | 'mapping'
    | 'confirmation'
    | 'charter'
    | 'schedule'
    | 'minutes'
    | 'worksheet'
    | 'reference'
    | 'matrix';
  required: boolean;
  templateContent: string;
  templateVariables: {
    [key: string]: {
      type: 'text' | 'number' | 'date' | 'select';
      label: string;
      required: boolean;
      options?: string[];
    };
  };
}

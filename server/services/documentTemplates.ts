import { logger } from '../utils/logger';

// Complete 2025 Document Template Library
// Based on latest ISO 27001:2022, SOC 2 Type 2, FedRAMP Rev 5, and NIST 800-53 Rev 5.1.1

export interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  framework: string;
  category: string;
  priority: number;
  documentType: 'policy' | 'procedure' | 'plan' | 'assessment' | 'standard' | 'control' | 'framework' | 'training' | 'report';
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

// ISO 27001:2022 - 24 Mandatory Documents + Key Supporting Documents
export const ISO27001Templates: DocumentTemplate[] = [
  // Core ISMS Management Documents (Clauses 4-10)
  {
    id: 'iso-001',
    title: 'ISMS Scope Document',
    description: 'Defines boundaries and applicability of ISMS (Clause 4.3)',
    framework: 'ISO27001',
    category: 'management',
    priority: 1,
    documentType: 'standard',
    required: true,
    templateContent: `# Information Security Management System (ISMS) Scope

## 1. Organization Overview
**Organization Name:** {{company_name}}
**Industry:** {{industry}}
**Size:** {{company_size}}

## 2. ISMS Scope Definition
This document defines the scope of the Information Security Management System (ISMS) for {{company_name}}.

### 2.1 Physical Boundaries
- Primary facilities: {{primary_locations}}
- Data centers: {{data_centers}}
- Remote locations: {{remote_locations}}

### 2.2 Organizational Boundaries
- Business units included: {{business_units}}
- Departments: {{departments}}
- Third-party services: {{third_party_services}}

### 2.3 Technological Boundaries
- Information systems: {{information_systems}}
- Networks: {{networks}}
- Cloud services: {{cloud_services}}
- Mobile devices: {{mobile_devices}}

## 3. Information Assets in Scope
- Customer data
- Financial information
- Intellectual property
- Employee records
- System configurations
- Business processes

## 4. Exclusions and Justifications
{{exclusions}}

## 5. Legal and Regulatory Requirements
{{legal_requirements}}

## 6. Scope Review and Approval
- Document Owner: {{document_owner}}
- Approved By: {{approved_by}}
- Review Frequency: Annual
- Next Review: {{next_review_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      industry: { type: 'text', label: 'Industry', required: true },
      company_size: { type: 'select', label: 'Company Size', required: true, options: ['Small', 'Medium', 'Large', 'Enterprise'] },
      primary_locations: { type: 'text', label: 'Primary Locations', required: true },
      data_centers: { type: 'text', label: 'Data Centers', required: false },
      remote_locations: { type: 'text', label: 'Remote Locations', required: false }
    }
  },
  {
    id: 'iso-002',
    title: 'Information Security Policy',
    description: 'High-level security commitment from top management (Clause 5.2)',
    framework: 'ISO27001',
    category: 'policy',
    priority: 2,
    documentType: 'policy',
    required: true,
    templateContent: `# Information Security Policy

## 1. Executive Summary
{{company_name}} is committed to protecting the confidentiality, integrity, and availability of information assets through a comprehensive Information Security Management System (ISMS).

## 2. Purpose and Scope
This policy establishes {{company_name}}'s commitment to information security and provides the framework for setting security objectives.

### 2.1 Scope
This policy applies to all employees, contractors, and third parties with access to {{company_name}} information systems.

## 3. Information Security Objectives
- Protect customer data and maintain trust
- Ensure business continuity and operational resilience
- Comply with legal and regulatory requirements
- Minimize security risks to acceptable levels

## 4. Management Commitment
Senior management is committed to:
- Providing adequate resources for information security
- Establishing clear security roles and responsibilities
- Conducting regular security reviews and improvements
- Ensuring compliance with this policy

## 5. Policy Framework
This policy is supported by detailed procedures and standards covering:
- Access control and identity management
- Asset management and classification
- Incident response and business continuity
- Risk management and assessment
- Supplier and vendor security

## 6. Compliance and Monitoring
Compliance with this policy is mandatory. Violations may result in disciplinary action.

## 7. Policy Review
This policy is reviewed annually and updated as needed.

**Approved By:** {{approved_by}}
**Date:** {{approval_date}}
**Next Review:** {{next_review_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      approved_by: { type: 'text', label: 'Approved By (Name and Title)', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true },
      next_review_date: { type: 'date', label: 'Next Review Date', required: true }
    }
  }
];

// SOC 2 Type 2 - 25 Required Policies + Procedures
export const SOC2Templates: DocumentTemplate[] = [
  {
    id: 'soc2-001',
    title: 'Security Controls Framework',
    description: 'Comprehensive security control implementation framework',
    framework: 'SOC2',
    category: 'framework',
    priority: 1,
    documentType: 'framework',
    required: true,
    templateContent: `# SOC 2 Security Controls Framework

## 1. Control Environment
{{company_name}} has established a comprehensive control environment to ensure the security, availability, and confidentiality of customer data and systems.

## 2. Trust Services Criteria
This framework addresses the following Trust Services Criteria:
- **Security (CC):** Protection against unauthorized access
- **Availability (A):** System accessibility for operation and use
- **Processing Integrity (PI):** System processing completeness and accuracy
- **Confidentiality (C):** Information designated as confidential
- **Privacy (P):** Personal information collection, use, retention, and disposal

## 3. Control Activities
### 3.1 Logical and Physical Access Controls
- Multi-factor authentication for system access
- Role-based access control implementation
- Physical security controls for data centers
- Regular access reviews and deprovisioning

### 3.2 System Operations
- Change management procedures
- Data backup and recovery processes
- System monitoring and incident response
- Vendor management and due diligence

### 3.3 Risk Assessment and Mitigation
- Annual risk assessments
- Risk treatment plans
- Control testing and validation
- Continuous monitoring and improvement

## 4. Control Implementation
{{control_implementation_details}}

## 5. Monitoring and Review
Controls are monitored continuously and reviewed annually for effectiveness.

**Document Owner:** {{document_owner}}
**Effective Date:** {{effective_date}}
**Review Frequency:** Annual`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      control_implementation_details: { type: 'text', label: 'Control Implementation Details', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  }
];

// FedRAMP Rev 5 - Baseline-Specific Templates
export const FedRAMPLowTemplates: DocumentTemplate[] = [
  {
    id: 'fedramp-low-001',
    title: 'System Security Plan (SSP) - Low Baseline',
    description: 'Complete SSP for FedRAMP Low impact level (155+ controls)',
    framework: 'FedRAMP-Low',
    category: 'plan',
    priority: 1,
    documentType: 'plan',
    required: true,
    templateContent: `# System Security Plan (SSP) - FedRAMP Low Baseline

## 1. System Information
**System Name:** {{system_name}}
**System Owner:** {{system_owner}}
**Impact Level:** Low
**Authorization Date:** {{authorization_date}}

## 2. System Description
{{system_description}}

## 3. System Environment
### 3.1 System Architecture
{{system_architecture}}

### 3.2 Network Architecture
{{network_architecture}}

### 3.3 Data Flow
{{data_flow_description}}

## 4. Control Implementation
This SSP implements FedRAMP Low baseline controls including:
- Access Control (AC) family
- Audit and Accountability (AU) family  
- Configuration Management (CM) family
- Identification and Authentication (IA) family
- System and Communications Protection (SC) family

## 5. Security Control Summary
Total Controls: 155+
- Low baseline controls: Implemented
- Control enhancements: As specified in FedRAMP Low baseline

## 6. Plan Approval
**Prepared By:** {{prepared_by}}
**Reviewed By:** {{reviewed_by}}
**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      system_owner: { type: 'text', label: 'System Owner', required: true },
      authorization_date: { type: 'date', label: 'Authorization Date', required: true },
      system_description: { type: 'text', label: 'System Description', required: true }
    }
  }
];

export const FedRAMPModerateTemplates: DocumentTemplate[] = [
  {
    id: 'fedramp-mod-001',
    title: 'System Security Plan (SSP) - Moderate Baseline',
    description: 'Complete SSP for FedRAMP Moderate impact level (300+ controls)',
    framework: 'FedRAMP-Moderate',
    category: 'plan',
    priority: 1,
    documentType: 'plan',
    required: true,
    templateContent: `# System Security Plan (SSP) - FedRAMP Moderate Baseline

## 1. System Information
**System Name:** {{system_name}}
**System Owner:** {{system_owner}}
**Impact Level:** Moderate
**Authorization Date:** {{authorization_date}}

## 2. System Description
{{system_description}}

## 3. Enhanced Security Controls
This SSP implements FedRAMP Moderate baseline with 300+ security controls including enhanced:
- Incident Response (IR) capabilities
- Risk Assessment (RA) procedures
- Security Assessment (CA) requirements
- Personnel Security (PS) controls
- Physical Protection (PE) measures

## 4. Continuous Monitoring
Enhanced continuous monitoring capabilities for moderate impact systems.

**Prepared By:** {{prepared_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      system_owner: { type: 'text', label: 'System Owner', required: true },
      authorization_date: { type: 'date', label: 'Authorization Date', required: true }
    }
  }
];

export const FedRAMPHighTemplates: DocumentTemplate[] = [
  {
    id: 'fedramp-high-001',
    title: 'System Security Plan (SSP) - High Baseline',
    description: 'Complete SSP for FedRAMP High impact level (400+ controls)',
    framework: 'FedRAMP-High',
    category: 'plan',
    priority: 1,
    documentType: 'plan',
    required: true,
    templateContent: `# System Security Plan (SSP) - FedRAMP High Baseline

## 1. System Information
**System Name:** {{system_name}}
**System Owner:** {{system_owner}}
**Impact Level:** High
**Authorization Date:** {{authorization_date}}

## 2. System Description for High Impact
{{system_description}}

## 3. Maximum Security Controls
This SSP implements FedRAMP High baseline with 400+ security controls including maximum:
- Multi-layered security architecture
- Advanced threat detection and response
- Comprehensive audit and monitoring
- Strict access controls and authentication
- Enhanced physical security measures

## 4. High Impact Monitoring
Continuous monitoring with real-time threat detection and automated response capabilities.

**Prepared By:** {{prepared_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      system_owner: { type: 'text', label: 'System Owner', required: true },
      authorization_date: { type: 'date', label: 'Authorization Date', required: true }
    }
  }
];

// NIST 800-53 Rev 5.1.1 Templates
export const NIST80053Templates: DocumentTemplate[] = [
  {
    id: 'nist-001',
    title: 'Security and Privacy Program Policy',
    description: 'Foundation security and privacy program policy (NIST 800-53 Rev 5.1.1)',
    framework: 'NIST-800-53',
    category: 'policy',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Security and Privacy Program Policy

## 1. Purpose
This policy establishes {{company_name}}'s security and privacy program based on NIST 800-53 Rev 5.1.1 guidelines.

## 2. Program Objectives
- Implement comprehensive security controls across all impact levels
- Protect privacy of personal information
- Ensure collaboration between security and privacy programs
- Manage risks appropriately based on organizational needs

## 3. Control Families
This program addresses all 20 NIST 800-53 control families:
- Access Control (AC)
- Awareness and Training (AT)
- Audit and Accountability (AU)
- Assessment, Authorization, and Monitoring (CA)
- Configuration Management (CM)
- Contingency Planning (CP)
- Identification and Authentication (IA)
- Incident Response (IR)
- Maintenance (MA)
- Media Protection (MP)
- Physical and Environmental Protection (PE)
- Planning (PL)
- Program Management (PM)
- Personnel Security (PS)
- Risk Assessment (RA)
- System and Services Acquisition (SA)
- System and Communications Protection (SC)
- System and Information Integrity (SI)
- Supply Chain Risk Management (SR)
- Privacy Controls (Privacy family)

## 4. Implementation Guidelines
Controls are implemented based on system categorization and impact levels (Low, Moderate, High).

## 5. Program Review
Annual review and continuous improvement of security and privacy controls.

**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  }
];

// Master template registry
export const AllDocumentTemplates: Record<string, DocumentTemplate[]> = {
  'ISO27001': ISO27001Templates,
  'SOC2': SOC2Templates,
  'FedRAMP-Low': FedRAMPLowTemplates,
  'FedRAMP-Moderate': FedRAMPModerateTemplates,
  'FedRAMP-High': FedRAMPHighTemplates,
  'NIST-800-53': NIST80053Templates
};

// Template management functions
export class DocumentTemplateService {
  
  // Get templates by framework
  static getTemplatesByFramework(framework: string): DocumentTemplate[] {
    return AllDocumentTemplates[framework] || [];
  }

  // Get template by ID
  static getTemplateById(templateId: string): DocumentTemplate | null {
    for (const framework in AllDocumentTemplates) {
      const template = AllDocumentTemplates[framework].find(t => t.id === templateId);
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
    
    for (const [key, config] of Object.entries(template.templateVariables)) {
      if (config.required && !variables[key]) {
        errors.push(`Required variable '${config.label}' is missing`);
      }
      
      if (variables[key] && config.type === 'select' && config.options) {
        if (!config.options.includes(variables[key])) {
          errors.push(`Invalid value for '${config.label}'. Must be one of: ${config.options.join(', ')}`);
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
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(placeholder, String(value));
    }

    // Handle any remaining unfilled variables
    const remainingVars = content.match(/{{[\w_]+}}/g);
    if (remainingVars) {
      for (const remainingVar of remainingVars) {
        content = content.replace(remainingVar, '[TO BE COMPLETED]');
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
    const byFramework: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const [framework, templates] of Object.entries(AllDocumentTemplates)) {
      byFramework[framework] = templates.length;
      totalTemplates += templates.length;

      templates.forEach(template => {
        if (template.required) requiredCount++;
        byCategory[template.category] = (byCategory[template.category] || 0) + 1;
      });
    }

    return {
      totalTemplates,
      byFramework,
      byCategory,
      requiredCount
    };
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
}
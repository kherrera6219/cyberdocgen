import { DocumentTemplate } from './types';

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

// ISO 27001:2022 - Complete 24 Mandatory Documents + Key Supporting Documents  
// Adding more ISO 27001 templates to complete the mandatory set
export const AdditionalISO27001Templates: DocumentTemplate[] = [
  {
    id: 'iso-003',
    title: 'Risk Assessment and Treatment Plan',
    description: 'Comprehensive risk assessment methodology and treatment plans (Clauses 6.1.2, 6.1.3)',
    framework: 'ISO27001',
    category: 'assessment',
    priority: 3,
    documentType: 'assessment',
    required: true,
    templateContent: `# Risk Assessment and Treatment Plan

## 1. Executive Summary
This document establishes {{company_name}}'s approach to identifying, analyzing, evaluating, and treating information security risks in accordance with ISO 27001:2022.

## 2. Risk Assessment Methodology
### 2.1 Asset Identification
- Information assets inventory
- Supporting assets identification
- Asset classification and valuation

### 2.2 Threat and Vulnerability Assessment
- Threat source identification
- Vulnerability assessment procedures
- Risk scenario development

### 2.3 Risk Analysis
- **Qualitative Risk Scale**: {{risk_scale_type}}
- **Impact Categories**: Confidentiality, Integrity, Availability
- **Likelihood Assessment**: {{likelihood_method}}
- **Risk Calculation**: Impact × Likelihood = Risk Level

### 2.4 Risk Evaluation Criteria
- **Risk Appetite**: {{risk_appetite}}
- **Risk Tolerance**: {{risk_tolerance}}
- **Acceptance Criteria**: {{acceptance_criteria}}

## 3. Current Risk Register
| Asset | Threat | Vulnerability | Impact | Likelihood | Risk Level | Treatment |
|-------|--------|---------------|--------|------------|------------|-----------|
| Customer Database | Unauthorized Access | Weak Authentication | High | Medium | High | Implement MFA |
| Financial Systems | Data Breach | Unpatched Software | High | Low | Medium | Patch Management |
| Email System | Phishing | User Awareness | Medium | High | Medium | Security Training |

## 4. Risk Treatment Options
### 4.1 Risk Mitigation
Controls to be implemented: {{planned_controls}}

### 4.2 Risk Transfer
Insurance policies: {{insurance_coverage}}

### 4.3 Risk Avoidance
Activities to be discontinued: {{avoided_activities}}

### 4.4 Risk Acceptance
Risks accepted with justification: {{accepted_risks}}

## 5. Implementation Plan
**Priority 1 Controls**: {{priority_1_controls}}
**Priority 2 Controls**: {{priority_2_controls}}
**Timeline**: {{implementation_timeline}}
**Budget**: {{budget_allocation}}

**Approved By**: {{approved_by}}
**Review Date**: {{review_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      risk_scale_type: { type: 'select', label: 'Risk Scale Type', required: true, options: ['3-Point Scale', '5-Point Scale', 'Qualitative', 'Quantitative'] },
      likelihood_method: { type: 'text', label: 'Likelihood Assessment Method', required: true },
      risk_appetite: { type: 'select', label: 'Risk Appetite', required: true, options: ['Low', 'Medium', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      review_date: { type: 'date', label: 'Review Date', required: true }
    }
  },
  {
    id: 'iso-004',
    title: 'Statement of Applicability (SoA)',
    description: 'Controls selection and justification document (Clause 6.1.3)',
    framework: 'ISO27001',
    category: 'assessment',
    priority: 4,
    documentType: 'assessment',
    required: true,
    templateContent: `# Statement of Applicability (SoA)

## 1. Purpose
This Statement of Applicability documents which ISO 27001:2022 Annex A controls are applicable to {{company_name}}'s ISMS and provides justification for inclusion or exclusion.

## 2. Control Assessment Summary
**Total Annex A Controls**: 93 controls across 4 themes and 14 categories
**Applicable Controls**: {{applicable_count}}
**Not Applicable Controls**: {{not_applicable_count}}

## 3. Information Security Controls (Annex A)

### Theme 1: Organizational Controls (37 controls)
#### A.5 Information Security Policies
- A.5.1 Policies for Information Security: **APPLICABLE** - Information security policy established
- A.5.2 Information Security Roles and Responsibilities: **APPLICABLE** - Roles defined in organization chart
- A.5.3 Segregation of Duties: **{{a53_status}}** - {{a53_justification}}

#### A.6 Organization of Information Security  
- A.6.1 Information Security Management System: **APPLICABLE** - ISMS implemented
- A.6.2 Mobile Device Policy: **{{a62_status}}** - {{a62_justification}}
- A.6.3 Teleworking: **{{a63_status}}** - {{a63_justification}}

#### A.7 Human Resource Security
- A.7.1 Prior to Employment: **APPLICABLE** - Background verification procedures
- A.7.2 During Employment: **APPLICABLE** - Security awareness training
- A.7.3 Termination and Change of Employment: **APPLICABLE** - Access revocation procedures

#### A.8 Asset Management
- A.8.1 Responsibility for Assets: **APPLICABLE** - Asset inventory maintained
- A.8.2 Information Classification: **APPLICABLE** - Data classification scheme
- A.8.3 Media Handling: **{{a83_status}}** - {{a83_justification}}

### Theme 2: People Controls (8 controls)
#### A.11 Physical and Environmental Security
- A.11.1 Secure Areas: **{{a111_status}}** - {{a111_justification}}
- A.11.2 Physical Entry Controls: **{{a112_status}}** - {{a112_justification}}

### Theme 3: Technological Controls (34 controls)  
#### A.12 Communications and Operations Management
- A.12.1 Operational Procedures: **APPLICABLE** - IT operations documented
- A.12.2 Change Management: **APPLICABLE** - Change control process
- A.12.3 Capacity Management: **{{a123_status}}** - {{a123_justification}}

#### A.13 System Acquisition, Development and Maintenance
- A.13.1 Security Requirements: **APPLICABLE** - Security requirements in SDLC
- A.13.2 Security in Development: **{{a132_status}}** - {{a132_justification}}

### Theme 4: Physical Controls (14 controls)
#### A.14 Information Security Incident Management
- A.14.1 Management of Information Security Incidents: **APPLICABLE** - Incident response plan
- A.14.2 Learning from Incidents: **APPLICABLE** - Post-incident review process

## 4. Control Implementation Status
### Implemented Controls ({{implemented_count}})
{{implemented_controls_list}}

### Planned Controls ({{planned_count}})
{{planned_controls_list}}

### Not Applicable Controls with Justification
{{na_controls_justification}}

## 5. Review and Maintenance
This SoA is reviewed annually and updated when:
- New risks are identified
- Business processes change  
- Technology changes occur
- Regulatory requirements change

**Prepared By**: {{prepared_by}}
**Reviewed By**: {{reviewed_by}}
**Approved By**: {{approved_by}}
**Date**: {{approval_date}}
**Next Review**: {{next_review_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      applicable_count: { type: 'number', label: 'Number of Applicable Controls', required: true },
      not_applicable_count: { type: 'number', label: 'Number of Not Applicable Controls', required: true },
      a53_status: { type: 'select', label: 'A.5.3 Status', required: true, options: ['APPLICABLE', 'NOT APPLICABLE'] },
      a53_justification: { type: 'text', label: 'A.5.3 Justification', required: true },
      prepared_by: { type: 'text', label: 'Prepared By', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  }
];

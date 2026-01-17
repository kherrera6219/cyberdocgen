import { DocumentTemplate } from '../types';

export const AssessmentTemplates: DocumentTemplate[] = [
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

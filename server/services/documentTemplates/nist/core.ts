import { DocumentTemplate } from '../types';

export const NIST80053Templates: DocumentTemplate[] = [
  {
    id: 'nist-001',
    title: 'Security and Privacy Program Policy',
    description: 'Tier 1 Security and Privacy Program Policy (NIST 800-53 PM-1)',
    framework: 'NIST-800-53',
    category: 'policy',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Information Security and Privacy Program Policy
**Organization:** {{organization_name}}
**Version:** {{version}}
**Effective Date:** {{effective_date}}

## 1. Purpose
This policy establishes the {{organization_name}} Information Security and Privacy Program in accordance with NIST 800-53 controls.

## 2. Scope
This policy applies to all information systems and personnel within {{organization_name}}.

## 3. Roles and Responsibilities
- **Head of Agency/CEO:** {{ceo_name}} - Ultimate responsibility for risk acceptance.
- **CIO:** {{cio_name}} - Responsibility for information management.
- **SISO/CISO:** {{ciso_name}} - Responsibility for the security program.
- **SPO:** {{spo_name}} - Responsibility for privacy program.

## 4. Program Management Controls (PM Family)

### PM-1: Information Security Program Plan
{{organization_name}} shall develop and disseminate an organization-wide information security program plan that:
- Provides an overview of the security requirements
- Describes the security program management controls
- Includes roles, responsibilities, and coordination
- Is approved by a senior official

### PM-2: Senior Information Security Officer
{{organization_name}} appoints a Senior Information Security Officer (SISO/CISO) with the mission and resources to coordinate, develop, implement, and maintain the security program.

### PM-3: Information Security Resources
{{organization_name}} ensures that capital planning and investment requests include the resources needed to implement the information security program.

### PM-4: Plan of Action and Milestones Process
{{organization_name}} implements a process for ensuring that plans of action and milestones for the security program and associated information systems are maintained and remediated.

### PM-5: Information System Inventory
{{organization_name}} develops and maintains an inventory of its information systems.

### PM-6: Information Security Measures of Performance
{{organization_name}} develops, monitors, and reports on the results of information security measures of performance.

### PM-7: Enterprise Architecture
{{organization_name}} develops an enterprise architecture with embedded information security considerations.

### PM-8: Critical Infrastructure Plan
{{organization_name}} addresses information security assessments and protection of critical infrastructure in its Critical Infrastructure Plan.

### PM-9: Risk Management Strategy
{{organization_name}} implements a risk management strategy that manages information system-related security risks.

### PM-10: Security Authorization Process
{{organization_name}} manages the security authorization process for all information systems.

### PM-11: Mission/Business Process Definition
{{organization_name}} defines mission/business processes with information security and privacy requirements.

### PM-12: Insider Threat Program
{{organization_name}} implements an insider threat program.

## 5. Compliance
Failure to comply with this policy may result in disciplinary action up to and including termination.

**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      organization_name: { type: 'text', label: 'Organization Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true },
      ceo_name: { type: 'text', label: 'CEO/Agency Head Name', required: true },
      cio_name: { type: 'text', label: 'CIO Name', required: true },
      ciso_name: { type: 'text', label: 'CISO Name', required: true },
      spo_name: { type: 'text', label: 'Senior Privacy Officer', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'nist-002',
    title: 'Plan of Action and Milestones (POA&M)',
    description: 'NIST 800-53 POA&M Template for tracking remediation',
    framework: 'NIST-800-53',
    category: 'plan',
    priority: 1,
    documentType: 'plan',
    required: true,
    templateContent: `# Plan of Action and Milestones (POA&M)
**System:** {{system_name}}
**Date:** {{document_date}}

## 1. Remediation Plan Summary
**Total Open Items:** {{open_items}}
**Total Closed Items (Past Year):** {{closed_items}}
**Delayed Items:** {{delayed_items}}

## 2. POA&M Table
| ID | Control | Weakness | Risk Level | Remediation Plan | Milestones | Resources | Status | Completion Date |
|----|---------|----------|------------|------------------|------------|-----------|--------|-----------------|
| {{id_1}} | {{ctrl_1}} | {{weak_1}} | {{risk_1}} | {{plan_1}} | {{mile_1}} | {{res_1}} | {{stat_1}} | {{date_1}} |
| {{id_2}} | {{ctrl_2}} | {{weak_2}} | {{risk_2}} | {{plan_2}} | {{mile_2}} | {{res_2}} | {{stat_2}} | {{date_2}} |
| {{id_3}} | {{ctrl_3}} | {{weak_3}} | {{risk_3}} | {{plan_3}} | {{mile_3}} | {{res_3}} | {{stat_3}} | {{date_3}} |

## 3. Milestones Schedule
- **Immediate (30 days):** {{immediate_milestones}}
- **Short-term (90 days):** {{short_term_milestones}}
- **Long-term (1 year):** {{long_term_milestones}}

**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      document_date: { type: 'date', label: 'Document Date', required: true },
      open_items: { type: 'number', label: 'Total Open Items', required: true },
      closed_items: { type: 'number', label: 'Closed Items', required: true },
      delayed_items: { type: 'number', label: 'Delayed Items', required: true },
      id_1: { type: 'text', label: 'Item 1 ID', required: true },
      ctrl_1: { type: 'text', label: 'Item 1 Control', required: true },
      weak_1: { type: 'text', label: 'Item 1 Weakness', required: true },
      risk_1: { type: 'select', label: 'Item 1 Risk', required: true, options: ['Low', 'Moderate', 'High'] },
      plan_1: { type: 'text', label: 'Item 1 Plan', required: true },
      mile_1: { type: 'text', label: 'Item 1 Milestones', required: true },
      res_1: { type: 'text', label: 'Item 1 Resources', required: true },
      stat_1: { type: 'select', label: 'Item 1 Status', required: true, options: ['Not Started', 'In Progress', 'Completed', 'Delayed'] },
      date_1: { type: 'date', label: 'Item 1 Date', required: true },
      id_2: { type: 'text', label: 'Item 2 ID', required: false },
      ctrl_2: { type: 'text', label: 'Item 2 Control', required: false },
      weak_2: { type: 'text', label: 'Item 2 Weakness', required: false },
      risk_2: { type: 'select', label: 'Item 2 Risk', required: false, options: ['Low', 'Moderate', 'High'] },
      plan_2: { type: 'text', label: 'Item 2 Plan', required: false },
      mile_2: { type: 'text', label: 'Item 2 Milestones', required: false },
      res_2: { type: 'text', label: 'Item 2 Resources', required: false },
      stat_2: { type: 'select', label: 'Item 2 Status', required: false, options: ['Not Started', 'In Progress', 'Completed', 'Delayed'] },
      date_2: { type: 'date', label: 'Item 2 Date', required: false },
      id_3: { type: 'text', label: 'Item 3 ID', required: false },
      ctrl_3: { type: 'text', label: 'Item 3 Control', required: false },
      weak_3: { type: 'text', label: 'Item 3 Weakness', required: false },
      risk_3: { type: 'select', label: 'Item 3 Risk', required: false, options: ['Low', 'Moderate', 'High'] },
      plan_3: { type: 'text', label: 'Item 3 Plan', required: false },
      mile_3: { type: 'text', label: 'Item 3 Milestones', required: false },
      res_3: { type: 'text', label: 'Item 3 Resources', required: false },
      stat_3: { type: 'select', label: 'Item 3 Status', required: false, options: ['Not Started', 'In Progress', 'Completed', 'Delayed'] },
      date_3: { type: 'date', label: 'Item 3 Date', required: false },
      immediate_milestones: { type: 'text', label: 'Immediate Milestones', required: true },
      short_term_milestones: { type: 'text', label: 'Short-term Milestones', required: true },
      long_term_milestones: { type: 'text', label: 'Long-term Milestones', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'nist-003',
    title: 'Security Assessment Report (SAR)',
    description: 'NIST 800-53 Security Assessment Report Template',
    framework: 'NIST-800-53',
    category: 'report',
    priority: 1,
    documentType: 'report',
    required: true,
    templateContent: `# Security Assessment Report (SAR)
**System:** {{system_name}}
**Date:** {{document_date}}
**Assessor:** {{assessor_name}}

## 1. Executive Summary
**Risk Assessment:** {{risk_summary}}
**Recommendation:** {{recommendation}}

## 2. Assessment Results
| Control | Finding | Risk Level | Recommendation |
|---------|---------|------------|----------------|
| {{ctrl_1}} | {{find_1}} | {{risk_1}} | {{rec_1}} |
| {{ctrl_2}} | {{find_2}} | {{risk_2}} | {{rec_2}} |
| {{ctrl_3}} | {{find_3}} | {{risk_3}} | {{rec_3}} |

## 3. Methodology
- **Scope:** {{scope}}
- **Tools:** {{tools_used}}
- **Dates:** {{assessment_period}}

**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      document_date: { type: 'date', label: 'Document Date', required: true },
      assessor_name: { type: 'text', label: 'Assessor Name', required: true },
      risk_summary: { type: 'text', label: 'Risk Summary', required: true },
      recommendation: { type: 'text', label: 'Recommendation', required: true },
      ctrl_1: { type: 'text', label: 'Finding 1 Control', required: true },
      find_1: { type: 'text', label: 'Finding 1 Description', required: true },
      risk_1: { type: 'select', label: 'Finding 1 Risk', required: true, options: ['Low', 'Moderate', 'High'] },
      rec_1: { type: 'text', label: 'Finding 1 Recommendation', required: true },
      ctrl_2: { type: 'text', label: 'Finding 2 Control', required: false },
      find_2: { type: 'text', label: 'Finding 2 Description', required: false },
      risk_2: { type: 'select', label: 'Finding 2 Risk', required: false, options: ['Low', 'Moderate', 'High'] },
      rec_2: { type: 'text', label: 'Finding 2 Recommendation', required: false },
      ctrl_3: { type: 'text', label: 'Finding 3 Control', required: false },
      find_3: { type: 'text', label: 'Finding 3 Description', required: false },
      risk_3: { type: 'select', label: 'Finding 3 Risk', required: false, options: ['Low', 'Moderate', 'High'] },
      rec_3: { type: 'text', label: 'Finding 3 Recommendation', required: false },
      scope: { type: 'text', label: 'Assessment Scope', required: true },
      tools_used: { type: 'text', label: 'Tools Used', required: true },
      assessment_period: { type: 'text', label: 'Assessment Period', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'nist-004',
    title: 'Privacy Impact Assessment (PIA)',
    description: 'NIST 800-53 Privacy Impact Assessment Template',
    framework: 'NIST-800-53',
    category: 'assessment',
    priority: 1,
    documentType: 'assessment',
    required: true,
    templateContent: `# Privacy Impact Assessment (PIA)
**System:** {{system_name}}
**Date:** {{document_date}}

## 1. PII Collection
**Types of PII:** {{pii_types}}
**Purpose:** {{pii_purpose}}

## 2. PII Use and Sharing
**Uses:** {{pii_uses}}
**Sharing:** {{pii_sharing}}

## 3. User Notice and Consent
**Notice:** {{pii_notice}}
**Consent:** {{pii_consent}}

## 4. Security of PII
**Controls:** {{pii_controls}}
**Retention:** {{pii_retention}}

**Privacy Officer:** {{privacy_officer}}
**Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      document_date: { type: 'date', label: 'Document Date', required: true },
      pii_types: { type: 'text', label: 'Types of PII', required: true },
      pii_purpose: { type: 'text', label: 'Purpose of Collection', required: true },
      pii_uses: { type: 'text', label: 'Uses of PII', required: true },
      pii_sharing: { type: 'text', label: 'Sharing of PII', required: true },
      pii_notice: { type: 'text', label: 'User Notice', required: true },
      pii_consent: { type: 'text', label: 'User Consent', required: true },
      pii_controls: { type: 'text', label: 'Security Controls', required: true },
      pii_retention: { type: 'text', label: 'Retention Policy', required: true },
      privacy_officer: { type: 'text', label: 'Privacy Officer', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  }
];

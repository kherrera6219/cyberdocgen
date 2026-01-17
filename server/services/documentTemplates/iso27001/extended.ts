import { DocumentTemplate } from '../types';

export const ExtendedTemplates: DocumentTemplate[] = [
  {
    id: 'iso-005',
    title: 'Risk Treatment Procedure',
    description: 'Procedure for treating identified information security risks (Clause 6.1.3)',
    framework: 'ISO27001',
    category: 'procedure',
    priority: 5,
    documentType: 'procedure',
    required: true,
    templateContent: `# Risk Treatment Procedure

## 1. Purpose
This procedure defines {{company_name}}'s approach to treating information security risks identified through the risk assessment process.

## 2. Scope
Applies to all identified information security risks within the ISMS scope.

## 3. Risk Treatment Options

### 3.1 Risk Modification (Mitigation)
- Implement controls to reduce likelihood or impact
- Document control selection rationale
- Define implementation timeline

### 3.2 Risk Retention (Acceptance)
- Document acceptance criteria
- Obtain management approval for acceptance
- Monitor retained risks

### 3.3 Risk Avoidance
- Eliminate activities that create risk
- Document business justification

### 3.4 Risk Sharing (Transfer)
- Transfer risk through insurance or contracts
- Document third-party arrangements

## 4. Treatment Selection Process
1. Identify applicable treatment options
2. Evaluate cost-benefit of each option
3. Select appropriate treatment(s)
4. Develop implementation plan
5. Obtain management approval

## 5. Control Selection
- Controls selected from ISO 27001 Annex A
- Additional controls as needed
- Document justification in Statement of Applicability

## 6. Residual Risk Assessment
- Calculate residual risk after treatment
- Ensure residual risk meets acceptance criteria
- Document residual risk levels

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'iso-006',
    title: 'Information Security Objectives',
    description: 'Measurable information security objectives aligned with policy (Clause 6.2)',
    framework: 'ISO27001',
    category: 'management',
    priority: 6,
    documentType: 'standard',
    required: true,
    templateContent: `# Information Security Objectives

## 1. Purpose
This document establishes {{company_name}}'s information security objectives in accordance with ISO 27001 Clause 6.2.

## 2. Alignment with Security Policy
These objectives support the commitments made in our Information Security Policy.

## 3. Security Objectives for {{fiscal_year}}

### Objective 1: Reduce Security Incidents
- **Target:** Reduce security incidents by {{incident_reduction_target}}%
- **Measurement:** Monthly incident count vs baseline
- **Responsible:** {{security_officer}}
- **Timeline:** {{objective_1_deadline}}

### Objective 2: Improve Security Awareness
- **Target:** {{awareness_target}}% completion of security training
- **Measurement:** Training completion rates
- **Responsible:** {{training_coordinator}}
- **Timeline:** Quarterly reviews

### Objective 3: Vulnerability Management
- **Target:** Remediate critical vulnerabilities within {{critical_vuln_days}} days
- **Measurement:** Average remediation time
- **Responsible:** {{it_security_lead}}
- **Timeline:** Ongoing

### Objective 4: Access Control Effectiveness
- **Target:** Complete {{access_review_frequency}} access reviews with {{access_compliance_target}}% compliance
- **Measurement:** Access review completion and findings
- **Responsible:** {{access_manager}}
- **Timeline:** {{access_review_frequency}}

### Objective 5: Business Continuity Readiness
- **Target:** Achieve {{rto_target}} hour RTO for critical systems
- **Measurement:** DR test results
- **Responsible:** {{bc_coordinator}}
- **Timeline:** Annual testing

## 4. Monitoring and Review
- Objectives reviewed quarterly
- Progress reported to management
- Adjustments made as needed

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Review Date:** {{review_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      fiscal_year: { type: 'text', label: 'Fiscal Year', required: true },
      incident_reduction_target: { type: 'number', label: 'Incident Reduction Target (%)', required: true },
      security_officer: { type: 'text', label: 'Security Officer Name', required: true },
      awareness_target: { type: 'number', label: 'Training Completion Target (%)', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      review_date: { type: 'date', label: 'Review Date', required: true }
    }
  },
  {
    id: 'iso-007',
    title: 'Internal Audit Programme',
    description: 'ISMS internal audit planning and execution (Clause 9.2)',
    framework: 'ISO27001',
    category: 'audit',
    priority: 7,
    documentType: 'plan',
    required: true,
    templateContent: `# Internal Audit Programme

## 1. Purpose
This document defines {{company_name}}'s internal audit programme for the ISMS in accordance with ISO 27001 Clause 9.2.

## 2. Audit Objectives
- Verify ISMS conformity to ISO 27001 requirements
- Confirm ISMS is effectively implemented and maintained
- Identify opportunities for improvement
- Provide input for management review

## 3. Audit Schedule for {{audit_year}}

| Quarter | Audit Focus | Clauses/Controls | Lead Auditor | Status |
|---------|-------------|------------------|--------------|--------|
| Q1 | Context and Leadership | 4, 5 | {{q1_auditor}} | Planned |
| Q2 | Risk Management | 6.1, 8.2 | {{q2_auditor}} | Planned |
| Q3 | Operations and Controls | 8, Annex A | {{q3_auditor}} | Planned |
| Q4 | Performance Evaluation | 9, 10 | {{q4_auditor}} | Planned |

## 4. Audit Methodology
- Document review and evidence collection
- Interviews with process owners
- Observation of activities
- Sample testing of records

## 5. Auditor Competence Requirements
- Understanding of ISO 27001 requirements
- Audit training (ISO 19011 or equivalent)
- Independence from audited areas
- Objectivity and impartiality

## 6. Audit Reporting
- Findings documented within {{finding_documentation_days}} days
- Nonconformities classified by severity
- Corrective actions tracked to completion
- Results reported to management

## 7. Audit Records
- Audit plans and checklists
- Evidence and working papers
- Audit reports
- Corrective action records

**Audit Programme Owner:** {{audit_programme_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      audit_year: { type: 'text', label: 'Audit Year', required: true },
      q1_auditor: { type: 'text', label: 'Q1 Lead Auditor', required: true },
      q2_auditor: { type: 'text', label: 'Q2 Lead Auditor', required: true },
      q3_auditor: { type: 'text', label: 'Q3 Lead Auditor', required: true },
      q4_auditor: { type: 'text', label: 'Q4 Lead Auditor', required: true },
      finding_documentation_days: { type: 'number', label: 'Days to Document Findings', required: true },
      audit_programme_owner: { type: 'text', label: 'Audit Programme Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'iso-008',
    title: 'Management Review Record',
    description: 'Template for recording ISMS management reviews (Clause 9.3)',
    framework: 'ISO27001',
    category: 'management',
    priority: 8,
    documentType: 'report',
    required: true,
    templateContent: `# Management Review Record

## Meeting Information
**Organization:** {{company_name}}
**Date:** {{review_date}}
**Attendees:** {{attendees}}
**Chair:** {{chair_person}}

## 1. Review Inputs (Clause 9.3.2)

### 1.1 Status of Previous Actions
{{previous_actions_status}}

### 1.2 Changes in External/Internal Issues
{{changes_in_issues}}

### 1.3 Nonconformities and Corrective Actions
- Total nonconformities: {{total_nonconformities}}
- Closed: {{closed_nonconformities}}
- Open: {{open_nonconformities}}

### 1.4 Monitoring and Measurement Results
{{monitoring_results}}

### 1.5 Audit Results
{{audit_results}}

### 1.6 Fulfilment of Security Objectives
{{objectives_status}}

### 1.7 Interested Party Feedback
{{stakeholder_feedback}}

### 1.8 Risk Assessment Results
{{risk_assessment_summary}}

### 1.9 Opportunities for Improvement
{{improvement_opportunities}}

## 2. Review Outputs (Clause 9.3.3)

### 2.1 Decisions and Actions
| Decision/Action | Responsible | Due Date | Priority |
|-----------------|-------------|----------|----------|
{{decisions_actions_table}}

### 2.2 Resource Needs
{{resource_needs}}

### 2.3 Improvement Opportunities
{{improvements_identified}}

## 3. ISMS Effectiveness Assessment
**Overall ISMS Effectiveness:** {{effectiveness_rating}}
**Justification:** {{effectiveness_justification}}

## 4. Next Review
**Scheduled Date:** {{next_review_date}}

**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      review_date: { type: 'date', label: 'Review Date', required: true },
      attendees: { type: 'text', label: 'Attendees', required: true },
      chair_person: { type: 'text', label: 'Chair Person', required: true },
      total_nonconformities: { type: 'number', label: 'Total Nonconformities', required: true },
      closed_nonconformities: { type: 'number', label: 'Closed Nonconformities', required: true },
      open_nonconformities: { type: 'number', label: 'Open Nonconformities', required: true },
      effectiveness_rating: { type: 'select', label: 'Effectiveness Rating', required: true, options: ['Effective', 'Partially Effective', 'Needs Improvement'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      next_review_date: { type: 'date', label: 'Next Review Date', required: true }
    }
  },
  {
    id: 'iso-009',
    title: 'Nonconformity and Corrective Action Record',
    description: 'Recording and tracking nonconformities and corrective actions (Clause 10.1)',
    framework: 'ISO27001',
    category: 'corrective-action',
    priority: 9,
    documentType: 'report',
    required: true,
    templateContent: `# Nonconformity and Corrective Action Record

## Nonconformity Details
**NCR Number:** {{ncr_number}}
**Date Identified:** {{date_identified}}
**Identified By:** {{identified_by}}
**Source:** {{source}}

## 1. Nonconformity Description
**Clause/Control Reference:** {{clause_reference}}
**Description:** {{nonconformity_description}}
**Evidence:** {{evidence}}

## 2. Immediate Action (Containment)
**Action Taken:** {{immediate_action}}
**Date:** {{immediate_action_date}}
**By:** {{immediate_action_by}}

## 3. Root Cause Analysis
**Method Used:** {{rca_method}}
**Root Cause(s) Identified:**
{{root_causes}}

## 4. Corrective Action Plan
| Action | Responsible | Target Date | Status |
|--------|-------------|-------------|--------|
{{corrective_actions_table}}

## 5. Verification of Effectiveness
**Verification Method:** {{verification_method}}
**Verification Date:** {{verification_date}}
**Verified By:** {{verified_by}}
**Result:** {{verification_result}}

## 6. Closure
**Closed Date:** {{closed_date}}
**Closed By:** {{closed_by}}
**Closure Notes:** {{closure_notes}}

## 7. Lessons Learned
{{lessons_learned}}

**Approved By:** {{approved_by}}`,
    templateVariables: {
      ncr_number: { type: 'text', label: 'NCR Number', required: true },
      date_identified: { type: 'date', label: 'Date Identified', required: true },
      identified_by: { type: 'text', label: 'Identified By', required: true },
      source: { type: 'select', label: 'Source', required: true, options: ['Internal Audit', 'External Audit', 'Incident', 'Management Review', 'Customer Complaint', 'Other'] },
      clause_reference: { type: 'text', label: 'Clause/Control Reference', required: true },
      nonconformity_description: { type: 'text', label: 'Nonconformity Description', required: true },
      rca_method: { type: 'select', label: 'RCA Method', required: true, options: ['5 Whys', 'Fishbone Diagram', 'Fault Tree Analysis', 'Other'] },
      approved_by: { type: 'text', label: 'Approved By', required: true }
    }
  },
  {
    id: 'iso-010',
    title: 'Competence and Training Records',
    description: 'Evidence of personnel competence for ISMS roles (Clause 7.2)',
    framework: 'ISO27001',
    category: 'hr',
    priority: 10,
    documentType: 'report',
    required: true,
    templateContent: `# Competence and Training Records

## 1. Purpose
This document records competence requirements and training for personnel affecting ISMS performance at {{company_name}}.

## 2. Competence Requirements Matrix

| Role | Required Competencies | Minimum Qualifications | Training Required |
|------|----------------------|------------------------|-------------------|
| CISO/Security Manager | Security management, Risk assessment, Compliance | {{ciso_qualifications}} | ISO 27001 Lead Auditor |
| IT Security Engineer | Technical security, Vulnerability management | {{engineer_qualifications}} | Security certifications |
| Security Analyst | Incident response, Log analysis | {{analyst_qualifications}} | SIEM training |
| System Administrator | System hardening, Access management | {{admin_qualifications}} | OS security |
| All Employees | Security awareness | N/A | Annual awareness training |

## 3. Training Programme

### 3.1 Mandatory Training
| Training | Audience | Frequency | Duration |
|----------|----------|-----------|----------|
| Security Awareness | All staff | Annual | {{awareness_duration}} |
| Phishing Awareness | All staff | Quarterly | 30 minutes |
| Incident Reporting | All staff | Annual | 1 hour |
| ISMS Overview | Management | Annual | 2 hours |

### 3.2 Role-Based Training
| Training | Target Roles | Provider | Certification |
|----------|--------------|----------|---------------|
| ISO 27001 Lead Auditor | Audit team | {{la_provider}} | Yes |
| Incident Response | Security team | {{ir_provider}} | Optional |
| Secure Development | Developers | {{dev_provider}} | Optional |

## 4. Training Records

### Employee: [Name]
| Date | Training | Provider | Result | Certificate |
|------|----------|----------|--------|-------------|
{{training_records_table}}

## 5. Competence Evaluation
**Evaluation Method:** {{evaluation_method}}
**Evaluation Frequency:** {{evaluation_frequency}}

**Document Owner:** {{document_owner}}
**Last Updated:** {{last_updated}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      ciso_qualifications: { type: 'text', label: 'CISO Minimum Qualifications', required: true },
      engineer_qualifications: { type: 'text', label: 'Engineer Qualifications', required: false },
      analyst_qualifications: { type: 'text', label: 'Analyst Qualifications', required: false },
      admin_qualifications: { type: 'text', label: 'Admin Qualifications', required: false },
      awareness_duration: { type: 'text', label: 'Awareness Training Duration', required: true },
      evaluation_method: { type: 'select', label: 'Evaluation Method', required: true, options: ['Testing', 'Performance Review', 'Practical Assessment', 'Certification'] },
      evaluation_frequency: { type: 'select', label: 'Evaluation Frequency', required: true, options: ['Annually', 'Bi-annually', 'Upon Role Change'] },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      last_updated: { type: 'date', label: 'Last Updated', required: true }
    }
  },
  {
    id: 'iso-011',
    title: 'Document Control Procedure',
    description: 'Procedure for controlling ISMS documented information (Clause 7.5)',
    framework: 'ISO27001',
    category: 'procedure',
    priority: 11,
    documentType: 'procedure',
    required: true,
    templateContent: `# Document Control Procedure

## 1. Purpose
This procedure establishes controls for documented information required by the ISMS at {{company_name}}.

## 2. Scope
Applies to all ISMS documents including policies, procedures, records, and forms.

## 3. Document Identification

### 3.1 Naming Convention
- Format: [Type]-[Number]-[Title]
- Example: POL-001-Information-Security-Policy

### 3.2 Version Control
- Major changes: Increment major version (1.0 to 2.0)
- Minor changes: Increment minor version (1.0 to 1.1)

## 4. Document Creation and Review

### 4.1 Creation Process
1. Author drafts document using approved template
2. Review by subject matter experts
3. Approval by document owner
4. Publication and distribution

### 4.2 Review Cycle
| Document Type | Review Frequency | Reviewer |
|---------------|------------------|----------|
| Policies | Annual | {{policy_reviewer}} |
| Procedures | Annual | Process owners |
| Records | As needed | Record owners |
| Forms | Annual | Process owners |

## 5. Document Approval

### 5.1 Approval Authority
| Document Level | Approver |
|----------------|----------|
| Policies | {{policy_approver}} |
| Procedures | Department heads |
| Work instructions | Team leads |

## 6. Distribution and Access

### 6.1 Document Repository
- Location: {{document_repository}}
- Access control: Role-based

### 6.2 Distribution
- Electronic distribution via {{distribution_method}}
- Notification of updates via {{notification_method}}

## 7. Retention and Disposal

### 7.1 Retention Periods
| Document Type | Retention Period |
|---------------|------------------|
| Policies | {{policy_retention}} years after supersession |
| Audit records | {{audit_retention}} years |
| Training records | {{training_retention}} years |
| Incident records | {{incident_retention}} years |

### 7.2 Disposal
- Secure disposal method: {{disposal_method}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      policy_reviewer: { type: 'text', label: 'Policy Reviewer', required: true },
      policy_approver: { type: 'text', label: 'Policy Approver', required: true },
      document_repository: { type: 'text', label: 'Document Repository Location', required: true },
      distribution_method: { type: 'text', label: 'Distribution Method', required: true },
      notification_method: { type: 'text', label: 'Notification Method', required: true },
      policy_retention: { type: 'number', label: 'Policy Retention (years)', required: true },
      audit_retention: { type: 'number', label: 'Audit Retention (years)', required: true },
      training_retention: { type: 'number', label: 'Training Retention (years)', required: true },
      incident_retention: { type: 'number', label: 'Incident Retention (years)', required: true },
      disposal_method: { type: 'select', label: 'Disposal Method', required: true, options: ['Shredding', 'Secure Deletion', 'Incineration'] },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'iso-012',
    title: 'Incident Response Procedure',
    description: 'Information security incident management procedure (Annex A.5.24-A.5.28)',
    framework: 'ISO27001',
    category: 'procedure',
    priority: 12,
    documentType: 'procedure',
    required: true,
    templateContent: `# Incident Response Procedure

## 1. Purpose
This procedure defines {{company_name}}'s approach to managing information security incidents.

## 2. Scope
All suspected and confirmed information security events and incidents.

## 3. Definitions
- **Security Event:** Observable occurrence relevant to information security
- **Security Incident:** One or more security events that compromise CIA

## 4. Incident Classification

| Severity | Description | Response Time | Escalation |
|----------|-------------|---------------|------------|
| Critical | Major breach, data loss, system down | {{critical_response}} minutes | Executive team |
| High | Significant impact, potential breach | {{high_response}} hours | Security manager |
| Medium | Limited impact, contained | {{medium_response}} hours | Security team |
| Low | Minor event, no business impact | {{low_response}} business days | IT support |

## 5. Incident Response Phases

### 5.1 Detection and Reporting
- Report to: {{incident_email}}
- Hotline: {{incident_phone}}
- All employees required to report suspected incidents

### 5.2 Triage and Classification
- Initial assessment within {{triage_time}} minutes
- Classify severity and type
- Assign incident handler

### 5.3 Containment
- Isolate affected systems
- Preserve evidence
- Prevent further damage

### 5.4 Eradication
- Remove threat/vulnerability
- Patch systems
- Reset compromised credentials

### 5.5 Recovery
- Restore systems from clean backups
- Verify system integrity
- Monitor for recurrence

### 5.6 Post-Incident Review
- Conduct within {{review_days}} days of closure
- Document lessons learned
- Update procedures as needed

## 6. Evidence Collection
- Chain of custody maintained
- Forensic imaging when required
- Secure evidence storage

## 7. External Reporting
- Regulatory notification: {{regulatory_notification}}
- Law enforcement: {{law_enforcement}}
- Customer notification: As required by contracts/law

**Incident Response Lead:** {{ir_lead}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      critical_response: { type: 'number', label: 'Critical Response Time (minutes)', required: true },
      high_response: { type: 'number', label: 'High Response Time (hours)', required: true },
      medium_response: { type: 'number', label: 'Medium Response Time (hours)', required: true },
      low_response: { type: 'number', label: 'Low Response Time (business days)', required: true },
      incident_email: { type: 'text', label: 'Incident Report Email', required: true },
      incident_phone: { type: 'text', label: 'Incident Hotline', required: true },
      triage_time: { type: 'number', label: 'Triage Time (minutes)', required: true },
      review_days: { type: 'number', label: 'Post-Incident Review Days', required: true },
      ir_lead: { type: 'text', label: 'Incident Response Lead', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'iso-013',
    title: 'Access Control Policy',
    description: 'Policy for logical and physical access control (Annex A.5.15-A.5.18, A.8.2-A.8.5)',
    framework: 'ISO27001',
    category: 'policy',
    priority: 13,
    documentType: 'policy',
    required: true,
    templateContent: `# Access Control Policy

## 1. Purpose
This policy establishes access control requirements for {{company_name}}'s information systems and facilities.

## 2. Scope
All users, systems, applications, and facilities within the ISMS scope.

## 3. Access Control Principles
- **Need-to-know:** Access based on job requirements
- **Least privilege:** Minimum necessary permissions
- **Segregation of duties:** Prevent conflicts of interest

## 4. User Access Management

### 4.1 User Registration
- Unique user ID required
- No shared accounts (except documented exceptions)
- Approval required before access granted

### 4.2 Privilege Management
- Privileged access requires additional approval
- Privileged accounts monitored
- Regular review of elevated permissions

### 4.3 Authentication
- Password requirements: {{password_requirements}}
- Multi-factor authentication: {{mfa_scope}}
- Session timeout: {{session_timeout}} minutes

### 4.4 Access Review
- Standard user access: {{standard_review_frequency}}
- Privileged access: {{privileged_review_frequency}}
- System/application access: Annual

## 5. Access Rights Lifecycle

### 5.1 Joiners
- Access provisioned upon HR notification
- Appropriate access based on role
- Training completion required

### 5.2 Movers
- Access adjusted upon role change
- Previous access removed promptly
- New access approved by new manager

### 5.3 Leavers
- Access disabled on last day
- All accounts terminated within {{termination_hours}} hours
- Physical access credentials returned

## 6. Remote Access
- VPN required for remote system access
- MFA mandatory for remote access
- Personal device requirements: {{byod_requirements}}

## 7. Physical Access
- Badge access for facilities
- Visitor escorting required
- Sensitive areas: Additional authorization

**Policy Owner:** {{policy_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}
**Review Date:** {{review_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      password_requirements: { type: 'text', label: 'Password Requirements', required: true },
      mfa_scope: { type: 'text', label: 'MFA Scope', required: true },
      session_timeout: { type: 'number', label: 'Session Timeout (minutes)', required: true },
      standard_review_frequency: { type: 'select', label: 'Standard Access Review', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] },
      privileged_review_frequency: { type: 'select', label: 'Privileged Access Review', required: true, options: ['Monthly', 'Quarterly', 'Semi-annually'] },
      termination_hours: { type: 'number', label: 'Termination Disable Hours', required: true },
      byod_requirements: { type: 'text', label: 'BYOD Requirements', required: false },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true },
      review_date: { type: 'date', label: 'Review Date', required: true }
    }
  },
  {
    id: 'iso-014',
    title: 'Business Continuity Plan',
    description: 'ICT readiness for business continuity (Annex A.5.30)',
    framework: 'ISO27001',
    category: 'plan',
    priority: 14,
    documentType: 'plan',
    required: true,
    templateContent: `# Business Continuity Plan

## 1. Purpose
This plan ensures {{company_name}} can maintain critical operations during disruptive events.

## 2. Scope
Critical business processes, systems, and facilities.

## 3. Critical Business Functions

| Function | RTO | RPO | Dependencies | Owner |
|----------|-----|-----|--------------|-------|
| {{function_1}} | {{rto_1}} hours | {{rpo_1}} hours | {{deps_1}} | {{owner_1}} |
| {{function_2}} | {{rto_2}} hours | {{rpo_2}} hours | {{deps_2}} | {{owner_2}} |
| {{function_3}} | {{rto_3}} hours | {{rpo_3}} hours | {{deps_3}} | {{owner_3}} |

## 4. Recovery Strategies

### 4.1 IT Systems
- Primary data center: {{primary_dc}}
- Secondary/DR site: {{dr_site}}
- Failover mechanism: {{failover_type}}
- Backup frequency: {{backup_frequency}}

### 4.2 Alternate Work Sites
- Primary alternate: {{alternate_site}}
- Remote work capabilities: {{remote_capabilities}}

### 4.3 Communication
- Primary: {{primary_comm}}
- Secondary: {{secondary_comm}}
- Emergency notification: {{emergency_notification}}

## 5. Response Procedures

### 5.1 Incident Assessment
1. Assess scope and impact
2. Determine if BC activation needed
3. Notify BC team

### 5.2 Plan Activation
1. BC Coordinator initiates response
2. Notify stakeholders
3. Activate recovery teams

### 5.3 Recovery Execution
1. Execute recovery procedures
2. Validate critical systems
3. Resume operations

### 5.4 Return to Normal
1. Assess stability
2. Plan transition back
3. Document lessons learned

## 6. Testing and Maintenance
- Tabletop exercises: {{tabletop_frequency}}
- Technical DR tests: {{dr_test_frequency}}
- Full simulation: {{simulation_frequency}}
- Plan review: Annual

## 7. Contact Information
**BC Coordinator:** {{bc_coordinator}}
**Alternate:** {{bc_alternate}}
**Emergency Line:** {{emergency_line}}

**Plan Owner:** {{plan_owner}}
**Approved By:** {{approved_by}}
**Last Tested:** {{last_tested}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      function_1: { type: 'text', label: 'Critical Function 1', required: true },
      rto_1: { type: 'number', label: 'RTO 1 (hours)', required: true },
      rpo_1: { type: 'number', label: 'RPO 1 (hours)', required: true },
      primary_dc: { type: 'text', label: 'Primary Data Center', required: true },
      dr_site: { type: 'text', label: 'DR Site', required: true },
      failover_type: { type: 'select', label: 'Failover Type', required: true, options: ['Manual', 'Automated', 'Warm Standby', 'Hot Standby'] },
      backup_frequency: { type: 'select', label: 'Backup Frequency', required: true, options: ['Continuous', 'Hourly', 'Daily', 'Weekly'] },
      tabletop_frequency: { type: 'select', label: 'Tabletop Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] },
      dr_test_frequency: { type: 'select', label: 'DR Test Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] },
      bc_coordinator: { type: 'text', label: 'BC Coordinator', required: true },
      plan_owner: { type: 'text', label: 'Plan Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      last_tested: { type: 'date', label: 'Last Tested', required: true }
    }
  },
  {
    id: 'iso-015',
    title: 'Risk Treatment Plan',
    description: 'ISO 27001:2022 Clause 6.1.3 - Risk treatment decisions and implementation plan',
    framework: 'ISO27001',
    category: 'risk',
    priority: 2,
    documentType: 'plan',
    required: true,
    templateContent: `# Risk Treatment Plan
## ISO/IEC 27001:2022 - Clause 6.1.3

**Document Owner:** {{document_owner}}
**Version:** {{version}}
**Date:** {{document_date}}

## 1. Risk Treatment Objectives
{{treatment_objectives}}

## 2. Risk Treatment Options
For each identified risk, one of the following treatments must be selected:
- Avoid: Eliminate the risk source
- Reduce: Implement controls to mitigate
- Transfer: Share or transfer to third party
- Accept: Acknowledge and accept residual risk

## 3. Risk Treatment Decisions

| Risk ID | Risk Description | Risk Level | Treatment Option | Controls | Owner | Timeline |
|---------|------------------|------------|------------------|----------|-------|----------|
| {{risk_1_id}} | {{risk_1_desc}} | {{risk_1_level}} | {{risk_1_treatment}} | {{risk_1_controls}} | {{risk_1_owner}} | {{risk_1_timeline}} |

## 4. Implementation Plan
**Phase 1:** {{phase_1}}
**Phase 2:** {{phase_2}}
**Completion Target:** {{completion_target}}

## 5. Residual Risk Acceptance
**Accepted Residual Risks:** {{residual_risks}}
**Acceptance Authority:** {{acceptance_authority}}

**Approved By:** {{approved_by}}
**Approval Date:** {{approval_date}}`,
    templateVariables: {
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      version: { type: 'text', label: 'Version', required: true },
      document_date: { type: 'date', label: 'Document Date', required: true },
      treatment_objectives: { type: 'text', label: 'Treatment Objectives', required: true },
      risk_1_id: { type: 'text', label: 'Risk 1 ID', required: true },
      risk_1_desc: { type: 'text', label: 'Risk 1 Description', required: true },
      risk_1_level: { type: 'select', label: 'Risk 1 Level', required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
      risk_1_treatment: { type: 'select', label: 'Risk 1 Treatment', required: true, options: ['Avoid', 'Reduce', 'Transfer', 'Accept'] },
      risk_1_controls: { type: 'text', label: 'Risk 1 Controls', required: true },
      risk_1_owner: { type: 'text', label: 'Risk 1 Owner', required: true },
      risk_1_timeline: { type: 'text', label: 'Risk 1 Timeline', required: true },
      phase_1: { type: 'text', label: 'Phase 1 Description', required: true },
      phase_2: { type: 'text', label: 'Phase 2 Description', required: true },
      completion_target: { type: 'date', label: 'Completion Target', required: true },
      residual_risks: { type: 'text', label: 'Residual Risks', required: true },
      acceptance_authority: { type: 'text', label: 'Risk Acceptance Authority', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'iso-016',
    title: 'Risk Register',
    description: 'ISO 27001:2022 Clause 6.1.2 - Central register of information security risks',
    framework: 'ISO27001',
    category: 'risk',
    priority: 2,
    documentType: 'register',
    required: true,
    templateContent: `# Information Security Risk Register
## ISO/IEC 27001:2022 - Clause 6.1.2

**Organization:** {{company_name}}
**ISMS Scope:** {{isms_scope}}
**Register Date:** {{register_date}}
**Version:** {{version}}

## Risk Assessment Summary
**Total Risks Identified:** {{total_risks}}
**High/Critical:** {{high_risks}}
**Medium:** {{medium_risks}}
**Low:** {{low_risks}}

## Risk Register

| ID | Asset | Threat | Vulnerability | Likelihood | Impact | Risk Level | Treatment | Status | Owner |
|----|-------|--------|---------------|------------|--------|------------|-----------|--------|-------|
| R-001 | {{asset_1}} | {{threat_1}} | {{vuln_1}} | {{likelihood_1}} | {{impact_1}} | {{level_1}} | {{treatment_1}} | {{status_1}} | {{owner_1}} |

## Risk Matrix
**Likelihood Scale:** {{likelihood_scale}}
**Impact Scale:** {{impact_scale}}

## Review Schedule
**Review Frequency:** {{review_frequency}}
**Next Review:** {{next_review}}
**Risk Owner:** {{risk_owner}}

**Maintained By:** {{maintained_by}}
**Last Updated:** {{last_updated}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      isms_scope: { type: 'text', label: 'ISMS Scope', required: true },
      register_date: { type: 'date', label: 'Register Date', required: true },
      version: { type: 'text', label: 'Version', required: true },
      total_risks: { type: 'number', label: 'Total Risks', required: true },
      high_risks: { type: 'number', label: 'High/Critical Risks', required: true },
      medium_risks: { type: 'number', label: 'Medium Risks', required: true },
      low_risks: { type: 'number', label: 'Low Risks', required: true },
      asset_1: { type: 'text', label: 'Asset 1', required: true },
      threat_1: { type: 'text', label: 'Threat 1', required: true },
      vuln_1: { type: 'text', label: 'Vulnerability 1', required: true },
      likelihood_1: { type: 'select', label: 'Likelihood 1', required: true, options: ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'] },
      impact_1: { type: 'select', label: 'Impact 1', required: true, options: ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'] },
      level_1: { type: 'select', label: 'Risk Level 1', required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
      treatment_1: { type: 'select', label: 'Treatment 1', required: true, options: ['Avoid', 'Reduce', 'Transfer', 'Accept'] },
      status_1: { type: 'select', label: 'Status 1', required: true, options: ['Open', 'In Progress', 'Mitigated', 'Accepted'] },
      owner_1: { type: 'text', label: 'Risk Owner 1', required: true },
      likelihood_scale: { type: 'text', label: 'Likelihood Scale Definition', required: true },
      impact_scale: { type: 'text', label: 'Impact Scale Definition', required: true },
      review_frequency: { type: 'select', label: 'Review Frequency', required: true, options: ['Monthly', 'Quarterly', 'Semi-annually', 'Annually'] },
      next_review: { type: 'date', label: 'Next Review Date', required: true },
      risk_owner: { type: 'text', label: 'Risk Owner', required: true },
      maintained_by: { type: 'text', label: 'Maintained By', required: true },
      last_updated: { type: 'date', label: 'Last Updated', required: true }
    }
  },
  {
    id: 'iso-017',
    title: 'Internal Audit Program',
    description: 'ISO 27001:2022 Clause 9.2 - ISMS internal audit program and procedures',
    framework: 'ISO27001',
    category: 'audit',
    priority: 1,
    documentType: 'program',
    required: true,
    templateContent: `# Internal Audit Program
## ISO/IEC 27001:2022 - Clause 9.2

**Organization:** {{company_name}}
**Program Year:** {{program_year}}
**Version:** {{version}}

## 1. Audit Objectives
- Verify ISMS conformity to ISO 27001:2022
- Assess effectiveness of implemented controls
- Identify improvement opportunities
- Ensure compliance with organizational requirements

## 2. Audit Scope
**ISMS Scope:** {{isms_scope}}
**Locations:** {{audit_locations}}
**Processes:** {{audit_processes}}

## 3. Audit Schedule

| Quarter | Audit Focus | Clauses | Controls | Auditor | Dates |
|---------|-------------|---------|----------|---------|-------|
| Q1 | {{q1_focus}} | {{q1_clauses}} | {{q1_controls}} | {{q1_auditor}} | {{q1_dates}} |
| Q2 | {{q2_focus}} | {{q2_clauses}} | {{q2_controls}} | {{q2_auditor}} | {{q2_dates}} |

## 4. Audit Criteria
- ISO/IEC 27001:2022 requirements
- Organizational policies and procedures
- Applicable legal and regulatory requirements
- {{custom_criteria}}

## 5. Audit Team
**Lead Auditor:** {{lead_auditor}}
**Auditors:** {{auditors}}
**Competence Requirements:** {{competence_requirements}}

## 6. Audit Process
1. **Planning:** Audit plan development
2. **Preparation:** Document review, checklists
3. **Execution:** Opening meeting, interviews, evidence collection
4. **Reporting:** Findings, nonconformities, observations
5. **Follow-up:** Corrective actions verification

## 7. Reporting
**Audit Report Recipients:** {{report_recipients}}
**Report Timeline:** {{report_timeline}}
**Findings Classification:** {{findings_classification}}

## 8. Independence
**Auditor Independence:** {{independence_requirements}}

**Program Owner:** {{program_owner}}
**Approved By:** {{approved_by}}
**Approval Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      program_year: { type: 'text', label: 'Program Year', required: true },
      version: { type: 'text', label: 'Version', required: true },
      isms_scope: { type: 'text', label: 'ISMS Scope', required: true },
      audit_locations: { type: 'text', label: 'Audit Locations', required: true },
      audit_processes: { type: 'text', label: 'Audit Processes', required: true },
      q1_focus: { type: 'text', label: 'Q1 Focus Area', required: true },
      q1_clauses: { type: 'text', label: 'Q1 Clauses', required: true },
      q1_controls: { type: 'text', label: 'Q1 Controls', required: true },
      q1_auditor: { type: 'text', label: 'Q1 Auditor', required: true },
      q1_dates: { type: 'text', label: 'Q1 Dates', required: true },
      q2_focus: { type: 'text', label: 'Q2 Focus Area', required: true },
      q2_clauses: { type: 'text', label: 'Q2 Clauses', required: true },
      q2_controls: { type: 'text', label: 'Q2 Controls', required: true },
      q2_auditor: { type: 'text', label: 'Q2 Auditor', required: true },
      q2_dates: { type: 'text', label: 'Q2 Dates', required: true },
      custom_criteria: { type: 'text', label: 'Additional Criteria', required: false },
      lead_auditor: { type: 'text', label: 'Lead Auditor', required: true },
      auditors: { type: 'text', label: 'Audit Team Members', required: true },
      competence_requirements: { type: 'text', label: 'Competence Requirements', required: true },
      report_recipients: { type: 'text', label: 'Report Recipients', required: true },
      report_timeline: { type: 'select', label: 'Report Timeline', required: true, options: ['Within 1 week', 'Within 2 weeks', 'Within 1 month'] },
      findings_classification: { type: 'text', label: 'Findings Classification', required: true },
      independence_requirements: { type: 'text', label: 'Independence Requirements', required: true },
      program_owner: { type: 'text', label: 'Program Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'iso-018',
    title: 'Management Review Records',
    description: 'ISO 27001:2022 Clause 9.3 - Top management ISMS review documentation',
    framework: 'ISO27001',
    category: 'governance',
    priority: 1,
    documentType: 'minutes',
    required: true,
    templateContent: `# Management Review Meeting
## ISO/IEC 27001:2022 - Clause 9.3

**Meeting Date:** {{meeting_date}}
**Chairperson:** {{chairperson}}

## 1. Review Inputs
**Previous Actions:** {{previous_actions}}
**External/Internal Changes:** {{changes}}
**Security Incidents:** {{incidents}}
**Audit Results:** {{audit_results}}
**Risk Assessment:** {{risk_results}}

## 2. Review Outputs
**Improvement Decisions:** {{improvements}}
**ISMS Changes:** {{isms_changes}}
**Resources:** {{resources}}

## 3. Actions
| Action | Owner | Due Date |
|--------|-------|----------|
| {{action_1}} | {{owner_1}} | {{due_1}} |

**Approved By:** {{approved_by}}`,
    templateVariables: {
      meeting_date: { type: 'date', label: 'Meeting Date', required: true },
      chairperson: { type: 'text', label: 'Chairperson', required: true },
      previous_actions: { type: 'text', label: 'Previous Actions', required: true },
      changes: { type: 'text', label: 'Changes', required: true },
      incidents: { type: 'text', label: 'Incidents', required: true },
      audit_results: { type: 'text', label: 'Audit Results', required: true },
      risk_results: { type: 'text', label: 'Risk Results', required: true },
      improvements: { type: 'text', label: 'Improvements', required: true },
      isms_changes: { type: 'text', label: 'ISMS Changes', required: true },
      resources: { type: 'text', label: 'Resources', required: true },
      action_1: { type: 'text', label: 'Action 1', required: true },
      owner_1: { type: 'text', label: 'Owner 1', required: true },
      due_1: { type: 'date', label: 'Due Date 1', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true }
    }
  },
  {
    id: 'iso-019',
    title: 'Nonconformity and Corrective Action',
    description: 'ISO 27001:2022 Clause 10.1 - Procedure for handling nonconformities',
    framework: 'ISO27001',
    category: 'process',
    priority: 1,
    documentType: 'procedure',
    required: true,
    templateContent: `# Nonconformity and Corrective Action Procedure
## ISO/IEC 27001:2022 - Clause 10.1

**Organization:** {{company_name}}
**Version:** {{version}}

## 1. Nonconformity Documentation
**NC Number:** {{nc_number}}
**Description:** {{nc_description}}
**Severity:** {{nc_severity}}

## 2. Immediate Actions
**Actions:** {{immediate_actions}}
**Owner:** {{action_owner}}

## 3. Root Cause Analysis
**Method:** {{rca_method}}
**Root Causes:** {{root_causes}}

## 4. Corrective Action
**Action:** {{corrective_action}}
**Owner:** {{ca_owner}}
**Target Date:** {{ca_target}}

## 5. Effectiveness Review
**Review Date:** {{review_date}}
**Effective:** {{is_effective}}

**Procedure Owner:** {{procedure_owner}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      nc_number: { type: 'text', label: 'NC Number', required: true },
      nc_description: { type: 'text', label: 'NC Description', required: true },
      nc_severity: { type: 'select', label: 'Severity', required: true, options: ['Critical', 'High', 'Medium', 'Low'] },
      immediate_actions: { type: 'text', label: 'Immediate Actions', required: true },
      action_owner: { type: 'text', label: 'Action Owner', required: true },
      rca_method: { type: 'select', label: 'RCA Method', required: true, options: ['5 Whys', 'Fishbone', 'Fault Tree'] },
      root_causes: { type: 'text', label: 'Root Causes', required: true },
      corrective_action: { type: 'text', label: 'Corrective Action', required: true },
      ca_owner: { type: 'text', label: 'CA Owner', required: true },
      ca_target: { type: 'date', label: 'Target Date', required: true },
      review_date: { type: 'date', label: 'Review Date', required: true },
      is_effective: { type: 'select', label: 'Effective?', required: true, options: ['Yes', 'No', 'Pending'] },
      procedure_owner: { type: 'text', label: 'Procedure Owner', required: true }
    }
  },
  {
    id: 'iso-020',
    title: 'Business Continuity Plan',
    description: 'ISO 27001:2022 Annex A.5.29/A.5.30 - Business continuity and disaster recovery',
    framework: 'ISO27001',
    category: 'continuity',
    priority: 1,
    documentType: 'plan',
    required: true,
    templateContent: `# Business Continuity Plan
## ISO/IEC 27001:2022 - Annex A.5.29, A.5.30

**Organization:** {{company_name}}
**Version:** {{version}}

## 1. Critical Functions
| Function | RTO | RPO | Owner |
|----------|-----|-----|-------|
| {{function_1}} | {{rto_1}} | {{rpo_1}} | {{owner_1}} |

## 2. Recovery Strategies
**Primary Site:** {{primary_site}}
**Backup Site:** {{backup_site}}
**Data Backup:** {{backup_strategy}}

## 3. Activation
**Trigger:** {{trigger_events}}
**Authority:** {{declaration_authority}}

## 4. Recovery Phases
**Phase 1 (0-4h):** {{phase_1}}
**Phase 2 (4-24h):** {{phase_2}}
**Phase 3 (24-72h):** {{phase_3}}

## 5. Testing
**Frequency:** {{test_frequency}}
**Last Test:** {{last_test}}

**Plan Owner:** {{plan_owner}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      function_1: { type: 'text', label: 'Critical Function', required: true },
      rto_1: { type: 'text', label: 'RTO', required: true },
      rpo_1: { type: 'text', label: 'RPO', required: true },
      owner_1: { type: 'text', label: 'Owner', required: true },
      primary_site: { type: 'text', label: 'Primary Site', required: true },
      backup_site: { type: 'text', label: 'Backup Site', required: true },
      backup_strategy: { type: 'text', label: 'Backup Strategy', required: true },
      trigger_events: { type: 'text', label: 'Trigger Events', required: true },
      declaration_authority: { type: 'text', label: 'Declaration Authority', required: true },
      phase_1: { type: 'text', label: 'Phase 1', required: true },
      phase_2: { type: 'text', label: 'Phase 2', required: true },
      phase_3: { type: 'text', label: 'Phase 3', required: true },
      test_frequency: { type: 'select', label: 'Test Frequency', required: true, options: ['Annually', 'Semi-annually', 'Quarterly'] },
      last_test: { type: 'date', label: 'Last Test', required: true },
      plan_owner: { type: 'text', label: 'Plan Owner', required: true }
    }
  },
  {
    id: 'iso-021',
    title: 'Access Control Policy',
    description: 'ISO 27001:2022 Annex A.5.15-A.5.18 - Access control and authentication',
    framework: 'ISO27001',
    category: 'policy',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Access Control Policy
## ISO/IEC 27001:2022 - Annex A.5.15-A.5.18

**Organization:** {{company_name}}
**Version:** {{version}}

## 1. User Access Management
**Provisioning:** {{provisioning_process}}
**Approval:** {{approval_required}}
**Removal:** {{removal_timeline}}

## 2. Authentication
**Password Length:** {{password_length}}
**Complexity:** {{password_complexity}}
**MFA Required:** {{mfa_required}}

## 3. Access Review
**Frequency:** {{review_frequency}}
**Owner:** {{review_owner}}

## 4. Remote Access
**Method:** {{remote_method}}
**Security:** {{remote_security}}

**Policy Owner:** {{policy_owner}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      provisioning_process: { type: 'text', label: 'Provisioning Process', required: true },
      approval_required: { type: 'text', label: 'Approval Required', required: true },
      removal_timeline: { type: 'select', label: 'Removal Timeline', required: true, options: ['Immediate', '24 hours', '48 hours'] },
      password_length: { type: 'number', label: 'Min Password Length', required: true },
      password_complexity: { type: 'text', label: 'Complexity Requirements', required: true },
      mfa_required: { type: 'select', label: 'MFA Required?', required: true, options: ['Yes', 'No', 'Conditional'] },
      review_frequency: { type: 'select', label: 'Review Frequency', required: true, options: ['Monthly', 'Quarterly', 'Annually'] },
      review_owner: { type: 'text', label: 'Review Owner', required: true },
      remote_method: { type: 'text', label: 'Remote Access Method', required: true },
      remote_security: { type: 'text', label: 'Remote Security', required: true },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true }
    }
  },
  {
    id: 'iso-022',
    title: 'Asset Management Policy',
    description: 'ISO 27001:2022 Annex A.5.9-A.5.14 - Information asset management',
    framework: 'ISO27001',
    category: 'policy',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Asset Management Policy
## ISO/IEC 27001:2022 - Annex A.5.9-A.5.14

**Organization:** {{company_name}}
**Version:** {{version}}

## 1. Asset Inventory
**Register:** {{asset_register}}
**Update Frequency:** {{update_frequency}}

## 2. Classification
**Public:** {{public_def}}
**Internal:** {{internal_def}}
**Confidential:** {{confidential_def}}
**Restricted:** {{restricted_def}}

## 3. Handling
**Storage:** {{storage_req}}
**Transmission:** {{transmission_req}}
**Disposal:** {{disposal_req}}

## 4. Media Handling
**Removable Media:** {{removable_policy}}
**Encryption:** {{media_encryption}}

**Policy Owner:** {{policy_owner}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      asset_register: { type: 'text', label: 'Asset Register Location', required: true },
      update_frequency: { type: 'select', label: 'Update Frequency', required: true, options: ['Real-time', 'Weekly', 'Monthly'] },
      public_def: { type: 'text', label: 'Public Definition', required: true },
      internal_def: { type: 'text', label: 'Internal Definition', required: true },
      confidential_def: { type: 'text', label: 'Confidential Definition', required: true },
      restricted_def: { type: 'text', label: 'Restricted Definition', required: true },
      storage_req: { type: 'text', label: 'Storage Requirements', required: true },
      transmission_req: { type: 'text', label: 'Transmission Requirements', required: true },
      disposal_req: { type: 'text', label: 'Disposal Requirements', required: true },
      removable_policy: { type: 'text', label: 'Removable Media Policy', required: true },
      media_encryption: { type: 'select', label: 'Media Encryption?', required: true, options: ['Yes', 'No', 'Conditional'] },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true }
    }
  },
  {
    id: 'iso-023',
    title: 'Communication Plan',
    description: 'ISO 27001:2022 Clause 7.4 - Internal and external ISMS communication',
    framework: 'ISO27001',
    category: 'plan',
    priority: 2,
    documentType: 'plan',
    required: true,
    templateContent: `# ISMS Communication Plan
## ISO/IEC 27001:2022 - Clause 7.4

**Organization:** {{company_name}}
**Version:** {{version}}

## 1. Internal Communications
**Staff:** {{staff_comms}}
**Management:** {{mgmt_comms}}
**Frequency:** {{internal_frequency}}

## 2. External Communications
**Customers:** {{customer_comms}}
**Suppliers:** {{supplier_comms}}
**Regulators:** {{regulator_comms}}

## 3. Incident Communications
**Process:** {{incident_process}}
**Spokesperson:** {{spokesperson}}

## 4. Tools
**Primary:** {{primary_tool}}
**Backup:** {{backup_tool}}

**Plan Owner:** {{plan_owner}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      staff_comms: { type: 'text', label: 'Staff Communications', required: true },
      mgmt_comms: { type: 'text', label: 'Management Communications', required: true },
      internal_frequency: { type: 'select', label: 'Internal Frequency', required: true, options: ['Weekly', 'Monthly', 'Quarterly'] },
      customer_comms: { type: 'text', label: 'Customer Communications', required: true },
      supplier_comms: { type: 'text', label: 'Supplier Communications', required: true },
      regulator_comms: { type: 'text', label: 'Regulator Communications', required: true },
      incident_process: { type: 'text', label: 'Incident Process', required: true },
      spokesperson: { type: 'text', label: 'Spokesperson', required: true },
      primary_tool: { type: 'text', label: 'Primary Tool', required: true },
      backup_tool: { type: 'text', label: 'Backup Tool', required: true },
      plan_owner: { type: 'text', label: 'Plan Owner', required: true }
    }
  }
];

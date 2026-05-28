import { DocumentTemplate } from '../types';

export const OperationalCoreTemplates: DocumentTemplate[] = [
  {
    id: 'sop-001',
    title: 'Standard Operating Procedure (SOP) Template',
    description: 'General purpose SOP template for operational procedures',
    framework: 'General',
    category: 'procedure',
    priority: 3,
    documentType: 'procedure',
    required: false,
    templateContent: `# Standard Operating Procedure: {{sop_title}}

**SOP ID:** {{sop_id}}
**Version:** {{version}}
**Effective Date:** {{effective_date}}
**Department:** {{department}}

## 1. Purpose
{{purpose_description}}

## 2. Scope
{{scope_description}}

## 3. Responsibilities
| Role | Responsibility |
|------|----------------|
| {{role_1}} | {{resp_1}} |
| {{role_2}} | {{resp_2}} |

## 4. Definitions
- **{{term_1}}:** {{def_1}}
- **{{term_2}}:** {{def_2}}

## 5. Procedure Steps

### 5.1 Pre-requisites
- {{prereq_1}}
- {{prereq_2}}

### 5.2 Step-by-Step Instructions
1. **{{step_1_title}}**
   - {{step_1_detail}}
   - {{step_1_note}}

2. **{{step_2_title}}**
   - {{step_2_detail}}
   - {{step_2_warning}}

3. **{{step_3_title}}**
   - {{step_3_detail}}

### 5.3 Verification
- {{verif_step_1}}
- {{verif_step_2}}

## 6. Troubleshooting
| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| {{issue_1}} | {{cause_1}} | {{sol_1}} |
| {{issue_2}} | {{cause_2}} | {{sol_2}} |

## 7. References
- {{ref_doc_1}}
- {{ref_doc_2}}

**Prepared By:** {{prepared_by}}
**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      sop_title: { type: 'text', label: 'SOP Title', required: true },
      sop_id: { type: 'text', label: 'SOP ID', required: true },
      version: { type: 'text', label: 'Version', required: true },
      department: { type: 'text', label: 'Department', required: true },
      purpose_description: { type: 'text', label: 'Purpose', required: true },
      scope_description: { type: 'text', label: 'Scope', required: true },
      role_1: { type: 'text', label: 'Role 1', required: false },
      resp_1: { type: 'text', label: 'Responsibility 1', required: false },
      role_2: { type: 'text', label: 'Role 2', required: false },
      resp_2: { type: 'text', label: 'Responsibility 2', required: false },
      term_1: { type: 'text', label: 'Term 1', required: false },
      def_1: { type: 'text', label: 'Definition 1', required: false },
      term_2: { type: 'text', label: 'Term 2', required: false },
      def_2: { type: 'text', label: 'Definition 2', required: false },
      prereq_1: { type: 'text', label: 'Pre-requisite 1', required: false },
      prereq_2: { type: 'text', label: 'Pre-requisite 2', required: false },
      step_1_title: { type: 'text', label: 'Step 1 Title', required: true },
      step_1_detail: { type: 'text', label: 'Step 1 Detail', required: true },
      step_1_note: { type: 'text', label: 'Step 1 Note', required: false },
      step_2_title: { type: 'text', label: 'Step 2 Title', required: false },
      step_2_detail: { type: 'text', label: 'Step 2 Detail', required: false },
      step_2_warning: { type: 'text', label: 'Step 2 Warning', required: false },
      step_3_title: { type: 'text', label: 'Step 3 Title', required: false },
      step_3_detail: { type: 'text', label: 'Step 3 Detail', required: false },
      verif_step_1: { type: 'text', label: 'Verification Step 1', required: false },
      verif_step_2: { type: 'text', label: 'Verification Step 2', required: false },
      issue_1: { type: 'text', label: 'Issue 1', required: false },
      cause_1: { type: 'text', label: 'Cause 1', required: false },
      sol_1: { type: 'text', label: 'Solution 1', required: false },
      issue_2: { type: 'text', label: 'Issue 2', required: false },
      cause_2: { type: 'text', label: 'Cause 2', required: false },
      sol_2: { type: 'text', label: 'Solution 2', required: false },
      ref_doc_1: { type: 'text', label: 'Reference Document 1', required: false },
      ref_doc_2: { type: 'text', label: 'Reference Document 2', required: false },
      prepared_by: { type: 'text', label: 'Prepared By', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'role-001',
    title: 'Role Description Template',
    description: 'Template for defining security roles and responsibilities',
    framework: 'General',
    category: 'policy',
    priority: 3,
    documentType: 'policy',
    required: false,
    templateContent: `# Role Description: {{role_title}}

**Role ID:** {{role_id}}
**Department:** {{department}}
**Reports To:** {{reports_to}}
**Date:** {{date}}

## 1. Role Purpose
{{role_purpose}}

## 2. Key Security Responsibilities
The {{role_title}} is responsible for the following security functions:
1. {{sec_resp_1}}
2. {{sec_resp_2}}
3. {{sec_resp_3}}
4. {{sec_resp_4}}

## 3. Access Rights
This role requires the following system access:
| System | Access Level | Justification |
|--------|--------------|---------------|
| {{sys_1}} | {{level_1}} | {{just_1}} |
| {{sys_2}} | {{level_2}} | {{just_2}} |
| {{sys_3}} | {{level_3}} | {{just_3}} |

## 4. Training Requirements
required training for this role:
- {{train_1}}
- {{train_2}}
- {{train_3}}

## 5. Performance Metrics
Security performance will be measured by:
- {{metric_1}}
- {{metric_2}}

## 6. Acknowledgement
I understand and accept the security responsibilities assigned to this role.

**Employee Name:** _______________________
**Signature:** _______________________
**Date:** _______________________`,
    templateVariables: {
      role_title: { type: 'text', label: 'Role Title', required: true },
      role_id: { type: 'text', label: 'Role ID', required: true },
      department: { type: 'text', label: 'Department', required: true },
      reports_to: { type: 'text', label: 'Reports To', required: true },
      date: { type: 'date', label: 'Date', required: true },
      role_purpose: { type: 'text', label: 'Role Purpose', required: true },
      sec_resp_1: { type: 'text', label: 'Security Responsibility 1', required: true },
      sec_resp_2: { type: 'text', label: 'Security Responsibility 2', required: true },
      sec_resp_3: { type: 'text', label: 'Security Responsibility 3', required: false },
      sec_resp_4: { type: 'text', label: 'Security Responsibility 4', required: false },
      sys_1: { type: 'text', label: 'System 1', required: true },
      level_1: { type: 'text', label: 'Access Level 1', required: true },
      just_1: { type: 'text', label: 'Justification 1', required: true },
      sys_2: { type: 'text', label: 'System 2', required: false },
      level_2: { type: 'text', label: 'Access Level 2', required: false },
      just_2: { type: 'text', label: 'Justification 2', required: false },
      sys_3: { type: 'text', label: 'System 3', required: false },
      level_3: { type: 'text', label: 'Access Level 3', required: false },
      just_3: { type: 'text', label: 'Justification 3', required: false },
      train_1: { type: 'text', label: 'Training 1', required: true },
      train_2: { type: 'text', label: 'Training 2', required: false },
      train_3: { type: 'text', label: 'Training 3', required: false },
      metric_1: { type: 'text', label: 'Metric 1', required: true },
      metric_2: { type: 'text', label: 'Metric 2', required: false }
    }
  },
  {
    id: 'logs-001',
    title: 'Log Management Policy and Plan',
    description: 'Comprehensive log management policy and operational plan',
    framework: 'General',
    category: 'policy',
    priority: 2,
    documentType: 'policy',
    required: true,
    templateContent: `# Log Management Policy and Plan
**Document ID:** LOG-001
**Version:** {{version}}
**Effective Date:** {{effective_date}}
**Owner:** {{document_owner}}

## 1. Purpose
The purpose of this policy is to establish requirements for the generation, transmission, storage, analysis, and disposal of audit logs to ensure {{logging_purpose}}.

## 2. Scope
This policy applies to all systems, applications, network devices, and databases within:
{{covered_systems}}

## 3. Roles and Responsibilities
| Role | Responsibilities |
|------|------------------|
| Security Team | Define logging requirements, monitor alerts |
| System Admins | Configure logging, ensure log transmission |
| Compliance Team | Review logs for regulatory compliance |
| Internal Audit | Verify logging controls |

## 4. Logging Requirements

### 4.1 Events to Log
The following events must be logged for all systems in scope:
1. **Authentication/Authorization:** Verification of identity, granting of access
2. **System Access:** Successful and unsuccessful login attempts
3. **Privileged Operations:** Use of administrative accounts/commands
4. **Data Access:** Access to sensitive data ({{sensitive_data_types}})
5. **System Changes:** Installation of software, changes to configuration
6. **Network Connections:** Inbound and outbound traffic, firewall decisions
7. **Errors/Exceptions:** Application crashes, database errors

### 4.2 Log Content
Each log entry must contain at minimum:
- Timestamp (NTP synchronized)
- Source IP/Device ID
- User ID/Account
- Event Type
- Event Status (Success/Failure)
- Affected Resource

## 5. Log Retention
| Log Type | Online Retention | Archive Retention |
|----------|------------------|-------------------|
| Authentication Logs | {{auth_log_retention}} | 1 year |
| System Logs | 90 days | 1 year |
| Application Logs | 30 days | 1 year |
| Security Alerts | 1 year | 3 years |

## 6. Monitoring and Review
- **Real-time Monitoring:** Security team monitors SIEM dashboard 24/7
- **Daily Review:** Review of critical alerts and failed logins
- **Weekly Review:** Review of privileged access and account changes
- **Monthly Review:** Review of trend analysis and capacity planning

## 7. Log Protection
- Logs must be protected from unauthorized access and modification
- Logs must be transmitted over encrypted channels (TLS)
- Log servers must be on a segregated network
- Access to log servers is restricted to authorized personnel only

## 8. Incident Response
Security events detected through logging must be handled according to the Incident Response Plan.

**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      version: { type: 'text', label: 'Version', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      logging_purpose: { type: 'text', label: 'Logging Purpose', required: true },
      covered_systems: { type: 'text', label: 'Covered Systems', required: true },
      sensitive_data_types: { type: 'text', label: 'Sensitive Data Types', required: true },
      auth_log_retention: { type: 'select', label: 'Authentication Log Retention', required: true, options: ['30 days', '90 days', '1 year', '7 years'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'checklist-001',
    title: 'Compliance Checklist Template',
    description: 'Comprehensive checklist template for compliance verification and audits',
    framework: 'General',
    category: 'checklist',
    priority: 4,
    documentType: 'checklist',
    required: false,
    templateContent: `# Compliance Checklist

## Checklist Information
**Title:** {{checklist_title}}
**Checklist ID:** {{checklist_id}}
**Version:** {{version}}
**Effective Date:** {{effective_date}}
**Applicable Framework:** {{applicable_framework}}
**Assessment Period:** {{assessment_period}}
**Assessor:** {{assessor_name}}
**Date Completed:** {{completion_date}}

## Instructions
1. Review each item carefully
2. Mark items as Complete (✓), Incomplete (✗), or Not Applicable (N/A)
3. Provide evidence or comments where indicated
4. Escalate any non-compliance immediately
5. Submit completed checklist within {{submission_timeframe}}

## Section 1: Governance and Management
### 1.1 Policy and Procedures
| Item | Status | Evidence | Comments |
|------|--------|----------|----------|
| Information security policy is current and approved | ⬜ | {{evidence_1_1}} | {{comments_1_1}} |
| Policies are reviewed annually | ⬜ | {{evidence_1_2}} | {{comments_1_2}} |
| All staff have acknowledged policy receipt | ⬜ | {{evidence_1_3}} | {{comments_1_3}} |
| Procedure documents are version controlled | ⬜ | {{evidence_1_4}} | {{comments_1_4}} |

### 1.2 Roles and Responsibilities
| Item | Status | Evidence | Comments |
|------|--------|----------|----------|
| Security roles are formally defined | ⬜ | {{evidence_2_1}} | {{comments_2_1}} |
| Role assignments are documented | ⬜ | {{evidence_2_2}} | {{comments_2_2}} |
| Segregation of duties is implemented | ⬜ | {{evidence_2_3}} | {{comments_2_3}} |
| Management approval for role changes | ⬜ | {{evidence_2_4}} | {{comments_2_4}} |

## Section 2: Risk Management
### 2.1 Risk Assessment
| Item | Status | Evidence | Comments |
|------|--------|----------|----------|
| Risk assessment methodology is documented | ⬜ | {{evidence_3_1}} | {{comments_3_1}} |
| Risk register is current and complete | ⬜ | {{evidence_3_2}} | {{comments_3_2}} |
| Risk assessments are conducted annually | ⬜ | {{evidence_3_3}} | {{comments_3_3}} |
| Risk treatment plans are implemented | ⬜ | {{evidence_3_4}} | {{comments_3_4}} |

### 2.2 Business Continuity
| Item | Status | Evidence | Comments |
|------|--------|----------|----------|
| Business continuity plan exists and is current | ⬜ | {{evidence_4_1}} | {{comments_4_1}} |
| BCP testing is conducted regularly | ⬜ | {{evidence_4_2}} | {{comments_4_2}} |
| Recovery time objectives are defined | ⬜ | {{evidence_4_3}} | {{comments_4_3}} |
| Backup procedures are tested | ⬜ | {{evidence_4_4}} | {{comments_4_4}} |

## Section 3: Access Control
### 3.1 User Access Management
| Item | Status | Evidence | Comments |
|------|--------|----------|----------|
| User access is based on job requirements | ⬜ | {{evidence_5_1}} | {{comments_5_1}} |
| Access requests are properly approved | ⬜ | {{evidence_5_2}} | {{comments_5_2}} |
| Regular access reviews are conducted | ⬜ | {{evidence_5_3}} | {{comments_5_3}} |
| Terminated user access is promptly removed | ⬜ | {{evidence_5_4}} | {{comments_5_4}} |

### 3.2 Privileged Access
| Item | Status | Evidence | Comments |
|------|--------|----------|----------|
| Privileged accounts are minimized | ⬜ | {{evidence_6_1}} | {{comments_6_1}} |
| Multi-factor authentication is implemented | ⬜ | {{evidence_6_2}} | {{comments_6_2}} |
| Privileged activities are logged and monitored | ⬜ | {{evidence_6_3}} | {{comments_6_3}} |
| Emergency access procedures exist | ⬜ | {{evidence_6_4}} | {{comments_6_4}} |

## Section 4: Data Protection
### 4.1 Data Classification
| Item | Status | Evidence | Comments |
|------|--------|----------|----------|
| Data classification scheme is implemented | ⬜ | {{evidence_7_1}} | {{comments_7_1}} |
| Sensitive data is identified and labeled | ⬜ | {{evidence_7_2}} | {{comments_7_2}} |
| Handling procedures match data classification | ⬜ | {{evidence_7_3}} | {{comments_7_3}} |
| Data retention schedules are enforced | ⬜ | {{evidence_7_4}} | {{comments_7_4}} |

### 4.2 Encryption and Protection
| Item | Status | Evidence | Comments |
|------|--------|----------|----------|
| Data at rest is encrypted per policy | ⬜ | {{evidence_8_1}} | {{comments_8_1}} |
| Data in transit is encrypted | ⬜ | {{evidence_8_2}} | {{comments_8_2}} |
| Encryption keys are properly managed | ⬜ | {{evidence_8_3}} | {{comments_8_3}} |
| Secure disposal procedures are followed | ⬜ | {{evidence_8_4}} | {{comments_8_4}} |

## Section 5: Monitoring and Incident Response
### 5.1 Security Monitoring
| Item | Status | Evidence | Comments |
|------|--------|----------|----------|
| Security events are monitored 24/7 | ⬜ | {{evidence_9_1}} | {{comments_9_1}} |
| Log retention meets regulatory requirements | ⬜ | {{evidence_9_2}} | {{comments_9_2}} |
| Automated alerting is configured | ⬜ | {{evidence_9_3}} | {{comments_9_3}} |
| Regular log reviews are conducted | ⬜ | {{evidence_9_4}} | {{comments_9_4}} |

### 5.2 Incident Management
| Item | Status | Evidence | Comments |
|------|--------|----------|----------|
| Incident response plan is current | ⬜ | {{evidence_10_1}} | {{comments_10_1}} |
| Incident response team is identified | ⬜ | {{evidence_10_2}} | {{comments_10_2}} |
| Incidents are promptly reported | ⬜ | {{evidence_10_3}} | {{comments_10_3}} |
| Post-incident reviews are conducted | ⬜ | {{evidence_10_4}} | {{comments_10_4}} |

## Section 6: Training and Awareness
### 6.1 Security Training
| Item | Status | Evidence | Comments |
|------|--------|----------|----------|
| Security awareness training is mandatory | ⬜ | {{evidence_11_1}} | {{comments_11_1}} |
| Training records are maintained | ⬜ | {{evidence_11_2}} | {{comments_11_2}} |
| Role-specific training is provided | ⬜ | {{evidence_11_3}} | {{comments_11_3}} |
| Training effectiveness is measured | ⬜ | {{evidence_11_4}} | {{comments_11_4}} |

## Summary and Findings
### Overall Compliance Status
- **Items Reviewed:** {{total_items}}
- **Compliant Items:** {{compliant_items}}
- **Non-Compliant Items:** {{non_compliant_items}}
- **Not Applicable Items:** {{na_items}}
- **Compliance Percentage:** {{compliance_percentage}}%

### Critical Findings
1. {{critical_finding_1}}
2. {{critical_finding_2}}
3. {{critical_finding_3}}

### Recommendations
1. **Priority 1:** {{recommendation_1}}
2. **Priority 2:** {{recommendation_2}}
3. **Priority 3:** {{recommendation_3}}

### Action Plan
| Finding | Responsible Party | Due Date | Status |
|---------|------------------|----------|--------|
| {{action_1}} | {{responsible_1}} | {{due_1}} | {{status_1}} |
| {{action_2}} | {{responsible_2}} | {{due_2}} | {{status_2}} |
| {{action_3}} | {{responsible_3}} | {{due_3}} | {{status_3}} |

## Certification
**Assessor Declaration:**
I certify that this assessment was conducted in accordance with established procedures and that the findings accurately represent the compliance status as of {{completion_date}}.

**Assessor:** {{assessor_name}}
**Signature:** _________________
**Date:** {{signature_date}}

**Management Review:**
**Reviewer:** {{reviewer_name}}
**Signature:** _________________
**Date:** {{review_date}}

**Next Assessment Due:** {{next_assessment_date}}`,
    templateVariables: {
      checklist_title: { type: 'text', label: 'Checklist Title', required: true },
      checklist_id: { type: 'text', label: 'Checklist ID', required: true },
      version: { type: 'text', label: 'Version', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true },
      applicable_framework: { type: 'select', label: 'Applicable Framework', required: true, options: ['ISO 27001', 'SOC 2', 'FedRAMP', 'NIST 800-53', 'PCI DSS', 'HIPAA', 'GDPR'] },
      assessment_period: { type: 'text', label: 'Assessment Period', required: true },
      assessor_name: { type: 'text', label: 'Assessor Name', required: true },
      completion_date: { type: 'date', label: 'Date Completed', required: true },
      submission_timeframe: { type: 'select', label: 'Submission Timeframe', required: true, options: ['24 hours', '48 hours', '1 week', '2 weeks'] },
      evidence_1_1: { type: 'text', label: 'Evidence 1.1', required: false },
      comments_1_1: { type: 'text', label: 'Comments 1.1', required: false },
      evidence_1_2: { type: 'text', label: 'Evidence 1.2', required: false },
      comments_1_2: { type: 'text', label: 'Comments 1.2', required: false },
      evidence_1_3: { type: 'text', label: 'Evidence 1.3', required: false },
      comments_1_3: { type: 'text', label: 'Comments 1.3', required: false },
      evidence_1_4: { type: 'text', label: 'Evidence 1.4', required: false },
      comments_1_4: { type: 'text', label: 'Comments 1.4', required: false },
      evidence_2_1: { type: 'text', label: 'Evidence 2.1', required: false },
      comments_2_1: { type: 'text', label: 'Comments 2.1', required: false },
      evidence_2_2: { type: 'text', label: 'Evidence 2.2', required: false },
      comments_2_2: { type: 'text', label: 'Comments 2.2', required: false },
      evidence_2_3: { type: 'text', label: 'Evidence 2.3', required: false },
      comments_2_3: { type: 'text', label: 'Comments 2.3', required: false },
      evidence_2_4: { type: 'text', label: 'Evidence 2.4', required: false },
      comments_2_4: { type: 'text', label: 'Comments 2.4', required: false },
      evidence_3_1: { type: 'text', label: 'Evidence 3.1', required: false },
      comments_3_1: { type: 'text', label: 'Comments 3.1', required: false },
      evidence_3_2: { type: 'text', label: 'Evidence 3.2', required: false },
      comments_3_2: { type: 'text', label: 'Comments 3.2', required: false },
      evidence_3_3: { type: 'text', label: 'Evidence 3.3', required: false },
      comments_3_3: { type: 'text', label: 'Comments 3.3', required: false },
      evidence_3_4: { type: 'text', label: 'Evidence 3.4', required: false },
      comments_3_4: { type: 'text', label: 'Comments 3.4', required: false },
      evidence_4_1: { type: 'text', label: 'Evidence 4.1', required: false },
      comments_4_1: { type: 'text', label: 'Comments 4.1', required: false },
      evidence_4_2: { type: 'text', label: 'Evidence 4.2', required: false },
      comments_4_2: { type: 'text', label: 'Comments 4.2', required: false },
      evidence_4_3: { type: 'text', label: 'Evidence 4.3', required: false },
      comments_4_3: { type: 'text', label: 'Comments 4.3', required: false },
      evidence_4_4: { type: 'text', label: 'Evidence 4.4', required: false },
      comments_4_4: { type: 'text', label: 'Comments 4.4', required: false },
      evidence_5_1: { type: 'text', label: 'Evidence 5.1', required: false },
      comments_5_1: { type: 'text', label: 'Comments 5.1', required: false },
      evidence_5_2: { type: 'text', label: 'Evidence 5.2', required: false },
      comments_5_2: { type: 'text', label: 'Comments 5.2', required: false },
      evidence_5_3: { type: 'text', label: 'Evidence 5.3', required: false },
      comments_5_3: { type: 'text', label: 'Comments 5.3', required: false },
      evidence_5_4: { type: 'text', label: 'Evidence 5.4', required: false },
      comments_5_4: { type: 'text', label: 'Comments 5.4', required: false },
      evidence_6_1: { type: 'text', label: 'Evidence 6.1', required: false },
      comments_6_1: { type: 'text', label: 'Comments 6.1', required: false },
      evidence_6_2: { type: 'text', label: 'Evidence 6.2', required: false },
      comments_6_2: { type: 'text', label: 'Comments 6.2', required: false },
      evidence_6_3: { type: 'text', label: 'Evidence 6.3', required: false },
      comments_6_3: { type: 'text', label: 'Comments 6.3', required: false },
      evidence_6_4: { type: 'text', label: 'Evidence 6.4', required: false },
      comments_6_4: { type: 'text', label: 'Comments 6.4', required: false },
      evidence_7_1: { type: 'text', label: 'Evidence 7.1', required: false },
      comments_7_1: { type: 'text', label: 'Comments 7.1', required: false },
      evidence_7_2: { type: 'text', label: 'Evidence 7.2', required: false },
      comments_7_2: { type: 'text', label: 'Comments 7.2', required: false },
      evidence_7_3: { type: 'text', label: 'Evidence 7.3', required: false },
      comments_7_3: { type: 'text', label: 'Comments 7.3', required: false },
      evidence_7_4: { type: 'text', label: 'Evidence 7.4', required: false },
      comments_7_4: { type: 'text', label: 'Comments 7.4', required: false },
      evidence_8_1: { type: 'text', label: 'Evidence 8.1', required: false },
      comments_8_1: { type: 'text', label: 'Comments 8.1', required: false },
      evidence_8_2: { type: 'text', label: 'Evidence 8.2', required: false },
      comments_8_2: { type: 'text', label: 'Comments 8.2', required: false },
      evidence_8_3: { type: 'text', label: 'Evidence 8.3', required: false },
      comments_8_3: { type: 'text', label: 'Comments 8.3', required: false },
      evidence_8_4: { type: 'text', label: 'Evidence 8.4', required: false },
      comments_8_4: { type: 'text', label: 'Comments 8.4', required: false },
      evidence_9_1: { type: 'text', label: 'Evidence 9.1', required: false },
      comments_9_1: { type: 'text', label: 'Comments 9.1', required: false },
      evidence_9_2: { type: 'text', label: 'Evidence 9.2', required: false },
      comments_9_2: { type: 'text', label: 'Comments 9.2', required: false },
      evidence_9_3: { type: 'text', label: 'Evidence 9.3', required: false },
      comments_9_3: { type: 'text', label: 'Comments 9.3', required: false },
      evidence_9_4: { type: 'text', label: 'Evidence 9.4', required: false },
      comments_9_4: { type: 'text', label: 'Comments 9.4', required: false },
      evidence_10_1: { type: 'text', label: 'Evidence 10.1', required: false },
      comments_10_1: { type: 'text', label: 'Comments 10.1', required: false },
      evidence_10_2: { type: 'text', label: 'Evidence 10.2', required: false },
      comments_10_2: { type: 'text', label: 'Comments 10.2', required: false },
      evidence_10_3: { type: 'text', label: 'Evidence 10.3', required: false },
      comments_10_3: { type: 'text', label: 'Comments 10.3', required: false },
      evidence_10_4: { type: 'text', label: 'Evidence 10.4', required: false },
      comments_10_4: { type: 'text', label: 'Comments 10.4', required: false },
      evidence_11_1: { type: 'text', label: 'Evidence 11.1', required: false },
      comments_11_1: { type: 'text', label: 'Comments 11.1', required: false },
      evidence_11_2: { type: 'text', label: 'Evidence 11.2', required: false },
      comments_11_2: { type: 'text', label: 'Comments 11.2', required: false },
      evidence_11_3: { type: 'text', label: 'Evidence 11.3', required: false },
      comments_11_3: { type: 'text', label: 'Comments 11.3', required: false },
      evidence_11_4: { type: 'text', label: 'Evidence 11.4', required: false },
      comments_11_4: { type: 'text', label: 'Comments 11.4', required: false },
      total_items: { type: 'number', label: 'Total Items Reviewed', required: true },
      compliant_items: { type: 'number', label: 'Compliant Items', required: true },
      non_compliant_items: { type: 'number', label: 'Non-Compliant Items', required: true },
      na_items: { type: 'number', label: 'N/A Items', required: true },
      compliance_percentage: { type: 'number', label: 'Compliance Percentage', required: true },
      critical_finding_1: { type: 'text', label: 'Critical Finding 1', required: false },
      critical_finding_2: { type: 'text', label: 'Critical Finding 2', required: false },
      critical_finding_3: { type: 'text', label: 'Critical Finding 3', required: false },
      recommendation_1: { type: 'text', label: 'Recommendation 1', required: false },
      recommendation_2: { type: 'text', label: 'Recommendation 2', required: false },
      recommendation_3: { type: 'text', label: 'Recommendation 3', required: false },
      action_1: { type: 'text', label: 'Action 1', required: false },
      responsible_1: { type: 'text', label: 'Responsible 1', required: false },
      due_1: { type: 'date', label: 'Due Date 1', required: false },
      status_1: { type: 'text', label: 'Status 1', required: false },
      action_2: { type: 'text', label: 'Action 2', required: false },
      responsible_2: { type: 'text', label: 'Responsible 2', required: false },
      due_2: { type: 'date', label: 'Due Date 2', required: false },
      status_2: { type: 'text', label: 'Status 2', required: false },
      action_3: { type: 'text', label: 'Action 3', required: false },
      responsible_3: { type: 'text', label: 'Responsible 3', required: false },
      due_3: { type: 'date', label: 'Due Date 3', required: false },
      status_3: { type: 'text', label: 'Status 3', required: false },
      signature_date: { type: 'date', label: 'Signature Date', required: true },
      reviewer_name: { type: 'text', label: 'Reviewer Name', required: true },
      review_date: { type: 'date', label: 'Review Date', required: true },
      next_assessment_date: { type: 'date', label: 'Next Assessment Due', required: true }
    }
  }
,
  {
    id: 'nist-csf-gov',
    title: 'CSF 2.0 - Govern (GV)',
    description: 'NIST CSF 2.0 Govern function covering organizational context, risk management strategy, roles, and policies.',
    framework: 'General',
    category: 'NIST-CSF-2.0',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# NIST CSF 2.0 - Govern (GV)

## 1. Purpose
The Govern function establishes and monitors the organization's cybersecurity risk management strategy, expectations, and policy.

## 2. Organizational Context
**Mission Alignment:** {{mission_alignment}}
**Stakeholders:** {{stakeholders}}

## 3. Risk Management Strategy
**Risk Appetite:** {{risk_appetite}}
**Risk Tolerance:** {{risk_tolerance}}
**Methodology:** {{risk_methodology}}

## 4. Roles and Responsibilities
**CISO/Security Lead:** {{ciso_name}}
**Executive Sponsor:** {{exec_sponsor}}
**Security Team Structure:** {{team_structure}}

## 5. Cybersecurity Supply Chain Risk Management
**Vendor Assessment Requirements:** {{vendor_assessment}}
**Critical Suppliers:** {{critical_suppliers}}

**Document Owner:** {{document_owner}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      mission_alignment: { type: 'text', label: 'Mission Alignment', required: true },
      stakeholders: { type: 'text', label: 'Stakeholders', required: true },
      risk_appetite: { type: 'text', label: 'Risk Appetite', required: true },
      risk_tolerance: { type: 'text', label: 'Risk Tolerance', required: true },
      risk_methodology: { type: 'text', label: 'Risk Methodology', required: true },
      ciso_name: { type: 'text', label: 'CISO/Security Lead Name', required: true },
      exec_sponsor: { type: 'text', label: 'Executive Sponsor Name', required: true },
      team_structure: { type: 'text', label: 'Team Structure', required: true },
      vendor_assessment: { type: 'text', label: 'Vendor Assessment Requirements', required: true },
      critical_suppliers: { type: 'text', label: 'Critical Suppliers', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-csf-id',
    title: 'CSF 2.0 - Identify (ID)',
    description: 'NIST CSF 2.0 Identify function covering asset management, risk assessment, and improvement.',
    framework: 'General',
    category: 'NIST-CSF-2.0',
    priority: 2,
    documentType: 'policy',
    required: true,
    templateContent: `# NIST CSF 2.0 - Identify (ID)

## 1. Purpose
The Identify function helps determine the current cybersecurity risk to the organization, its people, assets, data, and capabilities.

## 2. Asset Management
**Hardware Inventory:** {{hardware_inventory_tool}}
**Software Inventory:** {{software_inventory_tool}}
**Data Inventory/Mapping:** {{data_inventory}}

## 3. Risk Assessment
**Vulnerability Scans:** {{vuln_scan_frequency}}
**Threat Intel Sources:** {{threat_intel}}
**Risk Register Location:** {{risk_register_path}}

## 4. Improvement
**Audit Findings Tracking:** {{audit_tracking}}
**Continuous Improvement Process:** {{improvement_process}}

**Document Owner:** {{document_owner}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      hardware_inventory_tool: { type: 'text', label: 'Hardware Inventory Tool', required: true },
      software_inventory_tool: { type: 'text', label: 'Software Inventory Tool', required: true },
      data_inventory: { type: 'text', label: 'Data Inventory', required: true },
      vuln_scan_frequency: { type: 'select', label: 'Vulnerability Scan Frequency', required: true, options: ['Daily', 'Weekly', 'Monthly'] },
      threat_intel: { type: 'text', label: 'Threat Intelligence Sources', required: true },
      risk_register_path: { type: 'text', label: 'Risk Register Location', required: true },
      audit_tracking: { type: 'text', label: 'Audit Findings Tracking System', required: true },
      improvement_process: { type: 'text', label: 'Continuous Improvement Process', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-csf-pr',
    title: 'CSF 2.0 - Protect (PR)',
    description: 'NIST CSF 2.0 Protect function covering identity management, awareness, data security, and platform security.',
    framework: 'General',
    category: 'NIST-CSF-2.0',
    priority: 3,
    documentType: 'policy',
    required: true,
    templateContent: `# NIST CSF 2.0 - Protect (PR)

## 1. Purpose
The Protect function supports the ability to secure assets and limit or contain the impact of a cybersecurity event.

## 2. Identity Management and Access Control
**Authentication (MFA):** {{mfa_enforcement}}
**Privileged Access Management:** {{pam_tool}}
**Offboarding SLA:** {{offboarding_sla}}

## 3. Awareness and Training
**Phishing Simulations:** {{phishing_frequency}}
**Security Training Requirement:** {{training_requirement}}

## 4. Data Security
**Data at Rest Encryption:** {{encryption_at_rest}}
**Data in Transit Encryption:** {{encryption_in_transit}}
**Data Loss Prevention (DLP):** {{dlp_controls}}

## 5. Platform Security
**Endpoint Protection (EDR):** {{edr_solution}}
**Network Security:** {{network_security}}

**Document Owner:** {{document_owner}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      mfa_enforcement: { type: 'text', label: 'MFA Enforcement Rule', required: true },
      pam_tool: { type: 'text', label: 'PAM Tool', required: true },
      offboarding_sla: { type: 'text', label: 'Offboarding SLA', required: true },
      phishing_frequency: { type: 'select', label: 'Phishing Frequency', required: true, options: ['Monthly', 'Quarterly'] },
      training_requirement: { type: 'text', label: 'Training Requirement', required: true },
      encryption_at_rest: { type: 'text', label: 'Encryption at Rest Standard', required: true },
      encryption_in_transit: { type: 'text', label: 'Encryption in Transit Standard', required: true },
      dlp_controls: { type: 'text', label: 'DLP Controls', required: true },
      edr_solution: { type: 'text', label: 'EDR Solution', required: true },
      network_security: { type: 'text', label: 'Network Security Controls', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-csf-de',
    title: 'CSF 2.0 - Detect (DE)',
    description: 'NIST CSF 2.0 Detect function covering continuous monitoring and adverse event analysis.',
    framework: 'General',
    category: 'NIST-CSF-2.0',
    priority: 4,
    documentType: 'policy',
    required: true,
    templateContent: `# NIST CSF 2.0 - Detect (DE)

## 1. Purpose
The Detect function enables the timely discovery and analysis of anomalies, indicators of compromise, and other cybersecurity events.

## 2. Continuous Monitoring
**SIEM Platform:** {{siem_platform}}
**Log Retention Period:** {{log_retention}}
**Monitored Environments:** {{monitored_environments}}

## 3. Adverse Event Analysis
**Alert Triage Process:** {{triage_process}}
**Anomaly Detection:** {{anomaly_detection}}
**Threat Hunting Frequency:** {{hunting_frequency}}

**Document Owner:** {{document_owner}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      siem_platform: { type: 'text', label: 'SIEM Platform', required: true },
      log_retention: { type: 'text', label: 'Log Retention Period', required: true },
      monitored_environments: { type: 'text', label: 'Monitored Environments', required: true },
      triage_process: { type: 'text', label: 'Alert Triage Process', required: true },
      anomaly_detection: { type: 'text', label: 'Anomaly Detection Mechanism', required: true },
      hunting_frequency: { type: 'select', label: 'Threat Hunting Frequency', required: true, options: ['Weekly', 'Monthly', 'Quarterly'] },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-csf-rs',
    title: 'CSF 2.0 - Respond (RS)',
    description: 'NIST CSF 2.0 Respond function covering incident management, analysis, mitigation, and reporting.',
    framework: 'General',
    category: 'NIST-CSF-2.0',
    priority: 5,
    documentType: 'policy',
    required: true,
    templateContent: `# NIST CSF 2.0 - Respond (RS)

## 1. Purpose
The Respond function supports the ability to contain the impact of cybersecurity incidents and coordinate response activities.

## 2. Incident Management
**Incident Response Plan Location:** {{irp_location}}
**Response Team Lead:** {{response_lead}}
**Tabletop Exercise Frequency:** {{tabletop_frequency}}

## 3. Incident Analysis & Mitigation
**Containment Strategy:** {{containment_strategy}}
**Forensics Capabilities:** {{forensics_tools}}

## 4. Incident Reporting and Communication
**Internal Communication Protocol:** {{internal_comms}}
**Regulatory Reporting SLA:** {{reporting_sla}}
**External PR Lead:** {{external_pr}}

**Document Owner:** {{document_owner}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      irp_location: { type: 'text', label: 'IRP Location', required: true },
      response_lead: { type: 'text', label: 'Response Team Lead', required: true },
      tabletop_frequency: { type: 'select', label: 'Tabletop Frequency', required: true, options: ['Annually', 'Semi-annually'] },
      containment_strategy: { type: 'text', label: 'Containment Strategy', required: true },
      forensics_tools: { type: 'text', label: 'Forensics Tools/Partners', required: true },
      internal_comms: { type: 'text', label: 'Internal Comms Protocol', required: true },
      reporting_sla: { type: 'text', label: 'Reporting SLA', required: true },
      external_pr: { type: 'text', label: 'External PR Lead', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-csf-rc',
    title: 'CSF 2.0 - Recover (RC)',
    description: 'NIST CSF 2.0 Recover function covering recovery plan execution and communication.',
    framework: 'General',
    category: 'NIST-CSF-2.0',
    priority: 6,
    documentType: 'policy',
    required: true,
    templateContent: `# NIST CSF 2.0 - Recover (RC)

## 1. Purpose
The Recover function restores assets and operations affected by a cybersecurity incident in a timely and resilient manner.

## 2. Recovery Plan Execution
**Business Continuity Plan (BCP) Location:** {{bcp_location}}
**Backup Testing Frequency:** {{backup_testing}}
**Target Recovery Time (RTO):** {{target_rto}}

## 3. Recovery Communication
**Customer Notification Protocol:** {{customer_notification}}
**Post-Incident Review (Lessons Learned):** {{lessons_learned}}

**Document Owner:** {{document_owner}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      bcp_location: { type: 'text', label: 'BCP Location', required: true },
      backup_testing: { type: 'select', label: 'Backup Testing Frequency', required: true, options: ['Weekly', 'Monthly', 'Quarterly'] },
      target_rto: { type: 'text', label: 'Target RTO', required: true },
      customer_notification: { type: 'text', label: 'Customer Notification Protocol', required: true },
      lessons_learned: { type: 'text', label: 'Lessons Learned Timeline', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  }
];

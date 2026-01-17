import { DocumentTemplate } from '../../types';

export const FedRAMPAttachmentPlans: DocumentTemplate[] = [
  {
    id: 'fedramp-att-6',
    title: 'FedRAMP Contingency Plan (ISCP)',
    description: 'Attachment 6 - Information System Contingency Plan',
    framework: 'FedRAMP-Moderate',
    category: 'plan',
    priority: 6,
    documentType: 'plan',
    required: true,
    templateContent: `# Information System Contingency Plan (ISCP)
## FedRAMP SSP Attachment 6

### System Information
**System Name:** {{system_name}}
**FIPS 199 Impact Level:** {{impact_level}}
**System Owner:** {{system_owner}}
**Contingency Plan Coordinator:** {{cp_coordinator}}

## 1. Introduction

### 1.1 Purpose
This plan provides procedures for recovering {{system_name}} following a disruption.

### 1.2 Applicability
This plan applies to all components of {{system_name}} within the authorization boundary.

## 2. Concept of Operations

### 2.1 System Description
{{system_description}}

### 2.2 Recovery Objectives
- Recovery Time Objective (RTO): {{rto}} hours
- Recovery Point Objective (RPO): {{rpo}} hours
- Maximum Tolerable Downtime (MTD): {{mtd}} hours

## 3. Contingency Planning

### 3.1 Roles and Responsibilities
| Role | Name | Contact | Alternate |
|------|------|---------|-----------|
| CP Coordinator | {{cp_coordinator}} | {{cp_contact}} | {{cp_alternate}} |
| Technical Lead | {{tech_lead}} | {{tech_contact}} | {{tech_alternate}} |
| Security Lead | {{security_lead}} | {{security_contact}} | {{security_alternate}} |

### 3.2 Line of Succession
1. {{succession_1}}
2. {{succession_2}}
3. {{succession_3}}

## 4. Activation and Notification

### 4.1 Activation Criteria
The plan is activated when:
- System unavailable for more than {{activation_threshold}} hours
- Data center declared inaccessible
- Major security incident impacts operations

### 4.2 Notification Procedures
1. Initial assessment completed
2. CP Coordinator notified
3. Recovery team activated
4. Stakeholders informed

## 5. Recovery Procedures

### 5.1 Damage Assessment
- Evaluate scope of disruption
- Assess data integrity
- Determine recovery strategy

### 5.2 Recovery Strategy
- Primary: {{primary_recovery_strategy}}
- Alternate: {{alternate_recovery_strategy}}

### 5.3 Recovery Site
- Primary Site: {{primary_site}}
- Alternate Site: {{alternate_site}}
- Activation Time: {{site_activation_time}} hours

## 6. Backup and Restoration

### 6.1 Backup Strategy
| Data Type | Frequency | Retention | Location |
|-----------|-----------|-----------|----------|
| Full system | {{full_backup_freq}} | {{full_retention}} | {{backup_location}} |
| Incremental | {{incr_backup_freq}} | {{incr_retention}} | {{backup_location}} |
| Database | {{db_backup_freq}} | {{db_retention}} | {{backup_location}} |

## 7. Plan Testing

### 7.1 Test Types and Frequency
| Test Type | Frequency | Last Tested | Next Test |
|-----------|-----------|-------------|-----------|
| Tabletop | Annual | {{tabletop_last}} | {{tabletop_next}} |
| Functional | Annual | {{functional_last}} | {{functional_next}} |
| Full-scale | {{fullscale_freq}} | {{fullscale_last}} | {{fullscale_next}} |

## 8. Plan Maintenance
- Review frequency: Annual
- Update triggers: Major system changes, test findings, incidents

**Approved By:** {{approved_by}}
**Approval Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      impact_level: { type: 'select', label: 'FIPS 199 Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      system_owner: { type: 'text', label: 'System Owner', required: true },
      cp_coordinator: { type: 'text', label: 'CP Coordinator', required: true },
      rto: { type: 'number', label: 'RTO (hours)', required: true },
      rpo: { type: 'number', label: 'RPO (hours)', required: true },
      mtd: { type: 'number', label: 'MTD (hours)', required: true },
      primary_site: { type: 'text', label: 'Primary Site', required: true },
      alternate_site: { type: 'text', label: 'Alternate Site', required: true },
      backup_location: { type: 'text', label: 'Backup Location', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-att-8',
    title: 'FedRAMP Incident Response Plan',
    description: 'Attachment 8 - Incident handling procedures',
    framework: 'FedRAMP-Moderate',
    category: 'plan',
    priority: 8,
    documentType: 'plan',
    required: true,
    templateContent: `# Incident Response Plan
## FedRAMP SSP Attachment 8

### System Information
**System Name:** {{system_name}}
**System Owner:** {{system_owner}}
**IR Lead:** {{ir_lead}}

## 1. Purpose
This plan establishes incident handling procedures for {{system_name}}.

## 2. Scope
Covers all security incidents affecting system confidentiality, integrity, or availability.

## 3. Incident Response Team

| Role | Name | Contact | Responsibility |
|------|------|---------|----------------|
| IR Lead | {{ir_lead}} | {{ir_lead_contact}} | Overall coordination |
| Technical Lead | {{tech_lead}} | {{tech_contact}} | Technical response |
| Communications | {{comms_lead}} | {{comms_contact}} | Stakeholder communication |
| Legal | {{legal_contact}} | {{legal_phone}} | Legal guidance |

## 4. Incident Categories

| Category | Description | Severity | Response Time |
|----------|-------------|----------|---------------|
| CAT 1 | Unauthorized access | Critical | {{cat1_response}} minutes |
| CAT 2 | DoS attack | High | {{cat2_response}} hours |
| CAT 3 | Malware | High | {{cat3_response}} hours |
| CAT 4 | Improper usage | Medium | {{cat4_response}} hours |
| CAT 5 | Policy violation | Low | {{cat5_response}} hours |

## 5. Incident Response Phases

### 5.1 Preparation
- IR team training
- Tool and resource readiness
- Communication channels established

### 5.2 Detection and Analysis
- Monitoring alerts reviewed
- Incident confirmed and classified
- Initial assessment documented

### 5.3 Containment
- Short-term containment actions
- Evidence preservation
- Long-term containment strategy

### 5.4 Eradication
- Root cause identified
- Malicious artifacts removed
- Vulnerabilities remediated

### 5.5 Recovery
- Systems restored to operation
- Verification of integrity
- Enhanced monitoring enabled

### 5.6 Post-Incident Activity
- Lessons learned documented
- Procedures updated
- Final report completed

## 6. Reporting Requirements

### 6.1 Internal Reporting
- IR Lead notified immediately
- Management briefed within {{mgmt_notification}} hours
- Documentation completed within {{doc_completion}} hours

### 6.2 External Reporting (US-CERT)
| Incident Type | Report Within |
|---------------|---------------|
| CAT 1 (Root compromise) | 1 hour |
| CAT 2-3 | 2 hours |
| CAT 4-5 | Weekly |

### 6.3 Customer/Agency Notification
- Affected agencies notified per SLA
- Breach notification per FedRAMP requirements

## 7. Evidence Handling
- Chain of custody maintained
- Forensic imaging procedures
- Secure evidence storage

## 8. Plan Testing
- Tabletop exercises: {{tabletop_freq}}
- Technical drills: {{drill_freq}}
- After-action reviews documented

**Approved By:** {{approved_by}}
**Approval Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      system_owner: { type: 'text', label: 'System Owner', required: true },
      ir_lead: { type: 'text', label: 'IR Lead', required: true },
      ir_lead_contact: { type: 'text', label: 'IR Lead Contact', required: true },
      tech_lead: { type: 'text', label: 'Technical Lead', required: true },
      cat1_response: { type: 'number', label: 'CAT 1 Response (minutes)', required: true },
      cat2_response: { type: 'number', label: 'CAT 2 Response (hours)', required: true },
      cat3_response: { type: 'number', label: 'CAT 3 Response (hours)', required: true },
      cat4_response: { type: 'number', label: 'CAT 4 Response (hours)', required: true },
      cat5_response: { type: 'number', label: 'CAT 5 Response (hours)', required: true },
      mgmt_notification: { type: 'number', label: 'Management Notification (hours)', required: true },
      tabletop_freq: { type: 'select', label: 'Tabletop Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] },
      drill_freq: { type: 'select', label: 'Drill Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-att-12',
    title: 'FedRAMP Security Assessment Plan (SAP)',
    description: 'Attachment 12 - Plan for assessing security controls',
    framework: 'FedRAMP-Moderate',
    category: 'plan',
    priority: 12,
    documentType: 'plan',
    required: true,
    templateContent: `# Security Assessment Plan (SAP)
## FedRAMP SSP Attachment 12

### System Information
**System Name:** {{system_name}}
**System Owner:** {{system_owner}}
**Assessment Date:** {{assessment_date}}

## 1. Introduction
This plan describes the methodology and procedures for assessing the security controls for {{system_name}}.

## 2. Assessment Methodology
The assessment will be conducted in accordance with:
- NIST SP 800-53A
- FedRAMP Security Assessment Framework
- Agency-specific requirements

## 3. Assessment Schedule
| Phase | Start Date | End Date | Resource |
|-------|------------|----------|----------|
| Planning | {{planning_start}} | {{planning_end}} | {{planning_resource}} |
| Fieldwork | {{fieldwork_start}} | {{fieldwork_end}} | {{fieldwork_resource}} |
| Reporting | {{reporting_start}} | {{reporting_end}} | {{reporting_resource}} |

## 4. Assessment Scope
**Boundary:** {{assessment_boundary}}
**Locations:** {{locations}}
**Components:** {{components}}

## 5. Assessment Procedures
### 5.1 Interviews
- List of personnel to be interviewed: {{interview_list}}

### 5.2 Examinations
- Review of policies and procedures
- Review of system configurations
- Review of audit logs

### 5.3 Technical Testing
- Vulnerability scanning: {{scanning_tool}}
- Penetration testing: {{pentest_scope}}
- Database scanning: {{db_scan_tool}}
- Web application scanning: {{web_scan_tool}}

## 6. Roles and Responsibilities
| Role | Responsibility | Name |
|------|----------------|------|
| 3PAO | Conduct assessment | {{assessor_name}} |
| CSP | Provide evidence | {{csp_poc}} |
| ISSO | Coordinate access | {{isso_name}} |

## 7. Deliverables
- Security Assessment Plan (SAP)
- Security Assessment Report (SAR)
- Plan of Action and Milestones (POA&M)

**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      system_owner: { type: 'text', label: 'System Owner', required: true },
      assessment_date: { type: 'date', label: 'Assessment Date', required: true },
      planning_start: { type: 'date', label: 'Planning Start', required: true },
      planning_end: { type: 'date', label: 'Planning End', required: true },
      fieldwork_start: { type: 'date', label: 'Fieldwork Start', required: true },
      fieldwork_end: { type: 'date', label: 'Fieldwork End', required: true },
      reporting_start: { type: 'date', label: 'Reporting Start', required: true },
      reporting_end: { type: 'date', label: 'Reporting End', required: true },
      assessment_boundary: { type: 'text', label: 'Assessment Boundary', required: true },
      locations: { type: 'text', label: 'Locations', required: true },
      components: { type: 'text', label: 'Components', required: true },
      scanning_tool: { type: 'text', label: 'Scanning Tool', required: true },
      pentest_scope: { type: 'text', label: 'Penetration Test Scope', required: true },
      assessor_name: { type: 'text', label: 'Assessor Name', required: true },
      csp_poc: { type: 'text', label: 'CSP POC', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  }
];

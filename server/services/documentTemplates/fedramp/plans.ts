import { DocumentTemplate } from '../types';

export const FedRAMPPlanTemplates: DocumentTemplate[] = [
  {
    id: 'fedramp-iscp',
    title: 'Information System Contingency Plan (ISCP)',
    description: 'FedRAMP required ISCP for system recovery and continuity',
    framework: 'FedRAMP',
    category: 'plan',
    priority: 1,
    documentType: 'plan',
    required: true,
    templateContent: `# Information System Contingency Plan (ISCP)
**System:** {{system_name}}
**Version:** {{version}}
**Date:** {{document_date}}

## 1. Introduction
This ISCP establishes procedures to recover {{system_name}} following a disruption.

## 2. Recovery Objectives
- **RTO:** {{rto_objective}}
- **RPO:** {{rpo_objective}}
- **MTT Restore:** {{mttr_objective}}

## 3. Roles and Responsibilities
| Role | Responsibility | Contact |
|------|----------------|---------|
| ISCP Coordinator | Plan activation | {{coordinator_contact}} |
| Recovery Team | Technical recovery | {{recovery_team_contact}} |
| Management | Approval/Communication | {{management_contact}} |

## 4. Activation Procedures
1. **Notification:** {{notification_process}}
2. **Damage Assessment:** {{assessment_process}}
3. **Activation Criteria:** {{activation_criteria}}

## 5. Recovery Procedures
### 5.1 System Recovery
- **Priority 1:** {{priority_1_systems}}
- **Priority 2:** {{priority_2_systems}}

### 5.2 Data Restoration
- **Backup Location:** {{backup_location}}
- **Restoration Process:** {{restoration_process}}

## 6. Testing and Maintenance
- **Test Frequency:** {{test_frequency}}
- **Plan Review:** {{plan_review_freq}}

**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      document_date: { type: 'date', label: 'Document Date', required: true },
      rto_objective: { type: 'text', label: 'Recovery Time Objective (RTO)', required: true },
      rpo_objective: { type: 'text', label: 'Recovery Point Objective (RPO)', required: true },
      mttr_objective: { type: 'text', label: 'Mean Time to Restore', required: true },
      coordinator_contact: { type: 'text', label: 'Coordinator Contact', required: true },
      recovery_team_contact: { type: 'text', label: 'Recovery Team Contact', required: true },
      management_contact: { type: 'text', label: 'Management Contact', required: true },
      notification_process: { type: 'text', label: 'Notification Process', required: true },
      assessment_process: { type: 'text', label: 'Damage Assessment Process', required: true },
      activation_criteria: { type: 'text', label: 'Activation Criteria', required: true },
      priority_1_systems: { type: 'text', label: 'Priority 1 Systems', required: true },
      priority_2_systems: { type: 'text', label: 'Priority 2 Systems', required: true },
      backup_location: { type: 'text', label: 'Backup Location', required: true },
      restoration_process: { type: 'text', label: 'Restoration Process', required: true },
      test_frequency: { type: 'select', label: 'Test Frequency', required: true, options: ['Annually', 'Semi-annually'] },
      plan_review_freq: { type: 'select', label: 'Plan Review Frequency', required: true, options: ['Annually', 'Semi-annually'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-cmp',
    title: 'Configuration Management Plan (CMP)',
    description: 'FedRAMP required Configuration Management Plan for baseline and change control',
    framework: 'FedRAMP',
    category: 'plan',
    priority: 1,
    documentType: 'plan',
    required: true,
    templateContent: `# Configuration Management Plan (CMP)
**System:** {{system_name}}
**Date:** {{document_date}}
**Version:** {{version}}

## 1. Purpose
This Configuration Management Plan (CMP) defines processes for managing {{system_name}} baseline configurations, change control, and configuration audits per FedRAMP requirements (NIST 800-53 CM family).

## 2. Scope
**Systems Covered:** {{systems_covered}}
**Components:** Hardware, Software, Network, Documentation

## 3. Configuration Management Roles
| Role | Responsibility | Name |
|------|----------------|------|
| CM Manager | Overall CM oversight | {{cm_manager}} |
| Change Control Board | Approve changes | {{ccb_members}} |
| System Administrator | Implement changes | {{sys_admin}} |
| Security Officer | Security review | {{security_officer}} |

## 4. Configuration Baseline

### 4.1 Hardware Baseline
**Baseline ID:** {{hw_baseline_id}}
**Last Updated:** {{hw_baseline_date}}

Maintained in: {{hw_baseline_location}}

### 4.2 Software Baseline
**Baseline ID:** {{sw_baseline_id}}
**Last Updated:** {{sw_baseline_date}}

Components:
- Operating Systems: {{os_list}}
- Applications: {{app_list}}
- Security Tools: {{security_tools}}

### 4.3 Network Baseline
**Baseline ID:** {{net_baseline_id}}
**Network Diagrams:** {{network_diagram_location}}
**Boundary Diagrams:** {{boundary_diagram_location}}

### 4.4 Security Baseline
**Security Configuration:** {{security_baseline}}
**Standards:** {{config_standards}}
**Templates:** {{config_templates}}

## 5. Change Control Process

### 5.1 Change Request Process
1. **Initiate:** Submit change request form
2. **Assess:** Security and operational impact analysis
3. **Approve:** CCB review and approval/rejection
4. **Implement:** Scheduled implementation
5. **Verify:** Post-implementation testing
6. **Document:** Update baseline and close request

### 5.2 Change Categories
| Category | Approval Level | Timeline |
|----------|----------------|----------|
| Emergency | {{emergency_approval}} | Immediate |
| Standard | CCB Approval | {{standard_timeline}} |
| Minor | {{minor_approval}} | {{minor_timeline}} |

### 5.3 Emergency Changes
**Authorization:** {{emergency_auth}}
**Documentation:** Within {{emergency_doc_timeline}}
**Post-Implementation Review:** Within {{post_review_timeline}}

## 6. Configuration Control Board (CCB)

### 6.1 Membership
**Chair:** {{ccb_chair}}
**Members:** {{ccb_members}}
**Quorum:** {{ccb_quorum}}

### 6.2 Meeting Schedule
**Regular Meetings:** {{ccb_meeting_freq}}
**Emergency Meetings:** As needed within {{emergency_meeting_timeline}}

### 6.3 Voting Process
**Approval Threshold:** {{approval_threshold}}
**Tie-Breaking:** {{tie_breaker}}

## 7. Configuration Audits

### 7.1 Audit Schedule
**Automated Scans:** {{auto_scan_freq}}
**Manual Reviews:** {{manual_review_freq}}
**Comprehensive Audits:** {{comprehensive_audit_freq}}

### 7.2 Audit Tools
**Configuration Scanner:** {{config_scanner}}
**Vulnerability Scanner:** {{vuln_scanner}}
**Compliance Tool:** {{compliance_tool}}

### 7.3 Deviation Management
**Unauthorized Changes:** {{unauthorized_process}}
**Remediation Timeline:** {{remediation_timeline}}
**Exception Process:** {{exception_process}}

## 8. Configuration Management Database (CMDB)

### 8.1 CMDB Tool
**System:** {{cmdb_tool}}
**Location:** {{cmdb_location}}
**Access Controls:** {{cmdb_access}}

### 8.2 Data Elements
- Configuration Items (CIs)
- CI relationships and dependencies
- Change history
- Baseline versions
- Asset ownership
- Compliance status

### 8.3 CMDB Updates
**Frequency:** {{cmdb_update_freq}}
**Responsible Party:** {{cmdb_owner}}
**Validation:** {{cmdb_validation_freq}}

## 9. Version Control

### 9.1 Code Repository
**Repository:** {{code_repo}}
**Branching Strategy:** {{branch_strategy}}
**Merge Approval:** {{merge_approval}}

### 9.2 Documentation Versioning
**Document Repository:** {{doc_repo}}
**Versioning Scheme:** {{version_scheme}}
**Archive Process:** {{archive_process}}

### 9.3 Build Management
**Build Tool:** {{build_tool}}
**Build Frequency:** {{build_freq}}
**Artifact Storage:** {{artifact_storage}}

## 10. Security Configuration Management

### 10.1 Security Hardening
**Standards Applied:** {{hardening_standards}}
**Validation:** {{hardening_validation}}
**Exception Process:** {{security_exceptions}}

### 10.2 Patch Management
**Patch Cycle:** {{patch_cycle}}
**Testing:** {{patch_testing}}
**Emergency Patches:** Within {{emergency_patch_timeline}}

### 10.3 Least Functionality
**Unnecessary Services:** Disabled per {{service_baseline}}
**Prohibited Software:** {{prohibited_software}}
**Enforcement:** {{enforcement_method}}

## 11. Monitoring and Reporting

### 11.1 CM Metrics
- Unauthorized change detections
- Change success rate
- Mean time to implement changes
- Configuration drift incidents
- Audit findings

### 11.2 Reporting
**Monthly Reports:** To {{monthly_report_recipients}}
**Quarterly Reviews:** CCB and management
**Annual Assessment:** Full CM program effectiveness

### 11.3 Continuous Monitoring
**Real-time Alerts:** {{cm_alerts}}
**Dashboard:** {{cm_dashboard}}
**Integration:** {{monitoring_integration}}

## 12. Training and Awareness

### 12.1 CM Training
**CM Team:** {{cm_training_freq}}
**System Administrators:** {{admin_training_freq}}
**All Personnel:** Annual CM awareness

### 12.2 Training Topics
- Change control procedures
- CMDB usage
- Security configuration
- Incident reporting
- Audit cooperation

## 13. Related Documents
- System Security Plan (SSP)
- Incident Response Plan (IRP)
- Contingency Plan (ISCP)
- Security Assessment Report (SAR)

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}
**Next Review:** {{next_review}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      document_date: { type: 'date', label: 'Document Date', required: true },
      version: { type: 'text', label: 'Version', required: true },
      systems_covered: { type: 'text', label: 'Systems Covered', required: true },
      cm_manager: { type: 'text', label: 'CM Manager Name', required: true },
      ccb_members: { type: 'text', label: 'CCB Members', required: true },
      sys_admin: { type: 'text', label: 'System Administrator', required: true },
      security_officer: { type: 'text', label: 'Security Officer', required: true },
      hw_baseline_id: { type: 'text', label: 'Hardware Baseline ID', required: true },
      hw_baseline_date: { type: 'date', label: 'Hardware Baseline Date', required: true },
      hw_baseline_location: { type: 'text', label: 'Hardware Baseline Location', required: true },
      sw_baseline_id: { type: 'text', label: 'Software Baseline ID', required: true },
      sw_baseline_date: { type: 'date', label: 'Software Baseline Date', required: true },
      os_list: { type: 'text', label: 'Operating Systems', required: true },
      app_list: { type: 'text', label: 'Applications', required: true },
      security_tools: { type: 'text', label: 'Security Tools', required: true },
      net_baseline_id: { type: 'text', label: 'Network Baseline ID', required: true },
      network_diagram_location: { type: 'text', label: 'Network Diagram Location', required: true },
      boundary_diagram_location: { type: 'text', label: 'Boundary Diagram Location', required: true },
      security_baseline: { type: 'text', label: 'Security Configuration Baseline', required: true },
      config_standards: { type: 'text', label: 'Configuration Standards', required: true },
      config_templates: { type: 'text', label: 'Configuration Templates', required: true },
      emergency_approval: { type: 'text', label: 'Emergency Change Approver', required: true },
      standard_timeline: { type: 'select', label: 'Standard Change Timeline', required: true, options: ['24 hours', '48 hours', '72 hours', '1 week'] },
      minor_approval: { type: 'text', label: 'Minor Change Approver', required: true },
      minor_timeline: { type: 'select', label: 'Minor Change Timeline', required: true, options: ['4 hours', '8 hours', '24 hours'] },
      emergency_auth: { type: 'text', label: 'Emergency Authorization Authority', required: true },
      emergency_doc_timeline: { type: 'select', label: 'Emergency Documentation Timeline', required: true, options: ['24 hours', '48 hours', '72 hours'] },
      post_review_timeline: { type: 'select', label: 'Post-Implementation Review Timeline', required: true, options: ['48 hours', '1 week', '2 weeks'] },
      ccb_chair: { type: 'text', label: 'CCB Chair', required: true },
      ccb_quorum: { type: 'text', label: 'CCB Quorum Requirement', required: true },
      ccb_meeting_freq: { type: 'select', label: 'CCB Meeting Frequency', required: true, options: ['Weekly', 'Bi-weekly', 'Monthly'] },
      emergency_meeting_timeline: { type: 'select', label: 'Emergency Meeting Timeline', required: true, options: ['4 hours', '8 hours', '24 hours'] },
      approval_threshold: { type: 'text', label: 'Approval Threshold', required: true },
      tie_breaker: { type: 'text', label: 'Tie-Breaking Process', required: true },
      auto_scan_freq: { type: 'select', label: 'Automated Scan Frequency', required: true, options: ['Continuous', 'Daily', 'Weekly'] },
      manual_review_freq: { type: 'select', label: 'Manual Review Frequency', required: true, options: ['Weekly', 'Monthly', 'Quarterly'] },
      comprehensive_audit_freq: { type: 'select', label: 'Comprehensive Audit Frequency', required: true, options: ['Monthly', 'Quarterly', 'Annually'] },
      config_scanner: { type: 'text', label: 'Configuration Scanner Tool', required: true },
      vuln_scanner: { type: 'text', label: 'Vulnerability Scanner', required: true },
      compliance_tool: { type: 'text', label: 'Compliance Monitoring Tool', required: true },
      unauthorized_process: { type: 'text', label: 'Unauthorized Change Process', required: true },
      remediation_timeline: { type: 'select', label: 'Remediation Timeline', required: true, options: ['Immediate', '24 hours', '48 hours', '1 week'] },
      exception_process: { type: 'text', label: 'Exception Request Process', required: true },
      cmdb_tool: { type: 'text', label: 'CMDB Tool/System', required: true },
      cmdb_location: { type: 'text', label: 'CMDB Location', required: true },
      cmdb_access: { type: 'text', label: 'CMDB Access Controls', required: true },
      cmdb_update_freq: { type: 'select', label: 'CMDB Update Frequency', required: true, options: ['Real-time', 'Daily', 'Weekly'] },
      cmdb_owner: { type: 'text', label: 'CMDB Owner', required: true },
      cmdb_validation_freq: { type: 'select', label: 'CMDB Validation Frequency', required: true, options: ['Monthly', 'Quarterly', 'Semi-annually'] },
      code_repo: { type: 'text', label: 'Code Repository', required: true },
      branch_strategy: { type: 'text', label: 'Branching Strategy', required: true },
      merge_approval: { type: 'text', label: 'Merge Approval Process', required: true },
      doc_repo: { type: 'text', label: 'Documentation Repository', required: true },
      version_scheme: { type: 'text', label: 'Versioning Scheme', required: true },
      archive_process: { type: 'text', label: 'Archive Process', required: true },
      build_tool: { type: 'text', label: 'Build Tool', required: true },
      build_freq: { type: 'select', label: 'Build Frequency', required: true, options: ['Continuous', 'Daily', 'Weekly', 'Per Release'] },
      artifact_storage: { type: 'text', label: 'Artifact Storage Location', required: true },
      hardening_standards: { type: 'text', label: 'Hardening Standards (e.g., CIS, DISA STIG)', required: true },
      hardening_validation: { type: 'text', label: 'Hardening Validation Method', required: true },
      security_exceptions: { type: 'text', label: 'Security Exception Process', required: true },
      patch_cycle: { type: 'select', label: 'Patch Management Cycle', required: true, options: ['Monthly', 'Bi-weekly', 'As Released'] },
      patch_testing: { type: 'text', label: 'Patch Testing Process', required: true },
      emergency_patch_timeline: { type: 'select', label: 'Emergency Patch Timeline', required: true, options: ['24 hours', '48 hours', '72 hours'] },
      service_baseline: { type: 'text', label: 'Service Baseline Document', required: true },
      prohibited_software: { type: 'text', label: 'Prohibited Software List', required: true },
      enforcement_method: { type: 'text', label: 'Enforcement Method', required: true },
      monthly_report_recipients: { type: 'text', label: 'Monthly Report Recipients', required: true },
      cm_alerts: { type: 'text', label: 'CM Alert System', required: true },
      cm_dashboard: { type: 'text', label: 'CM Dashboard URL/Location', required: true },
      monitoring_integration: { type: 'text', label: 'Monitoring System Integration', required: true },
      cm_training_freq: { type: 'select', label: 'CM Team Training Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] },
      admin_training_freq: { type: 'select', label: 'Admin Training Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true },
      next_review: { type: 'date', label: 'Next Review Date', required: true }
    }
  },
  {
    id: 'fedramp-irp',
    title: 'Incident Response Plan (IRP)',
    description: 'FedRAMP required Incident Response Plan for security incident handling',
    framework: 'FedRAMP',
    category: 'plan',
    priority: 1,
    documentType: 'plan',
    required: true,
    templateContent: `# Incident Response Plan (IRP)
**System:** {{system_name}}
**Date:** {{document_date}}
**Version:** {{version}}

## 1. Purpose
This Incident Response Plan (IRP) establishes procedures for detecting, responding to, and recovering from security incidents affecting {{system_name}} per FedRAMP requirements (NIST 800-53 IR family).

## 2. Scope
**Systems Covered:** {{systems_covered}}
**Incident Types:** Security breaches, data loss, service disruptions, unauthorized access

## 3. Incident Response Team (IRT)

### 3.1 Team Structure
| Role | Name | Contact | Backup |
|------|------|---------|--------|
| IR Manager | {{ir_manager}} | {{ir_manager_contact}} | {{ir_manager_backup}} |
| Security Lead | {{security_lead}} | {{security_contact}} | {{security_backup}} |
| Technical Lead | {{tech_lead}} | {{tech_contact}} | {{tech_backup}} |
| Communications | {{comms_lead}} | {{comms_contact}} | {{comms_backup}} |
| Legal Counsel | {{legal_contact}} | {{legal_phone}} | {{legal_backup}} |

### 3.2 Escalation Contacts
**Executive:** {{executive_contact}} - {{executive_phone}}
**FedRAMP PMO:** incident@fedramp.gov
**US-CERT:** us-cert@cisa.dhs.gov

### 3.3 On-Call Rotation
**Schedule:** {{oncall_schedule}}
**Response Time:** {{response_time_requirement}}

## 4. Incident Categories and Severity Levels

### 4.1 Severity Definitions
| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| Critical | Data breach, system compromise | {{critical_response}} | Immediate |
| High | Significant security event | {{high_response}} | Within 2 hours |
| Medium | Potential security incident | {{medium_response}} | Within 8 hours |
| Low | Security anomaly | {{low_response}} | Next business day |

### 4.2 FedRAMP Reportable Incidents
Per FedRAMP policy, report within 1 hour of discovery:
- Confirmed or suspected data breach
- Confirmed or suspected system compromise
- Denial of Service affecting FedRAMP system
- Any incident requiring law enforcement notification

## 5. Incident Response Process

### 5.1 Phase 1: Preparation
**Status:** Ongoing

Activities:
- Maintain incident response tools and capabilities
- Conduct IR training ({{ir_training_freq}})
- Run tabletop exercises ({{tabletop_freq}})
- Update contact lists and procedures
- Review threat intelligence

**IR Tools:**
- SIEM: {{siem_tool}}
- Forensics: {{forensics_tools}}
- Communication: {{ir_comm_platform}}
- Ticketing: {{ir_ticketing}}

### 5.2 Phase 2: Detection and Analysis
**Detection Sources:**
- Security monitoring alerts: {{monitoring_system}}
- User reports: {{user_report_method}}
- Threat intelligence feeds: {{threat_feeds}}
- External notifications: {{external_notification_process}}

**Initial Analysis:**
1. Verify the incident (eliminate false positives)
2. Categorize incident type
3. Assign severity level
4. Document initial findings
5. Notify IRT members

**Analysis Timeline:**
- Initial triage: Within {{triage_timeline}}
- Preliminary assessment: Within {{assessment_timeline}}
- Full analysis: Within {{analysis_timeline}}

### 5.3 Phase 3: Containment

#### Short-term Containment
**Objective:** Stop incident spread immediately

Actions:
- Isolate affected systems: {{isolation_method}}
- Block malicious IPs/domains: {{blocking_method}}
- Disable compromised accounts: {{account_disable_process}}
- Preserve evidence: {{evidence_preservation}}

**Authority:** {{containment_authority}}
**Timeline:** Within {{containment_timeline}}

#### Long-term Containment
**Objective:** Maintain operations while preparing recovery

Actions:
- Deploy temporary fixes: {{temp_fix_process}}
- Implement additional monitoring: {{enhanced_monitoring}}
- Apply security patches: {{emergency_patching}}
- Rebuild compromised systems: {{rebuild_process}}

### 5.4 Phase 4: Eradication
**Objective:** Remove threat and vulnerabilities

Activities:
1. Identify and remove malware: {{malware_removal_tools}}
2. Close attack vectors: {{vulnerability_remediation}}
3. Improve defenses: {{defense_improvements}}
4. Update security configurations: {{config_updates}}

**Validation:**
- Malware scan: {{scan_tool}}
- Vulnerability assessment: {{vuln_assessment_tool}}
- Configuration review: {{config_review_process}}

**Sign-off Required:** {{eradication_approver}}

### 5.5 Phase 5: Recovery
**Objective:** Restore normal operations

Recovery Steps:
1. Restore from clean backups: {{backup_restoration}}
2. Rebuild affected systems: {{rebuild_procedure}}
3. Apply security hardening: {{hardening_standards}}
4. Verify system integrity: {{integrity_verification}}
5. Monitor for recurrence: {{post_recovery_monitoring}}

**Recovery Timeline:** {{recovery_timeline}}
**Validation Period:** {{validation_period}}

**Return to Production:**
- Testing: {{recovery_testing}}
- Approval: {{recovery_approver}}
- Gradual restoration: {{phased_recovery}}

### 5.6 Phase 6: Post-Incident Activity

#### Lessons Learned Meeting
**Timing:** Within {{lessons_learned_timeline}} of incident closure
**Attendees:** IRT, management, stakeholders
**Facilitator:** {{lessons_learned_facilitator}}

**Discussion Topics:**
- What happened?
- What was done well?
- What could be improved?
- What actions should be taken?

#### Post-Incident Report
**Due:** Within {{pir_timeline}}
**Recipients:** {{pir_recipients}}

**Report Contents:**
- Executive summary
- Incident timeline
- Impact assessment
- Response actions
- Root cause analysis
- Improvement recommendations
- Cost analysis

#### Follow-up Actions
- Update security controls: {{control_update_process}}
- Revise procedures: {{procedure_revision_owner}}
- Implement improvements: {{improvement_owner}}
- Track metrics: {{metrics_tracking}}

## 6. Communication Protocols

### 6.1 Internal Communications
**IRT Communications:** {{irt_comm_channel}}
**Management Updates:** {{mgmt_update_freq}}
**All-Staff Notification:** {{staff_notification_method}}

### 6.2 External Communications

#### FedRAMP Reporting
**Initial Report:** Within 1 hour to incident@fedramp.gov
**Updates:** {{fedramp_update_freq}}
**Final Report:** Within {{fedramp_final_timeline}}

#### Customer Notification
**Threshold:** {{customer_notification_threshold}}
**Timeline:** {{customer_notification_timeline}}
**Method:** {{customer_notification_method}}
**Spokesperson:** {{customer_spokesperson}}

#### Law Enforcement
**When to Report:** {{law_enforcement_threshold}}
**Contact:** {{law_enforcement_contact}}
**Coordination:** {{le_coordination_process}}

#### Public/Media
**Approval Required:** {{media_approval_authority}}
**Spokesperson:** {{media_spokesperson}}
**Messaging:** {{media_messaging_process}}

### 6.3 Communication Templates
- Initial incident notification
- Status update template
- FedRAMP incident report
- Customer breach notification
- Post-incident summary

**Location:** {{template_location}}

## 7. Evidence Collection and Handling

### 7.1 Digital Evidence
**Collection Tools:** {{evidence_collection_tools}}
**Chain of Custody:** {{custody_process}}
**Storage:** {{evidence_storage}}
**Retention:** {{evidence_retention}}

### 7.2 Forensic Analysis
**Forensic Team:** {{forensic_team}}
**Analysis Tools:** {{forensic_tools}}
**Write Protection:** {{write_protection_method}}
**Hash Verification:** {{hash_algorithm}}

### 7.3 Legal Considerations
**Legal Hold:** {{legal_hold_process}}
**Privilege:** {{privilege_considerations}}
**Disclosure:** {{disclosure_requirements}}

## 8. Coordination with External Parties

### 8.1 US-CERT
**Contact:** us-cert@cisa.dhs.gov
**Reporting:** For federal incidents per {{reporting_requirement}}

### 8.2 FedRAMP PMO
**Contact:** incident@fedramp.gov
**Required Reporting:** All FedRAMP incidents within 1 hour

### 8.3 Cloud Service Providers
**AWS:** {{aws_incident_contact}}
**Azure:** {{azure_incident_contact}}
**GCP:** {{gcp_incident_contact}}

### 8.4 Third-Party Vendors
**Security Vendors:** {{security_vendor_contacts}}
**Managed Services:** {{msp_contacts}}
**Forensics:** {{forensics_vendor}}

## 9. Training and Exercises

### 9.1 IRT Training
**Frequency:** {{irt_training_freq}}
**Topics:**
- IR procedures and tools
- FedRAMP requirements
- Evidence handling
- Communication protocols
- New threats and tactics

### 9.2 Tabletop Exercises
**Frequency:** {{tabletop_freq}}
**Scenarios:** Data breach, ransomware, insider threat, DDoS
**Participants:** IRT, management, key stakeholders

### 9.3 Full-Scale Exercises
**Frequency:** {{fullscale_freq}}
**Scope:** End-to-end incident simulation
**After-Action:** Required within {{aar_timeline}}

## 10. Metrics and Reporting

### 10.1 IR Metrics
- Mean Time to Detect (MTTD): {{mttd_target}}
- Mean Time to Respond (MTTR): {{mttr_target}}
- Mean Time to Contain (MTTC): {{mttc_target}}
- Mean Time to Recover: {{recovery_target}}
- False positive rate
- Incident recurrence rate

### 10.2 Monthly IR Report
**Recipients:** {{monthly_report_recipients}}
**Contents:**
- Incident summary
- Metrics and trends
- Improvement status
- Training completed

### 10.3 Annual IR Assessment
**Timing:** {{annual_assessment_date}}
**Scope:** Full IR capability review
**Auditor:** {{ir_auditor}}

## 11. Plan Maintenance

### 11.1 Review Schedule
**Quarterly:** Contact lists and procedures
**Annually:** Full plan review and update
**Post-Incident:** Update based on lessons learned

### 11.2 Change Management
**Change Requests:** {{change_request_process}}
**Approval:** {{plan_change_approver}}
**Distribution:** {{plan_distribution_method}}

### 11.3 Version Control
**Current Version:** {{version}}
**Previous Versions:** {{archive_location}}
**Approval History:** {{approval_history}}

## 12. Related Documents
- System Security Plan (SSP)
- Contingency Plan (ISCP)
- Configuration Management Plan (CMP)
- Rules of Behavior (RoB)
- Privacy Incident Response Procedures

## 13. Appendices

### Appendix A: Contact Lists
**Location:** {{contact_list_location}}
**Update Frequency:** Monthly

### Appendix B: Incident Classification Matrix
**Location:** {{classification_matrix}}

### Appendix C: Response Playbooks
**Location:** {{playbook_location}}
**Scenarios:** Ransomware, Data Breach, DDoS, Insider Threat, Supply Chain

### Appendix D: Communication Templates
**Location:** {{template_location}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}
**Next Review:** {{next_review}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      document_date: { type: 'date', label: 'Document Date', required: true },
      version: { type: 'text', label: 'Version', required: true },
      systems_covered: { type: 'text', label: 'Systems Covered', required: true },
      ir_manager: { type: 'text', label: 'IR Manager Name', required: true },
      ir_manager_contact: { type: 'text', label: 'IR Manager Contact', required: true },
      ir_manager_backup: { type: 'text', label: 'IR Manager Backup', required: true },
      security_lead: { type: 'text', label: 'Security Lead Name', required: true },
      security_contact: { type: 'text', label: 'Security Lead Contact', required: true },
      security_backup: { type: 'text', label: 'Security Lead Backup', required: true },
      tech_lead: { type: 'text', label: 'Technical Lead Name', required: true },
      tech_contact: { type: 'text', label: 'Technical Lead Contact', required: true },
      tech_backup: { type: 'text', label: 'Technical Lead Backup', required: true },
      comms_lead: { type: 'text', label: 'Communications Lead', required: true },
      comms_contact: { type: 'text', label: 'Communications Contact', required: true },
      comms_backup: { type: 'text', label: 'Communications Backup', required: true },
      legal_contact: { type: 'text', label: 'Legal Counsel Name', required: true },
      legal_phone: { type: 'text', label: 'Legal Phone', required: true },
      legal_backup: { type: 'text', label: 'Legal Backup', required: true },
      executive_contact: { type: 'text', label: 'Executive Contact', required: true },
      executive_phone: { type: 'text', label: 'Executive Phone', required: true },
      oncall_schedule: { type: 'text', label: 'On-Call Schedule Location', required: true },
      response_time_requirement: { type: 'select', label: 'Response Time Requirement', required: true, options: ['15 minutes', '30 minutes', '1 hour'] },
      critical_response: { type: 'select', label: 'Critical Incident Response Time', required: true, options: ['15 minutes', '30 minutes', '1 hour'] },
      high_response: { type: 'select', label: 'High Incident Response Time', required: true, options: ['1 hour', '2 hours', '4 hours'] },
      medium_response: { type: 'select', label: 'Medium Incident Response Time', required: true, options: ['4 hours', '8 hours', '24 hours'] },
      low_response: { type: 'select', label: 'Low Incident Response Time', required: true, options: ['Next business day', '48 hours', '1 week'] },
      ir_training_freq: { type: 'select', label: 'IR Training Frequency', required: true, options: ['Monthly', 'Quarterly', 'Semi-annually'] },
      tabletop_freq: { type: 'select', label: 'Tabletop Exercise Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] },
      siem_tool: { type: 'text', label: 'SIEM Tool', required: true },
      forensics_tools: { type: 'text', label: 'Forensics Tools', required: true },
      ir_comm_platform: { type: 'text', label: 'IR Communication Platform', required: true },
      ir_ticketing: { type: 'text', label: 'IR Ticketing System', required: true },
      monitoring_system: { type: 'text', label: 'Security Monitoring System', required: true },
      user_report_method: { type: 'text', label: 'User Reporting Method', required: true },
      threat_feeds: { type: 'text', label: 'Threat Intelligence Feeds', required: true },
      external_notification_process: { type: 'text', label: 'External Notification Process', required: true },
      triage_timeline: { type: 'select', label: 'Triage Timeline', required: true, options: ['15 minutes', '30 minutes', '1 hour'] },
      assessment_timeline: { type: 'select', label: 'Assessment Timeline', required: true, options: ['1 hour', '2 hours', '4 hours'] },
      analysis_timeline: { type: 'select', label: 'Full Analysis Timeline', required: true, options: ['4 hours', '8 hours', '24 hours'] },
      isolation_method: { type: 'text', label: 'System Isolation Method', required: true },
      blocking_method: { type: 'text', label: 'IP/Domain Blocking Method', required: true },
      account_disable_process: { type: 'text', label: 'Account Disable Process', required: true },
      evidence_preservation: { type: 'text', label: 'Evidence Preservation Method', required: true },
      containment_authority: { type: 'text', label: 'Containment Authority', required: true },
      containment_timeline: { type: 'select', label: 'Containment Timeline', required: true, options: ['1 hour', '2 hours', '4 hours', '8 hours'] },
      temp_fix_process: { type: 'text', label: 'Temporary Fix Process', required: true },
      enhanced_monitoring: { type: 'text', label: 'Enhanced Monitoring Method', required: true },
      emergency_patching: { type: 'text', label: 'Emergency Patching Process', required: true },
      rebuild_process: { type: 'text', label: 'System Rebuild Process', required: true },
      malware_removal_tools: { type: 'text', label: 'Malware Removal Tools', required: true },
      vulnerability_remediation: { type: 'text', label: 'Vulnerability Remediation Process', required: true },
      defense_improvements: { type: 'text', label: 'Defense Improvement Process', required: true },
      config_updates: { type: 'text', label: 'Configuration Update Process', required: true },
      scan_tool: { type: 'text', label: 'Malware Scan Tool', required: true },
      vuln_assessment_tool: { type: 'text', label: 'Vulnerability Assessment Tool', required: true },
      config_review_process: { type: 'text', label: 'Configuration Review Process', required: true },
      eradication_approver: { type: 'text', label: 'Eradication Sign-off Authority', required: true },
      backup_restoration: { type: 'text', label: 'Backup Restoration Process', required: true },
      rebuild_procedure: { type: 'text', label: 'Rebuild Procedure', required: true },
      hardening_standards: { type: 'text', label: 'Security Hardening Standards', required: true },
      integrity_verification: { type: 'text', label: 'Integrity Verification Method', required: true },
      post_recovery_monitoring: { type: 'text', label: 'Post-Recovery Monitoring Period', required: true },
      recovery_timeline: { type: 'text', label: 'Recovery Timeline Target', required: true },
      validation_period: { type: 'select', label: 'Validation Period', required: true, options: ['24 hours', '48 hours', '72 hours', '1 week'] },
      recovery_testing: { type: 'text', label: 'Recovery Testing Process', required: true },
      recovery_approver: { type: 'text', label: 'Recovery Approval Authority', required: true },
      phased_recovery: { type: 'text', label: 'Phased Recovery Approach', required: true },
      lessons_learned_timeline: { type: 'select', label: 'Lessons Learned Timeline', required: true, options: ['1 week', '2 weeks', '30 days'] },
      lessons_learned_facilitator: { type: 'text', label: 'Lessons Learned Facilitator', required: true },
      pir_timeline: { type: 'select', label: 'Post-Incident Report Due', required: true, options: ['1 week', '2 weeks', '30 days'] },
      pir_recipients: { type: 'text', label: 'PIR Recipients', required: true },
      control_update_process: { type: 'text', label: 'Security Control Update Process', required: true },
      procedure_revision_owner: { type: 'text', label: 'Procedure Revision Owner', required: true },
      improvement_owner: { type: 'text', label: 'Improvement Implementation Owner', required: true },
      metrics_tracking: { type: 'text', label: 'Metrics Tracking System', required: true },
      irt_comm_channel: { type: 'text', label: 'IRT Communication Channel', required: true },
      mgmt_update_freq: { type: 'select', label: 'Management Update Frequency', required: true, options: ['Hourly', 'Every 4 hours', 'Daily'] },
      staff_notification_method: { type: 'text', label: 'Staff Notification Method', required: true },
      fedramp_update_freq: { type: 'select', label: 'FedRAMP Update Frequency', required: true, options: ['Every 4 hours', 'Every 8 hours', 'Daily'] },
      fedramp_final_timeline: { type: 'select', label: 'FedRAMP Final Report Timeline', required: true, options: ['7 days', '14 days', '30 days'] },
      customer_notification_threshold: { type: 'text', label: 'Customer Notification Threshold', required: true },
      customer_notification_timeline: { type: 'select', label: 'Customer Notification Timeline', required: true, options: ['24 hours', '48 hours', '72 hours'] },
      customer_notification_method: { type: 'text', label: 'Customer Notification Method', required: true },
      customer_spokesperson: { type: 'text', label: 'Customer Spokesperson', required: true },
      law_enforcement_threshold: { type: 'text', label: 'Law Enforcement Reporting Threshold', required: true },
      law_enforcement_contact: { type: 'text', label: 'Law Enforcement Contact', required: true },
      le_coordination_process: { type: 'text', label: 'LE Coordination Process', required: true },
      media_approval_authority: { type: 'text', label: 'Media Statement Approval Authority', required: true },
      media_spokesperson: { type: 'text', label: 'Media Spokesperson', required: true },
      media_messaging_process: { type: 'text', label: 'Media Messaging Process', required: true },
      template_location: { type: 'text', label: 'Communication Templates Location', required: true },
      evidence_collection_tools: { type: 'text', label: 'Evidence Collection Tools', required: true },
      custody_process: { type: 'text', label: 'Chain of Custody Process', required: true },
      evidence_storage: { type: 'text', label: 'Evidence Storage Location', required: true },
      evidence_retention: { type: 'select', label: 'Evidence Retention Period', required: true, options: ['1 year', '3 years', '7 years'] },
      forensic_team: { type: 'text', label: 'Forensic Team/Vendor', required: true },
      write_protection_method: { type: 'text', label: 'Write Protection Method', required: true },
      hash_algorithm: { type: 'select', label: 'Hash Algorithm', required: true, options: ['SHA-256', 'SHA-512', 'MD5+SHA-256'] },
      legal_hold_process: { type: 'text', label: 'Legal Hold Process', required: true },
      privilege_considerations: { type: 'text', label: 'Privilege Considerations', required: true },
      disclosure_requirements: { type: 'text', label: 'Disclosure Requirements', required: true },
      reporting_requirement: { type: 'text', label: 'US-CERT Reporting Requirement', required: true },
      aws_incident_contact: { type: 'text', label: 'AWS Incident Contact', required: true },
      azure_incident_contact: { type: 'text', label: 'Azure Incident Contact', required: true },
      gcp_incident_contact: { type: 'text', label: 'GCP Incident Contact', required: true },
      security_vendor_contacts: { type: 'text', label: 'Security Vendor Contacts', required: true },
      msp_contacts: { type: 'text', label: 'Managed Service Provider Contacts', required: true },
      forensics_vendor: { type: 'text', label: 'Forensics Vendor Contact', required: true },
      fullscale_freq: { type: 'select', label: 'Full-Scale Exercise Frequency', required: true, options: ['Annually', 'Bi-annually'] },
      aar_timeline: { type: 'select', label: 'After-Action Report Timeline', required: true, options: ['1 week', '2 weeks', '30 days'] },
      mttd_target: { type: 'text', label: 'MTTD Target', required: true },
      mttr_target: { type: 'text', label: 'MTTR Target', required: true },
      mttc_target: { type: 'text', label: 'MTTC Target', required: true },
      recovery_target: { type: 'text', label: 'Recovery Time Target', required: true },
      monthly_report_recipients: { type: 'text', label: 'Monthly Report Recipients', required: true },
      annual_assessment_date: { type: 'text', label: 'Annual Assessment Date', required: true },
      ir_auditor: { type: 'text', label: 'IR Auditor', required: true },
      change_request_process: { type: 'text', label: 'Change Request Process', required: true },
      plan_change_approver: { type: 'text', label: 'Plan Change Approver', required: true },
      plan_distribution_method: { type: 'text', label: 'Plan Distribution Method', required: true },
      archive_location: { type: 'text', label: 'Archive Location', required: true },
      approval_history: { type: 'text', label: 'Approval History Location', required: true },
      contact_list_location: { type: 'text', label: 'Contact List Location', required: true },
      classification_matrix: { type: 'text', label: 'Classification Matrix Location', required: true },
      playbook_location: { type: 'text', label: 'Response Playbooks Location', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true },
      next_review: { type: 'date', label: 'Next Review Date', required: true }
    }
  }
];

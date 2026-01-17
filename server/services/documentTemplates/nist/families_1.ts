import { DocumentTemplate } from '../types';

export const NIST80053ControlFamilyTemplatesPart1: DocumentTemplate[] = [
  {
    id: 'nist-au',
    title: 'Audit and Accountability (AU) Family',
    description: 'NIST 800-53 Rev 5 Audit and Accountability family documentation',
    framework: 'NIST-800-53',
    category: 'AU',
    priority: 2,
    documentType: 'policy',
    required: true,
    templateContent: `# Audit and Accountability (AU) Family
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}

## AU-1 Policy and Procedures
{{company_name}} develops, documents, and disseminates audit and accountability policy.

## AU-2 Event Logging
Auditable events include:
- Successful and unsuccessful logon attempts
- Privileged operations
- Security-relevant configuration changes
- Account management activities
- Access to audit logs
- {{additional_events}}

## AU-3 Content of Audit Records
Audit records contain:
- Date and time
- Type of event
- Subject identity
- Outcome
- {{additional_content}}

## AU-4 Audit Log Storage Capacity
- Allocated storage: {{storage_capacity}}
- Alert threshold: {{alert_threshold}}%

## AU-5 Response to Audit Logging Process Failures
- Alert personnel: {{alert_personnel}}
- Failover action: {{failover_action}}

## AU-6 Audit Record Review, Analysis, and Reporting
- Review frequency: {{review_frequency}}
- Analysis tools: {{analysis_tools}}
- Reporting: {{reporting_schedule}}

## AU-7 Audit Record Reduction and Report Generation
Audit reduction capability: {{reduction_capability}}

## AU-8 Time Stamps
Time synchronization: {{time_source}}
Granularity: {{time_granularity}}

## AU-9 Protection of Audit Information
- Access restricted to: {{audit_access}}
- Integrity protection: {{integrity_protection}}
- Backup: {{audit_backup}}

## AU-11 Audit Record Retention
Retention period: {{retention_period}}

## AU-12 Audit Record Generation
Audit generation by: {{audit_components}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      additional_events: { type: 'text', label: 'Additional Auditable Events', required: false },
      storage_capacity: { type: 'text', label: 'Audit Storage Capacity', required: true },
      alert_threshold: { type: 'number', label: 'Alert Threshold (%)', required: true },
      alert_personnel: { type: 'text', label: 'Alert Personnel', required: true },
      review_frequency: { type: 'select', label: 'Review Frequency', required: true, options: ['Daily', 'Weekly', 'Monthly'] },
      analysis_tools: { type: 'text', label: 'Analysis Tools', required: true },
      time_source: { type: 'text', label: 'Time Source', required: true },
      retention_period: { type: 'text', label: 'Retention Period', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-cm',
    title: 'Configuration Management (CM) Family',
    description: 'NIST 800-53 Rev 5 Configuration Management family documentation',
    framework: 'NIST-800-53',
    category: 'CM',
    priority: 3,
    documentType: 'policy',
    required: true,
    templateContent: `# Configuration Management (CM) Family
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}

## CM-1 Policy and Procedures
{{company_name}} develops, documents, and disseminates configuration management policy.

## CM-2 Baseline Configuration
- Baseline documentation: {{baseline_location}}
- Review frequency: {{baseline_review}}
- Baseline components: {{baseline_components}}

## CM-3 Configuration Change Control
Change control process:
1. Change request submitted
2. Security impact analysis
3. Approval obtained from {{approval_authority}}
4. Change implemented
5. Change verified and documented

## CM-4 Impact Analyses
Security impact analysis required for:
- {{impact_analysis_triggers}}

## CM-5 Access Restrictions for Change
Change access restricted to: {{change_access}}

## CM-6 Configuration Settings
- Security configuration guides: {{config_guides}}
- Deviation documentation required
- Settings validated: {{validation_frequency}}

## CM-7 Least Functionality
- Essential functions only
- Prohibited functions: {{prohibited_functions}}
- Port/protocol restrictions: {{port_restrictions}}

## CM-8 System Component Inventory
- Inventory maintained: {{inventory_location}}
- Update frequency: {{inventory_update}}
- Accuracy verified: {{inventory_verification}}

## CM-9 Configuration Management Plan
Configuration management plan location: {{cmp_location}}

## CM-10 Software Usage Restrictions
- Licensed software only
- P2P restrictions: {{p2p_policy}}

## CM-11 User-Installed Software
User installation policy: {{user_install_policy}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      baseline_location: { type: 'text', label: 'Baseline Documentation Location', required: true },
      baseline_review: { type: 'select', label: 'Baseline Review Frequency', required: true, options: ['Monthly', 'Quarterly', 'Semi-annually', 'Annually'] },
      baseline_components: { type: 'text', label: 'Baseline Components', required: true },
      approval_authority: { type: 'text', label: 'Change Approval Authority', required: true },
      change_access: { type: 'text', label: 'Change Access Roles', required: true },
      config_guides: { type: 'text', label: 'Configuration Guides', required: true },
      validation_frequency: { type: 'select', label: 'Settings Validation Frequency', required: true, options: ['Weekly', 'Monthly', 'Quarterly'] },
      prohibited_functions: { type: 'text', label: 'Prohibited Functions', required: true },
      inventory_location: { type: 'text', label: 'Inventory Location', required: true },
      inventory_update: { type: 'select', label: 'Inventory Update Frequency', required: true, options: ['Real-time', 'Daily', 'Weekly', 'Monthly'] },
      user_install_policy: { type: 'select', label: 'User Install Policy', required: true, options: ['Prohibited', 'Approved list only', 'With approval'] },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-ia',
    title: 'Identification and Authentication (IA) Family',
    description: 'NIST 800-53 Rev 5 Identification and Authentication family documentation',
    framework: 'NIST-800-53',
    category: 'IA',
    priority: 4,
    documentType: 'policy',
    required: true,
    templateContent: `# Identification and Authentication (IA) Family
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}

## IA-1 Policy and Procedures
{{company_name}} develops, documents, and disseminates identification and authentication policy.

## IA-2 Identification and Authentication (Organizational Users)
- Unique user IDs required
- Multi-factor authentication: {{mfa_requirement}}
- MFA for: {{mfa_scope}}

### IA-2 Enhancements
- Network access: MFA required
- Local access: {{local_mfa}}
- Remote access: MFA required
- Privileged accounts: {{privileged_mfa}}

## IA-3 Device Identification and Authentication
Device authentication: {{device_auth}}

## IA-4 Identifier Management
- Identifier assignment: {{id_assignment}}
- Identifier reuse: Prohibited for {{id_reuse_period}}
- Identifier deactivation: {{id_deactivation}}

## IA-5 Authenticator Management
### Password Requirements
- Minimum length: {{password_min_length}} characters
- Complexity: {{password_complexity}}
- Maximum age: {{password_max_age}} days
- Minimum age: {{password_min_age}} day(s)
- History: {{password_history}} passwords remembered
- Storage: Encrypted with {{password_encryption}}

### MFA Authenticators
- Types: {{mfa_types}}
- Provider: {{mfa_provider}}
- Recovery: {{mfa_recovery}}

## IA-6 Authentication Feedback
Authentication feedback obscured during input.

## IA-7 Cryptographic Module Authentication
FIPS 140-2/3 validated modules: {{fips_level}}

## IA-8 Identification and Authentication (Non-Organizational Users)
Non-organizational user authentication: {{external_auth}}

## IA-11 Re-authentication
Re-authentication required: {{reauth_triggers}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      mfa_requirement: { type: 'select', label: 'MFA Requirement', required: true, options: ['All users', 'Privileged only', 'Remote only'] },
      mfa_scope: { type: 'text', label: 'MFA Scope', required: true },
      device_auth: { type: 'text', label: 'Device Authentication Method', required: true },
      id_reuse_period: { type: 'text', label: 'ID Reuse Prohibition Period', required: true },
      password_min_length: { type: 'number', label: 'Password Minimum Length', required: true },
      password_complexity: { type: 'text', label: 'Password Complexity Requirements', required: true },
      password_max_age: { type: 'number', label: 'Password Maximum Age (days)', required: true },
      password_min_age: { type: 'number', label: 'Password Minimum Age (days)', required: true },
      password_history: { type: 'number', label: 'Password History Count', required: true },
      password_encryption: { type: 'text', label: 'Password Storage Encryption', required: true },
      mfa_types: { type: 'text', label: 'MFA Types', required: true },
      mfa_provider: { type: 'text', label: 'MFA Provider', required: true },
      fips_level: { type: 'select', label: 'FIPS 140 Level', required: true, options: ['Level 1', 'Level 2', 'Level 3', 'Level 4'] },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-ir',
    title: 'Incident Response (IR) Family',
    description: 'NIST 800-53 Rev 5 Incident Response family documentation',
    framework: 'NIST-800-53',
    category: 'IR',
    priority: 5,
    documentType: 'policy',
    required: true,
    templateContent: `# Incident Response (IR) Family
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}

## IR-1 Policy and Procedures
{{company_name}} develops, documents, and disseminates incident response policy.

## IR-2 Incident Response Training
- Initial training: Within {{initial_training}} days of role assignment
- Refresher training: {{refresher_frequency}}
- Training content: {{training_content}}

## IR-3 Incident Response Testing
- Test frequency: {{test_frequency}}
- Test types: {{test_types}}
- Last test date: {{last_test_date}}

## IR-4 Incident Handling
Incident handling process:
1. Preparation
2. Detection and Analysis
3. Containment
4. Eradication
5. Recovery
6. Post-Incident Activity

Automated mechanisms: {{automated_mechanisms}}

## IR-5 Incident Monitoring
Incident tracking system: {{tracking_system}}
Metrics collected: {{metrics}}

## IR-6 Incident Reporting
- Internal reporting: {{internal_reporting}}
- External reporting: {{external_reporting}}
- Reporting timeframes: {{reporting_timeframes}}

## IR-7 Incident Response Assistance
Assistance resource: {{assistance_resource}}

## IR-8 Incident Response Plan
- Plan location: {{plan_location}}
- Review frequency: {{plan_review}}
- Distribution: {{plan_distribution}}

## IR-9 Information Spillage Response
Spillage handling procedures: {{spillage_procedures}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      initial_training: { type: 'number', label: 'Initial Training (days)', required: true },
      refresher_frequency: { type: 'select', label: 'Refresher Frequency', required: true, options: ['Annually', 'Semi-annually', 'Quarterly'] },
      training_content: { type: 'text', label: 'Training Content', required: true },
      test_frequency: { type: 'select', label: 'Test Frequency', required: true, options: ['Annually', 'Semi-annually', 'Quarterly'] },
      test_types: { type: 'text', label: 'Test Types', required: true },
      tracking_system: { type: 'text', label: 'Tracking System', required: true },
      internal_reporting: { type: 'text', label: 'Internal Reporting Process', required: true },
      external_reporting: { type: 'text', label: 'External Reporting (e.g., US-CERT)', required: true },
      reporting_timeframes: { type: 'text', label: 'Reporting Timeframes', required: true },
      plan_location: { type: 'text', label: 'Plan Location', required: true },
      plan_review: { type: 'select', label: 'Plan Review Frequency', required: true, options: ['Annually', 'Semi-annually', 'After incidents'] },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-ra',
    title: 'Risk Assessment (RA) Family',
    description: 'NIST 800-53 Rev 5 Risk Assessment family documentation',
    framework: 'NIST-800-53',
    category: 'RA',
    priority: 6,
    documentType: 'policy',
    required: true,
    templateContent: `# Risk Assessment (RA) Family
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}

## RA-1 Policy and Procedures
{{company_name}} develops, documents, and disseminates risk assessment policy.

## RA-2 Security Categorization
- Categorization: FIPS 199
- Confidentiality: {{confidentiality_level}}
- Integrity: {{integrity_level}}
- Availability: {{availability_level}}
- Overall: {{overall_level}}

## RA-3 Risk Assessment
- Methodology: {{risk_methodology}}
- Frequency: {{assessment_frequency}}
- Scope: {{assessment_scope}}
- Results documented: {{results_location}}

Risk assessment includes:
- Threat identification
- Vulnerability identification
- Likelihood determination
- Impact analysis
- Risk determination

## RA-5 Vulnerability Monitoring and Scanning
- Scanning frequency: {{scan_frequency}}
- Scanner tools: {{scanner_tools}}
- Authenticated scanning: {{auth_scanning}}
- Coverage: {{scan_coverage}}%

Vulnerability handling:
- Critical: {{critical_remediation}} days
- High: {{high_remediation}} days
- Medium: {{medium_remediation}} days
- Low: {{low_remediation}} days

## RA-7 Risk Response
Risk response options:
- Accept
- Avoid
- Mitigate
- Share/Transfer

## RA-9 Criticality Analysis
Criticality analysis: {{criticality_analysis}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      confidentiality_level: { type: 'select', label: 'Confidentiality Level', required: true, options: ['Low', 'Moderate', 'High'] },
      integrity_level: { type: 'select', label: 'Integrity Level', required: true, options: ['Low', 'Moderate', 'High'] },
      availability_level: { type: 'select', label: 'Availability Level', required: true, options: ['Low', 'Moderate', 'High'] },
      overall_level: { type: 'select', label: 'Overall Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      risk_methodology: { type: 'select', label: 'Risk Methodology', required: true, options: ['NIST RMF', 'FAIR', 'OCTAVE', 'Custom'] },
      assessment_frequency: { type: 'select', label: 'Assessment Frequency', required: true, options: ['Annually', 'Semi-annually', 'Quarterly', 'After significant changes'] },
      scan_frequency: { type: 'select', label: 'Scan Frequency', required: true, options: ['Continuous', 'Weekly', 'Monthly', 'Quarterly'] },
      scanner_tools: { type: 'text', label: 'Scanner Tools', required: true },
      auth_scanning: { type: 'select', label: 'Authenticated Scanning', required: true, options: ['Yes', 'Partial', 'No'] },
      critical_remediation: { type: 'number', label: 'Critical Remediation (days)', required: true },
      high_remediation: { type: 'number', label: 'High Remediation (days)', required: true },
      medium_remediation: { type: 'number', label: 'Medium Remediation (days)', required: true },
      low_remediation: { type: 'number', label: 'Low Remediation (days)', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-sc',
    title: 'System and Communications Protection (SC) Family',
    description: 'NIST 800-53 Rev 5 System and Communications Protection family documentation',
    framework: 'NIST-800-53',
    category: 'SC',
    priority: 7,
    documentType: 'policy',
    required: true,
    templateContent: `# System and Communications Protection (SC) Family
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}

## SC-1 Policy and Procedures
{{company_name}} develops, documents, and disseminates system and communications protection policy.

## SC-5 Denial-of-Service Protection
DoS protection: {{dos_protection}}

## SC-7 Boundary Protection
- Boundary devices: {{boundary_devices}}
- DMZ implemented: {{dmz_implemented}}
- Traffic filtering: {{traffic_filtering}}

## SC-8 Transmission Confidentiality and Integrity
- Encryption in transit: {{transit_encryption}}
- Protocols: {{encryption_protocols}}

## SC-12 Cryptographic Key Establishment and Management
- Key management: {{key_management}}
- Key storage: {{key_storage}}
- Key rotation: {{key_rotation}}

## SC-13 Cryptographic Protection
- FIPS-validated: {{fips_validated}}
- Algorithms: {{crypto_algorithms}}

## SC-17 Public Key Infrastructure Certificates
PKI implementation: {{pki_implementation}}

## SC-23 Session Authenticity
Session protection: {{session_protection}}

## SC-28 Protection of Information at Rest
- Encryption at rest: {{rest_encryption}}
- Scope: {{encryption_scope}}

## SC-39 Process Isolation
Process isolation: {{process_isolation}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      dos_protection: { type: 'text', label: 'DoS Protection Mechanisms', required: true },
      boundary_devices: { type: 'text', label: 'Boundary Devices', required: true },
      dmz_implemented: { type: 'select', label: 'DMZ Implemented', required: true, options: ['Yes', 'No', 'Partial'] },
      traffic_filtering: { type: 'text', label: 'Traffic Filtering', required: true },
      transit_encryption: { type: 'text', label: 'Transit Encryption', required: true },
      encryption_protocols: { type: 'text', label: 'Encryption Protocols', required: true },
      key_management: { type: 'text', label: 'Key Management Solution', required: true },
      key_rotation: { type: 'text', label: 'Key Rotation Schedule', required: true },
      fips_validated: { type: 'select', label: 'FIPS Validated', required: true, options: ['Yes', 'In Progress', 'No'] },
      crypto_algorithms: { type: 'text', label: 'Cryptographic Algorithms', required: true },
      rest_encryption: { type: 'text', label: 'Encryption at Rest', required: true },
      encryption_scope: { type: 'text', label: 'Encryption Scope', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-si',
    title: 'System and Information Integrity (SI) Family',
    description: 'NIST 800-53 Rev 5 System and Information Integrity family documentation',
    framework: 'NIST-800-53',
    category: 'SI',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# System and Information Integrity (SI) Family
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}

## SI-1 Policy and Procedures
{{company_name}} develops, documents, and disseminates system and information integrity policy.

## SI-2 Flaw Remediation
- Patch frequency: {{patch_frequency}}
- Critical patches: {{critical_patch_timeline}}
- Testing required: {{patch_testing}}
- Patch management tool: {{patch_tool}}

## SI-3 Malicious Code Protection
- Anti-malware: {{antimalware_solution}}
- Update frequency: {{definition_updates}}
- Scan frequency: {{scan_frequency}}
- Real-time protection: {{realtime_protection}}

## SI-4 System Monitoring
- Monitoring tools: {{monitoring_tools}}
- Events monitored: {{monitored_events}}
- Alert thresholds: {{alert_thresholds}}

## SI-5 Security Alerts, Advisories, and Directives
- Sources: {{alert_sources}}
- Response process: {{alert_response}}

## SI-6 Security and Privacy Function Verification
Verification frequency: {{verification_frequency}}

## SI-7 Software, Firmware, and Information Integrity
- Integrity monitoring: {{integrity_monitoring}}
- Verification tools: {{verification_tools}}

## SI-10 Information Input Validation
Input validation: {{input_validation}}

## SI-11 Error Handling
Error handling: {{error_handling}}

## SI-12 Information Management and Retention
Retention: {{retention_policy}}

## SI-16 Memory Protection
Memory protection: {{memory_protection}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      patch_frequency: { type: 'select', label: 'Patch Frequency', required: true, options: ['Weekly', 'Monthly', 'Quarterly'] },
      critical_patch_timeline: { type: 'text', label: 'Critical Patch Timeline', required: true },
      patch_testing: { type: 'select', label: 'Patch Testing Required', required: true, options: ['Yes', 'Critical only', 'No'] },
      patch_tool: { type: 'text', label: 'Patch Management Tool', required: true },
      antimalware_solution: { type: 'text', label: 'Anti-malware Solution', required: true },
      definition_updates: { type: 'select', label: 'Definition Updates', required: true, options: ['Real-time', 'Daily', 'Weekly'] },
      scan_frequency: { type: 'select', label: 'Scan Frequency', required: true, options: ['Real-time', 'Daily', 'Weekly'] },
      realtime_protection: { type: 'select', label: 'Real-time Protection', required: true, options: ['Enabled', 'Disabled'] },
      monitoring_tools: { type: 'text', label: 'Monitoring Tools', required: true },
      monitored_events: { type: 'text', label: 'Monitored Events', required: true },
      alert_sources: { type: 'text', label: 'Alert Sources', required: true },
      integrity_monitoring: { type: 'text', label: 'Integrity Monitoring', required: true },
      input_validation: { type: 'text', label: 'Input Validation Methods', required: true },
      retention_policy: { type: 'text', label: 'Retention Policy', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  }
];

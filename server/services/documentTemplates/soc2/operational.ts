import { DocumentTemplate } from '../types';

export const OperationalTemplates: DocumentTemplate[] = [
  {
    id: 'soc2-sdlc',
    title: 'Secure Software Development Lifecycle (SDLC) Policy',
    description: 'SOC 2 CC8 - Secure development practices and SDLC requirements',
    framework: 'SOC2',
    category: 'security',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Secure Software Development Lifecycle (SDLC) Policy
## SOC 2 Trust Services - CC8

**Organization:** {{company_name}}
**Version:** {{version}}
**Effective Date:** {{effective_date}}

## 1. Purpose and Scope

This policy defines secure development practices throughout the software development lifecycle.

**Applies To:** {{applies_to}}

## 2. SDLC Methodology

**Framework:** {{sdlc_framework}}
**Stages:** {{sdlc_stages}}

## 3. Security Requirements

### Planning and Requirements
**Security Requirements:** {{security_requirements_process}}
**Threat Modeling:** {{threat_modeling_required}}
**Privacy Impact:** {{privacy_assessment_required}}

### Design
**Security Architecture Review:** {{architecture_review_required}}
**Design Patterns:** {{secure_design_patterns}}
**Data Flow Diagrams:** {{data_flow_required}}

### Development

#### Secure Coding Standards
**Coding Standards:** {{coding_standards}}
**OWASP Top 10:** Must address
**CWE/SANS Top 25:** Must address

#### Code Security
**Input Validation:** {{input_validation_requirements}}
**Output Encoding:** {{output_encoding_requirements}}
**Authentication/Authorization:** {{authn_authz_requirements}}
**Cryptography:** {{crypto_requirements}}
**Error Handling:** {{error_handling_requirements}}
**Logging:** {{logging_requirements}}

#### Dependencies and Libraries
**Approved Libraries:** {{approved_libraries}}
**Vulnerability Scanning:** {{dependency_scanning_tool}}
**Update Frequency:** {{dependency_update_frequency}}

### Testing

#### Security Testing Requirements
**Unit Tests:** {{unit_test_requirements}}
**Integration Tests:** {{integration_test_requirements}}
**Security Tests:** {{security_test_requirements}}

**Static Analysis (SAST):**
- Tool: {{sast_tool}}
- Frequency: {{sast_frequency}}
- Threshold: {{sast_threshold}}

**Dynamic Analysis (DAST):**
- Tool: {{dast_tool}}
- Frequency: {{dast_frequency}}
- Scope: {{dast_scope}}

**Dependency Scanning (SCA):**
- Tool: {{sca_tool}}
- Frequency: {{sca_frequency}}
- Action Threshold: {{sca_threshold}}

**Penetration Testing:**
- Frequency: {{pentest_frequency}}
- Scope: {{pentest_scope}}
- Provider: {{pentest_provider}}

### Deployment

**Pre-Production Checklist:** {{preprod_checklist}}
**Security Sign-Off Required:** {{security_signoff_required}}
**Deployment Approval:** {{deployment_approval}}

**Production Deployment:**
- Method: {{deployment_method}}
- Rollback Plan: Required
- Monitoring: {{deployment_monitoring}}

### Maintenance

**Patch Management:** Per Patch Management Policy
**Vulnerability Response:** {{vulnerability_response_timeline}}
**Security Updates:** {{security_update_process}}

## 4. Code Review

**Peer Review Required:** {{peer_review_required}}
**Security Review:** {{security_review_trigger}}
**Review Checklist:** {{review_checklist}}

## 5. Version Control

**System:** {{version_control_system}}
**Branch Strategy:** {{branch_strategy}}
**Commit Signing:** {{commit_signing_required}}
**Access Control:** {{vcs_access_control}}

## 6. Secrets Management

**Secrets Storage:** {{secrets_storage_system}}
**Hard-Coded Secrets:** Prohibited
**Credential Scanning:** {{credential_scanning_tool}}
**Rotation:** {{secret_rotation_frequency}}

## 7. CI/CD Pipeline Security

**Pipeline Tool:** {{cicd_tool}}
**Security Gates:**
- SAST: {{sast_gate}}
- Dependency scan: {{sca_gate}}
- Unit tests: {{test_gate}}
- Code coverage: {{coverage_gate}}

**Pipeline Access:** {{pipeline_access_control}}

## 8. Production Data

**Production Data in Non-Prod:** {{prod_data_policy}}
**Data Masking:** {{data_masking_requirements}}
**Test Data:** {{test_data_policy}}

## 9. Security Training

**Developer Training:** {{developer_training_requirements}}
**Frequency:** {{training_frequency}}
**Topics:** {{training_topics}}

## 10. Incident Response

**Security Bugs:** {{security_bug_process}}
**Disclosure:** {{vulnerability_disclosure_policy}}
**Bug Bounty:** {{bug_bounty_program}}

**Policy Owner:** {{policy_owner}}
**Review Frequency:** {{review_frequency}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true },
      applies_to: { type: 'text', label: 'Applies To', required: true },
      sdlc_framework: { type: 'select', label: 'SDLC Framework', required: true, options: ['Agile', 'Waterfall', 'DevOps', 'Hybrid'] },
      sdlc_stages: { type: 'text', label: 'SDLC Stages', required: true },
      security_requirements_process: { type: 'text', label: 'Security Requirements Process', required: true },
      threat_modeling_required: { type: 'select', label: 'Threat Modeling Required', required: true, options: ['Yes', 'No', 'For high-risk features'] },
      privacy_assessment_required: { type: 'select', label: 'Privacy Assessment Required', required: true, options: ['Yes', 'No', 'For data processing features'] },
      architecture_review_required: { type: 'select', label: 'Architecture Review Required', required: true, options: ['Yes', 'No', 'For major changes'] },
      secure_design_patterns: { type: 'text', label: 'Secure Design Patterns', required: true },
      data_flow_required: { type: 'select', label: 'Data Flow Diagrams Required', required: true, options: ['Yes', 'No', 'For data processing features'] },
      coding_standards: { type: 'text', label: 'Coding Standards', required: true },
      input_validation_requirements: { type: 'text', label: 'Input Validation Requirements', required: true },
      output_encoding_requirements: { type: 'text', label: 'Output Encoding Requirements', required: true },
      authn_authz_requirements: { type: 'text', label: 'AuthN/AuthZ Requirements', required: true },
      crypto_requirements: { type: 'text', label: 'Cryptography Requirements', required: true },
      error_handling_requirements: { type: 'text', label: 'Error Handling Requirements', required: true },
      logging_requirements: { type: 'text', label: 'Logging Requirements', required: true },
      approved_libraries: { type: 'text', label: 'Approved Libraries List', required: true },
      dependency_scanning_tool: { type: 'text', label: 'Dependency Scanning Tool', required: true },
      dependency_update_frequency: { type: 'select', label: 'Dependency Update Frequency', required: true, options: ['Weekly', 'Monthly', 'Quarterly'] },
      unit_test_requirements: { type: 'text', label: 'Unit Test Requirements', required: true },
      integration_test_requirements: { type: 'text', label: 'Integration Test Requirements', required: true },
      security_test_requirements: { type: 'text', label: 'Security Test Requirements', required: true },
      sast_tool: { type: 'text', label: 'SAST Tool', required: true },
      sast_frequency: { type: 'select', label: 'SAST Frequency', required: true, options: ['Every commit', 'Every PR', 'Daily', 'Weekly'] },
      sast_threshold: { type: 'text', label: 'SAST Threshold', required: true },
      dast_tool: { type: 'text', label: 'DAST Tool', required: true },
      dast_frequency: { type: 'select', label: 'DAST Frequency', required: true, options: ['Every deployment', 'Weekly', 'Monthly'] },
      dast_scope: { type: 'text', label: 'DAST Scope', required: true },
      sca_tool: { type: 'text', label: 'SCA Tool', required: true },
      sca_frequency: { type: 'select', label: 'SCA Frequency', required: true, options: ['Every commit', 'Every PR', 'Daily'] },
      sca_threshold: { type: 'text', label: 'SCA Threshold', required: true },
      pentest_frequency: { type: 'select', label: 'Penetration Test Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] },
      pentest_scope: { type: 'text', label: 'Pentest Scope', required: true },
      pentest_provider: { type: 'text', label: 'Pentest Provider', required: true },
      preprod_checklist: { type: 'text', label: 'Pre-Production Checklist', required: true },
      security_signoff_required: { type: 'select', label: 'Security Sign-Off Required', required: true, options: ['Yes', 'No', 'For major releases'] },
      deployment_approval: { type: 'text', label: 'Deployment Approval', required: true },
      deployment_method: { type: 'text', label: 'Deployment Method', required: true },
      deployment_monitoring: { type: 'text', label: 'Deployment Monitoring', required: true },
      vulnerability_response_timeline: { type: 'text', label: 'Vulnerability Response Timeline', required: true },
      security_update_process: { type: 'text', label: 'Security Update Process', required: true },
      peer_review_required: { type: 'select', label: 'Peer Review Required', required: true, options: ['Yes', 'No'] },
      security_review_trigger: { type: 'text', label: 'Security Review Trigger', required: true },
      review_checklist: { type: 'text', label: 'Review Checklist', required: true },
      version_control_system: { type: 'text', label: 'Version Control System', required: true },
      branch_strategy: { type: 'text', label: 'Branch Strategy', required: true },
      commit_signing_required: { type: 'select', label: 'Commit Signing Required', required: true, options: ['Yes', 'No'] },
      vcs_access_control: { type: 'text', label: 'VCS Access Control', required: true },
      secrets_storage_system: { type: 'text', label: 'Secrets Storage System', required: true },
      credential_scanning_tool: { type: 'text', label: 'Credential Scanning Tool', required: true },
      secret_rotation_frequency: { type: 'text', label: 'Secret Rotation Frequency', required: true },
      cicd_tool: { type: 'text', label: 'CI/CD Tool', required: true },
      sast_gate: { type: 'text', label: 'SAST Gate', required: true },
      sca_gate: { type: 'text', label: 'SCA Gate', required: true },
      test_gate: { type: 'text', label: 'Test Gate', required: true },
      coverage_gate: { type: 'text', label: 'Coverage Gate', required: true },
      pipeline_access_control: { type: 'text', label: 'Pipeline Access Control', required: true },
      prod_data_policy: { type: 'text', label: 'Production Data Policy', required: true },
      data_masking_requirements: { type: 'text', label: 'Data Masking Requirements', required: true },
      test_data_policy: { type: 'text', label: 'Test Data Policy', required: true },
      developer_training_requirements: { type: 'text', label: 'Developer Training Requirements', required: true },
      training_frequency: { type: 'select', label: 'Training Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] },
      training_topics: { type: 'text', label: 'Training Topics', required: true },
      security_bug_process: { type: 'text', label: 'Security Bug Process', required: true },
      vulnerability_disclosure_policy: { type: 'text', label: 'Vulnerability Disclosure Policy', required: true },
      bug_bounty_program: { type: 'text', label: 'Bug Bounty Program', required: false },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true },
      review_frequency: { type: 'select', label: 'Review Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] }
    }
  },
  {
    id: 'soc2-code-review',
    title: 'Code Review Policy',
    description: 'SOC 2 CC8 - Code review and quality assurance requirements',
    framework: 'SOC2',
    category: 'security',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Code Review Policy
## SOC 2 Trust Services - CC8

**Organization:** {{company_name}}
**Version:** {{version}}
**Effective Date:** {{effective_date}}

## 1. Purpose
This policy establishes code review requirements to ensure code quality and security.

## 2. Review Requirements

### All Code Changes
**Peer Review Required:** {{peer_review_required}}
**Approvals Required:** {{approvals_required}}
**Self-Approval:** Prohibited

### High-Risk Changes
**Definition:** {{high_risk_definition}}
**Additional Review:** {{additional_review_requirements}}
**Security Review:** {{security_review_required}}

## 3. Review Process

### Submission
**Pull Request Required:** Yes
**Title/Description:** {{pr_description_requirements}}
**Linked Issues:** {{issue_linking_required}}

### Review Checklist
- Code follows coding standards
- Security best practices applied
- Tests included and passing
- Documentation updated
- No hard-coded credentials
- Error handling implemented
- Input validation present
- {{additional_checklist_items}}

### Review Timeline
**Standard Changes:** {{standard_review_timeline}}
**Urgent Changes:** {{urgent_review_timeline}}
**Emergency Changes:** {{emergency_review_process}}

## 4. Automated Checks

**Required Checks:**
- Unit tests passing
- SAST scan passing
- Dependency scan passing
- Code coverage: {{coverage_threshold}}%
- {{additional_automated_checks}}

**Merge Blocking:** {{merge_blocking_checks}}

## 5. Security-Focused Review

**Security Review Triggers:**
- Authentication/authorization changes
- Cryptographic operations
- Data processing changes
- External integrations
- {{additional_security_triggers}}

**Security Reviewer:** {{security_reviewer_role}}

## 6. Documentation

**Review Comments:** Required for changes requested
**Approval Documentation:** {{approval_documentation_requirements}}
**Post-Merge:** {{post_merge_documentation}}

**Policy Owner:** {{policy_owner}}
**Review Frequency:** {{review_frequency}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true },
      peer_review_required: { type: 'select', label: 'Peer Review Required', required: true, options: ['Yes', 'No'] },
      approvals_required: { type: 'number', label: 'Approvals Required', required: true },
      high_risk_definition: { type: 'text', label: 'High-Risk Definition', required: true },
      additional_review_requirements: { type: 'text', label: 'Additional Review Requirements', required: true },
      security_review_required: { type: 'select', label: 'Security Review Required', required: true, options: ['Yes', 'No', 'For specific changes'] },
      pr_description_requirements: { type: 'text', label: 'PR Description Requirements', required: true },
      issue_linking_required: { type: 'select', label: 'Issue Linking Required', required: true, options: ['Yes', 'No', 'Recommended'] },
      additional_checklist_items: { type: 'text', label: 'Additional Checklist Items', required: false },
      standard_review_timeline: { type: 'text', label: 'Standard Review Timeline', required: true },
      urgent_review_timeline: { type: 'text', label: 'Urgent Review Timeline', required: true },
      emergency_review_process: { type: 'text', label: 'Emergency Review Process', required: true },
      coverage_threshold: { type: 'number', label: 'Code Coverage Threshold %', required: true },
      additional_automated_checks: { type: 'text', label: 'Additional Automated Checks', required: false },
      merge_blocking_checks: { type: 'text', label: 'Merge Blocking Checks', required: true },
      additional_security_triggers: { type: 'text', label: 'Additional Security Triggers', required: false },
      security_reviewer_role: { type: 'text', label: 'Security Reviewer Role', required: true },
      approval_documentation_requirements: { type: 'text', label: 'Approval Documentation Requirements', required: true },
      post_merge_documentation: { type: 'text', label: 'Post-Merge Documentation', required: true },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true },
      review_frequency: { type: 'select', label: 'Review Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] }
    }
  },
  {
    id: 'soc2-mfa',
    title: 'Multi-Factor Authentication (MFA) Policy',
    description: 'SOC 2 CC6 - Multi-factor authentication requirements',
    framework: 'SOC2',
    category: 'security',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Multi-Factor Authentication (MFA) Policy
## SOC 2 Trust Services - CC6

**Organization:** {{company_name}}
**Version:** {{version}}
**Effective Date:** {{effective_date}}

## 1. Purpose
This policy mandates multi-factor authentication to protect against unauthorized access.

## 2. MFA Requirements

### Required Systems
**Production Systems:** {{production_mfa_required}}
**VPN:** {{vpn_mfa_required}}
**Email:** {{email_mfa_required}}
**Cloud Services:** {{cloud_mfa_required}}
**Administrative Access:** {{admin_mfa_required}}
**Source Code Repositories:** {{vcs_mfa_required}}
**All Systems:** {{all_systems_mfa_required}}

### Authentication Factors

**Something You Know:**
- Password (minimum requirements per Password Policy)

**Something You Have (Choose One):**
- Hardware token: {{hardware_token_allowed}}
- Mobile authenticator app: {{mobile_app_allowed}}
- SMS code: {{sms_allowed}}
- Email code: {{email_code_allowed}}
- Biometric: {{biometric_allowed}}

**Approved MFA Methods:**
{{approved_mfa_methods}}

**Preferred Method:** {{preferred_mfa_method}}

## 3. Enrollment

### New Users
**Enrollment Timeline:** {{enrollment_timeline}}
**Enrollment Process:** {{enrollment_process}}
**Backup Method Required:** {{backup_method_required}}

### Existing Users
**Enrollment Deadline:** {{existing_user_deadline}}
**Grace Period:** {{grace_period}}

## 4. MFA Device Management

### Device Registration
**Maximum Devices:** {{max_devices}}
**Device Naming:** {{device_naming_requirements}}
**Registration Approval:** {{registration_approval}}

### Lost/Stolen Device
**Reporting:** Immediately to {{reporting_contact}}
**Device Removal:** {{device_removal_process}}
**Re-enrollment:** {{reenrollment_process}}

### Device Replacement
**Process:** {{device_replacement_process}}
**Verification:** {{replacement_verification}}

## 5. Exceptions

### Exception Process
**Request:** {{exception_request_process}}
**Approval:** {{exception_approval}}
**Justification:** {{exception_justification_requirements}}
**Duration:** {{exception_duration}}
**Review:** {{exception_review_frequency}}

### Compensating Controls
{{compensating_controls}}

## 6. Session Management

**Session Timeout:** {{session_timeout}}
**Re-authentication Required:** {{reauth_required}}
**Remember Device:** {{remember_device_allowed}}
**Remember Duration:** {{remember_duration}}

## 7. Compliance and Monitoring

### Monitoring
**MFA Enrollment Rate:** {{enrollment_monitoring}}
**Failed MFA Attempts:** {{failed_attempt_monitoring}}
**Reporting:** {{mfa_reporting_frequency}}

### Enforcement
**Non-Compliance:** {{non_compliance_action}}
**Access Suspension:** {{access_suspension_policy}}

**Policy Owner:** {{policy_owner}}
**Review Frequency:** {{review_frequency}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true },
      production_mfa_required: { type: 'select', label: 'Production Systems MFA Required', required: true, options: ['Yes', 'No'] },
      vpn_mfa_required: { type: 'select', label: 'VPN MFA Required', required: true, options: ['Yes', 'No'] },
      email_mfa_required: { type: 'select', label: 'Email MFA Required', required: true, options: ['Yes', 'No'] },
      cloud_mfa_required: { type: 'select', label: 'Cloud Services MFA Required', required: true, options: ['Yes', 'No'] },
      admin_mfa_required: { type: 'select', label: 'Admin Access MFA Required', required: true, options: ['Yes', 'No'] },
      vcs_mfa_required: { type: 'select', label: 'VCS MFA Required', required: true, options: ['Yes', 'No'] },
      all_systems_mfa_required: { type: 'select', label: 'All Systems MFA Required', required: true, options: ['Yes', 'No'] },
      hardware_token_allowed: { type: 'select', label: 'Hardware Token Allowed', required: true, options: ['Yes', 'No'] },
      mobile_app_allowed: { type: 'select', label: 'Mobile App Allowed', required: true, options: ['Yes', 'No'] },
      sms_allowed: { type: 'select', label: 'SMS Allowed', required: true, options: ['Yes', 'No', 'Discouraged'] },
      email_code_allowed: { type: 'select', label: 'Email Code Allowed', required: true, options: ['Yes', 'No'] },
      biometric_allowed: { type: 'select', label: 'Biometric Allowed', required: true, options: ['Yes', 'No'] },
      approved_mfa_methods: { type: 'text', label: 'Approved MFA Methods', required: true },
      preferred_mfa_method: { type: 'text', label: 'Preferred MFA Method', required: true },
      enrollment_timeline: { type: 'text', label: 'Enrollment Timeline', required: true },
      enrollment_process: { type: 'text', label: 'Enrollment Process', required: true },
      backup_method_required: { type: 'select', label: 'Backup Method Required', required: true, options: ['Yes', 'No'] },
      existing_user_deadline: { type: 'date', label: 'Existing User Deadline', required: false },
      grace_period: { type: 'text', label: 'Grace Period', required: false },
      max_devices: { type: 'number', label: 'Maximum Devices', required: true },
      device_naming_requirements: { type: 'text', label: 'Device Naming Requirements', required: true },
      registration_approval: { type: 'text', label: 'Registration Approval', required: true },
      reporting_contact: { type: 'text', label: 'Reporting Contact', required: true },
      device_removal_process: { type: 'text', label: 'Device Removal Process', required: true },
      reenrollment_process: { type: 'text', label: 'Re-enrollment Process', required: true },
      device_replacement_process: { type: 'text', label: 'Device Replacement Process', required: true },
      replacement_verification: { type: 'text', label: 'Replacement Verification', required: true },
      exception_request_process: { type: 'text', label: 'Exception Request Process', required: true },
      exception_approval: { type: 'text', label: 'Exception Approval', required: true },
      exception_justification_requirements: { type: 'text', label: 'Exception Justification Requirements', required: true },
      exception_duration: { type: 'text', label: 'Exception Duration', required: true },
      exception_review_frequency: { type: 'select', label: 'Exception Review Frequency', required: true, options: ['Weekly', 'Monthly', 'Quarterly'] },
      compensating_controls: { type: 'text', label: 'Compensating Controls', required: true },
      session_timeout: { type: 'text', label: 'Session Timeout', required: true },
      reauth_required: { type: 'text', label: 'Re-authentication Required', required: true },
      remember_device_allowed: { type: 'select', label: 'Remember Device Allowed', required: true, options: ['Yes', 'No'] },
      remember_duration: { type: 'text', label: 'Remember Duration', required: false },
      enrollment_monitoring: { type: 'text', label: 'Enrollment Monitoring', required: true },
      failed_attempt_monitoring: { type: 'text', label: 'Failed Attempt Monitoring', required: true },
      mfa_reporting_frequency: { type: 'select', label: 'MFA Reporting Frequency', required: true, options: ['Weekly', 'Monthly', 'Quarterly'] },
      non_compliance_action: { type: 'text', label: 'Non-Compliance Action', required: true },
      access_suspension_policy: { type: 'text', label: 'Access Suspension Policy', required: true },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true },
      review_frequency: { type: 'select', label: 'Review Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] }
    }
  },
  {
    id: 'soc2-password',
    title: 'Password Policy',
    description: 'SOC 2 CC6 - Password requirements and management',
    framework: 'SOC2',
    category: 'security',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Password Policy
## SOC 2 Trust Services - CC6

**Organization:** {{company_name}}
**Version:** {{version}}
**Effective Date:** {{effective_date}}

## 1. Password Requirements

### Complexity
**Minimum Length:** {{min_length}} characters
**Maximum Length:** {{max_length}} characters (if applicable)
**Character Requirements:**
- Uppercase letters: {{uppercase_required}}
- Lowercase letters: {{lowercase_required}}
- Numbers: {{numbers_required}}
- Special characters: {{special_required}}

**Complexity Rule:** {{complexity_rule}}

### Password History
**Previous Passwords Remembered:** {{password_history}}
**Reuse Restriction:** Cannot reuse last {{password_history}} passwords

### Password Expiration
**Expiration:** {{password_expiration}}
**Expiration Notice:** {{expiration_notice}}
**Grace Period:** {{grace_period}}

## 2. Password Creation

### Prohibited Passwords
- Dictionary words
- Company name or variations
- Username or variations
- Sequential characters (abc, 123)
- Repeated characters (aaa, 111)
- Previously breached passwords
- {{additional_prohibited}}

### Password Strength
**Strength Meter:** {{strength_meter_required}}
**Minimum Strength:** {{minimum_strength}}

## 3. Password Management

### Password Storage
**User Storage:** Password manager recommended
**Approved Password Managers:** {{approved_password_managers}}
**Written Passwords:** Prohibited

### Sharing and Disclosure
**Password Sharing:** Prohibited
**Service Accounts:** {{service_account_policy}}
**Shared Accounts:** {{shared_account_policy}}

## 4. Account Security

### Account Lockout
**Failed Attempts:** {{lockout_threshold}}
**Lockout Duration:** {{lockout_duration}}
**Unlock Process:** {{unlock_process}}

### Password Reset

**Self-Service Reset:**
- Available: {{self_service_available}}
- Verification: {{reset_verification_method}}
- Security Questions: {{security_questions_required}}

**IT-Assisted Reset:**
- Process: {{it_reset_process}}
- Verification: {{it_verification_requirements}}
- Delivery: {{password_delivery_method}}

**Temporary Passwords:**
- Change Required: On first login
- Expiration: {{temp_password_expiration}}

## 5. Multi-Factor Authentication

**MFA Required:** Per MFA Policy
**MFA Reduces Requirements:** {{mfa_reduces_requirements}}

## 6. Special Accounts

### Administrative Accounts
**Minimum Length:** {{admin_min_length}} characters
**Expiration:** {{admin_expiration}}
**Additional Requirements:** {{admin_additional_requirements}}

### Service Accounts
**Management:** {{service_account_management}}
**Rotation:** {{service_account_rotation}}
**Storage:** {{service_account_storage}}

### Emergency Access
**Break-Glass Accounts:** {{break_glass_policy}}
**Usage Logging:** {{emergency_access_logging}}

## 7. System-Specific Requirements

### Corporate Systems
**Requirements:** As defined above

### Customer-Facing Systems
**Requirements:** {{customer_system_requirements}}

### Legacy Systems
**Exceptions:** {{legacy_system_exceptions}}
**Compensating Controls:** {{legacy_compensating_controls}}

## 8. Monitoring and Compliance

### Monitoring
**Weak Passwords:** {{weak_password_monitoring}}
**Breach Databases:** {{breach_monitoring}}
**Compliance Rate:** {{compliance_monitoring}}

### Enforcement
**Non-Compliance:** {{non_compliance_action}}
**Account Suspension:** {{suspension_policy}}

### Reporting
**Frequency:** {{reporting_frequency}}
**Metrics:**
- Password compliance rate
- Reset frequency
- Lockout frequency
- MFA adoption rate

**Policy Owner:** {{policy_owner}}
**Review Frequency:** {{review_frequency}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true },
      min_length: { type: 'number', label: 'Minimum Length', required: true },
      max_length: { type: 'number', label: 'Maximum Length', required: false },
      uppercase_required: { type: 'select', label: 'Uppercase Required', required: true, options: ['Yes', 'No'] },
      lowercase_required: { type: 'select', label: 'Lowercase Required', required: true, options: ['Yes', 'No'] },
      numbers_required: { type: 'select', label: 'Numbers Required', required: true, options: ['Yes', 'No'] },
      special_required: { type: 'select', label: 'Special Characters Required', required: true, options: ['Yes', 'No'] },
      complexity_rule: { type: 'text', label: 'Complexity Rule', required: true },
      password_history: { type: 'number', label: 'Password History', required: true },
      password_expiration: { type: 'text', label: 'Password Expiration', required: true },
      expiration_notice: { type: 'text', label: 'Expiration Notice', required: true },
      grace_period: { type: 'text', label: 'Grace Period', required: true },
      additional_prohibited: { type: 'text', label: 'Additional Prohibited Patterns', required: false },
      strength_meter_required: { type: 'select', label: 'Strength Meter Required', required: true, options: ['Yes', 'No'] },
      minimum_strength: { type: 'text', label: 'Minimum Strength', required: true },
      approved_password_managers: { type: 'text', label: 'Approved Password Managers', required: true },
      service_account_policy: { type: 'text', label: 'Service Account Policy', required: true },
      shared_account_policy: { type: 'text', label: 'Shared Account Policy', required: true },
      lockout_threshold: { type: 'number', label: 'Lockout Threshold', required: true },
      lockout_duration: { type: 'text', label: 'Lockout Duration', required: true },
      unlock_process: { type: 'text', label: 'Unlock Process', required: true },
      self_service_available: { type: 'select', label: 'Self-Service Available', required: true, options: ['Yes', 'No'] },
      reset_verification_method: { type: 'text', label: 'Reset Verification Method', required: true },
      security_questions_required: { type: 'select', label: 'Security Questions Required', required: true, options: ['Yes', 'No'] },
      it_reset_process: { type: 'text', label: 'IT Reset Process', required: true },
      it_verification_requirements: { type: 'text', label: 'IT Verification Requirements', required: true },
      password_delivery_method: { type: 'text', label: 'Password Delivery Method', required: true },
      temp_password_expiration: { type: 'text', label: 'Temp Password Expiration', required: true },
      mfa_reduces_requirements: { type: 'select', label: 'MFA Reduces Requirements', required: true, options: ['Yes', 'No'] },
      admin_min_length: { type: 'number', label: 'Admin Minimum Length', required: true },
      admin_expiration: { type: 'text', label: 'Admin Password Expiration', required: true },
      admin_additional_requirements: { type: 'text', label: 'Admin Additional Requirements', required: true },
      service_account_management: { type: 'text', label: 'Service Account Management', required: true },
      service_account_rotation: { type: 'text', label: 'Service Account Rotation', required: true },
      service_account_storage: { type: 'text', label: 'Service Account Storage', required: true },
      break_glass_policy: { type: 'text', label: 'Break-Glass Policy', required: true },
      emergency_access_logging: { type: 'text', label: 'Emergency Access Logging', required: true },
      customer_system_requirements: { type: 'text', label: 'Customer System Requirements', required: true },
      legacy_system_exceptions: { type: 'text', label: 'Legacy System Exceptions', required: false },
      legacy_compensating_controls: { type: 'text', label: 'Legacy Compensating Controls', required: false },
      weak_password_monitoring: { type: 'text', label: 'Weak Password Monitoring', required: true },
      breach_monitoring: { type: 'text', label: 'Breach Monitoring', required: true },
      compliance_monitoring: { type: 'text', label: 'Compliance Monitoring', required: true },
      non_compliance_action: { type: 'text', label: 'Non-Compliance Action', required: true },
      suspension_policy: { type: 'text', label: 'Suspension Policy', required: true },
      reporting_frequency: { type: 'select', label: 'Reporting Frequency', required: true, options: ['Monthly', 'Quarterly', 'Semi-annually'] },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true },
      review_frequency: { type: 'select', label: 'Review Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] }
    }
  },
  {
    id: 'soc2-network-security',
    title: 'Network Security Policy',
    description: 'SOC 2 CC6 - Network security controls and segmentation',
    framework: 'SOC2',
    category: 'security',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Network Security Policy
## SOC 2 Trust Services - CC6

**Organization:** {{company_name}}
**Version:** {{version}}
**Effective Date:** {{effective_date}}

## 1. Network Architecture

### Network Segmentation
**Segmentation Required:** {{segmentation_required}}
**Zones:** {{network_zones}}
**DMZ:** {{dmz_required}}

### VLAN Configuration
**VLANs:** {{vlan_configuration}}
**Inter-VLAN Routing:** {{inter_vlan_routing}}

## 2. Perimeter Security

### Firewall
**Type:** {{firewall_type}}
**Configuration:** {{firewall_configuration}}
**Rule Review:** {{firewall_rule_review_frequency}}
**Default Deny:** {{default_deny}}

### Intrusion Detection/Prevention
**IDS/IPS:** {{ids_ips_deployed}}
**Monitoring:** {{ids_monitoring}}
**Alert Response:** {{ids_alert_response}}

### DDoS Protection
**Protection:** {{ddos_protection}}
**Provider:** {{ddos_provider}}

## 3. Network Access Control

### Remote Access
**VPN Required:** {{vpn_required}}
**VPN Type:** {{vpn_type}}
**MFA for VPN:** {{vpn_mfa_required}}
**Split Tunneling:** {{split_tunneling_allowed}}

### Wireless Security
**Wireless Available:** {{wireless_available}}
**Encryption:** {{wireless_encryption}}
**Guest Network:** {{guest_network_available}}
**Guest Network Isolation:** {{guest_isolation}}

### NAC (Network Access Control)
**NAC Deployed:** {{nac_deployed}}
**Requirements:** {{nac_requirements}}

## 4. Network Monitoring

### Logging
**Network Logs:** {{network_logging}}
**Log Retention:** {{log_retention}}
**Log Analysis:** {{log_analysis_tool}}

### Traffic Monitoring
**Monitoring Tool:** {{traffic_monitoring_tool}}
**Anomaly Detection:** {{anomaly_detection}}
**Bandwidth Monitoring:** {{bandwidth_monitoring}}

### SIEM Integration
**SIEM:** {{siem_integration}}
**Alerts:** {{siem_alert_configuration}}

## 5. Network Services

### DNS
**DNS Service:** {{dns_service}}
**DNS Security:** {{dns_security}}
**DNSSEC:** {{dnssec_enabled}}

### DHCP
**DHCP Service:** {{dhcp_service}}
**IP Management:** {{ip_management}}

### NTP
**Time Synchronization:** {{ntp_service}}
**NTP Source:** {{ntp_source}}

## 6. Encryption

### Data in Transit
**Encryption Required:** {{encryption_required}}
**Protocols:** {{approved_protocols}}
**Prohibited:** {{prohibited_protocols}}
**TLS Version:** {{tls_version}}

### VPN Encryption
**Algorithm:** {{vpn_encryption}}
**Key Length:** {{vpn_key_length}}

## 7. Network Device Security

### Device Hardening
**Baseline Configuration:** {{device_baseline}}
**Unnecessary Services:** Disabled
**SNMP:** {{snmp_configuration}}

### Access Control
**Administrative Access:** {{admin_access_controls}}
**SSH Required:** {{ssh_required}}
**Telnet:** Prohibited

### Patching
**Patch Management:** Per Patch Management Policy
**Emergency Patches:** {{emergency_patch_process}}

## 8. Cloud Network Security

### Cloud Provider
**Providers:** {{cloud_providers}}
**Security Groups:** {{security_group_configuration}}
**Network ACLs:** {{network_acl_configuration}}

### Hybrid Connectivity
**Site-to-Site VPN:** {{site_to_site_vpn}}
**Direct Connect:** {{direct_connect}}

## 9. Incident Response

### Network Incidents
**Detection:** {{network_incident_detection}}
**Response:** {{network_incident_response}}
**Containment:** {{network_containment_procedures}}

**Policy Owner:** {{policy_owner}}
**Review Frequency:** {{review_frequency}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true },
      segmentation_required: { type: 'select', label: 'Segmentation Required', required: true, options: ['Yes', 'No'] },
      network_zones: { type: 'text', label: 'Network Zones', required: true },
      dmz_required: { type: 'select', label: 'DMZ Required', required: true, options: ['Yes', 'No'] },
      vlan_configuration: { type: 'text', label: 'VLAN Configuration', required: true },
      inter_vlan_routing: { type: 'text', label: 'Inter-VLAN Routing', required: true },
      firewall_type: { type: 'text', label: 'Firewall Type', required: true },
      firewall_configuration: { type: 'text', label: 'Firewall Configuration', required: true },
      firewall_rule_review_frequency: { type: 'select', label: 'Firewall Rule Review Frequency', required: true, options: ['Monthly', 'Quarterly', 'Semi-annually'] },
      default_deny: { type: 'select', label: 'Default Deny', required: true, options: ['Yes', 'No'] },
      ids_ips_deployed: { type: 'select', label: 'IDS/IPS Deployed', required: true, options: ['Yes', 'No', 'IDS only', 'IPS only'] },
      ids_monitoring: { type: 'text', label: 'IDS Monitoring', required: true },
      ids_alert_response: { type: 'text', label: 'IDS Alert Response', required: true },
      ddos_protection: { type: 'select', label: 'DDoS Protection', required: true, options: ['Yes', 'No'] },
      ddos_provider: { type: 'text', label: 'DDoS Provider', required: false },
      vpn_required: { type: 'select', label: 'VPN Required', required: true, options: ['Yes', 'No'] },
      vpn_type: { type: 'text', label: 'VPN Type', required: true },
      vpn_mfa_required: { type: 'select', label: 'VPN MFA Required', required: true, options: ['Yes', 'No'] },
      split_tunneling_allowed: { type: 'select', label: 'Split Tunneling Allowed', required: true, options: ['Yes', 'No'] },
      wireless_available: { type: 'select', label: 'Wireless Available', required: true, options: ['Yes', 'No'] },
      wireless_encryption: { type: 'text', label: 'Wireless Encryption', required: true },
      guest_network_available: { type: 'select', label: 'Guest Network Available', required: true, options: ['Yes', 'No'] },
      guest_isolation: { type: 'select', label: 'Guest Network Isolation', required: true, options: ['Yes', 'No'] },
      nac_deployed: { type: 'select', label: 'NAC Deployed', required: true, options: ['Yes', 'No'] },
      nac_requirements: { type: 'text', label: 'NAC Requirements', required: false },
      network_logging: { type: 'text', label: 'Network Logging', required: true },
      log_retention: { type: 'text', label: 'Log Retention', required: true },
      log_analysis_tool: { type: 'text', label: 'Log Analysis Tool', required: true },
      traffic_monitoring_tool: { type: 'text', label: 'Traffic Monitoring Tool', required: true },
      anomaly_detection: { type: 'text', label: 'Anomaly Detection', required: true },
      bandwidth_monitoring: { type: 'text', label: 'Bandwidth Monitoring', required: true },
      siem_integration: { type: 'select', label: 'SIEM Integration', required: true, options: ['Yes', 'No'] },
      siem_alert_configuration: { type: 'text', label: 'SIEM Alert Configuration', required: false },
      dns_service: { type: 'text', label: 'DNS Service', required: true },
      dns_security: { type: 'text', label: 'DNS Security', required: true },
      dnssec_enabled: { type: 'select', label: 'DNSSEC Enabled', required: true, options: ['Yes', 'No'] },
      dhcp_service: { type: 'text', label: 'DHCP Service', required: true },
      ip_management: { type: 'text', label: 'IP Management', required: true },
      ntp_service: { type: 'text', label: 'NTP Service', required: true },
      ntp_source: { type: 'text', label: 'NTP Source', required: true },
      encryption_required: { type: 'select', label: 'Encryption Required', required: true, options: ['Yes', 'No'] },
      approved_protocols: { type: 'text', label: 'Approved Protocols', required: true },
      prohibited_protocols: { type: 'text', label: 'Prohibited Protocols', required: true },
      tls_version: { type: 'text', label: 'TLS Version', required: true },
      vpn_encryption: { type: 'text', label: 'VPN Encryption Algorithm', required: true },
      vpn_key_length: { type: 'text', label: 'VPN Key Length', required: true },
      device_baseline: { type: 'text', label: 'Device Baseline Configuration', required: true },
      snmp_configuration: { type: 'text', label: 'SNMP Configuration', required: true },
      admin_access_controls: { type: 'text', label: 'Admin Access Controls', required: true },
      ssh_required: { type: 'select', label: 'SSH Required', required: true, options: ['Yes', 'No'] },
      emergency_patch_process: { type: 'text', label: 'Emergency Patch Process', required: true },
      cloud_providers: { type: 'text', label: 'Cloud Providers', required: false },
      security_group_configuration: { type: 'text', label: 'Security Group Configuration', required: false },
      network_acl_configuration: { type: 'text', label: 'Network ACL Configuration', required: false },
      site_to_site_vpn: { type: 'text', label: 'Site-to-Site VPN', required: false },
      direct_connect: { type: 'text', label: 'Direct Connect', required: false },
      network_incident_detection: { type: 'text', label: 'Network Incident Detection', required: true },
      network_incident_response: { type: 'text', label: 'Network Incident Response', required: true },
      network_containment_procedures: { type: 'text', label: 'Network Containment Procedures', required: true },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true },
      review_frequency: { type: 'select', label: 'Review Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] }
    }
  },
  {
    id: 'soc2-data-quality',
    title: 'Data Quality Controls',
    description: 'SOC 2 PI1 - Data quality and processing integrity controls',
    framework: 'SOC2',
    category: 'operations',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Data Quality Controls
## SOC 2 Trust Services - PI1 (Processing Integrity)

**Organization:** {{company_name}}
**Version:** {{version}}
**Effective Date:** {{effective_date}}

## 1. Purpose
This policy establishes controls to ensure data quality, accuracy, completeness, and timeliness.

## 2. Data Quality Dimensions

### Accuracy
**Definition:** {{accuracy_definition}}
**Measurement:** {{accuracy_measurement}}
**Target:** {{accuracy_target}}%

### Completeness
**Definition:** {{completeness_definition}}
**Measurement:** {{completeness_measurement}}
**Target:** {{completeness_target}}%

### Consistency
**Definition:** {{consistency_definition}}
**Validation:** {{consistency_validation}}

### Timeliness
**Definition:** {{timeliness_definition}}
**SLA:** {{timeliness_sla}}

### Validity
**Definition:** {{validity_definition}}
**Validation Rules:** {{validation_rules}}

## 3. Data Input Controls

### Input Validation
**Required Fields:** {{required_fields_validation}}
**Format Validation:** {{format_validation}}
**Range Checks:** {{range_checks}}
**Business Rules:** {{business_rules_validation}}

### Error Handling
**Invalid Input:** {{invalid_input_handling}}
**Error Messages:** {{error_message_requirements}}
**Error Logging:** {{error_logging}}

### Duplicate Prevention
**Duplicate Detection:** {{duplicate_detection}}
**Merge Process:** {{duplicate_merge_process}}

## 4. Data Processing Controls

### Processing Validation
**Calculation Verification:** {{calculation_verification}}
**Transformation Rules:** {{transformation_rules}}
**Processing Logs:** {{processing_logs}}

### Automated Processing
**Automation Validation:** {{automation_validation}}
**Monitoring:** {{automated_process_monitoring}}
**Exception Handling:** {{exception_handling}}

### Batch Processing
**Batch Controls:** {{batch_controls}}
**Reconciliation:** {{batch_reconciliation}}
**Failure Handling:** {{batch_failure_handling}}

## 5. Data Output Controls

### Output Validation
**Completeness Checks:** {{output_completeness_checks}}
**Format Validation:** {{output_format_validation}}
**Reconciliation:** {{output_reconciliation}}

### Output Distribution
**Authorization:** {{output_authorization}}
**Delivery Verification:** {{delivery_verification}}
**Transmission Security:** {{transmission_security}}

## 6. Data Quality Monitoring

**Monitoring Tools:** {{dq_monitoring_tools}}
**Reporting Frequency:** {{dq_reporting_frequency}}
**Issue Resolution:** {{dq_issue_resolution_process}}

**Policy Owner:** {{policy_owner}}
**Review Frequency:** {{review_frequency}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true },
      accuracy_definition: { type: 'text', label: 'Accuracy Definition', required: true },
      accuracy_measurement: { type: 'text', label: 'Accuracy Measurement', required: true },
      accuracy_target: { type: 'number', label: 'Accuracy Target %', required: true },
      completeness_definition: { type: 'text', label: 'Completeness Definition', required: true },
      completeness_measurement: { type: 'text', label: 'Completeness Measurement', required: true },
      completeness_target: { type: 'number', label: 'Completeness Target %', required: true },
      consistency_definition: { type: 'text', label: 'Consistency Definition', required: true },
      consistency_validation: { type: 'text', label: 'Consistency Validation', required: true },
      timeliness_definition: { type: 'text', label: 'Timeliness Definition', required: true },
      timeliness_sla: { type: 'text', label: 'Timeliness SLA', required: true },
      validity_definition: { type: 'text', label: 'Validity Definition', required: true },
      validation_rules: { type: 'text', label: 'Validation Rules', required: true },
      required_fields_validation: { type: 'text', label: 'Required Fields Validation', required: true },
      format_validation: { type: 'text', label: 'Format Validation', required: true },
      range_checks: { type: 'text', label: 'Range Checks', required: true },
      business_rules_validation: { type: 'text', label: 'Business Rules Validation', required: true },
      invalid_input_handling: { type: 'text', label: 'Invalid Input Handling', required: true },
      error_message_requirements: { type: 'text', label: 'Error Message Requirements', required: true },
      error_logging: { type: 'text', label: 'Error Logging', required: true },
      duplicate_detection: { type: 'text', label: 'Duplicate Detection', required: true },
      duplicate_merge_process: { type: 'text', label: 'Duplicate Merge Process', required: true },
      calculation_verification: { type: 'text', label: 'Calculation Verification', required: true },
      transformation_rules: { type: 'text', label: 'Transformation Rules', required: true },
      processing_logs: { type: 'text', label: 'Processing Logs', required: true },
      automation_validation: { type: 'text', label: 'Automation Validation', required: true },
      automated_process_monitoring: { type: 'text', label: 'Automated Process Monitoring', required: true },
      exception_handling: { type: 'text', label: 'Exception Handling', required: true },
      batch_controls: { type: 'text', label: 'Batch Controls', required: true },
      batch_reconciliation: { type: 'text', label: 'Batch Reconciliation', required: true },
      batch_failure_handling: { type: 'text', label: 'Batch Failure Handling', required: true },
      output_completeness_checks: { type: 'text', label: 'Output Completeness Checks', required: true },
      output_format_validation: { type: 'text', label: 'Output Format Validation', required: true },
      output_reconciliation: { type: 'text', label: 'Output Reconciliation', required: true },
      output_authorization: { type: 'text', label: 'Output Authorization', required: true },
      delivery_verification: { type: 'text', label: 'Delivery Verification', required: true },
      transmission_security: { type: 'text', label: 'Transmission Security', required: true },
      dq_monitoring_tools: { type: 'text', label: 'Monitoring Tools', required: true },
      dq_reporting_frequency: { type: 'select', label: 'Reporting Frequency', required: true, options: ['Weekly', 'Monthly', 'Quarterly'] },
      dq_issue_resolution_process: { type: 'text', label: 'Issue Resolution Process', required: true },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true },
      review_frequency: { type: 'select', label: 'Review Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] }
    }
  }
];

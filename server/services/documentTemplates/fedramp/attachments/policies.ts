import { DocumentTemplate } from '../../types';

export const FedRAMPAttachmentPolicies: DocumentTemplate[] = [
  {
    id: 'fedramp-att-1',
    title: 'FedRAMP Information Security Policies',
    description: 'Attachment 1 - Policies covering all control families',
    framework: 'FedRAMP-Moderate',
    category: 'policy',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Information Security Policies and Procedures
## FedRAMP SSP Attachment 1

### System Information
**System Name:** {{system_name}}
**System Owner:** {{system_owner}}
**Impact Level:** {{impact_level}}

## 1. Access Control (AC) Policy
{{company_name}} implements access control in accordance with NIST SP 800-53 AC family controls.
- Account management procedures
- Access enforcement mechanisms
- Information flow enforcement
- Separation of duties
- Least privilege implementation
- Session controls

## 2. Awareness and Training (AT) Policy
Security awareness and training requirements:
- General security awareness for all personnel
- Role-based security training
- Phishing awareness training
- Annual refresher training

## 3. Audit and Accountability (AU) Policy
Audit and accountability requirements:
- Audit events logged
- Audit storage capacity
- Audit log protection
- Audit review and analysis

## 4. Security Assessment (CA) Policy
Security assessment and authorization:
- Continuous monitoring strategy
- Security assessments
- Plan of Action and Milestones (POA&M)

## 5. Configuration Management (CM) Policy
Configuration management requirements:
- Baseline configurations
- Change control processes
- Security impact analysis
- Configuration settings documentation

## 6. Contingency Planning (CP) Policy
Contingency planning requirements:
- Contingency plan development
- Training and testing
- Backup procedures
- Recovery procedures

## 7. Identification and Authentication (IA) Policy
- User identification
- Device identification
- Multi-factor authentication
- Credential management

## 8. Incident Response (IR) Policy
- Incident handling procedures
- Incident reporting (US-CERT)
- Post-incident analysis

## 9. Maintenance (MA) Policy
System maintenance requirements and controls.

## 10. Media Protection (MP) Policy
Media handling, storage, and disposal.

## 11. Physical and Environmental Protection (PE) Policy
Physical security requirements.

## 12. Planning (PL) Policy
Security planning requirements.

## 13. Personnel Security (PS) Policy
Personnel screening and security.

## 14. Risk Assessment (RA) Policy
Risk assessment methodology.

## 15. System and Services Acquisition (SA) Policy
Acquisition security requirements.

## 16. System and Communications Protection (SC) Policy
Network and communication security.

## 17. System and Information Integrity (SI) Policy
System integrity requirements.

**Policy Owner:** {{policy_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      system_owner: { type: 'text', label: 'System Owner', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      company_name: { type: 'text', label: 'Company Name', required: true },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'fedramp-att-5',
    title: 'FedRAMP Rules of Behavior',
    description: 'Attachment 5 - User responsibilities and acceptable use',
    framework: 'FedRAMP-Moderate',
    category: 'policy',
    priority: 5,
    documentType: 'policy',
    required: true,
    templateContent: `# Rules of Behavior
## FedRAMP SSP Attachment 5

### System Information
**System Name:** {{system_name}}
**System Owner:** {{system_owner}}

## 1. Purpose
This document establishes the rules of behavior for all users of {{system_name}}.

## 2. Scope
Applies to all users with access to the system, including employees, contractors, and third parties.

## 3. User Responsibilities

### 3.1 General Conduct
- Use system only for authorized purposes
- Protect authentication credentials
- Report security incidents immediately
- Complete required security training

### 3.2 Information Handling
- Handle information according to classification
- Do not share classified/sensitive information inappropriately
- Encrypt sensitive data in transit and at rest
- Follow data retention requirements

### 3.3 System Usage
- Do not bypass security controls
- Do not install unauthorized software
- Do not connect unauthorized devices
- Log off when not using the system

### 3.4 Password Requirements
- Minimum {{password_length}} characters
- Complexity requirements enforced
- Change passwords every {{password_expiry}} days
- Do not share or reuse passwords

### 3.5 Remote Access
- Use only approved remote access methods
- Multi-factor authentication required
- Protect mobile devices and media
- Report lost or stolen devices immediately

## 4. Prohibited Activities
- Unauthorized access attempts
- Sharing authentication credentials
- Bypassing security controls
- Installing malicious software
- Using system for personal gain
- Accessing inappropriate content
- Unauthorized data exfiltration

## 5. Monitoring Notice
All system activity is subject to monitoring and recording.

## 6. Consequences
Violations may result in:
- Revocation of access privileges
- Disciplinary action
- Civil or criminal penalties

## 7. Acknowledgment
I have read and understand these Rules of Behavior and agree to comply.

**Signature:** _______________________
**Printed Name:** {{user_name}}
**Date:** {{acknowledgment_date}}

**Document Owner:** {{document_owner}}
**Version:** {{version}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      system_owner: { type: 'text', label: 'System Owner', required: true },
      password_length: { type: 'number', label: 'Minimum Password Length', required: true },
      password_expiry: { type: 'number', label: 'Password Expiry (days)', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      version: { type: 'text', label: 'Version', required: true }
    }
  },
  {
    id: 'fedramp-att-7',
    title: 'FedRAMP Laws and Regulations',
    description: 'Attachment 7 - Applicable laws, regulations, and standards',
    framework: 'FedRAMP-Moderate',
    category: 'compliance',
    priority: 7,
    documentType: 'reference',
    required: true,
    templateContent: `# Laws, Regulations, and Standards
## FedRAMP SSP Attachment 7

### System Information
**System Name:** {{system_name}}
**Date:** {{document_date}}

## 1. Federal Laws
| Law | Applicability | Controls |
|-----|---------------|----------|
| Federal Information Security Management Act (FISMA) | {{fisma_applicable}} | {{fisma_controls}} |
| Privacy Act of 1974 | {{privacy_act}} | {{privacy_controls}} |
| E-Government Act of 2002 | {{egov_act}} | {{egov_controls}} |
| {{custom_law_1}} | {{custom_law_1_applicable}} | {{custom_law_1_controls}} |

## 2. Federal Regulations
| Regulation | Citation | Requirements |
|------------|----------|--------------|
| OMB Circular A-130 | {{omb_a130}} | {{omb_a130_req}} |
| {{custom_reg_1}} | {{custom_reg_1_cite}} | {{custom_reg_1_req}} |

## 3. Standards
| Standard | Version | Application |
|----------|---------|-------------|
| NIST 800-53 | Rev 5 | Security controls baseline |
| NIST 800-63 | Rev 3 | Digital identity |
| FIPS 199 | Current | Security categorization |
| FIPS 200 | Current | Minimum security requirements |
| {{custom_std_1}} | {{custom_std_1_ver}} | {{custom_std_1_app}} |

## 4. Industry Standards (if applicable)
**PCI DSS:** {{pci_applicable}}
**HIPAA:** {{hipaa_applicable}}
**SOX:** {{sox_applicable}}

## 5. Compliance Monitoring
**Review Frequency:** {{review_freq}}
**Responsible Party:** {{compliance_owner}}

**Document Owner:** {{document_owner}}
**Last Updated:** {{last_updated}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      document_date: { type: 'date', label: 'Document Date', required: true },
      fisma_applicable: { type: 'select', label: 'FISMA Applicable?', required: true, options: ['Yes', 'No'] },
      fisma_controls: { type: 'text', label: 'FISMA Controls', required: false },
      privacy_act: { type: 'select', label: 'Privacy Act Applicable?', required: true, options: ['Yes', 'No'] },
      privacy_controls: { type: 'text', label: 'Privacy Controls', required: false },
      egov_act: { type: 'select', label: 'E-Gov Act Applicable?', required: true, options: ['Yes', 'No'] },
      egov_controls: { type: 'text', label: 'E-Gov Controls', required: false },
      custom_law_1: { type: 'text', label: 'Additional Law 1', required: false },
      custom_law_1_applicable: { type: 'select', label: 'Custom Law 1 Applicable?', required: false, options: ['Yes', 'No', 'N/A'] },
      custom_law_1_controls: { type: 'text', label: 'Custom Law 1 Controls', required: false },
      omb_a130: { type: 'select', label: 'OMB A-130 Applicable?', required: true, options: ['Yes', 'No'] },
      omb_a130_req: { type: 'text', label: 'OMB A-130 Requirements', required: false },
      custom_reg_1: { type: 'text', label: 'Additional Regulation 1', required: false },
      custom_reg_1_cite: { type: 'text', label: 'Regulation 1 Citation', required: false },
      custom_reg_1_req: { type: 'text', label: 'Regulation 1 Requirements', required: false },
      custom_std_1: { type: 'text', label: 'Additional Standard 1', required: false },
      custom_std_1_ver: { type: 'text', label: 'Standard 1 Version', required: false },
      custom_std_1_app: { type: 'text', label: 'Standard 1 Application', required: false },
      pci_applicable: { type: 'select', label: 'PCI DSS Applicable?', required: false, options: ['Yes', 'No', 'N/A'] },
      hipaa_applicable: { type: 'select', label: 'HIPAA Applicable?', required: false, options: ['Yes', 'No', 'N/A'] },
      sox_applicable: { type: 'select', label: 'SOX Applicable?', required: false, options: ['Yes', 'No', 'N/A'] },
      review_freq: { type: 'select', label: 'Review Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] },
      compliance_owner: { type: 'text', label: 'Compliance Owner', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      last_updated: { type: 'date', label: 'Last Updated', required: true }
    }
  },
  {
    id: 'fedramp-att-11',
    title: 'FedRAMP Separation of Duties Matrix',
    description: 'Attachment 11 - Separation of duties and responsibilities matrix',
    framework: 'FedRAMP-Moderate',
    category: 'policy',
    priority: 11,
    documentType: 'matrix',
    required: true,
    templateContent: `# Separation of Duties Matrix
## FedRAMP SSP Attachment 11

### System Information
**System Name:** {{system_name}}
**Date:** {{document_date}}
**Version:** {{version}}

## 1. Purpose
This matrix defines separation of duties to prevent conflicts of interest and reduce fraud risk per NIST 800-53 AC-5.

## 2. Key Roles and Responsibilities

| Function | System Admin | Security Admin | Developer | Manager | Auditor |
|----------|--------------|----------------|-----------|---------|---------|
| **User Account Management** |
| Create accounts | {{admin_create}} | - | - | Approve | Review |
| Modify privileges | - | {{sec_modify}} | - | Approve | Review |
| Delete accounts | {{admin_delete}} | {{sec_delete}} | - | - | Review |
| **Security Controls** |
| Configure firewalls | - | {{sec_firewall}} | - | - | Review |
| IDS/IPS management | - | {{sec_ids}} | - | - | Review |
| Security monitoring | - | {{sec_monitor}} | - | - | - |
| **System Changes** |
| Code development | - | - | {{dev_code}} | - | - |
| Code review | - | {{sec_review}} | - | {{mgr_review}} | - |
| Deploy to production | {{admin_deploy}} | - | - | Approve | - |
| **Access Controls** |
| Grant admin access | - | - | - | {{mgr_grant}} | Review |
| Access reviews | - | {{sec_access_review}} | - | {{mgr_access_review}} | Audit |
| **Audit Functions** |
| Configure logging | - | {{sec_log_config}} | - | - | - |
| Review logs | - | {{sec_log_review}} | - | - | {{audit_log_review}} |
| Audit controls | - | - | - | - | {{audit_controls}} |

## 3. Segregation Rules

### 3.1 Prohibited Combinations
1. **Cannot combine:** Development + Production Deployment
2. **Cannot combine:** Security Administration + Audit Functions
3. **Cannot combine:** Access Provisioning + Access Approval
4. **Cannot combine:** {{custom_prohibition_1}}

### 3.2 Required Approvals
| Action | Requires Approval From |
|--------|----------------------|
| Privileged access grant | {{priv_access_approver}} |
| Security configuration changes | {{sec_config_approver}} |
| Production deployments | {{prod_deploy_approver}} |
| User termination | {{term_approver}} |

## 4. Compensating Controls
**Small Team Adjustments:** {{small_team_controls}}
**Monitoring:** {{monitoring_controls}}
**Management Review:** {{mgmt_review_freq}}

## 5. Exceptions
| Exception | Justification | Compensating Control | Approved By |
|-----------|---------------|---------------------|-------------|
| {{exception_1}} | {{exception_1_just}} | {{exception_1_control}} | {{exception_1_approver}} |

**Document Owner:** {{document_owner}}
**Last Review:** {{last_review}}
**Next Review:** {{next_review}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      document_date: { type: 'date', label: 'Document Date', required: true },
      version: { type: 'text', label: 'Version', required: true },
      admin_create: { type: 'select', label: 'Admin Can Create Accounts?', required: true, options: ['Yes', 'No', 'With Approval'] },
      sec_modify: { type: 'select', label: 'Security Can Modify Privileges?', required: true, options: ['Yes', 'No'] },
      admin_delete: { type: 'select', label: 'Admin Can Delete Accounts?', required: true, options: ['Yes', 'No'] },
      sec_delete: { type: 'select', label: 'Security Can Delete Accounts?', required: true, options: ['Yes', 'No'] },
      sec_firewall: { type: 'select', label: 'Security Configures Firewalls?', required: true, options: ['Yes', 'No'] },
      sec_ids: { type: 'select', label: 'Security Manages IDS/IPS?', required: true, options: ['Yes', 'No'] },
      sec_monitor: { type: 'select', label: 'Security Monitors?', required: true, options: ['Yes', 'No'] },
      dev_code: { type: 'select', label: 'Developer Writes Code?', required: true, options: ['Yes', 'No'] },
      sec_review: { type: 'select', label: 'Security Reviews Code?', required: true, options: ['Yes', 'No'] },
      mgr_review: { type: 'select', label: 'Manager Reviews Code?', required: true, options: ['Yes', 'No'] },
      admin_deploy: { type: 'select', label: 'Admin Deploys?', required: true, options: ['Yes', 'No', 'With Approval'] },
      mgr_grant: { type: 'select', label: 'Manager Grants Admin Access?', required: true, options: ['Yes', 'No'] },
      sec_access_review: { type: 'select', label: 'Security Reviews Access?', required: true, options: ['Yes', 'No'] },
      mgr_access_review: { type: 'select', label: 'Manager Reviews Access?', required: true, options: ['Yes', 'No'] },
      sec_log_config: { type: 'select', label: 'Security Configures Logging?', required: true, options: ['Yes', 'No'] },
      sec_log_review: { type: 'select', label: 'Security Reviews Logs?', required: true, options: ['Yes', 'No'] },
      audit_log_review: { type: 'select', label: 'Auditor Reviews Logs?', required: true, options: ['Yes', 'No'] },
      audit_controls: { type: 'select', label: 'Auditor Audits Controls?', required: true, options: ['Yes', 'No'] },
      custom_prohibition_1: { type: 'text', label: 'Additional Prohibition', required: false },
      priv_access_approver: { type: 'text', label: 'Privileged Access Approver', required: true },
      sec_config_approver: { type: 'text', label: 'Security Config Approver', required: true },
      prod_deploy_approver: { type: 'text', label: 'Production Deployment Approver', required: true },
      term_approver: { type: 'text', label: 'Termination Approver', required: true },
      small_team_controls: { type: 'text', label: 'Small Team Controls', required: false },
      monitoring_controls: { type: 'text', label: 'Monitoring Controls', required: true },
      mgmt_review_freq: { type: 'select', label: 'Management Review Frequency', required: true, options: ['Monthly', 'Quarterly', 'Semi-annually'] },
      exception_1: { type: 'text', label: 'Exception 1', required: false },
      exception_1_just: { type: 'text', label: 'Exception 1 Justification', required: false },
      exception_1_control: { type: 'text', label: 'Exception 1 Compensating Control', required: false },
      exception_1_approver: { type: 'text', label: 'Exception 1 Approved By', required: false },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      last_review: { type: 'date', label: 'Last Review Date', required: true },
      next_review: { type: 'date', label: 'Next Review Date', required: true }
    }
  }
];

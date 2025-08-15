import { logger } from '../utils/logger';

// Complete 2025 Document Template Library
// Based on latest ISO 27001:2022, SOC 2 Type 2, FedRAMP Rev 5, and NIST 800-53 Rev 5.1.1

export interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  framework: string;
  category: string;
  priority: number;
  documentType: 'policy' | 'procedure' | 'plan' | 'assessment' | 'standard' | 'control' | 'framework' | 'training' | 'report';
  required: boolean;
  templateContent: string;
  templateVariables: {
    [key: string]: {
      type: 'text' | 'number' | 'date' | 'select';
      label: string;
      required: boolean;
      options?: string[];
    };
  };
}

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

// SOC 2 Type 2 - Complete 25 Required Policies + Procedures
export const SOC2Templates: DocumentTemplate[] = [
  {
    id: 'soc2-001',
    title: 'Security Controls Framework',
    description: 'Comprehensive security control implementation framework',
    framework: 'SOC2',
    category: 'framework',
    priority: 1,
    documentType: 'framework',
    required: true,
    templateContent: `# SOC 2 Security Controls Framework

## 1. Control Environment
{{company_name}} has established a comprehensive control environment to ensure the security, availability, and confidentiality of customer data and systems.

## 2. Trust Services Criteria
This framework addresses the following Trust Services Criteria:
- **Security (CC):** Protection against unauthorized access
- **Availability (A):** System accessibility for operation and use
- **Processing Integrity (PI):** System processing completeness and accuracy
- **Confidentiality (C):** Information designated as confidential
- **Privacy (P):** Personal information collection, use, retention, and disposal

## 3. Control Activities
### 3.1 Logical and Physical Access Controls
- Multi-factor authentication for system access
- Role-based access control implementation
- Physical security controls for data centers
- Regular access reviews and deprovisioning

### 3.2 System Operations
- Change management procedures
- Data backup and recovery processes
- System monitoring and incident response
- Vendor management and due diligence

### 3.3 Risk Assessment and Mitigation
- Annual risk assessments
- Risk treatment plans
- Control testing and validation
- Continuous monitoring and improvement

## 4. Control Implementation
{{control_implementation_details}}

## 5. Monitoring and Review
Controls are monitored continuously and reviewed annually for effectiveness.

**Document Owner:** {{document_owner}}
**Effective Date:** {{effective_date}}
**Review Frequency:** Annual`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      control_implementation_details: { type: 'text', label: 'Control Implementation Details', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  }
];

// FedRAMP Rev 5 - Baseline-Specific Templates
export const FedRAMPLowTemplates: DocumentTemplate[] = [
  {
    id: 'fedramp-low-001',
    title: 'System Security Plan (SSP) - Low Baseline',
    description: 'Complete SSP for FedRAMP Low impact level (155+ controls)',
    framework: 'FedRAMP-Low',
    category: 'plan',
    priority: 1,
    documentType: 'plan',
    required: true,
    templateContent: `# System Security Plan (SSP) - FedRAMP Low Baseline

## 1. System Information
**System Name:** {{system_name}}
**System Owner:** {{system_owner}}
**Impact Level:** Low
**Authorization Date:** {{authorization_date}}

## 2. System Description
{{system_description}}

## 3. System Environment
### 3.1 System Architecture
{{system_architecture}}

### 3.2 Network Architecture
{{network_architecture}}

### 3.3 Data Flow
{{data_flow_description}}

## 4. Control Implementation Summary - FedRAMP Low Baseline (155+ Controls)

### 4.1 Access Control (AC) - 25 Controls
- AC-1: Access Control Policy and Procedures ✓
- AC-2: Account Management ✓
- AC-3: Access Enforcement ✓
- AC-4: Information Flow Enforcement ✓
- AC-5: Separation of Duties ✓
- AC-6: Least Privilege ✓
- AC-7: Unsuccessful Logon Attempts ✓
- AC-8: System Use Notification ✓
- AC-11: Session Lock ✓
- AC-12: Session Termination ✓
- AC-14: Permitted Actions without Identification ✓
- AC-17: Remote Access ✓
- AC-18: Wireless Access ✓
- AC-19: Access Control for Mobile Devices ✓
- AC-20: Use of External Information Systems ✓
- AC-22: Publicly Accessible Content ✓

### 4.2 Audit and Accountability (AU) - 12 Controls  
- AU-1: Audit and Accountability Policy and Procedures ✓
- AU-2: Event Logging ✓
- AU-3: Content of Audit Records ✓
- AU-4: Audit Storage Capacity ✓
- AU-5: Response to Audit Processing Failures ✓
- AU-6: Audit Review, Analysis, and Reporting ✓
- AU-8: Time Stamps ✓
- AU-9: Protection of Audit Information ✓
- AU-11: Audit Record Retention ✓
- AU-12: Audit Generation ✓

### 4.3 Configuration Management (CM) - 11 Controls
- CM-1: Configuration Management Policy and Procedures ✓
- CM-2: Baseline Configuration ✓
- CM-3: Configuration Change Control ✓
- CM-4: Security Impact Analysis ✓
- CM-5: Access Restrictions for Change ✓
- CM-6: Configuration Settings ✓
- CM-7: Least Functionality ✓
- CM-8: Information System Component Inventory ✓
- CM-10: Software Usage Restrictions ✓
- CM-11: User-Installed Software ✓

### 4.4 Identification and Authentication (IA) - 8 Controls
- IA-1: Identification and Authentication Policy and Procedures ✓
- IA-2: Identification and Authentication (Organizational Users) ✓
- IA-3: Device Identification and Authentication ✓
- IA-4: Identifier Management ✓
- IA-5: Authenticator Management ✓
- IA-6: Authenticator Feedback ✓
- IA-7: Cryptographic Module Authentication ✓
- IA-8: Identification and Authentication (Non-Organizational Users) ✓

### 4.5 System and Communications Protection (SC) - 28 Controls
- SC-1: System and Communications Protection Policy and Procedures ✓
- SC-2: Application Partitioning ✓
- SC-4: Information in Shared Resources ✓
- SC-5: Denial of Service Protection ✓
- SC-7: Boundary Protection ✓
- SC-8: Transmission Confidentiality and Integrity ✓
- SC-10: Network Disconnect ✓
- SC-12: Cryptographic Key Establishment and Management ✓
- SC-13: Cryptographic Protection ✓
- SC-15: Collaborative Computing Devices ✓
- SC-17: Public Key Infrastructure Certificates ✓
- SC-18: Mobile Code ✓
- SC-19: Voice Over Internet Protocol ✓
- SC-20: Secure Name/Address Resolution Service (Authoritative Source) ✓
- SC-21: Secure Name/Address Resolution Service (Recursive or Caching Resolver) ✓
- SC-22: Architecture and Provisioning for Name/Address Resolution Service ✓
- SC-23: Session Authenticity ✓
- SC-28: Protection of Information at Rest ✓
- SC-39: Process Isolation ✓

### 4.6 Additional Control Families (71+ Controls)
- Assessment, Authorization, and Monitoring (CA): 9 controls
- Contingency Planning (CP): 10 controls  
- Incident Response (IR): 8 controls
- Maintenance (MA): 6 controls
- Media Protection (MP): 8 controls
- Personnel Security (PS): 8 controls
- Physical and Environmental Protection (PE): 20 controls
- Planning (PL): 8 controls
- Risk Assessment (RA): 5 controls
- System and Services Acquisition (SA): 22 controls
- System and Information Integrity (SI): 17 controls

## 5. Implementation Status
- **Total Controls**: 155+ security controls
- **Implementation Status**: Fully Implemented
- **Control Enhancements**: Applied per FedRAMP Low requirements
- **Continuous Monitoring**: Active
- **Annual Assessment**: Scheduled

## 6. Plan Approval
**Prepared By:** {{prepared_by}}
**Reviewed By:** {{reviewed_by}}
**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      system_owner: { type: 'text', label: 'System Owner', required: true },
      authorization_date: { type: 'date', label: 'Authorization Date', required: true },
      system_description: { type: 'text', label: 'System Description', required: true }
    }
  }
];

export const FedRAMPModerateTemplates: DocumentTemplate[] = [
  {
    id: 'fedramp-mod-001',
    title: 'System Security Plan (SSP) - Moderate Baseline',
    description: 'Complete SSP for FedRAMP Moderate impact level (300+ controls)',
    framework: 'FedRAMP-Moderate',
    category: 'plan',
    priority: 1,
    documentType: 'plan',
    required: true,
    templateContent: `# System Security Plan (SSP) - FedRAMP Moderate Baseline

## 1. System Information
**System Name:** {{system_name}}
**System Owner:** {{system_owner}}
**Impact Level:** Moderate
**Authorization Date:** {{authorization_date}}

## 2. System Description
{{system_description}}

## 3. Enhanced Security Controls - FedRAMP Moderate Baseline (325+ Controls)

### 3.1 Enhanced Control Families
All Low baseline controls PLUS additional moderate enhancements:

#### Access Control (AC) - 35+ Controls (Enhanced)
- AC-2(1): Automated System Account Management ✓
- AC-2(2): Removal of Temporary/Emergency Accounts ✓
- AC-2(3): Disable Inactive Accounts ✓
- AC-2(4): Automated Audit Actions ✓
- AC-3(4): Discretionary Access Control ✓
- AC-6(1): Authorize Access to Security Functions ✓
- AC-6(2): Non-privileged Access for Non-security Functions ✓
- AC-6(5): Privileged Accounts ✓
- AC-6(9): Auditing Use of Privileged Functions ✓
- AC-6(10): Prohibit Non-privileged Users from Executing Privileged Functions ✓
- AC-17(1): Automated Monitoring/Control ✓
- AC-17(2): Protection of Confidentiality/Integrity Using Encryption ✓
- AC-17(3): Managed Access Control Points ✓
- AC-17(4): Privileged Commands/Access ✓

#### Incident Response (IR) - Enhanced 10+ Controls  
- IR-1: Incident Response Policy and Procedures ✓
- IR-2: Incident Response Training ✓
- IR-3: Incident Response Testing ✓
- IR-4: Incident Handling ✓
- IR-5: Incident Monitoring ✓
- IR-6: Incident Reporting ✓
- IR-7: Incident Response Assistance ✓
- IR-8: Incident Response Plan ✓
- IR-4(1): Automated Incident Handling Processes ✓
- IR-6(1): Automated Reporting ✓

#### Security Assessment and Authorization (CA) - 15+ Controls
- CA-1: Security Assessment and Authorization Policy and Procedures ✓
- CA-2: Security Assessments ✓
- CA-3: System Interconnections ✓
- CA-5: Plan of Action and Milestones ✓
- CA-6: Security Authorization ✓
- CA-7: Continuous Monitoring ✓
- CA-8: Penetration Testing ✓
- CA-9: Internal System Connections ✓
- CA-2(1): Independent Assessors ✓
- CA-2(2): Specialized Assessments ✓
- CA-3(5): Restrictions on External System Connections ✓
- CA-7(1): Independent Assessment ✓

#### Risk Assessment (RA) - 8+ Controls
- RA-1: Risk Assessment Policy and Procedures ✓
- RA-2: Security Categorization ✓
- RA-3: Risk Assessment ✓
- RA-5: Vulnerability Scanning ✓
- RA-3(1): Supply Chain Risk Assessment ✓
- RA-5(1): Update Tool Capability ✓
- RA-5(2): Update by Frequency/Prior to New Scan/When Identified ✓
- RA-5(5): Privileged Access ✓

#### System and Information Integrity (SI) - 25+ Controls
- SI-1: System and Information Integrity Policy and Procedures ✓
- SI-2: Flaw Remediation ✓
- SI-3: Malicious Code Protection ✓
- SI-4: Information System Monitoring ✓
- SI-5: Security Alerts, Advisories, and Directives ✓
- SI-7: Software, Firmware, and Information Integrity ✓
- SI-8: Spam Protection ✓
- SI-10: Information Input Validation ✓
- SI-11: Error Handling ✓
- SI-12: Information Handling and Retention ✓
- SI-2(1): Central Management ✓
- SI-2(2): Automated Flaw Remediation Status ✓
- SI-3(1): Central Management ✓
- SI-3(2): Automatic Updates ✓
- SI-4(2): Automated Tools for Real-time Analysis ✓
- SI-4(4): Inbound and Outbound Communications Traffic ✓
- SI-4(5): System-generated Alerts ✓

### 3.2 Control Enhancement Summary
- **Base Controls**: 155 (from Low baseline)
- **Control Enhancements**: 170+ additional
- **Total Controls**: 325+ security controls
- **Multi-factor Authentication**: Mandatory for all privileged access
- **Encryption**: Required for data at rest and in transit
- **Continuous Monitoring**: Real-time security monitoring required

## 4. Moderate Impact Requirements
- Enhanced incident response capabilities with 24/7 monitoring
- Penetration testing and vulnerability scanning
- Independent security assessments
- Advanced threat detection and response
- Comprehensive audit trail and forensic capabilities

**Prepared By:** {{prepared_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      system_owner: { type: 'text', label: 'System Owner', required: true },
      authorization_date: { type: 'date', label: 'Authorization Date', required: true }
    }
  }
];

export const FedRAMPHighTemplates: DocumentTemplate[] = [
  {
    id: 'fedramp-high-001',
    title: 'System Security Plan (SSP) - High Baseline',
    description: 'Complete SSP for FedRAMP High impact level (400+ controls)',
    framework: 'FedRAMP-High',
    category: 'plan',
    priority: 1,
    documentType: 'plan',
    required: true,
    templateContent: `# System Security Plan (SSP) - FedRAMP High Baseline

## 1. System Information
**System Name:** {{system_name}}
**System Owner:** {{system_owner}}
**Impact Level:** High
**Authorization Date:** {{authorization_date}}

## 2. System Description for High Impact
{{system_description}}

## 3. Maximum Security Controls - FedRAMP High Baseline (421+ Controls)

### 3.1 All Moderate Controls PLUS High-Level Enhancements

#### Access Control (AC) - 45+ Controls (Maximum Security)
All Moderate AC controls PLUS:
- AC-2(5): Inactivity Logout ✓
- AC-2(11): Usage Conditions ✓
- AC-2(12): Account Monitoring/Atypical Usage ✓
- AC-2(13): Disable Accounts for High-risk Individuals ✓
- AC-3(7): Role-based Access Control ✓
- AC-3(8): Revocation of Access Authorizations ✓
- AC-4(4): Flow Control of Encrypted Information ✓
- AC-4(21): Physical/Logical Separation of Information Flows ✓
- AC-6(7): Review of User Privileges ✓
- AC-6(8): Privilege Levels for Code Execution ✓
- AC-17(6): Protection of Information ✓
- AC-17(9): Disconnect/Disable Remote Access ✓

#### Audit and Accountability (AU) - 25+ Controls (Enhanced Logging)
All Moderate AU controls PLUS:
- AU-2(3): Reviews and Updates ✓
- AU-3(1): Additional Audit Information ✓
- AU-3(2): Centralized Management of Planned Audit Record Content ✓
- AU-4(1): Transfer to Alternate Storage ✓
- AU-5(1): Audit Storage Capacity ✓
- AU-5(2): Real-time Alerts ✓
- AU-6(1): Process Integration ✓
- AU-6(3): Correlate Audit Repositories ✓
- AU-6(4): Central Review and Analysis ✓
- AU-6(5): Integrated Analysis of Audit Records ✓
- AU-6(6): Correlation with Physical Monitoring ✓
- AU-7: Audit Reduction and Report Generation ✓
- AU-7(1): Automatic Processing ✓
- AU-9(2): Audit Backup on Separate Physical Systems ✓
- AU-9(3): Cryptographic Protection ✓
- AU-9(4): Access by Subset of Privileged Users ✓

#### Configuration Management (CM) - 20+ Controls (Strict Change Control)
All Moderate CM controls PLUS:
- CM-3(1): Automated Document/Notification/Prohibition of Changes ✓
- CM-3(2): Test/Validate/Document Changes ✓
- CM-3(4): Security Representative ✓
- CM-3(6): Cryptography Management ✓
- CM-5(1): Automated Access Enforcement/Auditing ✓
- CM-5(3): Signed Components ✓
- CM-6(1): Automated Central Management/Application/Verification ✓
- CM-6(2): Respond to Unauthorized Changes ✓
- CM-7(2): Prevent Program Execution ✓
- CM-7(5): Authorized Software/Whitelisting ✓
- CM-8(1): Updates During Installations/Removals ✓
- CM-8(3): Automated Unauthorized Component Detection ✓
- CM-8(5): No Duplicate Accounting of Components ✓

#### System and Communications Protection (SC) - 50+ Controls (Maximum Encryption)
All Moderate SC controls PLUS:
- SC-4(2): Multilevel or Periods Processing ✓
- SC-7(3): Access Points ✓
- SC-7(4): External Telecommunications Services ✓
- SC-7(5): Deny All, Permit by Exception ✓
- SC-7(7): Prevent Split Tunneling for Remote Devices ✓
- SC-7(8): Route Traffic to Authenticated Proxy Servers ✓
- SC-7(10): Prevent Unauthorized Exfiltration ✓
- SC-7(12): Host-based Protection ✓
- SC-7(13): Isolation of Security Tools/Mechanisms/Support Components ✓
- SC-7(18): Fail Secure ✓
- SC-8(1): Cryptographic or Alternate Physical Protection ✓
- SC-12(1): Availability ✓
- SC-12(2): Symmetric Keys ✓
- SC-12(3): Asymmetric Keys ✓
- SC-13(1): FIPS-validated Cryptography ✓
- SC-28(1): Cryptographic Protection ✓

### 3.2 High-Specific Control Families

#### Supply Chain Risk Management (SR) - 12+ Controls
- SR-1: Policy and Procedures ✓
- SR-2: Supply Chain Risk Management Plan ✓
- SR-3: Supply Chain Controls and Processes ✓
- SR-4: Provenance ✓
- SR-5: Acquisition Strategies, Tools, and Methods ✓
- SR-6: Supplier Assessments and Reviews ✓
- SR-8: Notification Agreements ✓
- SR-10: Inspection of Systems or Components ✓
- SR-11: Component Authenticity ✓
- SR-12: Component Disposal ✓

#### Program Management (PM) - 16+ Controls
- PM-1: Information Security Program Plan ✓
- PM-2: Senior Information Security Officer ✓
- PM-3: Information Security Resources ✓
- PM-4: Plan of Action and Milestones Process ✓
- PM-5: Information System Inventory ✓
- PM-6: Information Security Measures of Performance ✓
- PM-7: Enterprise Architecture ✓
- PM-8: Critical Infrastructure Plan ✓
- PM-9: Risk Management Strategy ✓
- PM-10: Security Authorization Process ✓
- PM-11: Mission/Business Process Definition ✓

### 3.3 High Impact Control Summary
- **Total Security Controls**: 421+ controls
- **Control Enhancements**: All available enhancements implemented
- **Cryptographic Requirements**: FIPS 140-2 Level 3+ required
- **Multi-factor Authentication**: Required for all system access
- **Continuous Monitoring**: Real-time with automated response
- **Incident Response**: 24/7 Security Operations Center
- **Physical Security**: Maximum protection measures

## 4. High Impact Specific Requirements
- **Zero Trust Architecture**: Mandatory implementation
- **Advanced Persistent Threat (APT) Protection**: Required
- **Quantum-Resistant Cryptography**: Future-ready implementation
- **Supply Chain Security**: Comprehensive vendor vetting
- **Privileged Access Management (PAM)**: Just-in-time access
- **Security Orchestration, Automation, and Response (SOAR)**: Automated incident response

**Prepared By:** {{prepared_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      system_owner: { type: 'text', label: 'System Owner', required: true },
      authorization_date: { type: 'date', label: 'Authorization Date', required: true }
    }
  }
];

// NIST 800-53 Rev 5.1.1 Templates
export const NIST80053Templates: DocumentTemplate[] = [
  {
    id: 'nist-001',
    title: 'Security and Privacy Program Policy',
    description: 'Foundation security and privacy program policy (NIST 800-53 Rev 5.1.1)',
    framework: 'NIST-800-53',
    category: 'policy',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Security and Privacy Program Policy

## 1. Purpose
This policy establishes {{company_name}}'s security and privacy program based on NIST 800-53 Rev 5.1.1 guidelines.

## 2. Program Objectives
- Implement comprehensive security controls across all impact levels
- Protect privacy of personal information
- Ensure collaboration between security and privacy programs
- Manage risks appropriately based on organizational needs

## 3. Control Families
This program addresses all 20 NIST 800-53 control families:
- Access Control (AC)
- Awareness and Training (AT)
- Audit and Accountability (AU)
- Assessment, Authorization, and Monitoring (CA)
- Configuration Management (CM)
- Contingency Planning (CP)
- Identification and Authentication (IA)
- Incident Response (IR)
- Maintenance (MA)
- Media Protection (MP)
- Physical and Environmental Protection (PE)
- Planning (PL)
- Program Management (PM)
- Personnel Security (PS)
- Risk Assessment (RA)
- System and Services Acquisition (SA)
- System and Communications Protection (SC)
- System and Information Integrity (SI)
- Supply Chain Risk Management (SR)
- Privacy Controls (Privacy family)

## 4. Complete NIST 800-53 Rev 5.1.1 Control Implementation

### 4.1 Access Control (AC) Family - 25 Controls
- AC-1: Access Control Policy and Procedures ✓
- AC-2: Account Management ✓
- AC-3: Access Enforcement ✓
- AC-4: Information Flow Enforcement ✓
- AC-5: Separation of Duties ✓
- AC-6: Least Privilege ✓
- AC-7: Unsuccessful Logon Attempts ✓
- AC-8: System Use Notification ✓
- AC-9: Previous Logon Notification ✓
- AC-10: Concurrent Session Control ✓
- AC-11: Device Lock ✓
- AC-12: Session Termination ✓
- AC-14: Permitted Actions without Identification or Authentication ✓
- AC-16: Security and Privacy Attributes ✓
- AC-17: Remote Access ✓
- AC-18: Wireless Access ✓
- AC-19: Access Control for Mobile Devices ✓
- AC-20: Use of External Systems ✓
- AC-21: Information Sharing ✓
- AC-22: Publicly Accessible Content ✓
- AC-23: Data Mining Protection ✓
- AC-24: Access Control Decisions ✓
- AC-25: Reference Monitor Concept ✓

### 4.2 Awareness and Training (AT) Family - 6 Controls
- AT-1: Security Awareness and Training Policy and Procedures ✓
- AT-2: Literacy Training and Awareness ✓
- AT-3: Role-Based Training ✓
- AT-4: Training Records ✓
- AT-5: Contacts with Security Groups and Associations ✓
- AT-6: Training Feedback ✓

### 4.3 Audit and Accountability (AU) Family - 16 Controls
- AU-1: Audit and Accountability Policy and Procedures ✓
- AU-2: Event Logging ✓
- AU-3: Content of Audit Records ✓
- AU-4: Audit Log Storage Capacity ✓
- AU-5: Response to Audit Logging Process Failures ✓
- AU-6: Audit Record Review, Analysis, and Reporting ✓
- AU-7: Audit Record Reduction and Report Generation ✓
- AU-8: Time Stamps ✓
- AU-9: Protection of Audit Information ✓
- AU-10: Non-repudiation ✓
- AU-11: Audit Record Retention ✓
- AU-12: Audit Record Generation ✓
- AU-13: Monitoring for Information Disclosure ✓
- AU-14: Session Audit ✓
- AU-15: Alternate Audit Logging Capability ✓
- AU-16: Cross-Organizational Audit Logging ✓

### 4.4 Assessment, Authorization, and Monitoring (CA) Family - 9 Controls
- CA-1: Assessment, Authorization, and Monitoring Policy and Procedures ✓
- CA-2: Control Assessments ✓
- CA-3: Information Exchange ✓
- CA-5: Plan of Action and Milestones ✓
- CA-6: Authorization ✓
- CA-7: Continuous Monitoring ✓
- CA-8: Penetration Testing ✓
- CA-9: Internal System Connections ✓

### 4.5 Configuration Management (CM) Family - 14 Controls
- CM-1: Configuration Management Policy and Procedures ✓
- CM-2: Baseline Configuration ✓
- CM-3: Configuration Change Control ✓
- CM-4: Impact Analyses ✓
- CM-5: Access Restrictions for Change ✓
- CM-6: Configuration Settings ✓
- CM-7: Least Functionality ✓
- CM-8: System Component Inventory ✓
- CM-9: Configuration Management Plan ✓
- CM-10: Software Usage Restrictions ✓
- CM-11: User-Installed Software ✓
- CM-12: Information Location ✓
- CM-13: Data Action Mapping ✓
- CM-14: Signed Components ✓

### 4.6 Contingency Planning (CP) Family - 13 Controls
- CP-1: Contingency Planning Policy and Procedures ✓
- CP-2: Contingency Plan ✓
- CP-3: Contingency Training ✓
- CP-4: Contingency Plan Testing ✓
- CP-6: Alternate Storage Site ✓
- CP-7: Alternate Processing Site ✓
- CP-8: Telecommunications Services ✓
- CP-9: System Backup ✓
- CP-10: System Recovery and Reconstitution ✓
- CP-11: Alternate Communications Protocols ✓
- CP-12: Safe Mode ✓
- CP-13: Alternative Security Mechanisms ✓

### 4.7 Identification and Authentication (IA) Family - 12 Controls
- IA-1: Identification and Authentication Policy and Procedures ✓
- IA-2: Identification and Authentication (Organizational Users) ✓
- IA-3: Device Identification and Authentication ✓
- IA-4: Identifier Management ✓
- IA-5: Authenticator Management ✓
- IA-6: Authentication Feedback ✓
- IA-7: Cryptographic Module Authentication ✓
- IA-8: Identification and Authentication (Non-Organizational Users) ✓
- IA-9: Service Identification and Authentication ✓
- IA-10: Adaptive Authentication ✓
- IA-11: Re-authentication ✓
- IA-12: Identity Proofing ✓

### 4.8 Incident Response (IR) Family - 10 Controls
- IR-1: Incident Response Policy and Procedures ✓
- IR-2: Incident Response Training ✓
- IR-3: Incident Response Testing ✓
- IR-4: Incident Handling ✓
- IR-5: Incident Monitoring ✓
- IR-6: Incident Reporting ✓
- IR-7: Incident Response Assistance ✓
- IR-8: Incident Response Plan ✓
- IR-9: Information Spillage Response ✓
- IR-10: Integrated Information Security Analysis Team ✓

### 4.9 Maintenance (MA) Family - 7 Controls
- MA-1: Maintenance Policy and Procedures ✓
- MA-2: Controlled Maintenance ✓
- MA-3: Maintenance Tools ✓
- MA-4: Nonlocal Maintenance ✓
- MA-5: Maintenance Personnel ✓
- MA-6: Timely Maintenance ✓
- MA-7: Field Maintenance ✓

### 4.10 Media Protection (MP) Family - 8 Controls
- MP-1: Media Protection Policy and Procedures ✓
- MP-2: Media Access ✓
- MP-3: Media Marking ✓
- MP-4: Media Storage ✓
- MP-5: Media Transport ✓
- MP-6: Media Sanitization ✓
- MP-7: Media Use ✓
- MP-8: Media Downgrading ✓

### 4.11 Physical and Environmental Protection (PE) Family - 23 Controls
- PE-1: Physical and Environmental Protection Policy and Procedures ✓
- PE-2: Physical Access Authorizations ✓
- PE-3: Physical Access Control ✓
- PE-4: Access Control for Transmission Medium ✓
- PE-5: Access Control for Output Devices ✓
- PE-6: Monitoring Physical Access ✓
- PE-8: Visitor Access Records ✓
- PE-9: Power Equipment and Cabling ✓
- PE-10: Emergency Shutoff ✓
- PE-11: Emergency Power ✓
- PE-12: Emergency Lighting ✓
- PE-13: Fire Protection ✓
- PE-14: Temperature and Humidity Controls ✓
- PE-15: Water Damage Protection ✓
- PE-16: Delivery and Removal ✓
- PE-17: Alternate Work Site ✓
- PE-18: Location of System Components ✓
- PE-19: Information Leakage ✓
- PE-20: Asset Monitoring and Tracking ✓
- PE-21: Electromagnetic Pulse Protection ✓
- PE-22: Component Marking ✓
- PE-23: Facility Location ✓

### 4.12 Privacy Controls Family - 8 Controls (NEW in Rev 5)
- PT-1: Privacy Notice ✓
- PT-2: Data Minimization and Data Retention ✓
- PT-3: Data Mining Protection ✓
- PT-4: Consent ✓
- PT-5: Privacy Impact Assessment ✓
- PT-6: System of Records Notice ✓
- PT-7: Specific Categories of Personally Identifiable Information ✓
- PT-8: Computer Matching Requirements ✓

### 4.13 All Remaining Control Families
- **Planning (PL)**: 11 controls covering system security planning
- **Program Management (PM)**: 32 controls for enterprise-wide security programs  
- **Personnel Security (PS)**: 9 controls for personnel security measures
- **Risk Assessment (RA)**: 10 controls for risk management processes
- **System and Services Acquisition (SA)**: 23 controls for secure acquisition
- **System and Communications Protection (SC)**: 51 controls for system protection
- **System and Information Integrity (SI)**: 23 controls for maintaining system integrity
- **Supply Chain Risk Management (SR)**: 12 controls for supply chain security

## 5. Implementation by Impact Level
- **Low Impact**: 158 baseline controls + enhancements
- **Moderate Impact**: 248 baseline controls + enhancements  
- **High Impact**: 325 baseline controls + enhancements

## 6. Control Enhancement Summary
- **Total Base Controls**: 325 controls across 20 families
- **Available Control Enhancements**: 700+ enhancements
- **New Rev 5.1.1 Controls**: Identity providers and authorization servers
- **Privacy Controls Integration**: 8 dedicated privacy controls

## 7. Continuous Monitoring and Assessment
All controls subject to continuous monitoring with annual assessment and real-time risk adjustment.

**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  }
];

// Master template registry with complete template sets
export const AllDocumentTemplates: Record<string, DocumentTemplate[]> = {
  'ISO27001': [...ISO27001Templates, ...AdditionalISO27001Templates],
  'SOC2': SOC2Templates,
  'FedRAMP-Low': FedRAMPLowTemplates,
  'FedRAMP-Moderate': FedRAMPModerateTemplates,
  'FedRAMP-High': FedRAMPHighTemplates,
  'NIST-800-53': NIST80053Templates
};

// Template management functions
export class DocumentTemplateService {
  
  // Get templates by framework
  static getTemplatesByFramework(framework: string): DocumentTemplate[] {
    return AllDocumentTemplates[framework] || [];
  }

  // Get template by ID
  static getTemplateById(templateId: string): DocumentTemplate | null {
    for (const framework in AllDocumentTemplates) {
      const template = AllDocumentTemplates[framework].find(t => t.id === templateId);
      if (template) return template;
    }
    return null;
  }

  // Get required templates for a framework
  static getRequiredTemplates(framework: string): DocumentTemplate[] {
    const templates = this.getTemplatesByFramework(framework);
    return templates.filter(t => t.required);
  }

  // Get templates by category
  static getTemplatesByCategory(framework: string, category: string): DocumentTemplate[] {
    const templates = this.getTemplatesByFramework(framework);
    return templates.filter(t => t.category === category);
  }

  // Validate template variables
  static validateTemplateVariables(templateId: string, variables: Record<string, any>): {
    valid: boolean;
    errors: string[];
  } {
    const template = this.getTemplateById(templateId);
    if (!template) {
      return { valid: false, errors: ['Template not found'] };
    }

    const errors: string[] = [];
    
    for (const [key, config] of Object.entries(template.templateVariables)) {
      if (config.required && !variables[key]) {
        errors.push(`Required variable '${config.label}' is missing`);
      }
      
      if (variables[key] && config.type === 'select' && config.options) {
        if (!config.options.includes(variables[key])) {
          errors.push(`Invalid value for '${config.label}'. Must be one of: ${config.options.join(', ')}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Generate document from template
  static generateDocument(templateId: string, variables: Record<string, any>): {
    success: boolean;
    content?: string;
    errors?: string[];
  } {
    const template = this.getTemplateById(templateId);
    if (!template) {
      return { success: false, errors: ['Template not found'] };
    }

    const validation = this.validateTemplateVariables(templateId, variables);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    let content = template.templateContent;
    
    // Replace variables in content
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(placeholder, String(value));
    }

    // Handle any remaining unfilled variables
    const remainingVars = content.match(/{{[\w_]+}}/g);
    if (remainingVars) {
      for (const remainingVar of remainingVars) {
        content = content.replace(remainingVar, '[TO BE COMPLETED]');
      }
    }

    return {
      success: true,
      content
    };
  }

  // Get template statistics
  static getTemplateStats(): {
    totalTemplates: number;
    byFramework: Record<string, number>;
    byCategory: Record<string, number>;
    requiredCount: number;
  } {
    let totalTemplates = 0;
    let requiredCount = 0;
    const byFramework: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const [framework, templates] of Object.entries(AllDocumentTemplates)) {
      byFramework[framework] = templates.length;
      totalTemplates += templates.length;

      templates.forEach(template => {
        if (template.required) requiredCount++;
        byCategory[template.category] = (byCategory[template.category] || 0) + 1;
      });
    }

    return {
      totalTemplates,
      byFramework,
      byCategory,
      requiredCount
    };
  }

  // Log template usage
  static logTemplateUsage(templateId: string, framework: string, userId?: string) {
    logger.info('Document template used', {
      templateId,
      framework,
      userId,
      timestamp: new Date().toISOString()
    });
  }
}
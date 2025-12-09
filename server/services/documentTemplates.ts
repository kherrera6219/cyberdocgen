import { logger } from '../utils/logger';
import { z } from 'zod';
import {
  createDynamicVariableSchema,
  generateFromTemplateSchema,
  templateListQuerySchema,
  extractTemplateVariables,
  validateTemplateStructure,
  type GenerateFromTemplateInput,
  type TemplateListQuery,
  type TemplateGenerationResult,
  type SimpleTemplateVariableConfig
} from '../validation/templateSchemas';

// Complete 2025 Document Template Library
// Based on latest ISO 27001:2022, SOC 2 Type 2, FedRAMP Rev 5, and NIST 800-53 Rev 5.1.1

export interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  framework: string;
  category: string;
  priority: number;
  documentType:
    | 'policy'
    | 'procedure'
    | 'plan'
    | 'assessment'
    | 'standard'
    | 'control'
    | 'framework'
    | 'training'
    | 'report'
    | 'poster'
    | 'appointment'
    | 'specification'
    | 'checklist'
    | 'statement'
    | 'memorandum';
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

// Operational Templates - SOPs, Role Appointments, Logs, and Checklists
export const OperationalTemplates: DocumentTemplate[] = [
  {
    id: 'sop-001',
    title: 'Standard Operating Procedure Template',
    description: 'Comprehensive SOP template for operational procedures',
    framework: 'General',
    category: 'procedure',
    priority: 1,
    documentType: 'procedure',
    required: false,
    templateContent: `# Standard Operating Procedure (SOP)

## Document Information
**Title:** {{procedure_title}}
**SOP ID:** {{sop_id}}
**Version:** {{version}}
**Effective Date:** {{effective_date}}
**Review Date:** {{review_date}}
**Owner:** {{procedure_owner}}
**Approved By:** {{approved_by}}

## 1. Purpose and Scope
### 1.1 Purpose
{{purpose_description}}

### 1.2 Scope
This SOP applies to:
- Personnel: {{applicable_personnel}}
- Departments: {{applicable_departments}}
- Systems: {{applicable_systems}}
- Locations: {{applicable_locations}}

## 2. Responsibilities
### 2.1 Process Owner
- {{owner_responsibility_1}}
- {{owner_responsibility_2}}
- {{owner_responsibility_3}}

### 2.2 Team Members
- {{team_responsibility_1}}
- {{team_responsibility_2}}
- {{team_responsibility_3}}

### 2.3 Management
- {{management_responsibility_1}}
- {{management_responsibility_2}}

## 3. Procedure Steps
### Step 1: {{step_1_title}}
**Responsible:** {{step_1_responsible}}
**Action:** {{step_1_action}}
**Requirements:** {{step_1_requirements}}
**Documentation:** {{step_1_documentation}}

### Step 2: {{step_2_title}}
**Responsible:** {{step_2_responsible}}
**Action:** {{step_2_action}}
**Requirements:** {{step_2_requirements}}
**Documentation:** {{step_2_documentation}}

### Step 3: {{step_3_title}}
**Responsible:** {{step_3_responsible}}
**Action:** {{step_3_action}}
**Requirements:** {{step_3_requirements}}
**Documentation:** {{step_3_documentation}}

## 4. Quality Controls
### 4.1 Verification Steps
- {{verification_step_1}}
- {{verification_step_2}}
- {{verification_step_3}}

### 4.2 Success Criteria
- {{success_criteria_1}}
- {{success_criteria_2}}
- {{success_criteria_3}}

## 5. Documentation Requirements
### 5.1 Required Records
- {{required_record_1}}
- {{required_record_2}}
- {{required_record_3}}

### 5.2 Retention Period
{{retention_period}}

## 6. Training Requirements
- Initial training: {{initial_training}}
- Refresher training: {{refresher_training}}
- Competency assessment: {{competency_assessment}}

## 7. Related Documents
- {{related_document_1}}
- {{related_document_2}}
- {{related_document_3}}

## 8. Revision History
| Version | Date | Description | Author |
|---------|------|-------------|--------|
| {{version}} | {{effective_date}} | {{revision_description}} | {{author}} |

**Next Review Date:** {{next_review_date}}`,
    templateVariables: {
      procedure_title: { type: 'text', label: 'Procedure Title', required: true },
      sop_id: { type: 'text', label: 'SOP Identifier', required: true },
      version: { type: 'text', label: 'Version Number', required: true },
      procedure_owner: { type: 'text', label: 'Procedure Owner', required: true },
      purpose_description: { type: 'text', label: 'Purpose Description', required: true },
      applicable_personnel: { type: 'text', label: 'Applicable Personnel', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true }
    }
  },
  {
    id: 'role-001',
    title: 'Role Appointment and Responsibilities Document',
    description: 'Template for formal role appointments and responsibility definitions',
    framework: 'General',
    category: 'governance',
    priority: 2,
    documentType: 'appointment',
    required: false,
    templateContent: `# Role Appointment and Responsibilities

## Appointment Information
**Organization:** {{organization_name}}
**Appointment Date:** {{appointment_date}}
**Effective Date:** {{effective_date}}
**Appointing Authority:** {{appointing_authority}}

## Role Details
### Role Information
**Role Title:** {{role_title}}
**Role Code:** {{role_code}}
**Department:** {{department}}
**Reporting Structure:** {{reporting_structure}}
**Employment Type:** {{employment_type}}

### Appointee Information
**Name:** {{appointee_name}}
**Employee ID:** {{employee_id}}
**Email:** {{appointee_email}}
**Start Date:** {{start_date}}
**Previous Role:** {{previous_role}}

## Primary Responsibilities
### Core Functions
1. **{{responsibility_1_title}}**
   - {{responsibility_1_detail_1}}
   - {{responsibility_1_detail_2}}
   - {{responsibility_1_detail_3}}

2. **{{responsibility_2_title}}**
   - {{responsibility_2_detail_1}}
   - {{responsibility_2_detail_2}}
   - {{responsibility_2_detail_3}}

3. **{{responsibility_3_title}}**
   - {{responsibility_3_detail_1}}
   - {{responsibility_3_detail_2}}
   - {{responsibility_3_detail_3}}

## Authority and Decision Rights
### Authorized Decisions
- {{authority_1}}
- {{authority_2}}
- {{authority_3}}

### Approval Limits
- Financial: {{financial_limit}}
- Personnel: {{personnel_authority}}
- Operational: {{operational_authority}}

### Escalation Requirements
- {{escalation_1}}
- {{escalation_2}}
- {{escalation_3}}

## Performance Metrics
### Key Performance Indicators
1. **{{kpi_1_name}}**: {{kpi_1_description}}
   - Target: {{kpi_1_target}}
   - Measurement: {{kpi_1_measurement}}

2. **{{kpi_2_name}}**: {{kpi_2_description}}
   - Target: {{kpi_2_target}}
   - Measurement: {{kpi_2_measurement}}

3. **{{kpi_3_name}}**: {{kpi_3_description}}
   - Target: {{kpi_3_target}}
   - Measurement: {{kpi_3_measurement}}

## Training and Development
### Required Training
- {{training_1}}
- {{training_2}}
- {{training_3}}

### Professional Development
- {{development_1}}
- {{development_2}}
- {{development_3}}

### Certification Requirements
- {{certification_1}}: {{cert_1_deadline}}
- {{certification_2}}: {{cert_2_deadline}}

## Compliance Requirements
### Regulatory Obligations
- {{compliance_1}}
- {{compliance_2}}
- {{compliance_3}}

### Internal Policies
- {{policy_1}}
- {{policy_2}}
- {{policy_3}}

## Review and Evaluation
### Performance Review Schedule
- Initial Review: {{initial_review_date}}
- Annual Review: {{annual_review_date}}
- Continuous Feedback: {{feedback_schedule}}

### Success Criteria
- {{success_criteria_1}}
- {{success_criteria_2}}
- {{success_criteria_3}}

## Signatures
**Appointee Acceptance:**
Name: {{appointee_name}}
Signature: _________________
Date: {{acceptance_date}}

**Manager Approval:**
Name: {{manager_name}}
Signature: _________________
Date: {{approval_date}}

**HR Verification:**
Name: {{hr_representative}}
Signature: _________________
Date: {{hr_verification_date}}`,
    templateVariables: {
      organization_name: { type: 'text', label: 'Organization Name', required: true },
      role_title: { type: 'text', label: 'Role Title', required: true },
      appointee_name: { type: 'text', label: 'Appointee Name', required: true },
      appointment_date: { type: 'date', label: 'Appointment Date', required: true },
      department: { type: 'text', label: 'Department', required: true },
      appointing_authority: { type: 'text', label: 'Appointing Authority', required: true },
      employment_type: { type: 'select', label: 'Employment Type', required: true, options: ['Full-time', 'Part-time', 'Contract', 'Temporary'] }
    }
  },
  {
    id: 'logs-001',
    title: 'Required Logs and Monitoring Template',
    description: 'Template for defining required logs, monitoring, and audit trail requirements',
    framework: 'General',
    category: 'monitoring',
    priority: 3,
    documentType: 'specification',
    required: false,
    templateContent: `# Required Logs and Monitoring Specification

## Document Control
**Document Title:** {{document_title}}
**Version:** {{version}}
**Effective Date:** {{effective_date}}
**Owner:** {{document_owner}}
**Review Frequency:** {{review_frequency}}

## 1. Logging Requirements Overview
### 1.1 Purpose
{{logging_purpose}}

### 1.2 Scope
This document covers logging requirements for:
- **Systems:** {{covered_systems}}
- **Applications:** {{covered_applications}}
- **Infrastructure:** {{covered_infrastructure}}
- **Security Controls:** {{covered_security}}

## 2. Security Event Logs
### 2.1 Authentication Logs
**Log Type:** Authentication Events
**Retention:** {{auth_log_retention}}
**Format:** {{auth_log_format}}

**Required Fields:**
- User ID: {{auth_userid_req}}
- Timestamp: {{auth_timestamp_req}}
- Source IP: {{auth_sourceip_req}}
- Authentication Method: {{auth_method_req}}
- Success/Failure: {{auth_result_req}}
- Session ID: {{auth_session_req}}

**Events to Log:**
- Successful login attempts
- Failed login attempts
- Account lockouts
- Password changes
- Privilege escalations
- Session terminations

### 2.2 Authorization Logs
**Log Type:** Access Control Events
**Retention:** {{authz_log_retention}}
**Format:** {{authz_log_format}}

**Required Fields:**
- User ID: {{authz_userid_req}}
- Resource Accessed: {{authz_resource_req}}
- Action Performed: {{authz_action_req}}
- Permission Level: {{authz_permission_req}}
- Result: {{authz_result_req}}
- Timestamp: {{authz_timestamp_req}}

## 3. System Operation Logs
### 3.1 Application Logs
**Applications:** {{app_list}}
**Log Level:** {{app_log_level}}
**Retention:** {{app_log_retention}}

**Required Events:**
- Application start/stop
- Configuration changes
- Error conditions
- Performance metrics
- User transactions

### 3.2 System Logs
**Systems:** {{system_list}}
**Log Level:** {{system_log_level}}
**Retention:** {{system_log_retention}}

**Required Events:**
- System boot/shutdown
- Service start/stop
- Hardware errors
- Resource utilization
- Network connectivity

## 4. Database Activity Logs
### 4.1 Database Access Logs
**Database Systems:** {{database_systems}}
**Log Level:** {{db_log_level}}
**Retention:** {{db_log_retention}}

**Required Fields:**
- User/Application ID
- Database name
- Table/Object accessed
- SQL Command type
- Number of records affected
- Timestamp
- Source connection

### 4.2 Database Administrative Logs
**Required Events:**
- Schema changes
- User account modifications
- Privilege changes
- Backup operations
- Recovery operations

## 5. Network Activity Logs
### 5.1 Firewall Logs
**Devices:** {{firewall_devices}}
**Retention:** {{firewall_retention}}

**Required Fields:**
- Source IP/Port
- Destination IP/Port
- Protocol
- Action (Allow/Deny)
- Rule ID
- Timestamp

### 5.2 Network Device Logs
**Devices:** {{network_devices}}
**Events:** {{network_events}}
**Retention:** {{network_retention}}

## 6. Compliance and Audit Logs
### 6.1 Regulatory Compliance Logs
**Regulations:** {{applicable_regulations}}
**Specific Requirements:** {{compliance_requirements}}
**Retention:** {{compliance_retention}}

### 6.2 Internal Audit Logs
**Audit Activities:** {{audit_activities}}
**Documentation Requirements:** {{audit_documentation}}
**Retention:** {{audit_retention}}

## 7. Log Management Requirements
### 7.1 Centralized Logging
**Log Aggregation System:** {{log_system}}
**Collection Method:** {{collection_method}}
**Real-time Processing:** {{realtime_processing}}

### 7.2 Log Protection
**Encryption:** {{log_encryption}}
**Access Controls:** {{log_access_controls}}
**Integrity Protection:** {{log_integrity}}

### 7.3 Monitoring and Alerting
**Monitoring Tools:** {{monitoring_tools}}
**Alert Conditions:** {{alert_conditions}}
**Response Procedures:** {{response_procedures}}

## 8. Log Review and Analysis
### 8.1 Regular Review Schedule
**Daily Reviews:** {{daily_review_scope}}
**Weekly Reviews:** {{weekly_review_scope}}
**Monthly Reviews:** {{monthly_review_scope}}
**Quarterly Reviews:** {{quarterly_review_scope}}

### 8.2 Automated Analysis
**SIEM Rules:** {{siem_rules}}
**Correlation Logic:** {{correlation_logic}}
**Machine Learning:** {{ml_analysis}}

## 9. Retention and Archival
### 9.1 Retention Periods
| Log Type | Online Retention | Archive Retention | Destruction |
|----------|------------------|-------------------|-------------|
| Security Events | {{security_online}} | {{security_archive}} | {{security_destroy}} |
| System Logs | {{system_online}} | {{system_archive}} | {{system_destroy}} |
| Application Logs | {{app_online}} | {{app_archive}} | {{app_destroy}} |
| Database Logs | {{db_online}} | {{db_archive}} | {{db_destroy}} |

### 9.2 Archive Procedures
**Archive Method:** {{archive_method}}
**Archive Location:** {{archive_location}}
**Retrieval Process:** {{retrieval_process}}

## 10. Compliance Verification
### 10.1 Log Completeness Checks
**Verification Method:** {{completeness_method}}
**Check Frequency:** {{completeness_frequency}}
**Responsible Party:** {{completeness_responsible}}

### 10.2 Quality Assurance
**QA Procedures:** {{qa_procedures}}
**Sampling Method:** {{sampling_method}}
**Corrective Actions:** {{corrective_actions}}

**Document Approval:**
**Prepared By:** {{prepared_by}}
**Reviewed By:** {{reviewed_by}}
**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      document_title: { type: 'text', label: 'Document Title', required: true },
      version: { type: 'text', label: 'Version', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      logging_purpose: { type: 'text', label: 'Logging Purpose', required: true },
      covered_systems: { type: 'text', label: 'Covered Systems', required: true },
      auth_log_retention: { type: 'select', label: 'Authentication Log Retention', required: true, options: ['30 days', '90 days', '1 year', '7 years'] },
      effective_date: { type: 'date', label: 'Effective Date', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true }
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
      applicable_framework: { type: 'select', label: 'Applicable Framework', required: true, options: ['ISO 27001', 'SOC 2', 'FedRAMP', 'NIST 800-53', 'PCI DSS', 'HIPAA', 'GDPR'] },
      assessor_name: { type: 'text', label: 'Assessor Name', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true },
      submission_timeframe: { type: 'select', label: 'Submission Timeframe', required: true, options: ['24 hours', '48 hours', '1 week', '2 weeks'] }
    }
  }
];

// Certification Documentation Templates - Required for Audit/Certification Process
export const CertificationDocumentTemplates: DocumentTemplate[] = [
  {
    id: 'cert-iso-001',
    title: 'ISO 27001 Management Assertion Statement',
    description: 'Formal management statement asserting ISMS implementation and commitment',
    framework: 'ISO27001',
    category: 'statement',
    priority: 1,
    documentType: 'statement',
    required: true,
    templateContent: `# Management Assertion Statement - ISO 27001:2022

## Document Information
**Organization:** {{organization_name}}
**Date:** {{assertion_date}}
**ISMS Scope:** {{isms_scope}}
**Certification Body:** {{certification_body}}
**Assessment Period:** {{assessment_period}}

## Management Assertion

We, the management of {{organization_name}}, hereby assert that:

### 1. Information Security Management System (ISMS) Implementation
We have established, implemented, maintained, and continually improved an Information Security Management System (ISMS) in accordance with the requirements of ISO/IEC 27001:2022.

### 2. Management Commitment
- Senior management demonstrates leadership and commitment to the ISMS
- Information security policy has been established and is appropriate for the organization
- Resources necessary for the ISMS have been allocated
- Regular management reviews are conducted to ensure continuing effectiveness

### 3. Risk Management
- Information security risks have been identified and assessed using {{risk_methodology}}
- Appropriate risk treatment options have been implemented
- Risk acceptance criteria have been defined and applied
- Regular risk assessments are conducted and documented

### 4. Control Implementation
The Statement of Applicability documents {{total_controls}} applicable controls from ISO 27001:2022 Annex A:
- **Implemented Controls:** {{implemented_controls_count}}
- **Planned Controls:** {{planned_controls_count}}  
- **Not Applicable Controls:** {{na_controls_count}} (with justification)

### 5. Competence and Awareness
- Personnel are competent on the basis of education, training, or experience
- All personnel are aware of the information security policy
- Security awareness programs are regularly conducted
- Training records are maintained and reviewed

### 6. Monitoring and Measurement
- Performance of the ISMS is monitored and measured
- Internal audits are conducted at planned intervals
- Management reviews are performed regularly
- Corrective actions are taken when necessary

### 7. Continuous Improvement
The ISMS is continually improved through:
- Regular internal audits findings and recommendations
- Management review outcomes
- Corrective and preventive action implementation
- Performance monitoring results

## Compliance Declaration
We declare that our ISMS:
✓ Meets the requirements of ISO/IEC 27001:2022
✓ Is appropriate for the purpose and context of the organization
✓ Includes all systems, processes, and personnel within the defined scope
✓ Addresses all applicable legal, regulatory, and contractual requirements

## Certification Readiness
We believe our organization is ready for ISO 27001:2022 certification assessment and commit to:
- Providing full access to personnel, facilities, and documentation
- Cooperating fully with the certification audit process
- Addressing any nonconformities identified during assessment
- Maintaining the ISMS effectiveness post-certification

**Chief Executive Officer**
Name: {{ceo_name}}
Signature: _________________
Date: {{ceo_signature_date}}

**Information Security Officer** 
Name: {{iso_name}}
Signature: _________________
Date: {{iso_signature_date}}

**Document Control**
Version: {{version}}
Next Review Date: {{next_review_date}}
Approved By: {{approved_by}}`,
    templateVariables: {
      organization_name: { type: 'text', label: 'Organization Name', required: true },
      isms_scope: { type: 'text', label: 'ISMS Scope Statement', required: true },
      assertion_date: { type: 'date', label: 'Assertion Date', required: true },
      certification_body: { type: 'text', label: 'Certification Body', required: true },
      risk_methodology: { type: 'text', label: 'Risk Assessment Methodology', required: true },
      ceo_name: { type: 'text', label: 'CEO Name', required: true },
      iso_name: { type: 'text', label: 'Information Security Officer Name', required: true }
    }
  },
  {
    id: 'cert-fedramp-001', 
    title: 'FedRAMP System Characterization and Authorization Memorandum',
    description: 'Official memorandum for FedRAMP system authorization and impact level designation',
    framework: 'FedRAMP',
    category: 'memorandum',
    priority: 1,
    documentType: 'memorandum',
    required: true,
    templateContent: `# MEMORANDUM FOR FEDRAMP PROGRAM MANAGEMENT OFFICE

## SUBJECT: System Authorization Request for {{system_name}}

**FROM:** {{authorizing_official_name}}, {{authorizing_official_title}}
**TO:** FedRAMP Program Management Office
**DATE:** {{memo_date}}
**CLASSIFICATION:** {{classification_level}}

## 1. SYSTEM IDENTIFICATION

**System Name:** {{system_name}}
**System Identifier:** {{system_id}}
**Cloud Service Provider:** {{csp_name}}
**Impact Level:** {{impact_level}}
**Service Model:** {{service_model}}
**Deployment Model:** {{deployment_model}}

## 2. AUTHORIZATION BASIS

This memorandum requests authorization for the {{system_name}} under the Federal Risk and Authorization Management Program (FedRAMP). The system has been assessed in accordance with:

- FedRAMP Security Assessment Framework (SAF) Version 2.1
- NIST SP 800-53 Revision 5 Security Controls
- FedRAMP {{impact_level}} Baseline Requirements
- FIPS Publication 199 Impact Analysis

## 3. SYSTEM CHARACTERIZATION

### System Description
{{system_description}}

### Business Purpose
{{business_purpose}}

### System Environment
- **Hosting Environment:** {{hosting_environment}}
- **Geographic Locations:** {{geographic_locations}}
- **System Boundaries:** {{system_boundaries}}
- **Network Architecture:** {{network_architecture}}

### Data Types Processed
{{data_types_processed}}

## 4. SECURITY ASSESSMENT SUMMARY

### Assessment Methodology
The security assessment was conducted by {{three_pao_name}}, an accredited Third Party Assessment Organization (3PAO), in accordance with FedRAMP requirements.

**Assessment Period:** {{assessment_start_date}} to {{assessment_end_date}}

### Control Implementation Status
- **Total Controls Assessed:** {{total_controls}}
- **Fully Implemented:** {{implemented_controls}}
- **Partially Implemented:** {{partially_implemented}}
- **Not Implemented:** {{not_implemented}}
- **Not Applicable:** {{not_applicable}}

### Security Control Families Assessed
✓ Access Control (AC) - {{ac_controls}} controls
✓ Audit and Accountability (AU) - {{au_controls}} controls  
✓ Assessment, Authorization, and Monitoring (CA) - {{ca_controls}} controls
✓ Configuration Management (CM) - {{cm_controls}} controls
✓ Contingency Planning (CP) - {{cp_controls}} controls
✓ Identification and Authentication (IA) - {{ia_controls}} controls
✓ Incident Response (IR) - {{ir_controls}} controls
✓ Maintenance (MA) - {{ma_controls}} controls
✓ Media Protection (MP) - {{mp_controls}} controls
✓ Physical and Environmental Protection (PE) - {{pe_controls}} controls
✓ Planning (PL) - {{pl_controls}} controls
✓ Personnel Security (PS) - {{ps_controls}} controls
✓ Risk Assessment (RA) - {{ra_controls}} controls
✓ System and Services Acquisition (SA) - {{sa_controls}} controls
✓ System and Communications Protection (SC) - {{sc_controls}} controls
✓ System and Information Integrity (SI) - {{si_controls}} controls

## 5. RISK ASSESSMENT RESULTS

### Overall Risk Rating: {{overall_risk_rating}}

### Critical Findings: {{critical_findings_count}}
### High Findings: {{high_findings_count}}
### Medium Findings: {{medium_findings_count}}
### Low Findings: {{low_findings_count}}

All critical and high-risk findings have been addressed through the Plan of Action & Milestones (POA&M) with approved risk mitigation strategies.

## 6. CONTINUOUS MONITORING

The Cloud Service Provider has implemented a continuous monitoring program that includes:
- Monthly vulnerability scans by approved scanning vendors
- Configuration management and change control procedures
- Incident response and reporting procedures
- Annual assessment updates
- Real-time security monitoring and alerting

## 7. AUTHORIZATION RECOMMENDATION

Based on the comprehensive security assessment and risk analysis, I recommend granting a {{authorization_type}} for {{system_name}} with the following conditions:

### Terms and Conditions
1. Maintain all security controls as documented in the System Security Plan
2. Execute continuous monitoring requirements per FedRAMP guidelines
3. Report all significant changes to system boundaries or architecture
4. Submit monthly continuous monitoring deliverables
5. Undergo annual assessment by accredited 3PAO
6. Maintain current POA&M status and remediation timeline

### Authorization Period
**Effective Date:** {{authorization_effective_date}}
**Expiration Date:** {{authorization_expiration_date}}
**Review Cycle:** Annual

## 8. SUPPORTING DOCUMENTATION

The following documents support this authorization request:
- System Security Plan (SSP) Version {{ssp_version}}
- Security Assessment Report (SAR) by {{three_pao_name}}
- Plan of Action & Milestones (POA&M) Version {{poam_version}}
- Contingency Plan Version {{cp_version}}
- Continuous Monitoring Strategy Version {{conmon_version}}

## 9. CERTIFICATION

I certify that the information contained in this memorandum accurately represents the security posture of {{system_name}} and that all security controls have been implemented and assessed in accordance with FedRAMP requirements.

**AUTHORIZING OFFICIAL**

{{authorizing_official_name}}
{{authorizing_official_title}}
{{organization_name}}

Signature: _________________________
Date: {{signature_date}}

**CONCURRENCE**

**Chief Information Security Officer**
{{ciso_name}}
Signature: _________________________
Date: {{ciso_signature_date}}

**Distribution:**
- FedRAMP PMO
- {{csp_name}} Leadership  
- Agency Sponsor (if applicable)
- {{three_pao_name}}

**Classification:** {{classification_level}}
**Control Number:** {{control_number}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      csp_name: { type: 'text', label: 'Cloud Service Provider Name', required: true },
      impact_level: { type: 'select', label: 'FedRAMP Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      authorizing_official_name: { type: 'text', label: 'Authorizing Official Name', required: true },
      three_pao_name: { type: 'text', label: 'Third Party Assessment Organization', required: true },
      memo_date: { type: 'date', label: 'Memorandum Date', required: true },
      service_model: { type: 'select', label: 'Service Model', required: true, options: ['IaaS', 'PaaS', 'SaaS'] }
    }
  },
  {
    id: 'cert-soc2-001',
    title: 'SOC 2 Type 2 Management Assertion Letter',
    description: 'Management assertion letter for SOC 2 Type 2 attestation engagement',
    framework: 'SOC2',
    category: 'statement',
    priority: 1,
    documentType: 'statement',
    required: true,
    templateContent: `# Management Assertion Letter - SOC 2 Type 2

**TO:** {{auditor_firm_name}}
**FROM:** {{management_name}}, {{management_title}}
**DATE:** {{assertion_date}}
**RE:** SOC 2 Type 2 Attestation Engagement for {{company_name}}

## Management's Assertion

We, the management of {{company_name}}, are responsible for designing, implementing, operating, and maintaining effective controls over our {{service_description}} system to provide reasonable assurance that our service commitments and system requirements were achieved based on the Trust Services Criteria relevant to {{applicable_criteria}} during the period {{audit_period_start}} to {{audit_period_end}}.

## System Description

### Company and Service Overview
{{company_name}} provides {{detailed_service_description}} to customers across {{geographic_coverage}}. Our mission is {{company_mission}}.

### Service Commitments and System Requirements
We are committed to:
- {{service_commitment_1}}
- {{service_commitment_2}}
- {{service_commitment_3}}
- {{service_commitment_4}}

### Principal Service Commitments and System Requirements
Our principal service commitments to customers include:
{{principal_service_commitments}}

## Trust Services Categories

We assert that the controls within our system were effective throughout the audit period to meet the following Trust Services Criteria:

### Security (Required for all SOC 2 audits)
✓ **CC6.1** - Logical and physical access controls restrict access to the system
✓ **CC6.2** - Access rights are authorized and managed  
✓ **CC6.3** - Access permissions are removed when access is no longer required
✓ **CC6.6** - Vulnerabilities are identified and remediated
✓ **CC6.7** - Data transmission is protected
✓ **CC6.8** - System operations are protected from unauthorized access

### Availability {{availability_applicable}}
{{#if availability_applicable}}
✓ **A1.1** - Availability commitments and system requirements are achieved
✓ **A1.2** - System capacity is monitored and managed
✓ **A1.3** - System resilience and backup capabilities are maintained
{{/if}}

### Processing Integrity {{processing_integrity_applicable}}
{{#if processing_integrity_applicable}}
✓ **PI1.1** - Processing integrity commitments are achieved
✓ **PI1.2** - System processing is accurate and complete
✓ **PI1.3** - Processing errors are identified and corrected
{{/if}}

### Confidentiality {{confidentiality_applicable}}
{{#if confidentiality_applicable}}
✓ **C1.1** - Confidentiality commitments are achieved
✓ **C1.2** - Confidential information is protected during processing and storage
{{/if}}

### Privacy {{privacy_applicable}}
{{#if privacy_applicable}}
✓ **P1.1** - Privacy commitments are achieved
✓ **P2.1** - Privacy notices are provided to data subjects
✓ **P3.1** - Choice and consent mechanisms are implemented
{{/if}}

## Control Environment

### Organizational Structure
{{organizational_structure}}

### Key Personnel and Responsibilities
- **Chief Executive Officer:** {{ceo_name}} - Overall governance and strategic direction
- **Chief Technology Officer:** {{cto_name}} - Technology strategy and system oversight
- **Chief Information Security Officer:** {{ciso_name}} - Security program leadership
- **Data Protection Officer:** {{dpo_name}} - Privacy program oversight
- **IT Operations Manager:** {{it_ops_manager}} - Day-to-day system operations

### Control Activities
Management has implemented the following categories of control activities:
- **Access Control Procedures** - User provisioning, authentication, authorization
- **Change Management Controls** - System change approval and testing procedures
- **Monitoring Controls** - System monitoring, logging, and alerting capabilities
- **Data Protection Controls** - Encryption, backup, and recovery procedures
- **Incident Response Procedures** - Security incident detection and response
- **Vendor Management Controls** - Third-party risk assessment and oversight

## Risk Assessment Process

Management conducts formal risk assessments {{risk_assessment_frequency}} that include:
- Identification of relevant threats and vulnerabilities
- Assessment of likelihood and impact of identified risks
- Implementation of risk mitigation controls
- Regular review and update of risk registers

## Information and Communication Systems

Our information systems relevant to this SOC 2 examination include:
{{information_systems_list}}

Communication mechanisms include:
- Regular security awareness training for all employees
- Documented policies and procedures accessible to relevant personnel
- Incident communication protocols for security events
- Regular reporting to management and customers on security posture

## Monitoring Activities

Management monitors the operating effectiveness of controls through:
- **Internal audits** conducted {{internal_audit_frequency}}
- **Management reviews** performed {{mgmt_review_frequency}}  
- **Third-party assessments** including penetration testing and vulnerability assessments
- **Continuous monitoring** through automated security tools and manual reviews

## Changes During the Audit Period

Significant changes to our system during the audit period include:
{{significant_changes}}

## Subsequent Events

{{subsequent_events}}

## Management's Conclusion

Based on our knowledge of the system and the results of our ongoing monitoring activities, we believe the controls within our system were suitably designed and operating effectively during the period {{audit_period_start}} to {{audit_period_end}} to meet our service commitments and system requirements based on the applicable Trust Services Criteria.

## Signatures

**Chief Executive Officer**
{{ceo_name}}
Signature: _________________________
Date: {{ceo_signature_date}}

**Chief Information Security Officer**
{{ciso_name}}  
Signature: _________________________
Date: {{ciso_signature_date}}

**Chief Technology Officer**
{{cto_name}}
Signature: _________________________
Date: {{cto_signature_date}}

---

**Attestation Use Restriction:**
This report is intended solely for the information and use of {{company_name}}, its customers, and the management of customer entities who have a sufficient understanding to consider it, along with other information including information about controls operated by customers themselves, when assessing the risks arising from interactions with {{company_name}}'s {{service_description}} system.`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      service_description: { type: 'text', label: 'Service Description', required: true },
      management_name: { type: 'text', label: 'Management Representative Name', required: true },
      auditor_firm_name: { type: 'text', label: 'Auditor Firm Name', required: true },
      applicable_criteria: { type: 'text', label: 'Applicable Trust Services Criteria', required: true },
      audit_period_start: { type: 'date', label: 'Audit Period Start Date', required: true },
      audit_period_end: { type: 'date', label: 'Audit Period End Date', required: true },
      ceo_name: { type: 'text', label: 'CEO Name', required: true }
    }
  },
  {
    id: 'cert-notices-001',
    title: 'Security Awareness Poster and Notice Templates',
    description: 'Professional security awareness posters and notice templates for workplace display',
    framework: 'General',
    category: 'notice',
    priority: 2,
    documentType: 'poster',
    required: false,
    templateContent: `# Security Awareness Posters & Workplace Notices

## Poster 1: Information Security Policy Notice

### Title: INFORMATION SECURITY AWARENESS
**{{organization_name}}**

#### YOUR SECURITY RESPONSIBILITIES
🔐 **PROTECT** company data and systems  
🚫 **REPORT** suspicious activities immediately  
🔑 **SECURE** your passwords and access credentials  
📧 **VERIFY** email authenticity before clicking links  

#### REMEMBER THE CIA TRIAD
**CONFIDENTIALITY** - Keep sensitive information private  
**INTEGRITY** - Ensure data accuracy and completeness  
**AVAILABILITY** - Maintain system accessibility  

#### INCIDENT REPORTING
**Security Hotline:** {{incident_hotline}}  
**Email:** {{incident_email}}  
**Report Within:** 1 hour of discovery  

#### COMPLIANCE FRAMEWORKS
{{compliance_frameworks_list}}

**Questions? Contact:** {{security_contact}}  
**Last Updated:** {{last_updated_date}}

---

## Poster 2: Password Security Guidelines

### Title: STRONG PASSWORD GUIDELINES
**{{organization_name}} - Cybersecurity Program**

#### CREATE STRONG PASSWORDS
✅ **12+ characters** minimum length  
✅ **Mix** of uppercase, lowercase, numbers, symbols  
✅ **Unique** for each system and account  
✅ **Avoid** personal information or dictionary words  

#### USE MULTI-FACTOR AUTHENTICATION
🔐 **Something you know** (password)  
📱 **Something you have** (phone/token)  
👆 **Something you are** (biometric)  

#### NEVER SHARE PASSWORDS
❌ Don't write passwords down  
❌ Don't share with colleagues  
❌ Don't reuse across systems  
❌ Don't send via email or chat  

#### PASSWORD MANAGER RECOMMENDED
**Corporate Approved:** {{password_manager_name}}  
**Support:** {{it_support_contact}}  

**Policy Reference:** {{password_policy_ref}}  
**Effective Date:** {{policy_effective_date}}

---

## Poster 3: Phishing Awareness Alert

### Title: PHISHING ALERT - STAY VIGILANT
**{{organization_name}} Security Team**

#### RECOGNIZE PHISHING ATTEMPTS
🎣 **Suspicious sender** addresses or names  
⚡ **Urgent** language or threats  
🔗 **Suspicious links** hover before clicking  
📎 **Unexpected attachments** from unknown sources  

#### BEFORE YOU CLICK - ASK YOURSELF
❓ Was I expecting this email?  
❓ Does the sender address look legitimate?  
❓ Are there spelling or grammar errors?  
❓ Is the request unusual or urgent?  

#### IF YOU SUSPECT PHISHING
1. **DON'T CLICK** any links or attachments  
2. **REPORT** to security team immediately  
3. **DELETE** the suspicious email  
4. **NOTIFY** your manager if potentially compromised  

#### REPORTING CHANNELS
**Email:** {{phishing_report_email}}  
**Phone:** {{security_hotline}}  
**Internal Portal:** {{security_portal_url}}  

**Remember: When in doubt, report it out!**  
**Updated:** {{poster_update_date}}

---

## Poster 4: Physical Security Reminder

### Title: PHYSICAL SECURITY MATTERS
**{{organization_name}} - Facility Security**

#### PROTECT OUR WORKSPACE
🏢 **Badge in** at all entry points  
👥 **Challenge** unfamiliar individuals  
🚪 **Lock** workstations when away  
📄 **Secure** sensitive documents  

#### VISITOR MANAGEMENT
✅ All visitors must be **escorted**  
✅ Visitors must wear **identification badges**  
✅ **Log** visitor entry/exit times  
✅ **Verify** visitor business purpose  

#### CLEAN DESK POLICY
📋 Secure sensitive documents  
💻 Lock computer screens  
🗑️ Use confidential waste bins  
📱 Don't leave devices unattended  

#### TAILGATING PREVENTION
🚪 **One person, one badge**  
👀 **Watch** for unauthorized followers  
🛑 **Stop** and verify badge access  
📞 **Report** security violations  

**Security Officer:** {{security_officer_name}}  
**Emergency:** {{emergency_contact}}  
**Policy:** {{physical_security_policy}}

---

## Notice 5: System Use Notification

### Title: AUTHORIZED USE ONLY
**{{organization_name}} Information Systems**

#### OFFICIAL NOTICE
This system is for authorized use only. Users (authorized or unauthorized) have no explicit or implicit expectation of privacy.

#### MONITORING NOTICE
- All system activity may be **monitored and recorded**  
- System access and usage is **logged and audited**  
- Inappropriate use may result in **disciplinary action**  
- Evidence may be provided to **law enforcement**  

#### ACCEPTABLE USE
✅ Business-related activities only  
✅ Comply with all company policies  
✅ Protect confidential information  
✅ Report security incidents promptly  

#### PROHIBITED ACTIVITIES
❌ Unauthorized access attempts  
❌ Sharing login credentials  
❌ Installing unauthorized software  
❌ Personal use of company systems  
❌ Accessing inappropriate content  

#### LEGAL NOTICE
By accessing this system, you acknowledge and consent to monitoring and recording of your activities. Unauthorized use may violate federal and state laws and result in criminal and/or civil penalties.

**Legal Department:** {{legal_contact}}  
**IT Security:** {{security_contact}}  
**HR Department:** {{hr_contact}}  

**Authority:** {{legal_authority}}  
**Effective:** {{notice_effective_date}}

---

## Implementation Guidelines

### Poster Specifications
- **Size:** A3 (29.7 x 42 cm) or 11x17 inches
- **Format:** High resolution PDF (300 DPI minimum)
- **Paper:** 150gsm satin/silk finish recommended  
- **Colors:** Corporate brand colors with high contrast

### Placement Requirements
✅ **Common Areas:** Break rooms, elevators, lobbies  
✅ **Work Areas:** Near workstations and printers  
✅ **Entry Points:** Reception areas and security checkpoints  
✅ **Meeting Rooms:** Conference and training rooms  

### Update Schedule
- **Review Frequency:** {{poster_review_frequency}}
- **Update Triggers:** Policy changes, incident trends, compliance updates
- **Version Control:** Date stamps and version numbers required
- **Distribution:** {{poster_distribution_method}}

### Effectiveness Measurement  
- Regular surveys on security awareness levels
- Incident reporting rates and quality
- Policy violation tracking  
- Training completion rates

**Document Control**  
**Version:** {{template_version}}  
**Owner:** {{security_team}}  
**Next Review:** {{next_review_date}}`,
    templateVariables: {
      organization_name: { type: 'text', label: 'Organization Name', required: true },
      incident_hotline: { type: 'text', label: 'Security Incident Hotline', required: true },
      incident_email: { type: 'text', label: 'Security Incident Email', required: true },
      compliance_frameworks_list: { type: 'text', label: 'Compliance Frameworks', required: true },
      security_contact: { type: 'text', label: 'Security Team Contact', required: true },
      password_manager_name: { type: 'text', label: 'Approved Password Manager', required: false },
      poster_review_frequency: { type: 'select', label: 'Poster Review Frequency', required: true, options: ['Monthly', 'Quarterly', 'Semi-annually', 'Annually'] }
    }
  }
];

// Master template registry with complete template sets including operational and certification templates
export const AllDocumentTemplates: Record<string, DocumentTemplate[]> = {
  'ISO27001': [...ISO27001Templates, ...AdditionalISO27001Templates],
  'SOC2': SOC2Templates,
  'FedRAMP-Low': FedRAMPLowTemplates,
  'FedRAMP-Moderate': FedRAMPModerateTemplates,
  'FedRAMP-High': FedRAMPHighTemplates,
  'NIST-800-53': NIST80053Templates,
  'General': OperationalTemplates,
  'Certification': CertificationDocumentTemplates
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

  // Get certification-specific templates
  static getCertificationTemplates(): DocumentTemplate[] {
    return CertificationDocumentTemplates;
  }

  // Get all templates with certification requirements
  static getTemplatesWithCertificationDocs(): DocumentTemplate[] {
    return Object.values(AllDocumentTemplates).flat();
  }

  // Get all templates across all frameworks
  static getAllTemplates(): DocumentTemplate[] {
    return Object.values(AllDocumentTemplates).flat();
  }

  // Get templates by category across all frameworks
  static getAllTemplatesByCategory(category: string): DocumentTemplate[] {
    const allTemplates = Object.values(AllDocumentTemplates).flat();
    return allTemplates.filter(template => template.category === category);
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

  // Zod-based deterministic document generation with full schema validation
  static generateDeterministicDocument(input: unknown): TemplateGenerationResult {
    // Step 1: Validate input structure with Zod
    const inputValidation = generateFromTemplateSchema.safeParse(input);
    if (!inputValidation.success) {
      return {
        success: false,
        templateId: (input as any)?.templateId || 'unknown',
        errors: inputValidation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
      };
    }

    const { templateId, variables, outputFormat, includeToc, includeMetadata, version } = inputValidation.data;

    // Step 2: Find template
    const template = this.getTemplateById(templateId);
    if (!template) {
      return {
        success: false,
        templateId,
        errors: [{ field: 'templateId', message: `Template '${templateId}' not found` }]
      };
    }

    // Step 3: Create dynamic schema for template variables and validate
    const variableSchema = createDynamicVariableSchema(
      template.templateVariables as Record<string, SimpleTemplateVariableConfig>
    );
    const variableValidation = variableSchema.safeParse(variables);

    if (!variableValidation.success) {
      return {
        success: false,
        templateId,
        errors: variableValidation.error.issues.map(issue => ({
          field: `variables.${issue.path.join('.')}`,
          message: issue.message,
          code: issue.code
        }))
      };
    }

    // Step 4: Generate deterministic content
    let content = template.templateContent;
    const validatedVars = variableValidation.data as Record<string, unknown>;

    // Replace all variables with validated values
    for (const [key, value] of Object.entries(validatedVars)) {
      if (value !== undefined && value !== null) {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(placeholder, String(value));
      }
    }

    // Check for any remaining unfilled variables
    const warnings: string[] = [];
    const remainingVars = extractTemplateVariables(content);
    if (remainingVars.length > 0) {
      for (const remainingVar of remainingVars) {
        const config = template.templateVariables[remainingVar];
        if (config && !config.required) {
          warnings.push(`Optional variable '${remainingVar}' was not provided`);
          content = content.replace(new RegExp(`{{${remainingVar}}}`, 'g'), '[Not Specified]');
        } else {
          content = content.replace(new RegExp(`{{${remainingVar}}}`, 'g'), '[TO BE COMPLETED]');
        }
      }
    }

    // Step 5: Add metadata if requested
    if (includeMetadata) {
      const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
      const sectionCount = (content.match(/^##?\s/gm) || []).length;

      // Step 6: Add table of contents if requested
      if (includeToc) {
        const headings = content.match(/^#{1,3}\s.+$/gm) || [];
        if (headings.length > 0) {
          const toc = headings.map(h => {
            const level = (h.match(/^#+/) || [''])[0].length;
            const text = h.replace(/^#+\s*/, '');
            const indent = '  '.repeat(level - 1);
            const anchor = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return `${indent}- [${text}](#${anchor})`;
          }).join('\n');
          content = `## Table of Contents\n\n${toc}\n\n---\n\n${content}`;
        }
      }

      this.logTemplateUsage(templateId, template.framework);

      return {
        success: true,
        templateId,
        content,
        metadata: {
          generatedAt: new Date().toISOString(),
          version,
          framework: template.framework,
          documentType: template.documentType,
          wordCount,
          sectionCount
        },
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }

    this.logTemplateUsage(templateId, template.framework);

    return {
      success: true,
      templateId,
      content,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  // Query templates with Zod-validated filters
  static queryTemplates(query: unknown): DocumentTemplate[] {
    const queryValidation = templateListQuerySchema.safeParse(query);
    if (!queryValidation.success) {
      logger.warn('Invalid template query', { errors: queryValidation.error.issues });
      return [];
    }

    const { framework, category, documentType, requiredOnly, sortBy, sortOrder } = queryValidation.data;

    let templates: DocumentTemplate[] = [];

    if (framework) {
      templates = this.getTemplatesByFramework(framework);
    } else {
      templates = this.getAllTemplates();
    }

    // Apply filters
    if (category) {
      templates = templates.filter(t => t.category === category);
    }
    if (documentType) {
      templates = templates.filter(t => t.documentType === documentType);
    }
    if (requiredOnly) {
      templates = templates.filter(t => t.required);
    }

    // Sort results
    templates.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'priority':
        default:
          comparison = a.priority - b.priority;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return templates;
  }

  // Validate a template structure (for custom templates)
  static validateTemplate(template: unknown): {
    valid: boolean;
    errors: Array<{ path: string; message: string }>;
  } {
    return validateTemplateStructure(template);
  }

  // Get variable schema for a template (for frontend form generation)
  static getTemplateVariableSchema(templateId: string): {
    schema: z.ZodObject<any> | null;
    variables: Record<string, SimpleTemplateVariableConfig>;
  } {
    const template = this.getTemplateById(templateId);
    if (!template) {
      return { schema: null, variables: {} };
    }

    const schema = createDynamicVariableSchema(
      template.templateVariables as Record<string, SimpleTemplateVariableConfig>
    );

    return {
      schema,
      variables: template.templateVariables as Record<string, SimpleTemplateVariableConfig>
    };
  }
}
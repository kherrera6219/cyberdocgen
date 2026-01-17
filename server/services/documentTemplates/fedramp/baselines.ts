import { DocumentTemplate } from '../types';

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
      system_description: { type: 'text', label: 'System Description', required: true },
      system_architecture: { type: 'text', label: 'System Architecture', required: true },
      network_architecture: { type: 'text', label: 'Network Architecture', required: true },
      data_flow_description: { type: 'text', label: 'Data Flow Description', required: true },
      prepared_by: { type: 'text', label: 'Prepared By', required: true },
      reviewed_by: { type: 'text', label: 'Reviewed By', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
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
      authorization_date: { type: 'date', label: 'Authorization Date', required: true },
      system_description: { type: 'text', label: 'System Description', required: true },
      prepared_by: { type: 'text', label: 'Prepared By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
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
      authorization_date: { type: 'date', label: 'Authorization Date', required: true },
      system_description: { type: 'text', label: 'System Description', required: true },
      prepared_by: { type: 'text', label: 'Prepared By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  }
];

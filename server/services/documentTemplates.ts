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

// SOC 2 Type 2 - Complete Trust Services Criteria (AICPA 2017 with 2022 Points of Focus)
export const SOC2Templates: DocumentTemplate[] = [
  {
    id: 'soc2-001',
    title: 'SOC 2 Trust Services Criteria Overview',
    description: 'Comprehensive Trust Services Criteria framework (AICPA 2017 TSC with 2022 Revised Points of Focus)',
    framework: 'SOC2',
    category: 'framework',
    priority: 1,
    documentType: 'framework',
    required: true,
    templateContent: `# SOC 2 Trust Services Criteria Framework

## 1. Introduction
{{company_name}} has implemented controls aligned with the AICPA 2017 Trust Services Criteria (with 2022 Revised Points of Focus) to demonstrate the security, availability, processing integrity, confidentiality, and privacy of our systems.

## 2. Trust Services Categories

### 2.1 Security (Common Criteria) - MANDATORY
The foundational criteria required for all SOC 2 audits, organized into 9 control areas:

| Area | Name | Description |
|------|------|-------------|
| CC1 | Control Environment | Governance, integrity, ethics, and organizational structure |
| CC2 | Communication and Information | Internal/external communication and information quality |
| CC3 | Risk Assessment | Risk identification, analysis, and fraud considerations |
| CC4 | Monitoring Activities | Ongoing evaluations and deficiency remediation |
| CC5 | Control Activities | Policies, procedures, and technology controls |
| CC6 | Logical and Physical Access Controls | Authentication, authorization, and physical security |
| CC7 | System Operations | Incident detection, response, and recovery |
| CC8 | Change Management | Infrastructure and software change control |
| CC9 | Risk Mitigation | Vendor management and business disruption mitigation |

### 2.2 Availability (A) - OPTIONAL
System availability for operation and use as committed.

### 2.3 Processing Integrity (PI) - OPTIONAL
System processing is complete, valid, accurate, timely, and authorized.

### 2.4 Confidentiality (C) - OPTIONAL
Information designated as confidential is protected.

### 2.5 Privacy (P) - OPTIONAL
Personal information collection, use, retention, disclosure, and disposal.

## 3. Selected Trust Services Categories
{{selected_categories}}

## 4. Audit Scope
- **Type**: SOC 2 Type {{audit_type}}
- **Audit Period**: {{audit_period}}
- **Systems in Scope**: {{systems_in_scope}}

**Document Owner:** {{document_owner}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      selected_categories: { type: 'text', label: 'Selected Trust Services Categories', required: true },
      audit_type: { type: 'select', label: 'Audit Type', required: true, options: ['1', '2'] },
      audit_period: { type: 'text', label: 'Audit Period', required: true },
      systems_in_scope: { type: 'text', label: 'Systems in Scope', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'soc2-002',
    title: 'CC1 Control Environment Policy',
    description: 'Control Environment criteria covering governance, ethics, oversight, and organizational structure',
    framework: 'SOC2',
    category: 'CC1-Control-Environment',
    priority: 2,
    documentType: 'policy',
    required: true,
    templateContent: `# CC1: Control Environment Policy

## 1. Purpose
This policy establishes {{company_name}}'s control environment framework per SOC 2 CC1 criteria.

## 2. CC1 Control Criteria

### CC1.1 - COSO Principle 1: Commitment to Integrity and Ethics
- Code of conduct established and communicated
- Ethics training for all personnel
- Whistleblower program in place
- Regular ethics assessments

### CC1.2 - COSO Principle 2: Board Oversight
- Board/Audit Committee exercises oversight responsibility
- Regular security briefings to leadership
- Independent directors where applicable

### CC1.3 - COSO Principle 3: Authority and Responsibility
- Organizational structure documented
- Clear reporting lines established
- Security roles and responsibilities defined:
  - **CISO/Security Officer**: {{ciso_name}}
  - **Compliance Officer**: {{compliance_officer}}
  - **IT Manager**: {{it_manager}}

### CC1.4 - COSO Principle 4: Commitment to Competence
- Competency requirements for security roles
- Background checks for personnel
- Skills assessment and training programs
- Performance evaluations include security responsibilities

### CC1.5 - COSO Principle 5: Accountability
- Accountability for control objectives
- Performance measures established
- Incentives aligned with security goals
- Consequences for policy violations

## 3. Implementation Evidence
- Code of conduct acknowledgments
- Organization charts
- Role descriptions
- Training completion records
- Background check documentation

**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      ciso_name: { type: 'text', label: 'CISO/Security Officer Name', required: true },
      compliance_officer: { type: 'text', label: 'Compliance Officer Name', required: true },
      it_manager: { type: 'text', label: 'IT Manager Name', required: false },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'soc2-003',
    title: 'CC6 Logical and Physical Access Controls',
    description: 'Access control criteria covering authentication, authorization, and physical security (CC6.1-CC6.8)',
    framework: 'SOC2',
    category: 'CC6-Access-Controls',
    priority: 3,
    documentType: 'policy',
    required: true,
    templateContent: `# CC6: Logical and Physical Access Controls

## 1. Overview
{{company_name}} implements comprehensive access controls per SOC 2 CC6 criteria.

## 2. CC6 Control Criteria

### CC6.1 - Logical Access Security Software
- Access control software implemented
- Authentication mechanisms: {{authentication_methods}}
- Authorization based on roles and responsibilities
- Access provisioning through formal request process

### CC6.2 - User Registration and Authorization
- Formal user registration process
- Access based on job responsibilities
- Approval workflow for access requests
- Regular access reviews: {{access_review_frequency}}

### CC6.3 - User Removal
- Timely removal of access upon termination
- Access modification upon role change
- Emergency access revocation procedures
- Exit interview includes access surrender

### CC6.4 - Authentication Credentials
- Strong password requirements enforced
- Multi-factor authentication: {{mfa_implementation}}
- Credential storage and protection
- Password reset procedures

### CC6.5 - Access Restriction
- Least privilege principle applied
- Role-based access control (RBAC)
- Privileged access management
- Service account controls

### CC6.6 - External Access
- Remote access security controls
- VPN requirements: {{vpn_solution}}
- Third-party access controls
- Customer access management

### CC6.7 - Physical Access Restrictions
- Data center physical security
- Visitor management procedures
- Badge access systems
- Video surveillance

### CC6.8 - Physical Access Removal
- Badge deactivation upon termination
- Physical key return procedures
- Access log retention

## 3. Implementation Details
- Identity Provider: {{identity_provider}}
- MFA Provider: {{mfa_provider}}
- Access Review Tool: {{access_review_tool}}

**Document Owner:** {{document_owner}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      authentication_methods: { type: 'text', label: 'Authentication Methods', required: true },
      access_review_frequency: { type: 'select', label: 'Access Review Frequency', required: true, options: ['Monthly', 'Quarterly', 'Semi-annually', 'Annually'] },
      mfa_implementation: { type: 'text', label: 'MFA Implementation Details', required: true },
      vpn_solution: { type: 'text', label: 'VPN Solution', required: false },
      identity_provider: { type: 'text', label: 'Identity Provider', required: true },
      mfa_provider: { type: 'text', label: 'MFA Provider', required: true },
      access_review_tool: { type: 'text', label: 'Access Review Tool', required: false },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'soc2-004',
    title: 'CC7 System Operations',
    description: 'System operations covering incident detection, response, and recovery (CC7.1-CC7.5)',
    framework: 'SOC2',
    category: 'CC7-System-Operations',
    priority: 4,
    documentType: 'procedure',
    required: true,
    templateContent: `# CC7: System Operations

## 1. Purpose
This document outlines {{company_name}}'s system operations controls per SOC 2 CC7 criteria.

## 2. CC7 Control Criteria

### CC7.1 - Infrastructure and Software Detection
- Infrastructure monitoring in place
- Security event logging enabled
- SIEM Solution: {{siem_solution}}
- Endpoint Protection: {{endpoint_protection}}
- Vulnerability scanning: {{vulnerability_scan_frequency}}

### CC7.2 - Security Event Monitoring
- 24/7 monitoring capabilities
- Alerting thresholds configured
- Anomaly detection implemented
- Log aggregation and correlation

### CC7.3 - Security Incident Evaluation
- Incident classification criteria
- Severity levels defined (Critical, High, Medium, Low)
- Escalation procedures documented
- Root cause analysis process

### CC7.4 - Security Incident Response
- Incident response plan documented
- Response team identified and trained
- Communication protocols established
- Evidence preservation procedures
- Mean Time to Respond (MTTR): {{target_mttr}}

### CC7.5 - Recovery Operations
- Recovery procedures documented
- Recovery Time Objective (RTO): {{rto_hours}} hours
- Recovery Point Objective (RPO): {{rpo_hours}} hours
- Backup verification testing
- Business continuity integration

## 3. Monitoring Infrastructure
| Component | Solution | Coverage |
|-----------|----------|----------|
| SIEM | {{siem_solution}} | All production systems |
| Endpoint | {{endpoint_protection}} | All endpoints |
| Network | {{network_monitoring}} | All network segments |
| Cloud | {{cloud_monitoring}} | All cloud resources |

## 4. Incident Response Contacts
- Security Team Lead: {{security_lead}}
- On-call Rotation: {{oncall_info}}

**Document Owner:** {{document_owner}}
**Last Updated:** {{last_updated}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      siem_solution: { type: 'text', label: 'SIEM Solution', required: true },
      endpoint_protection: { type: 'text', label: 'Endpoint Protection', required: true },
      vulnerability_scan_frequency: { type: 'select', label: 'Vulnerability Scan Frequency', required: true, options: ['Weekly', 'Monthly', 'Quarterly'] },
      target_mttr: { type: 'text', label: 'Target Mean Time to Respond', required: true },
      rto_hours: { type: 'number', label: 'Recovery Time Objective (hours)', required: true },
      rpo_hours: { type: 'number', label: 'Recovery Point Objective (hours)', required: true },
      network_monitoring: { type: 'text', label: 'Network Monitoring Solution', required: false },
      cloud_monitoring: { type: 'text', label: 'Cloud Monitoring Solution', required: false },
      security_lead: { type: 'text', label: 'Security Team Lead', required: true },
      oncall_info: { type: 'text', label: 'On-call Information', required: false },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      last_updated: { type: 'date', label: 'Last Updated', required: true }
    }
  },
  {
    id: 'soc2-005',
    title: 'CC8 Change Management',
    description: 'Change management controls for infrastructure and software changes (CC8.1)',
    framework: 'SOC2',
    category: 'CC8-Change-Management',
    priority: 5,
    documentType: 'procedure',
    required: true,
    templateContent: `# CC8: Change Management

## 1. Purpose
This procedure establishes {{company_name}}'s change management controls per SOC 2 CC8 criteria.

## 2. CC8.1 - Change Management Controls

### 2.1 Change Request Process
1. Change request submission with business justification
2. Impact and risk assessment
3. Approval workflow based on change type
4. Implementation scheduling
5. Testing and validation
6. Documentation and communication

### 2.2 Change Classification
| Type | Description | Approval Required |
|------|-------------|-------------------|
| Standard | Pre-approved, low-risk changes | Automated/Team Lead |
| Normal | Assessed changes requiring CAB review | Change Advisory Board |
| Emergency | Critical changes addressing incidents | Emergency CAB + Post-review |

### 2.3 Change Approval Requirements
- Development team review and testing
- Security impact assessment for security-relevant changes
- Manager approval for normal changes
- CAB approval for significant infrastructure changes
- Emergency approval process for critical fixes

### 2.4 Testing Requirements
- Unit testing in development environment
- Integration testing in staging
- User acceptance testing (UAT) where applicable
- Rollback testing for critical changes
- Security testing for code changes

### 2.5 Deployment Controls
- Separation of duties between development and production
- Deployment automation: {{deployment_tool}}
- Production access restricted to {{production_access_team}}
- Change window: {{change_window}}
- Rollback procedures documented

### 2.6 Post-Implementation Review
- Change success validation
- Issue documentation
- Lessons learned capture
- Configuration management update

## 3. Change Management Tools
- Ticketing System: {{ticketing_system}}
- Version Control: {{version_control}}
- CI/CD Platform: {{cicd_platform}}

**Document Owner:** {{document_owner}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      deployment_tool: { type: 'text', label: 'Deployment Tool/Platform', required: true },
      production_access_team: { type: 'text', label: 'Production Access Team', required: true },
      change_window: { type: 'text', label: 'Standard Change Window', required: true },
      ticketing_system: { type: 'text', label: 'Ticketing System', required: true },
      version_control: { type: 'text', label: 'Version Control System', required: true },
      cicd_platform: { type: 'text', label: 'CI/CD Platform', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'soc2-006',
    title: 'Availability Criteria (A1)',
    description: 'Availability controls ensuring system uptime commitments (A1.1-A1.3)',
    framework: 'SOC2',
    category: 'A-Availability',
    priority: 6,
    documentType: 'policy',
    required: false,
    templateContent: `# Availability Criteria (A1)

## 1. Purpose
{{company_name}} commits to maintaining system availability as defined in service level agreements.

## 2. A1 Availability Criteria

### A1.1 - Availability Commitments
- Service Level Agreement (SLA): {{sla_uptime}}% uptime
- Availability monitoring in place
- Capacity planning process established
- Performance baselines documented

### A1.2 - Environmental Protections
- Data center redundancy: {{datacenter_redundancy}}
- Power backup systems (UPS, generators)
- Environmental controls (HVAC, fire suppression)
- Network redundancy and failover

### A1.3 - Recovery Operations
- Disaster Recovery Plan documented
- Business Continuity Plan maintained
- Recovery testing frequency: {{dr_test_frequency}}
- Last DR test: {{last_dr_test}}
- RTO: {{rto_hours}} hours | RPO: {{rpo_hours}} hours

## 3. SLA Commitments
| Service | Availability Target | Support Hours |
|---------|--------------------|--------------
| Production Systems | {{sla_uptime}}% | {{support_hours}} |
| API Services | {{api_sla}}% | 24/7 |

## 4. Maintenance Windows
- Scheduled maintenance: {{maintenance_window}}
- Customer notification: {{notification_period}} advance notice
- Emergency maintenance procedures documented

**Document Owner:** {{document_owner}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      sla_uptime: { type: 'text', label: 'SLA Uptime Percentage', required: true },
      datacenter_redundancy: { type: 'text', label: 'Data Center Redundancy Details', required: true },
      dr_test_frequency: { type: 'select', label: 'DR Test Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] },
      last_dr_test: { type: 'date', label: 'Last DR Test Date', required: true },
      rto_hours: { type: 'number', label: 'Recovery Time Objective (hours)', required: true },
      rpo_hours: { type: 'number', label: 'Recovery Point Objective (hours)', required: true },
      support_hours: { type: 'text', label: 'Support Hours', required: true },
      api_sla: { type: 'text', label: 'API SLA Percentage', required: false },
      maintenance_window: { type: 'text', label: 'Scheduled Maintenance Window', required: true },
      notification_period: { type: 'text', label: 'Maintenance Notification Period', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'soc2-007',
    title: 'Confidentiality Criteria (C1)',
    description: 'Confidentiality controls for protecting sensitive information (C1.1-C1.2)',
    framework: 'SOC2',
    category: 'C-Confidentiality',
    priority: 7,
    documentType: 'policy',
    required: false,
    templateContent: `# Confidentiality Criteria (C1)

## 1. Purpose
{{company_name}} protects confidential information throughout its lifecycle.

## 2. C1 Confidentiality Criteria

### C1.1 - Confidential Information Identification
- Data classification scheme:
  - **Public**: Information freely available
  - **Internal**: For internal use only
  - **Confidential**: Sensitive business information
  - **Restricted**: Highly sensitive, limited access
  
- Confidential information types:
  - Customer data
  - Financial information
  - Intellectual property
  - Trade secrets
  - {{additional_confidential_types}}

### C1.2 - Confidential Information Disposal
- Secure deletion procedures
- Media sanitization standards (NIST 800-88)
- Data retention periods: {{retention_period}}
- Disposal documentation and verification

## 3. Encryption Controls
| Data State | Encryption Standard |
|------------|-------------------|
| At Rest | {{encryption_at_rest}} |
| In Transit | {{encryption_in_transit}} |
| In Use | {{encryption_in_use}} |

## 4. Access Controls
- Need-to-know access principle
- Confidential data access logged
- Annual access reviews for confidential systems
- DLP controls: {{dlp_solution}}

## 5. Third-Party Confidentiality
- NDAs required for vendors with data access
- Vendor security assessments
- Contract confidentiality provisions

**Document Owner:** {{document_owner}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      additional_confidential_types: { type: 'text', label: 'Additional Confidential Data Types', required: false },
      retention_period: { type: 'text', label: 'Default Data Retention Period', required: true },
      encryption_at_rest: { type: 'text', label: 'Encryption at Rest Standard', required: true },
      encryption_in_transit: { type: 'text', label: 'Encryption in Transit Standard', required: true },
      encryption_in_use: { type: 'text', label: 'Encryption in Use (if applicable)', required: false },
      dlp_solution: { type: 'text', label: 'DLP Solution', required: false },
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

// ================================================================================
// COMPLETE ISO 27001:2022 MANDATORY DOCUMENTS - Extended Templates
// ================================================================================
export const ExtendedISO27001Templates: DocumentTemplate[] = [
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
  }
];

// ================================================================================
// COMPLETE SOC 2 COMMON CRITERIA TEMPLATES - CC2, CC3, CC4, CC5, CC9
// ================================================================================
export const ExtendedSOC2Templates: DocumentTemplate[] = [
  {
    id: 'soc2-cc2',
    title: 'CC2 Communication and Information',
    description: 'Information and communication controls (CC2.1-CC2.3)',
    framework: 'SOC2',
    category: 'CC2-Communication',
    priority: 2,
    documentType: 'procedure',
    required: true,
    templateContent: `# CC2: Communication and Information

## 1. Purpose
This document outlines {{company_name}}'s controls for internal and external communication per SOC 2 CC2 criteria.

## 2. CC2 Control Criteria

### CC2.1 - COSO Principle 13: Quality Information
{{company_name}} generates and uses relevant, quality information to support the functioning of internal control.

**Controls:**
- Information classification scheme: {{classification_scheme}}
- Data quality procedures: {{quality_procedures}}
- Information accuracy validation
- Timeliness requirements

### CC2.2 - COSO Principle 14: Internal Communication
{{company_name}} internally communicates information, including objectives and responsibilities for internal control, necessary to support the functioning of internal control.

**Controls:**
- Security policy communication: {{policy_distribution}}
- Awareness training program: {{training_program}}
- Internal reporting channels
- Team communication protocols

### CC2.3 - COSO Principle 15: External Communication
{{company_name}} communicates with external parties regarding matters affecting the functioning of internal control.

**Controls:**
- Customer communication: {{customer_comm}}
- Vendor security requirements: {{vendor_requirements}}
- Regulatory reporting: {{regulatory_reporting}}
- Incident notification procedures

## 3. Communication Channels

| Channel | Purpose | Owner | Frequency |
|---------|---------|-------|-----------|
| Security Newsletter | Awareness | {{newsletter_owner}} | {{newsletter_freq}} |
| Policy Updates | Compliance | {{policy_owner}} | As needed |
| Incident Alerts | Response | {{incident_owner}} | As needed |
| Vendor Notifications | Third-party | {{vendor_owner}} | As required |

## 4. Implementation Details
- Communication Platform: {{comm_platform}}
- Document Repository: {{doc_repository}}
- Training System: {{training_system}}

**Document Owner:** {{document_owner}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      classification_scheme: { type: 'text', label: 'Classification Scheme', required: true },
      quality_procedures: { type: 'text', label: 'Data Quality Procedures', required: true },
      policy_distribution: { type: 'text', label: 'Policy Distribution Method', required: true },
      training_program: { type: 'text', label: 'Training Program', required: true },
      customer_comm: { type: 'text', label: 'Customer Communication Method', required: true },
      vendor_requirements: { type: 'text', label: 'Vendor Security Requirements', required: true },
      comm_platform: { type: 'text', label: 'Communication Platform', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'soc2-cc3',
    title: 'CC3 Risk Assessment',
    description: 'Risk identification and assessment controls (CC3.1-CC3.4)',
    framework: 'SOC2',
    category: 'CC3-Risk-Assessment',
    priority: 3,
    documentType: 'procedure',
    required: true,
    templateContent: `# CC3: Risk Assessment

## 1. Purpose
This document outlines {{company_name}}'s risk assessment controls per SOC 2 CC3 criteria.

## 2. CC3 Control Criteria

### CC3.1 - COSO Principle 6: Specify Objectives
{{company_name}} specifies objectives with sufficient clarity to enable the identification and assessment of risks.

**Controls:**
- Security objectives documented: {{objectives_document}}
- Objectives aligned with business strategy
- Measurable security metrics defined

### CC3.2 - COSO Principle 7: Identify and Analyze Risks
{{company_name}} identifies risks to the achievement of its objectives and analyzes risks as a basis for determining how the risks should be managed.

**Controls:**
- Risk assessment methodology: {{risk_methodology}}
- Risk register maintained: {{risk_register}}
- Risk assessment frequency: {{assessment_frequency}}
- Threat intelligence integration

### CC3.3 - COSO Principle 8: Assess Fraud Risk
{{company_name}} considers the potential for fraud in assessing risks.

**Controls:**
- Fraud risk assessment conducted
- Unauthorized access risks identified
- Data manipulation risks assessed
- Insider threat considerations

### CC3.4 - COSO Principle 9: Identify Significant Changes
{{company_name}} identifies and assesses changes that could significantly impact the system of internal control.

**Controls:**
- Change impact assessment: {{change_assessment}}
- New vendor risk assessment
- Technology change evaluation
- Regulatory change monitoring

## 3. Risk Assessment Process

### 3.1 Risk Identification
- Asset inventory review
- Threat landscape analysis
- Vulnerability scanning: {{vuln_scanning}}
- Control gap analysis

### 3.2 Risk Analysis
- Likelihood assessment: {{likelihood_scale}}
- Impact assessment: {{impact_scale}}
- Risk scoring methodology

### 3.3 Risk Evaluation
- Risk appetite: {{risk_appetite}}
- Acceptable risk levels
- Treatment prioritization

## 4. Risk Reporting
- Risk dashboard updates: {{dashboard_updates}}
- Management reporting: {{mgmt_reporting}}
- Board reporting: {{board_reporting}}

**Risk Manager:** {{risk_manager}}
**Document Owner:** {{document_owner}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      objectives_document: { type: 'text', label: 'Security Objectives Document', required: true },
      risk_methodology: { type: 'select', label: 'Risk Methodology', required: true, options: ['NIST RMF', 'ISO 27005', 'FAIR', 'Custom'] },
      risk_register: { type: 'text', label: 'Risk Register Location', required: true },
      assessment_frequency: { type: 'select', label: 'Assessment Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] },
      vuln_scanning: { type: 'select', label: 'Vulnerability Scanning', required: true, options: ['Continuous', 'Weekly', 'Monthly', 'Quarterly'] },
      likelihood_scale: { type: 'select', label: 'Likelihood Scale', required: true, options: ['3-Point', '5-Point', 'Percentage'] },
      impact_scale: { type: 'select', label: 'Impact Scale', required: true, options: ['3-Point', '5-Point', 'Dollar Value'] },
      risk_appetite: { type: 'select', label: 'Risk Appetite', required: true, options: ['Low', 'Medium', 'High'] },
      risk_manager: { type: 'text', label: 'Risk Manager', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'soc2-cc4',
    title: 'CC4 Monitoring Activities',
    description: 'Ongoing and separate evaluations (CC4.1-CC4.2)',
    framework: 'SOC2',
    category: 'CC4-Monitoring',
    priority: 4,
    documentType: 'procedure',
    required: true,
    templateContent: `# CC4: Monitoring Activities

## 1. Purpose
This document outlines {{company_name}}'s monitoring controls per SOC 2 CC4 criteria.

## 2. CC4 Control Criteria

### CC4.1 - COSO Principle 16: Ongoing and Separate Evaluations
{{company_name}} selects, develops, and performs ongoing and/or separate evaluations to ascertain whether components of internal control are present and functioning.

**Ongoing Evaluations:**
- Real-time security monitoring: {{siem_tool}}
- Automated control testing
- Continuous compliance monitoring
- Performance metrics tracking

**Separate Evaluations:**
- Internal audits: {{audit_frequency}}
- External assessments: {{external_assessments}}
- Penetration testing: {{pentest_frequency}}
- Third-party audits: SOC 2 Type II

### CC4.2 - COSO Principle 17: Evaluate and Communicate Deficiencies
{{company_name}} evaluates and communicates internal control deficiencies in a timely manner to those parties responsible for taking corrective action.

**Controls:**
- Deficiency identification process
- Severity classification: {{severity_levels}}
- Escalation procedures
- Remediation tracking: {{remediation_tracking}}

## 3. Monitoring Infrastructure

### 3.1 Security Monitoring
| System | Tool | Coverage | Retention |
|--------|------|----------|-----------|
| SIEM | {{siem_tool}} | All systems | {{log_retention}} |
| EDR | {{edr_tool}} | Endpoints | 90 days |
| CASB | {{casb_tool}} | Cloud apps | 90 days |
| DLP | {{dlp_tool}} | Data flows | 90 days |

### 3.2 Alerting Thresholds
- Critical: Immediate notification
- High: {{high_alert_time}} response
- Medium: {{medium_alert_time}} response
- Low: {{low_alert_time}} response

## 4. Reporting and Metrics

### 4.1 Dashboards
- Security operations dashboard
- Compliance status dashboard
- Risk posture dashboard

### 4.2 Reporting Schedule
| Report | Audience | Frequency |
|--------|----------|-----------|
| Security Metrics | Security Team | Weekly |
| Compliance Status | Management | Monthly |
| Control Effectiveness | Board | Quarterly |

**SOC Manager:** {{soc_manager}}
**Document Owner:** {{document_owner}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      siem_tool: { type: 'text', label: 'SIEM Tool', required: true },
      audit_frequency: { type: 'select', label: 'Internal Audit Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] },
      external_assessments: { type: 'text', label: 'External Assessments', required: true },
      pentest_frequency: { type: 'select', label: 'Penetration Test Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] },
      severity_levels: { type: 'text', label: 'Severity Levels', required: true },
      remediation_tracking: { type: 'text', label: 'Remediation Tracking Tool', required: true },
      log_retention: { type: 'text', label: 'Log Retention Period', required: true },
      edr_tool: { type: 'text', label: 'EDR Tool', required: false },
      high_alert_time: { type: 'text', label: 'High Alert Response Time', required: true },
      medium_alert_time: { type: 'text', label: 'Medium Alert Response Time', required: true },
      low_alert_time: { type: 'text', label: 'Low Alert Response Time', required: true },
      soc_manager: { type: 'text', label: 'SOC Manager', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'soc2-cc5',
    title: 'CC5 Control Activities',
    description: 'Policies, procedures, and control deployment (CC5.1-CC5.3)',
    framework: 'SOC2',
    category: 'CC5-Control-Activities',
    priority: 5,
    documentType: 'procedure',
    required: true,
    templateContent: `# CC5: Control Activities

## 1. Purpose
This document outlines {{company_name}}'s control activities per SOC 2 CC5 criteria.

## 2. CC5 Control Criteria

### CC5.1 - COSO Principle 10: Select and Develop Control Activities
{{company_name}} selects and develops control activities that contribute to the mitigation of risks to the achievement of objectives to acceptable levels.

**Control Categories:**
- Preventive controls
- Detective controls
- Corrective controls
- Compensating controls

**Control Selection Criteria:**
- Risk-based prioritization
- Cost-benefit analysis
- Implementation feasibility
- Operational impact

### CC5.2 - COSO Principle 11: Technology General Controls
{{company_name}} also selects and develops general control activities over technology to support the achievement of objectives.

**IT General Controls:**
| Control Area | Controls | Owner |
|--------------|----------|-------|
| Access Management | {{access_controls}} | {{access_owner}} |
| Change Management | {{change_controls}} | {{change_owner}} |
| Operations | {{ops_controls}} | {{ops_owner}} |
| Security | {{security_controls}} | {{security_owner}} |

### CC5.3 - COSO Principle 12: Deploy Through Policies and Procedures
{{company_name}} deploys control activities through policies that establish what is expected and procedures that put policies into action.

**Policy Framework:**
- Information Security Policy
- Acceptable Use Policy
- Data Classification Policy
- Incident Response Policy
- Business Continuity Policy
- Vendor Management Policy

## 3. Control Implementation

### 3.1 Technical Controls
- Firewalls: {{firewall_solution}}
- IDS/IPS: {{ids_solution}}
- Encryption: {{encryption_standards}}
- Endpoint protection: {{endpoint_solution}}

### 3.2 Administrative Controls
- Security awareness training
- Background checks
- Confidentiality agreements
- Segregation of duties

### 3.3 Physical Controls
- Badge access systems
- CCTV surveillance
- Environmental controls
- Visitor management

## 4. Control Testing
- Testing frequency: {{testing_frequency}}
- Testing methodology: {{testing_methodology}}
- Results documentation
- Remediation tracking

**Control Owner:** {{control_owner}}
**Document Owner:** {{document_owner}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      access_controls: { type: 'text', label: 'Access Controls', required: true },
      access_owner: { type: 'text', label: 'Access Control Owner', required: true },
      change_controls: { type: 'text', label: 'Change Controls', required: true },
      change_owner: { type: 'text', label: 'Change Control Owner', required: true },
      ops_controls: { type: 'text', label: 'Operations Controls', required: true },
      ops_owner: { type: 'text', label: 'Operations Owner', required: true },
      security_controls: { type: 'text', label: 'Security Controls', required: true },
      security_owner: { type: 'text', label: 'Security Owner', required: true },
      firewall_solution: { type: 'text', label: 'Firewall Solution', required: true },
      ids_solution: { type: 'text', label: 'IDS/IPS Solution', required: false },
      encryption_standards: { type: 'text', label: 'Encryption Standards', required: true },
      endpoint_solution: { type: 'text', label: 'Endpoint Protection', required: true },
      testing_frequency: { type: 'select', label: 'Testing Frequency', required: true, options: ['Monthly', 'Quarterly', 'Semi-annually', 'Annually'] },
      testing_methodology: { type: 'text', label: 'Testing Methodology', required: true },
      control_owner: { type: 'text', label: 'Control Owner', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'soc2-cc9',
    title: 'CC9 Risk Mitigation',
    description: 'Vendor management and business disruption controls (CC9.1-CC9.2)',
    framework: 'SOC2',
    category: 'CC9-Risk-Mitigation',
    priority: 9,
    documentType: 'procedure',
    required: true,
    templateContent: `# CC9: Risk Mitigation

## 1. Purpose
This document outlines {{company_name}}'s risk mitigation controls per SOC 2 CC9 criteria.

## 2. CC9 Control Criteria

### CC9.1 - Vendor and Business Partner Risk
{{company_name}} identifies, selects, and develops risk mitigation activities arising from potential business disruptions.

**Business Continuity Controls:**
- Business impact analysis: {{bia_frequency}}
- Disaster recovery planning
- Backup and restoration procedures
- Crisis management protocols

**Key Metrics:**
- RTO: {{target_rto}} hours
- RPO: {{target_rpo}} hours
- Recovery testing: {{recovery_testing}}

### CC9.2 - Vendor and Business Partner Management
{{company_name}} assesses and manages risks associated with vendors and business partners.

**Vendor Risk Management:**

| Assessment Type | Frequency | Criteria |
|-----------------|-----------|----------|
| Initial assessment | Before onboarding | {{initial_criteria}} |
| Periodic review | {{review_frequency}} | {{review_criteria}} |
| Continuous monitoring | Ongoing | {{monitoring_criteria}} |

## 3. Vendor Risk Assessment

### 3.1 Risk Categorization
| Category | Description | Assessment Level |
|----------|-------------|------------------|
| Critical | {{critical_vendor_def}} | Enhanced due diligence |
| High | {{high_vendor_def}} | Standard assessment |
| Medium | {{medium_vendor_def}} | Basic assessment |
| Low | {{low_vendor_def}} | Self-attestation |

### 3.2 Assessment Requirements
- Security questionnaire: {{questionnaire_type}}
- SOC reports required: {{soc_requirements}}
- Penetration test results: For critical vendors
- On-site assessment: As needed

### 3.3 Contractual Requirements
- Data protection clauses
- Incident notification: {{incident_notification}} hours
- Right to audit
- Termination provisions
- Subcontractor requirements

## 4. Ongoing Vendor Monitoring
- Performance tracking
- Security incident monitoring
- Financial health monitoring
- Compliance status tracking

## 5. Third-Party Inventory
| Vendor | Category | Data Access | Last Review |
|--------|----------|-------------|-------------|
{{vendor_inventory_table}}

**Vendor Manager:** {{vendor_manager}}
**Document Owner:** {{document_owner}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      bia_frequency: { type: 'select', label: 'BIA Frequency', required: true, options: ['Annually', 'Bi-annually', 'After major changes'] },
      target_rto: { type: 'number', label: 'Target RTO (hours)', required: true },
      target_rpo: { type: 'number', label: 'Target RPO (hours)', required: true },
      recovery_testing: { type: 'select', label: 'Recovery Testing Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] },
      review_frequency: { type: 'select', label: 'Vendor Review Frequency', required: true, options: ['Annually', 'Semi-annually', 'Quarterly'] },
      critical_vendor_def: { type: 'text', label: 'Critical Vendor Definition', required: true },
      high_vendor_def: { type: 'text', label: 'High Risk Vendor Definition', required: true },
      questionnaire_type: { type: 'text', label: 'Security Questionnaire Type', required: true },
      soc_requirements: { type: 'text', label: 'SOC Report Requirements', required: true },
      incident_notification: { type: 'number', label: 'Incident Notification Hours', required: true },
      vendor_manager: { type: 'text', label: 'Vendor Manager', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  }
];

// ================================================================================
// FEDRAMP SSP ATTACHMENTS
// ================================================================================
export const FedRAMPAttachmentTemplates: DocumentTemplate[] = [
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
  }
];

// ================================================================================
// NIST 800-53 REV 5 CONTROL FAMILY TEMPLATES
// ================================================================================
export const NIST80053ControlFamilyTemplates: DocumentTemplate[] = [
  {
    id: 'nist-ac',
    title: 'Access Control (AC) Family',
    description: 'NIST 800-53 Rev 5 Access Control family documentation',
    framework: 'NIST-800-53',
    category: 'AC',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Access Control (AC) Family
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}

## AC-1 Policy and Procedures
{{company_name}} develops, documents, and disseminates access control policy and procedures.

**Policy Review:** {{policy_review_freq}}
**Procedure Review:** {{procedure_review_freq}}

## AC-2 Account Management
- Account types: {{account_types}}
- Approval authority: {{approval_authority}}
- Creation procedures documented
- Modification procedures documented
- Termination procedures documented
- Account review: {{account_review_freq}}

## AC-3 Access Enforcement
Access enforcement mechanisms:
- {{access_enforcement_mechanisms}}

## AC-4 Information Flow Enforcement
Information flow controls:
- {{flow_controls}}

## AC-5 Separation of Duties
Separation of duties for:
- {{sod_functions}}

## AC-6 Least Privilege
Least privilege implementation:
- Authorized access limited to minimum necessary
- Privileged access restricted
- Privileged functions audited

## AC-7 Unsuccessful Logon Attempts
- Maximum attempts: {{max_logon_attempts}}
- Lockout duration: {{lockout_duration}} minutes
- Automatic unlock: {{auto_unlock}}

## AC-8 System Use Notification
System use notification displayed before authentication.

## AC-11 Device Lock
- Inactivity timeout: {{inactivity_timeout}} minutes
- Pattern-hiding displays enabled

## AC-12 Session Termination
Sessions terminated after: {{session_timeout}} minutes of inactivity

## AC-17 Remote Access
Remote access controls:
- VPN required: {{vpn_required}}
- MFA required: {{mfa_required}}
- Authorized methods: {{remote_methods}}

## AC-18 Wireless Access
Wireless access controls documented.

## AC-19 Access Control for Mobile Devices
Mobile device management: {{mdm_solution}}

## AC-20 Use of External Systems
External system usage policies documented.

## AC-22 Publicly Accessible Content
Procedures for publicly accessible content review.

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      policy_review_freq: { type: 'select', label: 'Policy Review Frequency', required: true, options: ['Annually', 'Semi-annually', 'Quarterly'] },
      procedure_review_freq: { type: 'select', label: 'Procedure Review Frequency', required: true, options: ['Annually', 'Semi-annually', 'Quarterly'] },
      account_types: { type: 'text', label: 'Account Types', required: true },
      approval_authority: { type: 'text', label: 'Approval Authority', required: true },
      account_review_freq: { type: 'select', label: 'Account Review Frequency', required: true, options: ['Monthly', 'Quarterly', 'Semi-annually', 'Annually'] },
      max_logon_attempts: { type: 'number', label: 'Max Logon Attempts', required: true },
      lockout_duration: { type: 'number', label: 'Lockout Duration (minutes)', required: true },
      inactivity_timeout: { type: 'number', label: 'Inactivity Timeout (minutes)', required: true },
      session_timeout: { type: 'number', label: 'Session Timeout (minutes)', required: true },
      vpn_required: { type: 'select', label: 'VPN Required', required: true, options: ['Yes', 'No'] },
      mfa_required: { type: 'select', label: 'MFA Required', required: true, options: ['Yes', 'No'] },
      remote_methods: { type: 'text', label: 'Authorized Remote Methods', required: true },
      mdm_solution: { type: 'text', label: 'MDM Solution', required: false },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
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

// Master template registry with complete template sets including operational and certification templates
export const AllDocumentTemplates: Record<string, DocumentTemplate[]> = {
  'ISO27001': [...ISO27001Templates, ...AdditionalISO27001Templates, ...ExtendedISO27001Templates],
  'SOC2': [...SOC2Templates, ...ExtendedSOC2Templates],
  'FedRAMP-Low': FedRAMPLowTemplates,
  'FedRAMP-Moderate': [...FedRAMPModerateTemplates, ...FedRAMPAttachmentTemplates],
  'FedRAMP-High': FedRAMPHighTemplates,
  'NIST-800-53': [...NIST80053Templates, ...NIST80053ControlFamilyTemplates],
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
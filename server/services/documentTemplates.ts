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

// FedRAMP Core Required Documents
export const FedRAMPCoreTemplates: DocumentTemplate[] = [
  {
    id: 'fedramp-rob',
    title: 'Rules of Behavior (RoB)',
    description: 'FedRAMP required Rules of Behavior for system users',
    framework: 'FedRAMP',
    category: 'policy',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Rules of Behavior (RoB)
## {{system_name}}

### System Information
**System Name:** {{system_name}}
**System Owner:** {{system_owner}}
**Effective Date:** {{effective_date}}

## 1. Purpose
These Rules of Behavior establish responsibilities and expected behavior for all users of {{system_name}}. All users must read, understand, and acknowledge these rules before being granted access.

## 2. Scope
These rules apply to:
- Federal employees
- Contractors
- Third-party users
- Anyone granted access to {{system_name}}

## 3. General Responsibilities

### 3.1 Authorized Use
Users are granted access solely for authorized government business purposes. Personal use is prohibited unless specifically authorized.

### 3.2 Account Security
- **Password Requirements:** {{password_requirements}}
- **MFA Required:** {{mfa_required}}
- **Account Sharing:** Strictly prohibited
- **Session Timeout:** {{session_timeout}} minutes

### 3.3 Data Handling
**Data Classification Levels:**
- Public
- Internal Use Only
- Sensitive
- Classified (if applicable)

**Handling Requirements:**
{{data_handling_requirements}}

## 4. Acceptable Use Policies

### 4.1 Permitted Activities
- Accessing information required for job duties
- Communication for business purposes
- Using approved software and tools
- {{additional_permitted_activities}}

### 4.2 Prohibited Activities
- Unauthorized access attempts
- Sharing credentials
- Installing unauthorized software
- Bypassing security controls
- Personal use of government resources
- Downloading/uploading unauthorized files
- Connecting unauthorized devices
- {{additional_prohibited_activities}}

## 5. Security Requirements

### 5.1 Physical Security
- Lock workstations when unattended
- Secure paper documents containing sensitive information
- Report lost/stolen devices immediately
- {{physical_security_requirements}}

### 5.2 Information Security
- Use encryption for sensitive data: {{encryption_requirements}}
- Report security incidents within {{incident_reporting_time}}
- Complete security awareness training: {{training_frequency}}
- Follow clean desk policy: {{clean_desk_policy}}

### 5.3 Remote Access
**Remote Access Requirements:**
- VPN required: {{vpn_required}}
- Approved devices only: {{approved_devices}}
- Secure network connections: {{secure_network_requirements}}

## 6. Monitoring and Privacy

**System Monitoring:**
Users have no expectation of privacy when using {{system_name}}. All activities may be monitored, recorded, and audited for:
- Security purposes
- Performance monitoring
- Compliance verification
- Investigation of policy violations

**Monitoring Includes:**
- Network traffic
- Email communications
- File access and transfers
- System commands
- Authentication attempts

## 7. Incident Reporting

**Report Immediately:**
- Suspected security incidents
- Lost or stolen devices
- Unauthorized access attempts
- Malware infections
- Data breaches
- Policy violations

**Reporting Contact:** {{incident_contact}}
**Reporting Method:** {{reporting_method}}

## 8. Consequences of Violations

Violations may result in:
- Access revocation
- Administrative action
- Disciplinary action
- Criminal prosecution
- Civil penalties

## 9. Privacy Act Statement

{{privacy_act_statement}}

## 10. User Acknowledgment

I acknowledge that I have read, understand, and agree to comply with these Rules of Behavior. I understand that violations may result in disciplinary action, including termination of access privileges and potential legal action.

**User Name:** _________________________________

**Signature:** _________________________________

**Date:** _________________________________

**Supervisor Approval:** _________________________________

**Effective Date:** {{effective_date}}
**Review Date:** {{review_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      system_owner: { type: 'text', label: 'System Owner', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true },
      password_requirements: { type: 'text', label: 'Password Requirements', required: true },
      mfa_required: { type: 'select', label: 'MFA Required', required: true, options: ['Yes', 'No'] },
      session_timeout: { type: 'number', label: 'Session Timeout (minutes)', required: true },
      data_handling_requirements: { type: 'text', label: 'Data Handling Requirements', required: true },
      encryption_requirements: { type: 'text', label: 'Encryption Requirements', required: true },
      incident_reporting_time: { type: 'text', label: 'Incident Reporting Time', required: true },
      training_frequency: { type: 'select', label: 'Training Frequency', required: true, options: ['Annually', 'Semi-annually', 'Upon hire'] },
      vpn_required: { type: 'select', label: 'VPN Required', required: true, options: ['Yes', 'No'] },
      incident_contact: { type: 'text', label: 'Incident Contact', required: true },
      reporting_method: { type: 'text', label: 'Reporting Method', required: true },
      privacy_act_statement: { type: 'text', label: 'Privacy Act Statement', required: true },
      review_date: { type: 'date', label: 'Review Date', required: true }
    }
  },
  {
    id: 'fedramp-iscp',
    title: 'Information System Contingency Plan (ISCP)',
    description: 'FedRAMP required contingency plan for system recovery',
    framework: 'FedRAMP',
    category: 'plan',
    priority: 1,
    documentType: 'plan',
    required: true,
    templateContent: `# Information System Contingency Plan (ISCP)
## {{system_name}}

### Document Information
**System Name:** {{system_name}}
**Impact Level:** {{impact_level}}
**Date:** {{plan_date}}
**Version:** {{version}}

## 1. Executive Summary
This Information System Contingency Plan provides procedures for recovery of {{system_name}} in the event of a system disruption or disaster.

**Recovery Objectives:**
- **Recovery Time Objective (RTO):** {{rto}}
- **Recovery Point Objective (RPO):** {{rpo}}
- **Maximum Tolerable Downtime (MTD):** {{mtd}}

## 2. System Overview

### 2.1 System Description
{{system_description}}

### 2.2 System Criticality
**Criticality Level:** {{criticality_level}}
**Business Impact:** {{business_impact}}

### 2.3 System Architecture
{{system_architecture}}

## 3. Contingency Planning Team

**Contingency Plan Coordinator:** {{coordinator_name}}
**Contact:** {{coordinator_contact}}

### 3.1 Team Members
| Role | Name | Contact | Responsibilities |
|------|------|---------|-----------------|
| Team Lead | {{team_lead}} | {{lead_contact}} | Overall coordination |
| Technical Lead | {{tech_lead}} | {{tech_contact}} | Technical recovery |
| Communications | {{comm_lead}} | {{comm_contact}} | Stakeholder communication |
| Security | {{security_lead}} | {{security_contact}} | Security verification |

## 4. Backup Procedures

### 4.1 Backup Strategy
**Backup Type:** {{backup_type}}
**Backup Frequency:** {{backup_frequency}}
**Backup Location:** {{backup_location}}
**Retention Period:** {{retention_period}}

### 4.2 Data Backup
- **User Data:** {{user_data_backup}}
- **System Data:** {{system_data_backup}}
- **Configuration:** {{config_backup}}
- **Databases:** {{database_backup}}

### 4.3 Backup Verification
**Testing Frequency:** {{backup_test_frequency}}
**Last Test Date:** {{last_test_date}}
**Next Test Date:** {{next_test_date}}

## 5. Alternate Processing Site

**Primary Site:** {{primary_site}}
**Alternate Site:** {{alternate_site}}
**Geographic Separation:** {{geo_separation}}

### 5.1 Alternate Site Capabilities
{{alternate_site_capabilities}}

### 5.2 Data Synchronization
**Synchronization Method:** {{sync_method}}
**Synchronization Frequency:** {{sync_frequency}}

## 6. Recovery Procedures

### 6.1 Activation and Notification

**Activation Criteria:**
{{activation_criteria}}

**Notification Procedure:**
1. Assess situation severity
2. Notify Contingency Plan Coordinator
3. Activate contingency team
4. Begin recovery procedures

**Notification List:**
{{notification_list}}

### 6.2 Recovery Steps

#### Phase 1: Assessment (0-2 hours)
1. Assess extent of disruption
2. Determine recovery approach
3. Activate contingency team
4. Notify stakeholders

#### Phase 2: Activation (2-8 hours)
1. Activate alternate processing site
2. Restore from backups
3. Verify data integrity
4. Test system functionality

#### Phase 3: Recovery (8-24 hours)
1. Restore full system operations
2. Verify all services operational
3. Monitor system performance
4. Document recovery actions

#### Phase 4: Reconstitution (24-72 hours)
1. Return to primary site (if applicable)
2. Validate full functionality
3. Resume normal operations
4. Conduct lessons learned

### 6.3 System Recovery Procedures
{{system_recovery_procedures}}

### 6.4 Application Recovery
{{application_recovery_procedures}}

### 6.5 Database Recovery
{{database_recovery_procedures}}

## 7. Testing and Exercises

### 7.1 Testing Schedule
**Tabletop Exercises:** {{tabletop_frequency}}
**Functional Tests:** {{functional_test_frequency}}
**Full Recovery Test:** {{full_test_frequency}}

### 7.2 Test Documentation
{{test_documentation_requirements}}

## 8. Plan Maintenance

**Review Frequency:** {{plan_review_frequency}}
**Update Triggers:**
- Significant system changes
- Organizational changes
- Test results
- Actual activation

**Last Review:** {{last_review_date}}
**Next Review:** {{next_review_date}}

## 9. Appendices

### Appendix A: Contact Lists
{{contact_lists}}

### Appendix B: System Inventory
{{system_inventory}}

### Appendix C: Vendor Contacts
{{vendor_contacts}}

### Appendix D: Recovery Forms
{{recovery_forms}}

## 10. Approval

**Prepared By:** {{prepared_by}}
**Reviewed By:** {{reviewed_by}}
**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      plan_date: { type: 'date', label: 'Plan Date', required: true },
      version: { type: 'text', label: 'Version', required: true },
      rto: { type: 'text', label: 'Recovery Time Objective (RTO)', required: true },
      rpo: { type: 'text', label: 'Recovery Point Objective (RPO)', required: true },
      mtd: { type: 'text', label: 'Maximum Tolerable Downtime (MTD)', required: true },
      system_description: { type: 'text', label: 'System Description', required: true },
      criticality_level: { type: 'select', label: 'Criticality Level', required: true, options: ['Mission Critical', 'Critical', 'Important', 'Non-Critical'] },
      coordinator_name: { type: 'text', label: 'Coordinator Name', required: true },
      coordinator_contact: { type: 'text', label: 'Coordinator Contact', required: true },
      backup_type: { type: 'select', label: 'Backup Type', required: true, options: ['Full', 'Incremental', 'Differential', 'Continuous'] },
      backup_frequency: { type: 'select', label: 'Backup Frequency', required: true, options: ['Real-time', 'Hourly', 'Daily', 'Weekly'] },
      backup_location: { type: 'text', label: 'Backup Location', required: true },
      alternate_site: { type: 'text', label: 'Alternate Processing Site', required: true },
      prepared_by: { type: 'text', label: 'Prepared By', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-cis',
    title: 'Control Implementation Summary (CIS)',
    description: 'FedRAMP Control Implementation Summary and customer responsibilities',
    framework: 'FedRAMP',
    category: 'assessment',
    priority: 1,
    documentType: 'standard',
    required: true,
    templateContent: `# Control Implementation Summary (CIS)
## {{system_name}}

### Document Information
**System Name:** {{system_name}}
**FedRAMP Baseline:** {{fedramp_baseline}}
**Date:** {{document_date}}
**Version:** {{version}}

## 1. Introduction
This Control Implementation Summary (CIS) provides a summary of how {{system_name}} implements FedRAMP security controls and identifies customer responsibilities.

## 2. Control Implementation Status

### Legend:
- **CSP** - Cloud Service Provider Responsibility
- **Customer** - Customer Responsibility
- **Shared** - Shared Responsibility
- **Inherited** - Inherited from infrastructure

## 3. Control Summary by Family

### 3.1 Access Control (AC) Family
| Control | Implementation Status | Responsibility | Implementation Summary |
|---------|----------------------|----------------|------------------------|
| AC-1 | Implemented | CSP | Access control policy maintained by CSP |
| AC-2 | Implemented | Shared | CSP manages infrastructure accounts; Customer manages application accounts |
| AC-3 | Implemented | Shared | {{ac3_implementation}} |
| AC-4 | Implemented | CSP | {{ac4_implementation}} |
| AC-5 | Implemented | Shared | {{ac5_implementation}} |
| AC-6 | Implemented | Shared | {{ac6_implementation}} |
| AC-7 | Implemented | Customer | {{ac7_implementation}} |
| AC-17 | Implemented | Shared | {{ac17_implementation}} |

### 3.2 Audit and Accountability (AU) Family
| Control | Implementation Status | Responsibility | Implementation Summary |
|---------|----------------------|----------------|------------------------|
| AU-1 | Implemented | CSP | Audit policy maintained by CSP |
| AU-2 | Implemented | Shared | {{au2_implementation}} |
| AU-3 | Implemented | CSP | {{au3_implementation}} |
| AU-6 | Implemented | Shared | {{au6_implementation}} |
| AU-9 | Implemented | CSP | {{au9_implementation}} |

### 3.3 Configuration Management (CM) Family
| Control | Implementation Status | Responsibility | Implementation Summary |
|---------|----------------------|----------------|------------------------|
| CM-1 | Implemented | CSP | Configuration management policy maintained by CSP |
| CM-2 | Implemented | Shared | {{cm2_implementation}} |
| CM-3 | Implemented | Shared | {{cm3_implementation}} |
| CM-6 | Implemented | Shared | {{cm6_implementation}} |
| CM-8 | Implemented | CSP | {{cm8_implementation}} |

### 3.4 Contingency Planning (CP) Family
| Control | Implementation Status | Responsibility | Implementation Summary |
|---------|----------------------|----------------|------------------------|
| CP-1 | Implemented | CSP | Contingency planning policy maintained by CSP |
| CP-2 | Implemented | Shared | {{cp2_implementation}} |
| CP-9 | Implemented | CSP | {{cp9_implementation}} |
| CP-10 | Implemented | CSP | {{cp10_implementation}} |

### 3.5 Identification and Authentication (IA) Family
| Control | Implementation Status | Responsibility | Implementation Summary |
|---------|----------------------|----------------|------------------------|
| IA-1 | Implemented | CSP | I&A policy maintained by CSP |
| IA-2 | Implemented | Shared | {{ia2_implementation}} |
| IA-5 | Implemented | Shared | {{ia5_implementation}} |

### 3.6 Incident Response (IR) Family
| Control | Implementation Status | Responsibility | Implementation Summary |
|---------|----------------------|----------------|------------------------|
| IR-1 | Implemented | CSP | Incident response policy maintained by CSP |
| IR-4 | Implemented | Shared | {{ir4_implementation}} |
| IR-6 | Implemented | Shared | {{ir6_implementation}} |

### 3.7 System and Communications Protection (SC) Family
| Control | Implementation Status | Responsibility | Implementation Summary |
|---------|----------------------|----------------|------------------------|
| SC-1 | Implemented | CSP | System protection policy maintained by CSP |
| SC-7 | Implemented | CSP | {{sc7_implementation}} |
| SC-8 | Implemented | CSP | {{sc8_implementation}} |
| SC-12 | Implemented | CSP | {{sc12_implementation}} |
| SC-13 | Implemented | CSP | {{sc13_implementation}} |

### 3.8 System and Information Integrity (SI) Family
| Control | Implementation Status | Responsibility | Implementation Summary |
|---------|----------------------|----------------|------------------------|
| SI-1 | Implemented | CSP | System integrity policy maintained by CSP |
| SI-2 | Implemented | Shared | {{si2_implementation}} |
| SI-3 | Implemented | Shared | {{si3_implementation}} |
| SI-4 | Implemented | CSP | {{si4_implementation}} |

## 4. Customer Responsibilities

### 4.1 Account Management
Customers are responsible for:
{{customer_account_responsibilities}}

### 4.2 Data Protection
Customers are responsible for:
{{customer_data_responsibilities}}

### 4.3 Application Security
Customers are responsible for:
{{customer_application_responsibilities}}

### 4.4 Compliance and Monitoring
Customers are responsible for:
{{customer_compliance_responsibilities}}

## 5. Shared Responsibilities

### 5.1 Security Monitoring
{{shared_monitoring}}

### 5.2 Incident Response
{{shared_incident_response}}

### 5.3 Patch Management
{{shared_patch_management}}

## 6. Inherited Controls

The following controls are fully inherited from the infrastructure provider:
{{inherited_controls}}

## 7. Implementation Notes

{{implementation_notes}}

## 8. Approval

**Prepared By:** {{prepared_by}}
**Reviewed By:** {{reviewed_by}}
**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      fedramp_baseline: { type: 'select', label: 'FedRAMP Baseline', required: true, options: ['Low', 'Moderate', 'High'] },
      document_date: { type: 'date', label: 'Document Date', required: true },
      version: { type: 'text', label: 'Version', required: true },
      customer_account_responsibilities: { type: 'text', label: 'Customer Account Responsibilities', required: true },
      customer_data_responsibilities: { type: 'text', label: 'Customer Data Responsibilities', required: true },
      prepared_by: { type: 'text', label: 'Prepared By', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-crm',
    title: 'Customer Responsibility Matrix (CRM)',
    description: 'FedRAMP Customer Responsibility Matrix defining CSP and customer responsibilities',
    framework: 'FedRAMP',
    category: 'assessment',
    priority: 1,
    documentType: 'standard',
    required: true,
    templateContent: `# Customer Responsibility Matrix (CRM)
## {{system_name}}

**FedRAMP Baseline:** {{fedramp_baseline}}
**Version:** {{version}}
**Date:** {{document_date}}

## 1. Responsibility Legend
- **CSP** - Cloud Service Provider responsible
- **Customer** - Customer responsible
- **Shared** - Shared responsibility
- **Inherited** - Customer inherits from CSP

## 2. Control Responsibilities Summary

Customer must understand their responsibilities for {{system_name}} security controls.

### Access Control
Customer responsible for: Application user management, role assignment, access reviews.
CSP responsible for: Infrastructure access, platform authentication, account provisioning.

### Audit and Accountability
Customer responsible for: Application audit configuration, log review.
CSP responsible for: Infrastructure logging, log retention, SIEM integration.

### Configuration Management
Customer responsible for: Application configuration, change management for custom code.
CSP responsible for: Platform configuration baselines, infrastructure change control.

**Customer Actions Required:** {{customer_actions}}

**CSP Services Provided:** {{csp_services}}

**Approval:** {{approved_by}} on {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      fedramp_baseline: { type: 'select', label: 'FedRAMP Baseline', required: true, options: ['Low', 'Moderate', 'High'] },
      version: { type: 'text', label: 'Version', required: true },
      document_date: { type: 'date', label: 'Document Date', required: true },
      customer_actions: { type: 'text', label: 'Customer Actions Required', required: true },
      csp_services: { type: 'text', label: 'CSP Services Provided', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-inventory',
    title: 'Integrated Inventory Workbook',
    description: 'FedRAMP integrated inventory of all system components',
    framework: 'FedRAMP',
    category: 'documentation',
    priority: 1,
    documentType: 'standard',
    required: true,
    templateContent: `# Integrated Inventory Workbook
## {{system_name}}

**Inventory Date:** {{inventory_date}}
**Version:** {{version}}

## 1. Inventory Summary
**Total Components:** {{total_components}}
**Update Frequency:** {{update_frequency}}

## 2. Hardware Inventory
| Asset Tag | Hostname | Type | Location | IP Address | OS | Status |
|-----------|----------|------|----------|------------|----|--------|
| {{asset_1}} | {{host_1}} | {{type_1}} | {{loc_1}} | {{ip_1}} | {{os_1}} | Active |

## 3. Software Inventory
| Application | Version | Vendor | Purpose | License |
|-------------|---------|--------|---------|---------|
| {{app_1}} | {{ver_1}} | {{vendor_1}} | {{purpose_1}} | {{license_1}} |

## 4. Network Devices
| Device | Model | Location | Firmware | Purpose |
|--------|-------|----------|----------|---------|
| {{device_1}} | {{model_1}} | {{location_1}} | {{fw_1}} | {{dev_purpose_1}} |

## 5. Cloud Services
| Service | Provider | Type | Region |
|---------|----------|------|--------|
| {{service_1}} | {{provider_1}} | {{svc_type_1}} | {{region_1}} |

**Last Audit:** {{last_audit}}
**Next Audit:** {{next_audit}}
**Approved By:** {{approved_by}} on {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      inventory_date: { type: 'date', label: 'Inventory Date', required: true },
      version: { type: 'text', label: 'Version', required: true },
      total_components: { type: 'number', label: 'Total Components', required: true },
      update_frequency: { type: 'select', label: 'Update Frequency', required: true, options: ['Real-time', 'Weekly', 'Monthly', 'Quarterly'] },
      last_audit: { type: 'date', label: 'Last Audit Date', required: true },
      next_audit: { type: 'date', label: 'Next Audit Date', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-crypto',
    title: 'Cryptographic Modules Table',
    description: 'FedRAMP cryptographic modules and FIPS 140-2/140-3 validation',
    framework: 'FedRAMP',
    category: 'security',
    priority: 1,
    documentType: 'standard',
    required: true,
    templateContent: `# Cryptographic Modules Table
## {{system_name}}

**Date:** {{document_date}}
**Version:** {{version}}

## 1. FIPS 140-2/140-3 Requirement
All cryptographic modules must be FIPS validated per FedRAMP requirements.

## 2. Cryptographic Modules Inventory

### 2.1 System Modules
| Module Name | Vendor | Purpose | FIPS Status | Certificate # | Level |
|-------------|--------|---------|-------------|---------------|-------|
| {{mod_1}} | {{vendor_1}} | {{purpose_1}} | {{fips_1}} | {{cert_1}} | {{level_1}} |

### 2.2 Application Modules
| Application | Crypto Module | FIPS Status | Certificate # | Algorithm |
|-------------|---------------|-------------|---------------|-----------|
| {{app_1}} | {{app_mod_1}} | {{app_fips_1}} | {{app_cert_1}} | {{algo_1}} |

## 3. Approved Algorithms
| Algorithm | Key Length | Use Case | FIPS Approved |
|-----------|------------|----------|---------------|
| AES | {{aes_length}} | Encryption | Yes |
| SHA-256 | 256-bit | Hashing | Yes |
| RSA | {{rsa_length}} | Signatures | Yes |

## 4. Key Management
**Key Generation:** {{key_gen}}
**Key Storage:** {{key_storage}}
**Key Rotation:** {{rotation_freq}}

## 5. TLS Configuration
**TLS Version:** {{tls_version}}
**Minimum Version:** {{min_tls}}
**Cipher Suites:** {{ciphers}}

**Last Review:** {{last_review}}
**Approved By:** {{approved_by}} on {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      document_date: { type: 'date', label: 'Document Date', required: true },
      version: { type: 'text', label: 'Version', required: true },
      aes_length: { type: 'select', label: 'AES Key Length', required: true, options: ['128-bit', '192-bit', '256-bit'] },
      rsa_length: { type: 'select', label: 'RSA Key Length', required: true, options: ['2048-bit', '3072-bit', '4096-bit'] },
      key_gen: { type: 'text', label: 'Key Generation Method', required: true },
      key_storage: { type: 'text', label: 'Key Storage Method', required: true },
      rotation_freq: { type: 'select', label: 'Rotation Frequency', required: true, options: ['Annually', 'Semi-annually', 'Quarterly'] },
      tls_version: { type: 'select', label: 'TLS Version', required: true, options: ['TLS 1.3', 'TLS 1.2'] },
      min_tls: { type: 'select', label: 'Minimum TLS', required: true, options: ['TLS 1.2', 'TLS 1.3'] },
      ciphers: { type: 'text', label: 'Cipher Suites', required: true },
      last_review: { type: 'date', label: 'Last FIPS Review', required: true },
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
  },
  {
    id: 'nist-002',
    title: 'Plan of Action and Milestones (POA&M)',
    description: 'Tracks security weaknesses and remediation plans (NIST 800-53 Rev 5)',
    framework: 'NIST-800-53',
    category: 'assessment',
    priority: 1,
    documentType: 'plan',
    required: true,
    templateContent: `# Plan of Action and Milestones (POA&M)
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}
**POA&M Date:** {{poam_date}}
**POA&M ID:** {{poam_id}}

## 1. Executive Summary
This POA&M identifies security weaknesses discovered during assessment of {{system_name}} and documents the planned remediation actions, resources, and milestones for addressing each weakness.

**Total Weaknesses Identified:** {{total_weaknesses}}
**Critical:** {{critical_count}} | **High:** {{high_count}} | **Moderate:** {{moderate_count}} | **Low:** {{low_count}}

## 2. POA&M Items

### Item 1: {{weakness_1_title}}
**Weakness ID:** {{weakness_1_id}}
**Control:** {{weakness_1_control}}
**Risk Level:** {{weakness_1_risk}}
**Status:** {{weakness_1_status}}

**Description:**
{{weakness_1_description}}

**Remediation Plan:**
{{weakness_1_remediation}}

**Resources Required:**
{{weakness_1_resources}}

**Milestones:**
- Milestone 1: {{weakness_1_milestone_1}} - Target: {{weakness_1_date_1}}
- Milestone 2: {{weakness_1_milestone_2}} - Target: {{weakness_1_date_2}}
- Milestone 3: {{weakness_1_milestone_3}} - Target: {{weakness_1_date_3}}

**Completion Date:** {{weakness_1_completion}}
**Point of Contact:** {{weakness_1_poc}}

---

### Item 2: {{weakness_2_title}}
**Weakness ID:** {{weakness_2_id}}
**Control:** {{weakness_2_control}}
**Risk Level:** {{weakness_2_risk}}
**Status:** {{weakness_2_status}}

**Description:**
{{weakness_2_description}}

**Remediation Plan:**
{{weakness_2_remediation}}

**Resources Required:**
{{weakness_2_resources}}

**Milestones:**
- Milestone 1: {{weakness_2_milestone_1}} - Target: {{weakness_2_date_1}}
- Milestone 2: {{weakness_2_milestone_2}} - Target: {{weakness_2_date_2}}

**Completion Date:** {{weakness_2_completion}}
**Point of Contact:** {{weakness_2_poc}}

---

## 3. Completion Tracking
POA&M items will be reviewed {{review_frequency}} and updated as remediation progresses.

**Next Review Date:** {{next_review_date}}
**Authorizing Official:** {{authorizing_official}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      poam_date: { type: 'date', label: 'POA&M Date', required: true },
      poam_id: { type: 'text', label: 'POA&M ID', required: true },
      total_weaknesses: { type: 'number', label: 'Total Weaknesses', required: true },
      critical_count: { type: 'number', label: 'Critical Count', required: false },
      high_count: { type: 'number', label: 'High Count', required: false },
      moderate_count: { type: 'number', label: 'Moderate Count', required: false },
      low_count: { type: 'number', label: 'Low Count', required: false },
      weakness_1_title: { type: 'text', label: 'Weakness 1 Title', required: false },
      weakness_1_id: { type: 'text', label: 'Weakness 1 ID', required: false },
      weakness_1_control: { type: 'text', label: 'Weakness 1 Control', required: false },
      weakness_1_risk: { type: 'select', label: 'Weakness 1 Risk Level', required: false, options: ['Critical', 'High', 'Moderate', 'Low'] },
      weakness_1_status: { type: 'select', label: 'Weakness 1 Status', required: false, options: ['Open', 'In Progress', 'Completed', 'Risk Accepted'] },
      weakness_1_description: { type: 'text', label: 'Weakness 1 Description', required: false },
      weakness_1_remediation: { type: 'text', label: 'Weakness 1 Remediation', required: false },
      weakness_1_resources: { type: 'text', label: 'Weakness 1 Resources', required: false },
      weakness_1_completion: { type: 'date', label: 'Weakness 1 Completion Date', required: false },
      weakness_1_poc: { type: 'text', label: 'Weakness 1 POC', required: false },
      review_frequency: { type: 'select', label: 'Review Frequency', required: true, options: ['Weekly', 'Monthly', 'Quarterly'] },
      next_review_date: { type: 'date', label: 'Next Review Date', required: true },
      authorizing_official: { type: 'text', label: 'Authorizing Official', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-003',
    title: 'Security Assessment Report (SAR)',
    description: 'Documents security control assessment results (NIST 800-53 Rev 5)',
    framework: 'NIST-800-53',
    category: 'assessment',
    priority: 1,
    documentType: 'report',
    required: true,
    templateContent: `# Security Assessment Report (SAR)
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}
**Assessment Date:** {{assessment_date}}
**Assessor:** {{assessor_name}}
**Assessment Type:** {{assessment_type}}

## 1. Executive Summary
This Security Assessment Report documents the assessment of security controls for {{system_name}} conducted in accordance with NIST SP 800-53A Rev 5 assessment procedures.

**Assessment Period:** {{assessment_start}} to {{assessment_end}}
**Overall Assessment Result:** {{overall_result}}

### Summary of Findings
- **Total Controls Assessed:** {{total_controls}}
- **Satisfied:** {{satisfied_count}}
- **Other than Satisfied:** {{other_than_satisfied}}
- **Not Applicable:** {{not_applicable}}

## 2. Assessment Methodology
**Assessment Methods Used:**
- Examine: {{examine_details}}
- Interview: {{interview_details}}
- Test: {{test_details}}

**Assessment Team:**
{{assessment_team}}

## 3. System Characterization
**System Description:** {{system_description}}
**System Boundaries:** {{system_boundaries}}
**Authorization Boundary:** {{auth_boundary}}

**System Components:**
{{system_components}}

**Security Impact Level:**
- Confidentiality: {{confidentiality_level}}
- Integrity: {{integrity_level}}
- Availability: {{availability_level}}

## 4. Control Assessment Results

### 4.1 Access Control (AC) Family
**Controls Assessed:** {{ac_controls_assessed}}
**Result:** {{ac_result}}
**Findings:** {{ac_findings}}

### 4.2 Audit and Accountability (AU) Family
**Controls Assessed:** {{au_controls_assessed}}
**Result:** {{au_result}}
**Findings:** {{au_findings}}

### 4.3 Contingency Planning (CP) Family
**Controls Assessed:** {{cp_controls_assessed}}
**Result:** {{cp_result}}
**Findings:** {{cp_findings}}

### 4.4 Identification and Authentication (IA) Family
**Controls Assessed:** {{ia_controls_assessed}}
**Result:** {{ia_result}}
**Findings:** {{ia_findings}}

### 4.5 Incident Response (IR) Family
**Controls Assessed:** {{ir_controls_assessed}}
**Result:** {{ir_result}}
**Findings:** {{ir_findings}}

### 4.6 System and Communications Protection (SC) Family
**Controls Assessed:** {{sc_controls_assessed}}
**Result:** {{sc_result}}
**Findings:** {{sc_findings}}

## 5. Risk Summary
**High Risk Items:** {{high_risk_count}}
{{high_risk_items}}

**Moderate Risk Items:** {{moderate_risk_count}}
{{moderate_risk_items}}

**Low Risk Items:** {{low_risk_count}}
{{low_risk_items}}

## 6. Recommendations
{{recommendations}}

## 7. Conclusion
{{conclusion}}

**Assessment Lead:** {{assessment_lead}}
**Authorizing Official:** {{authorizing_official}}
**Date:** {{report_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      assessment_date: { type: 'date', label: 'Assessment Date', required: true },
      assessor_name: { type: 'text', label: 'Assessor Name', required: true },
      assessment_type: { type: 'select', label: 'Assessment Type', required: true, options: ['Initial', 'Annual', 'Continuous Monitoring'] },
      assessment_start: { type: 'date', label: 'Assessment Start Date', required: true },
      assessment_end: { type: 'date', label: 'Assessment End Date', required: true },
      overall_result: { type: 'select', label: 'Overall Result', required: true, options: ['Satisfactory', 'Unsatisfactory', 'Conditional'] },
      total_controls: { type: 'number', label: 'Total Controls Assessed', required: true },
      satisfied_count: { type: 'number', label: 'Satisfied Controls', required: true },
      other_than_satisfied: { type: 'number', label: 'Other Than Satisfied', required: true },
      not_applicable: { type: 'number', label: 'Not Applicable', required: false },
      system_description: { type: 'text', label: 'System Description', required: true },
      confidentiality_level: { type: 'select', label: 'Confidentiality Level', required: true, options: ['Low', 'Moderate', 'High'] },
      integrity_level: { type: 'select', label: 'Integrity Level', required: true, options: ['Low', 'Moderate', 'High'] },
      availability_level: { type: 'select', label: 'Availability Level', required: true, options: ['Low', 'Moderate', 'High'] },
      assessment_lead: { type: 'text', label: 'Assessment Lead', required: true },
      authorizing_official: { type: 'text', label: 'Authorizing Official', required: true },
      report_date: { type: 'date', label: 'Report Date', required: true }
    }
  },
  {
    id: 'nist-004',
    title: 'Privacy Impact Assessment (PIA)',
    description: 'Analyzes privacy implications and compliance (NIST 800-53 Rev 5)',
    framework: 'NIST-800-53',
    category: 'assessment',
    priority: 2,
    documentType: 'assessment',
    required: true,
    templateContent: `# Privacy Impact Assessment (PIA)
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}
**PIA Date:** {{pia_date}}
**Privacy Officer:** {{privacy_officer}}

## 1. Executive Summary
This Privacy Impact Assessment evaluates the privacy implications of {{system_name}} and ensures compliance with applicable privacy requirements and NIST SP 800-53 Rev 5 privacy controls.

**System Owner:** {{system_owner}}
**Privacy Impact Rating:** {{privacy_impact_rating}}

## 2. System Description
**System Purpose:** {{system_purpose}}

**System Functions:** {{system_functions}}

**User Population:** {{user_population}}

## 3. Personally Identifiable Information (PII)

### 3.1 PII Collected
**Types of PII Collected:**
{{pii_types}}

**Volume of Records:** {{record_volume}}

### 3.2 Sources of PII
{{pii_sources}}

### 3.3 Purpose of PII Collection
{{pii_purpose}}

### 3.4 PII Sharing
**Internal Sharing:** {{internal_sharing}}

**External Sharing:** {{external_sharing}}

**Third Parties:** {{third_parties}}

## 4. Privacy Risk Analysis

### 4.1 Information Sharing Risks
**Risk Level:** {{sharing_risk}}
**Description:** {{sharing_risk_desc}}
**Mitigation:** {{sharing_mitigation}}

### 4.2 Data Quality and Integrity Risks
**Risk Level:** {{quality_risk}}
**Description:** {{quality_risk_desc}}
**Mitigation:** {{quality_mitigation}}

### 4.3 Individual Participation Risks
**Risk Level:** {{participation_risk}}
**Description:** {{participation_risk_desc}}
**Mitigation:** {{participation_mitigation}}

### 4.4 Security Risks
**Risk Level:** {{security_risk}}
**Description:** {{security_risk_desc}}
**Mitigation:** {{security_mitigation}}

## 5. Privacy Controls Implementation

### PT-1: Policy and Procedures
{{pt1_implementation}}

### PT-2: Authority to Collect
**Legal Authority:** {{collection_authority}}

### PT-3: PII Processing Purposes
**Documented Purposes:** {{processing_purposes}}

### PT-4: Consent
**Consent Mechanism:** {{consent_mechanism}}

### PT-5: Privacy Notice
**Notice Provided:** {{privacy_notice}}

### PT-6: System of Records Notice (SORN)
{{sorn_status}}

### PT-7: Specific Categories of PII
**Special Categories:** {{special_categories}}
**Handling:** {{special_handling}}

### PT-8: Computer Matching Requirements
{{computer_matching}}

## 6. Data Lifecycle Management

**Collection:** {{collection_practices}}

**Retention:** {{retention_period}}

**Disposal:** {{disposal_method}}

**Minimization:** {{minimization_practices}}

## 7. Individual Rights

**Access Rights:** {{access_rights}}

**Correction Rights:** {{correction_rights}}

**Deletion Rights:** {{deletion_rights}}

**Objection Rights:** {{objection_rights}}

## 8. Privacy Training
{{privacy_training}}

## 9. Privacy Incidents
**Incident Response Plan:** {{incident_plan}}
**Notification Procedures:** {{notification_procedures}}

## 10. Compliance Assessment
**NIST 800-53 Privacy Controls:** {{controls_compliant}}
**Privacy Act Compliance:** {{privacy_act_compliant}}
**GDPR Applicability:** {{gdpr_applicable}}
**Other Regulations:** {{other_regulations}}

## 11. Recommendations
{{recommendations}}

## 12. Approval

**Privacy Officer:** {{privacy_officer}}
**System Owner:** {{system_owner}}
**Authorizing Official:** {{authorizing_official}}
**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      pia_date: { type: 'date', label: 'PIA Date', required: true },
      privacy_officer: { type: 'text', label: 'Privacy Officer', required: true },
      system_owner: { type: 'text', label: 'System Owner', required: true },
      privacy_impact_rating: { type: 'select', label: 'Privacy Impact Rating', required: true, options: ['Low', 'Moderate', 'High'] },
      system_purpose: { type: 'text', label: 'System Purpose', required: true },
      pii_types: { type: 'text', label: 'Types of PII Collected', required: true },
      record_volume: { type: 'text', label: 'Volume of Records', required: true },
      pii_sources: { type: 'text', label: 'Sources of PII', required: true },
      pii_purpose: { type: 'text', label: 'Purpose of PII Collection', required: true },
      internal_sharing: { type: 'text', label: 'Internal Sharing', required: true },
      external_sharing: { type: 'text', label: 'External Sharing', required: true },
      sharing_risk: { type: 'select', label: 'Information Sharing Risk Level', required: true, options: ['Low', 'Moderate', 'High'] },
      quality_risk: { type: 'select', label: 'Data Quality Risk Level', required: true, options: ['Low', 'Moderate', 'High'] },
      participation_risk: { type: 'select', label: 'Participation Risk Level', required: true, options: ['Low', 'Moderate', 'High'] },
      security_risk: { type: 'select', label: 'Security Risk Level', required: true, options: ['Low', 'Moderate', 'High'] },
      collection_authority: { type: 'text', label: 'Legal Authority to Collect', required: true },
      processing_purposes: { type: 'text', label: 'Processing Purposes', required: true },
      consent_mechanism: { type: 'text', label: 'Consent Mechanism', required: true },
      privacy_notice: { type: 'text', label: 'Privacy Notice', required: true },
      retention_period: { type: 'text', label: 'Retention Period', required: true },
      disposal_method: { type: 'text', label: 'Disposal Method', required: true },
      authorizing_official: { type: 'text', label: 'Authorizing Official', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
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
  },
  {
    id: 'iso-015',
    title: 'Risk Treatment Plan',
    description: 'ISO 27001:2022 Clause 6.1.3 - Risk treatment decisions and implementation plan',
    framework: 'ISO27001',
    category: 'risk',
    priority: 2,
    documentType: 'plan',
    required: true,
    templateContent: `# Risk Treatment Plan
## ISO/IEC 27001:2022 - Clause 6.1.3

**Document Owner:** {{document_owner}}
**Version:** {{version}}
**Date:** {{document_date}}

## 1. Risk Treatment Objectives
{{treatment_objectives}}

## 2. Risk Treatment Options
For each identified risk, one of the following treatments must be selected:
- Avoid: Eliminate the risk source
- Reduce: Implement controls to mitigate
- Transfer: Share or transfer to third party
- Accept: Acknowledge and accept residual risk

## 3. Risk Treatment Decisions

| Risk ID | Risk Description | Risk Level | Treatment Option | Controls | Owner | Timeline |
|---------|------------------|------------|------------------|----------|-------|----------|
| {{risk_1_id}} | {{risk_1_desc}} | {{risk_1_level}} | {{risk_1_treatment}} | {{risk_1_controls}} | {{risk_1_owner}} | {{risk_1_timeline}} |

## 4. Implementation Plan
**Phase 1:** {{phase_1}}
**Phase 2:** {{phase_2}}
**Completion Target:** {{completion_target}}

## 5. Residual Risk Acceptance
**Accepted Residual Risks:** {{residual_risks}}
**Acceptance Authority:** {{acceptance_authority}}

**Approved By:** {{approved_by}}
**Approval Date:** {{approval_date}}`,
    templateVariables: {
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      version: { type: 'text', label: 'Version', required: true },
      document_date: { type: 'date', label: 'Document Date', required: true },
      treatment_objectives: { type: 'text', label: 'Treatment Objectives', required: true },
      risk_1_id: { type: 'text', label: 'Risk 1 ID', required: true },
      risk_1_desc: { type: 'text', label: 'Risk 1 Description', required: true },
      risk_1_level: { type: 'select', label: 'Risk 1 Level', required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
      risk_1_treatment: { type: 'select', label: 'Risk 1 Treatment', required: true, options: ['Avoid', 'Reduce', 'Transfer', 'Accept'] },
      risk_1_controls: { type: 'text', label: 'Risk 1 Controls', required: true },
      risk_1_owner: { type: 'text', label: 'Risk 1 Owner', required: true },
      risk_1_timeline: { type: 'text', label: 'Risk 1 Timeline', required: true },
      phase_1: { type: 'text', label: 'Phase 1 Description', required: true },
      phase_2: { type: 'text', label: 'Phase 2 Description', required: true },
      completion_target: { type: 'date', label: 'Completion Target', required: true },
      residual_risks: { type: 'text', label: 'Residual Risks', required: true },
      acceptance_authority: { type: 'text', label: 'Risk Acceptance Authority', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'iso-016',
    title: 'Risk Register',
    description: 'ISO 27001:2022 Clause 6.1.2 - Central register of information security risks',
    framework: 'ISO27001',
    category: 'risk',
    priority: 2,
    documentType: 'register',
    required: true,
    templateContent: `# Information Security Risk Register
## ISO/IEC 27001:2022 - Clause 6.1.2

**Organization:** {{company_name}}
**ISMS Scope:** {{isms_scope}}
**Register Date:** {{register_date}}
**Version:** {{version}}

## Risk Assessment Summary
**Total Risks Identified:** {{total_risks}}
**High/Critical:** {{high_risks}}
**Medium:** {{medium_risks}}
**Low:** {{low_risks}}

## Risk Register

| ID | Asset | Threat | Vulnerability | Likelihood | Impact | Risk Level | Treatment | Status | Owner |
|----|-------|--------|---------------|------------|--------|------------|-----------|--------|-------|
| R-001 | {{asset_1}} | {{threat_1}} | {{vuln_1}} | {{likelihood_1}} | {{impact_1}} | {{level_1}} | {{treatment_1}} | {{status_1}} | {{owner_1}} |

## Risk Matrix
**Likelihood Scale:** {{likelihood_scale}}
**Impact Scale:** {{impact_scale}}

## Review Schedule
**Review Frequency:** {{review_frequency}}
**Next Review:** {{next_review}}
**Risk Owner:** {{risk_owner}}

**Maintained By:** {{maintained_by}}
**Last Updated:** {{last_updated}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      isms_scope: { type: 'text', label: 'ISMS Scope', required: true },
      register_date: { type: 'date', label: 'Register Date', required: true },
      version: { type: 'text', label: 'Version', required: true },
      total_risks: { type: 'number', label: 'Total Risks', required: true },
      high_risks: { type: 'number', label: 'High/Critical Risks', required: true },
      medium_risks: { type: 'number', label: 'Medium Risks', required: true },
      low_risks: { type: 'number', label: 'Low Risks', required: true },
      asset_1: { type: 'text', label: 'Asset 1', required: true },
      threat_1: { type: 'text', label: 'Threat 1', required: true },
      vuln_1: { type: 'text', label: 'Vulnerability 1', required: true },
      likelihood_1: { type: 'select', label: 'Likelihood 1', required: true, options: ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'] },
      impact_1: { type: 'select', label: 'Impact 1', required: true, options: ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'] },
      level_1: { type: 'select', label: 'Risk Level 1', required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
      treatment_1: { type: 'select', label: 'Treatment 1', required: true, options: ['Avoid', 'Reduce', 'Transfer', 'Accept'] },
      status_1: { type: 'select', label: 'Status 1', required: true, options: ['Open', 'In Progress', 'Mitigated', 'Accepted'] },
      owner_1: { type: 'text', label: 'Risk Owner 1', required: true },
      likelihood_scale: { type: 'text', label: 'Likelihood Scale Definition', required: true },
      impact_scale: { type: 'text', label: 'Impact Scale Definition', required: true },
      review_frequency: { type: 'select', label: 'Review Frequency', required: true, options: ['Monthly', 'Quarterly', 'Semi-annually', 'Annually'] },
      next_review: { type: 'date', label: 'Next Review Date', required: true },
      risk_owner: { type: 'text', label: 'Risk Owner', required: true },
      maintained_by: { type: 'text', label: 'Maintained By', required: true },
      last_updated: { type: 'date', label: 'Last Updated', required: true }
    }
  },
  {
    id: 'iso-017',
    title: 'Internal Audit Program',
    description: 'ISO 27001:2022 Clause 9.2 - ISMS internal audit program and procedures',
    framework: 'ISO27001',
    category: 'audit',
    priority: 1,
    documentType: 'program',
    required: true,
    templateContent: `# Internal Audit Program
## ISO/IEC 27001:2022 - Clause 9.2

**Organization:** {{company_name}}
**Program Year:** {{program_year}}
**Version:** {{version}}

## 1. Audit Objectives
- Verify ISMS conformity to ISO 27001:2022
- Assess effectiveness of implemented controls
- Identify improvement opportunities
- Ensure compliance with organizational requirements

## 2. Audit Scope
**ISMS Scope:** {{isms_scope}}
**Locations:** {{audit_locations}}
**Processes:** {{audit_processes}}

## 3. Audit Schedule

| Quarter | Audit Focus | Clauses | Controls | Auditor | Dates |
|---------|-------------|---------|----------|---------|-------|
| Q1 | {{q1_focus}} | {{q1_clauses}} | {{q1_controls}} | {{q1_auditor}} | {{q1_dates}} |
| Q2 | {{q2_focus}} | {{q2_clauses}} | {{q2_controls}} | {{q2_auditor}} | {{q2_dates}} |

## 4. Audit Criteria
- ISO/IEC 27001:2022 requirements
- Organizational policies and procedures
- Applicable legal and regulatory requirements
- {{custom_criteria}}

## 5. Audit Team
**Lead Auditor:** {{lead_auditor}}
**Auditors:** {{auditors}}
**Competence Requirements:** {{competence_requirements}}

## 6. Audit Process
1. **Planning:** Audit plan development
2. **Preparation:** Document review, checklists
3. **Execution:** Opening meeting, interviews, evidence collection
4. **Reporting:** Findings, nonconformities, observations
5. **Follow-up:** Corrective actions verification

## 7. Reporting
**Audit Report Recipients:** {{report_recipients}}
**Report Timeline:** {{report_timeline}}
**Findings Classification:** {{findings_classification}}

## 8. Independence
**Auditor Independence:** {{independence_requirements}}

**Program Owner:** {{program_owner}}
**Approved By:** {{approved_by}}
**Approval Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      program_year: { type: 'text', label: 'Program Year', required: true },
      version: { type: 'text', label: 'Version', required: true },
      isms_scope: { type: 'text', label: 'ISMS Scope', required: true },
      audit_locations: { type: 'text', label: 'Audit Locations', required: true },
      audit_processes: { type: 'text', label: 'Audit Processes', required: true },
      q1_focus: { type: 'text', label: 'Q1 Focus Area', required: true },
      q1_clauses: { type: 'text', label: 'Q1 Clauses', required: true },
      q1_controls: { type: 'text', label: 'Q1 Controls', required: true },
      q1_auditor: { type: 'text', label: 'Q1 Auditor', required: true },
      q1_dates: { type: 'text', label: 'Q1 Dates', required: true },
      q2_focus: { type: 'text', label: 'Q2 Focus Area', required: true },
      q2_clauses: { type: 'text', label: 'Q2 Clauses', required: true },
      q2_controls: { type: 'text', label: 'Q2 Controls', required: true },
      q2_auditor: { type: 'text', label: 'Q2 Auditor', required: true },
      q2_dates: { type: 'text', label: 'Q2 Dates', required: true },
      custom_criteria: { type: 'text', label: 'Additional Criteria', required: false },
      lead_auditor: { type: 'text', label: 'Lead Auditor', required: true },
      auditors: { type: 'text', label: 'Audit Team Members', required: true },
      competence_requirements: { type: 'text', label: 'Competence Requirements', required: true },
      report_recipients: { type: 'text', label: 'Report Recipients', required: true },
      report_timeline: { type: 'select', label: 'Report Timeline', required: true, options: ['Within 1 week', 'Within 2 weeks', 'Within 1 month'] },
      findings_classification: { type: 'text', label: 'Findings Classification', required: true },
      independence_requirements: { type: 'text', label: 'Independence Requirements', required: true },
      program_owner: { type: 'text', label: 'Program Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
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
  },
  {
    id: 'fedramp-att-2',
    title: 'FedRAMP Digital Identity Worksheet',
    description: 'Attachment 2 - Digital identity level determination per NIST SP 800-63',
    framework: 'FedRAMP-Moderate',
    category: 'assessment',
    priority: 2,
    documentType: 'worksheet',
    required: true,
    templateContent: `# Digital Identity Worksheet
## FedRAMP SSP Attachment 2

### System Information
**System Name:** {{system_name}}
**Impact Level:** {{impact_level}}
**Assessment Date:** {{assessment_date}}

## 1. Purpose
This worksheet determines the appropriate digital identity assurance level per NIST SP 800-63-3 Digital Identity Guidelines.

## 2. Impact Assessment

### 2.1 Potential Impact of Authentication Errors
| Impact Category | Inconvenience | Financial Loss | Reputation/Privacy | Safety | Civil Liberties |
|----------------|---------------|----------------|-------------------|--------|-----------------|
| **Low** | {{low_inconvenience}} | {{low_financial}} | {{low_reputation}} | {{low_safety}} | {{low_civil}} |
| **Moderate** | {{mod_inconvenience}} | {{mod_financial}} | {{mod_reputation}} | {{mod_safety}} | {{mod_civil}} |
| **High** | {{high_inconvenience}} | {{high_financial}} | {{high_reputation}} | {{high_safety}} | {{high_civil}} |

**Overall Impact Level:** {{overall_impact}}

## 3. Identity Assurance Level (IAL)

### 3.1 IAL Determination
**Question 1:** Does the system require identity proofing?
**Answer:** {{requires_proofing}}

**Question 2:** What level of confidence in identity is required?
**Answer:** {{confidence_level}}

**Determined IAL:** {{ial_level}}

### 3.2 IAL Requirements
**IAL 1:** Self-asserted attributes, no identity proofing required
**IAL 2:** In-person or remote identity proofing, requires evidence of identity
**IAL 3:** In-person identity proofing, biometric collection

**Selected IAL:** {{selected_ial}}
**Justification:** {{ial_justification}}

## 4. Authenticator Assurance Level (AAL)

### 4.1 AAL Determination
**AAL 1:** Single-factor authentication (password)
**AAL 2:** Multi-factor authentication (MFA)
**AAL 3:** Hardware-based cryptographic authenticator

**Selected AAL:** {{selected_aal}}
**Authentication Methods:** {{auth_methods}}

### 4.2 MFA Implementation
**Primary Factor:** {{primary_factor}}
**Secondary Factor:** {{secondary_factor}}
**MFA Solution:** {{mfa_solution}}

## 5. Federation Assurance Level (FAL)

### 5.1 FAL Determination
**Does system use federated authentication?** {{uses_federation}}

**FAL 1:** Bearer assertion (no signature required)
**FAL 2:** Signed assertion
**FAL 3:** Signed assertion, encrypted

**Selected FAL:** {{selected_fal}}
**Federation Protocol:** {{federation_protocol}}

## 6. Risk Assessment

### 6.1 Authentication Risk Factors
**User Population:** {{user_population}}
**Data Sensitivity:** {{data_sensitivity}}
**Remote Access:** {{remote_access}}
**Privileged Functions:** {{privileged_functions}}

### 6.2 Compensating Controls
**Session Management:** {{session_mgmt}}
**Anomaly Detection:** {{anomaly_detection}}
**Continuous Monitoring:** {{continuous_monitoring}}

## 7. Recommendations

### 7.1 Required Implementation
- **IAL:** {{recommended_ial}}
- **AAL:** {{recommended_aal}}
- **FAL:** {{recommended_fal}}

### 7.2 Technical Requirements
- Identity proofing process: {{proofing_process}}
- Authenticator types: {{authenticator_types}}
- Session timeout: {{session_timeout}}
- Re-authentication: {{reauth_requirement}}

**Completed By:** {{completed_by}}
**Reviewed By:** {{reviewed_by}}
**Approval Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      assessment_date: { type: 'date', label: 'Assessment Date', required: true },
      low_inconvenience: { type: 'text', label: 'Low Inconvenience Impact', required: false },
      low_financial: { type: 'text', label: 'Low Financial Impact', required: false },
      low_reputation: { type: 'text', label: 'Low Reputation Impact', required: false },
      low_safety: { type: 'text', label: 'Low Safety Impact', required: false },
      low_civil: { type: 'text', label: 'Low Civil Liberties Impact', required: false },
      mod_inconvenience: { type: 'text', label: 'Moderate Inconvenience Impact', required: false },
      mod_financial: { type: 'text', label: 'Moderate Financial Impact', required: false },
      mod_reputation: { type: 'text', label: 'Moderate Reputation Impact', required: false },
      mod_safety: { type: 'text', label: 'Moderate Safety Impact', required: false },
      mod_civil: { type: 'text', label: 'Moderate Civil Liberties Impact', required: false },
      high_inconvenience: { type: 'text', label: 'High Inconvenience Impact', required: false },
      high_financial: { type: 'text', label: 'High Financial Impact', required: false },
      high_reputation: { type: 'text', label: 'High Reputation Impact', required: false },
      high_safety: { type: 'text', label: 'High Safety Impact', required: false },
      high_civil: { type: 'text', label: 'High Civil Liberties Impact', required: false },
      overall_impact: { type: 'select', label: 'Overall Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      requires_proofing: { type: 'select', label: 'Requires Identity Proofing?', required: true, options: ['Yes', 'No'] },
      confidence_level: { type: 'select', label: 'Required Confidence Level', required: true, options: ['Low', 'Moderate', 'High'] },
      ial_level: { type: 'select', label: 'Determined IAL', required: true, options: ['IAL 1', 'IAL 2', 'IAL 3'] },
      selected_ial: { type: 'select', label: 'Selected IAL', required: true, options: ['IAL 1', 'IAL 2', 'IAL 3'] },
      ial_justification: { type: 'text', label: 'IAL Justification', required: true },
      selected_aal: { type: 'select', label: 'Selected AAL', required: true, options: ['AAL 1', 'AAL 2', 'AAL 3'] },
      auth_methods: { type: 'text', label: 'Authentication Methods', required: true },
      primary_factor: { type: 'select', label: 'Primary Authentication Factor', required: true, options: ['Password', 'PIN', 'Biometric'] },
      secondary_factor: { type: 'select', label: 'Secondary Authentication Factor', required: true, options: ['SMS', 'Authenticator App', 'Hardware Token', 'Biometric'] },
      mfa_solution: { type: 'text', label: 'MFA Solution', required: true },
      uses_federation: { type: 'select', label: 'Uses Federation?', required: true, options: ['Yes', 'No'] },
      selected_fal: { type: 'select', label: 'Selected FAL', required: true, options: ['FAL 1', 'FAL 2', 'FAL 3', 'N/A'] },
      federation_protocol: { type: 'text', label: 'Federation Protocol', required: false },
      user_population: { type: 'text', label: 'User Population Description', required: true },
      data_sensitivity: { type: 'select', label: 'Data Sensitivity', required: true, options: ['Low', 'Moderate', 'High'] },
      remote_access: { type: 'select', label: 'Remote Access Allowed?', required: true, options: ['Yes', 'No'] },
      privileged_functions: { type: 'text', label: 'Privileged Functions', required: true },
      session_mgmt: { type: 'text', label: 'Session Management Controls', required: true },
      anomaly_detection: { type: 'text', label: 'Anomaly Detection', required: true },
      continuous_monitoring: { type: 'text', label: 'Continuous Monitoring', required: true },
      recommended_ial: { type: 'select', label: 'Recommended IAL', required: true, options: ['IAL 1', 'IAL 2', 'IAL 3'] },
      recommended_aal: { type: 'select', label: 'Recommended AAL', required: true, options: ['AAL 1', 'AAL 2', 'AAL 3'] },
      recommended_fal: { type: 'select', label: 'Recommended FAL', required: true, options: ['FAL 1', 'FAL 2', 'FAL 3', 'N/A'] },
      proofing_process: { type: 'text', label: 'Identity Proofing Process', required: true },
      authenticator_types: { type: 'text', label: 'Authenticator Types', required: true },
      session_timeout: { type: 'select', label: 'Session Timeout', required: true, options: ['15 minutes', '30 minutes', '1 hour', '2 hours'] },
      reauth_requirement: { type: 'text', label: 'Re-authentication Requirement', required: true },
      completed_by: { type: 'text', label: 'Completed By', required: true },
      reviewed_by: { type: 'text', label: 'Reviewed By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-att-3',
    title: 'FedRAMP Privacy Threshold Analysis (PTA)',
    description: 'Attachment 3 - Privacy Threshold Analysis per E-Government Act',
    framework: 'FedRAMP-Moderate',
    category: 'assessment',
    priority: 3,
    documentType: 'assessment',
    required: true,
    templateContent: `# Privacy Threshold Analysis (PTA)
## FedRAMP SSP Attachment 3

### System Information
**System Name:** {{system_name}}
**System Abbreviation:** {{system_abbr}}
**System Owner:** {{system_owner}}
**Analysis Date:** {{analysis_date}}

## 1. Purpose
This Privacy Threshold Analysis (PTA) determines whether {{system_name}} requires a Privacy Impact Assessment (PIA) per the E-Government Act of 2002.

## 2. System Description
**Function:** {{system_function}}
**User Base:** {{user_base}}
**Data Types:** {{data_types}}

## 3. PII Determination Questions

### 3.1 Does the system collect, maintain, or disseminate PII?
**Answer:** {{collects_pii}}

**If YES, describe:**
{{pii_description}}

### 3.2 Types of PII Collected
- [ ] Name: {{pii_name}}
- [ ] Social Security Number: {{pii_ssn}}
- [ ] Date of Birth: {{pii_dob}}
- [ ] Email Address: {{pii_email}}
- [ ] Phone Number: {{pii_phone}}
- [ ] Home Address: {{pii_address}}
- [ ] Financial Information: {{pii_financial}}
- [ ] Medical Information: {{pii_medical}}
- [ ] Biometric Data: {{pii_biometric}}
- [ ] Other: {{pii_other}}

### 3.3 Number of Records
**Estimated records containing PII:** {{pii_record_count}}
**Number of individuals:** {{individual_count}}

## 4. PII Collection Purpose

### 4.1 Legal Authority
**Statutory Authority:** {{legal_authority}}
**Regulatory Authority:** {{regulatory_authority}}

### 4.2 Business Need
**Purpose of Collection:** {{collection_purpose}}
**Use of PII:** {{pii_use}}

### 4.3 Data Minimization
**Is only necessary PII collected?** {{data_minimization}}
**Justification:** {{minimization_justification}}

## 5. Information Sharing

### 5.1 External Sharing
**Is PII shared externally?** {{external_sharing}}

**If YES, with whom:**
{{sharing_parties}}

**Purpose of sharing:** {{sharing_purpose}}
**Legal authority for sharing:** {{sharing_authority}}

### 5.2 Sharing Agreements
**MOUs/ISAs in place?** {{has_agreements}}
**Agreement references:** {{agreement_refs}}

## 6. Notice and Consent

### 6.1 Privacy Notice
**Is privacy notice provided to individuals?** {{provides_notice}}
**Location of notice:** {{notice_location}}
**Format:** {{notice_format}}

### 6.2 Consent
**Is consent obtained for PII collection?** {{obtains_consent}}
**Consent mechanism:** {{consent_mechanism}}
**Opt-out available?** {{opt_out_available}}

## 7. Access and Amendment

### 7.1 Individual Access
**Can individuals access their PII?** {{individual_access}}
**Access method:** {{access_method}}

### 7.2 Amendment Rights
**Can individuals request corrections?** {{amendment_rights}}
**Correction process:** {{correction_process}}

## 8. Data Retention and Disposal

### 8.1 Retention
**Retention period:** {{retention_period}}
**Records schedule:** {{records_schedule}}
**NARA approved?** {{nara_approved}}

### 8.2 Disposal
**Disposal method:** {{disposal_method}}
**Media sanitization:** {{sanitization_method}}

## 9. Security Controls

### 9.1 PII Protection
**Encryption at rest:** {{encryption_rest}}
**Encryption in transit:** {{encryption_transit}}
**Access controls:** {{access_controls}}
**Audit logging:** {{audit_logging}}

### 9.2 Breach Response
**Incident response plan includes PII breach procedures?** {{breach_procedures}}
**Notification process:** {{breach_notification}}

## 10. System of Records Notice (SORN)

### 10.1 SORN Determination
**Is a SORN required?** {{sorn_required}}

**If YES:**
**SORN Number:** {{sorn_number}}
**Publication Date:** {{sorn_date}}
**Federal Register Citation:** {{sorn_citation}}

**If NO, explain:** {{sorn_exemption}}

## 11. Privacy Impact Assessment (PIA) Determination

### 11.1 PIA Required?
Based on the analysis above, is a PIA required?

**Answer:** {{pia_required}}

### 11.2 PIA Trigger Analysis
| Trigger | Present? | Notes |
|---------|----------|-------|
| New collection of PII | {{trigger_new}} | {{trigger_new_notes}} |
| New use of existing PII | {{trigger_use}} | {{trigger_use_notes}} |
| New technology | {{trigger_tech}} | {{trigger_tech_notes}} |
| New external sharing | {{trigger_sharing}} | {{trigger_sharing_notes}} |
| Alteration to business process | {{trigger_process}} | {{trigger_process_notes}} |

### 11.3 Recommendation
**PIA Status:** {{pia_status}}
**Next Steps:** {{next_steps}}

## 12. Privacy POC

**Privacy Officer:** {{privacy_officer}}
**Contact:** {{privacy_contact}}
**Department:** {{privacy_dept}}

## 13. Approval

**Completed By:** {{completed_by}}
**Date:** {{completion_date}}

**Reviewed By:** {{reviewed_by}}
**Date:** {{review_date}}

**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      system_abbr: { type: 'text', label: 'System Abbreviation', required: true },
      system_owner: { type: 'text', label: 'System Owner', required: true },
      analysis_date: { type: 'date', label: 'Analysis Date', required: true },
      system_function: { type: 'text', label: 'System Function', required: true },
      user_base: { type: 'text', label: 'User Base', required: true },
      data_types: { type: 'text', label: 'Data Types', required: true },
      collects_pii: { type: 'select', label: 'Collects PII?', required: true, options: ['Yes', 'No'] },
      pii_description: { type: 'text', label: 'PII Description', required: false },
      pii_name: { type: 'select', label: 'Collects Name?', required: false, options: ['Yes', 'No'] },
      pii_ssn: { type: 'select', label: 'Collects SSN?', required: false, options: ['Yes', 'No'] },
      pii_dob: { type: 'select', label: 'Collects DOB?', required: false, options: ['Yes', 'No'] },
      pii_email: { type: 'select', label: 'Collects Email?', required: false, options: ['Yes', 'No'] },
      pii_phone: { type: 'select', label: 'Collects Phone?', required: false, options: ['Yes', 'No'] },
      pii_address: { type: 'select', label: 'Collects Address?', required: false, options: ['Yes', 'No'] },
      pii_financial: { type: 'select', label: 'Collects Financial Info?', required: false, options: ['Yes', 'No'] },
      pii_medical: { type: 'select', label: 'Collects Medical Info?', required: false, options: ['Yes', 'No'] },
      pii_biometric: { type: 'select', label: 'Collects Biometric Data?', required: false, options: ['Yes', 'No'] },
      pii_other: { type: 'text', label: 'Other PII Types', required: false },
      pii_record_count: { type: 'number', label: 'PII Record Count', required: false },
      individual_count: { type: 'number', label: 'Individual Count', required: false },
      legal_authority: { type: 'text', label: 'Legal Authority', required: true },
      regulatory_authority: { type: 'text', label: 'Regulatory Authority', required: false },
      collection_purpose: { type: 'text', label: 'Collection Purpose', required: true },
      pii_use: { type: 'text', label: 'PII Use', required: true },
      data_minimization: { type: 'select', label: 'Data Minimization Applied?', required: true, options: ['Yes', 'No'] },
      minimization_justification: { type: 'text', label: 'Minimization Justification', required: true },
      external_sharing: { type: 'select', label: 'External Sharing?', required: true, options: ['Yes', 'No'] },
      sharing_parties: { type: 'text', label: 'Sharing Parties', required: false },
      sharing_purpose: { type: 'text', label: 'Sharing Purpose', required: false },
      sharing_authority: { type: 'text', label: 'Sharing Authority', required: false },
      has_agreements: { type: 'select', label: 'Has Sharing Agreements?', required: false, options: ['Yes', 'No'] },
      agreement_refs: { type: 'text', label: 'Agreement References', required: false },
      provides_notice: { type: 'select', label: 'Provides Privacy Notice?', required: true, options: ['Yes', 'No'] },
      notice_location: { type: 'text', label: 'Notice Location', required: false },
      notice_format: { type: 'text', label: 'Notice Format', required: false },
      obtains_consent: { type: 'select', label: 'Obtains Consent?', required: true, options: ['Yes', 'No', 'N/A'] },
      consent_mechanism: { type: 'text', label: 'Consent Mechanism', required: false },
      opt_out_available: { type: 'select', label: 'Opt-out Available?', required: false, options: ['Yes', 'No'] },
      individual_access: { type: 'select', label: 'Individual Access?', required: true, options: ['Yes', 'No'] },
      access_method: { type: 'text', label: 'Access Method', required: false },
      amendment_rights: { type: 'select', label: 'Amendment Rights?', required: true, options: ['Yes', 'No'] },
      correction_process: { type: 'text', label: 'Correction Process', required: false },
      retention_period: { type: 'text', label: 'Retention Period', required: true },
      records_schedule: { type: 'text', label: 'Records Schedule', required: true },
      nara_approved: { type: 'select', label: 'NARA Approved?', required: true, options: ['Yes', 'No', 'Pending'] },
      disposal_method: { type: 'text', label: 'Disposal Method', required: true },
      sanitization_method: { type: 'text', label: 'Media Sanitization Method', required: true },
      encryption_rest: { type: 'select', label: 'Encryption at Rest?', required: true, options: ['Yes', 'No'] },
      encryption_transit: { type: 'select', label: 'Encryption in Transit?', required: true, options: ['Yes', 'No'] },
      access_controls: { type: 'text', label: 'Access Controls', required: true },
      audit_logging: { type: 'select', label: 'Audit Logging?', required: true, options: ['Yes', 'No'] },
      breach_procedures: { type: 'select', label: 'Breach Procedures?', required: true, options: ['Yes', 'No'] },
      breach_notification: { type: 'text', label: 'Breach Notification Process', required: true },
      sorn_required: { type: 'select', label: 'SORN Required?', required: true, options: ['Yes', 'No'] },
      sorn_number: { type: 'text', label: 'SORN Number', required: false },
      sorn_date: { type: 'date', label: 'SORN Publication Date', required: false },
      sorn_citation: { type: 'text', label: 'Federal Register Citation', required: false },
      sorn_exemption: { type: 'text', label: 'SORN Exemption Reason', required: false },
      pia_required: { type: 'select', label: 'PIA Required?', required: true, options: ['Yes', 'No'] },
      trigger_new: { type: 'select', label: 'New PII Collection?', required: true, options: ['Yes', 'No'] },
      trigger_new_notes: { type: 'text', label: 'New Collection Notes', required: false },
      trigger_use: { type: 'select', label: 'New Use of PII?', required: true, options: ['Yes', 'No'] },
      trigger_use_notes: { type: 'text', label: 'New Use Notes', required: false },
      trigger_tech: { type: 'select', label: 'New Technology?', required: true, options: ['Yes', 'No'] },
      trigger_tech_notes: { type: 'text', label: 'New Technology Notes', required: false },
      trigger_sharing: { type: 'select', label: 'New External Sharing?', required: true, options: ['Yes', 'No'] },
      trigger_sharing_notes: { type: 'text', label: 'New Sharing Notes', required: false },
      trigger_process: { type: 'select', label: 'Business Process Change?', required: true, options: ['Yes', 'No'] },
      trigger_process_notes: { type: 'text', label: 'Process Change Notes', required: false },
      pia_status: { type: 'select', label: 'PIA Status', required: true, options: ['Required', 'Not Required', 'In Progress', 'Completed'] },
      next_steps: { type: 'text', label: 'Next Steps', required: true },
      privacy_officer: { type: 'text', label: 'Privacy Officer Name', required: true },
      privacy_contact: { type: 'text', label: 'Privacy Officer Contact', required: true },
      privacy_dept: { type: 'text', label: 'Privacy Department', required: true },
      completed_by: { type: 'text', label: 'Completed By', required: true },
      completion_date: { type: 'date', label: 'Completion Date', required: true },
      reviewed_by: { type: 'text', label: 'Reviewed By', required: true },
      review_date: { type: 'date', label: 'Review Date', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-att-4',
    title: 'FedRAMP Privacy Impact Assessment (PIA)',
    description: 'Attachment 4 - Privacy Impact Assessment per E-Government Act',
    framework: 'FedRAMP-Moderate',
    category: 'assessment',
    priority: 4,
    documentType: 'assessment',
    required: true,
    templateContent: `# Privacy Impact Assessment (PIA)
## FedRAMP SSP Attachment 4

### System Information
**System Name:** {{system_name}}
**Impact Level:** {{impact_level}}
**PIA Date:** {{pia_date}}
**PIA ID:** {{pia_id}}

## 1. System Overview
**Purpose:** {{system_purpose}}
**Authority:** {{legal_authority}}
**Scope:** {{system_scope}}

## 2. Information Collected
**PII Types:** {{pii_types}}
**Data Sources:** {{data_sources}}
**Collection Method:** {{collection_method}}
**Volume:** {{data_volume}}

## 3. Uses of Information
**Primary Use:** {{primary_use}}
**Secondary Uses:** {{secondary_uses}}
**Internal Sharing:** {{internal_sharing}}
**External Sharing:** {{external_sharing}}

## 4. Notice and Consent
**Notice Provided:** {{notice_provided}}
**Consent Obtained:** {{consent_obtained}}
**Opt-Out Available:** {{opt_out}}

## 5. Access and Security
**Access Controls:** {{access_controls}}
**Encryption:** {{encryption}}
**Audit Logging:** {{audit_logging}}
**Retention:** {{retention_period}}

## 6. Privacy Risks
**Risk 1:** {{risk_1}}
**Mitigation 1:** {{mitigation_1}}

**Risk 2:** {{risk_2}}
**Mitigation 2:** {{mitigation_2}}

## 7. SORN
**SORN Required:** {{sorn_required}}
**SORN Number:** {{sorn_number}}

**Completed By:** {{completed_by}}
**Approved By:** {{approved_by}}
**Approval Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      pia_date: { type: 'date', label: 'PIA Date', required: true },
      pia_id: { type: 'text', label: 'PIA ID', required: true },
      system_purpose: { type: 'text', label: 'System Purpose', required: true },
      legal_authority: { type: 'text', label: 'Legal Authority', required: true },
      system_scope: { type: 'text', label: 'System Scope', required: true },
      pii_types: { type: 'text', label: 'PII Types Collected', required: true },
      data_sources: { type: 'text', label: 'Data Sources', required: true },
      collection_method: { type: 'text', label: 'Collection Method', required: true },
      data_volume: { type: 'text', label: 'Data Volume', required: true },
      primary_use: { type: 'text', label: 'Primary Use', required: true },
      secondary_uses: { type: 'text', label: 'Secondary Uses', required: false },
      internal_sharing: { type: 'text', label: 'Internal Sharing', required: true },
      external_sharing: { type: 'text', label: 'External Sharing', required: true },
      notice_provided: { type: 'select', label: 'Notice Provided?', required: true, options: ['Yes', 'No'] },
      consent_obtained: { type: 'select', label: 'Consent Obtained?', required: true, options: ['Yes', 'No', 'N/A'] },
      opt_out: { type: 'select', label: 'Opt-Out Available?', required: true, options: ['Yes', 'No'] },
      access_controls: { type: 'text', label: 'Access Controls', required: true },
      encryption: { type: 'text', label: 'Encryption Methods', required: true },
      audit_logging: { type: 'text', label: 'Audit Logging', required: true },
      retention_period: { type: 'text', label: 'Retention Period', required: true },
      risk_1: { type: 'text', label: 'Privacy Risk 1', required: true },
      mitigation_1: { type: 'text', label: 'Risk 1 Mitigation', required: true },
      risk_2: { type: 'text', label: 'Privacy Risk 2', required: false },
      mitigation_2: { type: 'text', label: 'Risk 2 Mitigation', required: false },
      sorn_required: { type: 'select', label: 'SORN Required?', required: true, options: ['Yes', 'No'] },
      sorn_number: { type: 'text', label: 'SORN Number', required: false },
      completed_by: { type: 'text', label: 'Completed By', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
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
    id: 'fedramp-att-9',
    title: 'FedRAMP Control Implementation Summary Workbook',
    description: 'Attachment 9 - Simplified CIS workbook reference (see FedRAMP CIS core document for full version)',
    framework: 'FedRAMP-Moderate',
    category: 'assessment',
    priority: 9,
    documentType: 'worksheet',
    required: true,
    templateContent: `# Control Implementation Summary (CIS) Workbook
## FedRAMP SSP Attachment 9

**Note:** This attachment references the full Control Implementation Summary available in the FedRAMP Core Documents (fedramp-cis).

### System Information
**System Name:** {{system_name}}
**Impact Level:** {{impact_level}}
**Assessment Date:** {{assessment_date}}

## Quick Reference
**Total Controls:** {{total_controls}}
**Implemented:** {{implemented_count}}
**Partially Implemented:** {{partial_count}}
**Not Implemented:** {{not_implemented_count}}

## Control Family Summary
| Family | Total | Implemented | Partial | Not Implemented |
|--------|-------|-------------|---------|-----------------|
| AC | {{ac_total}} | {{ac_impl}} | {{ac_partial}} | {{ac_not}} |
| AU | {{au_total}} | {{au_impl}} | {{au_partial}} | {{au_not}} |
| SC | {{sc_total}} | {{sc_impl}} | {{sc_partial}} | {{sc_not}} |

**For complete CIS details, see:** FedRAMP Control Implementation Summary (fedramp-cis)

**Prepared By:** {{prepared_by}}
**Date:** {{prep_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      assessment_date: { type: 'date', label: 'Assessment Date', required: true },
      total_controls: { type: 'number', label: 'Total Controls', required: true },
      implemented_count: { type: 'number', label: 'Implemented Count', required: true },
      partial_count: { type: 'number', label: 'Partially Implemented Count', required: true },
      not_implemented_count: { type: 'number', label: 'Not Implemented Count', required: true },
      ac_total: { type: 'number', label: 'AC Total', required: false },
      ac_impl: { type: 'number', label: 'AC Implemented', required: false },
      ac_partial: { type: 'number', label: 'AC Partial', required: false },
      ac_not: { type: 'number', label: 'AC Not Implemented', required: false },
      au_total: { type: 'number', label: 'AU Total', required: false },
      au_impl: { type: 'number', label: 'AU Implemented', required: false },
      au_partial: { type: 'number', label: 'AU Partial', required: false },
      au_not: { type: 'number', label: 'AU Not Implemented', required: false },
      sc_total: { type: 'number', label: 'SC Total', required: false },
      sc_impl: { type: 'number', label: 'SC Implemented', required: false },
      sc_partial: { type: 'number', label: 'SC Partial', required: false },
      sc_not: { type: 'number', label: 'SC Not Implemented', required: false },
      prepared_by: { type: 'text', label: 'Prepared By', required: true },
      prep_date: { type: 'date', label: 'Preparation Date', required: true }
    }
  },
  {
    id: 'fedramp-att-10',
    title: 'FedRAMP FIPS 199 Security Categorization',
    description: 'Attachment 10 - FIPS 199 system security categorization',
    framework: 'FedRAMP-Moderate',
    category: 'assessment',
    priority: 10,
    documentType: 'assessment',
    required: true,
    templateContent: `# FIPS 199 Security Categorization
## FedRAMP SSP Attachment 10

### System Information
**System Name:** {{system_name}}
**System Abbreviation:** {{system_abbr}}
**System Owner:** {{system_owner}}
**Categorization Date:** {{cat_date}}

## 1. Security Objectives

### 1.1 Confidentiality
**Impact Level:** {{confidentiality_impact}}
**Justification:** {{confidentiality_justification}}

### 1.2 Integrity
**Impact Level:** {{integrity_impact}}
**Justification:** {{integrity_justification}}

### 1.3 Availability
**Impact Level:** {{availability_impact}}
**Justification:** {{availability_justification}}

## 2. Information Types

### 2.1 Primary Information Type
**Type:** {{info_type_1}}
**NIST SP 800-60 Category:** {{nist_category_1}}
**Confidentiality:** {{type_1_conf}}
**Integrity:** {{type_1_int}}
**Availability:** {{type_1_avail}}

### 2.2 Additional Information Types
**Type:** {{info_type_2}}
**Category:** {{nist_category_2}}

## 3. Overall System Categorization

**Formula:** SC system = {(confidentiality, impact), (integrity, impact), (availability, impact)}

**System Categorization:**
SC {{system_name}} = {(confidentiality, {{confidentiality_impact}}), (integrity, {{integrity_impact}}), (availability, {{availability_impact}})}

**Overall Impact Level:** {{overall_impact}}

## 4. Rationale
{{categorization_rationale}}

## 5. FedRAMP Baseline
**Applicable Baseline:** {{fedramp_baseline}}
**Control Tailoring:** {{tailoring_applied}}

## 6. Approval

**Categorization Performed By:** {{performed_by}}
**Date:** {{performed_date}}

**Reviewed By:** {{reviewed_by}}
**Date:** {{reviewed_date}}

**Approved By (Authorizing Official):** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      system_abbr: { type: 'text', label: 'System Abbreviation', required: true },
      system_owner: { type: 'text', label: 'System Owner', required: true },
      cat_date: { type: 'date', label: 'Categorization Date', required: true },
      confidentiality_impact: { type: 'select', label: 'Confidentiality Impact', required: true, options: ['Low', 'Moderate', 'High'] },
      confidentiality_justification: { type: 'text', label: 'Confidentiality Justification', required: true },
      integrity_impact: { type: 'select', label: 'Integrity Impact', required: true, options: ['Low', 'Moderate', 'High'] },
      integrity_justification: { type: 'text', label: 'Integrity Justification', required: true },
      availability_impact: { type: 'select', label: 'Availability Impact', required: true, options: ['Low', 'Moderate', 'High'] },
      availability_justification: { type: 'text', label: 'Availability Justification', required: true },
      info_type_1: { type: 'text', label: 'Primary Information Type', required: true },
      nist_category_1: { type: 'text', label: 'NIST SP 800-60 Category 1', required: true },
      type_1_conf: { type: 'select', label: 'Type 1 Confidentiality', required: true, options: ['Low', 'Moderate', 'High'] },
      type_1_int: { type: 'select', label: 'Type 1 Integrity', required: true, options: ['Low', 'Moderate', 'High'] },
      type_1_avail: { type: 'select', label: 'Type 1 Availability', required: true, options: ['Low', 'Moderate', 'High'] },
      info_type_2: { type: 'text', label: 'Additional Information Type', required: false },
      nist_category_2: { type: 'text', label: 'NIST Category 2', required: false },
      overall_impact: { type: 'select', label: 'Overall Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      categorization_rationale: { type: 'text', label: 'Categorization Rationale', required: true },
      fedramp_baseline: { type: 'select', label: 'FedRAMP Baseline', required: true, options: ['Low', 'Moderate', 'High'] },
      tailoring_applied: { type: 'select', label: 'Control Tailoring Applied?', required: true, options: ['Yes', 'No'] },
      performed_by: { type: 'text', label: 'Performed By', required: true },
      performed_date: { type: 'date', label: 'Performed Date', required: true },
      reviewed_by: { type: 'text', label: 'Reviewed By', required: true },
      reviewed_date: { type: 'date', label: 'Reviewed Date', required: true },
      approved_by: { type: 'text', label: 'Approved By (AO)', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
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
  },
  {
    id: 'fedramp-att-12',
    title: 'FedRAMP Security Assessment Plan (SAP)',
    description: 'Attachment 12 - Security Assessment Plan template',
    framework: 'FedRAMP-Moderate',
    category: 'assessment',
    priority: 12,
    documentType: 'plan',
    required: true,
    templateContent: `# Security Assessment Plan (SAP)
## FedRAMP SSP Attachment 12

### System Information
**System Name:** {{system_name}}
**Impact Level:** {{impact_level}}
**SAP Version:** {{sap_version}}
**SAP Date:** {{sap_date}}

## 1. Assessment Overview
**Purpose:** {{assessment_purpose}}
**Scope:** {{assessment_scope}}
**Timeline:** {{assessment_timeline}}

## 2. Assessment Team
**Lead Assessor:** {{lead_assessor}}
**3PAO:** {{three_pao}}
**Team Members:** {{team_members}}

## 3. Assessment Approach
**Methodology:** {{methodology}}
**Testing Types:**
- Interviews: {{interviews}}
- Document Review: {{doc_review}}
- Technical Testing: {{tech_testing}}
- Penetration Testing: {{pentest}}

## 4. Control Selection
**Baseline:** {{control_baseline}}
**Total Controls:** {{total_controls}}
**Assessment Focus Areas:** {{focus_areas}}

## 5. Assessment Schedule
**Kickoff:** {{kickoff_date}}
**Interviews:** {{interview_dates}}
**Testing:** {{testing_dates}}
**Report Draft:** {{draft_date}}
**Final Report:** {{final_date}}

## 6. Deliverables
- Security Assessment Report (SAR)
- POA&M
- Test Results
- {{custom_deliverable}}

**Prepared By:** {{prepared_by}}
**Approved By:** {{approved_by}}
**Approval Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      sap_version: { type: 'text', label: 'SAP Version', required: true },
      sap_date: { type: 'date', label: 'SAP Date', required: true },
      assessment_purpose: { type: 'text', label: 'Assessment Purpose', required: true },
      assessment_scope: { type: 'text', label: 'Assessment Scope', required: true },
      assessment_timeline: { type: 'text', label: 'Assessment Timeline', required: true },
      lead_assessor: { type: 'text', label: 'Lead Assessor', required: true },
      three_pao: { type: 'text', label: '3PAO Organization', required: true },
      team_members: { type: 'text', label: 'Team Members', required: true },
      methodology: { type: 'text', label: 'Assessment Methodology', required: true },
      interviews: { type: 'select', label: 'Includes Interviews?', required: true, options: ['Yes', 'No'] },
      doc_review: { type: 'select', label: 'Includes Document Review?', required: true, options: ['Yes', 'No'] },
      tech_testing: { type: 'select', label: 'Includes Technical Testing?', required: true, options: ['Yes', 'No'] },
      pentest: { type: 'select', label: 'Includes Penetration Testing?', required: true, options: ['Yes', 'No'] },
      control_baseline: { type: 'select', label: 'Control Baseline', required: true, options: ['FedRAMP Low', 'FedRAMP Moderate', 'FedRAMP High'] },
      total_controls: { type: 'number', label: 'Total Controls to Assess', required: true },
      focus_areas: { type: 'text', label: 'Assessment Focus Areas', required: true },
      kickoff_date: { type: 'date', label: 'Kickoff Date', required: true },
      interview_dates: { type: 'text', label: 'Interview Dates', required: true },
      testing_dates: { type: 'text', label: 'Testing Dates', required: true },
      draft_date: { type: 'date', label: 'Draft Report Date', required: true },
      final_date: { type: 'date', label: 'Final Report Date', required: true },
      custom_deliverable: { type: 'text', label: 'Additional Deliverable', required: false },
      prepared_by: { type: 'text', label: 'Prepared By', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-att-13',
    title: 'FedRAMP Integrated Inventory Workbook Reference',
    description: 'Attachment 13 - Reference to integrated inventory (see fedramp-inventory for full version)',
    framework: 'FedRAMP-Moderate',
    category: 'inventory',
    priority: 13,
    documentType: 'worksheet',
    required: true,
    templateContent: `# Integrated Inventory Workbook
## FedRAMP SSP Attachment 13

**Note:** This attachment references the full Integrated Inventory Workbook available in the FedRAMP Core Documents (fedramp-inventory).

### System Information
**System Name:** {{system_name}}
**Inventory Date:** {{inventory_date}}
**Version:** {{version}}

## Quick Summary
**Hardware Assets:** {{hardware_count}}
**Software Assets:** {{software_count}}
**Network Devices:** {{network_count}}
**Virtual Assets:** {{virtual_count}}
**Cloud Services:** {{cloud_count}}

## Key Components
1. Hardware inventory with serial numbers and locations
2. Software inventory with versions and licenses
3. Network diagram and device inventory
4. Virtual machine inventory
5. Cloud service inventory
6. Data flow diagrams

**For complete inventory details, see:** FedRAMP Integrated Inventory Workbook (fedramp-inventory)

## Inventory Management
**Update Frequency:** {{update_frequency}}
**Responsible Party:** {{inventory_owner}}
**Last Updated:** {{last_updated}}

**Prepared By:** {{prepared_by}}
**Approved By:** {{approved_by}}
**Approval Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      inventory_date: { type: 'date', label: 'Inventory Date', required: true },
      version: { type: 'text', label: 'Version', required: true },
      hardware_count: { type: 'number', label: 'Hardware Asset Count', required: true },
      software_count: { type: 'number', label: 'Software Asset Count', required: true },
      network_count: { type: 'number', label: 'Network Device Count', required: true },
      virtual_count: { type: 'number', label: 'Virtual Asset Count', required: true },
      cloud_count: { type: 'number', label: 'Cloud Service Count', required: true },
      update_frequency: { type: 'select', label: 'Update Frequency', required: true, options: ['Real-time', 'Daily', 'Weekly', 'Monthly'] },
      inventory_owner: { type: 'text', label: 'Inventory Owner', required: true },
      last_updated: { type: 'date', label: 'Last Updated', required: true },
      prepared_by: { type: 'text', label: 'Prepared By', required: true },
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
  },
  {
    id: 'nist-at',
    title: 'Awareness and Training (AT) Family',
    description: 'NIST 800-53 Rev 5 Awareness and Training family documentation',
    framework: 'NIST-800-53',
    category: 'AT',
    priority: 4,
    documentType: 'policy',
    required: true,
    templateContent: `# Awareness and Training (AT) Family
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}

## AT-1 Policy and Procedures
{{company_name}} develops, documents, and disseminates security awareness and training policy.

**Policy Review:** {{policy_review_freq}}
**Procedure Review:** {{procedure_review_freq}}

## AT-2 Literacy Training and Awareness
**Training Frequency:** {{training_frequency}}
**Training Topics:**
- Security roles and responsibilities
- Proper email and internet usage
- Password management
- Social engineering awareness
- Incident reporting
- {{additional_topics}}

**Training Methods:** {{training_methods}}
**Completion Tracking:** {{completion_tracking}}

## AT-3 Role-Based Training
**Training by Role:**
- System Administrators: {{admin_training}}
- Developers: {{developer_training}}
- Privileged Users: {{privileged_training}}
- General Users: {{general_training}}

**Training Before Access:** {{before_access_training}}
**Annual Refresher:** {{annual_refresher}}

## AT-4 Training Records
**Record Retention:** {{record_retention}}
**Records Include:** Individual training, training dates, training types completed

## AT-5 Contacts with Security Groups
**External Contacts:**
{{security_groups}}

**Information Sharing:** {{info_sharing}}

## AT-6 Training Feedback
**Feedback Mechanisms:** {{feedback_methods}}
**Training Improvements:** {{improvements}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      policy_review_freq: { type: 'select', label: 'Policy Review Frequency', required: true, options: ['Annually', 'Semi-annually', 'Quarterly'] },
      procedure_review_freq: { type: 'select', label: 'Procedure Review Frequency', required: true, options: ['Annually', 'Semi-annually', 'Quarterly'] },
      training_frequency: { type: 'select', label: 'Training Frequency', required: true, options: ['Annually', 'Semi-annually', 'Upon Hire'] },
      training_methods: { type: 'text', label: 'Training Methods', required: true },
      completion_tracking: { type: 'text', label: 'Completion Tracking System', required: true },
      record_retention: { type: 'text', label: 'Record Retention Period', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-ca',
    title: 'Assessment, Authorization, and Monitoring (CA) Family',
    description: 'NIST 800-53 Rev 5 Assessment, Authorization, and Monitoring family documentation',
    framework: 'NIST-800-53',
    category: 'CA',
    priority: 3,
    documentType: 'policy',
    required: true,
    templateContent: `# Assessment, Authorization, and Monitoring (CA) Family
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}

## CA-1 Policy and Procedures
{{company_name}} develops, documents, and disseminates assessment, authorization, and monitoring policy.

## CA-2 Control Assessments
**Assessment Frequency:** {{assessment_frequency}}
**Assessment Scope:** {{assessment_scope}}
**Independent Assessor:** {{independent_assessor}}
**Assessment Methods:** Examine, Interview, Test

## CA-3 Information Exchange
**Interconnection Agreements:** {{interconnection_agreements}}
**Data Exchange Requirements:** {{exchange_requirements}}

## CA-5 Plan of Action and Milestones (POA&M)
**POA&M Updates:** {{poam_update_freq}}
**Tracking System:** {{tracking_system}}

## CA-6 Authorization
**Authorizing Official:** {{authorizing_official}}
**Authorization Type:** {{authorization_type}}
**Reauthorization:** {{reauth_frequency}}

## CA-7 Continuous Monitoring
**Monitoring Strategy:** {{monitoring_strategy}}
**Monitoring Frequency:** {{monitoring_frequency}}

**Metrics Monitored:**
- Security control effectiveness
- Changes to system
- Compliance status
- {{additional_metrics}}

**Reporting:** {{reporting_frequency}}

## CA-8 Penetration Testing
**Testing Frequency:** {{pentest_frequency}}
**Testing Scope:** {{pentest_scope}}
**Tester Qualifications:** {{tester_quals}}

## CA-9 Internal System Connections
**Authorized Connections:** {{authorized_connections}}
**Connection Reviews:** {{connection_review_freq}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      assessment_frequency: { type: 'select', label: 'Assessment Frequency', required: true, options: ['Annually', 'Every 3 years', 'Continuously'] },
      independent_assessor: { type: 'select', label: 'Independent Assessor', required: true, options: ['Yes', 'No', 'Planned'] },
      authorizing_official: { type: 'text', label: 'Authorizing Official', required: true },
      authorization_type: { type: 'select', label: 'Authorization Type', required: true, options: ['ATO', 'IATT', 'IATO'] },
      reauth_frequency: { type: 'select', label: 'Reauthorization Frequency', required: true, options: ['Every 3 years', 'Annually', 'As needed'] },
      monitoring_strategy: { type: 'text', label: 'Continuous Monitoring Strategy', required: true },
      monitoring_frequency: { type: 'select', label: 'Monitoring Frequency', required: true, options: ['Continuous', 'Daily', 'Weekly', 'Monthly'] },
      pentest_frequency: { type: 'select', label: 'Penetration Testing Frequency', required: true, options: ['Annually', 'Bi-annually', 'As needed'] },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-cp',
    title: 'Contingency Planning (CP) Family',
    description: 'NIST 800-53 Rev 5 Contingency Planning family documentation',
    framework: 'NIST-800-53',
    category: 'CP',
    priority: 2,
    documentType: 'plan',
    required: true,
    templateContent: `# Contingency Planning (CP) Family
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}

## CP-1 Policy and Procedures
{{company_name}} develops, documents, and disseminates contingency planning policy.

## CP-2 Contingency Plan
**Plan Review:** {{plan_review_freq}}
**Plan Testing:** {{plan_test_freq}}
**Plan Distribution:** {{plan_distribution}}

**Key Personnel:**
- Contingency Plan Coordinator: {{coordinator}}
- Emergency Response Team: {{response_team}}

## CP-3 Contingency Training
**Training Frequency:** {{training_frequency}}
**Training Audience:** {{training_audience}}

## CP-4 Contingency Plan Testing
**Test Frequency:** {{test_frequency}}
**Test Types:**
- Tabletop exercises
- Functional tests
- Full-scale exercises
- {{additional_tests}}

**Test Documentation:** {{test_documentation}}

## CP-6 Alternate Storage Site
**Alternate Site:** {{alternate_site}}
**Geographic Separation:** {{geo_separation}}
**Readiness:** {{site_readiness}}

## CP-7 Alternate Processing Site
**Processing Site:** {{processing_site}}
**Transfer Time:** {{transfer_time}}
**Data Synchronization:** {{data_sync}}

## CP-8 Telecommunications Services
**Primary Provider:** {{primary_telecom}}
**Alternate Provider:** {{alternate_telecom}}

## CP-9 System Backup
**Backup Frequency:**
- User data: {{user_backup_freq}}
- System data: {{system_backup_freq}}
- Configuration: {{config_backup_freq}}

**Backup Location:** {{backup_location}}
**Backup Testing:** {{backup_test_freq}}

## CP-10 System Recovery and Reconstitution
**Recovery Time Objective (RTO):** {{rto}}
**Recovery Point Objective (RPO):** {{rpo}}

**Recovery Procedures:**
{{recovery_procedures}}

**Restoration Priority:** {{restoration_priority}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      plan_review_freq: { type: 'select', label: 'Plan Review Frequency', required: true, options: ['Annually', 'Semi-annually', 'Quarterly'] },
      plan_test_freq: { type: 'select', label: 'Plan Testing Frequency', required: true, options: ['Annually', 'Semi-annually', 'Quarterly'] },
      coordinator: { type: 'text', label: 'Contingency Plan Coordinator', required: true },
      test_frequency: { type: 'select', label: 'Test Frequency', required: true, options: ['Annually', 'Semi-annually', 'Quarterly'] },
      alternate_site: { type: 'text', label: 'Alternate Storage Site', required: true },
      processing_site: { type: 'text', label: 'Alternate Processing Site', required: true },
      user_backup_freq: { type: 'select', label: 'User Data Backup Frequency', required: true, options: ['Real-time', 'Daily', 'Weekly'] },
      system_backup_freq: { type: 'select', label: 'System Data Backup Frequency', required: true, options: ['Real-time', 'Daily', 'Weekly'] },
      rto: { type: 'text', label: 'Recovery Time Objective (RTO)', required: true },
      rpo: { type: 'text', label: 'Recovery Point Objective (RPO)', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-ma',
    title: 'Maintenance (MA) Family',
    description: 'NIST 800-53 Rev 5 Maintenance family documentation',
    framework: 'NIST-800-53',
    category: 'MA',
    priority: 5,
    documentType: 'policy',
    required: true,
    templateContent: `# Maintenance (MA) Family
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}

## MA-1 Policy and Procedures
{{company_name}} develops, documents, and disseminates system maintenance policy.

## MA-2 Controlled Maintenance
**Maintenance Schedule:** {{maintenance_schedule}}
**Maintenance Windows:** {{maintenance_windows}}
**Approval Required:** {{approval_required}}

**Maintenance Activities:**
- Scheduled maintenance
- Preventive maintenance
- Corrective maintenance
- Emergency maintenance

**Documentation:** {{maintenance_documentation}}

## MA-3 Maintenance Tools
**Authorized Tools:** {{authorized_tools}}
**Tool Inspection:** {{tool_inspection}}
**Tool Removal:** {{tool_removal}}

## MA-4 Nonlocal Maintenance
**Remote Maintenance:** {{remote_maintenance_allowed}}
**Remote Access Methods:** {{remote_methods}}
**MFA Required:** {{mfa_required}}
**Session Logging:** {{session_logging}}

**Authorization:** {{maintenance_authorization}}

## MA-5 Maintenance Personnel
**Authorized Personnel:** {{authorized_personnel}}
**Escort Requirements:** {{escort_requirements}}

**Personnel Screening:**
{{personnel_screening}}

## MA-6 Timely Maintenance
**Mean Time to Repair (MTTR):** {{mttr}}
**Spare Parts:** {{spare_parts}}
**Vendor Support:** {{vendor_support}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      maintenance_schedule: { type: 'text', label: 'Maintenance Schedule', required: true },
      maintenance_windows: { type: 'text', label: 'Maintenance Windows', required: true },
      approval_required: { type: 'select', label: 'Approval Required', required: true, options: ['Yes', 'For critical systems only', 'No'] },
      authorized_tools: { type: 'text', label: 'Authorized Maintenance Tools', required: true },
      remote_maintenance_allowed: { type: 'select', label: 'Remote Maintenance Allowed', required: true, options: ['Yes', 'With approval', 'No'] },
      mfa_required: { type: 'select', label: 'MFA Required for Remote', required: true, options: ['Yes', 'No'] },
      escort_requirements: { type: 'select', label: 'Escort Requirements', required: true, options: ['Required', 'Not required', 'Situational'] },
      mttr: { type: 'text', label: 'Mean Time to Repair (MTTR)', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-mp',
    title: 'Media Protection (MP) Family',
    description: 'NIST 800-53 Rev 5 Media Protection family documentation',
    framework: 'NIST-800-53',
    category: 'MP',
    priority: 4,
    documentType: 'policy',
    required: true,
    templateContent: `# Media Protection (MP) Family
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}

## MP-1 Policy and Procedures
{{company_name}} develops, documents, and disseminates media protection policy.

## MP-2 Media Access
**Access Authorization:** {{access_authorization}}
**Media Library:** {{media_library}}

**Access Controls:**
{{access_controls}}

## MP-3 Media Marking
**Marking Requirements:**
- Classification level
- Distribution limitations
- Handling caveats
- {{additional_markings}}

**Labeling Methods:** {{labeling_methods}}

## MP-4 Media Storage
**Storage Locations:** {{storage_locations}}
**Storage Controls:** {{storage_controls}}
**Environmental Controls:** {{environmental_controls}}

## MP-5 Media Transport
**Transport Authorization:** {{transport_authorization}}
**Courier Requirements:** {{courier_requirements}}
**Encryption Required:** {{encryption_required}}
**Chain of Custody:** {{chain_of_custody}}

## MP-6 Media Sanitization
**Sanitization Methods:**
- Clear: {{clear_method}}
- Purge: {{purge_method}}
- Destroy: {{destroy_method}}

**Sanitization Tools:** {{sanitization_tools}}
**Verification:** {{sanitization_verification}}
**Documentation:** {{sanitization_documentation}}

## MP-7 Media Use
**Authorized Use:** {{authorized_use}}
**Prohibited Use:** {{prohibited_use}}
**Removable Media:** {{removable_media_policy}}

## MP-8 Media Downgrading
**Downgrading Process:** {{downgrading_process}}
**Authorization:** {{downgrading_authorization}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      access_authorization: { type: 'text', label: 'Access Authorization Process', required: true },
      labeling_methods: { type: 'text', label: 'Labeling Methods', required: true },
      storage_locations: { type: 'text', label: 'Storage Locations', required: true },
      storage_controls: { type: 'text', label: 'Storage Controls', required: true },
      transport_authorization: { type: 'text', label: 'Transport Authorization', required: true },
      encryption_required: { type: 'select', label: 'Encryption Required for Transport', required: true, options: ['Yes', 'For sensitive only', 'No'] },
      clear_method: { type: 'text', label: 'Clear Method', required: true },
      purge_method: { type: 'text', label: 'Purge Method', required: true },
      destroy_method: { type: 'text', label: 'Destroy Method', required: true },
      removable_media_policy: { type: 'select', label: 'Removable Media Policy', required: true, options: ['Prohibited', 'Allowed with approval', 'Allowed'] },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-pe',
    title: 'Physical and Environmental Protection (PE) Family',
    description: 'NIST 800-53 Rev 5 Physical and Environmental Protection family documentation',
    framework: 'NIST-800-53',
    category: 'PE',
    priority: 3,
    documentType: 'policy',
    required: true,
    templateContent: `# Physical and Environmental Protection (PE) Family
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}
**Facility:** {{facility_name}}

## PE-1 Policy and Procedures
{{company_name}} develops, documents, and disseminates physical and environmental protection policy.

## PE-2 Physical Access Authorizations
**Authorization Process:** {{authorization_process}}
**Access List Review:** {{access_review_freq}}
**Visitor Management:** {{visitor_management}}

## PE-3 Physical Access Control
**Access Control Methods:**
- {{access_method_1}}
- {{access_method_2}}
- {{access_method_3}}

**Badge System:** {{badge_system}}
**Entry Points:** {{entry_points}}
**24/7 Monitoring:** {{monitoring_247}}

## PE-4 Access Control for Transmission
**Physical access controls for transmission and distribution systems:**
{{transmission_controls}}

## PE-5 Access Control for Output Devices
**Output Device Controls:** {{output_controls}}
**Printer Security:** {{printer_security}}

## PE-6 Monitoring Physical Access
**Monitoring Systems:**
- CCTV: {{cctv_system}}
- Intrusion Detection: {{intrusion_detection}}
- Guard Services: {{guard_services}}

**Recording Retention:** {{recording_retention}}
**Review Frequency:** {{review_frequency}}

## PE-8 Visitor Access Records
**Visitor Log:** {{visitor_log_system}}
**Escort Requirements:** {{escort_required}}
**Badge Issuance:** {{visitor_badges}}
**Record Retention:** {{visitor_record_retention}}

## PE-9 Power Equipment and Cabling
**UPS:** {{ups_system}}
**Generator:** {{generator}}
**Power Redundancy:** {{power_redundancy}}

## PE-10 Emergency Shutoff
**Shutoff Locations:** {{shutoff_locations}}
**Emergency Power Off (EPO):** {{epo_system}}

## PE-11 Emergency Power
**Emergency Power Source:** {{emergency_power}}
**Transition Time:** {{transition_time}}
**Fuel Supply:** {{fuel_supply}}

## PE-12 Emergency Lighting
**Emergency Lighting:** {{emergency_lighting}}
**Coverage Areas:** {{coverage_areas}}

## PE-13 Fire Protection
**Fire Suppression:** {{fire_suppression}}
**Fire Detection:** {{fire_detection}}
**Inspection Frequency:** {{fire_inspection_freq}}

## PE-14 Environmental Controls
**Temperature Range:** {{temp_range}}
**Humidity Range:** {{humidity_range}}
**Monitoring System:** {{environmental_monitoring}}

## PE-15 Water Damage Protection
**Water Detection:** {{water_detection}}
**Shutoff Valves:** {{shutoff_valves}}

## PE-16 Delivery and Removal
**Loading Dock Controls:** {{loading_dock_controls}}
**Inspection Process:** {{inspection_process}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      facility_name: { type: 'text', label: 'Facility Name', required: true },
      authorization_process: { type: 'text', label: 'Authorization Process', required: true },
      access_review_freq: { type: 'select', label: 'Access Review Frequency', required: true, options: ['Monthly', 'Quarterly', 'Annually'] },
      badge_system: { type: 'text', label: 'Badge System', required: true },
      monitoring_247: { type: 'select', label: '24/7 Monitoring', required: true, options: ['Yes', 'No', 'Business hours only'] },
      cctv_system: { type: 'text', label: 'CCTV System', required: true },
      escort_required: { type: 'select', label: 'Escort Required for Visitors', required: true, options: ['Yes', 'For restricted areas', 'No'] },
      ups_system: { type: 'text', label: 'UPS System', required: true },
      emergency_power: { type: 'text', label: 'Emergency Power Source', required: true },
      fire_suppression: { type: 'text', label: 'Fire Suppression System', required: true },
      temp_range: { type: 'text', label: 'Temperature Range', required: true },
      humidity_range: { type: 'text', label: 'Humidity Range', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-pl',
    title: 'Planning (PL) Family',
    description: 'NIST 800-53 Rev 5 Planning family documentation',
    framework: 'NIST-800-53',
    category: 'PL',
    priority: 2,
    documentType: 'plan',
    required: true,
    templateContent: `# Planning (PL) Family
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}

## PL-1 Policy and Procedures
{{company_name}} develops, documents, and disseminates security and privacy planning policy.

## PL-2 System Security and Privacy Plans
**Plan Review:** {{plan_review_freq}}
**Plan Distribution:** {{plan_distribution}}

**System Security Plan (SSP) Includes:**
- System identification and authorization boundary
- Operational environment
- Security control implementation
- Relationships with other systems

## PL-4 Rules of Behavior
**Rules of Behavior Include:**
- Acceptable use of system resources
- Expected behavior regarding information and system usage
- Consequences of inconsistent behavior
- Acknowledgment requirements

**Distribution:** {{rules_distribution}}
**Acknowledgment:** {{acknowledgment_process}}

## PL-7 Concept of Operations
**System Purpose:** {{system_purpose}}
**Mission Functions:** {{mission_functions}}
**System Capabilities:** {{system_capabilities}}

## PL-8 Security and Privacy Architectures
**Architecture Description:** {{architecture_description}}
**Security Architecture:** {{security_architecture}}
**Privacy Architecture:** {{privacy_architecture}}

**Architectural Principles:**
{{architectural_principles}}

## PL-9 Central Management
**Centrally Managed Controls:**
{{centrally_managed_controls}}

## PL-10 Baseline Selection
**Security Baseline:** {{security_baseline}}
**Tailoring Actions:** {{tailoring_actions}}

## PL-11 Baseline Tailoring
**Tailoring Criteria:**
{{tailoring_criteria}}

**Compensating Controls:**
{{compensating_controls}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      plan_review_freq: { type: 'select', label: 'Plan Review Frequency', required: true, options: ['Annually', 'Every 3 years', 'As needed'] },
      plan_distribution: { type: 'text', label: 'Plan Distribution', required: true },
      rules_distribution: { type: 'text', label: 'Rules of Behavior Distribution', required: true },
      acknowledgment_process: { type: 'text', label: 'Acknowledgment Process', required: true },
      system_purpose: { type: 'text', label: 'System Purpose', required: true },
      security_baseline: { type: 'select', label: 'Security Baseline', required: true, options: ['Low', 'Moderate', 'High'] },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-pm',
    title: 'Program Management (PM) Family',
    description: 'NIST 800-53 Rev 5 Program Management family documentation',
    framework: 'NIST-800-53',
    category: 'PM',
    priority: 3,
    documentType: 'policy',
    required: true,
    templateContent: `# Program Management (PM) Family
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}

## PM-1 Information Security Program Plan
**Program Goals:** {{program_goals}}
**Program Objectives:** {{program_objectives}}

**Organizational Structure:**
{{organizational_structure}}

**Roles and Responsibilities:**
- Chief Information Security Officer (CISO): {{ciso_name}}
- Privacy Officer: {{privacy_officer}}
- System Owners: {{system_owners}}

## PM-2 Information Security Program Leadership Role
**Senior Information Security Officer:** {{senior_iso}}
**Reporting Structure:** {{reporting_structure}}

## PM-3 Information Security and Privacy Resources
**Budget:** {{security_budget}}
**Staffing:** {{security_staffing}}
**Resources Allocation:** {{resources_allocation}}

## PM-4 Plan of Action and Milestones Process
**POA&M Review:** {{poam_review_freq}}
**Remediation Tracking:** {{remediation_tracking}}

## PM-5 System Inventory
**System Inventory:** {{system_inventory}}
**Inventory Updates:** {{inventory_update_freq}}

## PM-6 Measures of Performance
**Security Metrics:**
{{security_metrics}}

**Performance Indicators:**
{{performance_indicators}}

**Reporting:** {{metrics_reporting_freq}}

## PM-7 Enterprise Architecture
**Architecture Framework:** {{architecture_framework}}
**Security Integration:** {{security_integration}}

## PM-9 Risk Management Strategy
**Risk Framing:** {{risk_framing}}
**Risk Assessment Process:** {{risk_assessment_process}}
**Risk Response:** {{risk_response}}
**Risk Monitoring:** {{risk_monitoring}}

## PM-10 Authorization Process
**Authorization Workflow:** {{authorization_workflow}}
**Authorizing Officials:** {{authorizing_officials}}

## PM-11 Mission and Business Process Definition
**Mission Functions:** {{mission_functions}}
**Business Processes:** {{business_processes}}

## PM-15 Security and Privacy Groups and Associations
**Professional Memberships:**
{{professional_memberships}}

**Information Sharing:** {{info_sharing}}

## PM-16 Threat Awareness Program
**Threat Intelligence Sources:** {{threat_intel_sources}}
**Dissemination:** {{threat_dissemination}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      ciso_name: { type: 'text', label: 'CISO Name', required: true },
      privacy_officer: { type: 'text', label: 'Privacy Officer', required: true },
      senior_iso: { type: 'text', label: 'Senior Information Security Officer', required: true },
      security_budget: { type: 'text', label: 'Security Budget', required: true },
      poam_review_freq: { type: 'select', label: 'POA&M Review Frequency', required: true, options: ['Weekly', 'Monthly', 'Quarterly'] },
      inventory_update_freq: { type: 'select', label: 'Inventory Update Frequency', required: true, options: ['Real-time', 'Monthly', 'Quarterly'] },
      metrics_reporting_freq: { type: 'select', label: 'Metrics Reporting Frequency', required: true, options: ['Weekly', 'Monthly', 'Quarterly'] },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-ps',
    title: 'Personnel Security (PS) Family',
    description: 'NIST 800-53 Rev 5 Personnel Security family documentation',
    framework: 'NIST-800-53',
    category: 'PS',
    priority: 3,
    documentType: 'policy',
    required: true,
    templateContent: `# Personnel Security (PS) Family
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}

## PS-1 Policy and Procedures
{{company_name}} develops, documents, and disseminates personnel security policy.

## PS-2 Position Risk Designation
**Risk Designations:**
- High Risk: {{high_risk_positions}}
- Moderate Risk: {{moderate_risk_positions}}
- Low Risk: {{low_risk_positions}}

**Review Frequency:** {{designation_review_freq}}

## PS-3 Personnel Screening
**Screening Requirements by Position:**
- Background Check: {{background_check_requirements}}
- Reference Checks: {{reference_checks}}
- Employment Verification: {{employment_verification}}
- Education Verification: {{education_verification}}
- Credit Check: {{credit_check}}

**Rescreening:** {{rescreening_frequency}}

## PS-4 Personnel Termination
**Termination Procedures:**
1. Access revocation: {{access_revocation_timeline}}
2. Property return: {{property_return_process}}
3. Exit interview: {{exit_interview}}
4. Knowledge transfer: {{knowledge_transfer}}

**Final Access Review:** {{final_access_review}}

## PS-5 Personnel Transfer
**Transfer Procedures:**
- Access review and modification
- Role change documentation
- Supervisor notification
- Training updates

**Notification Timeline:** {{transfer_notification}}

## PS-6 Access Agreements
**Agreement Types:**
- Acceptable Use Policy (AUP)
- Nondisclosure Agreement (NDA)
- Rules of Behavior
- {{additional_agreements}}

**Review Frequency:** {{agreement_review_freq}}
**Reacknowledgment:** {{reacknowledgment_freq}}

## PS-7 External Personnel Security
**Contractor Requirements:**
{{contractor_requirements}}

**Third-Party Security:** {{third_party_security}}

## PS-8 Personnel Sanctions
**Sanctions Process:** {{sanctions_process}}
**Violation Examples:** {{violation_examples}}
**Appeal Process:** {{appeal_process}}

## PS-9 Position Descriptions
**Security Roles in Job Descriptions:**
{{security_roles}}

**Security Responsibilities:**
{{security_responsibilities}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      designation_review_freq: { type: 'select', label: 'Risk Designation Review Frequency', required: true, options: ['Annually', 'Every 3 years', 'As needed'] },
      background_check_requirements: { type: 'text', label: 'Background Check Requirements', required: true },
      rescreening_frequency: { type: 'select', label: 'Rescreening Frequency', required: true, options: ['Annually', 'Every 3 years', 'Every 5 years', 'Not required'] },
      access_revocation_timeline: { type: 'text', label: 'Access Revocation Timeline', required: true },
      agreement_review_freq: { type: 'select', label: 'Agreement Review Frequency', required: true, options: ['Annually', 'Every 3 years', 'At hire only'] },
      sanctions_process: { type: 'text', label: 'Sanctions Process', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-pt',
    title: 'Privacy Controls (PT) Family',
    description: 'NIST 800-53 Rev 5 Privacy Controls family documentation',
    framework: 'NIST-800-53',
    category: 'PT',
    priority: 2,
    documentType: 'policy',
    required: true,
    templateContent: `# Privacy Controls (PT) Family
## NIST 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}
**Privacy Officer:** {{privacy_officer}}

## PT-1 Policy and Procedures
{{company_name}} develops, documents, and disseminates privacy policy.

**Policy Review:** {{policy_review_freq}}
**Procedure Review:** {{procedure_review_freq}}

## PT-2 Authority to Collect
**Legal Authority:** {{legal_authority}}
**Collection Justification:** {{collection_justification}}

## PT-3 Personally Identifiable Information Processing Purposes
**Processing Purposes:**
{{processing_purposes}}

**Purpose Limitation:** {{purpose_limitation}}

## PT-4 Consent
**Consent Mechanism:** {{consent_mechanism}}
**Consent Type:** {{consent_type}}
**Withdrawal Process:** {{withdrawal_process}}

## PT-5 Privacy Notice
**Notice Content:**
- Types of PII collected
- Purpose of collection
- How PII is used and shared
- Individual rights
- Contact information

**Notice Delivery:** {{notice_delivery}}
**Notice Updates:** {{notice_update_freq}}

## PT-6 System of Records Notice and Privacy Act Statements
**System of Records Notice (SORN):** {{sorn_status}}
**Privacy Act Statement:** {{privacy_act_statement}}

## PT-7 Specific Categories of Personally Identifiable Information
**Special Categories:**
- {{special_category_1}}
- {{special_category_2}}
- {{special_category_3}}

**Additional Protections:** {{additional_protections}}

## PT-8 Computer Matching Requirements
**Matching Agreements:** {{matching_agreements}}
**Matching Notices:** {{matching_notices}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      privacy_officer: { type: 'text', label: 'Privacy Officer', required: true },
      policy_review_freq: { type: 'select', label: 'Policy Review Frequency', required: true, options: ['Annually', 'Semi-annually', 'Quarterly'] },
      procedure_review_freq: { type: 'select', label: 'Procedure Review Frequency', required: true, options: ['Annually', 'Semi-annually', 'Quarterly'] },
      legal_authority: { type: 'text', label: 'Legal Authority to Collect', required: true },
      processing_purposes: { type: 'text', label: 'PII Processing Purposes', required: true },
      consent_mechanism: { type: 'text', label: 'Consent Mechanism', required: true },
      consent_type: { type: 'select', label: 'Consent Type', required: true, options: ['Opt-in', 'Opt-out', 'Explicit'] },
      notice_delivery: { type: 'select', label: 'Notice Delivery', required: true, options: ['Website', 'Email', 'Physical', 'Multiple methods'] },
      notice_update_freq: { type: 'select', label: 'Notice Update Frequency', required: true, options: ['As needed', 'Annually', 'Quarterly'] },
      sorn_status: { type: 'select', label: 'SORN Status', required: true, options: ['Published', 'In progress', 'Not applicable'] },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-sa',
    title: 'System and Services Acquisition (SA) Family',
    description: 'NIST 800-53 Rev 5 System and Services Acquisition family documentation',
    framework: 'NIST-800-53',
    category: 'SA',
    priority: 4,
    documentType: 'policy',
    required: true,
    templateContent: `# System and Services Acquisition (SA) Family
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}

## SA-1 Policy and Procedures
{{company_name}} develops, documents, and disseminates system and services acquisition policy.

## SA-2 Allocation of Resources
**Budget Allocation:** {{budget_allocation}}
**Security Requirements in Budget:** {{security_in_budget}}

## SA-3 System Development Life Cycle
**SDLC Methodology:** {{sdlc_methodology}}

**Phases:**
1. Initiation
2. Development/Acquisition
3. Implementation
4. Operations/Maintenance
5. Disposition

**Security Integration:** {{security_integration}}

## SA-4 Acquisition Process
**Security Requirements in Contracts:**
{{security_requirements}}

**Vendor Security Assessment:** {{vendor_assessment}}

## SA-5 System Documentation
**Required Documentation:**
- System architecture
- Configuration settings
- Operational procedures
- Security procedures
- {{additional_documentation}}

**Documentation Review:** {{documentation_review_freq}}

## SA-8 Security and Privacy Engineering Principles
**Design Principles:**
{{design_principles}}

**Security by Design:** {{security_by_design}}

## SA-9 External System Services
**Service Level Agreements (SLAs):** {{sla_requirements}}
**Vendor Management:** {{vendor_management}}
**Service Monitoring:** {{service_monitoring}}

## SA-10 Developer Configuration Management
**Configuration Management:** {{config_management}}
**Version Control:** {{version_control}}
**Change Control:** {{change_control}}

## SA-11 Developer Testing and Evaluation
**Testing Requirements:**
- Unit testing
- Integration testing
- System testing
- Security testing
- {{additional_testing}}

**Test Coverage:** {{test_coverage}}

## SA-15 Development Process, Standards, and Tools
**Development Standards:** {{development_standards}}
**Coding Standards:** {{coding_standards}}
**Development Tools:** {{development_tools}}

## SA-16 Developer-Provided Training
**Training Requirements:** {{training_requirements}}
**Training Delivery:** {{training_delivery}}

## SA-17 Developer Security and Privacy Architecture and Design
**Security Architecture Review:** {{architecture_review}}
**Threat Modeling:** {{threat_modeling}}

## SA-22 Unsupported System Components
**Unsupported Components:** {{unsupported_components}}
**Justification:** {{unsupported_justification}}
**Compensating Controls:** {{compensating_controls}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      sdlc_methodology: { type: 'select', label: 'SDLC Methodology', required: true, options: ['Waterfall', 'Agile', 'DevSecOps', 'Hybrid'] },
      security_requirements: { type: 'text', label: 'Security Requirements in Contracts', required: true },
      vendor_assessment: { type: 'text', label: 'Vendor Security Assessment Process', required: true },
      documentation_review_freq: { type: 'select', label: 'Documentation Review Frequency', required: true, options: ['Annually', 'With each release', 'Quarterly'] },
      version_control: { type: 'text', label: 'Version Control System', required: true },
      test_coverage: { type: 'text', label: 'Test Coverage Requirements', required: true },
      development_standards: { type: 'text', label: 'Development Standards', required: true },
      threat_modeling: { type: 'select', label: 'Threat Modeling', required: true, options: ['Required', 'For critical systems', 'Not performed'] },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'nist-sr',
    title: 'Supply Chain Risk Management (SR) Family',
    description: 'NIST 800-53 Rev 5 Supply Chain Risk Management family documentation',
    framework: 'NIST-800-53',
    category: 'SR',
    priority: 4,
    documentType: 'policy',
    required: true,
    templateContent: `# Supply Chain Risk Management (SR) Family
## NIST SP 800-53 Rev 5

### Organization Information
**Organization:** {{company_name}}
**System:** {{system_name}}

## SR-1 Policy and Procedures
{{company_name}} develops, documents, and disseminates supply chain risk management policy.

**Policy Review:** {{policy_review_freq}}
**Procedure Review:** {{procedure_review_freq}}

## SR-2 Supply Chain Risk Management Plan
**Plan Components:**
- Risk identification
- Risk assessment
- Risk mitigation
- Risk monitoring

**Plan Review:** {{plan_review_freq}}
**Plan Updates:** {{plan_update_process}}

## SR-3 Supply Chain Controls and Processes
**Supplier Selection Criteria:**
{{supplier_criteria}}

**Vendor Assessment:** {{vendor_assessment_process}}
**Onboarding Process:** {{vendor_onboarding}}

## SR-4 Provenance
**Component Provenance Tracking:**
{{provenance_tracking}}

**Chain of Custody:** {{chain_of_custody}}

## SR-5 Acquisition Strategies, Tools, and Methods
**Acquisition Strategy:** {{acquisition_strategy}}

**Risk Mitigation Strategies:**
- Multiple sourcing
- Diverse suppliers
- Trusted suppliers
- {{additional_strategies}}

## SR-6 Supplier Assessments and Reviews
**Assessment Frequency:** {{assessment_frequency}}
**Assessment Criteria:**
{{assessment_criteria}}

**Review Process:** {{review_process}}

## SR-7 Supply Chain Operations Security
**OPSEC Practices:**
{{opsec_practices}}

**Information Sharing Controls:** {{info_sharing_controls}}

## SR-8 Notification Agreements
**Incident Notification:** {{incident_notification}}
**Notification Timeline:** {{notification_timeline}}
**Escalation Process:** {{escalation_process}}

## SR-9 Tamper Resistance and Detection
**Tamper Protection:** {{tamper_protection}}
**Tamper Detection:** {{tamper_detection}}

## SR-10 Inspection of Systems or Components
**Inspection Process:** {{inspection_process}}
**Inspection Frequency:** {{inspection_frequency}}
**Inspection Documentation:** {{inspection_documentation}}

## SR-11 Component Authenticity
**Authenticity Verification:**
{{authenticity_verification}}

**Anti-Counterfeit Measures:** {{anticounterfeit_measures}}

## SR-12 Component Disposal
**Disposal Process:** {{disposal_process}}
**Data Sanitization:** {{data_sanitization}}
**Environmental Compliance:** {{environmental_compliance}}

**Document Owner:** {{document_owner}}
**Approved By:** {{approved_by}}
**Effective Date:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      system_name: { type: 'text', label: 'System Name', required: true },
      policy_review_freq: { type: 'select', label: 'Policy Review Frequency', required: true, options: ['Annually', 'Semi-annually', 'Quarterly'] },
      procedure_review_freq: { type: 'select', label: 'Procedure Review Frequency', required: true, options: ['Annually', 'Semi-annually', 'Quarterly'] },
      plan_review_freq: { type: 'select', label: 'Plan Review Frequency', required: true, options: ['Annually', 'Semi-annually', 'Quarterly'] },
      supplier_criteria: { type: 'text', label: 'Supplier Selection Criteria', required: true },
      vendor_assessment_process: { type: 'text', label: 'Vendor Assessment Process', required: true },
      acquisition_strategy: { type: 'text', label: 'Acquisition Strategy', required: true },
      assessment_frequency: { type: 'select', label: 'Assessment Frequency', required: true, options: ['Annually', 'Bi-annually', 'Quarterly'] },
      incident_notification: { type: 'text', label: 'Incident Notification Requirements', required: true },
      notification_timeline: { type: 'text', label: 'Notification Timeline', required: true },
      inspection_frequency: { type: 'select', label: 'Inspection Frequency', required: true, options: ['Upon receipt', 'Annually', 'Random sampling'] },
      disposal_process: { type: 'text', label: 'Component Disposal Process', required: true },
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
  'FedRAMP-Low': [...FedRAMPLowTemplates, ...FedRAMPCoreTemplates],
  'FedRAMP-Moderate': [...FedRAMPModerateTemplates, ...FedRAMPAttachmentTemplates, ...FedRAMPCoreTemplates],
  'FedRAMP-High': [...FedRAMPHighTemplates, ...FedRAMPCoreTemplates],
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
import { DocumentTemplate } from '../types';

export const NIST80053ControlFamilyTemplatesPart3: DocumentTemplate[] = [
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

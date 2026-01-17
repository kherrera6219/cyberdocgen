import { DocumentTemplate } from '../types';

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
      assessment_period: { type: 'text', label: 'Assessment Period', required: true },
      risk_methodology: { type: 'text', label: 'Risk Assessment Methodology', required: true },
      total_controls: { type: 'number', label: 'Total Controls', required: true },
      implemented_controls_count: { type: 'number', label: 'Implemented Controls Count', required: true },
      planned_controls_count: { type: 'number', label: 'Planned Controls Count', required: true },
      na_controls_count: { type: 'number', label: 'N/A Controls Count', required: true },
      ceo_name: { type: 'text', label: 'CEO Name', required: true },
      ceo_signature_date: { type: 'date', label: 'CEO Signature Date', required: true },
      iso_name: { type: 'text', label: 'Information Security Officer Name', required: true },
      iso_signature_date: { type: 'date', label: 'ISO Signature Date', required: true },
      version: { type: 'text', label: 'Version', required: true },
      next_review_date: { type: 'date', label: 'Next Review Date', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true }
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
      authorizing_official_title: { type: 'text', label: 'Authorizing Official Title', required: true },
      memo_date: { type: 'date', label: 'Memorandum Date', required: true },
      classification_level: { type: 'text', label: 'Classification Level', required: true },
      system_id: { type: 'text', label: 'System Identifier', required: true },
      service_model: { type: 'select', label: 'Service Model', required: true, options: ['IaaS', 'PaaS', 'SaaS'] },
      deployment_model: { type: 'select', label: 'Deployment Model', required: true, options: ['Public', 'Private', 'Hybrid', 'Community'] },
      system_description: { type: 'text', label: 'System Description', required: true },
      business_purpose: { type: 'text', label: 'Business Purpose', required: true },
      hosting_environment: { type: 'text', label: 'Hosting Environment', required: true },
      geographic_locations: { type: 'text', label: 'Geographic Locations', required: true },
      system_boundaries: { type: 'text', label: 'System Boundaries', required: true },
      network_architecture: { type: 'text', label: 'Network Architecture', required: true },
      data_types_processed: { type: 'text', label: 'Data Types Processed', required: true },
      three_pao_name: { type: 'text', label: 'Third Party Assessment Organization', required: true },
      assessment_start_date: { type: 'date', label: 'Assessment Start Date', required: true },
      assessment_end_date: { type: 'date', label: 'Assessment End Date', required: true },
      total_controls: { type: 'number', label: 'Total Controls', required: true },
      implemented_controls: { type: 'number', label: 'Implemented Controls', required: true },
      partially_implemented: { type: 'number', label: 'Partially Implemented', required: true },
      not_implemented: { type: 'number', label: 'Not Implemented', required: true },
      not_applicable: { type: 'number', label: 'Not Applicable', required: true },
      ac_controls: { type: 'number', label: 'AC Controls', required: false },
      au_controls: { type: 'number', label: 'AU Controls', required: false },
      ca_controls: { type: 'number', label: 'CA Controls', required: false },
      cm_controls: { type: 'number', label: 'CM Controls', required: false },
      cp_controls: { type: 'number', label: 'CP Controls', required: false },
      ia_controls: { type: 'number', label: 'IA Controls', required: false },
      ir_controls: { type: 'number', label: 'IR Controls', required: false },
      ma_controls: { type: 'number', label: 'MA Controls', required: false },
      mp_controls: { type: 'number', label: 'MP Controls', required: false },
      pe_controls: { type: 'number', label: 'PE Controls', required: false },
      pl_controls: { type: 'number', label: 'PL Controls', required: false },
      ps_controls: { type: 'number', label: 'PS Controls', required: false },
      ra_controls: { type: 'number', label: 'RA Controls', required: false },
      sa_controls: { type: 'number', label: 'SA Controls', required: false },
      sc_controls: { type: 'number', label: 'SC Controls', required: false },
      si_controls: { type: 'number', label: 'SI Controls', required: false },
      overall_risk_rating: { type: 'select', label: 'Overall Risk Rating', required: true, options: ['Low', 'Moderate', 'High'] },
      critical_findings_count: { type: 'number', label: 'Critical Findings', required: true },
      high_findings_count: { type: 'number', label: 'High Findings', required: true },
      medium_findings_count: { type: 'number', label: 'Medium Findings', required: true },
      low_findings_count: { type: 'number', label: 'Low Findings', required: true },
      authorization_type: { type: 'select', label: 'Authorization Recommendation', required: true, options: ['Authority to Operate (ATO)', 'Interim Authority to Operate (IATO)', 'Denial of Authorization'] },
      authorization_effective_date: { type: 'date', label: 'Authorization Effective Date', required: true },
      authorization_expiration_date: { type: 'date', label: 'Authorization Expiration Date', required: true },
      ssp_version: { type: 'text', label: 'SSP Version', required: true },
      poam_version: { type: 'text', label: 'POA&M Version', required: true },
      cp_version: { type: 'text', label: 'Contingency Plan Version', required: true },
      conmon_version: { type: 'text', label: 'ConMon Strategy Version', required: true },
      organization_name: { type: 'text', label: 'Organization Name', required: true },
      signature_date: { type: 'date', label: 'Signature Date', required: true },
      ciso_name: { type: 'text', label: 'CISO Name', required: true },
      ciso_signature_date: { type: 'date', label: 'CISO Signature Date', required: true },
      control_number: { type: 'text', label: 'Control Number', required: true }
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
      auditor_firm_name: { type: 'text', label: 'Auditor Firm Name', required: true },
      management_name: { type: 'text', label: 'Management Representative Name', required: true },
      management_title: { type: 'text', label: 'Management Title', required: true },
      assertion_date: { type: 'date', label: 'Assertion Date', required: true },
      company_name: { type: 'text', label: 'Company Name', required: true },
      service_description: { type: 'text', label: 'Service Description (Short)', required: true },
      applicable_criteria: { type: 'text', label: 'Applicable Criteria', required: true },
      audit_period_start: { type: 'date', label: 'Audit Start Date', required: true },
      audit_period_end: { type: 'date', label: 'Audit End Date', required: true },
      detailed_service_description: { type: 'text', label: 'Detailed Service Description', required: true },
      geographic_coverage: { type: 'text', label: 'Geographic Coverage', required: true },
      company_mission: { type: 'text', label: 'Company Mission', required: true },
      service_commitment_1: { type: 'text', label: 'Service Commitment 1', required: true },
      service_commitment_2: { type: 'text', label: 'Service Commitment 2', required: true },
      service_commitment_3: { type: 'text', label: 'Service Commitment 3', required: false },
      service_commitment_4: { type: 'text', label: 'Service Commitment 4', required: false },
      principal_service_commitments: { type: 'text', label: 'Principal Service Commitments', required: true },
      availability_applicable: { type: 'select', label: 'Availability Applicable?', required: true, options: ['Yes', 'No'] },
      processing_integrity_applicable: { type: 'select', label: 'Processing Integrity Applicable?', required: true, options: ['Yes', 'No'] },
      confidentiality_applicable: { type: 'select', label: 'Confidentiality Applicable?', required: true, options: ['Yes', 'No'] },
      privacy_applicable: { type: 'select', label: 'Privacy Applicable?', required: true, options: ['Yes', 'No'] },
      organizational_structure: { type: 'text', label: 'Organizational Structure Description', required: true },
      ceo_name: { type: 'text', label: 'CEO Name', required: true },
      cto_name: { type: 'text', label: 'CTO Name', required: true },
      ciso_name: { type: 'text', label: 'CISO Name', required: true },
      dpo_name: { type: 'text', label: 'DPO Name', required: true },
      it_ops_manager: { type: 'text', label: 'IT Ops Manager Name', required: true },
      risk_assessment_frequency: { type: 'text', label: 'Risk Assessment Frequency', required: true },
      information_systems_list: { type: 'text', label: 'Information Systems List', required: true },
      internal_audit_frequency: { type: 'text', label: 'Internal Audit Frequency', required: true },
      mgmt_review_frequency: { type: 'text', label: 'Management Review Frequency', required: true },
      significant_changes: { type: 'text', label: 'Significant Changes', required: true },
      subsequent_events: { type: 'text', label: 'Subsequent Events', required: true },
      ceo_signature_date: { type: 'date', label: 'CEO Signature Date', required: true },
      ciso_signature_date: { type: 'date', label: 'CISO Signature Date', required: true },
      cto_signature_date: { type: 'date', label: 'CTO Signature Date', required: true }
    }
  }
];

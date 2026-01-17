import { DocumentTemplate } from '../../types';

export const FedRAMPAttachmentAssessments: DocumentTemplate[] = [
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
      user_base: { type: 'text', label: 'User Base Description', required: true },
      data_types: { type: 'text', label: 'Types of Data Processed', required: true },
      collects_pii: { type: 'select', label: 'Collects PII?', required: true, options: ['Yes', 'No'] },
      pii_description: { type: 'text', label: 'PII Description', required: true },
      pii_name: { type: 'select', label: 'Collects Name?', required: true, options: ['Yes', 'No'] },
      pii_ssn: { type: 'select', label: 'Collects SSN?', required: true, options: ['Yes', 'No'] },
      pii_dob: { type: 'select', label: 'Collects DOB?', required: true, options: ['Yes', 'No'] },
      pii_email: { type: 'select', label: 'Collects Email?', required: true, options: ['Yes', 'No'] },
      pii_phone: { type: 'select', label: 'Collects Phone?', required: true, options: ['Yes', 'No'] },
      pii_address: { type: 'select', label: 'Collects Address?', required: true, options: ['Yes', 'No'] },
      pii_financial: { type: 'select', label: 'Collects Financial Info?', required: true, options: ['Yes', 'No'] },
      pii_medical: { type: 'select', label: 'Collects Medical Info?', required: true, options: ['Yes', 'No'] },
      pii_biometric: { type: 'select', label: 'Collects Biometrics?', required: true, options: ['Yes', 'No'] },
      pii_other: { type: 'text', label: 'Other PII Collected', required: false },
      pii_record_count: { type: 'number', label: 'PII Record Count', required: true },
      individual_count: { type: 'number', label: 'Affected Individuals Count', required: true },
      legal_authority: { type: 'text', label: 'Legal Authority', required: true },
      regulatory_authority: { type: 'text', label: 'Regulatory Authority', required: true },
      collection_purpose: { type: 'text', label: 'Purpose of Collection', required: true },
      pii_use: { type: 'text', label: 'Use of PII', required: true },
      data_minimization: { type: 'select', label: 'Data Minimization Applied?', required: true, options: ['Yes', 'No'] },
      minimization_justification: { type: 'text', label: 'Minimization Justification', required: true },
      external_sharing: { type: 'select', label: 'Shared Externally?', required: true, options: ['Yes', 'No'] },
      sharing_parties: { type: 'text', label: 'Sharing Parties', required: false },
      sharing_purpose: { type: 'text', label: 'Sharing Purpose', required: false },
      sharing_authority: { type: 'text', label: 'Sharing Authority', required: false },
      has_agreements: { type: 'select', label: 'Agreements in Place?', required: true, options: ['Yes', 'No', 'N/A'] },
      agreement_refs: { type: 'text', label: 'Agreement References', required: false },
      provides_notice: { type: 'select', label: 'Notice Provided?', required: true, options: ['Yes', 'No'] },
      notice_location: { type: 'text', label: 'Notice Location', required: false },
      notice_format: { type: 'text', label: 'Notice Format', required: false },
      obtains_consent: { type: 'select', label: 'Consent Obtained?', required: true, options: ['Yes', 'No'] },
      consent_mechanism: { type: 'text', label: 'Consent Mechanism', required: false },
      opt-out_available: { type: 'select', label: 'Opt-out Available?', required: true, options: ['Yes', 'No'] },
      individual_access: { type: 'select', label: 'Access Provided?', required: true, options: ['Yes', 'No'] },
      access_method: { type: 'text', label: 'Access Method', required: false },
      amendment_rights: { type: 'select', label: 'Amendment Rights?', required: true, options: ['Yes', 'No'] },
      correction_process: { type: 'text', label: 'Correction Process', required: false },
      retention_period: { type: 'text', label: 'Retention Period', required: true },
      records_schedule: { type: 'text', label: 'Records Schedule', required: true },
      nara_approved: { type: 'select', label: 'NARA Approved?', required: true, options: ['Yes', 'No'] },
      disposal_method: { type: 'text', label: 'Disposal Method', required: true },
      sanitization_method: { type: 'text', label: 'Sanitization Method', required: true },
      encryption_rest: { type: 'select', label: 'Encrypted At Rest?', required: true, options: ['Yes', 'No'] },
      encryption_transit: { type: 'select', label: 'Encrypted In Transit?', required: true, options: ['Yes', 'No'] },
      access_controls: { type: 'text', label: 'Access Controls', required: true },
      audit_logging: { type: 'select', label: 'Audit Logging?', required: true, options: ['Yes', 'No'] },
      breach_procedures: { type: 'select', label: 'Breach Procedures Included?', required: true, options: ['Yes', 'No'] },
      breach_notification: { type: 'text', label: 'Breach Notification Process', required: true },
      sorn_required: { type: 'select', label: 'SORN Required?', required: true, options: ['Yes', 'No'] },
      sorn_number: { type: 'text', label: 'SORN Number', required: false },
      sorn_date: { type: 'date', label: 'SORN Date', required: false },
      sorn_citation: { type: 'text', label: 'SORN Citation', required: false },
      sorn_exemption: { type: 'text', label: 'SORN Exemption', required: false },
      pia_required: { type: 'select', label: 'PIA Required?', required: true, options: ['Yes', 'No'] },
      trigger_new: { type: 'select', label: 'New PII Collection?', required: true, options: ['Yes', 'No'] },
      trigger_new_notes: { type: 'text', label: 'New Collection Notes', required: false },
      trigger_use: { type: 'select', label: 'New Use?', required: true, options: ['Yes', 'No'] },
      trigger_use_notes: { type: 'text', label: 'New Use Notes', required: false },
      trigger_tech: { type: 'select', label: 'New Technology?', required: true, options: ['Yes', 'No'] },
      trigger_tech_notes: { type: 'text', label: 'New Technology Notes', required: false },
      trigger_sharing: { type: 'select', label: 'New Sharing?', required: true, options: ['Yes', 'No'] },
      trigger_sharing_notes: { type: 'text', label: 'New Sharing Notes', required: false },
      trigger_process: { type: 'select', label: 'New Process?', required: true, options: ['Yes', 'No'] },
      trigger_process_notes: { type: 'text', label: 'New Process Notes', required: false },
      pia_status: { type: 'select', label: 'PIA Status', required: true, options: ['Draft', 'Review', 'Approved', 'Not Required'] },
      next_steps: { type: 'text', label: 'Next Steps', required: true },
      privacy_officer: { type: 'text', label: 'Privacy Officer', required: true },
      privacy_contact: { type: 'text', label: 'Privacy Contact', required: true },
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
    description: 'Attachment 4 - Analysis of PII handling and privacy risks',
    framework: 'FedRAMP-Moderate',
    category: 'assessment',
    priority: 4,
    documentType: 'assessment',
    required: true,
    templateContent: `# Privacy Impact Assessment (PIA)
## FedRAMP SSP Attachment 4

### System Information
**System Name:** {{system_name}}
**PIA Date:** {{pia_date}}
**Privacy Officer:** {{privacy_officer}}

## 1. Introduction
This PIA analyzes how {{system_name}} collects, uses, disseminates, and maintains Personally Identifiable Information (PII).

## 2. PII Analysis
### 2.1 PII Collected
- Data Elements: {{pii_elements}}
- Source(s): {{pii_sources}}
- Collection Method: {{collection_method}}

### 2.2 Purpose and Use
- Primary Purpose: {{primary_purpose}}
- Secondary Uses: {{secondary_uses}}
- Functionality Supported: {{functionality}}

## 3. Privacy Risks and Mitigations
### 3.1 Data Minimization
**Risk:** Excessive collection
**Mitigation:** {{minimization_strategy}}

### 3.2 Access Controls
**Risk:** Unauthorized access
**Mitigation:** {{access_mitigation}}

### 3.3 Data Quality
**Risk:** Inaccurate data
**Mitigation:** {{quality_mitigation}}

## 4. Attributes
- **Notice:** {{notice_procedures}}
- **Choice/Consent:** {{consent_mechanism}}
- **Redress:** {{redress_mechanism}}

**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      pia_date: { type: 'date', label: 'PIA Date', required: true },
      privacy_officer: { type: 'text', label: 'Privacy Officer', required: true },
      pii_elements: { type: 'text', label: 'PII Elements', required: true },
      pii_sources: { type: 'text', label: 'PII Sources', required: true },
      collection_method: { type: 'text', label: 'Collection Method', required: true },
      primary_purpose: { type: 'text', label: 'Primary Purpose', required: true },
      secondary_uses: { type: 'text', label: 'Secondary Uses', required: true },
      functionality: { type: 'text', label: 'Functionality Supported', required: true },
      minimization_strategy: { type: 'text', label: 'Minimization Strategy', required: true },
      access_mitigation: { type: 'text', label: 'Access Mitigation', required: true },
      quality_mitigation: { type: 'text', label: 'Quality Mitigation', required: true },
      notice_procedures: { type: 'text', label: 'Notice Procedures', required: true },
      consent_mechanism: { type: 'text', label: 'Consent Mechanism', required: true },
      redress_mechanism: { type: 'text', label: 'Redress Mechanism', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-att-10',
    title: 'FedRAMP FIPS 199 Security Categorization',
    description: 'Attachment 10 - Security categorization of information and information system',
    framework: 'FedRAMP-Moderate',
    category: 'assessment',
    priority: 10,
    documentType: 'assessment',
    required: true,
    templateContent: `# FIPS 199 Security Categorization
## FedRAMP SSP Attachment 10

### System Information
**System Name:** {{system_name}}
**Categorization Date:** {{categorization_date}}

## 1. Information Types
| Information Type | Confidentiality | Integrity | Availability |
|------------------|-----------------|-----------|--------------|
| {{info_type_1}} | {{conf_1}} | {{int_1}} | {{avail_1}} |
| {{info_type_2}} | {{conf_2}} | {{int_2}} | {{avail_2}} |
| {{info_type_3}} | {{conf_3}} | {{int_3}} | {{avail_3}} |

## 2. Security High Water Mark
- **Confidentiality:** {{high_water_conf}}
- **Integrity:** {{high_water_int}}
- **Availability:** {{high_water_avail}}

**Overall System Categorization:** {{system_category}}

**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      categorization_date: { type: 'date', label: 'Categorization Date', required: true },
      info_type_1: { type: 'text', label: 'Info Type 1', required: true },
      conf_1: { type: 'select', label: 'Confidentiality 1', required: true, options: ['Low', 'Moderate', 'High'] },
      int_1: { type: 'select', label: 'Integrity 1', required: true, options: ['Low', 'Moderate', 'High'] },
      avail_1: { type: 'select', label: 'Availability 1', required: true, options: ['Low', 'Moderate', 'High'] },
      info_type_2: { type: 'text', label: 'Info Type 2', required: false },
      conf_2: { type: 'select', label: 'Confidentiality 2', required: false, options: ['Low', 'Moderate', 'High'] },
      int_2: { type: 'select', label: 'Integrity 2', required: false, options: ['Low', 'Moderate', 'High'] },
      avail_2: { type: 'select', label: 'Availability 2', required: false, options: ['Low', 'Moderate', 'High'] },
      info_type_3: { type: 'text', label: 'Info Type 3', required: false },
      conf_3: { type: 'select', label: 'Confidentiality 3', required: false, options: ['Low', 'Moderate', 'High'] },
      int_3: { type: 'select', label: 'Integrity 3', required: false, options: ['Low', 'Moderate', 'High'] },
      avail_3: { type: 'select', label: 'Availability 3', required: false, options: ['Low', 'Moderate', 'High'] },
      high_water_conf: { type: 'select', label: 'Confidentiality High Water Mark', required: true, options: ['Low', 'Moderate', 'High'] },
      high_water_int: { type: 'select', label: 'Integrity High Water Mark', required: true, options: ['Low', 'Moderate', 'High'] },
      high_water_avail: { type: 'select', label: 'Availability High Water Mark', required: true, options: ['Low', 'Moderate', 'High'] },
      system_category: { type: 'select', label: 'Overall System Categorization', required: true, options: ['Low', 'Moderate', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  }
];

import { DocumentTemplate } from '../types';

export const ExtendedTemplates: DocumentTemplate[] = [
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
{{company_name}} communicates with internal parties regarding matters affecting the functioning of internal control.

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
    id: 'soc2-cc6-1',
    title: 'Logical Access Control Policy',
    description: 'SOC 2 CC6 - Logical access controls and user management',
    framework: 'SOC2',
    category: 'security',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Logical Access Control Policy
## SOC 2 Trust Services - CC6

**Organization:** {{company_name}}
**Version:** {{version}}

## 1. Access Management
**Provisioning:** {{provisioning_process}}
**Approval:** {{approval_required}}
**Deprovisioning:** {{deprovisioning_timeline}}

## 2. Authentication
**Password Minimum:** {{password_min}} characters
**MFA:** {{mfa_required}}
**Session Timeout:** {{session_timeout}}

## 3. Access Review
**Frequency:** {{review_frequency}}
**Owner:** {{review_owner}}

**Policy Owner:** {{policy_owner}}
**Effective:** {{effective_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      provisioning_process: { type: 'text', label: 'Provisioning Process', required: true },
      approval_required: { type: 'text', label: 'Approval Required', required: true },
      deprovisioning_timeline: { type: 'select', label: 'Deprovisioning Timeline', required: true, options: ['Immediate', '24 hours', '48 hours'] },
      password_min: { type: 'number', label: 'Minimum Password Length', required: true },
      mfa_required: { type: 'select', label: 'MFA Required?', required: true, options: ['Yes', 'No', 'Conditional'] },
      session_timeout: { type: 'select', label: 'Session Timeout', required: true, options: ['15 minutes', '30 minutes', '1 hour', '2 hours'] },
      review_frequency: { type: 'select', label: 'Review Frequency', required: true, options: ['Monthly', 'Quarterly', 'Annually'] },
      review_owner: { type: 'text', label: 'Review Owner', required: true },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true }
    }
  },
  {
    id: 'soc2-a1',
    title: 'System Availability Policy',
    description: 'SOC 2 Availability - System uptime and capacity planning',
    framework: 'SOC2',
    category: 'availability',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# System Availability Policy
## SOC 2 - Availability (A1)

**Organization:** {{company_name}}
**Version:** {{version}}

## 1. Availability Target
**SLA:** {{availability_sla}}%
**Monitoring:** {{monitoring_tool}}
**Alerting:** {{alerting_method}}

## 2. Capacity Planning
**Review Frequency:** {{capacity_review}}
**Threshold:** {{capacity_threshold}}%

## 3. Incident Management
**Response Time:** {{response_time}}
**Escalation:** {{escalation_process}}

**Policy Owner:** {{policy_owner}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      availability_sla: { type: 'number', label: 'Availability SLA %', required: true },
      monitoring_tool: { type: 'text', label: 'Monitoring Tool', required: true },
      alerting_method: { type: 'text', label: 'Alerting Method', required: true },
      capacity_review: { type: 'select', label: 'Capacity Review Frequency', required: true, options: ['Weekly', 'Monthly', 'Quarterly'] },
      capacity_threshold: { type: 'number', label: 'Capacity Alert Threshold %', required: true },
      response_time: { type: 'select', label: 'Incident Response Time', required: true, options: ['15 minutes', '1 hour', '4 hours'] },
      escalation_process: { type: 'text', label: 'Escalation Process', required: true },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true }
    }
  },
  {
    id: 'soc2-pi1',
    title: 'Data Processing Integrity Policy',
    description: 'SOC 2 Processing Integrity - Data accuracy and completeness',
    framework: 'SOC2',
    category: 'processing-integrity',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Data Processing Integrity Policy
## SOC 2 - Processing Integrity (PI1)

**Organization:** {{company_name}}
**Version:** {{version}}

## 1. Data Quality
**Validation:** {{validation_controls}}
**Error Handling:** {{error_handling}}
**Completeness Checks:** {{completeness_checks}}

## 2. Processing Controls
**Reconciliation:** {{reconciliation_freq}}
**Audit Trail:** {{audit_trail}}

## 3. Quality Monitoring
**KPIs:** {{quality_kpis}}
**Review:** {{quality_review}}

**Policy Owner:** {{policy_owner}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      validation_controls: { type: 'text', label: 'Validation Controls', required: true },
      error_handling: { type: 'text', label: 'Error Handling', required: true },
      completeness_checks: { type: 'text', label: 'Completeness Checks', required: true },
      reconciliation_freq: { type: 'select', label: 'Reconciliation Frequency', required: true, options: ['Daily', 'Weekly', 'Monthly'] },
      audit_trail: { type: 'select', label: 'Audit Trail Enabled?', required: true, options: ['Yes', 'No'] },
      quality_kpis: { type: 'text', label: 'Quality KPIs', required: true },
      quality_review: { type: 'select', label: 'Quality Review Frequency', required: true, options: ['Weekly', 'Monthly', 'Quarterly'] },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true }
    }
  },
  {
    id: 'soc2-c1',
    title: 'Data Confidentiality Policy',
    description: 'SOC 2 Confidentiality - Protecting confidential information',
    framework: 'SOC2',
    category: 'confidentiality',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Data Confidentiality Policy
## SOC 2 - Confidentiality (C1)

**Organization:** {{company_name}}
**Version:** {{version}}

## 1. Classification
**Confidential Data:** {{confidential_def}}
**Handling:** {{handling_requirements}}
**Storage:** {{storage_requirements}}

## 2. Protection
**Encryption at Rest:** {{encryption_rest}}
**Encryption in Transit:** {{encryption_transit}}
**Access Controls:** {{access_controls}}

## 3. Disclosure
**Authorization:** {{disclosure_auth}}
**NDAs Required:** {{nda_required}}

**Policy Owner:** {{policy_owner}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      confidential_def: { type: 'text', label: 'Confidential Data Definition', required: true },
      handling_requirements: { type: 'text', label: 'Handling Requirements', required: true },
      storage_requirements: { type: 'text', label: 'Storage Requirements', required: true },
      encryption_rest: { type: 'select', label: 'Encryption at Rest?', required: true, options: ['Yes', 'No'] },
      encryption_transit: { type: 'select', label: 'Encryption in Transit?', required: true, options: ['Yes', 'No'] },
      access_controls: { type: 'text', label: 'Access Controls', required: true },
      disclosure_auth: { type: 'text', label: 'Disclosure Authorization', required: true },
      nda_required: { type: 'select', label: 'NDA Required?', required: true, options: ['Yes', 'No', 'Conditional'] },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true }
    }
  },
  {
    id: 'soc2-p1',
    title: 'Privacy Policy',
    description: 'SOC 2 Privacy - Personal information handling and privacy rights',
    framework: 'SOC2',
    category: 'privacy',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Privacy Policy
## SOC 2 - Privacy (P1-P8)

**Organization:** {{company_name}}
**Version:** {{version}}

## 1. Personal Information
**Types Collected:** {{pi_types}}
**Collection Purpose:** {{collection_purpose}}
**Legal Basis:** {{legal_basis}}

## 2. Notice and Consent
**Privacy Notice:** {{notice_provided}}
**Consent:** {{consent_obtained}}
**Opt-Out:** {{opt_out_available}}

## 3. Use and Retention
**Use Limitation:** {{use_limitation}}
**Retention Period:** {{retention_period}}
**Disposal:** {{disposal_method}}

## 4. Individual Rights
**Access:** {{access_rights}}
**Correction:** {{correction_rights}}
**Deletion:** {{deletion_rights}}

## 5. Disclosure
**Third Parties:** {{third_party_sharing}}
**International:** {{international_transfers}}

**Policy Owner:** {{policy_owner}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      pi_types: { type: 'text', label: 'PI Types Collected', required: true },
      collection_purpose: { type: 'text', label: 'Collection Purpose', required: true },
      legal_basis: { type: 'text', label: 'Legal Basis', required: true },
      notice_provided: { type: 'select', label: 'Privacy Notice Provided?', required: true, options: ['Yes', 'No'] },
      consent_obtained: { type: 'select', label: 'Consent Obtained?', required: true, options: ['Yes', 'No', 'Not Required'] },
      opt_out_available: { type: 'select', label: 'Opt-Out Available?', required: true, options: ['Yes', 'No'] },
      use_limitation: { type: 'text', label: 'Use Limitation', required: true },
      retention_period: { type: 'text', label: 'Retention Period', required: true },
      disposal_method: { type: 'text', label: 'Disposal Method', required: true },
      access_rights: { type: 'select', label: 'Access Rights Provided?', required: true, options: ['Yes', 'No'] },
      correction_rights: { type: 'select', label: 'Correction Rights?', required: true, options: ['Yes', 'No'] },
      deletion_rights: { type: 'select', label: 'Deletion Rights?', required: true, options: ['Yes', 'No'] },
      third_party_sharing: { type: 'text', label: 'Third Party Sharing', required: true },
      international_transfers: { type: 'text', label: 'International Transfers', required: true },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true }
    }
  },
  {
    id: 'soc2-change',
    title: 'Change Management Policy',
    description: 'SOC 2 CC8 - System change control procedures',
    framework: 'SOC2',
    category: 'operations',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Change Management Policy
## SOC 2 - CC8

**Organization:** {{company_name}}
**Version:** {{version}}

## 1. Change Types
**Standard:** {{standard_change}}
**Emergency:** {{emergency_change}}
**Normal:** {{normal_change}}

## 2. Change Process
**Request:** {{change_request_process}}
**Approval:** {{approval_process}}
**Testing:** {{testing_requirements}}
**Implementation:** {{implementation_process}}

## 3. Change Review Board
**Members:** {{crb_members}}
**Meeting Frequency:** {{crb_frequency}}

## 4. Rollback
**Rollback Plan:** {{rollback_required}}
**Testing:** {{rollback_testing}}

**Policy Owner:** {{policy_owner}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      standard_change: { type: 'text', label: 'Standard Change Definition', required: true },
      emergency_change: { type: 'text', label: 'Emergency Change Definition', required: true },
      normal_change: { type: 'text', label: 'Normal Change Definition', required: true },
      change_request_process: { type: 'text', label: 'Change Request Process', required: true },
      approval_process: { type: 'text', label: 'Approval Process', required: true },
      testing_requirements: { type: 'text', label: 'Testing Requirements', required: true },
      implementation_process: { type: 'text', label: 'Implementation Process', required: true },
      crb_members: { type: 'text', label: 'Change Review Board Members', required: true },
      crb_frequency: { type: 'select', label: 'CRB Meeting Frequency', required: true, options: ['Weekly', 'Bi-weekly', 'Monthly'] },
      rollback_required: { type: 'select', label: 'Rollback Plan Required?', required: true, options: ['Yes', 'No', 'Conditional'] },
      rollback_testing: { type: 'text', label: 'Rollback Testing', required: true },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true }
    }
  },
  {
    id: 'soc2-incident',
    title: 'Incident Response Policy',
    description: 'SOC 2 CC7 - Security incident response procedures',
    framework: 'SOC2',
    category: 'security',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Incident Response Policy
## SOC 2 - CC7

**Organization:** {{company_name}}
**Version:** {{version}}

## 1. Incident Classification
**Critical:** {{critical_def}}
**High:** {{high_def}}
**Medium:** {{medium_def}}
**Low:** {{low_def}}

## 2. Response Process
**Detection:** {{detection_methods}}
**Containment:** {{containment_process}}
**Eradication:** {{eradication_process}}
**Recovery:** {{recovery_process}}

## 3. Response Team
**IR Lead:** {{ir_lead}}
**Team Members:** {{team_members}}
**On-Call:** {{oncall_schedule}}

## 4. Communication
**Internal:** {{internal_comms}}
**Customer:** {{customer_notification}}
**Timeline:** {{notification_timeline}}

**Policy Owner:** {{policy_owner}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      critical_def: { type: 'text', label: 'Critical Incident Definition', required: true },
      high_def: { type: 'text', label: 'High Incident Definition', required: true },
      medium_def: { type: 'text', label: 'Medium Incident Definition', required: true },
      low_def: { type: 'text', label: 'Low Incident Definition', required: true },
      detection_methods: { type: 'text', label: 'Detection Methods', required: true },
      containment_process: { type: 'text', label: 'Containment Process', required: true },
      eradication_process: { type: 'text', label: 'Eradication Process', required: true },
      recovery_process: { type: 'text', label: 'Recovery Process', required: true },
      ir_lead: { type: 'text', label: 'IR Lead', required: true },
      team_members: { type: 'text', label: 'Team Members', required: true },
      oncall_schedule: { type: 'text', label: 'On-Call Schedule', required: true },
      internal_comms: { type: 'text', label: 'Internal Communications', required: true },
      customer_notification: { type: 'text', label: 'Customer Notification', required: true },
      notification_timeline: { type: 'select', label: 'Notification Timeline', required: true, options: ['Immediately', '24 hours', '72 hours'] },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true }
    }
  },
  {
    id: 'soc2-backup',
    title: 'Backup and Recovery Policy',
    description: 'SOC 2 CC2/A1 - Data backup and recovery procedures',
    framework: 'SOC2',
    category: 'availability',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Backup and Recovery Policy
## SOC 2 - CC2, A1

**Organization:** {{company_name}}
**Version:** {{version}}

## 1. Backup Schedule
**Full Backup:** {{full_backup_freq}}
**Incremental:** {{incremental_freq}}
**Retention:** {{backup_retention}}

## 2. Backup Storage
**Primary:** {{primary_location}}
**Offsite:** {{offsite_location}}
**Encryption:** {{backup_encryption}}

## 3. Recovery
**RTO:** {{rto}}
**RPO:** {{rpo}}
**Testing:** {{recovery_test_freq}}

## 4. Verification
**Integrity Check:** {{integrity_check}}
**Test Restore:** {{test_restore_freq}}

**Policy Owner:** {{policy_owner}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      full_backup_freq: { type: 'select', label: 'Full Backup Frequency', required: true, options: ['Daily', 'Weekly', 'Monthly'] },
      incremental_freq: { type: 'select', label: 'Incremental Frequency', required: true, options: ['Hourly', 'Every 6 hours', 'Daily'] },
      backup_retention: { type: 'select', label: 'Backup Retention', required: true, options: ['30 days', '90 days', '1 year', '7 years'] },
      primary_location: { type: 'text', label: 'Primary Backup Location', required: true },
      offsite_location: { type: 'text', label: 'Offsite Backup Location', required: true },
      backup_encryption: { type: 'select', label: 'Backup Encryption?', required: true, options: ['Yes', 'No'] },
      rto: { type: 'text', label: 'Recovery Time Objective', required: true },
      rpo: { type: 'text', label: 'Recovery Point Objective', required: true },
      recovery_test_freq: { type: 'select', label: 'Recovery Test Frequency', required: true, options: ['Monthly', 'Quarterly', 'Annually'] },
      integrity_check: { type: 'select', label: 'Integrity Check Frequency', required: true, options: ['Daily', 'Weekly', 'Monthly'] },
      test_restore_freq: { type: 'select', label: 'Test Restore Frequency', required: true, options: ['Monthly', 'Quarterly', 'Annually'] },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true }
    }
  },
  {
    id: 'soc2-logging',
    title: 'Log Management and Retention Policy',
    description: 'SOC 2 CC4/CC7 - Security logging and monitoring',
    framework: 'SOC2',
    category: 'security',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Log Management and Retention Policy
## SOC 2 - CC4, CC7

**Organization:** {{company_name}}
**Version:** {{version}}

## 1. Logging Requirements
**Systems:** {{systems_logged}}
**Events:** {{events_logged}}
**Detail Level:** {{log_detail}}

## 2. Log Collection
**Centralization:** {{centralized_logging}}
**SIEM:** {{siem_tool}}
**Real-time:** {{realtime_collection}}

## 3. Log Retention
**Security Logs:** {{security_retention}}
**Audit Logs:** {{audit_retention}}
**Application Logs:** {{app_retention}}

## 4. Log Review
**Frequency:** {{review_frequency}}
**Automated Alerts:** {{automated_alerts}}
**Responsible:** {{review_responsible}}

## 5. Protection
**Integrity:** {{log_integrity}}
**Access Control:** {{log_access}}

**Policy Owner:** {{policy_owner}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      systems_logged: { type: 'text', label: 'Systems Logged', required: true },
      events_logged: { type: 'text', label: 'Events Logged', required: true },
      log_detail: { type: 'select', label: 'Log Detail Level', required: true, options: ['Basic', 'Standard', 'Detailed'] },
      centralized_logging: { type: 'select', label: 'Centralized Logging?', required: true, options: ['Yes', 'No'] },
      siem_tool: { type: 'text', label: 'SIEM Tool', required: true },
      realtime_collection: { type: 'select', label: 'Real-time Collection?', required: true, options: ['Yes', 'No'] },
      security_retention: { type: 'select', label: 'Security Log Retention', required: true, options: ['90 days', '1 year', '7 years'] },
      audit_retention: { type: 'select', label: 'Audit Log Retention', required: true, options: ['90 days', '1 year', '7 years'] },
      app_retention: { type: 'select', label: 'Application Log Retention', required: true, options: ['30 days', '90 days', '1 year'] },
      review_frequency: { type: 'select', label: 'Review Frequency', required: true, options: ['Daily', 'Weekly', 'Monthly'] },
      automated_alerts: { type: 'select', label: 'Automated Alerts Enabled?', required: true, options: ['Yes', 'No'] },
      review_responsible: { type: 'text', label: 'Review Responsible Party', required: true },
      log_integrity: { type: 'text', label: 'Log Integrity Protection', required: true },
      log_access: { type: 'text', label: 'Log Access Controls', required: true },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true }
    }
  },
  {
    id: 'soc2-vulnerability',
    title: 'Vulnerability Management Policy',
    description: 'SOC 2 CC7 - Vulnerability assessment and remediation',
    framework: 'SOC2',
    category: 'security',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Vulnerability Management Policy
## SOC 2 - CC7

**Organization:** {{company_name}}
**Version:** {{version}}

## 1. Vulnerability Scanning
**Frequency:** {{scan_frequency}}
**Scope:** {{scan_scope}}
**Scanner:** {{scan_tool}}

## 2. Assessment
**Authenticated Scans:** {{authenticated_scans}}
**Penetration Testing:** {{pentest_frequency}}

## 3. Remediation
**Critical:** Within {{critical_timeline}}
**High:** Within {{high_timeline}}
**Medium:** Within {{medium_timeline}}
**Low:** Within {{low_timeline}}

## 4. Exceptions
**Process:** {{exception_process}}
**Approval:** {{exception_approval}}

## 5. Reporting
**Frequency:** {{report_frequency}}
**Recipients:** {{report_recipients}}

**Policy Owner:** {{policy_owner}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      scan_frequency: { type: 'select', label: 'Scan Frequency', required: true, options: ['Weekly', 'Monthly', 'Quarterly'] },
      scan_scope: { type: 'text', label: 'Scan Scope', required: true },
      scan_tool: { type: 'text', label: 'Scanning Tool', required: true },
      authenticated_scans: { type: 'select', label: 'Authenticated Scans?', required: true, options: ['Yes', 'No'] },
      pentest_frequency: { type: 'select', label: 'Penetration Test Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] },
      critical_timeline: { type: 'select', label: 'Critical Timeline', required: true, options: ['24 hours', '48 hours', '1 week'] },
      high_timeline: { type: 'select', label: 'High Timeline', required: true, options: ['1 week', '2 weeks', '30 days'] },
      medium_timeline: { type: 'select', label: 'Medium Timeline', required: true, options: ['30 days', '60 days', '90 days'] },
      low_timeline: { type: 'select', label: 'Low Timeline', required: true, options: ['90 days', '180 days', 'Next cycle'] },
      exception_process: { type: 'text', label: 'Exception Process', required: true },
      exception_approval: { type: 'text', label: 'Exception Approval Authority', required: true },
      report_frequency: { type: 'select', label: 'Report Frequency', required: true, options: ['Weekly', 'Monthly', 'Quarterly'] },
      report_recipients: { type: 'text', label: 'Report Recipients', required: true },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true }
    }
  },
  {
    id: 'soc2-data-classification',
    title: 'Data Classification Policy',
    description: 'SOC 2 C1 - Data classification and handling requirements',
    framework: 'SOC2',
    category: 'security',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Data Classification Policy
## SOC 2 Trust Services - C1 (Confidentiality)

**Organization:** {{company_name}}
**Version:** {{version}}
**Effective Date:** {{effective_date}}

## 1. Purpose
This policy establishes data classification levels and handling requirements.

## 2. Classification Levels

### Public Data
**Definition:** {{public_definition}}
**Examples:** {{public_examples}}
**Handling:** No restrictions

### Internal Data
**Definition:** {{internal_definition}}
**Examples:** {{internal_examples}}
**Handling:** {{internal_handling}}

### Confidential Data
**Definition:** {{confidential_definition}}
**Examples:** {{confidential_examples}}
**Handling:** {{confidential_handling}}
**Encryption:** Required in transit and at rest

### Restricted Data
**Definition:** {{restricted_definition}}
**Examples:** {{restricted_examples}}
**Handling:** {{restricted_handling}}
**Access:** Role-based, need-to-know only
**Encryption:** AES-256 or equivalent

## 3. Data Labeling
**Electronic:** {{electronic_labeling}}
**Physical:** {{physical_labeling}}

## 4. Storage Requirements
**Public:** {{public_storage}}
**Internal:** {{internal_storage}}
**Confidential:** {{confidential_storage}}
**Restricted:** {{restricted_storage}}

## 5. Transmission Requirements
**Email:** {{email_requirements}}
**File Transfer:** {{file_transfer_requirements}}
**External Sharing:** {{external_sharing_requirements}}

## 6. Retention and Disposal
**Retention Schedule:** {{retention_schedule}}
**Secure Disposal:** {{disposal_method}}

**Policy Owner:** {{policy_owner}}
**Review Frequency:** {{review_frequency}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      effective_date: { type: 'date', label: 'Effective Date', required: true },
      public_definition: { type: 'text', label: 'Public Data Definition', required: true },
      public_examples: { type: 'text', label: 'Public Data Examples', required: true },
      internal_definition: { type: 'text', label: 'Internal Data Definition', required: true },
      internal_examples: { type: 'text', label: 'Internal Data Examples', required: true },
      internal_handling: { type: 'text', label: 'Internal Handling Requirements', required: true },
      confidential_definition: { type: 'text', label: 'Confidential Data Definition', required: true },
      confidential_examples: { type: 'text', label: 'Confidential Data Examples', required: true },
      confidential_handling: { type: 'text', label: 'Confidential Handling Requirements', required: true },
      restricted_definition: { type: 'text', label: 'Restricted Data Definition', required: true },
      restricted_examples: { type: 'text', label: 'Restricted Data Examples', required: true },
      restricted_handling: { type: 'text', label: 'Restricted Handling Requirements', required: true },
      electronic_labeling: { type: 'text', label: 'Electronic Labeling Method', required: true },
      physical_labeling: { type: 'text', label: 'Physical Labeling Method', required: true },
      public_storage: { type: 'text', label: 'Public Storage Requirements', required: true },
      internal_storage: { type: 'text', label: 'Internal Storage Requirements', required: true },
      confidential_storage: { type: 'text', label: 'Confidential Storage Requirements', required: true },
      restricted_storage: { type: 'text', label: 'Restricted Storage Requirements', required: true },
      email_requirements: { type: 'text', label: 'Email Requirements', required: true },
      file_transfer_requirements: { type: 'text', label: 'File Transfer Requirements', required: true },
      external_sharing_requirements: { type: 'text', label: 'External Sharing Requirements', required: true },
      retention_schedule: { type: 'text', label: 'Retention Schedule', required: true },
      disposal_method: { type: 'text', label: 'Disposal Method', required: true },
      policy_owner: { type: 'text', label: 'Policy Owner', required: true },
      review_frequency: { type: 'select', label: 'Review Frequency', required: true, options: ['Quarterly', 'Semi-annually', 'Annually'] }
    }
  }
];

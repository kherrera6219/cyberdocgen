import { DocumentTemplate } from '../types';

export const CoreTemplates: DocumentTemplate[] = [
  {
    id: 'soc2-001',
    title: 'SOC 2 Policy',
    description: 'Overarching policy document describing the SOC 2 compliance program',
    framework: 'SOC2',
    category: 'policy',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# SOC 2 Compliance Policy

## 1. Introduction
This policy outlines {{company_name}}'s commitment to the Trust Services Criteria (Security, Availability, Processing Integrity, Confidentiality, and Privacy).

## 2. Organization and Management
- **Management Commitment:** Leadership is actively involved in the control environment.
- **Roles and Responsibilities:** Defined in organizational charts and job descriptions.
- **Integrity and Ethical Values:** Code of Conduct is distributed to all employees.

## 3. Communication
- **Internal:** Policies and changes communicated via {{internal_comm_method}}.
- **External:** Issues reported to customers via {{external_comm_method}}.

## 4. Risk Assessment
- Annual risk assessments covering all in-scope systems.
- Identification of threats, vulnerabilities, and potential impacts.
- Management of changes to the risk environment.

## 5. Monitoring
- Continuous monitoring of controls.
- Periodic internal audits.
- Incident response and remediation tracking.

## 6. Control Activities
- **Logical Access:** MFA, strong passwords, periodic access reviews.
- **Physical Access:** Biometrics/keys for data centers (or reliance on cloud provider).
- **System Operations:** Backups, patching, antivirus.
- **Change Management:** Peer review, testing, approval required for all changes.

**Policy Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      internal_comm_method: { type: 'text', label: 'Internal Communication Method', required: true },
      external_comm_method: { type: 'text', label: 'External Communication Method', required: true },
      approved_by: { type: 'text', label: 'Approver Name', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'soc2-002',
    title: 'Control Environment Statement',
    description: 'Documentation of CC1 series controls (COSO Principles 1-5)',
    framework: 'SOC2',
    category: 'CC1-Control-Environment',
    priority: 2,
    documentType: 'standard',
    required: true,
    templateContent: `# Control Environment (CC1)

## CC1.1 - Integrity and Ethical Values
{{company_name}} demonstrates a commitment to integrity and ethical values.
- **Code of Conduct:** Signed by all employees upon hire.
- **Whistleblower Policy:** Anonymous reporting channel available.
- **Background Checks:** Performed for all candidates prior to employment.

## CC1.2 - Board of Directors Independence
The Board of Directors (or advisory board) demonstrates independence from management and exercises oversight of the development and performance of internal control.
- Quarterly board meetings.
- Review of security metrics and incident reports.

## CC1.3 - Management Responsibilities
Management establishes (with board oversight) structures, reporting lines, and appropriate authorities and responsibilities in the pursuit of objectives.
- **Org Chart:** Maintained and updated quarterly: {{org_chart_link}}
- **Segregation of Duties:** Defined for critical financial and engineering tasks.

## CC1.4 - Talent Management
The organization demonstrates a commitment to attract, develop, and retain competent individuals in alignment with objectives.
- Performance reviews conducted {{performance_review_freq}}.
- Security training required annually.

## CC1.5 - Accountability
The organization holds individuals accountable for their internal control responsibilities.
- Disciplinary policy in Employee Handbook.
- accountability for control execution linked to performance goals.

**Document Owner:** {{document_owner}}
**Last Updated:** {{last_updated}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      org_chart_link: { type: 'text', label: 'Link to Org Chart', required: false },
      performance_review_freq: { type: 'text', label: 'Performance Review Frequency', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      last_updated: { type: 'date', label: 'Last Updated', required: true }
    }
  },
  {
    id: 'soc2-003',
    title: 'Logical and Physical Access Policy',
    description: 'Controls for CC6 series (Access Control)',
    framework: 'SOC2',
    category: 'CC6-Logical-and-Physical-Access',
    priority: 3,
    documentType: 'policy',
    required: true,
    templateContent: `# Logical and Physical Access Policy (CC6)

## 1. Logical Access
- **Authentication:** All users must authenticate with unique credentials.
- **Password Policy:** Minimum {{min_password_length}} chars, complexity required.
- **MFA:** Required for all remote access and production environments.
- **MFA Provider:** {{mfa_provider}}

## 2. Provisioning and Deprovisioning
- **New Hires:** Access granted based on role (RBAC). Ticket required: {{ticketing_system}}.
- **Terminations:** Access revoked within 24 hours of separation (immediate for involuntary).

## 3. Access Reviews
- **User Access Review:** Conducted {{access_review_freq}} to ensure appropriate privileges.
- **Privileged Access:** Restricted to authorized engineering personnel.

## 4. Physical Access
- **Office:** Keycard access required. Visitors logged and escorted.
- **Data Center:** We rely on {{cloud_provider}} for physical security of servers. We review their SOC 2 report annually.

**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      min_password_length: { type: 'number', label: 'Min Password Length', required: true },
      mfa_provider: { type: 'text', label: 'MFA Provider', required: true },
      ticketing_system: { type: 'text', label: 'Ticketing System', required: true },
      access_review_freq: { type: 'text', label: 'Access Review Frequency', required: true },
      cloud_provider: { type: 'text', label: 'Cloud Provider (AWS, GCP, Azure)', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'soc2-004',
    title: 'System Operations Procedure',
    description: 'Controls for CC7 series (System Operations)',
    framework: 'SOC2',
    category: 'CC7-System-Operations',
    priority: 4,
    documentType: 'procedure',
    required: true,
    templateContent: `# System Operations Procedure (CC7)

## 1. Vulnerability Management
- **Scanning:** Automated scans performed {{scan_freq}}.
- **Patching:** Critical patches applied within {{patch_sla}} days.

## 2. Incident Response
- **Detection:** Alerts configured in {{monitoring_tool}}.
- **Response:** Follows the Incident Response Plan.
- **Analysis:** Post-mortem required for all Sev-1 incidents.

## 3. Business Continuity / Disaster Recovery
- **Backups:** Encrypted backups taken {{backup_freq}}.
- **Testing:** Restoration tests performed annually.
- **RTO/RPO:** Defined in Business Continuity Plan.

**Document Owner:** {{document_owner}}
**Last Updated:** {{last_updated}}`,
    templateVariables: {
      scan_freq: { type: 'text', label: 'Vulnerability Scan Frequency', required: true },
      patch_sla: { type: 'number', label: 'Critical Patch SLA (days)', required: true },
      monitoring_tool: { type: 'text', label: 'Monitoring Tool', required: true },
      backup_freq: { type: 'text', label: 'Backup Frequency', required: true },
      document_owner: { type: 'text', label: 'Document Owner', required: true },
      last_updated: { type: 'date', label: 'Last Updated', required: true }
    }
  },
  {
    id: 'soc2-005',
    title: 'Change Management Procedure',
    description: 'Controls for CC8 series (Change Management)',
    framework: 'SOC2',
    category: 'CC8-Change-Management',
    priority: 5,
    documentType: 'procedure',
    required: true,
    templateContent: `# Change Management Procedure (CC8)

## 1. Change Lifecycle
All changes to production systems must follow this process:
1.  **Request:** Created in {{ticketing_system}} or Pull Request details.
2.  **Develop:** Code written in feature branch.
3.  **Test:** CI/CD pipeline runs automated tests.
4.  **Review:** Peer review required (GitHub/GitLab approval).
5.  **Deploy:** Automated deployment to production after approval.

## 2. Emergency Changes
- Must be approved verbally by Engineering Manager.
- Documented retroactively within 24 hours.

## 3. Infrastructure as Code
- All infrastructure changes managed via {{iac_tool}} (e.g., Terraform).

**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      ticketing_system: { type: 'text', label: 'Ticketing System', required: true },
      iac_tool: { type: 'text', label: 'IaC Tool', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'soc2-006',
    title: 'Confidentiality Standard',
    description: 'Controls for Confidentiality Criteria (C1 series)',
    framework: 'SOC2',
    category: 'Confidentiality',
    priority: 6,
    documentType: 'standard',
    required: true,
    templateContent: `# Confidentiality Standard

## 1. Data Classification
| Level | Description | Examples |
|-------|-------------|----------|
| **Public** | Information for public consumption | Marketing site |
| **Internal** | Operations info, not sensitive | Company announcements |
| **Confidential** | Sensitive business data | Customer data, PII, Secrets |

## 2. Data Retention
- Customer data retained for {{retention_period}} after contract termination.
- Secure deletion guidelines followed for hardware disposal.

## 3. Encryption
| State | Standard |
|-------|----------|
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

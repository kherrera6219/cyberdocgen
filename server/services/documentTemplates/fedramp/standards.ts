import { DocumentTemplate } from '../types';

export const FedRAMPStandardTemplates: DocumentTemplate[] = [
  {
    id: 'fedramp-rob',
    title: 'FedRAMP Rules of Behavior (RoB)',
    description: 'Acceptable use policy and rules of behavior for system users',
    framework: 'FedRAMP',
    category: 'policy',
    priority: 1,
    documentType: 'policy',
    required: true,
    templateContent: `# Rules of Behavior (RoB)
**System:** {{system_name}}
**Version:** {{version}}

## 1. Introduction
These Rules of Behavior (RoB) outline the responsibilities and expected behavior of all individuals accessing {{system_name}}. Compliance with these rules is mandatory.

## 2. General Responsibilities
- Users must protect their accounts and passwords.
- Users must not share credentials.
- Users must report suspected security incidents immediately.
- Users must complete security awareness training annually.

## 3. Acceptable Use
- System usage is for authorized business purposes only.
- Users shall not process classified information on this system.
- Users shall not install unauthorized software.
- Users shall not bypass security controls.

## 4. Remote Access
- Remote access must use approved methods (VPN, etc.).
- Users must protect remote access devices.
- Users must not access the system from public kiosks.

## 5. Social Engineering Awareness
- Be suspicious of unsolicited emails requesting sensitive info.
- Verify the identity of individuals requesting information.
- Do not click on suspicious links or attachments.

## 6. Incident Reporting
Report all security incidents to:
**Contact:** {{incident_contact}}
**Email:** {{incident_email}}
**Phone:** {{incident_phone}}

## 7. Acknowledgement
I verify that I have read and understand these Rules of Behavior. I understand that violations may result in disciplinary action.

**User Name:** _______________________
**Signature:** _______________________
**Date:** _______________________`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      version: { type: 'text', label: 'Version', required: true },
      incident_contact: { type: 'text', label: 'Incident Contact Name', required: true },
      incident_email: { type: 'text', label: 'Incident Email', required: true },
      incident_phone: { type: 'text', label: 'Incident Phone', required: true }
    }
  },
  {
    id: 'fedramp-cis',
    title: 'Control Implementation Summary (CIS)',
    description: 'FedRAMP Control Implementation Summary template',
    framework: 'FedRAMP',
    category: 'assessment',
    priority: 1,
    documentType: 'report',
    required: true,
    templateContent: `# Control Implementation Summary (CIS)
**System:** {{system_name}}
**Date:** {{document_date}}

## 1. Purpose
The Control Implementation Summary (CIS) provides a high-level overview of the implementation status of all security controls for {{system_name}}.

## 2. Implementation Status Summary
| Control Family | Implemented | Partially Implemented | Planned | Not Applicable |
|----------------|-------------|-----------------------|---------|----------------|
| AC | {{ac_impl}} | {{ac_partial}} | {{ac_planned}} | {{ac_na}} |
| AU | {{au_impl}} | {{au_partial}} | {{au_planned}} | {{au_na}} |
| AT | {{at_impl}} | {{at_partial}} | {{at_planned}} | {{at_na}} |
| CM | {{cm_impl}} | {{cm_partial}} | {{cm_planned}} | {{cm_na}} |
| CP | {{cp_impl}} | {{cp_partial}} | {{cp_planned}} | {{cp_na}} |
| IA | {{ia_impl}} | {{ia_partial}} | {{ia_planned}} | {{ia_na}} |
| IR | {{ir_impl}} | {{ir_partial}} | {{ir_planned}} | {{ir_na}} |
| MA | {{ma_impl}} | {{ma_partial}} | {{ma_planned}} | {{ma_na}} |
| MP | {{mp_impl}} | {{mp_partial}} | {{mp_planned}} | {{mp_na}} |
| PE | {{pe_impl}} | {{pe_partial}} | {{pe_planned}} | {{pe_na}} |
| PL | {{pl_impl}} | {{pl_partial}} | {{pl_planned}} | {{pl_na}} |
| PS | {{ps_impl}} | {{ps_partial}} | {{ps_planned}} | {{ps_na}} |
| RA | {{ra_impl}} | {{ra_partial}} | {{ra_planned}} | {{ra_na}} |
| SA | {{sa_impl}} | {{sa_partial}} | {{sa_planned}} | {{sa_na}} |
| SC | {{sc_impl}} | {{sc_partial}} | {{sc_planned}} | {{sc_na}} |
| SI | {{si_impl}} | {{si_partial}} | {{si_planned}} | {{si_na}} |

## 3. Customer Responsibilities
Controls with customer responsibilities are detailed in the Customer Responsibility Matrix (CRM).

## 4. Control Exceptions
{{control_exceptions}}

**Prepared By:** {{prepared_by}}
**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      document_date: { type: 'date', label: 'Document Date', required: true },
      control_exceptions: { type: 'text', label: 'Control Exceptions', required: false },
      prepared_by: { type: 'text', label: 'Prepared By', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true },
      ac_impl: { type: 'number', label: 'AC Implemented', required: false },
      ac_partial: { type: 'number', label: 'AC Partial', required: false },
      ac_planned: { type: 'number', label: 'AC Planned', required: false },
      ac_na: { type: 'number', label: 'AC N/A', required: false },
      au_impl: { type: 'number', label: 'AU Implemented', required: false },
      au_partial: { type: 'number', label: 'AU Partial', required: false },
      au_planned: { type: 'number', label: 'AU Planned', required: false },
      au_na: { type: 'number', label: 'AU N/A', required: false },
      at_impl: { type: 'number', label: 'AT Implemented', required: false },
      at_partial: { type: 'number', label: 'AT Partial', required: false },
      at_planned: { type: 'number', label: 'AT Planned', required: false },
      at_na: { type: 'number', label: 'AT N/A', required: false },
      cm_impl: { type: 'number', label: 'CM Implemented', required: false },
      cm_partial: { type: 'number', label: 'CM Partial', required: false },
      cm_planned: { type: 'number', label: 'CM Planned', required: false },
      cm_na: { type: 'number', label: 'CM N/A', required: false },
      cp_impl: { type: 'number', label: 'CP Implemented', required: false },
      cp_partial: { type: 'number', label: 'CP Partial', required: false },
      cp_planned: { type: 'number', label: 'CP Planned', required: false },
      cp_na: { type: 'number', label: 'CP N/A', required: false },
      ia_impl: { type: 'number', label: 'IA Implemented', required: false },
      ia_partial: { type: 'number', label: 'IA Partial', required: false },
      ia_planned: { type: 'number', label: 'IA Planned', required: false },
      ia_na: { type: 'number', label: 'IA N/A', required: false },
      ir_impl: { type: 'number', label: 'IR Implemented', required: false },
      ir_partial: { type: 'number', label: 'IR Partial', required: false },
      ir_planned: { type: 'number', label: 'IR Planned', required: false },
      ir_na: { type: 'number', label: 'IR N/A', required: false },
      ma_impl: { type: 'number', label: 'MA Implemented', required: false },
      ma_partial: { type: 'number', label: 'MA Partial', required: false },
      ma_planned: { type: 'number', label: 'MA Planned', required: false },
      ma_na: { type: 'number', label: 'MA N/A', required: false },
      mp_impl: { type: 'number', label: 'MP Implemented', required: false },
      mp_partial: { type: 'number', label: 'MP Partial', required: false },
      mp_planned: { type: 'number', label: 'MP Planned', required: false },
      mp_na: { type: 'number', label: 'MP N/A', required: false },
      pe_impl: { type: 'number', label: 'PE Implemented', required: false },
      pe_partial: { type: 'number', label: 'PE Partial', required: false },
      pe_planned: { type: 'number', label: 'PE Planned', required: false },
      pe_na: { type: 'number', label: 'PE N/A', required: false },
      pl_impl: { type: 'number', label: 'PL Implemented', required: false },
      pl_partial: { type: 'number', label: 'PL Partial', required: false },
      pl_planned: { type: 'number', label: 'PL Planned', required: false },
      pl_na: { type: 'number', label: 'PL N/A', required: false },
      ps_impl: { type: 'number', label: 'PS Implemented', required: false },
      ps_partial: { type: 'number', label: 'PS Partial', required: false },
      ps_planned: { type: 'number', label: 'PS Planned', required: false },
      ps_na: { type: 'number', label: 'PS N/A', required: false },
      ra_impl: { type: 'number', label: 'RA Implemented', required: false },
      ra_partial: { type: 'number', label: 'RA Partial', required: false },
      ra_planned: { type: 'number', label: 'RA Planned', required: false },
      ra_na: { type: 'number', label: 'RA N/A', required: false },
      sa_impl: { type: 'number', label: 'SA Implemented', required: false },
      sa_partial: { type: 'number', label: 'SA Partial', required: false },
      sa_planned: { type: 'number', label: 'SA Planned', required: false },
      sa_na: { type: 'number', label: 'SA N/A', required: false },
      sc_impl: { type: 'number', label: 'SC Implemented', required: false },
      sc_partial: { type: 'number', label: 'SC Partial', required: false },
      sc_planned: { type: 'number', label: 'SC Planned', required: false },
      sc_na: { type: 'number', label: 'SC N/A', required: false },
      si_impl: { type: 'number', label: 'SI Implemented', required: false },
      si_partial: { type: 'number', label: 'SI Partial', required: false },
      si_planned: { type: 'number', label: 'SI Planned', required: false },
      si_na: { type: 'number', label: 'SI N/A', required: false }
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
  }
,
  {
    id: 'fedramp-sc-crypto',
    title: 'FedRAMP SC - Cryptographic Protection',
    description: 'FedRAMP policy for cryptographic controls.',
    framework: 'FedRAMP',
    category: 'SC - System and Communications',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# FedRAMP Cryptographic Protection Policy

## 1. Purpose
Define the use of FIPS-validated cryptography for protecting {{company_name}}'s systems.

## 2. Requirements
- Use FIPS 140-2 (or later) validated cryptographic modules.
- Ensure all remote access and data transmission utilizes strong encryption.

## 3. Codebase Telemetry
*(Any codebase specific cryptography algorithms detected will be detailed in the generated document.)*

**Approved By:** {{approved_by}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true }
    }
  }
,
  {
    id: 'fedramp-ac-policy',
    title: 'FedRAMP AC - Access Control Policy',
    description: 'Manage access to systems and information.',
    framework: 'FedRAMP',
    category: 'AC - Access Control',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# Access Control (AC) Policy\n\n## 1. Purpose\nThe purpose of this policy is to establish controls for access control in accordance with FedRAMP and NIST 800-53 requirements for {{company_name}}.\n\n## 2. Scope\nThis policy applies to all {{company_name}} personnel and information systems operating at the {{impact_level}} impact level.\n\n## 3. Policy Requirements\n{{company_name}} implements the following AC controls:\n- **Baseline Requirements**: Adhere to all {{impact_level}} baseline AC requirements.\n- **Continuous Monitoring**: Continually assess AC controls for effectiveness.\n- **Implementation**: Detailed procedures are maintained in the AC standard operating procedures.\n\n**Approved By:** {{approved_by}}\n**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-at-policy',
    title: 'FedRAMP AT - Awareness and Training Policy',
    description: 'Security awareness and role-based training.',
    framework: 'FedRAMP',
    category: 'AT - Awareness and Training',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# Awareness and Training (AT) Policy\n\n## 1. Purpose\nThe purpose of this policy is to establish controls for awareness and training in accordance with FedRAMP and NIST 800-53 requirements for {{company_name}}.\n\n## 2. Scope\nThis policy applies to all {{company_name}} personnel and information systems operating at the {{impact_level}} impact level.\n\n## 3. Policy Requirements\n{{company_name}} implements the following AT controls:\n- **Baseline Requirements**: Adhere to all {{impact_level}} baseline AT requirements.\n- **Continuous Monitoring**: Continually assess AT controls for effectiveness.\n- **Implementation**: Detailed procedures are maintained in the AT standard operating procedures.\n\n**Approved By:** {{approved_by}}\n**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-au-policy',
    title: 'FedRAMP AU - Audit and Accountability Policy',
    description: 'System auditing and accountability tracking.',
    framework: 'FedRAMP',
    category: 'AU - Audit and Accountability',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# Audit and Accountability (AU) Policy\n\n## 1. Purpose\nThe purpose of this policy is to establish controls for audit and accountability in accordance with FedRAMP and NIST 800-53 requirements for {{company_name}}.\n\n## 2. Scope\nThis policy applies to all {{company_name}} personnel and information systems operating at the {{impact_level}} impact level.\n\n## 3. Policy Requirements\n{{company_name}} implements the following AU controls:\n- **Baseline Requirements**: Adhere to all {{impact_level}} baseline AU requirements.\n- **Continuous Monitoring**: Continually assess AU controls for effectiveness.\n- **Implementation**: Detailed procedures are maintained in the AU standard operating procedures.\n\n**Approved By:** {{approved_by}}\n**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-ca-policy',
    title: 'FedRAMP CA - Security Assessment and Authorization Policy',
    description: 'Assess and monitor security controls.',
    framework: 'FedRAMP',
    category: 'CA - Security Assessment and Authorization',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# Security Assessment and Authorization (CA) Policy\n\n## 1. Purpose\nThe purpose of this policy is to establish controls for security assessment and authorization in accordance with FedRAMP and NIST 800-53 requirements for {{company_name}}.\n\n## 2. Scope\nThis policy applies to all {{company_name}} personnel and information systems operating at the {{impact_level}} impact level.\n\n## 3. Policy Requirements\n{{company_name}} implements the following CA controls:\n- **Baseline Requirements**: Adhere to all {{impact_level}} baseline CA requirements.\n- **Continuous Monitoring**: Continually assess CA controls for effectiveness.\n- **Implementation**: Detailed procedures are maintained in the CA standard operating procedures.\n\n**Approved By:** {{approved_by}}\n**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-cm-policy',
    title: 'FedRAMP CM - Configuration Management Policy',
    description: 'Manage system baseline configurations.',
    framework: 'FedRAMP',
    category: 'CM - Configuration Management',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# Configuration Management (CM) Policy\n\n## 1. Purpose\nThe purpose of this policy is to establish controls for configuration management in accordance with FedRAMP and NIST 800-53 requirements for {{company_name}}.\n\n## 2. Scope\nThis policy applies to all {{company_name}} personnel and information systems operating at the {{impact_level}} impact level.\n\n## 3. Policy Requirements\n{{company_name}} implements the following CM controls:\n- **Baseline Requirements**: Adhere to all {{impact_level}} baseline CM requirements.\n- **Continuous Monitoring**: Continually assess CM controls for effectiveness.\n- **Implementation**: Detailed procedures are maintained in the CM standard operating procedures.\n\n**Approved By:** {{approved_by}}\n**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-cp-policy',
    title: 'FedRAMP CP - Contingency Planning Policy',
    description: 'Plan for system recovery and continuity.',
    framework: 'FedRAMP',
    category: 'CP - Contingency Planning',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# Contingency Planning (CP) Policy\n\n## 1. Purpose\nThe purpose of this policy is to establish controls for contingency planning in accordance with FedRAMP and NIST 800-53 requirements for {{company_name}}.\n\n## 2. Scope\nThis policy applies to all {{company_name}} personnel and information systems operating at the {{impact_level}} impact level.\n\n## 3. Policy Requirements\n{{company_name}} implements the following CP controls:\n- **Baseline Requirements**: Adhere to all {{impact_level}} baseline CP requirements.\n- **Continuous Monitoring**: Continually assess CP controls for effectiveness.\n- **Implementation**: Detailed procedures are maintained in the CP standard operating procedures.\n\n**Approved By:** {{approved_by}}\n**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-ia-policy',
    title: 'FedRAMP IA - Identification and Authentication Policy',
    description: 'Verify identity of users and devices.',
    framework: 'FedRAMP',
    category: 'IA - Identification and Authentication',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# Identification and Authentication (IA) Policy\n\n## 1. Purpose\nThe purpose of this policy is to establish controls for identification and authentication in accordance with FedRAMP and NIST 800-53 requirements for {{company_name}}.\n\n## 2. Scope\nThis policy applies to all {{company_name}} personnel and information systems operating at the {{impact_level}} impact level.\n\n## 3. Policy Requirements\n{{company_name}} implements the following IA controls:\n- **Baseline Requirements**: Adhere to all {{impact_level}} baseline IA requirements.\n- **Continuous Monitoring**: Continually assess IA controls for effectiveness.\n- **Implementation**: Detailed procedures are maintained in the IA standard operating procedures.\n\n**Approved By:** {{approved_by}}\n**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-ir-policy',
    title: 'FedRAMP IR - Incident Response Policy',
    description: 'Detect, respond, and recover from incidents.',
    framework: 'FedRAMP',
    category: 'IR - Incident Response',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# Incident Response (IR) Policy\n\n## 1. Purpose\nThe purpose of this policy is to establish controls for incident response in accordance with FedRAMP and NIST 800-53 requirements for {{company_name}}.\n\n## 2. Scope\nThis policy applies to all {{company_name}} personnel and information systems operating at the {{impact_level}} impact level.\n\n## 3. Policy Requirements\n{{company_name}} implements the following IR controls:\n- **Baseline Requirements**: Adhere to all {{impact_level}} baseline IR requirements.\n- **Continuous Monitoring**: Continually assess IR controls for effectiveness.\n- **Implementation**: Detailed procedures are maintained in the IR standard operating procedures.\n\n**Approved By:** {{approved_by}}\n**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-ma-policy',
    title: 'FedRAMP MA - Maintenance Policy',
    description: 'Perform timely system maintenance.',
    framework: 'FedRAMP',
    category: 'MA - Maintenance',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# Maintenance (MA) Policy\n\n## 1. Purpose\nThe purpose of this policy is to establish controls for maintenance in accordance with FedRAMP and NIST 800-53 requirements for {{company_name}}.\n\n## 2. Scope\nThis policy applies to all {{company_name}} personnel and information systems operating at the {{impact_level}} impact level.\n\n## 3. Policy Requirements\n{{company_name}} implements the following MA controls:\n- **Baseline Requirements**: Adhere to all {{impact_level}} baseline MA requirements.\n- **Continuous Monitoring**: Continually assess MA controls for effectiveness.\n- **Implementation**: Detailed procedures are maintained in the MA standard operating procedures.\n\n**Approved By:** {{approved_by}}\n**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-mp-policy',
    title: 'FedRAMP MP - Media Protection Policy',
    description: 'Protect system media and physical storage.',
    framework: 'FedRAMP',
    category: 'MP - Media Protection',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# Media Protection (MP) Policy\n\n## 1. Purpose\nThe purpose of this policy is to establish controls for media protection in accordance with FedRAMP and NIST 800-53 requirements for {{company_name}}.\n\n## 2. Scope\nThis policy applies to all {{company_name}} personnel and information systems operating at the {{impact_level}} impact level.\n\n## 3. Policy Requirements\n{{company_name}} implements the following MP controls:\n- **Baseline Requirements**: Adhere to all {{impact_level}} baseline MP requirements.\n- **Continuous Monitoring**: Continually assess MP controls for effectiveness.\n- **Implementation**: Detailed procedures are maintained in the MP standard operating procedures.\n\n**Approved By:** {{approved_by}}\n**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-pe-policy',
    title: 'FedRAMP PE - Physical and Environmental Protection Policy',
    description: 'Secure physical facilities and environment.',
    framework: 'FedRAMP',
    category: 'PE - Physical and Environmental Protection',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# Physical and Environmental Protection (PE) Policy\n\n## 1. Purpose\nThe purpose of this policy is to establish controls for physical and environmental protection in accordance with FedRAMP and NIST 800-53 requirements for {{company_name}}.\n\n## 2. Scope\nThis policy applies to all {{company_name}} personnel and information systems operating at the {{impact_level}} impact level.\n\n## 3. Policy Requirements\n{{company_name}} implements the following PE controls:\n- **Baseline Requirements**: Adhere to all {{impact_level}} baseline PE requirements.\n- **Continuous Monitoring**: Continually assess PE controls for effectiveness.\n- **Implementation**: Detailed procedures are maintained in the PE standard operating procedures.\n\n**Approved By:** {{approved_by}}\n**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-pl-policy',
    title: 'FedRAMP PL - Planning Policy',
    description: 'Develop system security plans.',
    framework: 'FedRAMP',
    category: 'PL - Planning',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# Planning (PL) Policy\n\n## 1. Purpose\nThe purpose of this policy is to establish controls for planning in accordance with FedRAMP and NIST 800-53 requirements for {{company_name}}.\n\n## 2. Scope\nThis policy applies to all {{company_name}} personnel and information systems operating at the {{impact_level}} impact level.\n\n## 3. Policy Requirements\n{{company_name}} implements the following PL controls:\n- **Baseline Requirements**: Adhere to all {{impact_level}} baseline PL requirements.\n- **Continuous Monitoring**: Continually assess PL controls for effectiveness.\n- **Implementation**: Detailed procedures are maintained in the PL standard operating procedures.\n\n**Approved By:** {{approved_by}}\n**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-ps-policy',
    title: 'FedRAMP PS - Personnel Security Policy',
    description: 'Screen and secure personnel access.',
    framework: 'FedRAMP',
    category: 'PS - Personnel Security',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# Personnel Security (PS) Policy\n\n## 1. Purpose\nThe purpose of this policy is to establish controls for personnel security in accordance with FedRAMP and NIST 800-53 requirements for {{company_name}}.\n\n## 2. Scope\nThis policy applies to all {{company_name}} personnel and information systems operating at the {{impact_level}} impact level.\n\n## 3. Policy Requirements\n{{company_name}} implements the following PS controls:\n- **Baseline Requirements**: Adhere to all {{impact_level}} baseline PS requirements.\n- **Continuous Monitoring**: Continually assess PS controls for effectiveness.\n- **Implementation**: Detailed procedures are maintained in the PS standard operating procedures.\n\n**Approved By:** {{approved_by}}\n**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-ra-policy',
    title: 'FedRAMP RA - Risk Assessment Policy',
    description: 'Assess operational and organizational risk.',
    framework: 'FedRAMP',
    category: 'RA - Risk Assessment',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# Risk Assessment (RA) Policy\n\n## 1. Purpose\nThe purpose of this policy is to establish controls for risk assessment in accordance with FedRAMP and NIST 800-53 requirements for {{company_name}}.\n\n## 2. Scope\nThis policy applies to all {{company_name}} personnel and information systems operating at the {{impact_level}} impact level.\n\n## 3. Policy Requirements\n{{company_name}} implements the following RA controls:\n- **Baseline Requirements**: Adhere to all {{impact_level}} baseline RA requirements.\n- **Continuous Monitoring**: Continually assess RA controls for effectiveness.\n- **Implementation**: Detailed procedures are maintained in the RA standard operating procedures.\n\n**Approved By:** {{approved_by}}\n**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-sa-policy',
    title: 'FedRAMP SA - System and Services Acquisition Policy',
    description: 'Secure system lifecycle and acquisition.',
    framework: 'FedRAMP',
    category: 'SA - System and Services Acquisition',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# System and Services Acquisition (SA) Policy\n\n## 1. Purpose\nThe purpose of this policy is to establish controls for system and services acquisition in accordance with FedRAMP and NIST 800-53 requirements for {{company_name}}.\n\n## 2. Scope\nThis policy applies to all {{company_name}} personnel and information systems operating at the {{impact_level}} impact level.\n\n## 3. Policy Requirements\n{{company_name}} implements the following SA controls:\n- **Baseline Requirements**: Adhere to all {{impact_level}} baseline SA requirements.\n- **Continuous Monitoring**: Continually assess SA controls for effectiveness.\n- **Implementation**: Detailed procedures are maintained in the SA standard operating procedures.\n\n**Approved By:** {{approved_by}}\n**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-si-policy',
    title: 'FedRAMP SI - System and Information Integrity Policy',
    description: 'Ensure data integrity and flaw remediation.',
    framework: 'FedRAMP',
    category: 'SI - System and Information Integrity',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# System and Information Integrity (SI) Policy\n\n## 1. Purpose\nThe purpose of this policy is to establish controls for system and information integrity in accordance with FedRAMP and NIST 800-53 requirements for {{company_name}}.\n\n## 2. Scope\nThis policy applies to all {{company_name}} personnel and information systems operating at the {{impact_level}} impact level.\n\n## 3. Policy Requirements\n{{company_name}} implements the following SI controls:\n- **Baseline Requirements**: Adhere to all {{impact_level}} baseline SI requirements.\n- **Continuous Monitoring**: Continually assess SI controls for effectiveness.\n- **Implementation**: Detailed procedures are maintained in the SI standard operating procedures.\n\n**Approved By:** {{approved_by}}\n**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  }
,
  {
    id: 'fedramp-pm-policy',
    title: 'FedRAMP PM - Program Management Policy',
    description: 'Information security program management controls.',
    framework: 'FedRAMP',
    category: 'PM - Program Management',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# Program Management (PM) Policy\n\n## 1. Purpose\nThe purpose of this policy is to establish controls for program management in accordance with FedRAMP and NIST 800-53 requirements for {{company_name}}.\n\n## 2. Scope\nThis policy applies to all {{company_name}} personnel and information systems operating at the {{impact_level}} impact level.\n\n## 3. Policy Requirements\n{{company_name}} implements the following PM controls:\n- **Baseline Requirements**: Adhere to all {{impact_level}} baseline PM requirements.\n- **Continuous Monitoring**: Continually assess PM controls for effectiveness.\n- **Implementation**: Detailed procedures are maintained in the PM standard operating procedures.\n\n**Approved By:** {{approved_by}}\n**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-pt-policy',
    title: 'FedRAMP PT - Personally Identifiable Information Processing and Transparency Policy',
    description: 'Privacy and transparency controls for PII.',
    framework: 'FedRAMP',
    category: 'PT - Personally Identifiable Information Processing and Transparency',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# Personally Identifiable Information Processing and Transparency (PT) Policy\n\n## 1. Purpose\nThe purpose of this policy is to establish controls for personally identifiable information processing and transparency in accordance with FedRAMP and NIST 800-53 requirements for {{company_name}}.\n\n## 2. Scope\nThis policy applies to all {{company_name}} personnel and information systems operating at the {{impact_level}} impact level.\n\n## 3. Policy Requirements\n{{company_name}} implements the following PT controls:\n- **Baseline Requirements**: Adhere to all {{impact_level}} baseline PT requirements.\n- **Continuous Monitoring**: Continually assess PT controls for effectiveness.\n- **Implementation**: Detailed procedures are maintained in the PT standard operating procedures.\n\n**Approved By:** {{approved_by}}\n**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-sr-policy',
    title: 'FedRAMP SR - Supply Chain Risk Management Policy',
    description: 'Controls to mitigate supply chain risks.',
    framework: 'FedRAMP',
    category: 'SR - Supply Chain Risk Management',
    priority: 8,
    documentType: 'policy',
    required: true,
    templateContent: `# Supply Chain Risk Management (SR) Policy\n\n## 1. Purpose\nThe purpose of this policy is to establish controls for supply chain risk management in accordance with FedRAMP and NIST 800-53 requirements for {{company_name}}.\n\n## 2. Scope\nThis policy applies to all {{company_name}} personnel and information systems operating at the {{impact_level}} impact level.\n\n## 3. Policy Requirements\n{{company_name}} implements the following SR controls:\n- **Baseline Requirements**: Adhere to all {{impact_level}} baseline SR requirements.\n- **Continuous Monitoring**: Continually assess SR controls for effectiveness.\n- **Implementation**: Detailed procedures are maintained in the SR standard operating procedures.\n\n**Approved By:** {{approved_by}}\n**Date:** {{approval_date}}`,
    templateVariables: {
      company_name: { type: 'text', label: 'Company Name', required: true },
      impact_level: { type: 'select', label: 'Impact Level', required: true, options: ['Low', 'Moderate', 'High'] },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  }
];
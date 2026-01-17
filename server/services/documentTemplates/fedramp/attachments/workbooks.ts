import { DocumentTemplate } from '../../types';

export const FedRAMPAttachmentWorkbooks: DocumentTemplate[] = [
  {
    id: 'fedramp-att-9',
    title: 'FedRAMP Control Implementation Summary (CIS)',
    description: 'Attachment 9 - Summary of control implementation status',
    framework: 'FedRAMP-Moderate',
    category: 'assessment',
    priority: 9,
    documentType: 'workbook',
    required: true,
    templateContent: `# Control Implementation Summary (CIS) Workbook
## FedRAMP SSP Attachment 9

### System Information
**System Name:** {{system_name}}
**Date:** {{document_date}}

## 1. Control Status Summary
| Control Family | Implemented | Planned | Partial | N/A |
|----------------|-------------|---------|---------|-----|
| AC - Access Control | {{ac_impl}} | {{ac_planned}} | {{ac_partial}} | {{ac_na}} |
| AU - Audit and Accountability | {{au_impl}} | {{au_planned}} | {{au_partial}} | {{au_na}} |
| CM - Configuration Management | {{cm_impl}} | {{cm_planned}} | {{cm_partial}} | {{cm_na}} |
| ... | | | | |

## 2. Customer Responsibilities
Controls requiring customer implementation:
{{customer_responsibilities}}

**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      document_date: { type: 'date', label: 'Document Date', required: true },
      ac_impl: { type: 'number', label: 'AC Implemented', required: true },
      ac_planned: { type: 'number', label: 'AC Planned', required: true },
      ac_partial: { type: 'number', label: 'AC Partial', required: true },
      ac_na: { type: 'number', label: 'AC N/A', required: true },
      au_impl: { type: 'number', label: 'AU Implemented', required: true },
      au_planned: { type: 'number', label: 'AU Planned', required: true },
      au_partial: { type: 'number', label: 'AU Partial', required: true },
      au_na: { type: 'number', label: 'AU N/A', required: true },
      cm_impl: { type: 'number', label: 'CM Implemented', required: true },
      cm_planned: { type: 'number', label: 'CM Planned', required: true },
      cm_partial: { type: 'number', label: 'CM Partial', required: true },
      cm_na: { type: 'number', label: 'CM N/A', required: true },
      customer_responsibilities: { type: 'text', label: 'Customer Responsibilities', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  },
  {
    id: 'fedramp-att-13',
    title: 'FedRAMP Integrated Inventory Workbook',
    description: 'Attachment 13 - Complete system inventory',
    framework: 'FedRAMP-Moderate',
    category: 'documentation',
    priority: 13,
    documentType: 'workbook',
    required: true,
    templateContent: `# Integrated Inventory Workbook
## FedRAMP SSP Attachment 13

### System Information
**System Name:** {{system_name}}
**Inventory Date:** {{inventory_date}}

## 1. Hardware Inventory
| Asset Tag | Hostname | IP Address | OS | Location | Owner |
|-----------|----------|------------|----|----------|-------|
| {{asset_id}} | {{hostname}} | {{ip_address}} | {{os_version}} | {{location}} | {{owner}} |

## 2. Software Inventory
| Vendor | Product | Version | License | Function |
|--------|---------|---------|---------|----------|
| {{vendor}} | {{product}} | {{version}} | {{license}} | {{function}} |

## 3. Database Inventory
| Database | Version | Instance | Data Type | Owner |
|----------|---------|----------|-----------|-------|
| {{db_name}} | {{db_version}} | {{db_instance}} | {{data_type}} | {{db_owner}} |

**Approved By:** {{approved_by}}
**Date:** {{approval_date}}`,
    templateVariables: {
      system_name: { type: 'text', label: 'System Name', required: true },
      inventory_date: { type: 'date', label: 'Inventory Date', required: true },
      asset_id: { type: 'text', label: 'Asset Tag', required: true },
      hostname: { type: 'text', label: 'Hostname', required: true },
      ip_address: { type: 'text', label: 'IP Address', required: true },
      os_version: { type: 'text', label: 'OS Version', required: true },
      location: { type: 'text', label: 'Location', required: true },
      owner: { type: 'text', label: 'Asset Owner', required: true },
      vendor: { type: 'text', label: 'Software Vendor', required: true },
      product: { type: 'text', label: 'Product Name', required: true },
      version: { type: 'text', label: 'Software Version', required: true },
      license: { type: 'text', label: 'License Type', required: true },
      function: { type: 'text', label: 'Function', required: true },
      db_name: { type: 'text', label: 'Database Name', required: true },
      db_version: { type: 'text', label: 'Database Version', required: true },
      db_instance: { type: 'text', label: 'Instance Name', required: true },
      data_type: { type: 'text', label: 'Data Type', required: true },
      db_owner: { type: 'text', label: 'Database Owner', required: true },
      approved_by: { type: 'text', label: 'Approved By', required: true },
      approval_date: { type: 'date', label: 'Approval Date', required: true }
    }
  }
];

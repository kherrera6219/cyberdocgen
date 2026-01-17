import { DocumentTemplate } from '../types';

export const ManagementTemplates: DocumentTemplate[] = [
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

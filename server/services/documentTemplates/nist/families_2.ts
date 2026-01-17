import { DocumentTemplate } from '../types';

export const NIST80053ControlFamilyTemplatesPart2: DocumentTemplate[] = [
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
  }
];

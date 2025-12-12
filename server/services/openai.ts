import OpenAI from "openai";
import { logger } from "../utils/logger";
import { type CompanyProfile } from "@shared/schema";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

export interface DocumentTemplate {
  title: string;
  description: string;
  category: string;
  priority: number;
}

export const frameworkTemplates: Record<string, DocumentTemplate[]> = {
  "ISO27001": [
    { title: "Information Security Policy", description: "Main security governance document", category: "policy", priority: 1 },
    { title: "Risk Assessment Matrix", description: "Comprehensive risk analysis", category: "assessment", priority: 2 },
    { title: "Access Control Procedures", description: "User access management guidelines", category: "procedure", priority: 3 },
    { title: "Incident Response Plan", description: "Security incident handling procedures", category: "plan", priority: 4 },
    { title: "Business Continuity Plan", description: "Operational continuity procedures", category: "plan", priority: 5 },
    { title: "Asset Management Policy", description: "Information asset classification and handling", category: "policy", priority: 6 },
    { title: "Supplier Security Assessment", description: "Third-party security evaluation", category: "assessment", priority: 7 },
    { title: "Security Awareness Training", description: "Employee security education program", category: "training", priority: 8 },
    { title: "Vulnerability Management Procedure", description: "System vulnerability handling process", category: "procedure", priority: 9 },
    { title: "Data Classification Standard", description: "Information sensitivity classification", category: "standard", priority: 10 },
    { title: "Network Security Controls", description: "Network protection measures", category: "control", priority: 11 },
    { title: "Physical Security Policy", description: "Physical access and environment security", category: "policy", priority: 12 },
    { title: "Cryptography Policy", description: "Encryption and key management standards", category: "policy", priority: 13 },
    { title: "Security Monitoring Procedures", description: "Continuous security monitoring guidelines", category: "procedure", priority: 14 }
  ],
  "SOC2": [
    { title: "Security Controls Framework", description: "Comprehensive security control implementation", category: "framework", priority: 1 },
    { title: "Availability Controls", description: "System availability management procedures", category: "control", priority: 2 },
    { title: "Processing Integrity Controls", description: "Data processing accuracy measures", category: "control", priority: 3 },
    { title: "Confidentiality Controls", description: "Information confidentiality protection", category: "control", priority: 4 },
    { title: "Privacy Controls", description: "Personal information protection measures", category: "control", priority: 5 },
    { title: "Change Management Procedures", description: "System change control processes", category: "procedure", priority: 6 },
    { title: "Backup and Recovery Plan", description: "Data backup and system recovery procedures", category: "plan", priority: 7 },
    { title: "Vendor Management Policy", description: "Third-party service provider management", category: "policy", priority: 8 },
    { title: "User Access Review Process", description: "Periodic access rights validation", category: "process", priority: 9 },
    { title: "System Monitoring Controls", description: "Continuous system monitoring procedures", category: "control", priority: 10 },
    { title: "Data Retention Policy", description: "Information lifecycle management", category: "policy", priority: 11 },
    { title: "Security Testing Procedures", description: "Regular security assessment processes", category: "procedure", priority: 12 }
  ],
  "FedRAMP": [
    { title: "System Security Plan (SSP)", description: "Comprehensive security plan for federal systems", category: "plan", priority: 1 },
    { title: "Control Implementation Summary", description: "Federal security control implementation details", category: "summary", priority: 2 },
    { title: "Continuous Monitoring Plan", description: "Ongoing security monitoring strategy", category: "plan", priority: 3 },
    { title: "Incident Response Procedures", description: "Federal incident reporting and response", category: "procedure", priority: 4 },
    { title: "Configuration Management Plan", description: "System configuration control procedures", category: "plan", priority: 5 },
    { title: "Contingency Plan", description: "Emergency response and recovery procedures", category: "plan", priority: 6 },
    { title: "Risk Assessment Report", description: "Federal risk analysis and mitigation", category: "report", priority: 7 },
    { title: "Security Assessment Report", description: "Security control assessment results", category: "report", priority: 8 },
    { title: "Plan of Action and Milestones", description: "Security improvement roadmap", category: "plan", priority: 9 },
    { title: "Supply Chain Risk Management Plan", description: "Vendor and supply chain security procedures", category: "plan", priority: 10 },
    { title: "Personnel Security Procedures", description: "Staff security clearance and management", category: "procedure", priority: 11 },
    { title: "Physical and Environmental Protection", description: "Facility security measures", category: "protection", priority: 12 },
    { title: "System and Information Integrity", description: "Data and system integrity controls", category: "control", priority: 13 },
    { title: "Media Protection Procedures", description: "Removable media and storage security", category: "procedure", priority: 14 },
    { title: "Audit and Accountability Controls", description: "System auditing and logging procedures", category: "control", priority: 15 },
    { title: "Identification and Authentication", description: "User identity verification procedures", category: "procedure", priority: 16 },
    { title: "System and Communications Protection", description: "Network and communication security", category: "protection", priority: 17 },
    { title: "Maintenance Procedures", description: "System maintenance and support security", category: "procedure", priority: 18 }
  ],
  "NIST": [
    { title: "Cybersecurity Framework Implementation", description: "NIST CSF adoption and implementation guide", category: "framework", priority: 1 },
    { title: "Identify Function Controls", description: "Asset and risk identification procedures", category: "control", priority: 2 },
    { title: "Protect Function Controls", description: "Protective security measures implementation", category: "control", priority: 3 },
    { title: "Detect Function Controls", description: "Security event detection capabilities", category: "control", priority: 4 },
    { title: "Respond Function Controls", description: "Incident response and mitigation procedures", category: "control", priority: 5 },
    { title: "Recover Function Controls", description: "Recovery and restoration procedures", category: "control", priority: 6 },
    { title: "Asset Management Program", description: "Comprehensive asset inventory and management", category: "program", priority: 7 },
    { title: "Risk Management Strategy", description: "Enterprise risk assessment and management", category: "strategy", priority: 8 },
    { title: "Governance Framework", description: "Cybersecurity governance structure", category: "framework", priority: 9 },
    { title: "Supply Chain Risk Management", description: "Third-party cybersecurity risk management", category: "management", priority: 10 },
    { title: "Workforce Development Plan", description: "Cybersecurity skills and training program", category: "plan", priority: 11 },
    { title: "Technology Infrastructure Security", description: "Technical security architecture", category: "security", priority: 12 },
    { title: "Data Security and Privacy", description: "Information protection and privacy controls", category: "security", priority: 13 },
    { title: "Threat Intelligence Program", description: "Threat detection and intelligence sharing", category: "program", priority: 14 },
    { title: "Vulnerability Management", description: "Systematic vulnerability identification and remediation", category: "management", priority: 15 },
    { title: "Security Metrics and Reporting", description: "Performance measurement and reporting framework", category: "metrics", priority: 16 },
    { title: "Third-Party Risk Assessment", description: "Vendor cybersecurity evaluation procedures", category: "assessment", priority: 17 },
    { title: "Incident Recovery Procedures", description: "Post-incident recovery and lessons learned", category: "procedure", priority: 18 },
    { title: "Business Impact Analysis", description: "Critical function and process analysis", category: "analysis", priority: 19 },
    { title: "Cybersecurity Awareness Program", description: "Organization-wide security education", category: "program", priority: 20 },
    { title: "Identity and Access Management", description: "Comprehensive identity governance", category: "management", priority: 21 },
    { title: "Network Security Architecture", description: "Network segmentation and protection design", category: "architecture", priority: 22 },
    { title: "Cloud Security Framework", description: "Cloud service security implementation", category: "framework", priority: 23 }
  ],
  "FedRAMP-Low": [
    { title: "System Security Plan (SSP)", description: "Comprehensive security plan for federal systems (Low Impact)", category: "plan", priority: 1 },
    { title: "Control Implementation Summary", description: "Federal security control implementation details (Low Baseline)", category: "summary", priority: 2 },
    { title: "Continuous Monitoring Plan", description: "Ongoing security monitoring strategy", category: "plan", priority: 3 },
    { title: "Incident Response Procedures", description: "Federal incident reporting and response", category: "procedure", priority: 4 },
    { title: "Configuration Management Plan", description: "System configuration control procedures", category: "plan", priority: 5 },
    { title: "Contingency Plan", description: "Emergency response and recovery procedures", category: "plan", priority: 6 },
    { title: "Risk Assessment Report", description: "Federal risk analysis and mitigation", category: "report", priority: 7 }
  ],
  "FedRAMP-Moderate": [
    { title: "System Security Plan (SSP)", description: "Comprehensive security plan for federal systems (Moderate Impact)", category: "plan", priority: 1 },
    { title: "Control Implementation Summary", description: "Federal security control implementation details (Moderate Baseline)", category: "summary", priority: 2 },
    { title: "Continuous Monitoring Plan", description: "Ongoing security monitoring strategy with enhanced monitoring", category: "plan", priority: 3 },
    { title: "Incident Response Procedures", description: "Federal incident reporting and response with escalation", category: "procedure", priority: 4 },
    { title: "Configuration Management Plan", description: "Enhanced system configuration control procedures", category: "plan", priority: 5 },
    { title: "Contingency Plan", description: "Emergency response and recovery procedures with RTO/RPO", category: "plan", priority: 6 },
    { title: "Risk Assessment Report", description: "Comprehensive federal risk analysis and mitigation", category: "report", priority: 7 },
    { title: "Security Assessment Report (SAR)", description: "Independent security control assessment results", category: "report", priority: 8 },
    { title: "Plan of Action and Milestones (POA&M)", description: "Security improvement roadmap and tracking", category: "plan", priority: 9 },
    { title: "Supply Chain Risk Management Plan", description: "Vendor and supply chain security procedures", category: "plan", priority: 10 },
    { title: "Personnel Security Procedures", description: "Staff security clearance and management", category: "procedure", priority: 11 },
    { title: "Rules of Behavior", description: "User responsibilities and acceptable use policy", category: "policy", priority: 12 }
  ],
  "FedRAMP-High": [
    { title: "System Security Plan (SSP) - High Impact", description: "Comprehensive security plan for high-impact federal systems with full NIST 800-53 controls", category: "plan", priority: 1 },
    { title: "Control Implementation Summary - High Baseline", description: "Detailed implementation of all high baseline controls", category: "summary", priority: 2 },
    { title: "Continuous Monitoring Strategy", description: "Advanced continuous monitoring with real-time threat detection", category: "plan", priority: 3 },
    { title: "Incident Response Plan - High Impact", description: "Advanced incident response with federal reporting requirements", category: "plan", priority: 4 },
    { title: "Configuration Management Plan - High Controls", description: "Stringent configuration baseline and change control", category: "plan", priority: 5 },
    { title: "Contingency Planning - High Availability", description: "Business continuity with strict RTO/RPO requirements", category: "plan", priority: 6 },
    { title: "Disaster Recovery Plan", description: "Comprehensive disaster recovery procedures and testing", category: "plan", priority: 7 },
    { title: "Risk Assessment Report - High Impact", description: "Detailed federal risk analysis with enhanced threat modeling", category: "report", priority: 8 },
    { title: "Security Assessment Report (SAR) - High", description: "Comprehensive independent security assessment", category: "report", priority: 9 },
    { title: "Plan of Action and Milestones (POA&M)", description: "Detailed security remediation tracking and milestones", category: "plan", priority: 10 },
    { title: "Supply Chain Risk Management - Enhanced", description: "Advanced vendor security and supply chain risk procedures", category: "plan", priority: 11 },
    { title: "Personnel Security Policy - High Impact", description: "Enhanced staff clearance, background checks, and insider threat", category: "policy", priority: 12 },
    { title: "Physical and Environmental Protection Plan", description: "Advanced facility security and environmental controls", category: "plan", priority: 13 },
    { title: "System and Information Integrity Policy", description: "Comprehensive data and system integrity controls", category: "policy", priority: 14 },
    { title: "Media Protection Procedures - High Security", description: "Strict removable media and data sanitization procedures", category: "procedure", priority: 15 },
    { title: "Audit and Accountability Framework", description: "Comprehensive logging, monitoring, and audit procedures", category: "framework", priority: 16 },
    { title: "Identification and Authentication Policy - Multi-Factor", description: "Advanced identity verification with PKI and MFA", category: "policy", priority: 17 },
    { title: "System and Communications Protection", description: "Advanced encryption, network segmentation, and boundary protection", category: "protection", priority: 18 },
    { title: "Maintenance and Support Procedures", description: "Secure system maintenance with vendor oversight", category: "procedure", priority: 19 },
    { title: "Security Assessment and Authorization (SA&A) Package", description: "Complete authorization package documentation", category: "package", priority: 20 },
    { title: "Privacy Impact Assessment (PIA)", description: "Comprehensive privacy analysis for PII/PHI handling", category: "assessment", priority: 21 },
    { title: "FIPS 140-2 Compliance Documentation", description: "Federal cryptographic module validation documentation", category: "compliance", priority: 22 },
    { title: "Rules of Behavior - High Security", description: "Strict user responsibilities and acceptable use policy", category: "policy", priority: 23 },
    { title: "Security Control Traceability Matrix", description: "Complete mapping of controls to requirements", category: "matrix", priority: 24 },
    { title: "System Interconnection Agreements", description: "Documented interconnections and trust relationships", category: "agreement", priority: 25 }
  ],
  "ISO27001-2022": [
    { title: "Information Security Policy", description: "Top-level security governance document (A.5.1)", category: "policy", priority: 1 },
    { title: "Information Security Roles and Responsibilities", description: "Security responsibilities assignment (A.5.2)", category: "policy", priority: 2 },
    { title: "Segregation of Duties", description: "Duties separation to prevent fraud (A.5.3)", category: "policy", priority: 3 },
    { title: "Management Responsibilities", description: "Leadership commitment and direction (A.5.4)", category: "policy", priority: 4 },
    { title: "Contact with Authorities", description: "Procedures for engaging authorities (A.5.5)", category: "procedure", priority: 5 },
    { title: "Contact with Special Interest Groups", description: "Engagement with security forums (A.5.6)", category: "procedure", priority: 6 },
    { title: "Threat Intelligence", description: "Security threat monitoring and analysis (A.5.7)", category: "procedure", priority: 7 },
    { title: "Information Security in Project Management", description: "Security integration in projects (A.5.8)", category: "procedure", priority: 8 },
    { title: "Inventory of Information and Assets", description: "Complete asset inventory (A.5.9)", category: "inventory", priority: 9 },
    { title: "Acceptable Use of Assets", description: "Asset usage policy (A.5.10)", category: "policy", priority: 10 },
    { title: "Return of Assets", description: "Asset return procedures (A.5.11)", category: "procedure", priority: 11 },
    { title: "Classification of Information", description: "Information sensitivity classification (A.5.12)", category: "standard", priority: 12 },
    { title: "Labelling of Information", description: "Information labeling requirements (A.5.13)", category: "standard", priority: 13 },
    { title: "Information Transfer", description: "Secure information transfer procedures (A.5.14)", category: "procedure", priority: 14 },
    { title: "Access Control Policy", description: "Access management governance (A.5.15)", category: "policy", priority: 15 },
    { title: "Identity Management", description: "User identity lifecycle management (A.5.16)", category: "procedure", priority: 16 },
    { title: "Authentication Information", description: "Credential management procedures (A.5.17)", category: "procedure", priority: 17 },
    { title: "Access Rights", description: "Access provisioning and review (A.5.18)", category: "procedure", priority: 18 },
    { title: "Information Security in Supplier Relationships", description: "Third-party security requirements (A.5.19)", category: "policy", priority: 19 },
    { title: "Addressing Security in Supplier Agreements", description: "Contractual security controls (A.5.20)", category: "template", priority: 20 },
    { title: "Managing Security in ICT Supply Chain", description: "Supply chain risk management (A.5.21)", category: "procedure", priority: 21 },
    { title: "Monitoring and Review of Supplier Services", description: "Vendor performance monitoring (A.5.22)", category: "procedure", priority: 22 },
    { title: "Information Security for Cloud Services", description: "Cloud security requirements (A.5.23)", category: "policy", priority: 23 },
    { title: "Planning and Preparing for Incident Management", description: "Incident response preparation (A.5.24)", category: "plan", priority: 24 },
    { title: "Assessment and Decision on Information Security Events", description: "Event triage procedures (A.5.25)", category: "procedure", priority: 25 },
    { title: "Response to Information Security Incidents", description: "Incident response procedures (A.5.26)", category: "procedure", priority: 26 },
    { title: "Learning from Information Security Incidents", description: "Post-incident analysis (A.5.27)", category: "procedure", priority: 27 },
    { title: "Collection of Evidence", description: "Forensic evidence handling (A.5.28)", category: "procedure", priority: 28 },
    { title: "Information Security During Disruption", description: "Business continuity for security (A.5.29)", category: "plan", priority: 29 },
    { title: "ICT Readiness for Business Continuity", description: "Technology resilience planning (A.5.30)", category: "plan", priority: 30 },
    { title: "Legal, Statutory, Regulatory Requirements", description: "Compliance obligations mapping (A.5.31)", category: "assessment", priority: 31 },
    { title: "Intellectual Property Rights", description: "IP protection procedures (A.5.32)", category: "policy", priority: 32 },
    { title: "Protection of Records", description: "Record retention and protection (A.5.33)", category: "procedure", priority: 33 },
    { title: "Privacy and PII Protection", description: "Personal data protection controls (A.5.34)", category: "policy", priority: 34 },
    { title: "Independent Review of Information Security", description: "Security program audit (A.5.35)", category: "assessment", priority: 35 },
    { title: "Compliance with Policies and Standards", description: "Policy compliance verification (A.5.36)", category: "procedure", priority: 36 },
    { title: "Documented Operating Procedures", description: "IT operations documentation (A.5.37)", category: "procedure", priority: 37 },
    { title: "Physical Security Perimeters", description: "Facility security boundaries (A.7.1)", category: "policy", priority: 38 },
    { title: "Physical Entry Controls", description: "Access control to facilities (A.7.2)", category: "procedure", priority: 39 },
    { title: "Securing Offices and Facilities", description: "Workspace security measures (A.7.3)", category: "standard", priority: 40 },
    { title: "Physical Security Monitoring", description: "Facility surveillance procedures (A.7.4)", category: "procedure", priority: 41 },
    { title: "User Endpoint Devices", description: "Endpoint security requirements (A.8.1)", category: "standard", priority: 42 },
    { title: "Privileged Access Rights", description: "Admin access management (A.8.2)", category: "procedure", priority: 43 },
    { title: "Information Access Restriction", description: "Need-to-know access controls (A.8.3)", category: "policy", priority: 44 },
    { title: "Access to Source Code", description: "Source code protection (A.8.4)", category: "procedure", priority: 45 },
    { title: "Secure Authentication", description: "Authentication mechanisms (A.8.5)", category: "standard", priority: 46 },
    { title: "Capacity Management", description: "Resource planning and monitoring (A.8.6)", category: "procedure", priority: 47 },
    { title: "Protection Against Malware", description: "Anti-malware controls (A.8.7)", category: "procedure", priority: 48 },
    { title: "Management of Technical Vulnerabilities", description: "Vulnerability management program (A.8.8)", category: "procedure", priority: 49 },
    { title: "Configuration Management", description: "Configuration baseline controls (A.8.9)", category: "procedure", priority: 50 },
    { title: "Information Deletion", description: "Secure data disposal (A.8.10)", category: "procedure", priority: 51 },
    { title: "Data Masking", description: "Data anonymization procedures (A.8.11)", category: "procedure", priority: 52 },
    { title: "Data Leakage Prevention", description: "DLP controls implementation (A.8.12)", category: "procedure", priority: 53 },
    { title: "Information Backup", description: "Backup and recovery procedures (A.8.13)", category: "procedure", priority: 54 },
    { title: "Redundancy of Information Processing", description: "System redundancy requirements (A.8.14)", category: "standard", priority: 55 },
    { title: "Logging", description: "Event logging requirements (A.8.15)", category: "standard", priority: 56 },
    { title: "Monitoring Activities", description: "Security monitoring procedures (A.8.16)", category: "procedure", priority: 57 },
    { title: "Clock Synchronization", description: "Time synchronization requirements (A.8.17)", category: "standard", priority: 58 },
    { title: "Use of Privileged Utility Programs", description: "System utility access controls (A.8.18)", category: "procedure", priority: 59 },
    { title: "Installation of Software on Operational Systems", description: "Software deployment controls (A.8.19)", category: "procedure", priority: 60 },
    { title: "Networks Security", description: "Network protection controls (A.8.20)", category: "standard", priority: 61 },
    { title: "Security of Network Services", description: "Network service security requirements (A.8.21)", category: "standard", priority: 62 },
    { title: "Segregation of Networks", description: "Network segmentation design (A.8.22)", category: "standard", priority: 63 },
    { title: "Web Filtering", description: "Web access controls (A.8.23)", category: "procedure", priority: 64 },
    { title: "Use of Cryptography", description: "Encryption policy and standards (A.8.24)", category: "policy", priority: 65 },
    { title: "Secure Development Life Cycle", description: "Security in SDLC (A.8.25)", category: "procedure", priority: 66 },
    { title: "Application Security Requirements", description: "Application security standards (A.8.26)", category: "standard", priority: 67 },
    { title: "Secure System Architecture", description: "Security architecture principles (A.8.27)", category: "standard", priority: 68 },
    { title: "Secure Coding", description: "Secure coding guidelines (A.8.28)", category: "standard", priority: 69 },
    { title: "Security Testing in Development", description: "DevSecOps testing procedures (A.8.29)", category: "procedure", priority: 70 },
    { title: "Outsourced Development", description: "Third-party development security (A.8.30)", category: "policy", priority: 71 },
    { title: "Separation of Development and Production", description: "Environment segregation controls (A.8.31)", category: "standard", priority: 72 },
    { title: "Change Management", description: "Change control procedures (A.8.32)", category: "procedure", priority: 73 },
    { title: "Test Information", description: "Test data management (A.8.33)", category: "procedure", priority: 74 },
    { title: "Protection of Information Systems During Audit", description: "Audit safeguards (A.8.34)", category: "procedure", priority: 75 }
  ],
  "SOC2-Type1": [
    { title: "Type 1 System Description", description: "Point-in-time system description and boundaries", category: "description", priority: 1 },
    { title: "Security Policy Framework - Type 1", description: "Security policies at point-in-time", category: "framework", priority: 2 },
    { title: "Risk Assessment - Point-in-Time", description: "Current state risk assessment", category: "assessment", priority: 3 },
    { title: "Access Control Design", description: "Designed access control procedures", category: "control", priority: 4 },
    { title: "Logical and Physical Access Controls", description: "Access control implementation documentation", category: "control", priority: 5 },
    { title: "System Operations Documentation", description: "Current operational procedures", category: "documentation", priority: 6 },
    { title: "Change Management Design", description: "Change control process design", category: "design", priority: 7 },
    { title: "Availability Controls Design", description: "System availability control design (if applicable)", category: "control", priority: 8 },
    { title: "Processing Integrity Design", description: "Data processing control design (if applicable)", category: "control", priority: 9 },
    { title: "Confidentiality Controls Design", description: "Information protection design (if applicable)", category: "control", priority: 10 },
    { title: "Privacy Controls Design", description: "Privacy protection design (if applicable)", category: "control", priority: 11 },
    { title: "Vendor Management Policy", description: "Third-party oversight procedures", category: "policy", priority: 12 },
    { title: "Incident Response Plan Design", description: "Incident handling procedures design", category: "plan", priority: 13 },
    { title: "Business Continuity Plan Design", description: "Continuity planning documentation", category: "plan", priority: 14 }
  ],
  "SOC2-Type2": [
    { title: "Type 2 System Description with Period Coverage", description: "System description covering audit period (6-12 months)", category: "description", priority: 1 },
    { title: "Security Controls Framework - Operating Effectiveness", description: "Evidence of security controls over time", category: "framework", priority: 2 },
    { title: "Continuous Risk Assessment Report", description: "Risk assessment activities over audit period", category: "assessment", priority: 3 },
    { title: "Access Control Operating Evidence", description: "Access control effectiveness over time", category: "evidence", priority: 4 },
    { title: "User Access Reviews - Periodic Evidence", description: "Regular access review documentation", category: "evidence", priority: 5 },
    { title: "System Operations Logs and Monitoring", description: "Continuous monitoring evidence", category: "evidence", priority: 6 },
    { title: "Change Management Log and Evidence", description: "Change control execution over audit period", category: "evidence", priority: 7 },
    { title: "Availability Metrics and Evidence", description: "Uptime and availability data (if applicable)", category: "metrics", priority: 8 },
    { title: "Processing Integrity Testing Results", description: "Data processing accuracy evidence (if applicable)", category: "evidence", priority: 9 },
    { title: "Confidentiality Control Testing", description: "Confidentiality protection evidence (if applicable)", category: "evidence", priority: 10 },
    { title: "Privacy Control Operating Effectiveness", description: "Privacy protection evidence over time (if applicable)", category: "evidence", priority: 11 },
    { title: "Vendor Management Activities Log", description: "Third-party oversight evidence", category: "log", priority: 12 },
    { title: "Incident Response Activities", description: "Incident handling and resolution evidence", category: "log", priority: 13 },
    { title: "Security Testing and Penetration Test Results", description: "Regular security assessment evidence", category: "report", priority: 14 },
    { title: "Backup and Recovery Testing Evidence", description: "Backup effectiveness validation", category: "evidence", priority: 15 },
    { title: "Security Awareness Training Records", description: "Employee training completion evidence", category: "records", priority: 16 },
    { title: "Vulnerability Scanning Results", description: "Regular vulnerability assessment evidence", category: "report", priority: 17 },
    { title: "System Configuration Reviews", description: "Configuration management evidence", category: "evidence", priority: 18 }
  ],
  "NIST-800-53": [
    { title: "NIST 800-53 Security Control Baseline Selection", description: "Control baseline selection and tailoring documentation", category: "baseline", priority: 1 },
    { title: "Access Control (AC) Family Implementation", description: "Complete AC control family documentation", category: "control-family", priority: 2 },
    { title: "Awareness and Training (AT) Family Implementation", description: "Security awareness and training program", category: "control-family", priority: 3 },
    { title: "Audit and Accountability (AU) Family Implementation", description: "Logging and audit trail procedures", category: "control-family", priority: 4 },
    { title: "Assessment and Authorization (CA) Family Implementation", description: "Security assessment and authorization procedures", category: "control-family", priority: 5 },
    { title: "Configuration Management (CM) Family Implementation", description: "Configuration baseline and change management", category: "control-family", priority: 6 },
    { title: "Contingency Planning (CP) Family Implementation", description: "Business continuity and disaster recovery", category: "control-family", priority: 7 },
    { title: "Identification and Authentication (IA) Family Implementation", description: "Identity verification and authentication controls", category: "control-family", priority: 8 },
    { title: "Incident Response (IR) Family Implementation", description: "Security incident handling procedures", category: "control-family", priority: 9 },
    { title: "Maintenance (MA) Family Implementation", description: "System maintenance and support security", category: "control-family", priority: 10 },
    { title: "Media Protection (MP) Family Implementation", description: "Removable media and data sanitization", category: "control-family", priority: 11 },
    { title: "Physical and Environmental Protection (PE) Family Implementation", description: "Facility and environmental security controls", category: "control-family", priority: 12 },
    { title: "Planning (PL) Family Implementation", description: "Security planning and system security plans", category: "control-family", priority: 13 },
    { title: "Program Management (PM) Family Implementation", description: "Information security program management", category: "control-family", priority: 14 },
    { title: "Personnel Security (PS) Family Implementation", description: "Personnel security policies and procedures", category: "control-family", priority: 15 },
    { title: "PII Processing and Transparency (PT) Family Implementation", description: "Privacy and PII protection controls", category: "control-family", priority: 16 },
    { title: "Risk Assessment (RA) Family Implementation", description: "Risk assessment and management procedures", category: "control-family", priority: 17 },
    { title: "System and Services Acquisition (SA) Family Implementation", description: "Acquisition and development security", category: "control-family", priority: 18 },
    { title: "System and Communications Protection (SC) Family Implementation", description: "Network and communications security", category: "control-family", priority: 19 },
    { title: "System and Information Integrity (SI) Family Implementation", description: "System integrity and malware protection", category: "control-family", priority: 20 },
    { title: "Supply Chain Risk Management (SR) Family Implementation", description: "Supply chain security controls", category: "control-family", priority: 21 },
    { title: "Security Control Traceability Matrix", description: "Complete control mapping and implementation status", category: "matrix", priority: 22 },
    { title: "Control Enhancement Implementation Guide", description: "Documentation for selected control enhancements", category: "guide", priority: 23 },
    { title: "Continuous Monitoring Strategy", description: "ISCM program implementation", category: "strategy", priority: 24 },
    { title: "Plan of Action and Milestones (POA&M)", description: "Security weakness remediation tracking", category: "plan", priority: 25 }
  ]
};

export async function generateDocument(
  template: DocumentTemplate,
  companyProfile: CompanyProfile,
  framework: string
): Promise<string> {
  const systemPrompt = `You are a cybersecurity compliance expert specializing in ${framework}. Generate comprehensive, professional compliance documentation that meets industry standards and regulatory requirements.

The document should be:
- Detailed and actionable
- Specific to the company's profile and industry
- Compliant with ${framework} standards
- Professional in tone and structure
- Include specific implementation guidance
- Contain measurable objectives and controls

Company Profile Context:
- Company: ${companyProfile.companyName}
- Industry: ${companyProfile.industry}
- Size: ${companyProfile.companySize}
- Location: ${companyProfile.headquarters}
- Cloud Infrastructure: ${companyProfile.cloudInfrastructure.join(', ')}
- Data Classification: ${companyProfile.dataClassification}
- Business Applications: ${companyProfile.businessApplications}

Document Requirements:
- Title: ${template.title}
- Category: ${template.category}
- Framework: ${framework}

Generate a complete, professional document with sections including:
1. Purpose and Scope
2. Policy/Procedure Statement
3. Roles and Responsibilities
4. Implementation Guidelines
5. Compliance Requirements
6. Review and Update Procedures
7. Related Documents/References

Format the response as a structured document with clear headings and detailed content.`;

  const userPrompt = `Generate a comprehensive ${template.title} document for ${companyProfile.companyName}. 

This document should be tailored specifically for:
- A ${companyProfile.companySize} ${companyProfile.industry} company
- Using ${companyProfile.cloudInfrastructure.join(' and ')} infrastructure
- Handling ${companyProfile.dataClassification} data
- With the following business applications: ${companyProfile.businessApplications}

The document must comply with ${framework} standards and include specific, actionable guidance that ${companyProfile.companyName} can implement immediately.

Make the document practical and implementable, with specific controls, procedures, and measurable objectives that align with ${framework} requirements.`;

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-5.1",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 4000,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    logger.error("Error generating document:", error);
    throw new Error(`Failed to generate document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateComplianceDocuments(
  companyProfile: CompanyProfile,
  framework: string,
  onProgress?: (progress: number, current: string) => void
): Promise<string[]> {
  const templates = frameworkTemplates[framework];
  if (!templates) {
    throw new Error(`No templates found for framework: ${framework}`);
  }

  const documents: string[] = [];
  const total = templates.length;

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const progress = Math.round(((i + 1) / total) * 100);
    
    if (onProgress) {
      onProgress(progress, template.title);
    }

    try {
      const content = await generateDocument(template, companyProfile, framework);
      documents.push(content);
      
      // Add small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error(`Error generating ${template.title}:`, error);
      // Continue with other documents even if one fails
      documents.push(`Error generating ${template.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return documents;
}

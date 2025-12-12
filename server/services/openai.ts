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
  ],
  "NIST-CSF": [
    { title: "NIST CSF Implementation Roadmap", description: "Strategic framework adoption and implementation plan", category: "roadmap", priority: 1 },
    { title: "Current State Assessment", description: "Cybersecurity maturity baseline evaluation", category: "assessment", priority: 2 },
    { title: "Target State Definition", description: "Desired cybersecurity posture and goals", category: "definition", priority: 3 },
    { title: "Gap Analysis Report", description: "Current vs target state gap identification", category: "report", priority: 4 },
    { title: "IDENTIFY - Asset Management (ID.AM)", description: "Hardware, software, data, and personnel inventory", category: "identify", priority: 5 },
    { title: "IDENTIFY - Business Environment (ID.BE)", description: "Mission, objectives, stakeholders, and activities", category: "identify", priority: 6 },
    { title: "IDENTIFY - Governance (ID.GV)", description: "Policies, procedures, and regulatory requirements", category: "identify", priority: 7 },
    { title: "IDENTIFY - Risk Assessment (ID.RA)", description: "Organizational risk identification and analysis", category: "identify", priority: 8 },
    { title: "IDENTIFY - Risk Management Strategy (ID.RM)", description: "Risk tolerance and response strategy", category: "identify", priority: 9 },
    { title: "IDENTIFY - Supply Chain Risk Management (ID.SC)", description: "Third-party and supply chain risk procedures", category: "identify", priority: 10 },
    { title: "PROTECT - Identity Management (PR.AC-1)", description: "Access control and credential management", category: "protect", priority: 11 },
    { title: "PROTECT - Awareness and Training (PR.AT)", description: "Security awareness and skills training program", category: "protect", priority: 12 },
    { title: "PROTECT - Data Security (PR.DS)", description: "Data protection and privacy controls", category: "protect", priority: 13 },
    { title: "PROTECT - Information Protection (PR.IP)", description: "Security policies and protective technology", category: "protect", priority: 14 },
    { title: "PROTECT - Maintenance (PR.MA)", description: "Asset maintenance and repair procedures", category: "protect", priority: 15 },
    { title: "PROTECT - Protective Technology (PR.PT)", description: "Technical security solutions implementation", category: "protect", priority: 16 },
    { title: "DETECT - Anomalies and Events (DE.AE)", description: "Event detection and analysis procedures", category: "detect", priority: 17 },
    { title: "DETECT - Security Continuous Monitoring (DE.CM)", description: "Real-time security monitoring program", category: "detect", priority: 18 },
    { title: "DETECT - Detection Processes (DE.DP)", description: "Detection process design and testing", category: "detect", priority: 19 },
    { title: "RESPOND - Response Planning (RS.RP)", description: "Incident response plan and procedures", category: "respond", priority: 20 },
    { title: "RESPOND - Communications (RS.CO)", description: "Incident communication and coordination", category: "respond", priority: 21 },
    { title: "RESPOND - Analysis (RS.AN)", description: "Incident analysis and forensics procedures", category: "respond", priority: 22 },
    { title: "RESPOND - Mitigation (RS.MI)", description: "Incident containment and mitigation actions", category: "respond", priority: 23 },
    { title: "RESPOND - Improvements (RS.IM)", description: "Post-incident improvement process", category: "respond", priority: 24 },
    { title: "RECOVER - Recovery Planning (RC.RP)", description: "Recovery process planning and execution", category: "recover", priority: 25 },
    { title: "RECOVER - Improvements (RC.IM)", description: "Recovery process improvements and lessons learned", category: "recover", priority: 26 },
    { title: "RECOVER - Communications (RC.CO)", description: "Recovery coordination and communication", category: "recover", priority: 27 },
    { title: "CSF Profile - Current", description: "Current cybersecurity posture profile", category: "profile", priority: 28 },
    { title: "CSF Profile - Target", description: "Target cybersecurity posture profile", category: "profile", priority: 29 },
    { title: "CSF Implementation Tiers Assessment", description: "Maturity level evaluation (Partial to Adaptive)", category: "assessment", priority: 30 },
    { title: "CSF Informative References Mapping", description: "CSF to standards mapping (ISO, NIST 800-53, CIS)", category: "mapping", priority: 31 },
    { title: "Executive Summary Dashboard", description: "C-level cybersecurity posture reporting", category: "dashboard", priority: 32 }
  ],
  "HIPAA": [
    { title: "HIPAA Security Rule Compliance Plan", description: "Comprehensive HIPAA security compliance roadmap", category: "plan", priority: 1 },
    { title: "HIPAA Privacy Rule Compliance Plan", description: "PHI privacy protection and patient rights", category: "plan", priority: 2 },
    { title: "HIPAA Breach Notification Rule Procedures", description: "Breach notification and reporting procedures", category: "procedure", priority: 3 },
    { title: "Security Risk Assessment", description: "Organization-wide HIPAA security risk analysis", category: "assessment", priority: 4 },
    { title: "Administrative Safeguards - Security Management Process", description: "Risk analysis, management, and sanction policies", category: "administrative", priority: 5 },
    { title: "Administrative Safeguards - Assigned Security Responsibility", description: "Security official designation and responsibilities", category: "administrative", priority: 6 },
    { title: "Administrative Safeguards - Workforce Security", description: "Personnel authorization and supervision procedures", category: "administrative", priority: 7 },
    { title: "Administrative Safeguards - Information Access Management", description: "Access authorization and modification procedures", category: "administrative", priority: 8 },
    { title: "Administrative Safeguards - Security Awareness and Training", description: "Security reminders, protection from malware, incident procedures", category: "administrative", priority: 9 },
    { title: "Administrative Safeguards - Security Incident Procedures", description: "Incident response and reporting procedures", category: "administrative", priority: 10 },
    { title: "Administrative Safeguards - Contingency Plan", description: "Data backup, disaster recovery, emergency mode operations", category: "administrative", priority: 11 },
    { title: "Administrative Safeguards - Evaluation", description: "Periodic security posture evaluation", category: "administrative", priority: 12 },
    { title: "Administrative Safeguards - Business Associate Agreements", description: "BAA requirements and sample agreements", category: "administrative", priority: 13 },
    { title: "Physical Safeguards - Facility Access Controls", description: "Physical access restrictions and validation", category: "physical", priority: 14 },
    { title: "Physical Safeguards - Workstation Use Policy", description: "Workstation security and usage guidelines", category: "physical", priority: 15 },
    { title: "Physical Safeguards - Workstation Security", description: "Physical workstation protection measures", category: "physical", priority: 16 },
    { title: "Physical Safeguards - Device and Media Controls", description: "Hardware disposal, media reuse, and accountability", category: "physical", priority: 17 },
    { title: "Technical Safeguards - Access Control", description: "Unique user IDs, emergency access, automatic logoff, encryption", category: "technical", priority: 18 },
    { title: "Technical Safeguards - Audit Controls", description: "Activity logging and monitoring procedures", category: "technical", priority: 19 },
    { title: "Technical Safeguards - Integrity Controls", description: "ePHI integrity verification and protection", category: "technical", priority: 20 },
    { title: "Technical Safeguards - Person or Entity Authentication", description: "Identity verification procedures", category: "technical", priority: 21 },
    { title: "Technical Safeguards - Transmission Security", description: "ePHI transmission integrity and encryption", category: "technical", priority: 22 },
    { title: "Privacy Rule - Notice of Privacy Practices", description: "NPP template and distribution procedures", category: "privacy", priority: 23 },
    { title: "Privacy Rule - Individual Rights Procedures", description: "Access, amendment, accounting, and restriction rights", category: "privacy", priority: 24 },
    { title: "Privacy Rule - Minimum Necessary Policy", description: "Minimum necessary standard implementation", category: "privacy", priority: 25 },
    { title: "Privacy Rule - Uses and Disclosures", description: "PHI use and disclosure authorization procedures", category: "privacy", priority: 26 },
    { title: "Breach Risk Assessment Methodology", description: "4-factor breach risk analysis process", category: "methodology", priority: 27 },
    { title: "HITECH Act Compliance Requirements", description: "Enhanced enforcement and breach notification", category: "compliance", priority: 28 },
    { title: "Omnibus Rule Compliance", description: "Business associate liability and patient rights", category: "compliance", priority: 29 },
    { title: "HIPAA Compliance Training Program", description: "Workforce training curriculum and records", category: "training", priority: 30 }
  ],
  "GDPR": [
    { title: "GDPR Compliance Implementation Plan", description: "Comprehensive GDPR compliance roadmap", category: "plan", priority: 1 },
    { title: "Data Processing Inventory (Article 30)", description: "Records of processing activities", category: "inventory", priority: 2 },
    { title: "Lawful Basis Assessment", description: "Legal grounds for data processing determination", category: "assessment", priority: 3 },
    { title: "Privacy Policy Template", description: "Article 13/14 compliant privacy notice", category: "policy", priority: 4 },
    { title: "Data Subject Rights Procedures", description: "Access, rectification, erasure, portability, objection procedures", category: "procedure", priority: 5 },
    { title: "Consent Management Procedure", description: "Valid consent collection and withdrawal mechanisms", category: "procedure", priority: 6 },
    { title: "Data Protection Impact Assessment (DPIA) Template", description: "Article 35 DPIA methodology and template", category: "assessment", priority: 7 },
    { title: "DPIA Trigger Assessment", description: "High-risk processing identification criteria", category: "assessment", priority: 8 },
    { title: "Legitimate Interest Assessment (LIA)", description: "Balancing test for legitimate interest", category: "assessment", priority: 9 },
    { title: "Data Protection Officer (DPO) Designation", description: "DPO appointment and responsibilities", category: "designation", priority: 10 },
    { title: "Data Breach Response Plan", description: "72-hour breach notification procedures", category: "plan", priority: 11 },
    { title: "Breach Notification Templates", description: "Supervisory authority and data subject notifications", category: "template", priority: 12 },
    { title: "Data Processing Agreement (DPA) Template", description: "Article 28 processor agreement template", category: "agreement", priority: 13 },
    { title: "Joint Controller Agreement", description: "Article 26 joint controller arrangements", category: "agreement", priority: 14 },
    { title: "International Data Transfer Assessment", description: "Chapter V transfer mechanism evaluation", category: "assessment", priority: 15 },
    { title: "Standard Contractual Clauses (SCCs) Implementation", description: "SCC templates and supplementary measures", category: "implementation", priority: 16 },
    { title: "Transfer Impact Assessment (TIA)", description: "Third country data transfer risk assessment", category: "assessment", priority: 17 },
    { title: "Binding Corporate Rules (BCRs)", description: "Intra-group transfer framework (if applicable)", category: "rules", priority: 18 },
    { title: "Privacy by Design Implementation", description: "Article 25 data protection by design and default", category: "implementation", priority: 19 },
    { title: "Data Minimization Policy", description: "Adequate, relevant, and limited processing", category: "policy", priority: 20 },
    { title: "Data Retention Schedule", description: "Storage limitation and deletion procedures", category: "schedule", priority: 21 },
    { title: "Technical and Organizational Measures (TOMs)", description: "Article 32 security measures documentation", category: "measures", priority: 22 },
    { title: "Pseudonymization and Encryption Guidelines", description: "Data protection techniques implementation", category: "guidelines", priority: 23 },
    { title: "Vendor Due Diligence Checklist", description: "Processor and sub-processor assessment", category: "checklist", priority: 24 },
    { title: "Children's Data Protection Procedures", description: "Article 8 parental consent and special protections", category: "procedure", priority: 25 },
    { title: "Automated Decision-Making Disclosure", description: "Article 22 profiling and automated decisions", category: "disclosure", priority: 26 },
    { title: "Data Subject Access Request (DSAR) Process", description: "30-day response procedures and identity verification", category: "process", priority: 27 },
    { title: "Right to Erasure Implementation", description: "Data deletion and third-party notification", category: "implementation", priority: 28 },
    { title: "Data Portability Procedure", description: "Structured, machine-readable data provision", category: "procedure", priority: 29 },
    { title: "Supervisory Authority Communication Plan", description: "Lead authority identification and liaison", category: "plan", priority: 30 },
    { title: "GDPR Compliance Audit Checklist", description: "Self-assessment and readiness evaluation", category: "checklist", priority: 31 },
    { title: "Staff Training and Awareness Program", description: "GDPR training curriculum and records", category: "program", priority: 32 }
  ],
  "CCPA": [
    { title: "CCPA Compliance Implementation Plan", description: "California Consumer Privacy Act compliance roadmap", category: "plan", priority: 1 },
    { title: "CCPA Privacy Policy Requirements", description: "Compliant privacy policy with required disclosures", category: "policy", priority: 2 },
    { title: "Consumer Rights Request Procedures", description: "Right to know, delete, and opt-out processes", category: "procedure", priority: 3 },
    { title: "Do Not Sell My Personal Information Implementation", description: "Opt-out mechanism and disclosure requirements", category: "implementation", priority: 4 },
    { title: "Right to Know Request Process", description: "12-month data disclosure procedures", category: "process", priority: 5 },
    { title: "Right to Delete Request Process", description: "Deletion request handling and exceptions", category: "process", priority: 6 },
    { title: "Verified Consumer Request Procedures", description: "Identity verification for consumer requests", category: "procedure", priority: 7 },
    { title: "Authorized Agent Request Handling", description: "Third-party agent verification and processing", category: "handling", priority: 8 },
    { title: "Categories of Personal Information Collected", description: "Required category disclosures and mapping", category: "disclosure", priority: 9 },
    { title: "Sources of Personal Information", description: "Collection source documentation", category: "documentation", priority: 10 },
    { title: "Business or Commercial Purpose Disclosure", description: "Data use purpose documentation", category: "disclosure", priority: 11 },
    { title: "Third-Party Sharing and Sales Disclosure", description: "Categories of recipients and sold data", category: "disclosure", priority: 12 },
    { title: "Service Provider Agreements", description: "CCPA-compliant processor contracts", category: "agreement", priority: 13 },
    { title: "Minor's Data Protection (Under 16)", description: "Opt-in consent for minors' data sales", category: "protection", priority: 14 },
    { title: "Notice at Collection Template", description: "Point-of-collection privacy notice", category: "template", priority: 15 },
    { title: "Pre-Collection Notice Requirements", description: "New data use purpose notifications", category: "requirements", priority: 16 },
    { title: "Household Data Handling Procedures", description: "Household-level data management", category: "procedure", priority: 17 },
    { title: "Employee and B2B Exemption Documentation", description: "Temporary exemption tracking (if applicable)", category: "documentation", priority: 18 },
    { title: "Non-Discrimination Policy", description: "Prohibition of discriminatory practices", category: "policy", priority: 19 },
    { title: "Financial Incentive Program Disclosures", description: "Opt-in programs and value calculations", category: "disclosure", priority: 20 },
    { title: "Request Response Timeline Procedures", description: "45-day response time management", category: "procedure", priority: 21 },
    { title: "Request Denial Documentation", description: "Valid denial reasons and consumer notification", category: "documentation", priority: 22 },
    { title: "Personal Information Inventory", description: "Data mapping and lineage documentation", category: "inventory", priority: 23 },
    { title: "Data Retention and Deletion Schedule", description: "Retention policies and automated deletion", category: "schedule", priority: 24 },
    { title: "Website Cookie Disclosure and Controls", description: "Cookie notice and opt-out mechanisms", category: "disclosure", priority: 25 },
    { title: "Toll-Free Number and Online Form Setup", description: "Consumer request submission methods", category: "setup", priority: 26 },
    { title: "Staff Training Program", description: "Privacy rights training for customer-facing staff", category: "training", priority: 27 },
    { title: "CCPA Metrics and Reporting", description: "Annual request metrics and internal reporting", category: "metrics", priority: 28 },
    { title: "California AG Enforcement Readiness", description: "Cure period response and documentation", category: "readiness", priority: 29 },
    { title: "CPRA Amendment Preparation", description: "2023 updates including sensitive data and contractors", category: "preparation", priority: 30 }
  ],
  "ISO27701": [
    { title: "ISO 27701 PIMS Implementation Plan", description: "Privacy Information Management System roadmap", category: "plan", priority: 1 },
    { title: "PIMS Scope and Boundaries Definition", description: "Privacy management system scope documentation", category: "definition", priority: 2 },
    { title: "Privacy Policy and Objectives", description: "Top-level privacy governance document", category: "policy", priority: 3 },
    { title: "PII Controller Requirements (Clause 6)", description: "Data controller specific obligations", category: "requirements", priority: 4 },
    { title: "PII Processor Requirements (Clause 7)", description: "Data processor specific obligations", category: "requirements", priority: 5 },
    { title: "PII Processing Records and Inventory", description: "Comprehensive PII processing documentation", category: "inventory", priority: 6 },
    { title: "Privacy Risk Assessment Methodology", description: "Privacy-specific risk assessment process", category: "methodology", priority: 7 },
    { title: "Privacy by Design Implementation", description: "Privacy engineering in system design", category: "implementation", priority: 8 },
    { title: "Privacy Impact Assessment (PIA) Template", description: "Detailed PIA methodology and template", category: "assessment", priority: 9 },
    { title: "Data Subject Rights Management", description: "Rights request handling procedures", category: "management", priority: 10 },
    { title: "Consent Management Framework", description: "Consent collection, storage, and withdrawal", category: "framework", priority: 11 },
    { title: "PII Retention and Disposal Schedule", description: "Privacy-focused retention policy", category: "schedule", priority: 12 },
    { title: "Third-Party PII Processor Management", description: "Processor oversight and contracts", category: "management", priority: 13 },
    { title: "Cross-Border PII Transfer Controls", description: "International transfer safeguards", category: "controls", priority: 14 },
    { title: "Privacy Breach Response Procedures", description: "PII breach notification and response", category: "procedure", priority: 15 },
    { title: "Privacy Awareness and Training Program", description: "Staff privacy education curriculum", category: "training", priority: 16 },
    { title: "Privacy Monitoring and Measurement", description: "PIMS performance indicators", category: "monitoring", priority: 17 },
    { title: "PIMS Internal Audit Program", description: "Privacy management system audits", category: "audit", priority: 18 },
    { title: "Management Review and Improvement", description: "PIMS continual improvement process", category: "review", priority: 19 },
    { title: "ISO 27001/27701 Integration Guide", description: "ISMS and PIMS alignment", category: "guide", priority: 20 }
  ],
  "ISO42001": [
    { title: "AI Management System (AIMS) Implementation Plan", description: "Comprehensive AI governance framework roadmap", category: "plan", priority: 1 },
    { title: "AI Policy and Strategic Objectives", description: "Top-level AI governance policy", category: "policy", priority: 2 },
    { title: "AI Risk Assessment Framework", description: "AI-specific risk identification and analysis", category: "framework", priority: 3 },
    { title: "AI Impact Assessment Template", description: "Algorithmic impact assessment methodology", category: "assessment", priority: 4 },
    { title: "AI System Inventory and Classification", description: "AI/ML system cataloging and risk classification", category: "inventory", priority: 5 },
    { title: "AI Transparency and Explainability Requirements", description: "AI decision explanation and documentation", category: "requirements", priority: 6 },
    { title: "AI Bias Detection and Mitigation", description: "Fairness testing and bias reduction procedures", category: "mitigation", priority: 7 },
    { title: "AI Data Governance Framework", description: "Training data quality and lineage management", category: "framework", priority: 8 },
    { title: "AI Model Development Lifecycle", description: "Responsible AI development process", category: "lifecycle", priority: 9 },
    { title: "AI Model Validation and Testing", description: "Performance, safety, and robustness testing", category: "testing", priority: 10 },
    { title: "AI Monitoring and Performance Management", description: "Ongoing AI system monitoring and drift detection", category: "monitoring", priority: 11 },
    { title: "AI Incident Response Plan", description: "AI failure and harmful output response", category: "plan", priority: 12 },
    { title: "AI Ethics and Responsible Use Policy", description: "Ethical AI principles and guidelines", category: "policy", priority: 13 },
    { title: "Human Oversight and Control Requirements", description: "Human-in-the-loop governance", category: "requirements", priority: 14 },
    { title: "AI Stakeholder Engagement", description: "Stakeholder consultation and feedback", category: "engagement", priority: 15 },
    { title: "AI Supplier and Third-Party Management", description: "AI vendor risk assessment", category: "management", priority: 16 },
    { title: "AI Intellectual Property Protection", description: "AI model IP and proprietary data protection", category: "protection", priority: 17 },
    { title: "AI Regulatory Compliance Mapping", description: "AI Act, GDPR, and sector-specific requirements", category: "mapping", priority: 18 },
    { title: "AI Documentation and Record-Keeping", description: "Model cards, data sheets, and audit trails", category: "documentation", priority: 19 },
    { title: "AI Awareness and Competence Training", description: "Staff AI literacy and responsible use training", category: "training", priority: 20 }
  ],
  "ISO9001": [
    { title: "Quality Management System (QMS) Manual", description: "Top-level QMS documentation and scope", category: "manual", priority: 1 },
    { title: "Quality Policy and Objectives", description: "Organizational quality commitment", category: "policy", priority: 2 },
    { title: "Context of the Organization Analysis", description: "Internal/external issues and interested parties", category: "analysis", priority: 3 },
    { title: "QMS Scope Definition", description: "QMS boundaries and applicability", category: "definition", priority: 4 },
    { title: "Leadership and Commitment Documentation", description: "Management responsibility and authority", category: "documentation", priority: 5 },
    { title: "Risk and Opportunity Assessment", description: "QMS risk-based thinking methodology", category: "assessment", priority: 6 },
    { title: "Quality Objectives and Planning", description: "Measurable quality targets and action plans", category: "planning", priority: 7 },
    { title: "Organizational Roles and Responsibilities", description: "Quality-related authority and accountability", category: "roles", priority: 8 },
    { title: "Competence and Training Matrix", description: "Personnel competence requirements", category: "matrix", priority: 9 },
    { title: "Documented Information Control", description: "Document and record management procedures", category: "control", priority: 10 },
    { title: "Operational Planning and Control", description: "Process planning and requirements", category: "planning", priority: 11 },
    { title: "Customer Requirements Determination", description: "Customer needs analysis and communication", category: "determination", priority: 12 },
    { title: "Design and Development Process", description: "Product/service design controls", category: "process", priority: 13 },
    { title: "Control of Externally Provided Processes", description: "Supplier management and oversight", category: "control", priority: 14 },
    { title: "Production and Service Provision Control", description: "Operational control procedures", category: "control", priority: 15 },
    { title: "Monitoring and Measurement Procedures", description: "Performance measurement and analysis", category: "procedure", priority: 16 },
    { title: "Internal Audit Program", description: "QMS audit planning and execution", category: "program", priority: 17 },
    { title: "Management Review Process", description: "Periodic QMS review and improvement", category: "process", priority: 18 },
    { title: "Nonconformity and Corrective Action", description: "Problem resolution and prevention", category: "action", priority: 19 },
    { title: "Continual Improvement Framework", description: "QMS enhancement methodology", category: "framework", priority: 20 }
  ],
  "ISO22301": [
    { title: "Business Continuity Management System (BCMS) Manual", description: "Top-level BCMS framework documentation", category: "manual", priority: 1 },
    { title: "Business Continuity Policy", description: "Organizational BC commitment and objectives", category: "policy", priority: 2 },
    { title: "Business Impact Analysis (BIA)", description: "Critical function and impact assessment", category: "analysis", priority: 3 },
    { title: "Risk Assessment and Treatment", description: "BC threat and vulnerability analysis", category: "assessment", priority: 4 },
    { title: "Business Continuity Strategy", description: "Recovery strategy and options selection", category: "strategy", priority: 5 },
    { title: "Business Continuity Plans (BCPs)", description: "Detailed recovery procedures by function", category: "plan", priority: 6 },
    { title: "Incident Response Procedures", description: "Initial response and activation criteria", category: "procedure", priority: 7 },
    { title: "Crisis Management Plan", description: "Crisis communication and decision-making", category: "plan", priority: 8 },
    { title: "Emergency Operations Center (EOC) Procedures", description: "EOC activation and operations", category: "procedure", priority: 9 },
    { title: "Recovery Time Objectives (RTO) Documentation", description: "Target recovery timeframes", category: "documentation", priority: 10 },
    { title: "Recovery Point Objectives (RPO) Documentation", description: "Acceptable data loss parameters", category: "documentation", priority: 11 },
    { title: "IT Disaster Recovery Plan", description: "Technology recovery procedures", category: "plan", priority: 12 },
    { title: "Alternate Site and Workaround Procedures", description: "Backup facility and manual processes", category: "procedure", priority: 13 },
    { title: "Supply Chain Continuity Management", description: "Supplier resilience requirements", category: "management", priority: 14 },
    { title: "BC Training and Awareness Program", description: "Staff preparedness and education", category: "program", priority: 15 },
    { title: "BC Exercise and Testing Schedule", description: "Tabletop, walkthrough, and full-scale tests", category: "schedule", priority: 16 },
    { title: "Communication Plan", description: "Stakeholder notification procedures", category: "plan", priority: 17 },
    { title: "BCMS Performance Monitoring", description: "BC metrics and KPIs", category: "monitoring", priority: 18 },
    { title: "BCMS Internal Audit Program", description: "BC audit procedures", category: "program", priority: 19 },
    { title: "Management Review and Improvement", description: "BCMS continual improvement", category: "review", priority: 20 }
  ],
  "ISO27002": [
    { title: "ISO 27002:2022 Information Security Controls Guide", description: "Complete controls implementation reference", category: "guide", priority: 1 },
    { title: "Organizational Controls Implementation (5.1-5.37)", description: "Policies, asset management, and HR security", category: "controls", priority: 2 },
    { title: "People Controls Implementation (6.1-6.8)", description: "Screening, terms, awareness, and disciplinary", category: "controls", priority: 3 },
    { title: "Physical Controls Implementation (7.1-7.14)", description: "Perimeters, entry, offices, equipment, and utilities", category: "controls", priority: 4 },
    { title: "Technological Controls Implementation (8.1-8.34)", description: "Endpoints, access, crypto, networks, and development", category: "controls", priority: 5 },
    { title: "Security Policies Control (5.1)", description: "Information security policy framework", category: "control", priority: 6 },
    { title: "Information Security Roles Control (5.2)", description: "Responsibility assignment", category: "control", priority: 7 },
    { title: "Segregation of Duties Control (5.3)", description: "Conflicting responsibilities separation", category: "control", priority: 8 },
    { title: "Asset Management Control (5.9-5.14)", description: "Asset inventory, classification, and handling", category: "control", priority: 9 },
    { title: "Access Control Implementation (5.15-5.18)", description: "Identity, authentication, and authorization", category: "control", priority: 10 },
    { title: "Supplier Relationships Control (5.19-5.23)", description: "Third-party and cloud security", category: "control", priority: 11 },
    { title: "Incident Management Control (5.24-5.28)", description: "Detection, response, and evidence collection", category: "control", priority: 12 },
    { title: "Business Continuity Control (5.29-5.30)", description: "ICT readiness and continuity planning", category: "control", priority: 13 },
    { title: "Compliance Control (5.31-5.37)", description: "Legal, regulatory, and audit compliance", category: "control", priority: 14 },
    { title: "Physical Security Control (7.1-7.4)", description: "Facilities and environmental protection", category: "control", priority: 15 },
    { title: "Endpoint Security Control (8.1-8.5)", description: "User devices and privileged access", category: "control", priority: 16 },
    { title: "Cryptography Control (8.24)", description: "Encryption standards and key management", category: "control", priority: 17 },
    { title: "Network Security Control (8.20-8.23)", description: "Networks, segmentation, and web filtering", category: "control", priority: 18 },
    { title: "Secure Development Control (8.25-8.34)", description: "SDLC, coding, and change management", category: "control", priority: 19 },
    { title: "Monitoring and Logging Control (8.15-8.16)", description: "Event logging and monitoring activities", category: "control", priority: 20 }
  ],
  "NYDFS": [
    { title: "NYDFS Cybersecurity Regulation Compliance Program", description: "23 NYCRR 500 comprehensive compliance framework", category: "program", priority: 1 },
    { title: "Cybersecurity Policy (500.03)", description: "Board-approved cybersecurity policy", category: "policy", priority: 2 },
    { title: "Chief Information Security Officer (CISO) Designation (500.04)", description: "CISO appointment and responsibilities", category: "designation", priority: 3 },
    { title: "Penetration Testing and Vulnerability Assessments (500.05)", description: "Regular security testing program", category: "testing", priority: 4 },
    { title: "Audit Trail Requirements (500.06)", description: "Activity monitoring and logging", category: "requirements", priority: 5 },
    { title: "Access Privileges and Controls (500.07)", description: "User access management", category: "controls", priority: 6 },
    { title: "Application Security (500.08)", description: "Secure application development", category: "security", priority: 7 },
    { title: "Risk Assessment (500.09)", description: "Annual cybersecurity risk assessment", category: "assessment", priority: 8 },
    { title: "Cybersecurity Personnel and Intelligence (500.10)", description: "Qualified cybersecurity staff and threat intelligence", category: "personnel", priority: 9 },
    { title: "Third-Party Service Provider Security Policy (500.11)", description: "Vendor risk management", category: "policy", priority: 10 },
    { title: "Multi-Factor Authentication (500.12)", description: "MFA implementation requirements", category: "authentication", priority: 11 },
    { title: "Data Encryption (500.15)", description: "Encryption of nonpublic information", category: "encryption", priority: 12 },
    { title: "Incident Response Plan (500.16)", description: "Cybersecurity event response procedures", category: "plan", priority: 13 },
    { title: "Business Continuity and Disaster Recovery (500.16)", description: "BC/DR planning and testing", category: "planning", priority: 14 },
    { title: "Annual Compliance Certification (500.17)", description: "Board certification submission", category: "certification", priority: 15 },
    { title: "Cybersecurity Event Notification (500.17)", description: "72-hour breach notification to DFS", category: "notification", priority: 16 },
    { title: "Limitations on Data Retention (500.13)", description: "Data retention and disposal policy", category: "limitations", priority: 17 },
    { title: "Training and Monitoring (500.14)", description: "Cybersecurity awareness training", category: "training", priority: 18 },
    { title: "Asset Inventory and Classification", description: "Information systems and data inventory", category: "inventory", priority: 19 },
    { title: "NYDFS Exemption Analysis", description: "Limited exemption qualification assessment", category: "analysis", priority: 20 }
  ],
  "NIS2": [
    { title: "NIS2 Directive Compliance Framework", description: "EU Network and Information Security Directive 2 roadmap", category: "framework", priority: 1 },
    { title: "Essential vs Important Entity Classification", description: "Entity type determination and obligations", category: "classification", priority: 2 },
    { title: "Risk Management Measures (Article 21)", description: "Comprehensive cybersecurity risk management", category: "measures", priority: 3 },
    { title: "Corporate Accountability Framework", description: "Management body responsibilities", category: "framework", priority: 4 },
    { title: "Cybersecurity Risk Assessment", description: "NIS2-compliant risk analysis methodology", category: "assessment", priority: 5 },
    { title: "Security Policies and Procedures", description: "Information security policy framework", category: "policies", priority: 6 },
    { title: "Incident Handling Procedures", description: "Security incident detection and response", category: "procedures", priority: 7 },
    { title: "Business Continuity and Crisis Management", description: "Backup, disaster recovery, and crisis response", category: "management", priority: 8 },
    { title: "Supply Chain Security Requirements", description: "Vendor cybersecurity obligations", category: "requirements", priority: 9 },
    { title: "Security in Network and Information Systems", description: "Acquisition, development, and maintenance security", category: "security", priority: 10 },
    { title: "Access Control and Asset Management", description: "Identity management and asset inventory", category: "control", priority: 11 },
    { title: "Cryptography and Encryption Policy", description: "Data protection through encryption", category: "policy", priority: 12 },
    { title: "Human Resources Security", description: "Personnel security and awareness training", category: "security", priority: 13 },
    { title: "Multi-Factor Authentication Implementation", description: "MFA for administrative access", category: "implementation", priority: 14 },
    { title: "Secure Communications", description: "Emergency communication systems", category: "communications", priority: 15 },
    { title: "24-Hour Significant Incident Notification", description: "Early warning to CSIRT/competent authority", category: "notification", priority: 16 },
    { title: "Incident Reporting Requirements", description: "Initial, intermediate, and final reports", category: "requirements", priority: 17 },
    { title: "Coordinated Vulnerability Disclosure", description: "Vulnerability handling and disclosure", category: "disclosure", priority: 18 },
    { title: "Supervisory Measures and Penalties", description: "Compliance demonstration and enforcement", category: "measures", priority: 19 },
    { title: "EU Cybersecurity Certification Schemes", description: "Applicable certification requirements", category: "schemes", priority: 20 }
  ],
  "PSD2": [
    { title: "PSD2 Regulatory Technical Standards (RTS) Compliance", description: "Strong Customer Authentication and secure communication", category: "compliance", priority: 1 },
    { title: "Strong Customer Authentication (SCA) Implementation", description: "Multi-factor authentication for payments", category: "implementation", priority: 2 },
    { title: "SCA Exemptions Framework", description: "Low-risk, contactless, and trusted beneficiary exemptions", category: "framework", priority: 3 },
    { title: "Dynamic Linking Requirements", description: "Transaction data binding to authentication", category: "requirements", priority: 4 },
    { title: "Open Banking API Security", description: "TPP access interface security", category: "security", priority: 5 },
    { title: "TPP Registration and Certification", description: "Third-party provider qualification", category: "registration", priority: 6 },
    { title: "Account Information Service Provider (AISP) Controls", description: "Account data access security", category: "controls", priority: 7 },
    { title: "Payment Initiation Service Provider (PISP) Controls", description: "Payment initiation security", category: "controls", priority: 8 },
    { title: "Dedicated Interface Requirements", description: "TPP access interface specifications", category: "requirements", priority: 9 },
    { title: "Contingency Mechanism for Interface Availability", description: "Fallback access procedures", category: "mechanism", priority: 10 },
    { title: "Customer Authentication Device Security", description: "Authentication element protection", category: "security", priority: 11 },
    { title: "Transaction Monitoring and Fraud Detection", description: "Real-time transaction risk analysis", category: "monitoring", priority: 12 },
    { title: "Incident Reporting to EBA/NCAs", description: "Operational/security incident notification", category: "reporting", priority: 13 },
    { title: "Security Measures Documentation", description: "Comprehensive security controls evidence", category: "documentation", priority: 14 }
  ],
  "PSD3": [
    { title: "PSD3 Compliance Roadmap", description: "Payment Services Directive 3 implementation plan", category: "roadmap", priority: 1 },
    { title: "Enhanced Open Finance Framework", description: "Expanded data sharing beyond payments", category: "framework", priority: 2 },
    { title: "Improved SCA User Experience", description: "Streamlined authentication requirements", category: "experience", priority: 3 },
    { title: "Account Access Dashboard Requirements", description: "Customer TPP access visibility", category: "requirements", priority: 4 },
    { title: "Financial Data Sharing Consent Management", description: "Granular consent mechanisms", category: "management", priority: 5 },
    { title: "Fraud Prevention and Reimbursement", description: "Enhanced fraud liability framework", category: "prevention", priority: 6 },
    { title: "Payment Service User Protection", description: "Strengthened consumer rights", category: "protection", priority: 7 },
    { title: "Variable Recurring Payments (VRPs)", description: "VRP framework implementation", category: "payments", priority: 8 },
    { title: "Premium SMS and Phone-Based Payments", description: "Alternative payment method controls", category: "controls", priority: 9 },
    { title: "Open Finance API Standardization", description: "Harmonized API specifications", category: "standardization", priority: 10 }
  ],
  "PCI-DSS-4.0": [
    { title: "PCI DSS 4.0 Compliance Program", description: "Payment Card Industry Data Security Standard v4.0", category: "program", priority: 1 },
    { title: "Cardholder Data Environment (CDE) Scope", description: "CDE boundary definition and network segmentation", category: "scope", priority: 2 },
    { title: "Network Security Controls (Requirement 1)", description: "Firewall and router configuration", category: "controls", priority: 3 },
    { title: "Account Data Protection (Requirement 2)", description: "Remove vendor defaults and secure configurations", category: "protection", priority: 4 },
    { title: "Stored Cardholder Data Protection (Requirement 3)", description: "CHD encryption, masking, and retention", category: "protection", priority: 5 },
    { title: "Data Transmission Encryption (Requirement 4)", description: "TLS/IPsec for cardholder data transmission", category: "encryption", priority: 6 },
    { title: "Malware Protection (Requirement 5)", description: "Anti-malware solutions and processes", category: "protection", priority: 7 },
    { title: "Secure Systems and Applications (Requirement 6)", description: "Vulnerability management and secure development", category: "security", priority: 8 },
    { title: "Access Control Measures (Requirement 7)", description: "Need-to-know access restrictions", category: "measures", priority: 9 },
    { title: "User Authentication and Access Management (Requirement 8)", description: "Unique IDs, strong passwords, MFA", category: "management", priority: 10 },
    { title: "Physical Access Controls (Requirement 9)", description: "Facility access and media handling", category: "controls", priority: 11 },
    { title: "Logging and Monitoring (Requirement 10)", description: "Audit trails and log review", category: "monitoring", priority: 12 },
    { title: "Cryptographic Key Management (Requirement 3.6)", description: "Key generation, distribution, and destruction", category: "management", priority: 13 },
    { title: "Security Testing Procedures (Requirement 11)", description: "Vulnerability scans, penetration tests, IDS/IPS", category: "procedures", priority: 14 },
    { title: "Information Security Policy (Requirement 12)", description: "PCI DSS policy and security awareness", category: "policy", priority: 15 },
    { title: "Risk Assessment Methodology", description: "Annual PCI risk assessment", category: "methodology", priority: 16 },
    { title: "Targeted Risk Analysis (TRA)", description: "Control customization justification", category: "analysis", priority: 17 },
    { title: "Service Provider Requirements", description: "Third-party PCI compliance validation", category: "requirements", priority: 18 },
    { title: "Multi-Tenant Service Provider Controls", description: "Customer isolation and segmentation", category: "controls", priority: 19 },
    { title: "PCI DSS v4.0 Migration Plan", description: "Transition from v3.2.1 to v4.0", category: "plan", priority: 20 },
    { title: "Customized Approach Documentation", description: "Alternative control implementation evidence", category: "documentation", priority: 21 },
    { title: "Self-Assessment Questionnaire (SAQ) Completion", description: "Merchant level appropriate SAQ", category: "completion", priority: 22 },
    { title: "Attestation of Compliance (AOC)", description: "Annual compliance certification", category: "attestation", priority: 23 }
  ],
  "AWS-Well-Architected": [
    { title: "AWS Well-Architected Framework Review", description: "Comprehensive cloud architecture assessment", category: "review", priority: 1 },
    { title: "Operational Excellence Pillar", description: "Operations as code, documentation, and improvement", category: "pillar", priority: 2 },
    { title: "Operations Management Procedures", description: "Runbooks, playbooks, and operational metrics", category: "procedures", priority: 3 },
    { title: "Change Management and Deployment", description: "CI/CD, automated deployments, rollback procedures", category: "management", priority: 4 },
    { title: "Security Pillar Implementation", description: "Identity, detection, infrastructure protection, data protection", category: "pillar", priority: 5 },
    { title: "AWS IAM Best Practices", description: "Least privilege, MFA, role-based access", category: "practices", priority: 6 },
    { title: "Detective Controls Implementation", description: "CloudTrail, GuardDuty, Security Hub, Config", category: "implementation", priority: 7 },
    { title: "Infrastructure Protection Strategy", description: "VPC design, security groups, NACLs, WAF", category: "strategy", priority: 8 },
    { title: "Data Protection and Encryption", description: "KMS, encryption at rest and in transit, S3 security", category: "protection", priority: 9 },
    { title: "Incident Response Plan", description: "AWS incident response procedures and automation", category: "plan", priority: 10 },
    { title: "Reliability Pillar Design", description: "Fault tolerance, auto-scaling, disaster recovery", category: "pillar", priority: 11 },
    { title: "High Availability Architecture", description: "Multi-AZ deployment and failover", category: "architecture", priority: 12 },
    { title: "Backup and Disaster Recovery", description: "RTO/RPO targets, backup strategies, DR testing", category: "recovery", priority: 13 },
    { title: "Auto Scaling and Self-Healing", description: "Auto Scaling groups, health checks, automated recovery", category: "scaling", priority: 14 },
    { title: "Performance Efficiency Pillar", description: "Selection, review, monitoring, and tradeoffs", category: "pillar", priority: 15 },
    { title: "Right-Sizing and Resource Selection", description: "Instance type optimization and cost-performance balance", category: "selection", priority: 16 },
    { title: "Performance Monitoring and Optimization", description: "CloudWatch, X-Ray, performance benchmarking", category: "monitoring", priority: 17 },
    { title: "Cost Optimization Pillar", description: "Cost awareness, optimization, and management", category: "pillar", priority: 18 },
    { title: "Cost Allocation and Tagging Strategy", description: "Resource tagging and cost attribution", category: "strategy", priority: 19 },
    { title: "Reserved Instances and Savings Plans", description: "Commitment-based discounts strategy", category: "plans", priority: 20 },
    { title: "Sustainability Pillar Implementation", description: "Energy efficiency and carbon footprint reduction", category: "pillar", priority: 21 },
    { title: "Well-Architected Review Action Plan", description: "High/medium risk issue remediation roadmap", category: "plan", priority: 22 },
    { title: "AWS Landing Zone and Control Tower", description: "Multi-account governance and guardrails", category: "governance", priority: 23 }
  ],
  "CISA-Zero-Trust": [
    { title: "CISA Zero Trust Maturity Model Implementation", description: "Federal zero trust architecture roadmap", category: "implementation", priority: 1 },
    { title: "Zero Trust Architecture (ZTA) Strategy", description: "Never trust, always verify principles", category: "strategy", priority: 2 },
    { title: "Identity Pillar - Traditional to Optimal", description: "Identity governance and MFA/passwordless progression", category: "pillar", priority: 3 },
    { title: "Identity Centralization and Federation", description: "Unified identity management and SSO", category: "centralization", priority: 4 },
    { title: "Multi-Factor Authentication Rollout", description: "Phishing-resistant MFA implementation", category: "rollout", priority: 5 },
    { title: "Device Pillar - Traditional to Optimal", description: "Device inventory, compliance, and EDR", category: "pillar", priority: 6 },
    { title: "Device Inventory and Asset Management", description: "Comprehensive device discovery and tracking", category: "management", priority: 7 },
    { title: "Device Compliance and Posture Assessment", description: "Health checks and conditional access", category: "assessment", priority: 8 },
    { title: "Network/Environment Pillar - Traditional to Optimal", description: "Micro-segmentation and encrypted traffic inspection", category: "pillar", priority: 9 },
    { title: "Network Segmentation Strategy", description: "Application-based micro-segmentation", category: "strategy", priority: 10 },
    { title: "Encrypted Traffic Inspection", description: "TLS/SSL inspection and decryption", category: "inspection", priority: 11 },
    { title: "Application Workload Pillar - Traditional to Optimal", description: "Application authentication and behavior analytics", category: "pillar", priority: 12 },
    { title: "Application Access Control", description: "App-level authentication and authorization", category: "control", priority: 13 },
    { title: "API Security and Management", description: "API gateway and security controls", category: "security", priority: 14 },
    { title: "Data Pillar - Traditional to Optimal", description: "Data classification, DLP, and rights management", category: "pillar", priority: 15 },
    { title: "Data Classification and Labeling", description: "Sensitivity-based data categorization", category: "classification", priority: 16 },
    { title: "Data Loss Prevention (DLP)", description: "Automated DLP policies and enforcement", category: "prevention", priority: 17 },
    { title: "Visibility and Analytics - Traditional to Optimal", description: "SIEM, UEBA, and integrated security monitoring", category: "analytics", priority: 18 },
    { title: "Security Information Event Management (SIEM)", description: "Centralized log aggregation and correlation", category: "management", priority: 19 },
    { title: "User and Entity Behavior Analytics (UEBA)", description: "Anomaly detection and threat hunting", category: "analytics", priority: 20 },
    { title: "Automation and Orchestration - Traditional to Optimal", description: "SOAR and automated response", category: "automation", priority: 21 },
    { title: "Zero Trust Maturity Assessment", description: "Current state evaluation across all pillars", category: "assessment", priority: 22 },
    { title: "Zero Trust Roadmap and Phasing", description: "Progressive maturity advancement plan", category: "roadmap", priority: 23 }
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

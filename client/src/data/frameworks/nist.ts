import { 
  Shield, AlertCircle, Users, Lock, Server, Eye, Key, AlertTriangle, 
  Wrench, ClipboardList, Target, ShieldCheck, Zap, RotateCcw,
  Activity, Briefcase, FileCheck, CheckSquare, Search, FileText,
  HardDrive, MapPin, UserCheck, ShoppingCart, Wifi, Bug, Link,
  Building, Cpu, CheckCircle, Clock, XCircle, Download, ChevronRight,
  Filter, Calendar, Link as LinkIcon, Unlink, Paperclip, Plus,
  Table as TableIcon, Trash2, ExternalLink
} from "lucide-react";

// Evidence file interface for type safety (matches ISO 27001 pattern)
export interface EvidenceFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string | null;
  createdAt: string;
  metadata: {
    tags?: string[];
    description?: string;
  } | null;
}

export type SubcategoryStatus = "not_started" | "in_progress" | "implemented" | "not_applicable";
export type EvidenceStatus = "none" | "partial" | "complete";
export type ImplementationTier = "tier_1" | "tier_2" | "tier_3" | "tier_4";

export interface Subcategory {
  id: string;
  name: string;
  description: string;
  status: SubcategoryStatus;
  evidenceStatus: EvidenceStatus;
  implementationTier: ImplementationTier;
  lastUpdated: string | null;
}

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

export interface NISTFunction {
  id: string;
  name: string;
  description: string;
  icon: typeof Shield;
  color: string;
  categories: Category[];
}

export const initialNISTFunctions: NISTFunction[] = [
  {
    id: "ID",
    name: "Identify",
    description: "Develop organizational understanding to manage cybersecurity risk to systems, assets, data, and capabilities",
    icon: Target,
    color: "blue",
    categories: [
      {
        id: "ID.AM",
        name: "Asset Management",
        subcategories: [
          { id: "ID.AM-1", name: "Physical devices and systems inventory", description: "Physical devices and systems within the organization are inventoried", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.AM-2", name: "Software platforms and applications inventory", description: "Software platforms and applications within the organization are inventoried", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.AM-3", name: "Organizational communication and data flows", description: "Organizational communication and data flows are mapped", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.AM-4", name: "External information systems", description: "External information systems are catalogued", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.AM-5", name: "Resources prioritization", description: "Resources (e.g., hardware, devices, data, time, personnel, and software) are prioritized based on their classification, criticality, and business value", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.AM-6", name: "Cybersecurity roles and responsibilities", description: "Cybersecurity roles and responsibilities for the entire workforce and third-party stakeholders are established", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
      {
        id: "ID.BE",
        name: "Business Environment",
        subcategories: [
          { id: "ID.BE-1", name: "Supply chain role identification", description: "The organization's role in the supply chain is identified and communicated", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.BE-2", name: "Critical infrastructure role", description: "The organization's place in critical infrastructure and its industry sector is identified and communicated", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.BE-3", name: "Organizational mission priorities", description: "Priorities for organizational mission, objectives, and activities are established and communicated", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.BE-4", name: "Dependencies for critical services", description: "Dependencies and critical functions for delivery of critical services are established", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.BE-5", name: "Resilience requirements", description: "Resilience requirements to support delivery of critical services are established for all operating states", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
      {
        id: "ID.GV",
        name: "Governance",
        subcategories: [
          { id: "ID.GV-1", name: "Information security policy", description: "Organizational cybersecurity policy is established and communicated", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.GV-2", name: "Cybersecurity roles coordination", description: "Cybersecurity roles and responsibilities are coordinated and aligned with internal roles and external partners", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.GV-3", name: "Legal and regulatory requirements", description: "Legal and regulatory requirements regarding cybersecurity, including privacy and civil liberties obligations, are understood and managed", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.GV-4", name: "Governance and risk management", description: "Governance and risk management processes address cybersecurity risks", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
      {
        id: "ID.RA",
        name: "Risk Assessment",
        subcategories: [
          { id: "ID.RA-1", name: "Asset vulnerabilities identification", description: "Asset vulnerabilities are identified and documented", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.RA-2", name: "Cyber threat intelligence", description: "Cyber threat intelligence is received from information sharing forums and sources", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.RA-3", name: "Threat identification", description: "Threats, both internal and external, are identified and documented", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.RA-4", name: "Business impact analysis", description: "Potential business impacts and likelihoods are identified", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.RA-5", name: "Risk determination", description: "Threats, vulnerabilities, likelihoods, and impacts are used to determine risk", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.RA-6", name: "Risk responses", description: "Risk responses are identified and prioritized", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
      {
        id: "ID.RM",
        name: "Risk Management Strategy",
        subcategories: [
          { id: "ID.RM-1", name: "Risk management processes", description: "Risk management processes are established, managed, and agreed to by organizational stakeholders", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.RM-2", name: "Risk tolerance", description: "Organizational risk tolerance is determined and clearly expressed", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.RM-3", name: "Risk tolerance informed by role", description: "The organization's determination of risk tolerance is informed by its role in critical infrastructure and sector specific risk analysis", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
      {
        id: "ID.SC",
        name: "Supply Chain Risk Management",
        subcategories: [
          { id: "ID.SC-1", name: "Supply chain risk management processes", description: "Cyber supply chain risk management processes are identified, established, assessed, managed, and agreed to by organizational stakeholders", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.SC-2", name: "Supplier identification and prioritization", description: "Suppliers and third party partners of information systems, components, and services are identified, prioritized, and assessed using a cyber supply chain risk assessment process", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.SC-3", name: "Supplier contracts", description: "Contracts with suppliers and third-party partners are used to implement appropriate measures designed to meet the objectives of an organization's cybersecurity program and Cyber Supply Chain Risk Management Plan", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.SC-4", name: "Supplier monitoring", description: "Suppliers and third-party partners are routinely assessed using audits, test results, or other forms of evaluations to confirm they are meeting their contractual obligations", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "ID.SC-5", name: "Response and recovery planning", description: "Response and recovery planning and testing are conducted with suppliers and third-party providers", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
    ]
  },
  {
    id: "PR",
    name: "Protect",
    description: "Develop and implement appropriate safeguards to ensure delivery of critical services",
    icon: ShieldCheck,
    color: "green",
    categories: [
      {
        id: "PR.AC",
        name: "Identity Management and Access Control",
        subcategories: [
          { id: "PR.AC-1", name: "Identity and credential management", description: "Identities and credentials are issued, managed, verified, revoked, and audited for authorized devices, users and processes", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.AC-2", name: "Physical access management", description: "Physical access to assets is managed and protected", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.AC-3", name: "Remote access management", description: "Remote access is managed", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.AC-4", name: "Access permissions management", description: "Access permissions and authorizations are managed, incorporating the principles of least privilege and separation of duties", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.AC-5", name: "Network integrity protection", description: "Network integrity is protected (e.g., network segregation, network segmentation)", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.AC-6", name: "Identity proofing", description: "Identities are proofed and bound to credentials and asserted in interactions", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.AC-7", name: "Authentication mechanisms", description: "Users, devices, and other assets are authenticated (e.g., single-factor, multi-factor) commensurate with the risk of the transaction", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
      {
        id: "PR.AT",
        name: "Awareness and Training",
        subcategories: [
          { id: "PR.AT-1", name: "User awareness and training", description: "All users are informed and trained", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.AT-2", name: "Privileged users training", description: "Privileged users understand their roles and responsibilities", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.AT-3", name: "Third-party stakeholder training", description: "Third-party stakeholders (e.g., suppliers, customers, partners) understand their roles and responsibilities", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.AT-4", name: "Senior executive training", description: "Senior executives understand their roles and responsibilities", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.AT-5", name: "Security personnel training", description: "Physical and cybersecurity personnel understand their roles and responsibilities", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
      {
        id: "PR.DS",
        name: "Data Security",
        subcategories: [
          { id: "PR.DS-1", name: "Data-at-rest protection", description: "Data-at-rest is protected", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.DS-2", name: "Data-in-transit protection", description: "Data-in-transit is protected", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.DS-3", name: "Asset lifecycle management", description: "Assets are formally managed throughout removal, transfers, and disposition", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.DS-4", name: "Availability maintenance", description: "Adequate capacity to ensure availability is maintained", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.DS-5", name: "Data leak protection", description: "Protections against data leaks are implemented", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.DS-6", name: "Integrity verification", description: "Integrity checking mechanisms are used to verify software, firmware, and information integrity", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.DS-7", name: "Development environment protection", description: "The development and testing environment(s) are separate from the production environment", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.DS-8", name: "Hardware integrity verification", description: "Integrity checking mechanisms are used to verify hardware integrity", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
      {
        id: "PR.IP",
        name: "Information Protection Processes and Procedures",
        subcategories: [
          { id: "PR.IP-1", name: "Security baseline configuration", description: "A baseline configuration of information technology/industrial control systems is created and maintained incorporating security principles", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.IP-2", name: "System development life cycle", description: "A System Development Life Cycle to manage systems is implemented", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.IP-3", name: "Configuration change control", description: "Configuration change control processes are in place", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.IP-4", name: "Backups management", description: "Backups of information are conducted, maintained, and tested", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.IP-5", name: "Physical operating environment", description: "Policy and regulations regarding the physical operating environment for organizational assets are met", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.IP-6", name: "Data destruction", description: "Data is destroyed according to policy", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.IP-7", name: "Protection processes improvement", description: "Protection processes are improved", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.IP-8", name: "Protection technology effectiveness", description: "Effectiveness of protection technologies is shared", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.IP-9", name: "Response and recovery plans", description: "Response plans (Incident Response and Business Continuity) and recovery plans (Incident Recovery and Disaster Recovery) are in place and managed", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.IP-10", name: "Response and recovery testing", description: "Response and recovery plans are tested", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.IP-11", name: "Human resources security", description: "Cybersecurity is included in human resources practices (e.g., deprovisioning, personnel screening)", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.IP-12", name: "Vulnerability management plan", description: "A vulnerability management plan is developed and implemented", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
      {
        id: "PR.MA",
        name: "Maintenance",
        subcategories: [
          { id: "PR.MA-1", name: "Maintenance performance", description: "Maintenance and repair of organizational assets are performed and logged, with approved and controlled tools", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.MA-2", name: "Remote maintenance", description: "Remote maintenance of organizational assets is approved, logged, and performed in a manner that prevents unauthorized access", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
      {
        id: "PR.PT",
        name: "Protective Technology",
        subcategories: [
          { id: "PR.PT-1", name: "Audit logging", description: "Audit/log records are determined, documented, implemented, and reviewed in accordance with policy", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.PT-2", name: "Removable media protection", description: "Removable media is protected and its use restricted according to policy", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.PT-3", name: "Least functionality principle", description: "The principle of least functionality is incorporated by configuring systems to provide only essential capabilities", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.PT-4", name: "Communications network protection", description: "Communications and control networks are protected", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "PR.PT-5", name: "Resilience mechanisms", description: "Mechanisms (e.g., failsafe, load balancing, hot swap) are implemented to achieve resilience requirements in normal and adverse situations", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
    ]
  },
  {
    id: "DE",
    name: "Detect",
    description: "Develop and implement appropriate activities to identify the occurrence of a cybersecurity event",
    icon: Eye,
    color: "yellow",
    categories: [
      {
        id: "DE.AE",
        name: "Anomalies and Events",
        subcategories: [
          { id: "DE.AE-1", name: "Network operations baseline", description: "A baseline of network operations and expected data flows for users and systems is established and managed", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "DE.AE-2", name: "Event analysis", description: "Detected events are analyzed to understand attack targets and methods", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "DE.AE-3", name: "Event data collection", description: "Event data are collected and correlated from multiple sources and sensors", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "DE.AE-4", name: "Event impact determination", description: "Impact of events is determined", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "DE.AE-5", name: "Incident alert thresholds", description: "Incident alert thresholds are established", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
      {
        id: "DE.CM",
        name: "Security Continuous Monitoring",
        subcategories: [
          { id: "DE.CM-1", name: "Network monitoring", description: "The network is monitored to detect potential cybersecurity events", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "DE.CM-2", name: "Physical environment monitoring", description: "The physical environment is monitored to detect potential cybersecurity events", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "DE.CM-3", name: "Personnel activity monitoring", description: "Personnel activity is monitored to detect potential cybersecurity events", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "DE.CM-4", name: "Malicious code detection", description: "Malicious code is detected", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "DE.CM-5", name: "Unauthorized mobile code detection", description: "Unauthorized mobile code is detected", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "DE.CM-6", name: "External service provider monitoring", description: "External service provider activity is monitored to detect potential cybersecurity events", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "DE.CM-7", name: "Unauthorized activity monitoring", description: "Monitoring for unauthorized personnel, connections, devices, and software is performed", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "DE.CM-8", name: "Vulnerability scans", description: "Vulnerability scans are performed", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
      {
        id: "DE.DP",
        name: "Detection Processes",
        subcategories: [
          { id: "DE.DP-1", name: "Detection roles and responsibilities", description: "Roles and responsibilities for detection are well defined to ensure accountability", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "DE.DP-2", name: "Detection activities compliance", description: "Detection activities comply with all applicable requirements", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "DE.DP-3", name: "Detection process testing", description: "Detection processes are tested", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "DE.DP-4", name: "Event detection communication", description: "Event detection information is communicated", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "DE.DP-5", name: "Detection process improvement", description: "Detection processes are continuously improved", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
    ]
  },
  {
    id: "RS",
    name: "Respond",
    description: "Develop and implement appropriate activities to take action regarding a detected cybersecurity incident",
    icon: Zap,
    color: "orange",
    categories: [
      {
        id: "RS.RP",
        name: "Response Planning",
        subcategories: [
          { id: "RS.RP-1", name: "Response plan execution", description: "Response plan is executed during or after an incident", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
      {
        id: "RS.CO",
        name: "Communications",
        subcategories: [
          { id: "RS.CO-1", name: "Personnel response knowledge", description: "Personnel know their roles and order of operations when a response is needed", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "RS.CO-2", name: "Incident reporting", description: "Incidents are reported consistent with established criteria", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "RS.CO-3", name: "Information sharing", description: "Information is shared consistent with response plans", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "RS.CO-4", name: "Stakeholder coordination", description: "Coordination with stakeholders occurs consistent with response plans", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "RS.CO-5", name: "External stakeholder sharing", description: "Voluntary information sharing occurs with external stakeholders to achieve broader cybersecurity situational awareness", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
      {
        id: "RS.AN",
        name: "Analysis",
        subcategories: [
          { id: "RS.AN-1", name: "Incident investigation", description: "Notifications from detection systems are investigated", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "RS.AN-2", name: "Incident impact understanding", description: "The impact of the incident is understood", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "RS.AN-3", name: "Forensics performance", description: "Forensics are performed", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "RS.AN-4", name: "Incident categorization", description: "Incidents are categorized consistent with response plans", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "RS.AN-5", name: "Vulnerability information", description: "Processes are established to receive, analyze and respond to vulnerabilities disclosed to the organization from internal and external sources", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
      {
        id: "RS.MI",
        name: "Mitigation",
        subcategories: [
          { id: "RS.MI-1", name: "Incident containment", description: "Incidents are contained", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "RS.MI-2", name: "Incident mitigation", description: "Incidents are mitigated", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "RS.MI-3", name: "Vulnerability mitigation", description: "Newly identified vulnerabilities are mitigated or documented as accepted risks", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
      {
        id: "RS.IM",
        name: "Improvements",
        subcategories: [
          { id: "RS.IM-1", name: "Response lessons learned", description: "Response plans incorporate lessons learned", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "RS.IM-2", name: "Response strategy updates", description: "Response strategies are updated", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
    ]
  },
  {
    id: "RC",
    name: "Recover",
    description: "Develop and implement appropriate activities to maintain plans for resilience and to restore capabilities impaired due to a cybersecurity incident",
    icon: RotateCcw,
    color: "purple",
    categories: [
      {
        id: "RC.RP",
        name: "Recovery Planning",
        subcategories: [
          { id: "RC.RP-1", name: "Recovery plan execution", description: "Recovery plan is executed during or after a cybersecurity incident", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
      {
        id: "RC.IM",
        name: "Improvements",
        subcategories: [
          { id: "RC.IM-1", name: "Recovery lessons learned", description: "Recovery plans incorporate lessons learned", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "RC.IM-2", name: "Recovery strategy updates", description: "Recovery strategies are updated", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
      {
        id: "RC.CO",
        name: "Communications",
        subcategories: [
          { id: "RC.CO-1", name: "Public relations management", description: "Public relations are managed", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "RC.CO-2", name: "Reputation repair", description: "Reputation is repaired after an incident", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
          { id: "RC.CO-3", name: "Recovery communications", description: "Recovery activities are communicated to internal and external stakeholders as well as executive and management teams", status: "not_started", evidenceStatus: "none", implementationTier: "tier_1", lastUpdated: null },
        ]
      },
    ]
  },
];

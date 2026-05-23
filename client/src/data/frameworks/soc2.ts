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

export type ControlStatus = "not_started" | "in_progress" | "implemented" | "not_applicable";
export type EvidenceStatus = "none" | "partial" | "complete";

export interface Control {
  id: string;
  name: string;
  description: string;
  status: ControlStatus;
  evidenceStatus: EvidenceStatus;
  lastUpdated: string | null;
}

export interface TrustServicePrinciple {
  id: string;
  name: string;
  description: string;
  icon: typeof Shield;
  controls: Control[];
}

export const initialTrustServicePrinciples: TrustServicePrinciple[] = [
  {
    id: "CC",
    name: "Common Criteria (Security)",
    description: "Security controls that are foundational to all Trust Services Criteria",
    icon: Shield,
    controls: [
      { id: "CC1.1", name: "COSO Principle 1", description: "The entity demonstrates a commitment to integrity and ethical values.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC1.2", name: "COSO Principle 2", description: "The board of directors demonstrates independence from management and exercises oversight of the development and performance of internal control.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC1.3", name: "COSO Principle 3", description: "Management establishes, with board oversight, structures, reporting lines, and appropriate authorities and responsibilities in the pursuit of objectives.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC1.4", name: "COSO Principle 4", description: "The entity demonstrates a commitment to attract, develop, and retain competent individuals in alignment with objectives.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC1.5", name: "COSO Principle 5", description: "The entity holds individuals accountable for their internal control responsibilities in the pursuit of objectives.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC2.1", name: "COSO Principle 13", description: "The entity obtains or generates and uses relevant, quality information to support the functioning of internal control.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC2.2", name: "COSO Principle 14", description: "The entity internally communicates information, including objectives and responsibilities for internal control, necessary to support the functioning of internal control.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC2.3", name: "COSO Principle 15", description: "The entity communicates with external parties regarding matters affecting the functioning of internal control.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC3.1", name: "COSO Principle 6", description: "The entity specifies objectives with sufficient clarity to enable the identification and assessment of risks relating to objectives.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC3.2", name: "COSO Principle 7", description: "The entity identifies risks to the achievement of its objectives across the entity and analyzes risks as a basis for determining how the risks should be managed.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC3.3", name: "COSO Principle 8", description: "The entity considers the potential for fraud in assessing risks to the achievement of objectives.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC3.4", name: "COSO Principle 9", description: "The entity identifies and assesses changes that could significantly impact the system of internal control.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC4.1", name: "COSO Principle 16", description: "The entity selects, develops, and performs ongoing and/or separate evaluations to ascertain whether the components of internal control are present and functioning.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC4.2", name: "COSO Principle 17", description: "The entity evaluates and communicates internal control deficiencies in a timely manner to those parties responsible for taking corrective action, including senior management and the board of directors, as appropriate.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC5.1", name: "COSO Principle 10", description: "The entity selects and develops control activities that contribute to the mitigation of risks to the achievement of objectives to acceptable levels.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC5.2", name: "COSO Principle 11", description: "The entity also selects and develops general control activities over technology to support the achievement of objectives.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC5.3", name: "COSO Principle 12", description: "The entity deploys control activities through policies that establish what is expected and in procedures that put policies into action.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC6.1", name: "Logical and Physical Access - Implementation", description: "The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events to meet the entity's objectives.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC6.2", name: "Logical and Physical Access - Registration", description: "Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users whose access is administered by the entity.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC6.3", name: "Logical and Physical Access - Authorization", description: "The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets based on roles, responsibilities, or the system design and changes.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC6.4", name: "Logical and Physical Access - Physical Restrictions", description: "The entity restricts physical access to facilities and protected information assets to authorized personnel to meet the entity's objectives.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC6.5", name: "Logical and Physical Access - Asset Disposal", description: "The entity discontinues logical and physical protections over physical assets only after the ability to read or recover data and software from those assets has been diminished.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC6.6", name: "Logical and Physical Access - External Threats", description: "The entity implements logical access security measures to protect against threats from sources outside its system boundaries.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC6.7", name: "Logical and Physical Access - Data Transmission", description: "The entity restricts the transmission, movement, and removal of information to authorized internal and external users and processes, and protects it during transmission.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC6.8", name: "Logical and Physical Access - Malicious Software", description: "The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software to meet the entity's objectives.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC7.1", name: "System Operations - Vulnerability Detection", description: "To meet its objectives, the entity uses detection and monitoring procedures to identify changes to configurations that result in the introduction of new vulnerabilities.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC7.2", name: "System Operations - Security Incident Monitoring", description: "The entity monitors system components and the operation of those components for anomalies that are indicative of malicious acts, natural disasters, and errors affecting the entity's ability to meet its objectives.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC7.3", name: "System Operations - Security Event Evaluation", description: "The entity evaluates security events to determine whether they could or have resulted in a failure of the entity to meet its objectives and, if so, takes action to prevent or address such failures.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC7.4", name: "System Operations - Incident Response", description: "The entity responds to identified security incidents by executing a defined incident response program to understand, contain, remediate, and communicate security incidents.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC7.5", name: "System Operations - Incident Recovery", description: "The entity identifies, develops, and implements activities to recover from identified security incidents.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC8.1", name: "Change Management - Infrastructure and Software", description: "The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures to meet its objectives.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC9.1", name: "Risk Mitigation - Identification and Selection", description: "The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CC9.2", name: "Risk Mitigation - Vendor Management", description: "The entity assesses and manages risks associated with vendors and business partners.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "A",
    name: "Availability",
    description: "The system is available for operation and use as committed or agreed",
    icon: Server,
    controls: [
      { id: "A1.1", name: "Capacity Management", description: "The entity maintains, monitors, and evaluates current processing capacity and use of system components (infrastructure, data, and software) to manage capacity demand and to enable the implementation of additional capacity to help meet its objectives.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A1.2", name: "Environmental Protections", description: "The entity authorizes, designs, develops or acquires, implements, operates, approves, maintains, and monitors environmental protections, software, data backup processes, and recovery infrastructure to meet its objectives.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A1.3", name: "Recovery Testing", description: "The entity tests recovery plan procedures supporting system recovery to meet its objectives.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "PI",
    name: "Processing Integrity",
    description: "System processing is complete, valid, accurate, timely, and authorized",
    icon: CheckCircle,
    controls: [
      { id: "PI1.1", name: "Processing Objectives", description: "The entity obtains or generates, uses, and communicates relevant, quality information regarding the objectives related to processing, including definitions of data processed and product and service specifications, to support the use of products and services.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PI1.2", name: "System Input Controls", description: "The entity implements policies and procedures over system inputs, including controls over completeness and accuracy, to result in products, services, and reporting to meet the entity's objectives.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PI1.3", name: "System Processing Controls", description: "The entity implements policies and procedures over system processing to result in products, services, and reporting to meet the entity's objectives.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PI1.4", name: "System Output Controls", description: "The entity implements policies and procedures to make available or deliver output completely, accurately, and timely in accordance with specifications to meet the entity's objectives.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PI1.5", name: "Data Retention and Storage", description: "The entity implements policies and procedures to store inputs, items in processing, and outputs completely, accurately, and timely in accordance with system specifications to meet the entity's objectives.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "C",
    name: "Confidentiality",
    description: "Information designated as confidential is protected as committed or agreed",
    icon: Lock,
    controls: [
      { id: "C1.1", name: "Confidential Information Identification", description: "The entity identifies and maintains confidential information to meet the entity's objectives related to confidentiality.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "C1.2", name: "Confidential Information Disposal", description: "The entity disposes of confidential information to meet the entity's objectives related to confidentiality.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "P",
    name: "Privacy",
    description: "Personal information is collected, used, retained, disclosed, and disposed of in conformity with commitments",
    icon: UserCheck,
    controls: [
      { id: "P1.1", name: "Privacy Notice", description: "The entity provides notice to data subjects about its privacy practices to meet the entity's objectives related to privacy.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "P2.1", name: "Choice and Consent", description: "The entity communicates choices available regarding the collection, use, retention, disclosure, and disposal of personal information to data subjects and obtains consent, where required.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "P3.1", name: "Collection from Data Subjects", description: "Personal information is collected consistent with the entity's objectives related to privacy.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "P3.2", name: "Collection from Third Parties", description: "For information collected from sources other than the data subject, the entity confirms that the information relates to a data subject's privacy preferences.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "P4.1", name: "Use of Personal Information", description: "The entity limits the use of personal information to the purposes identified in the entity's objectives related to privacy.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "P4.2", name: "Retention of Personal Information", description: "The entity retains personal information consistent with the entity's objectives related to privacy.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "P4.3", name: "Disposal of Personal Information", description: "The entity securely disposes of personal information to meet the entity's objectives related to privacy.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "P5.1", name: "Third-Party Disclosure", description: "The entity grants access to personal information to third parties only for the purposes identified in the entity's objectives related to privacy and as authorized by data subjects.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "P5.2", name: "Third-Party Privacy Commitments", description: "The entity obtains privacy commitments from vendors and other third parties who have access to personal information to meet the entity's objectives related to privacy.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "P6.1", name: "Data Quality", description: "The entity collects and maintains accurate, up-to-date, complete, and relevant personal information to meet the entity's objectives related to privacy.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "P6.2", name: "Data Subject Corrections", description: "The entity corrects, amends, or appends personal information based on data subject requests and communicates such corrections to third parties as committed.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "P6.3", name: "Data Subject Access Requests", description: "The entity provides data subjects with access to their personal information for review and update.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "P6.4", name: "Appeal Process", description: "The entity implements a process for receiving, addressing, resolving, and communicating the resolution of inquiries, complaints, and disputes from data subjects.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "P6.5", name: "Data Portability", description: "The entity provides data subjects with the ability to obtain their personal information in a usable format.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "P6.6", name: "Deletion Rights", description: "The entity implements a process to receive requests for deletion of personal information and responds to such requests in accordance with its privacy commitments.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "P6.7", name: "Automated Decision-Making", description: "The entity implements policies and procedures for notifying data subjects about, and managing, automated decision-making including profiling.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "P7.1", name: "Security for Privacy", description: "The entity collects and maintains personal information to meet the entity's objectives related to privacy.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "P8.1", name: "Monitoring and Enforcement", description: "The entity implements a process for receiving, addressing, resolving, and communicating the resolution of inquiries, complaints, and disputes from data subjects and others, and periodically monitors compliance to meet the entity's objectives related to privacy.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  }
];

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Shield,
  Search,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Download,
  Users,
  Building,
  Cpu,
  Lock,
  ChevronRight,
  Filter,
  FileCheck,
  Calendar,
  Server,
  Eye,
  Key,
  AlertTriangle,
  Wrench,
  HardDrive,
  MapPin,
  ClipboardList,
  Briefcase,
  UserCheck,
  Target,
  ShoppingCart,
  Wifi,
  Bug,
  Link
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FrameworkSpreadsheet } from "@/components/compliance/FrameworkSpreadsheet";
import { Table as TableIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { CompanyProfile } from "@shared/schema";

type ControlStatus = "not_started" | "in_progress" | "implemented" | "not_applicable";
type EvidenceStatus = "none" | "partial" | "complete";
type Baseline = "low" | "moderate" | "high";

interface Control {
  id: string;
  name: string;
  description: string;
  baseline: Baseline;
  status: ControlStatus;
  evidenceStatus: EvidenceStatus;
  lastUpdated: string | null;
}

interface ControlFamily {
  id: string;
  name: string;
  description: string;
  icon: typeof Shield;
  controls: Control[];
}

const initialControlFamilies: ControlFamily[] = [
  {
    id: "AC",
    name: "Access Control",
    description: "Controls for managing access to systems and information",
    icon: Lock,
    controls: [
      { id: "AC-1", name: "Policy and Procedures", description: "Develop, document, and disseminate an access control policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-2", name: "Account Management", description: "Manage system accounts, including establishing, activating, modifying, reviewing, disabling, and removing accounts.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-3", name: "Access Enforcement", description: "Enforce approved authorizations for logical access to information and system resources.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-4", name: "Information Flow Enforcement", description: "Enforce approved authorizations for controlling the flow of information within the system and between connected systems.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-5", name: "Separation of Duties", description: "Separate duties of individuals to prevent malevolent activity without collusion.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "AU",
    name: "Audit and Accountability",
    description: "Controls for auditing and maintaining accountability of system activities",
    icon: Eye,
    controls: [
      { id: "AU-1", name: "Policy and Procedures", description: "Develop, document, and disseminate an audit and accountability policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-2", name: "Event Logging", description: "Identify the types of events that the system is capable of logging.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-3", name: "Content of Audit Records", description: "Ensure audit records contain information needed for effective analysis.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-4", name: "Audit Log Storage Capacity", description: "Allocate audit log storage capacity to accommodate audit log retention requirements.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-5", name: "Response to Audit Logging Process Failures", description: "Alert personnel or roles in the event of an audit logging process failure.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "AT",
    name: "Awareness and Training",
    description: "Controls for security awareness and training programs",
    icon: Users,
    controls: [
      { id: "AT-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a security awareness and training policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AT-2", name: "Literacy Training and Awareness", description: "Provide security and privacy literacy training to system users.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AT-3", name: "Role-based Training", description: "Provide role-based security and privacy training to personnel with assigned security roles.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AT-4", name: "Training Records", description: "Document and monitor individual security and privacy training activities.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AT-5", name: "Contacts with Security Groups", description: "Establish contacts with selected groups and associations within the security community.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "CA",
    name: "Assessment, Authorization, and Monitoring",
    description: "Controls for security assessment and continuous monitoring",
    icon: ClipboardList,
    controls: [
      { id: "CA-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a security assessment and authorization policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CA-2", name: "Control Assessments", description: "Develop a control assessment plan and assess the controls in the system.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CA-3", name: "Information Exchange", description: "Approve and manage the exchange of information between the system and other systems.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CA-5", name: "Plan of Action and Milestones", description: "Develop a plan of action and milestones for the system to document remediation actions.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CA-6", name: "Authorization", description: "Assign a senior official to authorize the system before commencing operations.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "CM",
    name: "Configuration Management",
    description: "Controls for configuration management of information systems",
    icon: Server,
    controls: [
      { id: "CM-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a configuration management policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-2", name: "Baseline Configuration", description: "Develop, document, and maintain a current baseline configuration of the system.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-3", name: "Configuration Change Control", description: "Determine and document the types of changes to the system that are configuration-controlled.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-4", name: "Impact Analyses", description: "Analyze changes to the system to determine potential security and privacy impacts.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-6", name: "Configuration Settings", description: "Establish and document configuration settings for components employed within the system.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "CP",
    name: "Contingency Planning",
    description: "Controls for contingency planning and business continuity",
    icon: AlertTriangle,
    controls: [
      { id: "CP-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a contingency planning policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-2", name: "Contingency Plan", description: "Develop a contingency plan for the system that identifies essential mission and business functions.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-3", name: "Contingency Training", description: "Provide contingency training to system users consistent with assigned roles.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-4", name: "Contingency Plan Testing", description: "Test the contingency plan for the system to determine effectiveness.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-9", name: "System Backup", description: "Conduct backups of user-level and system-level information contained in the system.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "IA",
    name: "Identification and Authentication",
    description: "Controls for user identification and authentication",
    icon: Key,
    controls: [
      { id: "IA-1", name: "Policy and Procedures", description: "Develop, document, and disseminate an identification and authentication policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-2", name: "Identification and Authentication (Organizational Users)", description: "Uniquely identify and authenticate organizational users and associate that identification with processes.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-4", name: "Identifier Management", description: "Manage system identifiers by receiving authorization and selecting appropriate identifiers.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-5", name: "Authenticator Management", description: "Manage system authenticators by verifying the identity of individuals and establishing initial authenticator content.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-8", name: "Identification and Authentication (Non-Organizational Users)", description: "Uniquely identify and authenticate non-organizational users or processes acting on behalf of non-organizational users.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "IR",
    name: "Incident Response",
    description: "Controls for incident response capabilities",
    icon: AlertCircle,
    controls: [
      { id: "IR-1", name: "Policy and Procedures", description: "Develop, document, and disseminate an incident response policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IR-2", name: "Incident Response Training", description: "Provide incident response training to system users consistent with assigned roles.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IR-4", name: "Incident Handling", description: "Implement an incident handling capability for incidents that includes preparation, detection, containment, eradication, and recovery.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IR-5", name: "Incident Monitoring", description: "Track and document system incidents on an ongoing basis.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IR-6", name: "Incident Reporting", description: "Require personnel to report suspected incidents to the organizational incident response capability.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "MA",
    name: "Maintenance",
    description: "Controls for system maintenance activities",
    icon: Wrench,
    controls: [
      { id: "MA-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a system maintenance policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MA-2", name: "Controlled Maintenance", description: "Schedule, document, and review records of maintenance and repairs on system components.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MA-3", name: "Maintenance Tools", description: "Approve, control, and monitor the use of system maintenance tools.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MA-4", name: "Nonlocal Maintenance", description: "Approve and monitor nonlocal maintenance and diagnostic activities.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MA-5", name: "Maintenance Personnel", description: "Establish a process for maintenance personnel authorization and maintain a list of authorized personnel.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "MP",
    name: "Media Protection",
    description: "Controls for protecting system media",
    icon: HardDrive,
    controls: [
      { id: "MP-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a media protection policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MP-2", name: "Media Access", description: "Restrict access to digital and non-digital media to authorized individuals.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MP-3", name: "Media Marking", description: "Mark system media indicating the distribution limitations, handling caveats, and applicable security markings.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MP-4", name: "Media Storage", description: "Physically control and securely store digital and non-digital media within controlled areas.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MP-6", name: "Media Sanitization", description: "Sanitize system media prior to disposal, release, or reuse.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "PE",
    name: "Physical and Environmental Protection",
    description: "Controls for physical and environmental security",
    icon: MapPin,
    controls: [
      { id: "PE-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a physical and environmental protection policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-2", name: "Physical Access Authorizations", description: "Develop, approve, and maintain a list of individuals with authorized access to the facility.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-3", name: "Physical Access Control", description: "Enforce physical access authorizations at entry and exit points to the facility.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-6", name: "Monitoring Physical Access", description: "Monitor physical access to the facility where the system resides to detect and respond to incidents.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-8", name: "Visitor Access Records", description: "Maintain visitor access records to the facility where the system resides.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "PL",
    name: "Planning",
    description: "Controls for security planning activities",
    icon: ClipboardList,
    controls: [
      { id: "PL-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a planning policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PL-2", name: "System Security and Privacy Plans", description: "Develop security and privacy plans for the system that describe the controls in place.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PL-4", name: "Rules of Behavior", description: "Establish and make available to individuals requiring access rules describing their responsibilities.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PL-8", name: "Security and Privacy Architectures", description: "Develop security and privacy architectures that describe the overall philosophy and strategy.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PL-10", name: "Baseline Selection", description: "Select the appropriate set of security controls for the system based on its categorization.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "PM",
    name: "Program Management",
    description: "Controls for organization-wide information security program",
    icon: Briefcase,
    controls: [
      { id: "PM-1", name: "Information Security Program Plan", description: "Develop and disseminate an organization-wide information security program plan.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PM-2", name: "Information Security Program Leadership Role", description: "Appoint a senior agency information security officer with mission and resources.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PM-3", name: "Information Security and Privacy Resources", description: "Include the resources needed to implement the information security and privacy programs.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PM-5", name: "System Inventory", description: "Develop and maintain an inventory of organizational systems.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PM-9", name: "Risk Management Strategy", description: "Develop a comprehensive strategy to manage risk to organizational operations and assets.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "PS",
    name: "Personnel Security",
    description: "Controls for personnel security measures",
    icon: UserCheck,
    controls: [
      { id: "PS-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a personnel security policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PS-2", name: "Position Risk Designation", description: "Assign a risk designation to all organizational positions and establish screening criteria.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PS-3", name: "Personnel Screening", description: "Screen individuals prior to authorizing access to the system and rescreen as required.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PS-4", name: "Personnel Termination", description: "Upon termination of individual employment, disable system access and terminate credentials.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PS-5", name: "Personnel Transfer", description: "Review and confirm ongoing access authorization requirements when personnel transfer or reassign.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "RA",
    name: "Risk Assessment",
    description: "Controls for risk assessment activities",
    icon: Target,
    controls: [
      { id: "RA-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a risk assessment policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "RA-2", name: "Security Categorization", description: "Categorize the system and the information it processes, stores, and transmits.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "RA-3", name: "Risk Assessment", description: "Conduct a risk assessment to identify threats to and vulnerabilities of the system.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "RA-5", name: "Vulnerability Monitoring and Scanning", description: "Monitor and scan for vulnerabilities in the system and hosted applications.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "RA-7", name: "Risk Response", description: "Respond to findings from security and privacy assessments, monitoring, and audits.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "SA",
    name: "System and Services Acquisition",
    description: "Controls for system and services acquisition",
    icon: ShoppingCart,
    controls: [
      { id: "SA-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a system and services acquisition policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-2", name: "Allocation of Resources", description: "Determine the high-level information security and privacy requirements for the system.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-3", name: "System Development Life Cycle", description: "Acquire, develop, and manage the system using a system development life cycle methodology.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-4", name: "Acquisition Process", description: "Include security and privacy functional requirements in the acquisition contract.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-9", name: "External System Services", description: "Require providers of external system services to comply with security and privacy requirements.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "SC",
    name: "System and Communications Protection",
    description: "Controls for protecting system and communications",
    icon: Wifi,
    controls: [
      { id: "SC-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a system and communications protection policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-5", name: "Denial-of-Service Protection", description: "Protect against or limit the effects of denial-of-service attacks by employing security safeguards.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-7", name: "Boundary Protection", description: "Monitor and control communications at the external managed interfaces to the system.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-8", name: "Transmission Confidentiality and Integrity", description: "Protect the confidentiality and integrity of transmitted information.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-12", name: "Cryptographic Key Establishment and Management", description: "Establish and manage cryptographic keys when cryptography is employed within the system.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "SI",
    name: "System and Information Integrity",
    description: "Controls for system and information integrity",
    icon: Bug,
    controls: [
      { id: "SI-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a system and information integrity policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-2", name: "Flaw Remediation", description: "Identify, report, and correct system flaws in a timely manner.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-3", name: "Malicious Code Protection", description: "Implement malicious code protection mechanisms at system entry and exit points.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-4", name: "System Monitoring", description: "Monitor the system to detect attacks and indicators of potential attacks.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-5", name: "Security Alerts, Advisories, and Directives", description: "Receive system security alerts, advisories, and directives from external organizations.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "SR",
    name: "Supply Chain Risk Management",
    description: "Controls for managing supply chain risks",
    icon: Link,
    controls: [
      { id: "SR-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a supply chain risk management policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SR-2", name: "Supply Chain Risk Management Plan", description: "Develop a plan for managing supply chain risks associated with the development and procurement.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SR-3", name: "Supply Chain Controls and Processes", description: "Establish a process to identify and address weaknesses or deficiencies in supply chain elements.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SR-5", name: "Acquisition Strategies, Tools, and Methods", description: "Employ acquisition strategies, contract tools, and procurement methods to protect against supply chain risks.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SR-11", name: "Component Authenticity", description: "Develop and implement anti-counterfeit policy and procedures for components.", baseline: "high", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  }
];

export default function FedRAMPFramework() {
  const { toast } = useToast();
  const [controlFamilies, setControlFamilies] = useState<ControlFamily[]>(initialControlFamilies);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [familyFilter, setFamilyFilter] = useState<string>("all");
  const [baselineFilter, setBaselineFilter] = useState<string>("all");
  const [expandedFamilies, setExpandedFamilies] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("controls");
  const [selectedCompanyProfileId, setSelectedCompanyProfileId] = useState<string | null>(null);

  const { data: companyProfiles } = useQuery<CompanyProfile[]>({
    queryKey: ['/api/company-profiles'],
  });

  const allControls = useMemo(() => {
    return controlFamilies.flatMap(family => 
      family.controls.map(control => ({ ...control, familyId: family.id, familyName: family.name }))
    );
  }, [controlFamilies]);

  const filteredControls = useMemo(() => {
    return allControls.filter(control => {
      const matchesSearch = searchTerm === "" || 
        control.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        control.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        control.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || control.status === statusFilter;
      const matchesFamily = familyFilter === "all" || control.familyId === familyFilter;
      const matchesBaseline = baselineFilter === "all" || control.baseline === baselineFilter;
      
      return matchesSearch && matchesStatus && matchesFamily && matchesBaseline;
    });
  }, [allControls, searchTerm, statusFilter, familyFilter, baselineFilter]);

  const stats = useMemo(() => {
    const total = allControls.length;
    const implemented = allControls.filter(c => c.status === "implemented").length;
    const inProgress = allControls.filter(c => c.status === "in_progress").length;
    const notStarted = allControls.filter(c => c.status === "not_started").length;
    const notApplicable = allControls.filter(c => c.status === "not_applicable").length;
    const applicableTotal = total - notApplicable;
    const score = applicableTotal > 0 ? Math.round((implemented / applicableTotal) * 100) : 0;
    
    const lowBaseline = allControls.filter(c => c.baseline === "low").length;
    const moderateBaseline = allControls.filter(c => c.baseline === "moderate").length;
    const highBaseline = allControls.filter(c => c.baseline === "high").length;
    
    return { total, implemented, inProgress, notStarted, notApplicable, score, lowBaseline, moderateBaseline, highBaseline };
  }, [allControls]);

  const updateControlStatus = (controlId: string, newStatus: ControlStatus) => {
    setControlFamilies(families => 
      families.map(family => ({
        ...family,
        controls: family.controls.map(control => 
          control.id === controlId 
            ? { ...control, status: newStatus, lastUpdated: new Date().toISOString() }
            : control
        )
      }))
    );
    toast({
      title: "Control Updated",
      description: `${controlId} status changed to ${newStatus.replace("_", " ")}`,
    });
  };

  const updateEvidenceStatus = (controlId: string, newStatus: EvidenceStatus) => {
    setControlFamilies(families => 
      families.map(family => ({
        ...family,
        controls: family.controls.map(control => 
          control.id === controlId 
            ? { ...control, evidenceStatus: newStatus, lastUpdated: new Date().toISOString() }
            : control
        )
      }))
    );
  };

  const handleGenerateDocument = (controlId: string, controlName: string) => {
    toast({
      title: "Generating Document",
      description: `Creating documentation for ${controlId}: ${controlName}`,
    });
  };

  const handleGenerateAllDocuments = () => {
    toast({
      title: "Generating All Documents",
      description: `Creating documentation for all ${stats.total} FedRAMP controls`,
    });
  };

  const getStatusBadge = (status: ControlStatus) => {
    switch (status) {
      case "implemented":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="w-3 h-3 mr-1" />Implemented</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "not_started":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"><AlertCircle className="w-3 h-3 mr-1" />Not Started</Badge>;
      case "not_applicable":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><XCircle className="w-3 h-3 mr-1" />N/A</Badge>;
    }
  };

  const getBaselineBadge = (baseline: Baseline) => {
    switch (baseline) {
      case "low":
        return <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">Low</Badge>;
      case "moderate":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">Moderate</Badge>;
      case "high":
        return <Badge variant="outline" className="border-red-500 text-red-700 dark:text-red-400">High</Badge>;
    }
  };

  const getEvidenceBadge = (status: EvidenceStatus) => {
    switch (status) {
      case "complete":
        return <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400"><FileCheck className="w-3 h-3 mr-1" />Complete</Badge>;
      case "partial":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400"><FileText className="w-3 h-3 mr-1" />Partial</Badge>;
      case "none":
        return <Badge variant="outline" className="border-gray-400 text-gray-600 dark:text-gray-400"><FileText className="w-3 h-3 mr-1" />None</Badge>;
    }
  };

  const getFamilyStats = (family: ControlFamily) => {
    const total = family.controls.length;
    const implemented = family.controls.filter(c => c.status === "implemented").length;
    const inProgress = family.controls.filter(c => c.status === "in_progress").length;
    return { total, implemented, inProgress };
  };

  const filteredFamilies = useMemo(() => {
    if (familyFilter !== "all") {
      return controlFamilies.filter(f => f.id === familyFilter);
    }
    return controlFamilies;
  }, [controlFamilies, familyFilter]);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-page-title">
              FedRAMP - Federal Risk and Authorization Management Program
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              NIST 800-53 based security controls for federal cloud services
            </p>
          </div>
        </div>
        <Button 
          onClick={handleGenerateAllDocuments}
          data-testid="button-generate-all-documents"
        >
          <Download className="h-4 w-4 mr-2" />
          Generate All Documents
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList data-testid="tabs-framework-sections">
            <TabsTrigger value="controls" data-testid="tab-controls">
              <Shield className="h-4 w-4 mr-2" />
              Controls
            </TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-templates">
              <TableIcon className="h-4 w-4 mr-2" />
              Template Data
            </TabsTrigger>
          </TabsList>

          {activeTab === "templates" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Company Profile:</span>
              <Select 
                value={selectedCompanyProfileId || ""} 
                onValueChange={(v) => setSelectedCompanyProfileId(v || null)}
              >
                <SelectTrigger className="w-[200px]" data-testid="select-company-profile">
                  <SelectValue placeholder="Select profile..." />
                </SelectTrigger>
                <SelectContent>
                  {companyProfiles?.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <TabsContent value="templates" className="space-y-4">
          <FrameworkSpreadsheet 
            framework="FedRAMP" 
            companyProfileId={selectedCompanyProfileId} 
          />
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ChevronRight className="h-5 w-5" />
                Overall Compliance Progress
              </CardTitle>
              <CardDescription>
                Track your organization's FedRAMP implementation status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Compliance Score</span>
                  <span className="text-2xl font-bold" data-testid="text-compliance-score">{stats.score}%</span>
                </div>
                <Progress value={stats.score} className="h-3" data-testid="progress-compliance" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t">
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
                <div className="text-2xl font-bold text-green-700 dark:text-green-400" data-testid="text-stat-implemented">
                  {stats.implemented}
                </div>
                <div className="text-xs text-green-600 dark:text-green-500">Implemented</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400" data-testid="text-stat-in-progress">
                  {stats.inProgress}
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-500">In Progress</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div className="text-2xl font-bold text-gray-700 dark:text-gray-400" data-testid="text-stat-not-started">
                  {stats.notStarted}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-500">Not Started</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400" data-testid="text-stat-total">
                  {stats.total}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-500">Total Controls</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t">
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
                <div className="text-xl font-bold text-green-700 dark:text-green-400" data-testid="text-baseline-low">
                  {stats.lowBaseline}
                </div>
                <div className="text-xs text-green-600 dark:text-green-500">Low Baseline</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <div className="text-xl font-bold text-yellow-700 dark:text-yellow-400" data-testid="text-baseline-moderate">
                  {stats.moderateBaseline}
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-500">Moderate Baseline</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950">
                <div className="text-xl font-bold text-red-700 dark:text-red-400" data-testid="text-baseline-high">
                  {stats.highBaseline}
                </div>
                <div className="text-xs text-red-600 dark:text-red-500">High Baseline</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search controls by ID or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-controls"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="implemented">Implemented</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="not_applicable">Not Applicable</SelectItem>
              </SelectContent>
            </Select>
            <Select value={familyFilter} onValueChange={setFamilyFilter}>
              <SelectTrigger data-testid="select-family-filter">
                <SelectValue placeholder="Filter by family" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Families</SelectItem>
                {controlFamilies.map(family => (
                  <SelectItem key={family.id} value={family.id}>
                    {family.id} - {family.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={baselineFilter} onValueChange={setBaselineFilter}>
              <SelectTrigger data-testid="select-baseline-filter">
                <SelectValue placeholder="Filter by baseline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Baselines</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || statusFilter !== "all" || familyFilter !== "all" || baselineFilter !== "all") && (
            <div className="mt-3 text-sm text-muted-foreground">
              Showing {filteredControls.length} of {stats.total} controls
            </div>
          )}
        </CardContent>
      </Card>

      <Accordion 
        type="multiple" 
        value={expandedFamilies} 
        onValueChange={setExpandedFamilies}
        className="space-y-4"
      >
        {filteredFamilies.map(family => {
          const familyStats = getFamilyStats(family);
          const FamilyIcon = family.icon;
          const familyControls = (searchTerm || statusFilter !== "all" || baselineFilter !== "all")
            ? family.controls.filter(c => {
                const matchesSearch = searchTerm === "" || 
                  c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = statusFilter === "all" || c.status === statusFilter;
                const matchesBaseline = baselineFilter === "all" || c.baseline === baselineFilter;
                return matchesSearch && matchesStatus && matchesBaseline;
              })
            : family.controls;

          if (familyControls.length === 0) return null;

          return (
            <AccordionItem 
              key={family.id} 
              value={family.id}
              className="border rounded-lg"
              data-testid={`accordion-family-${family.id}`}
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <FamilyIcon className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{family.id} - {family.name}</div>
                      <div className="text-sm text-muted-foreground">{family.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2">
                      <Badge variant="outline">{familyControls.length} controls</Badge>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {familyStats.implemented} done
                      </Badge>
                    </div>
                    <Progress 
                      value={(familyStats.implemented / familyStats.total) * 100} 
                      className="w-20 h-2 hidden sm:block"
                    />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 mt-2">
                  {familyControls.map(control => (
                    <Card key={control.id} className="border" data-testid={`card-control-${control.id}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start gap-2 mb-2">
                              <Badge variant="secondary" className="shrink-0">{control.id}</Badge>
                              {getBaselineBadge(control.baseline)}
                              <h4 className="font-medium text-sm">{control.name}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {control.description}
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center gap-3">
                            <Select 
                              value={control.status} 
                              onValueChange={(value) => updateControlStatus(control.id, value as ControlStatus)}
                            >
                              <SelectTrigger 
                                className="w-full sm:w-[160px]"
                                data-testid={`select-status-${control.id}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="not_started">Not Started</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="implemented">Implemented</SelectItem>
                                <SelectItem value="not_applicable">Not Applicable</SelectItem>
                              </SelectContent>
                            </Select>

                            <Select 
                              value={control.evidenceStatus} 
                              onValueChange={(value) => updateEvidenceStatus(control.id, value as EvidenceStatus)}
                            >
                              <SelectTrigger 
                                className="w-full sm:w-[140px]"
                                data-testid={`select-evidence-${control.id}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Evidence</SelectItem>
                                <SelectItem value="partial">Partial</SelectItem>
                                <SelectItem value="complete">Complete</SelectItem>
                              </SelectContent>
                            </Select>

                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleGenerateDocument(control.id, control.name)}
                              data-testid={`button-generate-${control.id}`}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Generate Doc</span>
                              <span className="sm:hidden">Generate</span>
                            </Button>
                          </div>
                        </div>

                        {control.lastUpdated && (
                          <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Last updated: {new Date(control.lastUpdated).toLocaleDateString()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {filteredControls.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Controls Found</h3>
            <p className="text-muted-foreground text-sm">
              No controls match your current filter criteria. Try adjusting your search or filters.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setFamilyFilter("all");
                setBaselineFilter("all");
              }}
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

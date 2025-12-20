import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Table as TableIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FrameworkSpreadsheet } from "@/components/compliance/FrameworkSpreadsheet";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CompanyProfile, FrameworkControlStatus } from "@shared/schema";

type ControlStatus = "not_started" | "in_progress" | "implemented" | "not_applicable";
type EvidenceStatus = "none" | "partial" | "complete";

interface Control {
  id: string;
  name: string;
  description: string;
  status: ControlStatus;
  evidenceStatus: EvidenceStatus;
  lastUpdated: string | null;
}

interface ControlDomain {
  id: string;
  name: string;
  description: string;
  icon: typeof Shield;
  controls: Control[];
}

const initialControlDomains: ControlDomain[] = [
  {
    id: "A.5",
    name: "Organizational controls",
    description: "Policies, procedures, and organizational structures for information security",
    icon: Building,
    controls: [
      { id: "A.5.1", name: "Policies for information security", description: "Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant interested parties, and reviewed at planned intervals and if significant changes occur.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.2", name: "Information security roles and responsibilities", description: "Information security roles and responsibilities shall be defined and allocated according to the organization needs.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.3", name: "Segregation of duties", description: "Conflicting duties and conflicting areas of responsibility shall be segregated.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.4", name: "Management responsibilities", description: "Management shall require all personnel to apply information security in accordance with the established information security policy, topic-specific policies and procedures of the organization.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.5", name: "Contact with authorities", description: "The organization shall establish and maintain contact with relevant authorities.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.6", name: "Contact with special interest groups", description: "The organization shall establish and maintain contact with special interest groups or other specialist security forums and professional associations.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.7", name: "Threat intelligence", description: "Information relating to information security threats shall be collected and analysed to produce threat intelligence.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.8", name: "Information security in project management", description: "Information security shall be integrated into project management.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.9", name: "Inventory of information and other associated assets", description: "An inventory of information and other associated assets, including owners, shall be developed and maintained.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.10", name: "Acceptable use of information and other associated assets", description: "Rules for the acceptable use and procedures for handling information and other associated assets shall be identified, documented and implemented.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.11", name: "Return of assets", description: "Personnel and other interested parties as appropriate shall return all the organization's assets in their possession upon change or termination of their employment, contract or agreement.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.12", name: "Classification of information", description: "Information shall be classified according to the information security needs of the organization based on confidentiality, integrity, availability and relevant interested party requirements.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.13", name: "Labelling of information", description: "An appropriate set of procedures for information labelling shall be developed and implemented in accordance with the information classification scheme adopted by the organization.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.14", name: "Information transfer", description: "Information transfer rules, procedures, or agreements shall be in place for all types of transfer facilities within the organization and between the organization and other parties.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.15", name: "Access control", description: "Rules to control physical and logical access to information and other associated assets shall be established and implemented based on business and information security requirements.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.16", name: "Identity management", description: "The full life cycle of identities shall be managed.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.17", name: "Authentication information", description: "Allocation and management of authentication information shall be controlled by a management process, including advising personnel on appropriate handling of authentication information.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.18", name: "Access rights", description: "Access rights to information and other associated assets shall be provisioned, reviewed, modified and removed in accordance with the organization's topic-specific policy on and rules for access control.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.19", name: "Information security in supplier relationships", description: "Processes and procedures shall be defined and implemented to manage the information security risks associated with the use of supplier's products or services.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.20", name: "Addressing information security within supplier agreements", description: "Relevant information security requirements shall be established and agreed with each supplier based on the type of supplier relationship.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.21", name: "Managing information security in the ICT supply chain", description: "Processes and procedures shall be defined and implemented to manage the information security risks associated with the ICT products and services supply chain.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.22", name: "Monitoring, review and change management of supplier services", description: "The organization shall regularly monitor, review, evaluate and manage change in supplier information security practices and service delivery.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.23", name: "Information security for use of cloud services", description: "Processes for acquisition, use, management and exit from cloud services shall be established in accordance with the organization's information security requirements.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.24", name: "Information security incident management planning and preparation", description: "The organization shall plan and prepare for managing information security incidents by defining, establishing and communicating information security incident management processes, roles and responsibilities.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.25", name: "Assessment and decision on information security events", description: "The organization shall assess information security events and decide if they are to be categorized as information security incidents.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.26", name: "Response to information security incidents", description: "Information security incidents shall be responded to in accordance with the documented procedures.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.27", name: "Learning from information security incidents", description: "Knowledge gained from information security incidents shall be used to strengthen and improve the information security controls.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.28", name: "Collection of evidence", description: "The organization shall establish and implement procedures for the identification, collection, acquisition and preservation of evidence related to information security events.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.29", name: "Information security during disruption", description: "The organization shall plan how to maintain information security at an appropriate level during disruption.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.30", name: "ICT readiness for business continuity", description: "ICT readiness shall be planned, implemented, maintained and tested based on business continuity objectives and ICT continuity requirements.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.31", name: "Legal, statutory, regulatory and contractual requirements", description: "Legal, statutory, regulatory and contractual requirements relevant to information security and the organization's approach to meet these requirements shall be identified, documented and kept up to date.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.32", name: "Intellectual property rights", description: "The organization shall implement appropriate procedures to protect intellectual property rights.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.33", name: "Protection of records", description: "Records shall be protected from loss, destruction, falsification, unauthorized access and unauthorized release.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.34", name: "Privacy and protection of PII", description: "The organization shall identify and meet the requirements regarding the preservation of privacy and protection of PII according to applicable laws and regulations and contractual requirements.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.35", name: "Independent review of information security", description: "The organization's approach to managing information security and its implementation including people, processes and technologies shall be reviewed independently at planned intervals, or when significant changes occur.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.36", name: "Compliance with policies, rules and standards for information security", description: "Compliance with the organization's information security policy, topic-specific policies, rules and standards shall be regularly reviewed.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.5.37", name: "Documented operating procedures", description: "Operating procedures for information processing facilities shall be documented and made available to personnel who need them.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "A.6",
    name: "People controls",
    description: "Controls related to personnel security throughout employment lifecycle",
    icon: Users,
    controls: [
      { id: "A.6.1", name: "Screening", description: "Background verification checks on all candidates to become personnel shall be carried out prior to joining the organization and on an ongoing basis taking into consideration applicable laws, regulations and ethics and be proportional to the business requirements, the classification of the information to be accessed and the perceived risks.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.6.2", name: "Terms and conditions of employment", description: "The employment contractual agreements shall state the personnel's and the organization's responsibilities for information security.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.6.3", name: "Information security awareness, education and training", description: "Personnel of the organization and relevant interested parties shall receive appropriate information security awareness, education and training and regular updates of the organization's information security policy, topic-specific policies and procedures, as relevant for their job function.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.6.4", name: "Disciplinary process", description: "A disciplinary process shall be formalized and communicated to take actions against personnel and other relevant interested parties who have committed an information security policy violation.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.6.5", name: "Responsibilities after termination or change of employment", description: "Information security responsibilities and duties that remain valid after termination or change of employment shall be defined, enforced and communicated to relevant personnel and other interested parties.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.6.6", name: "Confidentiality or non-disclosure agreements", description: "Confidentiality or non-disclosure agreements reflecting the organization's needs for the protection of information shall be identified, documented, regularly reviewed and signed by personnel and other relevant interested parties.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.6.7", name: "Remote working", description: "Security measures shall be implemented when personnel are working remotely to protect information accessed, processed or stored outside the organization's premises.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.6.8", name: "Information security event reporting", description: "The organization shall provide a mechanism for personnel to report observed or suspected information security events through appropriate channels in a timely manner.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "A.7",
    name: "Physical controls",
    description: "Physical security measures for protecting facilities and equipment",
    icon: Lock,
    controls: [
      { id: "A.7.1", name: "Physical security perimeters", description: "Security perimeters shall be defined and used to protect areas that contain information and other associated assets.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.7.2", name: "Physical entry", description: "Secure areas shall be protected by appropriate entry controls and access points.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.7.3", name: "Securing offices, rooms and facilities", description: "Physical security for offices, rooms and facilities shall be designed and implemented.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.7.4", name: "Physical security monitoring", description: "Premises shall be continuously monitored for unauthorized physical access.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.7.5", name: "Protecting against physical and environmental threats", description: "Protection against physical and environmental threats, such as natural disasters and other intentional or unintentional physical threats to infrastructure shall be designed and implemented.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.7.6", name: "Working in secure areas", description: "Security measures for working in secure areas shall be designed and implemented.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.7.7", name: "Clear desk and clear screen", description: "Clear desk rules for papers and removable storage media and clear screen rules for information processing facilities shall be defined and appropriately enforced.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.7.8", name: "Equipment siting and protection", description: "Equipment shall be sited securely and protected.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.7.9", name: "Security of assets off-premises", description: "Off-site assets shall be protected.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.7.10", name: "Storage media", description: "Storage media shall be managed through their life cycle of acquisition, use, transportation and disposal in accordance with the organization's classification scheme and handling requirements.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.7.11", name: "Supporting utilities", description: "Information processing facilities shall be protected from power failures and other disruptions caused by failures in supporting utilities.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.7.12", name: "Cabling security", description: "Cables carrying power, data or supporting information services shall be protected from interception, interference or damage.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.7.13", name: "Equipment maintenance", description: "Equipment shall be maintained correctly to ensure availability, integrity and confidentiality of information.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.7.14", name: "Secure disposal or re-use of equipment", description: "Items of equipment containing storage media shall be verified to ensure that any sensitive data and licensed software has been removed or securely overwritten prior to disposal or re-use.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "A.8",
    name: "Technological controls",
    description: "Technical security measures for systems and applications",
    icon: Cpu,
    controls: [
      { id: "A.8.1", name: "User endpoint devices", description: "Information stored on, processed by or accessible via user endpoint devices shall be protected.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.2", name: "Privileged access rights", description: "The allocation and use of privileged access rights shall be restricted and managed.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.3", name: "Information access restriction", description: "Access to information and other associated assets shall be restricted in accordance with the established topic-specific policy on access control.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.4", name: "Access to source code", description: "Read and write access to source code, development tools and software libraries shall be appropriately managed.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.5", name: "Secure authentication", description: "Secure authentication technologies and procedures shall be implemented based on information access restrictions and the topic-specific policy on access control.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.6", name: "Capacity management", description: "The use of resources shall be monitored and adjusted in line with current and expected capacity requirements.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.7", name: "Protection against malware", description: "Protection against malware shall be implemented and supported by appropriate user awareness.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.8", name: "Management of technical vulnerabilities", description: "Information about technical vulnerabilities of information systems in use shall be obtained, the organization's exposure to such vulnerabilities shall be evaluated and appropriate measures shall be taken.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.9", name: "Configuration management", description: "Configurations, including security configurations, of hardware, software, services and networks shall be established, documented, implemented, monitored and reviewed.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.10", name: "Information deletion", description: "Information stored in information systems, devices or in any other storage media shall be deleted when no longer required.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.11", name: "Data masking", description: "Data masking shall be used in accordance with the organization's topic-specific policy on access control and other related topic-specific policies, and business requirements, taking applicable legislation into consideration.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.12", name: "Data leakage prevention", description: "Data leakage prevention measures shall be applied to systems, networks and any other devices that process, store or transmit sensitive information.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.13", name: "Information backup", description: "Backup copies of information, software and systems shall be maintained and regularly tested in accordance with the agreed topic-specific policy on backup.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.14", name: "Redundancy of information processing facilities", description: "Information processing facilities shall be implemented with redundancy sufficient to meet availability requirements.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.15", name: "Logging", description: "Logs that record activities, exceptions, faults and other relevant events shall be produced, stored, protected and analysed.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.16", name: "Monitoring activities", description: "Networks, systems and applications shall be monitored for anomalous behaviour and appropriate actions taken to evaluate potential information security incidents.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.17", name: "Clock synchronization", description: "The clocks of information processing systems used by the organization shall be synchronized to approved time sources.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.18", name: "Use of privileged utility programs", description: "The use of utility programs that can be capable of overriding system and application controls shall be restricted and tightly controlled.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.19", name: "Installation of software on operational systems", description: "Procedures and measures shall be implemented to securely manage software installation on operational systems.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.20", name: "Networks security", description: "Networks and network devices shall be secured, managed and controlled to protect information in systems and applications.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.21", name: "Security of network services", description: "Security mechanisms, service levels and service requirements of network services shall be identified, implemented and monitored.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.22", name: "Segregation of networks", description: "Groups of information services, users and information systems shall be segregated in the organization's networks.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.23", name: "Web filtering", description: "Access to external websites shall be managed to reduce exposure to malicious content.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.24", name: "Use of cryptography", description: "Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.25", name: "Secure development life cycle", description: "Rules for the secure development of software and systems shall be established and applied.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.26", name: "Application security requirements", description: "Information security requirements shall be identified, specified and approved when developing or acquiring applications.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.27", name: "Secure system architecture and engineering principles", description: "Principles for engineering secure systems shall be established, documented, maintained and applied to any information system development activities.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.28", name: "Secure coding", description: "Secure coding principles shall be applied to software development.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.29", name: "Security testing in development and acceptance", description: "Security testing processes shall be defined and implemented in the development life cycle.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.30", name: "Outsourced development", description: "The organization shall direct, monitor and review the activities related to outsourced system development.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.31", name: "Separation of development, test and production environments", description: "Development, testing and production environments shall be separated and secured.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.32", name: "Change management", description: "Changes to information processing facilities and information systems shall be subject to change management procedures.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.33", name: "Test information", description: "Test information shall be appropriately selected, protected and managed.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "A.8.34", name: "Protection of information systems during audit testing", description: "Audit tests and other assurance activities involving assessment of operational systems shall be planned and agreed between the tester and appropriate management.", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  }
];

export default function ISO27001Framework() {
  const { toast } = useToast();
  const [controlDomains, setControlDomains] = useState<ControlDomain[]>(initialControlDomains);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [expandedDomains, setExpandedDomains] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("controls");
  const [selectedCompanyProfileId, setSelectedCompanyProfileId] = useState<string | null>(null);

  const { data: companyProfiles } = useQuery<CompanyProfile[]>({
    queryKey: ['/api/company-profiles'],
  });

  // Fetch control statuses from the database
  const { data: savedStatuses, isLoading: statusesLoading } = useQuery<FrameworkControlStatus[]>({
    queryKey: ['/api/frameworks', 'iso27001', 'control-statuses'],
  });

  // Mutation for updating control status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ controlId, status, evidenceStatus, notes }: { 
      controlId: string; 
      status?: ControlStatus; 
      evidenceStatus?: EvidenceStatus;
      notes?: string;
    }) => {
      return await apiRequest(`/api/frameworks/iso27001/control-statuses/${encodeURIComponent(controlId)}`, {
        method: 'PUT',
        body: JSON.stringify({ status, evidenceStatus, notes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/frameworks', 'iso27001', 'control-statuses'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save",
        description: error.message || "Could not save control status to database",
        variant: "destructive",
      });
    }
  });

  // Merge saved statuses with static control definitions
  useEffect(() => {
    if (savedStatuses && savedStatuses.length > 0) {
      setControlDomains(domains => 
        domains.map(domain => ({
          ...domain,
          controls: domain.controls.map(control => {
            const saved = savedStatuses.find(s => s.controlId === control.id);
            if (saved) {
              return {
                ...control,
                status: (saved.status || "not_started") as ControlStatus,
                evidenceStatus: (saved.evidenceStatus || "none") as EvidenceStatus,
                lastUpdated: saved.updatedAt ? new Date(saved.updatedAt).toISOString() : null,
              };
            }
            return control;
          })
        }))
      );
    }
  }, [savedStatuses]);

  const allControls = useMemo(() => {
    return controlDomains.flatMap(domain => 
      domain.controls.map(control => ({ ...control, domainId: domain.id, domainName: domain.name }))
    );
  }, [controlDomains]);

  const filteredControls = useMemo(() => {
    return allControls.filter(control => {
      const matchesSearch = searchTerm === "" || 
        control.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        control.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        control.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || control.status === statusFilter;
      const matchesDomain = domainFilter === "all" || control.domainId === domainFilter;
      
      return matchesSearch && matchesStatus && matchesDomain;
    });
  }, [allControls, searchTerm, statusFilter, domainFilter]);

  const stats = useMemo(() => {
    const total = allControls.length;
    const implemented = allControls.filter(c => c.status === "implemented").length;
    const inProgress = allControls.filter(c => c.status === "in_progress").length;
    const notStarted = allControls.filter(c => c.status === "not_started").length;
    const notApplicable = allControls.filter(c => c.status === "not_applicable").length;
    const applicableTotal = total - notApplicable;
    const score = applicableTotal > 0 ? Math.round((implemented / applicableTotal) * 100) : 0;
    
    return { total, implemented, inProgress, notStarted, notApplicable, score };
  }, [allControls]);

  const updateControlStatus = (controlId: string, newStatus: ControlStatus) => {
    // Deep clone previous state for rollback (spread only creates shallow copy)
    const previousDomains = controlDomains.map(domain => ({
      ...domain,
      controls: domain.controls.map(control => ({ ...control }))
    }));
    
    // Optimistic update
    setControlDomains(domains => 
      domains.map(domain => ({
        ...domain,
        controls: domain.controls.map(control => 
          control.id === controlId 
            ? { ...control, status: newStatus, lastUpdated: new Date().toISOString() }
            : control
        )
      }))
    );
    
    // Persist to database with rollback on error
    updateStatusMutation.mutate(
      { controlId, status: newStatus },
      {
        onError: () => {
          // Rollback on error
          setControlDomains(previousDomains);
        },
        onSuccess: () => {
          toast({
            title: "Control Updated",
            description: `${controlId} status changed to ${newStatus.replace("_", " ")}`,
          });
        }
      }
    );
  };

  const updateEvidenceStatus = (controlId: string, newStatus: EvidenceStatus) => {
    // Deep clone previous state for rollback (spread only creates shallow copy)
    const previousDomains = controlDomains.map(domain => ({
      ...domain,
      controls: domain.controls.map(control => ({ ...control }))
    }));
    
    // Optimistic update
    setControlDomains(domains => 
      domains.map(domain => ({
        ...domain,
        controls: domain.controls.map(control => 
          control.id === controlId 
            ? { ...control, evidenceStatus: newStatus, lastUpdated: new Date().toISOString() }
            : control
        )
      }))
    );
    
    // Persist to database with rollback on error
    updateStatusMutation.mutate(
      { controlId, evidenceStatus: newStatus },
      {
        onError: () => {
          // Rollback on error
          setControlDomains(previousDomains);
        }
      }
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
      description: `Creating documentation for all ${stats.total} ISO 27001 controls`,
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

  const getDomainStats = (domain: ControlDomain) => {
    const total = domain.controls.length;
    const implemented = domain.controls.filter(c => c.status === "implemented").length;
    const inProgress = domain.controls.filter(c => c.status === "in_progress").length;
    return { total, implemented, inProgress };
  };

  const filteredDomains = useMemo(() => {
    if (domainFilter !== "all") {
      return controlDomains.filter(d => d.id === domainFilter);
    }
    return controlDomains;
  }, [controlDomains, domainFilter]);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-page-title">
              ISO 27001:2022 - Information Security Management
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Comprehensive compliance framework implementation
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

      {/* Tabs for Controls and Template Data */}
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
            framework="ISO27001" 
            companyProfileId={selectedCompanyProfileId} 
          />
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
      {/* Overall Progress Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ChevronRight className="h-5 w-5" />
            Overall Compliance Progress
          </CardTitle>
          <CardDescription>
            Track your organization's ISO 27001:2022 implementation status
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

            {/* Quick Stats */}
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
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
            <Select value={domainFilter} onValueChange={setDomainFilter}>
              <SelectTrigger data-testid="select-domain-filter">
                <SelectValue placeholder="Filter by domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {controlDomains.map(domain => (
                  <SelectItem key={domain.id} value={domain.id}>
                    {domain.id} - {domain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || statusFilter !== "all" || domainFilter !== "all") && (
            <div className="mt-3 text-sm text-muted-foreground">
              Showing {filteredControls.length} of {stats.total} controls
            </div>
          )}
        </CardContent>
      </Card>

      {/* Control Domains Accordion */}
      <Accordion 
        type="multiple" 
        value={expandedDomains} 
        onValueChange={setExpandedDomains}
        className="space-y-4"
      >
        {filteredDomains.map(domain => {
          const domainStats = getDomainStats(domain);
          const DomainIcon = domain.icon;
          const domainControls = searchTerm || statusFilter !== "all" 
            ? domain.controls.filter(c => {
                const matchesSearch = searchTerm === "" || 
                  c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = statusFilter === "all" || c.status === statusFilter;
                return matchesSearch && matchesStatus;
              })
            : domain.controls;

          if (domainControls.length === 0) return null;

          return (
            <AccordionItem 
              key={domain.id} 
              value={domain.id}
              className="border rounded-lg"
              data-testid={`accordion-domain-${domain.id}`}
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <DomainIcon className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{domain.id} - {domain.name}</div>
                      <div className="text-sm text-muted-foreground">{domain.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2">
                      <Badge variant="outline">{domainControls.length} controls</Badge>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {domainStats.implemented} done
                      </Badge>
                    </div>
                    <Progress 
                      value={(domainStats.implemented / domainStats.total) * 100} 
                      className="w-20 h-2 hidden sm:block"
                    />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 mt-2">
                  {domainControls.map(control => (
                    <Card key={control.id} className="border" data-testid={`card-control-${control.id}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          {/* Control Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-2">
                              <Badge variant="secondary" className="shrink-0">{control.id}</Badge>
                              <h4 className="font-medium text-sm">{control.name}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {control.description}
                            </p>
                          </div>

                          {/* Status & Actions */}
                          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center gap-3">
                            {/* Status Selector */}
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

                            {/* Evidence Status */}
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

                            {/* Generate Button */}
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

                        {/* Last Updated */}
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

      {/* Empty State */}
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
                setDomainFilter("all");
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

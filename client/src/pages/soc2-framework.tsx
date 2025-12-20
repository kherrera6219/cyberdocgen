import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield,
  Search,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Download,
  Server,
  Lock,
  Eye,
  UserCheck,
  ChevronRight,
  Filter,
  FileCheck,
  Calendar,
  Link as LinkIcon,
  Unlink,
  Paperclip,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FrameworkSpreadsheet } from "@/components/compliance/FrameworkSpreadsheet";
import { Table as TableIcon } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CompanyProfile } from "@shared/schema";

// Evidence file interface for type safety (matches ISO 27001 pattern)
interface EvidenceFile {
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

interface TrustServicePrinciple {
  id: string;
  name: string;
  description: string;
  icon: typeof Shield;
  controls: Control[];
}

const initialTrustServicePrinciples: TrustServicePrinciple[] = [
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

export default function SOC2Framework() {
  const { toast } = useToast();
  const [trustPrinciples, setTrustPrinciples] = useState<TrustServicePrinciple[]>(initialTrustServicePrinciples);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [principleFilter, setPrincipleFilter] = useState<string>("all");
  const [expandedPrinciples, setExpandedPrinciples] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("controls");
  const [selectedCompanyProfileId, setSelectedCompanyProfileId] = useState<string | null>(null);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [selectedControlForEvidence, setSelectedControlForEvidence] = useState<Control | null>(null);

  const { data: companyProfiles } = useQuery<CompanyProfile[]>({
    queryKey: ['/api/company-profiles'],
  });

  // Fetch all evidence for the SOC 2 framework
  const { data: evidenceData } = useQuery<{ evidence: EvidenceFile[]; count: number }>({
    queryKey: ['/api/evidence/soc2'],
    queryFn: async () => {
      const response = await fetch('/api/evidence?framework=soc2', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch evidence');
      return response.json();
    },
  });

  // Get evidence files linked to a specific control
  const getControlEvidence = (controlId: string): EvidenceFile[] => {
    if (!evidenceData?.evidence) return [];
    return evidenceData.evidence.filter(file => 
      file.metadata?.tags?.includes(`control:${controlId}`)
    );
  };

  // Get available evidence not yet linked to the selected control
  const getAvailableEvidence = (): EvidenceFile[] => {
    if (!evidenceData?.evidence || !selectedControlForEvidence) return [];
    return evidenceData.evidence.filter(file => 
      !file.metadata?.tags?.includes(`control:${selectedControlForEvidence.id}`)
    );
  };

  // Mutation for linking evidence to controls
  const linkEvidenceMutation = useMutation({
    mutationFn: async ({ evidenceId, controlId, action }: { 
      evidenceId: string; 
      controlId: string; 
      action: 'add' | 'remove';
    }) => {
      return await apiRequest(`/api/evidence/${evidenceId}/controls`, {
        method: 'POST',
        body: JSON.stringify({ 
          controlIds: [controlId], 
          framework: 'soc2',
          action 
        }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/evidence/soc2'] });
      toast({
        title: variables.action === 'add' ? "Evidence Linked" : "Evidence Unlinked",
        description: `Evidence has been ${variables.action === 'add' ? 'linked to' : 'removed from'} the control`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update evidence",
        description: error.message || "Could not update evidence linking",
        variant: "destructive",
      });
    }
  });

  const allControls = useMemo(() => {
    return trustPrinciples.flatMap(principle => 
      principle.controls.map(control => ({ ...control, principleId: principle.id, principleName: principle.name }))
    );
  }, [trustPrinciples]);

  const filteredControls = useMemo(() => {
    return allControls.filter(control => {
      const matchesSearch = searchTerm === "" || 
        control.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        control.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        control.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || control.status === statusFilter;
      const matchesPrinciple = principleFilter === "all" || control.principleId === principleFilter;
      
      return matchesSearch && matchesStatus && matchesPrinciple;
    });
  }, [allControls, searchTerm, statusFilter, principleFilter]);

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
    setTrustPrinciples(principles => 
      principles.map(principle => ({
        ...principle,
        controls: principle.controls.map(control => 
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
    setTrustPrinciples(principles => 
      principles.map(principle => ({
        ...principle,
        controls: principle.controls.map(control => 
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
      description: `Creating documentation for all ${stats.total} SOC 2 controls`,
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

  const getPrincipleStats = (principle: TrustServicePrinciple) => {
    const total = principle.controls.length;
    const implemented = principle.controls.filter(c => c.status === "implemented").length;
    const inProgress = principle.controls.filter(c => c.status === "in_progress").length;
    return { total, implemented, inProgress };
  };

  const filteredPrinciples = useMemo(() => {
    if (principleFilter !== "all") {
      return trustPrinciples.filter(p => p.id === principleFilter);
    }
    return trustPrinciples;
  }, [trustPrinciples, principleFilter]);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-page-title">
              SOC 2 - Trust Services Criteria
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              AICPA Trust Services Criteria compliance framework
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
              <Eye className="h-4 w-4 mr-2" />
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
            framework="SOC2" 
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
            Track your organization's SOC 2 Trust Services Criteria implementation status
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
              <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-400" data-testid="text-stat-total">
                  {stats.total}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-500">Total Controls</div>
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
            <Select value={principleFilter} onValueChange={setPrincipleFilter}>
              <SelectTrigger data-testid="select-principle-filter">
                <SelectValue placeholder="Filter by principle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Principles</SelectItem>
                {trustPrinciples.map(principle => (
                  <SelectItem key={principle.id} value={principle.id}>
                    {principle.id} - {principle.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || statusFilter !== "all" || principleFilter !== "all") && (
            <div className="mt-3 text-sm text-muted-foreground">
              Showing {filteredControls.length} of {stats.total} controls
            </div>
          )}
        </CardContent>
      </Card>

      <Accordion 
        type="multiple" 
        value={expandedPrinciples} 
        onValueChange={setExpandedPrinciples}
        className="space-y-4"
      >
        {filteredPrinciples.map(principle => {
          const principleStats = getPrincipleStats(principle);
          const PrincipleIcon = principle.icon;
          const principleControls = searchTerm || statusFilter !== "all" 
            ? principle.controls.filter(c => {
                const matchesSearch = searchTerm === "" || 
                  c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = statusFilter === "all" || c.status === statusFilter;
                return matchesSearch && matchesStatus;
              })
            : principle.controls;

          if (principleControls.length === 0) return null;

          return (
            <AccordionItem 
              key={principle.id} 
              value={principle.id}
              className="border rounded-lg"
              data-testid={`accordion-principle-${principle.id}`}
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                      <PrincipleIcon className="h-5 w-5 text-purple-700 dark:text-purple-300" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{principle.id} - {principle.name}</div>
                      <div className="text-sm text-muted-foreground">{principle.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2">
                      <Badge variant="outline">{principleControls.length} controls</Badge>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {principleStats.implemented} done
                      </Badge>
                    </div>
                    <Progress 
                      value={(principleStats.implemented / principleStats.total) * 100} 
                      className="w-20 h-2 hidden sm:block"
                    />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 mt-2">
                  {principleControls.map(control => (
                    <Card key={control.id} className="border" data-testid={`card-control-${control.id}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-2">
                              <Badge variant="secondary" className="shrink-0">{control.id}</Badge>
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

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedControlForEvidence(control);
                                setEvidenceDialogOpen(true);
                              }}
                              data-testid={`button-evidence-${control.id}`}
                            >
                              <Paperclip className="h-4 w-4 mr-1" />
                              Evidence
                              {getControlEvidence(control.id).length > 0 && (
                                <Badge variant="secondary" className="ml-1 text-xs">
                                  {getControlEvidence(control.id).length}
                                </Badge>
                              )}
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
                    setPrincipleFilter("all");
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

      {/* Evidence Linking Dialog */}
      <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Manage Evidence for {selectedControlForEvidence?.id}
            </DialogTitle>
            <DialogDescription>
              {selectedControlForEvidence?.name} - Link or unlink evidence files to this control
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Linked Evidence */}
            <div>
              <h4 className="text-sm font-medium mb-3">Linked Evidence</h4>
              {selectedControlForEvidence && getControlEvidence(selectedControlForEvidence.id).length > 0 ? (
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {getControlEvidence(selectedControlForEvidence.id).map(evidence => (
                      <div 
                        key={evidence.id}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{evidence.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {(evidence.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (selectedControlForEvidence) {
                              linkEvidenceMutation.mutate({
                                evidenceId: evidence.id,
                                controlId: selectedControlForEvidence.id,
                                action: 'remove'
                              });
                            }
                          }}
                          disabled={linkEvidenceMutation.isPending}
                          data-testid={`button-unlink-${evidence.id}`}
                        >
                          <Unlink className="h-4 w-4 mr-1" />
                          Unlink
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-4 border rounded-md text-center text-muted-foreground">
                  <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No evidence linked to this control</p>
                </div>
              )}
            </div>

            {/* Available Evidence to Link */}
            <div>
              <h4 className="text-sm font-medium mb-3">Available Evidence to Link</h4>
              {getAvailableEvidence().length > 0 ? (
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {getAvailableEvidence().map(evidence => (
                      <div 
                        key={evidence.id}
                        className="flex items-center justify-between p-3 border rounded-md hover-elevate cursor-pointer"
                        onClick={() => {
                          if (selectedControlForEvidence) {
                            linkEvidenceMutation.mutate({
                              evidenceId: evidence.id,
                              controlId: selectedControlForEvidence.id,
                              action: 'add'
                            });
                          }
                        }}
                        data-testid={`button-link-${evidence.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{evidence.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {(evidence.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={linkEvidenceMutation.isPending}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Link
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-4 border rounded-md text-center text-muted-foreground">
                  <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No additional evidence available to link</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

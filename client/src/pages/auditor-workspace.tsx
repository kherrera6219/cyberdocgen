import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Eye, 
  Download, 
  FileText, 
  Shield, 
  Clock,
  Search,
  CheckCircle2,
  Lock,
  AlertCircle,
  Grid,
  MessageSquare,
  Send,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building
} from "lucide-react";
import type { Document } from "@shared/schema";

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  riskLevel?: string;
}

interface AuditTrailResponse {
  logs: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AuditorWorkspace() {
  const [activeTab, setActiveTab] = useState("documents");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFramework, setSelectedFramework] = useState<string>("all");

  const [selectedDocForQA, setSelectedDocForQA] = useState<Document | null>(null);
  const [qaRole, setQaRole] = useState<'auditor' | 'admin'>('auditor');
  const [qaInput, setQaInput] = useState("");

  const [qaComments, setQaComments] = useState<Record<string, { role: 'auditor' | 'admin'; text: string; time: string }[]>>(() => {
    try {
      const saved = localStorage.getItem("auditor_qa_comments");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveComments = (newComments: Record<string, { role: 'auditor' | 'admin'; text: string; time: string }[]>) => {
    setQaComments(newComments);
    localStorage.setItem("auditor_qa_comments", JSON.stringify(newComments));
  };

  const handleAddComment = () => {
    if (!selectedDocForQA || !qaInput.trim()) return;
    const docId = String(selectedDocForQA.id);
    const existing = qaComments[docId] || [];
    const updated = [
      ...existing,
      {
        role: qaRole,
        text: qaInput.trim(),
        time: new Date().toISOString()
      }
    ];
    saveComments({
      ...qaComments,
      [docId]: updated
    });
    setQaInput("");
  };

  const matrixMappings = [
    {
      docName: "Backup, Restore & Disaster Recovery Policy",
      category: "Backup",
      iso: { badge: "A.12.3.1", desc: "Data & System Backup Management" },
      soc2: { badge: "CC6.8", desc: "Disaster Recovery & Redundancy" },
      fedramp: { badge: "CP-9", desc: "Information System Backup" },
      nist: { badge: "PR.DS-11", desc: "Data Backups & Retention" }
    },
    {
      docName: "Access Control, Identity & MFA Standard",
      category: "Access Control",
      iso: { badge: "A.9.1.1", desc: "Access Control Policy Framework" },
      soc2: { badge: "CC6.1", desc: "Logical Access Control & Entitlements" },
      fedramp: { badge: "AC-2", desc: "Account Management & Control" },
      nist: { badge: "PR.AC-1", desc: "Access Control Policies" }
    },
    {
      docName: "Incident Response Plan & Breach Protocol",
      category: "Incident Management",
      iso: { badge: "A.16.1.1", desc: "Information Security Incident Management" },
      soc2: { badge: "CC7.3", desc: "Incident Containment & Remediation" },
      fedramp: { badge: "IR-4", desc: "Incident Handling & Coordination" },
      nist: { badge: "DE.AE-2", desc: "Detection Processes & Analysis" }
    },
    {
      docName: "Continuous Telemetry Logging & Monitoring Policy",
      category: "Auditing",
      iso: { badge: "A.12.4.1", desc: "Event Logging & Audit Trails" },
      soc2: { badge: "CC7.2", desc: "Continuous Security Telemetry Monitoring" },
      fedramp: { badge: "AU-2", desc: "Event Logging Events" },
      nist: { badge: "DE.CM-1", desc: "Security Monitoring Logs" }
    },
    {
      docName: "Data Encryption Standard (AES-GCM & SSL)",
      category: "Cryptography",
      iso: { badge: "A.10.1.1", desc: "Cryptographic Controls Policy" },
      soc2: { badge: "CC6.7", desc: "Transmission & Storage Protection" },
      fedramp: { badge: "SC-28", desc: "Protection of Information at Rest" },
      nist: { badge: "PR.DS-2", desc: "Data in Transit & at Rest Protection" }
    }
  ];

  const { data: documents = [], isLoading: isLoadingDocuments, error: documentsError } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: auditTrailData, isLoading: isLoadingAuditLogs, error: auditError } = useQuery<AuditTrailResponse>({
    queryKey: ["/api/audit-trail", { limit: 50 }],
  });

  const auditLogs = auditTrailData?.logs || [];

  const mapDocumentStatus = (status: string): "current" | "archived" | "draft" => {
    switch (status) {
      case "approved":
      case "published":
      case "complete":
        return "current";
      case "draft":
      case "in_progress":
        return "draft";
      default:
        return "archived";
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFramework = selectedFramework === "all" || doc.framework === selectedFramework;
    return matchesSearch && matchesFramework;
  });

  const uniqueFrameworks = [...new Set(documents.map(d => d.framework))];

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (status: string) => {
    const mappedStatus = mapDocumentStatus(status);
    switch (mappedStatus) {
      case "current":
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Current</Badge>;
      case "archived":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Archived</Badge>;
      case "draft":
        return <Badge variant="outline"><FileText className="w-3 h-3 mr-1" /> Draft</Badge>;
    }
  };

  const getRiskBadge = (level: string | undefined) => {
    switch (level) {
      case "high":
        return <Badge variant="destructive">High Risk</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case "low":
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const currentDocsCount = documents.filter(d => ["approved", "published", "complete"].includes(d.status)).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Auditor Workspace</h1>
            <p className="text-muted-foreground">Read-only access to compliance documentation and audit trails</p>
          </div>
        </div>
        <Badge variant="outline" className="text-base px-3 py-1">
          <Lock className="w-4 h-4 mr-1" />
          Read-Only Access
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Compliance Overview</CardTitle>
          <CardDescription>Summary of compliance documentation status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              {isLoadingDocuments ? (
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
              ) : (
                <p className="text-2xl font-bold" data-testid="text-total-docs">{documents.length}</p>
              )}
              <p className="text-sm text-muted-foreground">Total Documents</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              {isLoadingDocuments ? (
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
              ) : (
                <p className="text-2xl font-bold text-green-600" data-testid="text-current-docs">
                  {currentDocsCount}
                </p>
              )}
              <p className="text-sm text-muted-foreground">Current</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              {isLoadingDocuments ? (
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
              ) : (
                <p className="text-2xl font-bold" data-testid="text-frameworks">{uniqueFrameworks.length}</p>
              )}
              <p className="text-sm text-muted-foreground">Frameworks</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              {isLoadingAuditLogs ? (
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
              ) : (
                <p className="text-2xl font-bold" data-testid="text-audit-entries">{auditLogs.length}</p>
              )}
              <p className="text-sm text-muted-foreground">Audit Entries (Recent)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="documents" data-testid="tab-documents">
            <FileText className="w-4 h-4 mr-1" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="matrix" data-testid="tab-matrix">
            <Grid className="w-4 h-4 mr-1" />
            Control Cross-Map
          </TabsTrigger>
          <TabsTrigger value="audit-trail" data-testid="tab-audit-trail">
            <Clock className="w-4 h-4 mr-1" />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Compliance Documents</CardTitle>
                  <CardDescription>Browse approved compliance documentation</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                      data-testid="input-search-documents"
                    />
                  </div>
                  <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                    <SelectTrigger className="w-40" data-testid="select-framework-filter">
                      <SelectValue placeholder="Framework" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Frameworks</SelectItem>
                      {uniqueFrameworks.map(framework => (
                        <SelectItem key={framework} value={framework}>{framework}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {documentsError ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>Failed to load documents. Please try again.</span>
                </div>
              ) : isLoadingDocuments ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No documents found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Framework</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => (
                      <TableRow key={doc.id} data-testid={`row-document-${doc.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{doc.title}</p>
                            <p className="text-sm text-muted-foreground">{doc.category}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.framework}</Badge>
                        </TableCell>
                        <TableCell>v{doc.version}</TableCell>
                        <TableCell>{getStatusBadge(doc.status)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{formatDate(doc.updatedAt)}</p>
                            {doc.approvedBy && (
                              <p className="text-xs text-muted-foreground">Approved</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              data-testid={`button-view-${doc.id}`}
                              aria-label={`View ${doc.title}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              data-testid={`button-download-${doc.id}`}
                              aria-label={`Download ${doc.title}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setSelectedDocForQA(doc)}
                              className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                              aria-label={`Open Q&A for ${doc.title}`}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="mt-4">
          <Card className="border-muted-foreground/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Unified Cross-Framework Mapping Matrix
              </CardTitle>
              <CardDescription>
                Visual alignment of on-premises GRC evidence items mapping to controls overlapping SOC 2, ISO 27001, FedRAMP, and NIST CSF.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-72">Evidence Document</TableHead>
                    <TableHead className="text-center font-bold text-blue-500 dark:text-blue-400">SOC 2 Type II</TableHead>
                    <TableHead className="text-center font-bold text-purple-500 dark:text-purple-400">ISO 27001</TableHead>
                    <TableHead className="text-center font-bold text-amber-500 dark:text-amber-400">FedRAMP (Low/Mod)</TableHead>
                    <TableHead className="text-center font-bold text-emerald-500 dark:text-emerald-400">NIST CSF 2.0</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrixMappings.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        <div>
                          <p className="text-sm font-semibold">{row.docName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{row.category}</p>
                        </div>
                      </TableCell>
                      
                      {/* SOC 2 */}
                      <TableCell className="text-center">
                        <div className="group relative inline-block cursor-help">
                          <Badge className="bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 text-xs px-2 py-0.5 font-semibold hover:bg-blue-500 hover:text-white transition-all">
                            {row.soc2.badge}
                          </Badge>
                          <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 rounded bg-gray-900 border border-blue-500/20 shadow-xl text-left text-[10px] text-gray-200">
                            <span className="font-bold text-blue-400 block mb-0.5">{row.soc2.badge} Control Description:</span>
                            {row.soc2.desc}
                          </div>
                        </div>
                      </TableCell>

                      {/* ISO 27001 */}
                      <TableCell className="text-center">
                        <div className="group relative inline-block cursor-help">
                          <Badge className="bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-500/20 text-xs px-2 py-0.5 font-semibold hover:bg-purple-500 hover:text-white transition-all">
                            {row.iso.badge}
                          </Badge>
                          <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 rounded bg-gray-900 border border-purple-500/20 shadow-xl text-left text-[10px] text-gray-200">
                            <span className="font-bold text-purple-400 block mb-0.5">{row.iso.badge} Annex A Control:</span>
                            {row.iso.desc}
                          </div>
                        </div>
                      </TableCell>

                      {/* FedRAMP */}
                      <TableCell className="text-center">
                        <div className="group relative inline-block cursor-help">
                          <Badge className="bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 text-xs px-2 py-0.5 font-semibold hover:bg-amber-500 hover:text-white transition-all">
                            {row.fedramp.badge}
                          </Badge>
                          <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 rounded bg-gray-900 border border-amber-500/20 shadow-xl text-left text-[10px] text-gray-200">
                            <span className="font-bold text-amber-400 block mb-0.5">{row.fedramp.badge} FedRAMP Control:</span>
                            {row.fedramp.desc}
                          </div>
                        </div>
                      </TableCell>

                      {/* NIST CSF */}
                      <TableCell className="text-center">
                        <div className="group relative inline-block cursor-help">
                          <Badge className="bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 text-xs px-2 py-0.5 font-semibold hover:bg-emerald-500 hover:text-white transition-all">
                            {row.nist.badge}
                          </Badge>
                          <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 rounded bg-gray-900 border border-emerald-500/20 shadow-xl text-left text-[10px] text-gray-200">
                            <span className="font-bold text-emerald-400 block mb-0.5">{row.nist.badge} NIST Control:</span>
                            {row.nist.desc}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-trail" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>Complete history of compliance-related activities</CardDescription>
            </CardHeader>
            <CardContent>
              {auditError ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>Failed to load audit logs. Please try again.</span>
                </div>
              ) : isLoadingAuditLogs ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No audit entries found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((entry) => (
                    <div 
                      key={entry.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                      data-testid={`audit-entry-${entry.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium">{formatAction(entry.action)}</span>
                          {getRiskBadge(entry.riskLevel)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {entry.entityType}: {entry.entityId}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span>User: {entry.userId}</span>
                          {entry.ipAddress && <span>IP: {entry.ipAddress}</span>}
                          <span>{formatDate(entry.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Auditor Q&A Thread Slide-out Drawer Sheet */}
      <Sheet open={Boolean(selectedDocForQA)} onOpenChange={(open) => !open && setSelectedDocForQA(null)}>
        <SheetContent side="right" className="w-[450px] p-6 flex flex-col h-full bg-slate-900 border-l border-muted-foreground/10 text-sans">
          <SheetHeader className="border-b border-muted-foreground/10 pb-4">
            <SheetTitle className="text-lg flex items-center gap-2 text-white">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              Auditor Clarification Drawer
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-400">
              Direct threaded communication regarding compliance evidence documentation.
            </SheetDescription>
          </SheetHeader>

          {selectedDocForQA && (
            <div className="flex-1 flex flex-col min-h-0 space-y-4 pt-4">
              {/* Target File details summary */}
              <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-slate-200 truncate block w-72">{selectedDocForQA.title}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Framework: <Badge variant="outline" className="text-[10px] text-slate-300 border-slate-700 py-0">{selectedDocForQA.framework}</Badge></span>
                  <span>Version: v{selectedDocForQA.version}</span>
                </div>
              </div>

              {/* Chat role selection bar */}
              <div className="flex items-center justify-between bg-slate-800/40 p-2 rounded-lg border border-slate-700/50">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Posting As Role</span>
                <div className="flex bg-slate-900 rounded-md p-1 border border-slate-700/50">
                  <button 
                    onClick={() => setQaRole('auditor')}
                    className={`text-[10px] px-2 py-1 rounded font-semibold transition-all ${
                      qaRole === 'auditor' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🕵️ Auditor
                  </button>
                  <button 
                    onClick={() => setQaRole('admin')}
                    className={`text-[10px] px-2 py-1 rounded font-semibold transition-all ${
                      qaRole === 'admin' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🛡️ Admin
                  </button>
                </div>
              </div>

              {/* Thread Chat Area */}
              <div className="flex-1 overflow-y-auto space-y-3.5 p-1 min-h-0">
                {!(qaComments[String(selectedDocForQA.id)]?.length > 0) ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs text-center space-y-2 py-10">
                    <MessageSquare className="w-10 h-10 stroke-1 opacity-50" />
                    <p>No questions or clarifications flagged yet.<br/>Type below to initiate the audit thread.</p>
                  </div>
                ) : (
                  qaComments[String(selectedDocForQA.id)].map((c, index) => (
                    <div 
                      key={index} 
                      className={`flex flex-col max-w-[85%] rounded-2xl p-3.5 text-xs shadow-sm transition-all duration-300 ${
                        c.role === "auditor" 
                          ? "mr-auto bg-blue-500/10 border border-blue-500/20 text-blue-200" 
                          : "ml-auto bg-emerald-500/10 border border-emerald-500/20 text-emerald-200"
                      }`}
                    >
                      <span className="text-[9px] font-bold uppercase mb-1 tracking-wider opacity-75">
                        {c.role === "auditor" ? "🕵️ Auditor Query" : "🛡️ Admin Reply"}
                      </span>
                      <p className="whitespace-pre-wrap leading-relaxed">{c.text}</p>
                      <span className="text-[8px] opacity-40 mt-1 self-end">{new Date(c.time).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Thread Chat Input */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <Input 
                  placeholder={qaRole === 'auditor' ? "Ask auditor clarification query..." : "Reply to auditor concern..."}
                  value={qaInput}
                  onChange={(e) => setQaInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  className="bg-slate-950 border-slate-700/80 text-white placeholder-slate-500 h-9 text-xs"
                />
                <Button 
                  size="icon" 
                  onClick={handleAddComment} 
                  className={`h-9 w-9 shrink-0 ${qaRole === 'auditor' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white`}
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

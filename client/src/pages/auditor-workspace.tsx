import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
  AlertCircle
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
                            <Button size="icon" variant="ghost" data-testid={`button-view-${doc.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" data-testid={`button-download-${doc.id}`}>
                              <Download className="w-4 h-4" />
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
    </div>
  );
}

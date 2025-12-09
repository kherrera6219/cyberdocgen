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
import { 
  Eye, 
  Download, 
  FileText, 
  Shield, 
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock
} from "lucide-react";

interface AuditDocument {
  id: string;
  title: string;
  type: string;
  framework: string;
  version: string;
  status: "current" | "archived" | "draft";
  lastModified: string;
  approvedBy?: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  resource: string;
  user: string;
  timestamp: string;
  details: string;
  riskLevel: "low" | "medium" | "high";
}

export default function AuditorWorkspace() {
  const [activeTab, setActiveTab] = useState("documents");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFramework, setSelectedFramework] = useState<string>("all");

  const mockDocuments: AuditDocument[] = [
    {
      id: "1",
      title: "Information Security Policy",
      type: "Policy",
      framework: "ISO 27001",
      version: "3.2",
      status: "current",
      lastModified: "2024-12-01T10:00:00Z",
      approvedBy: "John Smith"
    },
    {
      id: "2",
      title: "Access Control Procedure",
      type: "Procedure",
      framework: "SOC 2",
      version: "2.1",
      status: "current",
      lastModified: "2024-11-28T14:30:00Z",
      approvedBy: "Jane Doe"
    },
    {
      id: "3",
      title: "Incident Response Plan",
      type: "Plan",
      framework: "FedRAMP",
      version: "1.5",
      status: "current",
      lastModified: "2024-11-20T09:15:00Z",
      approvedBy: "Mike Johnson"
    },
    {
      id: "4",
      title: "Risk Assessment Report Q4",
      type: "Report",
      framework: "NIST 800-53",
      version: "1.0",
      status: "current",
      lastModified: "2024-12-05T16:00:00Z",
      approvedBy: "Sarah Williams"
    },
    {
      id: "5",
      title: "Business Continuity Plan",
      type: "Plan",
      framework: "ISO 27001",
      version: "2.0",
      status: "archived",
      lastModified: "2024-10-15T11:00:00Z"
    }
  ];

  const mockAuditLog: AuditLogEntry[] = [
    {
      id: "1",
      action: "Document Approved",
      resource: "Information Security Policy v3.2",
      user: "john.smith@company.com",
      timestamp: "2024-12-09T10:30:00Z",
      details: "Annual policy review completed and approved",
      riskLevel: "low"
    },
    {
      id: "2",
      action: "Evidence Uploaded",
      resource: "SOC 2 CC6.1 Evidence Pack",
      user: "jane.doe@company.com",
      timestamp: "2024-12-09T09:15:00Z",
      details: "Quarterly access review evidence submitted",
      riskLevel: "low"
    },
    {
      id: "3",
      action: "Control Updated",
      resource: "AC-2 Account Management",
      user: "mike.johnson@company.com",
      timestamp: "2024-12-08T16:45:00Z",
      details: "Updated control implementation details",
      riskLevel: "medium"
    },
    {
      id: "4",
      action: "Access Granted",
      resource: "Admin Panel",
      user: "system@company.com",
      timestamp: "2024-12-08T14:00:00Z",
      details: "New admin access granted to sarah.williams@company.com",
      riskLevel: "high"
    },
    {
      id: "5",
      action: "Document Exported",
      resource: "Compliance Package Q4",
      user: "jane.doe@company.com",
      timestamp: "2024-12-07T11:30:00Z",
      details: "Full compliance package exported for audit",
      riskLevel: "low"
    }
  ];

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFramework = selectedFramework === "all" || doc.framework === selectedFramework;
    return matchesSearch && matchesFramework;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (status: AuditDocument["status"]) => {
    switch (status) {
      case "current":
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Current</Badge>;
      case "archived":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Archived</Badge>;
      case "draft":
        return <Badge variant="outline"><FileText className="w-3 h-3 mr-1" /> Draft</Badge>;
    }
  };

  const getRiskBadge = (level: AuditLogEntry["riskLevel"]) => {
    switch (level) {
      case "high":
        return <Badge variant="destructive">High Risk</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case "low":
        return <Badge variant="secondary">Low</Badge>;
    }
  };

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
              <p className="text-2xl font-bold" data-testid="text-total-docs">{mockDocuments.length}</p>
              <p className="text-sm text-muted-foreground">Total Documents</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600" data-testid="text-current-docs">
                {mockDocuments.filter(d => d.status === "current").length}
              </p>
              <p className="text-sm text-muted-foreground">Current</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold" data-testid="text-frameworks">4</p>
              <p className="text-sm text-muted-foreground">Frameworks</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold" data-testid="text-audit-entries">{mockAuditLog.length}</p>
              <p className="text-sm text-muted-foreground">Audit Entries (7d)</p>
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
                      <SelectItem value="ISO 27001">ISO 27001</SelectItem>
                      <SelectItem value="SOC 2">SOC 2</SelectItem>
                      <SelectItem value="FedRAMP">FedRAMP</SelectItem>
                      <SelectItem value="NIST 800-53">NIST 800-53</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
                          <p className="text-sm text-muted-foreground">{doc.type}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.framework}</Badge>
                      </TableCell>
                      <TableCell>v{doc.version}</TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{formatDate(doc.lastModified)}</p>
                          {doc.approvedBy && (
                            <p className="text-xs text-muted-foreground">by {doc.approvedBy}</p>
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
              <div className="space-y-4">
                {mockAuditLog.map((entry) => (
                  <div 
                    key={entry.id}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                    data-testid={`audit-entry-${entry.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium">{entry.action}</span>
                        {getRiskBadge(entry.riskLevel)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{entry.details}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span>Resource: {entry.resource}</span>
                        <span>User: {entry.user}</span>
                        <span>{formatDate(entry.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

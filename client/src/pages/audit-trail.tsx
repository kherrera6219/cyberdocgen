import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Eye, 
  Download, 
  Edit3, 
  Trash2, 
  Plus, 
  Search, 
  Filter,
  History,
  User,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle,
  FileText,
  Building,
  Settings
} from "lucide-react";
import type { AuditTrail } from "@shared/schema";

// Mock audit trail data
const mockAuditTrail: AuditTrail[] = [
  {
    id: "audit-1",
    entityType: "document",
    entityId: "doc-1",
    action: "create",
    userId: "user-1",
    userEmail: "john@company.com",
    userName: "John Smith",
    organizationId: "org-1",
    oldValues: null,
    newValues: {
      title: "Information Security Policy",
      framework: "ISO27001",
      status: "draft"
    },
    metadata: {
      documentType: "policy",
      framework: "ISO27001"
    },
    timestamp: new Date("2024-08-14T10:30:00Z"),
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    sessionId: "sess-123"
  },
  {
    id: "audit-2",
    entityType: "document",
    entityId: "doc-1",
    action: "update",
    userId: "user-2",
    userEmail: "jane@company.com",
    userName: "Jane Doe",
    organizationId: "org-1",
    oldValues: {
      status: "draft",
      content: "Original content..."
    },
    newValues: {
      status: "in_progress",
      content: "Updated content with compliance requirements..."
    },
    metadata: {
      changeType: "content_update",
      version: 2
    },
    timestamp: new Date("2024-08-14T14:15:00Z"),
    ipAddress: "192.168.1.101",
    userAgent: "Mozilla/5.0 (macOS; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    sessionId: "sess-456"
  },
  {
    id: "audit-3",
    entityType: "document",
    entityId: "doc-1",
    action: "approve",
    userId: "user-3",
    userEmail: "ciso@company.com",
    userName: "Chief Information Security Officer",
    organizationId: "org-1",
    oldValues: {
      status: "in_progress"
    },
    newValues: {
      status: "approved",
      approvedBy: "user-3",
      approvedAt: "2024-08-14T16:45:00Z"
    },
    metadata: {
      approverRole: "ciso",
      comments: "Approved after review"
    },
    timestamp: new Date("2024-08-14T16:45:00Z"),
    ipAddress: "192.168.1.102",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    sessionId: "sess-789"
  },
  {
    id: "audit-4",
    entityType: "company_profile",
    entityId: "profile-1",
    action: "update",
    userId: "user-1",
    userEmail: "john@company.com",
    userName: "John Smith",
    organizationId: "org-1",
    oldValues: {
      companySize: "50-100",
      frameworksSelected: ["ISO27001"]
    },
    newValues: {
      companySize: "100-250",
      frameworksSelected: ["ISO27001", "SOC2", "FedRAMP-Low"]
    },
    metadata: {
      section: "basic_info",
      reason: "Company growth and new compliance requirements"
    },
    timestamp: new Date("2024-08-13T09:20:00Z"),
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    sessionId: "sess-abc"
  },
  {
    id: "audit-5",
    entityType: "document",
    entityId: "doc-2",
    action: "download",
    userId: "user-4",
    userEmail: "compliance@company.com",
    userName: "Compliance Officer",
    organizationId: "org-1",
    oldValues: null,
    newValues: null,
    metadata: {
      documentTitle: "Risk Assessment Report",
      fileFormat: "pdf",
      fileSize: 2048000
    },
    timestamp: new Date("2024-08-12T11:30:00Z"),
    ipAddress: "192.168.1.103",
    userAgent: "Mozilla/5.0 (macOS; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    sessionId: "sess-def"
  }
];

export default function AuditTrail() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntityType, setSelectedEntityType] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [dateRange, setDateRange] = useState("7d");

  // Fetch audit trail data
  const { data: auditTrail = [], isLoading } = useQuery({
    queryKey: ["/api/audit-trail", selectedEntityType, selectedAction, selectedUser, dateRange],
    queryFn: () => mockAuditTrail, // Replace with actual API call
  });

  // Filter audit trail based on search and filters
  const filteredAuditTrail = auditTrail.filter(entry => {
    const matchesSearch = entry.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.userEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEntityType = selectedEntityType === "all" || entry.entityType === selectedEntityType;
    const matchesAction = selectedAction === "all" || entry.action === selectedAction;
    const matchesUser = selectedUser === "all" || entry.userId === selectedUser;
    
    return matchesSearch && matchesEntityType && matchesAction && matchesUser;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create":
        return <Plus className="h-4 w-4 text-green-600" />;
      case "update":
        return <Edit3 className="h-4 w-4 text-blue-600" />;
      case "delete":
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case "view":
        return <Eye className="h-4 w-4 text-gray-600" />;
      case "download":
        return <Download className="h-4 w-4 text-purple-600" />;
      case "approve":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "reject":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "document":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "company_profile":
        return <Building className="h-4 w-4 text-purple-600" />;
      case "user":
        return <User className="h-4 w-4 text-green-600" />;
      case "organization":
        return <Building className="h-4 w-4 text-orange-600" />;
      case "template":
        return <Settings className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "update":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "delete":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "approve":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "reject":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "view":
      case "download":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(timestamp);
  };

  const renderValueChanges = (oldValues: any, newValues: any) => {
    if (!oldValues && !newValues) return null;
    
    return (
      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
        <h5 className="text-sm font-medium mb-2">Changes:</h5>
        <div className="space-y-1 text-xs">
          {oldValues && (
            <div>
              <span className="font-medium text-red-600">Before:</span>
              <pre className="mt-1 text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(oldValues, null, 2)}
              </pre>
            </div>
          )}
          {newValues && (
            <div>
              <span className="font-medium text-green-600">After:</span>
              <pre className="mt-1 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(newValues, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <History className="h-8 w-8" />
            Audit Trail
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track all system activities and changes with comprehensive logging
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter Audit Logs</CardTitle>
            <CardDescription>
              Filter and search through audit trail entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users, actions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Entity Type Filter */}
              <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="company_profile">Company Profiles</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="organization">Organizations</SelectItem>
                  <SelectItem value="template">Templates</SelectItem>
                </SelectContent>
              </Select>

              {/* Action Filter */}
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="download">Download</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>

              {/* User Filter */}
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="user-1">John Smith</SelectItem>
                  <SelectItem value="user-2">Jane Doe</SelectItem>
                  <SelectItem value="user-3">CISO</SelectItem>
                  <SelectItem value="user-4">Compliance Officer</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Total Events</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                  {filteredAuditTrail.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Approvals</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {filteredAuditTrail.filter(e => e.action === "approve").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Updates</p>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                  {filteredAuditTrail.filter(e => e.action === "update").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">Unique Users</p>
                <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                  {new Set(filteredAuditTrail.map(e => e.userId)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Trail Entries */}
        <div className="space-y-4">
          {filteredAuditTrail.map((entry) => (
            <Card key={entry.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Action & Entity Icons */}
                    <div className="flex items-center gap-2">
                      {getActionIcon(entry.action)}
                      {getEntityIcon(entry.entityType)}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getActionColor(entry.action)}>
                          {entry.action}
                        </Badge>
                        <Badge variant="outline">
                          {entry.entityType}
                        </Badge>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Entity ID: {entry.entityId}
                        </span>
                      </div>

                      {/* User Info */}
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{entry.userName}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ({entry.userEmail})
                        </span>
                      </div>

                      {/* Timestamp and IP */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatTimestamp(entry.timestamp)}
                        </div>
                        {entry.ipAddress && (
                          <span>IP: {entry.ipAddress}</span>
                        )}
                        {entry.sessionId && (
                          <span>Session: {entry.sessionId.slice(0, 8)}...</span>
                        )}
                      </div>

                      {/* Metadata */}
                      {entry.metadata && (
                        <div className="mb-3">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Details:</strong> {JSON.stringify(entry.metadata)}
                          </div>
                        </div>
                      )}

                      {/* Value Changes */}
                      {(entry.oldValues || entry.newValues) && 
                        renderValueChanges(entry.oldValues, entry.newValues)
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredAuditTrail.length === 0 && (
          <div className="text-center py-12">
            <History className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
              No audit entries found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters or search criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
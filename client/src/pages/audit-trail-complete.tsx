// @ts-nocheck
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
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import type { AuditTrail } from "@shared/schema";

interface AuditQueryParams {
  page?: number;
  limit?: number;
  entityType?: string;
  action?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface AuditResponse {
  data: AuditTrail[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AuditTrail() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntityType, setSelectedEntityType] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState("7d");

  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.append('page', currentPage.toString());
  queryParams.append('limit', '20');
  if (selectedEntityType !== 'all') queryParams.append('entityType', selectedEntityType);
  if (selectedAction !== 'all') queryParams.append('action', selectedAction);
  if (searchQuery) queryParams.append('search', searchQuery);

  // Fetch audit trail data from API
  const { data: auditResponse, isLoading } = useQuery({
    queryKey: ["/api/audit-trail", currentPage, selectedEntityType, selectedAction, searchQuery],
    queryFn: () => fetch(`/api/audit-trail?${queryParams}`).then(res => res.json()) as Promise<AuditResponse>,
  });

  // Fetch audit statistics
  const { data: auditStats } = useQuery({
    queryKey: ["/api/audit-trail/stats"],
    queryFn: () => fetch('/api/audit-trail/stats').then(res => res.json()),
  });

  const auditTrail = auditResponse?.data || [];
  const pagination = auditResponse?.pagination;

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
        return <Settings className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "create": return "bg-green-100 text-green-800";
      case "update": return "bg-blue-100 text-blue-800";
      case "delete": return "bg-red-100 text-red-800";
      case "view": return "bg-gray-100 text-gray-800";
      case "download": return "bg-purple-100 text-purple-800";
      case "approve": return "bg-green-100 text-green-800";
      case "reject": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <History className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Audit Trail</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading audit trail...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Audit Trail</h1>
            <p className="text-gray-600">Track all system activities and user actions</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {auditStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditStats.totalActions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditStats.activeUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Most Common Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.entries(auditStats.actionsByType || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {auditStats.recentActivity?.[0]?.count || 0}
              </div>
              <p className="text-xs text-gray-600">Last 24h</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search actions, users, entities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
              <SelectTrigger>
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entity Types</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="company_profile">Company Profiles</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="organization">Organizations</SelectItem>
              </SelectContent>
            </Select>

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

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Audit Trail
            </div>
            {pagination && (
              <p className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
              </p>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditTrail.length === 0 ? (
              <div className="text-center py-12">
                <History className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No audit entries found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No audit trail entries match your current filters.
                </p>
              </div>
            ) : (
              auditTrail.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 pt-1">
                        {getActionIcon(entry.action)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getActionBadgeColor(entry.action)}>
                            {entry.action.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getEntityIcon(entry.entityType)}
                            {entry.entityType}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatTimestamp(entry.timestamp!)}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">
                            <User className="h-4 w-4 inline mr-1" />
                            {entry.userName || entry.userEmail}
                          </p>
                          
                          {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                            <div className="text-sm text-gray-600">
                              <strong>Details:</strong> {JSON.stringify(entry.metadata, null, 2)}
                            </div>
                          )}
                          
                          {(entry.oldValues || entry.newValues) && (
                            <details className="text-sm">
                              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                View Changes
                              </summary>
                              <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                                {entry.oldValues && (
                                  <div className="mb-2">
                                    <strong>Before:</strong>
                                    <pre className="mt-1">{JSON.stringify(entry.oldValues, null, 2)}</pre>
                                  </div>
                                )}
                                {entry.newValues && (
                                  <div>
                                    <strong>After:</strong>
                                    <pre className="mt-1">{JSON.stringify(entry.newValues, null, 2)}</pre>
                                  </div>
                                )}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right text-xs text-gray-500">
                      <div>IP: {entry.ipAddress}</div>
                      {entry.sessionId && (
                        <div>Session: {entry.sessionId.slice(0, 8)}...</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <span className="text-sm text-gray-600">
                Page {currentPage} of {pagination.pages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                disabled={currentPage >= pagination.pages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
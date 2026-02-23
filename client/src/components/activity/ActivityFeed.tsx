import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Upload, 
  Shield, 
  Settings, 
  User, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Trash2,
  Plus,
  Edit,
  Eye,
  LogIn,
  LogOut,
  Activity
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

interface AuditLogEntry {
  id: string;
  userId: string | null;
  organizationId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  riskLevel: string | null;
  additionalContext: string | null;
  timestamp: string;
}

interface AuditLogsResponse {
  data: AuditLogEntry[];
  page: number;
  limit: number;
  total: number;
}

type WrappedAuditLogsResponse = {
  success?: boolean;
  data?: AuditLogsResponse;
};

function unwrapAuditLogsResponse(payload: AuditLogsResponse | WrappedAuditLogsResponse | undefined): AuditLogsResponse {
  if (!payload) {
    return { data: [], page: 1, limit: 0, total: 0 };
  }

  const directPayload = payload as AuditLogsResponse;
  if (Array.isArray(directPayload.data)) {
    return directPayload;
  }

  const wrappedPayload = payload as WrappedAuditLogsResponse;
  if (wrappedPayload.data && Array.isArray(wrappedPayload.data.data)) {
    return wrappedPayload.data;
  }

  return { data: [], page: 1, limit: 0, total: 0 };
}

const actionIcons: Record<string, typeof Activity> = {
  CREATE: Plus,
  READ: Eye,
  UPDATE: Edit,
  DELETE: Trash2,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  DATA_EXPORT: Download,
  SENSITIVE_ACCESS: AlertTriangle,
  CONFIG_CHANGE: Settings,
  UPLOAD: Upload,
};

const resourceIcons: Record<string, typeof Activity> = {
  document: FileText,
  documents: FileText,
  evidence: Upload,
  control: Shield,
  controls: Shield,
  profile: User,
  company_profile: User,
  authentication: LogIn,
};

const riskColors: Record<string, string> = {
  low: "text-green-600 dark:text-green-400",
  medium: "text-yellow-600 dark:text-yellow-400",
  high: "text-orange-600 dark:text-orange-400",
  critical: "text-red-600 dark:text-red-400",
};

function formatAction(action: string): string {
  const actionLabels: Record<string, string> = {
    CREATE: "Created",
    READ: "Viewed",
    UPDATE: "Updated",
    DELETE: "Deleted",
    LOGIN: "Logged in",
    LOGOUT: "Logged out",
    DATA_EXPORT: "Exported",
    SENSITIVE_ACCESS: "Accessed sensitive data",
    CONFIG_CHANGE: "Changed configuration",
  };
  return actionLabels[action] || action.toLowerCase().replace(/_/g, " ");
}

function formatResourceType(resourceType: string | null): string {
  if (!resourceType) return "item";
  const labels: Record<string, string> = {
    document: "document",
    documents: "document",
    evidence: "evidence",
    control: "control",
    controls: "control",
    profile: "profile",
    company_profile: "company profile",
    authentication: "",
    user: "user",
    settings: "settings",
  };
  return labels[resourceType.toLowerCase()] || resourceType.replace(/_/g, " ");
}

interface ActivityFeedProps {
  limit?: number;
  compact?: boolean;
  showViewAll?: boolean;
}

export function ActivityFeed({ limit = 10, compact = false, showViewAll = true }: ActivityFeedProps) {
  const [, setLocation] = useLocation();
  
  const { data, isLoading, isError } = useQuery<AuditLogsResponse | WrappedAuditLogsResponse>({
    queryKey: [`/api/audit-trail?limit=${limit}`],
  });

  const activities = unwrapAuditLogsResponse(data).data;

  if (isLoading) {
    return (
      <Card data-testid="activity-feed-loading">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" data-testid="activity-loading-skeleton">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3" data-testid={`skeleton-item-${i}`}>
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card data-testid="activity-feed-error">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load activity feed</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="activity-feed">
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
        {showViewAll && activities.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            className="text-xs"
            onClick={() => setLocation("/audit-trail")}
            data-testid="link-view-all-activity"
          >
            View All
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground" data-testid="activity-empty-state">
            <Activity className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm" data-testid="text-no-activity">No recent activity</p>
          </div>
        ) : (
          <ScrollArea className={compact ? "h-64" : "h-80"}>
            <div className="space-y-1">
              {activities.map((activity) => {
                const ActionIcon = actionIcons[activity.action] || Activity;
                const ResourceIcon = resourceIcons[activity.resourceType?.toLowerCase() || ""] || FileText;
                const riskClass = activity.riskLevel ? riskColors[activity.riskLevel] : "";

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-2 rounded-md hover-elevate cursor-default"
                    data-testid={`activity-item-${activity.id}`}
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <ResourceIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${riskClass}`}>
                          {formatAction(activity.action)}
                        </span>
                        {activity.resourceType && activity.action !== "LOGIN" && activity.action !== "LOGOUT" && (
                          <span className="text-sm text-muted-foreground">
                            {formatResourceType(activity.resourceType)}
                          </span>
                        )}
                        {activity.riskLevel && activity.riskLevel !== "low" && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${riskClass} border-current`}
                          >
                            {activity.riskLevel}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

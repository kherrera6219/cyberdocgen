import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ListOrdered,
  ArrowUpCircle,
  Clock,
  Target,
  Zap,
  ChevronRight,
  Shield,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { useLocation } from "wouter";

interface GapAnalysisReport {
  id: string;
  framework: string;
  overallScore: number;
  status: string;
  createdAt: string;
}

interface GapFinding {
  id: string;
  reportId: string;
  controlId: string;
  controlTitle: string;
  currentStatus: "not_implemented" | "partially_implemented" | "implemented";
  riskLevel: "critical" | "high" | "medium" | "low";
  gapDescription: string;
  businessImpact: string;
  complianceScore: number;
  priority: number;
  estimatedEffort: "low" | "medium" | "high";
}

interface RemediationRecommendation {
  id: string;
  findingId: string;
  title: string;
  description: string;
  priority: number;
  status: "pending" | "in_progress" | "completed";
  timeframe?: string;
  cost?: string;
}

interface ControlPrioritizerProps {
  className?: string;
  onImplementControl?: (controlId: string) => void;
}

function getEffortColor(effort: string) {
  switch (effort) {
    case "low":    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "medium": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "high":   return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:       return "bg-gray-100 text-gray-700";
  }
}

function getImpactColor(level: string) {
  switch (level) {
    case "critical":
    case "high":   return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "medium": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "low":    return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
    default:       return "bg-gray-100 text-gray-700";
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Completed</Badge>;
    case "in_progress":
      return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">In Progress</Badge>;
    case "implemented":
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Implemented</Badge>;
    default:
      return <Badge variant="outline">Not Started</Badge>;
  }
}

function getPriorityIcon(priority: number) {
  if (priority >= 5) return <ArrowUpCircle className="h-5 w-5 text-red-500" />;
  if (priority >= 3) return <AlertTriangle className="h-5 w-5 text-orange-500" />;
  return <Shield className="h-5 w-5 text-blue-500" />;
}

function mapEffort(effort: string | undefined): "low" | "medium" | "high" {
  if (effort === "low" || effort === "medium" || effort === "high") return effort;
  return "medium";
}

function timeframeLabel(timeframe?: string): string {
  if (!timeframe) return "TBD";
  switch (timeframe) {
    case "short_term":  return "1–2 weeks";
    case "medium_term": return "1–2 months";
    case "long_term":   return "3–6 months";
    default:            return timeframe;
  }
}

function getControlCategory(controlId: string): string {
  const cleanId = String(controlId).toLowerCase();
  if (cleanId.includes("cc6.1") || cleanId === "1" || cleanId.includes("access")) return "Access Control";
  if (cleanId.includes("cc6.2") || cleanId === "2" || cleanId.includes("encrypt")) return "Data Protection";
  if (cleanId.includes("cc6.3") || cleanId === "3" || cleanId.includes("train")) return "Human Resources";
  if (cleanId.includes("cc6.4") || cleanId === "4" || cleanId.includes("scan")) return "Risk Assessment";
  return "Incident Management";
}

function getControlFramework(controlId: string): string {
  const cleanId = String(controlId).toLowerCase();
  if (cleanId.includes("cc6.1") || cleanId === "1" || cleanId.includes("cc6.5") || cleanId === "5") return "ISO 27001";
  if (cleanId.includes("cc6.2") || cleanId === "2") return "SOC 2";
  if (cleanId.includes("cc6.3") || cleanId === "3") return "NIST";
  if (cleanId.includes("cc6.4") || cleanId === "4") return "FedRAMP";
  return "ISO 27001";
}

export function ControlPrioritizer({ className, onImplementControl }: ControlPrioritizerProps) {
  const [, setLocation] = useLocation();

  // Fetch all gap analysis reports
  const { data: reportsResp, isLoading: reportsLoading } = useQuery<{
    success: boolean;
    data: GapAnalysisReport[];
  }>({
    queryKey: ["/api/gap-analysis"],
    staleTime: 60_000,
  });

  const reports = reportsResp?.data ?? [];
  const completedReport = reports.find((r) => r.status === "completed");

  // Fetch findings for the most recent completed report
  const { data: reportDetailResp, isLoading: detailLoading } = useQuery<{
    success: boolean;
    data: {
      report: GapAnalysisReport;
      findings: GapFinding[];
      recommendations: RemediationRecommendation[];
    };
  }>({
    queryKey: [`/api/gap-analysis/reports/${completedReport?.id}`],
    enabled: !!completedReport?.id,
    staleTime: 60_000,
  });

  const isLoading = reportsLoading || detailLoading;

  const findings: GapFinding[] = reportDetailResp?.data?.findings ?? [];
  const recommendations: RemediationRecommendation[] = reportDetailResp?.data?.recommendations ?? [];

  // Sort findings by priority desc, take top 5
  const topFindings = [...findings]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);

  // Match recommendations to findings for status
  const getStatusForFinding = (finding: GapFinding): string => {
    const rec = recommendations.find((r) => r.findingId === finding.id);
    if (rec) return rec.status;
    return finding.currentStatus === "implemented" ? "completed" : "not_started";
  };

  const completedCount = topFindings.filter(
    (f) => getStatusForFinding(f) === "completed" || f.currentStatus === "implemented"
  ).length;
  const overallProgress = topFindings.length > 0
    ? (completedCount / topFindings.length) * 100
    : 0;

  const hasData = topFindings.length > 0;

  return (
    <Card className={`border-0 bg-white dark:bg-gray-800 shadow-lg ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <ListOrdered className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900 dark:text-white">AI Control Prioritizer</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">Smart recommendations based on risk and effort</p>
            </div>
          </div>
          {hasData && (
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {completedCount}/{topFindings.length} implemented
              </span>
            </div>
          )}
        </div>

        {hasData && (
          <div className="mt-4" aria-live="polite" aria-atomic="true">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Implementation Progress</span>
              <span className="font-medium text-gray-900 dark:text-white">{Math.round(overallProgress)}%</span>
            </div>
            <Progress
              value={overallProgress}
              className="h-2"
              aria-label={`Implementation progress: ${Math.round(overallProgress)}% complete`}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4" role="list" aria-label="Prioritized security controls">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
              <ClipboardList className="h-8 w-8 text-gray-400" aria-hidden="true" />
            </div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">No Gap Analysis Yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-4">
              Run a gap analysis to get AI-powered, prioritized recommendations for your compliance controls.
            </p>
            <Button
              size="sm"
              onClick={() => setLocation("/gap-analysis")}
              data-testid="button-run-gap-analysis"
            >
              Run Gap Analysis
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        ) : (
          <>
            {topFindings.map((finding, index) => {
              const effort = mapEffort(finding.estimatedEffort);
              const status = getStatusForFinding(finding);
              const rec = recommendations.find((r) => r.findingId === finding.id);

              return (
                <div
                  key={finding.id}
                  role="listitem"
                  aria-label={`Priority ${index + 1}: ${finding.controlTitle}, Status: ${status.replace("_", " ")}`}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    status === "completed"
                      ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                      : "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
                  }`}
                  data-testid={`control-${finding.id}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                      <span className="text-lg font-bold text-gray-700 dark:text-gray-300">#{index + 1}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {getPriorityIcon(finding.priority)}
                        <h4 className="font-semibold text-gray-900 dark:text-white">{finding.controlTitle}</h4>
                        {getStatusBadge(status)}
                      </div>

                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">{finding.controlId}</Badge>
                        <Badge variant="outline" className="text-xs">{getControlFramework(finding.controlId)}</Badge>
                        <Badge variant="outline" className="text-xs">{getControlCategory(finding.controlId)}</Badge>
                        <Badge variant="outline" className="text-xs capitalize">{finding.riskLevel} risk</Badge>
                      </div>

                      <p
                        id={`control-desc-${finding.id}`}
                        className="text-sm text-gray-600 dark:text-gray-400 mb-3"
                      >
                        {finding.gapDescription}
                      </p>

                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">Impact:</span>
                          <Badge className={`text-xs border-0 ${getImpactColor(finding.riskLevel)}`}>
                            {finding.riskLevel}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">Effort:</span>
                          <Badge className={`text-xs border-0 ${getEffortColor(effort)}`}>
                            {effort}
                          </Badge>
                        </div>
                        {rec && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">{timeframeLabel(rec.timeframe)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {status === "completed" ? (
                      <span
                        className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        role="status"
                        aria-label={`${finding.controlTitle} is already completed`}
                        data-testid={`button-implement-${finding.id}`}
                      >
                        Done
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onImplementControl?.(finding.id)}
                        aria-label={`Implement ${finding.controlTitle}`}
                        aria-describedby={`control-desc-${finding.id}`}
                        data-testid={`button-implement-${finding.id}`}
                        className="focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        Implement
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/gap-analysis")}
                data-testid="button-view-full-analysis"
              >
                View Full Gap Analysis
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

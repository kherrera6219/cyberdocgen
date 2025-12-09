import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ListOrdered, 
  ArrowUpCircle, 
  Clock, 
  Target, 
  Zap,
  ChevronRight,
  Shield,
  AlertTriangle
} from "lucide-react";

interface PrioritizedControl {
  id: string;
  name: string;
  framework: string;
  category: string;
  priority: number;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  estimatedTime: string;
  reason: string;
  status: "not_started" | "in_progress" | "completed";
}

interface ControlPrioritizerProps {
  className?: string;
  onImplementControl?: (controlId: string) => void;
}

export function ControlPrioritizer({ className, onImplementControl }: ControlPrioritizerProps) {
  const prioritizedControls: PrioritizedControl[] = [
    {
      id: "1",
      name: "Multi-Factor Authentication",
      framework: "ISO 27001",
      category: "Access Control",
      priority: 1,
      effort: "low",
      impact: "high",
      estimatedTime: "2-3 days",
      reason: "High impact, low effort - Quick win for security posture",
      status: "not_started"
    },
    {
      id: "2",
      name: "Encryption at Rest",
      framework: "SOC 2",
      category: "Data Protection",
      priority: 2,
      effort: "medium",
      impact: "high",
      estimatedTime: "1 week",
      reason: "Critical for data protection compliance",
      status: "in_progress"
    },
    {
      id: "3",
      name: "Security Awareness Training",
      framework: "NIST",
      category: "Human Resources",
      priority: 3,
      effort: "medium",
      impact: "high",
      estimatedTime: "2 weeks",
      reason: "Reduces human-related security incidents by 60%",
      status: "not_started"
    },
    {
      id: "4",
      name: "Vulnerability Scanning",
      framework: "FedRAMP",
      category: "Risk Assessment",
      priority: 4,
      effort: "low",
      impact: "medium",
      estimatedTime: "3-4 days",
      reason: "Automated detection of security weaknesses",
      status: "not_started"
    },
    {
      id: "5",
      name: "Incident Response Plan",
      framework: "ISO 27001",
      category: "Incident Management",
      priority: 5,
      effort: "medium",
      impact: "high",
      estimatedTime: "1-2 weeks",
      reason: "Required for audit readiness",
      status: "not_started"
    }
  ];

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case "low": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "medium": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "high": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "medium": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "low": return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">In Progress</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const getPriorityIcon = (priority: number) => {
    if (priority === 1) return <ArrowUpCircle className="h-5 w-5 text-red-500" />;
    if (priority <= 3) return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    return <Shield className="h-5 w-5 text-blue-500" />;
  };

  const completedCount = prioritizedControls.filter(c => c.status === "completed").length;
  const overallProgress = (completedCount / prioritizedControls.length) * 100;

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
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {completedCount}/{prioritizedControls.length} implemented
            </span>
          </div>
        </div>

        <div className="mt-4" aria-live="polite" aria-atomic="true">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Implementation Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" aria-label={`Implementation progress: ${Math.round(overallProgress)}% complete`} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4" role="list" aria-label="Prioritized security controls">
        {prioritizedControls.map((control, index) => (
          <div 
            key={control.id}
            role="listitem"
            aria-label={`Priority ${control.priority}: ${control.name}, Status: ${control.status.replace('_', ' ')}`}
            className={`p-4 rounded-lg border transition-all duration-200 ${
              control.status === "completed" 
                ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" 
                : "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
            }`}
            data-testid={`control-${control.id}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                <span className="text-lg font-bold text-gray-700 dark:text-gray-300">#{control.priority}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {getPriorityIcon(control.priority)}
                  <h4 className="font-semibold text-gray-900 dark:text-white">{control.name}</h4>
                  {getStatusBadge(control.status)}
                </div>
                
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">{control.framework}</Badge>
                  <Badge variant="outline" className="text-xs">{control.category}</Badge>
                </div>
                
                <p id={`control-desc-${control.id}`} className="text-sm text-gray-600 dark:text-gray-400 mb-3">{control.reason}</p>
                
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Impact:</span>
                    <Badge className={`text-xs border-0 ${getImpactColor(control.impact)}`}>
                      {control.impact}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Effort:</span>
                    <Badge className={`text-xs border-0 ${getEffortColor(control.effort)}`}>
                      {control.effort}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{control.estimatedTime}</span>
                  </div>
                </div>
              </div>
              
              {control.status === "completed" ? (
                <span 
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  role="status"
                  aria-label={`${control.name} is already completed`}
                  data-testid={`button-implement-${control.id}`}
                >
                  Done
                  <ChevronRight className="h-4 w-4 ml-1" />
                </span>
              ) : (
                <Button 
                  size="sm"
                  variant="default"
                  onClick={() => onImplementControl?.(control.id)}
                  aria-label={`Implement ${control.name}`}
                  aria-describedby={`control-desc-${control.id}`}
                  data-testid={`button-implement-${control.id}`}
                  className="focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Implement
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.href = '/gap-analysis'}
            data-testid="button-view-full-analysis"
          >
            View Full Gap Analysis
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

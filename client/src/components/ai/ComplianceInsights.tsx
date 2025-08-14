import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Loader2,
  Target,
  Lightbulb
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ComplianceInsightsProps {
  companyProfileId: string;
  framework: string;
  className?: string;
}

interface ComplianceInsights {
  riskScore: number;
  keyRisks: string[];
  recommendations: string[];
  priorityActions: string[];
}

export function ComplianceInsights({ companyProfileId, framework, className }: ComplianceInsightsProps) {
  const [insights, setInsights] = useState<ComplianceInsights | null>(null);

  const generateInsights = useMutation({
    mutationFn: async (): Promise<ComplianceInsights> => {
      const response = await apiRequest("POST", "/api/ai/generate-insights", { companyProfileId, framework });
      return await response.json();
    },
    onSuccess: (data: ComplianceInsights) => {
      setInsights(data);
    },
  });

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: "High", color: "destructive" as const };
    if (score >= 50) return { level: "Medium", color: "default" as const };
    return { level: "Low", color: "secondary" as const };
  };

  const riskInfo = insights ? getRiskLevel(insights.riskScore) : null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          AI Compliance Insights
        </CardTitle>
        <CardDescription>
          AI-powered risk assessment and strategic recommendations for {framework}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!insights ? (
          <div className="text-center py-6">
            <Button
              onClick={() => generateInsights.mutate()}
              disabled={generateInsights.isPending}
              className="min-w-32"
            >
              {generateInsights.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Risk Score Overview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Risk Score</span>
                <Badge variant={riskInfo?.color}>
                  {riskInfo?.level} Risk ({insights.riskScore}/100)
                </Badge>
              </div>
              <Progress value={insights.riskScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Higher scores indicate increased compliance risk requiring immediate attention
              </p>
            </div>

            {/* Key Risks */}
            {insights.keyRisks.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Key Risk Areas
                  </h4>
                  <div className="space-y-2">
                    {insights.keyRisks.map((risk, index) => (
                      <Alert key={index} className="p-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {risk}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Priority Actions */}
            {insights.priorityActions.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-red-500" />
                    Priority Actions
                  </h4>
                  <div className="space-y-2">
                    {insights.priorityActions.map((action, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                        <CheckCircle2 className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-red-700 dark:text-red-300">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Strategic Recommendations */}
            {insights.recommendations.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-500" />
                    Strategic Recommendations
                  </h4>
                  <div className="space-y-2">
                    {insights.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                        <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-blue-700 dark:text-blue-300">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Refresh Button */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateInsights.mutate()}
                disabled={generateInsights.isPending}
              >
                {generateInsights.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  "Refresh Analysis"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
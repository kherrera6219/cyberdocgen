import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface RiskFactor {
  category: string;
  description: string;
  impact: "low" | "medium" | "high" | "critical";
  likelihood: "rare" | "unlikely" | "possible" | "likely" | "certain";
  riskScore: number;
  mitigationStrategies: string[];
  complianceFrameworks: string[];
}

interface ComplianceGap {
  requirement: string;
  framework: string;
  currentState: string;
  requiredState: string;
  gapSeverity: "low" | "medium" | "high" | "critical";
  remediation: {
    actions: string[];
    timeframe: string;
    cost: "low" | "medium" | "high";
    priority: number;
  };
}

interface RiskAssessmentResult {
  overallRiskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskFactors: RiskFactor[];
  complianceGaps: ComplianceGap[];
  prioritizedActions: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  frameworkReadiness: {
    [framework: string]: {
      readiness: number;
      criticalGaps: string[];
      estimatedTimeToCompliance: string;
    };
  };
  recommendations: {
    strategic: string[];
    tactical: string[];
    operational: string[];
  };
}

interface RiskAssessmentProps {
  className?: string;
}

export function RiskAssessment({ className }: RiskAssessmentProps) {
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(["iso27001"]);
  const { toast } = useToast();

  // Get company profile
  const { data: companyProfile } = useQuery({
    queryKey: ["/api/company-profile"],
  });

  // Risk assessment mutation
  const assessmentMutation = useMutation({
    mutationFn: async (data: { frameworks: string[]; includeDocuments?: boolean }) => {
      return apiRequest(`/api/ai/risk-assessment`, {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Risk Assessment Complete",
        description: "Your organizational risk assessment has been completed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Assessment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Threat landscape analysis mutation
  const threatAnalysisMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/ai/threat-analysis`, {
        method: "POST",
        body: {
          industry: companyProfile?.industry || "Technology",
          companySize: companyProfile?.companySize || "100-500",
          frameworks: selectedFrameworks,
        },
      });
    },
  });

  const handleRunAssessment = () => {
    if (!companyProfile) {
      toast({
        title: "Company Profile Required",
        description: "Please complete your company profile first.",
        variant: "destructive",
      });
      return;
    }

    assessmentMutation.mutate({
      frameworks: selectedFrameworks,
      includeDocuments: true,
    });
  };

  const handleThreatAnalysis = () => {
    threatAnalysisMutation.mutate();
  };

  const toggleFramework = (framework: string) => {
    setSelectedFrameworks((prev) =>
      prev.includes(framework) ? prev.filter((f) => f !== framework) : [...prev, framework]
    );
  };

  const assessmentResult = assessmentMutation.data as RiskAssessmentResult;
  const threatAnalysis = threatAnalysisMutation.data;

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            AI-Powered Risk Assessment
          </CardTitle>
          <CardDescription>
            Comprehensive risk analysis with industry threat intelligence and compliance gap
            identification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Framework Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Select Compliance Frameworks</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: "iso27001", name: "ISO 27001" },
                { id: "soc2", name: "SOC 2" },
                { id: "fedramp", name: "FedRAMP" },
                { id: "nist", name: "NIST 800-53" },
              ].map((framework) => (
                <Button
                  key={framework.id}
                  variant={selectedFrameworks.includes(framework.id) ? "default" : "outline"}
                  onClick={() => toggleFramework(framework.id)}
                  className="justify-start"
                >
                  <CheckCircle2
                    className={`h-4 w-4 mr-2 ${
                      selectedFrameworks.includes(framework.id) ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {framework.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleRunAssessment}
              disabled={assessmentMutation.isPending || selectedFrameworks.length === 0}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              {assessmentMutation.isPending ? "Analyzing..." : "Run Risk Assessment"}
            </Button>

            <Button
              variant="outline"
              onClick={handleThreatAnalysis}
              disabled={threatAnalysisMutation.isPending}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              {threatAnalysisMutation.isPending ? "Analyzing..." : "Threat Analysis"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Results */}
      {assessmentResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Risk Assessment Results
              <Badge className={getRiskColor(assessmentResult.riskLevel)}>
                {assessmentResult.riskLevel.toUpperCase()} RISK ({assessmentResult.overallRiskScore}
                /100)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="factors">Risk Factors</TabsTrigger>
                <TabsTrigger value="gaps">Compliance Gaps</TabsTrigger>
                <TabsTrigger value="readiness">Framework Readiness</TabsTrigger>
                <TabsTrigger value="roadmap">Action Roadmap</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Risk Score Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Overall Risk Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-center mb-2">
                        {assessmentResult.overallRiskScore}/100
                      </div>
                      <Progress
                        value={assessmentResult.overallRiskScore}
                        className={`h-2 ${getProgressColor(assessmentResult.overallRiskScore)}`}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Critical Issues
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-center text-red-600">
                        {assessmentResult.riskFactors.filter((f) => f.impact === "critical").length}
                      </div>
                      <p className="text-sm text-center text-gray-600">
                        Require immediate attention
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Frameworks Ready
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-center text-green-600">
                        {
                          Object.values(assessmentResult.frameworkReadiness).filter(
                            (f) => f.readiness > 80
                          ).length
                        }
                      </div>
                      <p className="text-sm text-center text-gray-600">
                        Out of {selectedFrameworks.length}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Immediate Actions */}
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Immediate Actions Required:</strong>
                    <ul className="mt-2 space-y-1">
                      {assessmentResult.prioritizedActions.immediate
                        .slice(0, 3)
                        .map((action, index) => (
                          <li key={index} className="text-sm">
                            • {action}
                          </li>
                        ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="factors" className="space-y-4">
                <div className="grid gap-4">
                  {assessmentResult.riskFactors
                    .sort((a, b) => b.riskScore - a.riskScore)
                    .map((factor, index) => (
                      <Card
                        key={index}
                        className={`border-l-4 ${getRiskColor(factor.impact).split(" ")[2]}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{factor.category}</CardTitle>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                Impact: {factor.impact}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Score: {factor.riskScore}/25
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm">{factor.description}</p>

                          <div>
                            <h5 className="font-medium text-sm mb-2">Mitigation Strategies:</h5>
                            <ul className="space-y-1">
                              {factor.mitigationStrategies.map((strategy, idx) => (
                                <li key={idx} className="text-sm flex items-start gap-2">
                                  <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                  {strategy}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {factor.complianceFrameworks.map((framework) => (
                              <Badge key={framework} variant="secondary" className="text-xs">
                                {framework}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="gaps" className="space-y-4">
                <div className="grid gap-4">
                  {assessmentResult.complianceGaps
                    .sort((a, b) => {
                      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                      return severityOrder[b.gapSeverity] - severityOrder[a.gapSeverity];
                    })
                    .map((gap, index) => (
                      <Card
                        key={index}
                        className={`border-l-4 ${getRiskColor(gap.gapSeverity).split(" ")[2]}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{gap.requirement}</CardTitle>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {gap.framework}
                              </Badge>
                              <Badge className={`text-xs ${getRiskColor(gap.gapSeverity)}`}>
                                {gap.gapSeverity}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium">Current State:</p>
                              <p className="text-gray-600">{gap.currentState}</p>
                            </div>
                            <div>
                              <p className="font-medium">Required State:</p>
                              <p className="text-gray-600">{gap.requiredState}</p>
                            </div>
                          </div>

                          <div>
                            <h5 className="font-medium text-sm mb-2">Remediation Actions:</h5>
                            <ul className="space-y-1">
                              {gap.remediation.actions.map((action, idx) => (
                                <li key={idx} className="text-sm flex items-start gap-2">
                                  <Target className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {gap.remediation.timeframe}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {gap.remediation.cost} cost
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              Priority {gap.remediation.priority}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="readiness" className="space-y-4">
                <div className="grid gap-4">
                  {Object.entries(assessmentResult.frameworkReadiness).map(
                    ([framework, readiness]) => (
                      <Card key={framework}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{framework.toUpperCase()}</CardTitle>
                            <Badge
                              className={`${
                                readiness.readiness > 80
                                  ? "bg-green-100 text-green-800"
                                  : readiness.readiness > 60
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {readiness.readiness}% Ready
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Progress value={readiness.readiness} className="h-2" />

                          <div>
                            <h5 className="font-medium text-sm mb-2">Critical Gaps:</h5>
                            <ul className="space-y-1">
                              {readiness.criticalGaps.map((gap, idx) => (
                                <li key={idx} className="text-sm flex items-start gap-2">
                                  <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                                  {gap}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            Estimated time to compliance: {readiness.estimatedTimeToCompliance}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              </TabsContent>

              <TabsContent value="roadmap" className="space-y-4">
                <div className="grid gap-6">
                  {/* Immediate Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Zap className="h-4 w-4 text-red-500" />
                        Immediate Actions (0-30 days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {assessmentResult.prioritizedActions.immediate.map((action, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Short Term Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-orange-500" />
                        Short Term Actions (1-6 months)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {assessmentResult.prioritizedActions.shortTerm.map((action, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <Target className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Long Term Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-blue-500" />
                        Long Term Actions (6+ months)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {assessmentResult.prioritizedActions.longTerm.map((action, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Threat Analysis Results */}
      {threatAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Industry Threat Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">
                  Current Threat Landscape for {threatAnalysis.industry}
                </h4>
                <div className="grid gap-3">
                  {threatAnalysis.threatLandscape?.slice(0, 5).map((threat: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm">{threat.name}</h5>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {threat.probability}% likely
                          </Badge>
                          <Badge
                            className={`text-xs ${
                              threat.impact > 4
                                ? "bg-red-100 text-red-800"
                                : threat.impact > 3
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            Impact: {threat.impact}/5
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{threat.description}</p>
                      <div className="text-xs text-gray-500">
                        <strong>Mitigations:</strong> {threat.mitigations?.join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

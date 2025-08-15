import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle, Clock, TrendingUp, FileText, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface GapAnalysisReport {
  id: string;
  organizationId: string;
  framework: string;
  analysisDate: string;
  overallScore: number;
  status: string;
  metadata?: any;
}

interface GapAnalysisFinding {
  id: string;
  reportId: string;
  controlId: string;
  controlTitle: string;
  currentStatus: 'not_implemented' | 'partially_implemented' | 'implemented' | 'fully_compliant';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  gapDescription: string;
  businessImpact: string;
  evidenceRequired: string;
  complianceScore: number;
  priority: number;
  estimatedEffort: 'low' | 'medium' | 'high';
}

interface RemediationRecommendation {
  id: string;
  findingId: string;
  title: string;
  description: string;
  implementation: string;
  resources: any;
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  cost: 'low' | 'medium' | 'high';
  priority: number;
  status: 'pending' | 'in_progress' | 'completed' | 'deferred';
  assignedTo?: string;
  dueDate?: string;
}

interface ExecutiveSummary {
  overallScore: number;
  criticalGaps: number;
  highPriorityActions: number;
  estimatedRemediationTime: string;
  topRisks: string[];
}

export default function GapAnalysisPage() {
  const [selectedFramework, setSelectedFramework] = useState<string>("iso27001");
  const [selectedReport, setSelectedReport] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch gap analysis reports
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/gap-analysis/reports"],
  });

  // Fetch report details when selected
  const { data: reportDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["/api/gap-analysis/reports", selectedReport],
    enabled: !!selectedReport,
  });

  // Generate new gap analysis
  const generateAnalysisMutation = useMutation({
    mutationFn: async (framework: string) => {
      return apiRequest(`/api/gap-analysis/generate`, {
        method: "POST",
        body: JSON.stringify({
          framework,
          includeMaturityAssessment: true,
          focusAreas: []
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gap-analysis/reports"] });
      toast({
        title: "Gap Analysis Started",
        description: "Your compliance gap analysis is being generated. This may take a few minutes.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update recommendation status
  const updateRecommendationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest(`/api/gap-analysis/recommendations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gap-analysis/reports", selectedReport] });
      toast({
        title: "Recommendation Updated",
        description: "Remediation status has been updated successfully.",
      });
    },
  });

  const frameworks = [
    { value: "iso27001", label: "ISO 27001:2022" },
    { value: "soc2", label: "SOC 2 Type II" },
    { value: "fedramp", label: "FedRAMP" },
    { value: "nist", label: "NIST 800-53" },
  ];

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'default';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'fully_compliant': return 'default';
      case 'implemented': return 'secondary';
      case 'partially_implemented': return 'outline';
      case 'not_implemented': return 'destructive';
      default: return 'default';
    }
  };

  const getTimeframeBadge = (timeframe: string) => {
    switch (timeframe) {
      case 'immediate': return { color: 'destructive', label: 'Immediate' };
      case 'short_term': return { color: 'secondary', label: '1-3 months' };
      case 'medium_term': return { color: 'default', label: '3-6 months' };
      case 'long_term': return { color: 'outline', label: '6+ months' };
      default: return { color: 'default', label: timeframe };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compliance Gap Analysis</h1>
          <p className="text-muted-foreground">
            Identify compliance gaps and get actionable remediation recommendations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedFramework} onValueChange={setSelectedFramework}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select framework" />
            </SelectTrigger>
            <SelectContent>
              {frameworks.map((framework) => (
                <SelectItem key={framework.value} value={framework.value}>
                  {framework.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => generateAnalysisMutation.mutate(selectedFramework)}
            disabled={generateAnalysisMutation.isPending}
          >
            {generateAnalysisMutation.isPending ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Target className="mr-2 h-4 w-4" />
                Start Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Gap Analysis Reports</CardTitle>
          <CardDescription>
            Select a report to view detailed findings and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Loading reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No gap analysis reports yet. Generate your first analysis above.
            </div>
          ) : (
            <div className="grid gap-4">
              {reports.map((report: GapAnalysisReport) => (
                <Card
                  key={report.id}
                  className={`cursor-pointer transition-colors ${
                    selectedReport === report.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedReport(report.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {frameworks.find(f => f.value === report.framework)?.label}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(report.analysisDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold">{report.overallScore}%</div>
                          <div className="text-xs text-muted-foreground">Compliance Score</div>
                        </div>
                        <Progress value={report.overallScore} className="w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Details */}
      {selectedReport && (
        <div className="space-y-6">
          {detailsLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Loading report details...
              </CardContent>
            </Card>
          ) : reportDetails ? (
            <>
              {/* Executive Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        {reportDetails.executiveSummary?.overallScore || 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">Overall Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-destructive">
                        {reportDetails.executiveSummary?.criticalGaps || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Critical Gaps</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {reportDetails.executiveSummary?.highPriorityActions || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">High Priority Actions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">
                        {reportDetails.executiveSummary?.estimatedRemediationTime || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">Est. Remediation Time</div>
                    </div>
                  </div>
                  
                  {reportDetails.executiveSummary?.topRisks?.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-2">Top Risk Areas</h4>
                      <div className="flex flex-wrap gap-2">
                        {reportDetails.executiveSummary.topRisks.map((risk: string, index: number) => (
                          <Badge key={index} variant="outline">{risk}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Detailed Results */}
              <Tabs defaultValue="findings" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="findings">Findings</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  <TabsTrigger value="maturity">Maturity Assessment</TabsTrigger>
                </TabsList>

                <TabsContent value="findings" className="space-y-4">
                  {reportDetails.findings?.map((finding: GapAnalysisFinding) => (
                    <Card key={finding.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{finding.controlTitle}</CardTitle>
                            <CardDescription className="mt-1">
                              Control ID: {finding.controlId}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getRiskBadgeColor(finding.riskLevel)}>
                              {finding.riskLevel.toUpperCase()}
                            </Badge>
                            <Badge variant={getStatusBadgeColor(finding.currentStatus)}>
                              {finding.currentStatus.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Gap Description</h4>
                            <p className="text-sm text-muted-foreground">{finding.gapDescription}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">Business Impact</h4>
                            <p className="text-sm text-muted-foreground">{finding.businessImpact}</p>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex items-center gap-4">
                              <div className="text-sm">
                                <span className="font-medium">Priority:</span> {finding.priority}/5
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Effort:</span> {finding.estimatedEffort}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Compliance Score:</span>
                              <Progress value={finding.complianceScore} className="w-20" />
                              <span className="text-sm">{finding.complianceScore}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4">
                  {reportDetails.recommendations?.map((recommendation: RemediationRecommendation) => (
                    <Card key={recommendation.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                            <CardDescription className="mt-1">
                              Priority: {recommendation.priority}/5
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getTimeframeBadge(recommendation.timeframe).color}>
                              {getTimeframeBadge(recommendation.timeframe).label}
                            </Badge>
                            <Badge variant="outline">
                              {recommendation.cost.toUpperCase()} COST
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground">{recommendation.description}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">Implementation Steps</h4>
                            <p className="text-sm text-muted-foreground">{recommendation.implementation}</p>
                          </div>

                          {recommendation.resources && (
                            <div>
                              <h4 className="font-semibold mb-2">Resources</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                {recommendation.resources.templates?.length > 0 && (
                                  <div>
                                    <span className="font-medium">Templates:</span>
                                    <ul className="list-disc list-inside text-muted-foreground">
                                      {recommendation.resources.templates.map((template: string, index: number) => (
                                        <li key={index}>{template}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {recommendation.resources.tools?.length > 0 && (
                                  <div>
                                    <span className="font-medium">Tools:</span>
                                    <ul className="list-disc list-inside text-muted-foreground">
                                      {recommendation.resources.tools.map((tool: string, index: number) => (
                                        <li key={index}>{tool}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {recommendation.resources.references?.length > 0 && (
                                  <div>
                                    <span className="font-medium">References:</span>
                                    <ul className="list-disc list-inside text-muted-foreground">
                                      {recommendation.resources.references.map((ref: string, index: number) => (
                                        <li key={index}>{ref}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t">
                            <Badge 
                              variant={recommendation.status === 'completed' ? 'default' : 'outline'}
                            >
                              {recommendation.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRecommendationMutation.mutate({
                                  id: recommendation.id,
                                  status: 'in_progress'
                                })}
                                disabled={recommendation.status === 'in_progress'}
                              >
                                Start
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateRecommendationMutation.mutate({
                                  id: recommendation.id,
                                  status: 'completed'
                                })}
                                disabled={recommendation.status === 'completed'}
                              >
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Complete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="maturity" className="space-y-4">
                  {reportDetails.maturityAssessment && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Compliance Maturity Assessment</CardTitle>
                        <CardDescription>
                          Current maturity level and improvement recommendations
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-primary mb-2">
                              Level {reportDetails.maturityAssessment.maturityLevel}
                            </div>
                            <div className="text-lg text-muted-foreground">
                              {reportDetails.maturityAssessment.assessmentData?.maturityLabel}
                            </div>
                          </div>

                          {reportDetails.maturityAssessment.assessmentData?.implementationBreakdown && (
                            <div>
                              <h4 className="font-semibold mb-4">Implementation Breakdown</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-destructive">
                                    {reportDetails.maturityAssessment.assessmentData.implementationBreakdown.notImplemented}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Not Implemented</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-orange-600">
                                    {reportDetails.maturityAssessment.assessmentData.implementationBreakdown.partiallyImplemented}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Partially Implemented</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-blue-600">
                                    {reportDetails.maturityAssessment.assessmentData.implementationBreakdown.implemented}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Implemented</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-green-600">
                                    {reportDetails.maturityAssessment.assessmentData.implementationBreakdown.fullyCompliant}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Fully Compliant</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {reportDetails.maturityAssessment.recommendations?.nextSteps && (
                            <div>
                              <h4 className="font-semibold mb-2">Next Steps</h4>
                              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                {reportDetails.maturityAssessment.recommendations.nextSteps.map((step: string, index: number) => (
                                  <li key={index}>{step}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {reportDetails.maturityAssessment.recommendations?.improvementAreas && (
                            <div>
                              <h4 className="font-semibold mb-2">Key Improvement Areas</h4>
                              <div className="flex flex-wrap gap-2">
                                {reportDetails.maturityAssessment.recommendations.improvementAreas.map((area: string, index: number) => (
                                  <Badge key={index} variant="outline">{area}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
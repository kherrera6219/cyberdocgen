import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  Brain,
  Zap,
  BarChart3,
  Clock,
  ArrowRight
} from "lucide-react";
import { Link } from "wouter";

interface AIInsight {
  id: string;
  type: "recommendation" | "warning" | "info";
  title: string;
  description: string;
  framework?: string;
  actionUrl?: string;
}

interface RiskItem {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  framework: string;
  control: string;
  recommendation: string;
}

export default function AIHub() {
  const [activeTab, setActiveTab] = useState("insights");

  const { data: stats } = useQuery<{
    documentsGenerated: number;
    gapsIdentified: number;
    risksAssessed: number;
    complianceScore: number;
  }>({
    queryKey: ["/api/ai/stats"],
  });

  const mockInsights: AIInsight[] = [
    {
      id: "1",
      type: "recommendation",
      title: "Update Access Control Policy",
      description: "Your access control policy hasn't been reviewed in 90 days. Consider updating it to align with ISO 27001:2022 requirements.",
      framework: "ISO 27001",
      actionUrl: "/ai-doc-generator"
    },
    {
      id: "2", 
      type: "warning",
      title: "Missing SOC 2 Evidence",
      description: "3 SOC 2 controls are missing required evidence documentation. Upload evidence to maintain compliance.",
      framework: "SOC 2",
      actionUrl: "/evidence-ingestion"
    },
    {
      id: "3",
      type: "info",
      title: "Compliance Score Improved",
      description: "Your overall compliance score increased by 8% this month after implementing recommended changes.",
      framework: "All"
    }
  ];

  const mockRisks: RiskItem[] = [
    {
      id: "1",
      title: "Incomplete Encryption at Rest",
      severity: "high",
      framework: "SOC 2",
      control: "CC6.1",
      recommendation: "Implement AES-256 encryption for all stored data assets."
    },
    {
      id: "2",
      title: "Expired Security Certificates",
      severity: "critical",
      framework: "ISO 27001",
      control: "A.10.1",
      recommendation: "Renew SSL certificates before expiration date."
    },
    {
      id: "3",
      title: "Access Review Overdue",
      severity: "medium",
      framework: "FedRAMP",
      control: "AC-2",
      recommendation: "Complete quarterly user access review within 14 days."
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500 dark:bg-red-600";
      case "high": return "bg-orange-500 dark:bg-orange-600";
      case "medium": return "bg-yellow-500 dark:bg-yellow-600";
      case "low": return "bg-green-500 dark:bg-green-600";
      default: return "bg-gray-500";
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "recommendation": return <Sparkles className="w-5 h-5 text-blue-500" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "info": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">AI Assistant Hub</h1>
          <p className="text-muted-foreground">AI-powered insights and recommendations for your compliance journey</p>
        </div>
        <Link href="/ai-doc-generator">
          <Button data-testid="button-generate-document">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Document
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Documents Generated</p>
                <p className="text-2xl font-bold" data-testid="text-stat-documents">{stats?.documentsGenerated ?? 24}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gaps Identified</p>
                <p className="text-2xl font-bold" data-testid="text-stat-gaps">{stats?.gapsIdentified ?? 12}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <BarChart3 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Risks Assessed</p>
                <p className="text-2xl font-bold" data-testid="text-stat-risks">{stats?.risksAssessed ?? 8}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Compliance Score</p>
                <p className="text-2xl font-bold" data-testid="text-stat-score">{stats?.complianceScore ?? 78}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="hover-elevate">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Documents
            </CardTitle>
            <CardDescription>Create compliance documents with AI</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/ai-doc-generator">
              <Button variant="outline" className="w-full" data-testid="button-quick-generate">
                Start Generator
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Upload Evidence
            </CardTitle>
            <CardDescription>Ingest and process compliance evidence</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/evidence-ingestion">
              <Button variant="outline" className="w-full" data-testid="button-quick-evidence">
                Upload Evidence
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Review Approvals
            </CardTitle>
            <CardDescription>Manage pending control approvals</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/control-approvals">
              <Button variant="outline" className="w-full" data-testid="button-quick-approvals">
                View Approvals
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="insights" data-testid="tab-insights">AI Insights</TabsTrigger>
          <TabsTrigger value="risks" data-testid="tab-risks">Risk Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent AI Insights</CardTitle>
              <CardDescription>Automated recommendations based on your compliance data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockInsights.map((insight) => (
                <div 
                  key={insight.id} 
                  className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg"
                  data-testid={`insight-item-${insight.id}`}
                >
                  {getInsightIcon(insight.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium">{insight.title}</h4>
                      {insight.framework && (
                        <Badge variant="secondary">{insight.framework}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                    {insight.actionUrl && (
                      <Link href={insight.actionUrl}>
                        <Button variant="link" className="p-0 h-auto mt-2" data-testid={`button-insight-action-${insight.id}`}>
                          Take Action
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>AI-identified compliance risks requiring attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockRisks.map((risk) => (
                <div 
                  key={risk.id} 
                  className="flex items-start gap-3 p-4 border rounded-lg"
                  data-testid={`risk-item-${risk.id}`}
                >
                  <div className={`w-2 h-full min-h-[60px] rounded-full ${getSeverityColor(risk.severity)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium">{risk.title}</h4>
                      <Badge className={getSeverityColor(risk.severity)}>
                        {risk.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {risk.framework} - {risk.control}
                    </p>
                    <p className="text-sm mt-2">{risk.recommendation}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

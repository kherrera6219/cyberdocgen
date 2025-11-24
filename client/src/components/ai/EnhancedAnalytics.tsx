import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsProps {
  className?: string;
}

interface AnalyticsSummary {
  totalDocuments: number;
  completedDocuments: number;
  averageQualityScore: number;
  totalRiskScore: number;
  frameworkProgress: {
    [framework: string]: number;
  };
  recentActivity: {
    date: string;
    action: string;
    entity: string;
    user: string;
  }[];
  qualityTrends: {
    date: string;
    score: number;
    framework: string;
  }[];
  complianceGaps: {
    framework: string;
    criticalGaps: number;
    totalGaps: number;
  }[];
}

export function EnhancedAnalytics({ className }: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedFramework, setSelectedFramework] = useState("all");

  // Analytics data query
  const { data: analytics, isLoading } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics/summary", timeRange, selectedFramework],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Quality trends query
  const { data: qualityTrends } = useQuery({
    queryKey: ["/api/analytics/quality-trends", timeRange],
    staleTime: 5 * 60 * 1000,
  });

  // Risk assessment history
  const { data: riskHistory } = useQuery({
    queryKey: ["/api/analytics/risk-history", timeRange],
    staleTime: 5 * 60 * 1000,
  });

  // AI usage analytics
  const { data: aiUsage } = useQuery({
    queryKey: ["/api/analytics/ai-usage", timeRange],
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mockAnalytics: AnalyticsSummary = {
    totalDocuments: 42,
    completedDocuments: 31,
    averageQualityScore: 78,
    totalRiskScore: 65,
    frameworkProgress: {
      "ISO 27001": 85,
      "SOC 2": 72,
      FedRAMP: 45,
      "NIST 800-53": 61,
    },
    recentActivity: [
      { date: "2024-08-14", action: "Generated", entity: "Security Policy", user: "You" },
      { date: "2024-08-14", action: "Analyzed", entity: "Risk Assessment", user: "You" },
      { date: "2024-08-13", action: "Updated", entity: "Company Profile", user: "You" },
    ],
    qualityTrends: [
      { date: "2024-08-01", score: 65, framework: "ISO 27001" },
      { date: "2024-08-05", score: 71, framework: "ISO 27001" },
      { date: "2024-08-10", score: 78, framework: "ISO 27001" },
      { date: "2024-08-14", score: 82, framework: "ISO 27001" },
    ],
    complianceGaps: [
      { framework: "ISO 27001", criticalGaps: 3, totalGaps: 12 },
      { framework: "SOC 2", criticalGaps: 5, totalGaps: 18 },
      { framework: "FedRAMP", criticalGaps: 8, totalGaps: 25 },
    ],
  };

  const analyticsData = analytics || mockAnalytics;

  const riskTrendData = [
    { month: "Jul", score: 72 },
    { month: "Aug", score: 65 },
    { month: "Sep", score: 58 },
    { month: "Oct", score: 61 },
  ];

  const frameworkData = Object.entries(analyticsData.frameworkProgress || {}).map(
    ([name, value]) => ({
      name,
      value,
      fill:
        name === "ISO 27001"
          ? "#10b981"
          : name === "SOC 2"
            ? "#3b82f6"
            : name === "FedRAMP"
              ? "#f59e0b"
              : "#8b5cf6",
    })
  );

  const qualityDistribution = [
    { range: "90-100", count: 8, fill: "#10b981" },
    { range: "80-89", count: 15, fill: "#3b82f6" },
    { range: "70-79", count: 12, fill: "#f59e0b" },
    { range: "60-69", count: 5, fill: "#ef4444" },
    { range: "<60", count: 2, fill: "#6b7280" },
  ];

  const aiUsageData = [
    { feature: "Document Generation", usage: 45 },
    { feature: "Quality Analysis", usage: 32 },
    { feature: "Risk Assessment", usage: 28 },
    { feature: "Chatbot", usage: 19 },
    { feature: "Document Analysis", usage: 15 },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Enhanced Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Comprehensive insights into your compliance progress and AI-powered automation
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Frameworks</SelectItem>
                  <SelectItem value="iso27001">ISO 27001</SelectItem>
                  <SelectItem value="soc2">SOC 2</SelectItem>
                  <SelectItem value="fedramp">FedRAMP</SelectItem>
                  <SelectItem value="nist">NIST 800-53</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold">{(analyticsData as any)?.totalDocuments || 0}</p>
                <p className="text-xs text-gray-500">
                  {(analyticsData as any)?.completedDocuments || 0} completed
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <Progress
              value={
                (analyticsData as any)?.totalDocuments
                  ? (((analyticsData as any)?.completedDocuments || 0) /
                      (analyticsData as any)?.totalDocuments) *
                    100
                  : 0
              }
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Quality Score</p>
                <p className="text-2xl font-bold">
                  {(analyticsData as any)?.averageQualityScore || 0}%
                </p>
                <div className="flex items-center text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+5% from last month</span>
                </div>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Risk Score</p>
                <p className="text-2xl font-bold">
                  {(analyticsData as any)?.totalRiskScore || 0}/100
                </p>
                <div className="flex items-center text-xs">
                  <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">-7 from last assessment</span>
                </div>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Automations</p>
                <p className="text-2xl font-bold">139</p>
                <p className="text-xs text-gray-500">This month</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quality">Quality Trends</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
          <TabsTrigger value="ai-usage">AI Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Framework Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Framework Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={frameworkData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {frameworkData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.action} {activity.entity}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.date} • {activity.user}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Gaps Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Compliance Gaps Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analyticsData.complianceGaps.map((gap, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{gap.framework}</h4>
                      <Badge
                        variant={
                          gap.criticalGaps > 5
                            ? "destructive"
                            : gap.criticalGaps > 2
                              ? "secondary"
                              : "default"
                        }
                      >
                        {gap.criticalGaps} critical
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {gap.totalGaps} total gaps identified
                    </p>
                    <Progress
                      value={((gap.totalGaps - gap.criticalGaps) / gap.totalGaps) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quality Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quality Score Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.qualityTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Quality Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quality Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quality Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={qualityDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Score Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={riskTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#f59e0b"
                      fill="#fef3c7"
                      name="Risk Score"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Risk Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { category: "Technical Risks", score: 72, trend: "down" },
                    { category: "Operational Risks", score: 65, trend: "up" },
                    { category: "Compliance Risks", score: 58, trend: "down" },
                    { category: "Strategic Risks", score: 61, trend: "stable" },
                  ].map((risk, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-gray-400" />
                        <span className="font-medium">{risk.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono">{risk.score}/100</span>
                        {risk.trend === "up" && <TrendingUp className="h-4 w-4 text-red-500" />}
                        {risk.trend === "down" && (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        )}
                        {risk.trend === "stable" && (
                          <span className="w-4 h-4 text-gray-400">→</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="frameworks" className="space-y-6">
          <div className="grid gap-6">
            {Object.entries(analyticsData.frameworkProgress).map(([framework, progress]) => (
              <Card key={framework}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{framework}</CardTitle>
                    <Badge
                      variant={
                        progress > 80 ? "default" : progress > 60 ? "secondary" : "destructive"
                      }
                    >
                      {progress}% Complete
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={progress} className="h-3" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Completed: {Math.floor(progress * 0.3)} documents</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span>In Progress: {Math.floor((100 - progress) * 0.2)} documents</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span>Critical Gaps: {Math.floor((100 - progress) * 0.1)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai-usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Feature Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Feature Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={aiUsageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="usage" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* AI Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { metric: "Average Generation Time", value: "2.3s", status: "good" },
                    { metric: "Quality Score Accuracy", value: "94%", status: "excellent" },
                    { metric: "Chat Response Relevance", value: "88%", status: "good" },
                    { metric: "Risk Assessment Accuracy", value: "91%", status: "excellent" },
                  ].map((metric, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <span className="font-medium">{metric.metric}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono">{metric.value}</span>
                        <Badge variant={metric.status === "excellent" ? "default" : "secondary"}>
                          {metric.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

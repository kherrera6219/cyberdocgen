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
    staleTime: 5 * 60 * 1000,
  });

  // Quality trends query
  const { data: qualityTrendsRaw } = useQuery<{ date: string; score: number; framework: string }[]>({
    queryKey: ["/api/analytics/quality-trends", timeRange],
    staleTime: 5 * 60 * 1000,
  });

  // Risk assessment history
  const { data: riskHistoryRaw } = useQuery<{ month: string; score: number }[]>({
    queryKey: ["/api/analytics/risk-history", timeRange],
    staleTime: 5 * 60 * 1000,
  });

  // AI usage analytics
  const { data: aiUsageRaw } = useQuery<{ feature: string; usage: number }[]>({
    queryKey: ["/api/analytics/ai-usage", timeRange],
    staleTime: 5 * 60 * 1000,
  });

  // Risk categories from API
  const { data: riskCategoriesRaw } = useQuery<{ category: string; score: number; trend: string }[]>({
    queryKey: ["/api/analytics/risk-categories", timeRange],
    staleTime: 5 * 60 * 1000,
  });

  // AI performance metrics from API
  const { data: aiPerfRaw } = useQuery<{ metric: string; value: string; status: string }[]>({
    queryKey: ["/api/analytics/ai-performance", timeRange],
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

  // Use real API data only — no mock fallbacks
  const analyticsData = analytics;

  const chartPalette = {
    primary: "hsl(var(--chart-1))",
    secondary: "hsl(var(--chart-2))",
    tertiary: "hsl(var(--chart-3))",
    quaternary: "hsl(var(--chart-4))",
    danger: "hsl(var(--destructive))",
    muted: "hsl(var(--muted-foreground))",
    warningSurface: "hsl(var(--chart-4) / 0.2)",
  };

  const frameworkData = Object.entries(analyticsData?.frameworkProgress || {}).map(
    ([name, value]) => ({
      name,
      value,
      fill:
        name === "ISO 27001"
          ? chartPalette.secondary
          : name === "SOC 2"
            ? chartPalette.primary
            : name === "FedRAMP"
              ? chartPalette.quaternary
              : chartPalette.tertiary,
    })
  );

  // Derive quality score distribution buckets from real quality-trends data
  const qualityDistribution = (() => {
    const trends = qualityTrendsRaw ?? analyticsData?.qualityTrends ?? [];
    if (trends.length === 0) return [];
    const buckets: Record<string, number> = { "90-100": 0, "80-89": 0, "70-79": 0, "60-69": 0, "<60": 0 };
    trends.forEach(({ score }) => {
      if (score >= 90) buckets["90-100"]++;
      else if (score >= 80) buckets["80-89"]++;
      else if (score >= 70) buckets["70-79"]++;
      else if (score >= 60) buckets["60-69"]++;
      else buckets["<60"]++;
    });
    const fills = [chartPalette.secondary, chartPalette.primary, chartPalette.quaternary, chartPalette.danger, chartPalette.muted];
    return Object.entries(buckets).map(([range, count], i) => ({ range, count, fill: fills[i] }));
  })();

  const riskTrendData = riskHistoryRaw ?? [];
  const aiUsageData = aiUsageRaw ?? [];
  const riskCategories = riskCategoriesRaw ?? [];
  const aiPerfMetrics = aiPerfRaw ?? [];

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
                <p className="text-2xl font-bold">{analyticsData?.totalDocuments ?? 0}</p>
                <p className="text-xs text-gray-500">
                  {analyticsData?.completedDocuments ?? 0} completed
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <Progress
              value={
                analyticsData?.totalDocuments
                  ? ((analyticsData.completedDocuments || 0) / analyticsData.totalDocuments) * 100
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
                  {analyticsData?.averageQualityScore ?? 0}%
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>Avg quality score</span>
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
                  {analyticsData?.totalRiskScore ?? 0}/100
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  <span>Total risk score</span>
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
                <p className="text-2xl font-bold">{aiUsageData.reduce((s, d) => s + d.usage, 0) || "—"}</p>
                <p className="text-xs text-gray-500">Total AI calls tracked</p>
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
                {frameworkData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center text-gray-400 dark:text-gray-600">
                    <Shield className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No framework data yet</p>
                    <p className="text-xs mt-1">Activate a compliance framework to see progress</p>
                  </div>
                ) : (
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
                )}
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
                {(analyticsData?.recentActivity ?? []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 dark:text-gray-600">
                    <Clock className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No recent activity</p>
                    <p className="text-xs mt-1">Activity is recorded as you use the platform</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(analyticsData?.recentActivity ?? []).map((activity, index) => (
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
                )}
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
              {(analyticsData?.complianceGaps ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 dark:text-gray-600">
                  <AlertTriangle className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">No compliance gaps data yet</p>
                  <p className="text-xs mt-1">Run a gap analysis to populate this section</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(analyticsData?.complianceGaps ?? []).map((gap, index) => (
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
                        value={gap.totalGaps > 0 ? ((gap.totalGaps - gap.criticalGaps) / gap.totalGaps) * 100 : 0}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              )}
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
                {(qualityTrendsRaw ?? analyticsData?.qualityTrends ?? []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center text-gray-400 dark:text-gray-600">
                    <BarChart3 className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No quality trend data yet</p>
                    <p className="text-xs mt-1">Generate compliance documents to build trends</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={qualityTrendsRaw ?? analyticsData?.qualityTrends ?? []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke={chartPalette.primary}
                        strokeWidth={2}
                        name="Quality Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Quality Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quality Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {qualityDistribution.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center text-gray-400 dark:text-gray-600">
                    <BarChart3 className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No distribution data yet</p>
                    <p className="text-xs mt-1">Quality scores will appear as documents are scored</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={qualityDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill={chartPalette.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
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
                {riskTrendData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center text-gray-400 dark:text-gray-600">
                    <Shield className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No risk history yet</p>
                    <p className="text-xs mt-1">Run risk assessments to populate this chart</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={riskTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke={chartPalette.quaternary}
                        fill={chartPalette.warningSurface}
                        name="Risk Score"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Risk Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {riskCategories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400 dark:text-gray-600">
                    <Shield className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No risk category data yet</p>
                    <p className="text-xs mt-1">Complete risk assessments to view category breakdown</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {riskCategories.map((risk, index) => (
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
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="frameworks" className="space-y-6">
          <div className="grid gap-6">
            {Object.entries(analyticsData?.frameworkProgress ?? {}).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 dark:text-gray-600">
                <Shield className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">No framework progress yet</p>
                <p className="text-xs mt-1">Activate compliance frameworks to track progress</p>
              </div>
            ) : (
              Object.entries(analyticsData?.frameworkProgress ?? {}).map(([framework, progress]) => (
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
                      <p className="text-sm text-gray-500">{progress}% of controls implemented across this framework</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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
                {aiUsageData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center text-gray-400 dark:text-gray-600">
                    <Brain className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No AI usage data yet</p>
                    <p className="text-xs mt-1">AI feature usage is tracked as you use them</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={aiUsageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="feature" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="usage" fill={chartPalette.tertiary} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* AI Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                {aiPerfMetrics.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400 dark:text-gray-600">
                    <Brain className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No performance metrics yet</p>
                    <p className="text-xs mt-1">Metrics are recorded as AI features are used</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiPerfMetrics.map((metric, index) => (
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
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

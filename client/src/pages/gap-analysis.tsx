import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  BarChart3,
  Shield,
  Users,
  Settings,
  Search,
  Filter,
  Download,
  RefreshCw,
  Activity,
  Zap,
  AlertCircle,
  XCircle,
  Calendar,
  Building,
  Code,
  Database,
  Globe,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GapCategory {
  category: string;
  status: "critical" | "high" | "medium" | "low";
  score: number;
  gaps: number;
  description: string;
  recommendations: string[];
}

interface ComplianceFramework {
  name: string;
  status: "implemented" | "partial" | "missing";
  coverage: number;
  controls: {
    total: number;
    implemented: number;
    missing: number;
  };
}

export default function GapAnalysis() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");

  // Comprehensive gap analysis data based on our analysis
  const gapCategories: GapCategory[] = [
    {
      category: "Framework Integration",
      status: "critical",
      score: 15,
      gaps: 4,
      description: "Missing actual compliance framework control mappings for ISO 27001, SOC 2, FedRAMP, and NIST 800-53",
      recommendations: [
        "Implement complete ISO 27001 control library with 114 controls",
        "Add SOC 2 Type 2 trust principles and testing procedures",
        "Build FedRAMP control baselines for Low/Medium/High levels",
        "Create NIST 800-53 Rev 5 control catalog with 1,000+ controls"
      ]
    },
    {
      category: "Document Generation",
      status: "critical",
      score: 25,
      gaps: 3,
      description: "Basic AI content generation without compliance-specific templates and validation",
      recommendations: [
        "Build framework-specific document templates",
        "Add compliance validation engine for generated content",
        "Implement auto-population from company profiles",
        "Create document quality scoring system"
      ]
    },
    {
      category: "Risk Assessment",
      status: "critical",
      score: 0,
      gaps: 5,
      description: "No automated risk assessment capabilities or quantitative analysis",
      recommendations: [
        "Build automated risk scoring algorithms",
        "Implement control effectiveness measurement",
        "Add risk heat map visualization",
        "Create risk treatment planning workflows",
        "Build risk register management"
      ]
    },
    {
      category: "Integration Ecosystem",
      status: "high",
      score: 10,
      gaps: 4,
      description: "Limited third-party integrations and external data sources",
      recommendations: [
        "Build REST API for third-party tools",
        "Add vulnerability scanner integrations",
        "Connect asset management systems",
        "Implement SIEM log analysis"
      ]
    },
    {
      category: "Enterprise Features",
      status: "high",
      score: 20,
      gaps: 6,
      description: "Missing enterprise-grade capabilities for scalability",
      recommendations: [
        "Implement multi-tenant architecture",
        "Add SSO/SAML integration", 
        "Build role-based access controls",
        "Add audit log export capabilities",
        "Implement white-labeling options",
        "Build API management console"
      ]
    },
    {
      category: "User Experience",
      status: "medium",
      score: 45,
      gaps: 5,
      description: "Basic interface lacking guided workflows and collaboration",
      recommendations: [
        "Build compliance assessment wizard",
        "Add real-time compliance dashboard",
        "Implement multi-user collaboration",
        "Create mobile-responsive design",
        "Add workflow automation"
      ]
    }
  ];

  const complianceFrameworks: ComplianceFramework[] = [
    {
      name: "ISO 27001:2022",
      status: "partial",
      coverage: 15,
      controls: { total: 114, implemented: 17, missing: 97 }
    },
    {
      name: "SOC 2 Type 2",
      status: "missing",
      coverage: 5,
      controls: { total: 64, implemented: 3, missing: 61 }
    },
    {
      name: "FedRAMP Low",
      status: "missing",
      coverage: 0,
      controls: { total: 325, implemented: 0, missing: 325 }
    },
    {
      name: "NIST 800-53 Rev 5",
      status: "missing",
      coverage: 0,
      controls: { total: 1000, implemented: 0, missing: 1000 }
    }
  ];

  const overallScore = Math.round(gapCategories.reduce((acc, cat) => acc + cat.score, 0) / gapCategories.length);
  const totalGaps = gapCategories.reduce((acc, cat) => acc + cat.gaps, 0);
  const criticalGaps = gapCategories.filter(cat => cat.status === "critical").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "critical": return <XCircle className="h-4 w-4" />;
      case "high": return <AlertTriangle className="h-4 w-4" />;
      case "medium": return <AlertCircle className="h-4 w-4" />;
      case "low": return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const filteredCategories = gapCategories.filter(category => {
    if (selectedCategory !== "all" && category.category !== selectedCategory) return false;
    if (selectedPriority !== "all" && category.status !== selectedPriority) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Compliance Gap Analysis</h1>
            <p className="text-gray-600">Comprehensive assessment of platform readiness</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Run New Analysis
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-orange-600">{overallScore}%</div>
              <Badge className="bg-orange-100 text-orange-800">Needs Improvement</Badge>
            </div>
            <Progress value={overallScore} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{totalGaps}</div>
            <p className="text-xs text-gray-600 mt-1">Across all categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{criticalGaps}</div>
            <p className="text-xs text-gray-600 mt-1">Immediate attention required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Estimated Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">6-8</div>
            <p className="text-xs text-gray-600 mt-1">Months to full compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Analysis Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {gapCategories.map(cat => (
                  <SelectItem key={cat.category} value={cat.category}>
                    {cat.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Priority Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Search Gaps
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="gaps" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
          <TabsTrigger value="frameworks">Framework Coverage</TabsTrigger>
          <TabsTrigger value="roadmap">Implementation Roadmap</TabsTrigger>
          <TabsTrigger value="recommendations">Priority Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="gaps" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCategories.map((category) => (
              <Card key={category.category} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(category.status)}
                      {category.category}
                    </CardTitle>
                    <Badge className={getStatusColor(category.status)}>
                      {category.status.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Implementation Score</span>
                    <span className="font-bold">{category.score}%</span>
                  </div>
                  <Progress value={category.score} className="w-full" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Identified Gaps</span>
                    <span className="font-bold text-red-600">{category.gaps}</span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Key Recommendations:</h4>
                    <ul className="space-y-1">
                      {category.recommendations.slice(0, 3).map((rec, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                      {category.recommendations.length > 3 && (
                        <li className="text-xs text-blue-600">
                          +{category.recommendations.length - 3} more recommendations
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="frameworks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {complianceFrameworks.map((framework) => (
              <Card key={framework.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {framework.name}
                    </CardTitle>
                    <Badge className={getStatusColor(framework.status)}>
                      {framework.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    Coverage: {framework.coverage}% ({framework.controls.implemented}/{framework.controls.total} controls)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={framework.coverage} className="w-full" />
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-blue-600">{framework.controls.total}</div>
                      <div className="text-xs text-gray-600">Total Controls</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-green-600">{framework.controls.implemented}</div>
                      <div className="text-xs text-gray-600">Implemented</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-red-600">{framework.controls.missing}</div>
                      <div className="text-xs text-gray-600">Missing</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-4">
          <div className="space-y-6">
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertTitle>Implementation Timeline: 6-8 Months</AlertTitle>
              <AlertDescription>
                Estimated timeline to achieve enterprise-grade compliance automation platform
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  phase: "Phase 1: Foundation",
                  timeline: "Month 1-2",
                  priority: "critical",
                  items: ["Framework control libraries", "Enhanced document generation", "Basic gap analysis"]
                },
                {
                  phase: "Phase 2: Core Features", 
                  timeline: "Month 2-4",
                  priority: "high",
                  items: ["Risk assessment automation", "Compliance dashboard", "Third-party integrations"]
                },
                {
                  phase: "Phase 3: Enterprise",
                  timeline: "Month 4-6", 
                  priority: "high",
                  items: ["Multi-tenancy", "Collaboration features", "Mobile optimization"]
                },
                {
                  phase: "Phase 4: Advanced AI",
                  timeline: "Month 6-8",
                  priority: "medium",
                  items: ["Predictive analytics", "Continuous learning", "NL interfaces"]
                }
              ].map((phase, idx) => (
                <Card key={idx} className="relative">
                  <CardHeader className="pb-2">
                    <Badge className={getStatusColor(phase.priority)} variant="outline">
                      {phase.priority}
                    </Badge>
                    <CardTitle className="text-sm">{phase.phase}</CardTitle>
                    <CardDescription className="text-xs">{phase.timeline}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {phase.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="text-xs flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-4">
            {[
              {
                priority: "Critical",
                timeframe: "0-30 days",
                title: "Framework Control Libraries Implementation",
                description: "Add complete control sets for ISO 27001, SOC 2, FedRAMP with proper mappings",
                impact: "Enables actual compliance documentation generation",
                effort: "High",
                status: "critical"
              },
              {
                priority: "Critical", 
                timeframe: "0-30 days",
                title: "Enhanced Document Generation Engine",
                description: "Build framework-specific templates with compliance validation",
                impact: "Ensures generated documents meet regulatory requirements",
                effort: "Medium",
                status: "critical"
              },
              {
                priority: "Critical",
                timeframe: "0-60 days", 
                title: "Automated Gap Analysis Engine",
                description: "Build control gap identification with risk-based prioritization",
                impact: "Provides actionable compliance roadmap to customers",
                effort: "High",
                status: "critical"
              },
              {
                priority: "High",
                timeframe: "1-3 months",
                title: "Risk Assessment Automation",
                description: "Implement quantitative risk scoring and control effectiveness measurement",
                impact: "Enables data-driven compliance decisions",
                effort: "High", 
                status: "high"
              },
              {
                priority: "High",
                timeframe: "1-3 months",
                title: "Compliance Dashboard & Reporting",
                description: "Real-time compliance posture with executive reporting capabilities",
                impact: "Provides visibility for stakeholders and auditors",
                effort: "Medium",
                status: "high"
              }
            ].map((rec, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(rec.status)}>
                        {rec.priority}
                      </Badge>
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {rec.timeframe}
                      </Badge>
                    </div>
                    <Badge variant="secondary">{rec.effort} Effort</Badge>
                  </div>
                  <CardTitle className="text-lg">{rec.title}</CardTitle>
                  <CardDescription>{rec.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">Impact:</span>
                      <span className="text-sm font-medium">{rec.impact}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Immediate Action Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Critical Priority</AlertTitle>
            <AlertDescription>
              Platform currently lacks actual compliance framework integration. Begin implementing 
              ISO 27001 control library immediately to enable genuine compliance documentation generation.
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-2">
            <Button className="bg-red-600 hover:bg-red-700">
              Start Framework Implementation
            </Button>
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
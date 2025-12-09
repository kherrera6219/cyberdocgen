import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Shield,
  Target,
  Lightbulb,
  Zap
} from "lucide-react";
import { useState, useEffect } from "react";

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  framework: string;
  impact: string;
}

interface AIInsightsDashboardProps {
  companyProfile?: {
    industry?: string;
    companySize?: string;
  };
  documentsCount?: number;
  frameworksActive?: number;
  onViewDetails?: () => void;
}

export function AIInsightsDashboard({ 
  companyProfile, 
  documentsCount = 0, 
  frameworksActive = 0,
  onViewDetails 
}: AIInsightsDashboardProps) {
  const [complianceScore, setComplianceScore] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("medium");

  const recommendations: AIRecommendation[] = [
    {
      id: "1",
      title: "Complete Access Control Policy",
      description: "Your organization is missing documented access control procedures for ISO 27001 compliance.",
      priority: "high",
      framework: "ISO 27001",
      impact: "+8% compliance score"
    },
    {
      id: "2",
      title: "Update Incident Response Plan",
      description: "AI detected your incident response plan hasn't been reviewed in 6 months.",
      priority: "medium",
      framework: "SOC 2",
      impact: "+5% compliance score"
    },
    {
      id: "3",
      title: "Add Data Classification Labels",
      description: "Implement data classification labels to improve data protection controls.",
      priority: "medium",
      framework: "NIST",
      impact: "+4% compliance score"
    }
  ];

  useEffect(() => {
    const baseScore = Math.min(documentsCount * 3, 45);
    const frameworkBonus = frameworksActive * 10;
    const industryBonus = companyProfile?.industry ? 10 : 0;
    const targetScore = Math.min(baseScore + frameworkBonus + industryBonus + 20, 100);
    
    setComplianceScore(targetScore);
    
    if (targetScore > 70) setRiskLevel("low");
    else if (targetScore > 40) setRiskLevel("medium");
    else setRiskLevel("high");
  }, [documentsCount, frameworksActive, companyProfile]);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = complianceScore / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= complianceScore) {
        setAnimatedScore(complianceScore);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [complianceScore]);

  const getRiskColor = () => {
    switch (riskLevel) {
      case "low": return "text-green-600 dark:text-green-400";
      case "medium": return "text-yellow-600 dark:text-yellow-400";
      case "high": return "text-red-600 dark:text-red-400";
    }
  };

  const getRiskBgColor = () => {
    switch (riskLevel) {
      case "low": return "bg-green-100 dark:bg-green-900/30";
      case "medium": return "bg-yellow-100 dark:bg-yellow-900/30";
      case "high": return "bg-red-100 dark:bg-red-900/30";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "secondary";
    }
  };

  return (
    <Card className="border-0 bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-gray-900 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-md">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900 dark:text-white">AI Compliance Insights</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">Real-time analysis and recommendations</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Compliance Score</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="relative">
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{animatedScore}</span>
                <span className="text-lg text-gray-500 dark:text-gray-400 mb-1">/ 100</span>
              </div>
              <Progress 
                value={animatedScore} 
                className="mt-3 h-2"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Risk Level</span>
              <Shield className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${getRiskBgColor()}`}>
                <AlertTriangle className={`h-6 w-6 ${getRiskColor()}`} />
              </div>
              <div>
                <span className={`text-2xl font-bold capitalize ${getRiskColor()}`}>
                  {riskLevel}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Overall risk assessment</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Quick Actions</span>
              <Zap className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="space-y-2">
              <Button 
                size="sm" 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                onClick={() => window.location.href = '/ai-doc-generator'}
                data-testid="button-generate-docs"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Documents
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/ai-assistant'}
                data-testid="button-ask-ai"
              >
                <Brain className="h-4 w-4 mr-2" />
                Ask AI Assistant
              </Button>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">AI Recommendations</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={onViewDetails} data-testid="button-view-all">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div 
                key={rec.id} 
                className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 transition-all duration-200"
                data-testid={`recommendation-${rec.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-medium text-gray-900 dark:text-white">{rec.title}</h4>
                      <Badge variant={getPriorityColor(rec.priority) as "destructive" | "secondary" | "outline"} className="text-xs">
                        {rec.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {rec.framework}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{rec.description}</p>
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <Target className="h-3 w-3" />
                      {rec.impact}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" data-testid={`button-fix-${rec.id}`}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Fix
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

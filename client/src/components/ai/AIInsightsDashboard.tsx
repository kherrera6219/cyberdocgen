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
import { useState, useEffect, useId } from "react";

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
  const uniqueId = useId();

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
    const mountedRef = { current: true };
    const duration = 1500;
    const steps = 60;
    const increment = complianceScore / steps;
    let current = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    
    const animate = () => {
      if (!mountedRef.current) return;
      current += increment;
      if (current >= complianceScore) {
        setAnimatedScore(complianceScore);
      } else {
        setAnimatedScore(Math.round(current));
        timerId = setTimeout(animate, duration / steps);
      }
    };
    
    timerId = setTimeout(animate, duration / steps);

    return () => {
      mountedRef.current = false;
      if (timerId) clearTimeout(timerId);
    };
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

  const getRiskDescription = () => {
    switch (riskLevel) {
      case "low": return "Low risk - Your compliance posture is strong";
      case "medium": return "Medium risk - Some improvements recommended";
      case "high": return "High risk - Immediate attention required";
    }
  };

  return (
    <Card 
      className="border-0 bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-gray-900 shadow-lg"
      role="region"
      aria-label="AI Compliance Insights Dashboard"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-md" aria-hidden="true">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900 dark:text-white" id={`${uniqueId}-title`}>
                AI Compliance Insights
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400" id={`${uniqueId}-subtitle`}>
                Real-time analysis and recommendations
              </p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0" aria-label="AI Powered feature">
            <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />
            AI Powered
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="group" aria-label="Compliance metrics overview">
          <section 
            className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700"
            aria-labelledby={`${uniqueId}-compliance-heading`}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 id={`${uniqueId}-compliance-heading`} className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Compliance Score
              </h2>
              <TrendingUp className="h-4 w-4 text-green-500" aria-hidden="true" />
            </div>
            <div className="relative" aria-live="polite" aria-atomic="true">
              <div className="flex items-end gap-1">
                <span 
                  className="text-4xl font-bold text-gray-900 dark:text-white"
                  aria-label={`Compliance score: ${animatedScore} out of 100`}
                >
                  {animatedScore}
                </span>
                <span className="text-lg text-gray-500 dark:text-gray-400 mb-1" aria-hidden="true">/ 100</span>
              </div>
              <Progress 
                value={animatedScore} 
                className="mt-3 h-2"
                aria-label={`Compliance progress: ${animatedScore}%`}
              />
            </div>
          </section>

          <section 
            className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700"
            aria-labelledby={`${uniqueId}-risk-heading`}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 id={`${uniqueId}-risk-heading`} className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Risk Level
              </h2>
              <Shield className="h-4 w-4 text-blue-500" aria-hidden="true" />
            </div>
            <div 
              className="flex items-center gap-3"
              role="status"
              aria-live="polite"
              aria-label={getRiskDescription()}
            >
              <div className={`p-3 rounded-lg ${getRiskBgColor()}`} aria-hidden="true">
                <AlertTriangle className={`h-6 w-6 ${getRiskColor()}`} />
              </div>
              <div>
                <span className={`text-2xl font-bold capitalize ${getRiskColor()}`}>
                  {riskLevel}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Overall risk assessment</p>
              </div>
            </div>
          </section>

          <section 
            className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700"
            aria-labelledby={`${uniqueId}-actions-heading`}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 id={`${uniqueId}-actions-heading`} className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Quick Actions
              </h2>
              <Zap className="h-4 w-4 text-yellow-500" aria-hidden="true" />
            </div>
            <div className="space-y-2" role="group" aria-label="Quick action buttons">
              <Button 
                size="sm" 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                onClick={() => window.location.href = '/ai-doc-generator'}
                data-testid="button-generate-docs"
                aria-label="Generate compliance documents using AI"
              >
                <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
                Generate Documents
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/ai-assistant'}
                data-testid="button-ask-ai"
                aria-label="Open AI Assistant for compliance questions"
              >
                <Brain className="h-4 w-4 mr-2" aria-hidden="true" />
                Ask AI Assistant
              </Button>
            </div>
          </section>
        </div>

        <section aria-labelledby={`${uniqueId}-recommendations-heading`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" aria-hidden="true" />
              <h2 id={`${uniqueId}-recommendations-heading`} className="font-semibold text-gray-900 dark:text-white">
                AI Recommendations
              </h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewDetails} 
              data-testid="button-view-all"
              aria-label="View all AI recommendations"
            >
              View All
              <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </Button>
          </div>

          <div className="space-y-3" role="list" aria-label="Compliance recommendations">
            {recommendations.map((rec) => {
              const descriptionId = `${uniqueId}-rec-desc-${rec.id}`;
              const impactId = `${uniqueId}-rec-impact-${rec.id}`;
              
              return (
                <article 
                  key={rec.id} 
                  className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 transition-all duration-200"
                  data-testid={`recommendation-${rec.id}`}
                  role="listitem"
                  aria-labelledby={`${uniqueId}-rec-title-${rec.id}`}
                  aria-describedby={`${descriptionId} ${impactId}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 
                          id={`${uniqueId}-rec-title-${rec.id}`}
                          className="font-medium text-gray-900 dark:text-white"
                        >
                          {rec.title}
                        </h3>
                        <Badge 
                          variant={getPriorityColor(rec.priority) as "destructive" | "secondary" | "outline"} 
                          className="text-xs"
                          aria-label={`Priority: ${rec.priority}`}
                        >
                          {rec.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs" aria-label={`Framework: ${rec.framework}`}>
                          {rec.framework}
                        </Badge>
                      </div>
                      <p id={descriptionId} className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {rec.description}
                      </p>
                      <div id={impactId} className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <Target className="h-3 w-3" aria-hidden="true" />
                        <span aria-label={`Expected impact: ${rec.impact}`}>{rec.impact}</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      data-testid={`button-fix-${rec.id}`}
                      aria-label={`Fix issue: ${rec.title}`}
                      aria-describedby={descriptionId}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" aria-hidden="true" />
                      Fix
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

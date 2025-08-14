import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, Lightbulb, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface QualityAnalyzerProps {
  content: string;
  framework: string;
  onAnalysisComplete?: (analysis: QualityAnalysis) => void;
}

interface QualityAnalysis {
  score: number;
  feedback: string;
  suggestions: string[];
}

export function QualityAnalyzer({ content, framework, onAnalysisComplete }: QualityAnalyzerProps) {
  const [analysis, setAnalysis] = useState<QualityAnalysis | null>(null);

  const analyzeQuality = useMutation({
    mutationFn: async (): Promise<QualityAnalysis> => {
      const response = await apiRequest("POST", "/api/ai/analyze-quality", { content, framework });
      return await response.json();
    },
    onSuccess: (data: QualityAnalysis) => {
      setAnalysis(data);
      onAnalysisComplete?.(data);
    },
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Good";
    if (score >= 70) return "Fair";
    if (score >= 60) return "Needs Improvement";
    return "Poor";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Document Quality Analysis
        </CardTitle>
        <CardDescription>
          AI-powered assessment of your {framework} document quality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis ? (
          <div className="text-center py-6">
            <Button
              onClick={() => analyzeQuality.mutate()}
              disabled={analyzeQuality.isPending || !content.trim()}
              className="min-w-32"
            >
              {analyzeQuality.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Analyze Quality
                </>
              )}
            </Button>
            {!content.trim() && (
              <p className="text-sm text-muted-foreground mt-2">
                Document content required for analysis
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quality Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quality Score</span>
                <Badge variant="outline" className={getScoreColor(analysis.score)}>
                  {analysis.score}/100 - {getScoreLabel(analysis.score)}
                </Badge>
              </div>
              <Progress value={analysis.score} className="h-2" />
            </div>

            <Separator />

            {/* Detailed Feedback */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Analysis Feedback
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.feedback}
              </p>
            </div>

            {/* Improvement Suggestions */}
            {analysis.suggestions.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Improvement Suggestions
                  </h4>
                  <ul className="space-y-1">
                    {analysis.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Re-analyze Button */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => analyzeQuality.mutate()}
                disabled={analyzeQuality.isPending}
              >
                {analyzeQuality.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Re-analyzing...
                  </>
                ) : (
                  "Re-analyze"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
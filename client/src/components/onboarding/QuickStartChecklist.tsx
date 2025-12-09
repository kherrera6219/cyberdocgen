import { useState, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, ArrowRight, Building, FileText, Zap } from "lucide-react";
import type { CompanyProfile, Document } from "@shared/schema";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  actionText: string;
  actionUrl: string;
  completed: boolean;
}

interface QuickStartChecklistProps {
  className?: string;
}

export function QuickStartChecklist({ className }: QuickStartChecklistProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Fetch data to determine completion status
  const { data: profiles = [] } = useQuery<CompanyProfile[]>({
    queryKey: ["/api/company-profiles"],
  });

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const profile = profiles[0];
  const hasDocuments = documents.length > 0;
  const hasCompletedDocuments = documents.some(doc => doc.status === 'complete');

  const checklistItems: ChecklistItem[] = [
    {
      id: "profile",
      title: "Complete Your Company Profile",
      description: "Set up your organization details and technical environment",
      icon: <Building className="h-5 w-5" />,
      actionText: "Set Up Profile",
      actionUrl: "/enhanced-profile",
      completed: !!profile && !!profile.companyName && !!profile.industry
    },
    {
      id: "generate",
      title: "Generate Your First Documents",
      description: "Use AI to create compliance documentation for your framework",
      icon: <Zap className="h-5 w-5" />,
      actionText: "Start Generating",
      actionUrl: "/dashboard",
      completed: hasDocuments
    },
    {
      id: "review",
      title: "Review and Approve Documents",
      description: "Review generated documents and mark them as complete",
      icon: <FileText className="h-5 w-5" />,
      actionText: "Review Documents",
      actionUrl: "/workspace",
      completed: hasCompletedDocuments
    }
  ];

  const completedCount = checklistItems.filter(item => item.completed).length;
  const progress = (completedCount / checklistItems.length) * 100;
  const isFullyCompleted = completedCount === checklistItems.length;

  // Auto-hide when fully completed
  useEffect(() => {
    if (isFullyCompleted) {
      const timer = setTimeout(() => setIsVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isFullyCompleted]);

  if (!isVisible || isFullyCompleted) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Quick Start Checklist</CardTitle>
            <CardDescription>
              Complete these steps to get the most out of ComplianceAI
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsVisible(false)}
          >
            Dismiss
          </Button>
        </div>
        <Progress value={progress} className="mt-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {completedCount} of {checklistItems.length} completed
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {checklistItems.map((item) => (
          <div
            key={item.id}
            className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
              item.completed 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                item.completed 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {item.icon}
              </div>
              <div>
                <h4 className={`font-medium ${
                  item.completed 
                    ? 'text-green-900 dark:text-green-100' 
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {item.title}
                </h4>
                <p className={`text-sm ${
                  item.completed 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {item.description}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {item.completed ? (
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.location.href = item.actionUrl}
                    className="flex items-center space-x-1"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                  <Circle className="h-6 w-6 text-gray-400" />
                </>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
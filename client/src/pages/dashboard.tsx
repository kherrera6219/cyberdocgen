import { useState, useEffect, useRef, lazy, Suspense, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DashboardSkeleton } from "@/components/loading/loading-skeleton";
import { DocumentPreview } from "@/components/templates/document-preview";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorCard } from "@/components/ui/loading-error-states";
import { useOrganization } from "@/contexts/OrganizationContext";
import { logger } from '../utils/logger';
import { Layers } from "lucide-react";
import type { Document, DocumentApproval, GenerationJob } from "@shared/schema";

// Sub-components
import { QuickStats } from "@/components/dashboard/QuickStats";
import { CompanyProfileSummary } from "@/components/dashboard/CompanyProfileSummary";
import { FrameworkGenerationCards } from "@/components/dashboard/FrameworkGenerationCards";
import { RecentDocuments } from "@/components/dashboard/RecentDocuments";
import { GenerationProgressDialog } from "@/components/dashboard/GenerationProgressDialog";
import { ActivityFeed } from "@/components/activity/ActivityFeed";

const AIInsightsDashboard = lazy(() => import("@/components/ai/AIInsightsDashboard").then(m => ({ default: m.AIInsightsDashboard })));
const RiskHeatmap = lazy(() => import("@/components/ai/RiskHeatmap").then(m => ({ default: m.RiskHeatmap })));
const ControlPrioritizer = lazy(() => import("@/components/ai/ControlPrioritizer").then(m => ({ default: m.ControlPrioritizer })));

const GENERATION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes timeout

export default function Dashboard() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentFramework, setCurrentFramework] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewFramework, setPreviewFramework] = useState("");
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState("");

  // Ref for tracking component mount state and polling cleanup
  const isMountedRef = useRef(true);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const generationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
        generationTimeoutRef.current = null;
      }
    };
  }, []);

  // Get company profile from shared context
  const { 
    profile, 
    isLoading: profilesLoading,
    isError: profilesError,
    refetch: refetchProfiles
  } = useOrganization();

  // Get documents
  const { 
    data: documents = [], 
    isLoading: documentsLoading,
    isError: documentsError,
    refetch: refetchDocuments
  } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });


  const { data: approvals = [] } = useQuery<DocumentApproval[]>({
    queryKey: ["/api/approvals?status=pending"],
  });

  // Calculate stats with guards for undefined data
  const completedDocs = documents?.filter(doc => doc.status === 'complete').length ?? 0;
  const activeFrameworks = documents?.length > 0 
    ? Array.from(new Set(documents.map(doc => doc.framework))).length 
    : 0;

  // Framework stats with guards
  const iso27001Docs = documents?.filter(doc => doc.framework === 'ISO27001' && doc.status === 'complete').length ?? 0;
  const soc2Docs = documents?.filter(doc => doc.framework === 'SOC2' && doc.status === 'complete').length ?? 0;

  const iso27001Progress = Math.round((iso27001Docs / 14) * 100);
  const soc2Progress = Math.round((soc2Docs / 12) * 100);

  const recentDocuments = documents
    ?.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3) ?? [];

  const nextApprovalDeadline = useMemo(() => {
    const pendingDeadlines = approvals
      .filter((approval) => approval.status === "pending" && approval.dueDate)
      .map((approval) => new Date(approval.dueDate as Date | string))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    return pendingDeadlines[0] ?? null;
  }, [approvals]);

  // Cleanup function for generation
  const cleanupGeneration = () => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    if (generationTimeoutRef.current) {
      clearTimeout(generationTimeoutRef.current);
      generationTimeoutRef.current = null;
    }
    setIsGenerating(false);
    setGenerationProgress(0);
    setCurrentFramework("");
  };

  // Document generation mutation - must be called before any conditional returns
  const generateDocsMutation = useMutation({
    mutationFn: async ({ framework }: { framework: string }) => {
      if (!profile) throw new Error("No company profile found");

      return await apiRequest("/api/generate-documents", {
        method: "POST",
        body: {
          companyProfileId: profile.id,
          framework,
        }
      });
    },
    onSuccess: (data) => {
      const jobId = data.jobId;

      // Set generation timeout
      generationTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        cleanupGeneration();
        toast({
          title: "Generation Timeout",
          description: "Document generation took too long. Please try again.",
          variant: "destructive",
        });
      }, GENERATION_TIMEOUT_MS);

      // Poll for job status
      const pollJob = async () => {
        if (!isMountedRef.current) return;

        try {
          const jobResponse = await fetch(`/api/generation-jobs/${jobId}`);
          
          if (!jobResponse.ok) {
            throw new Error(`Failed to fetch job status: ${jobResponse.status}`);
          }

          const job: GenerationJob = await jobResponse.json();

          if (!isMountedRef.current) return;

          setGenerationProgress(job.progress);

          if (job.status === 'completed') {
            cleanupGeneration();
            queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
            toast({
              title: "Documents Generated",
              description: "All compliance documents have been generated successfully.",
            });
          } else if (job.status === 'failed') {
            cleanupGeneration();
            toast({
              title: "Generation Failed",
              description: "There was an error generating documents. Please try again.",
              variant: "destructive",
            });
          } else {
            pollingTimeoutRef.current = setTimeout(pollJob, 2000);
          }
        } catch (error) {
          logger.error("Error polling job:", error);
          if (!isMountedRef.current) return;
          cleanupGeneration();
          toast({
            title: "Polling Error",
            description: "Failed to check generation status. The generation may still be in progress.",
            variant: "destructive",
          });
        }
      };

      pollingTimeoutRef.current = setTimeout(pollJob, 1000);
    },
    onError: (error) => {
      cleanupGeneration();
      toast({
        title: "Generation Failed",
        description: "Failed to start document generation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Show loading skeleton if data is loading
  if (profilesLoading || documentsLoading) {
    return <DashboardSkeleton />;
  }

  // Show error state if queries failed
  if (profilesError || documentsError) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center shadow-md">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Compliance Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">Automate your compliance documentation with AI-powered generation</p>
            </div>
          </div>
        </div>
        <ErrorCard
          title="Failed to load dashboard data"
          message="We couldn't load your company profiles or documents. Please check your connection and try again."
          onRetry={() => {
            refetchProfiles();
            refetchDocuments();
          }}
        />
      </div>
    );
  }

  const handleGenerateDocuments = (framework: string) => {
    if (!profile) {
      toast({
        title: "Profile Required",
        description: "Please create a company profile first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setCurrentFramework(framework);
    generateDocsMutation.mutate({ framework });
  };

  const handleStartGeneration = (framework: string) => {
    handleGenerateDocuments(framework);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center shadow-md">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Compliance Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">Automate your compliance documentation with AI-powered generation</p>
          </div>
        </div>
      </div>

      <QuickStats 
        documents={documents}
        completedDocs={completedDocs}
        activeFrameworks={activeFrameworks}
        nextApprovalDeadline={nextApprovalDeadline}
      />

      {/* AI Insights Dashboard wrapped with ErrorBoundary and Suspense for code-splitting */}
      <ErrorBoundary
        fallback={
          <ErrorCard
            title="AI Insights Unavailable"
            message="The AI insights component encountered an error. Please try refreshing the page."
          />
        }
      >
        <Suspense fallback={
          <Card className="border-0 bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-gray-900 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        }>
          <AIInsightsDashboard 
            companyProfile={profile ? { industry: profile.industry, companySize: profile.companySize } : undefined}
            documentsCount={completedDocs}
            frameworksActive={activeFrameworks}
            onViewDetails={() => window.location.href = '/gap-analysis'}
          />
        </Suspense>
      </ErrorBoundary>

      {/* Risk Heatmap and Control Prioritizer wrapped with ErrorBoundary and Suspense for code-splitting */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <ErrorBoundary
          fallback={
            <ErrorCard
              title="Risk Heatmap Unavailable"
              message="The risk heatmap component encountered an error."
            />
          }
        >
          <Suspense fallback={
            <Card className="border-0 bg-white dark:bg-gray-800 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              </CardContent>
            </Card>
          }>
            <RiskHeatmap />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary
          fallback={
            <ErrorCard
              title="Control Prioritizer Unavailable"
              message="The control prioritizer component encountered an error."
            />
          }
        >
          <Suspense fallback={
            <Card className="border-0 bg-white dark:bg-gray-800 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-52" />
                  </div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              </CardContent>
            </Card>
          }>
            <ControlPrioritizer onImplementControl={(controlId) => {
              toast({
                title: "Control Implementation Started",
                description: `Starting implementation for control ${controlId}. This feature will guide you through the process.`,
              });
            }} />
          </Suspense>
        </ErrorBoundary>
      </div>

      <CompanyProfileSummary 
        profile={profile}
        onEdit={() => {}} // No edit action defined in original except maybe navigation? Original button had no onClick.
      />

      <FrameworkGenerationCards 
        profile={profile}
        iso27001Progress={iso27001Progress}
        soc2Progress={soc2Progress}
        isGenerating={isGenerating}
        onGenerate={handleGenerateDocuments}
        onPreview={(framework) => {
          setPreviewFramework(framework);
          setShowPreview(true);
        }}
      />

      {/* Recent Documents and Activity Feed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentDocuments documents={recentDocuments} />
        <ActivityFeed limit={8} compact={true} />
      </div>

      <GenerationProgressDialog 
        isOpen={isGenerating}
        onOpenChange={(open) => {
          if (!open) cleanupGeneration();
        }}
        currentFramework={currentFramework}
        progress={generationProgress}
        onCancel={cleanupGeneration}
      />

      {/* Document Templates Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Document Templates - {previewFramework}</DialogTitle>
            <DialogDescription>
              Preview available document templates for {previewFramework} compliance framework
            </DialogDescription>
          </DialogHeader>
          {showPreview && (
            <DocumentPreview
              templates={[]}
              framework={previewFramework}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Generation Customizer Dialog */}
      {showCustomizer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Customize Generation</h3>
            <p className="text-gray-600 mb-4">
              Customize AI document generation for {selectedFramework} framework.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setShowCustomizer(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={() => {
                setShowCustomizer(false);
                handleStartGeneration(selectedFramework);
              }}>
                Generate Documents
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

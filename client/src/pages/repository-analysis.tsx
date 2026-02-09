/**
 * Repository Analysis Page
 * Main integration page combining all repository analysis components
 */

import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { ArrowLeft, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RepoUploadZone } from '@/components/repository/RepoUploadZone';
import { RepositoryList } from '@/components/repository/RepositoryList';
import { AnalysisProgress } from '@/components/repository/AnalysisProgress';
import { FindingsTable } from '@/components/repository/FindingsTable';
import { TaskBoard } from '@/components/repository/TaskBoard';
import {
  useRepositories,
  useRepository,
  useUploadRepository,
  useStartAnalysis,
  useAnalysisStatus,
  useFindings,
  useTasks,
  useUpdateTask,
  useDeleteRepository,
} from '@/hooks/useRepositoryAPI';
import { useToast } from '@/hooks/use-toast';

export function RepositoryAnalysisPage() {
  const { snapshotId } = useParams<{ snapshotId?: string }>();
  const [, setLocation] = useLocation();
  const navigate = (to: string) => setLocation(to);
  const { toast } = useToast();

  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(['SOC2']);
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);

  // API Hooks
  const { data: repositories, isLoading: loadingRepos } = useRepositories();
  const { data: currentRepo } = useRepository(snapshotId || '');
  const { data: analysisStatus } = useAnalysisStatus(snapshotId || '');
  const { data: findingsData } = useFindings(snapshotId || '');
  const { data: tasks } = useTasks(snapshotId || '');

  const uploadMutation = useUploadRepository();
  const startAnalysisMutation = useStartAnalysis();
  const updateTaskMutation = useUpdateTask();
  const deleteMutation = useDeleteRepository();

  // Get org ID from current user/session (hardcoded for demo)
  const organizationId = 'org-123';
  const companyProfileId = 'profile-456';

  const handleUpload = async (
    file: File,
    metadata: { organizationId: string; companyProfileId: string; name: string }
  ) => {
    try {
      const result = await uploadMutation.mutateAsync({
        file,
        ...metadata,
      });

      toast({
        title: 'Upload Successful',
        description: 'Repository has been uploaded and is being indexed',
      });

      navigate(`/repository/${result.snapshotId}`);
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleStartAnalysis = async () => {
    if (!snapshotId) return;

    try {
      await startAnalysisMutation.mutateAsync({
        snapshotId,
        frameworks: selectedFrameworks,
        depth: 'security_relevant',
      });

      toast({
        title: 'Analysis Started',
        description: 'Repository analysis is now running',
      });

      setAnalysisDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Analysis Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRepo = async (repoId: string) => {
    if (!confirm('Are you sure you want to delete this repository?')) return;

    try {
      await deleteMutation.mutateAsync(repoId);

      toast({
        title: 'Repository Deleted',
        description: 'The repository has been deleted',
      });

      if (snapshotId === repoId) {
        navigate('/repository');
      }
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    if (!snapshotId) return;

    try {
      await updateTaskMutation.mutateAsync({
        snapshotId,
        taskId,
        status: newStatus,
      });

      toast({
        title: 'Task Updated',
        description: 'Task status has been updated',
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Convert analysis status to phase format
  const phases = [
    { name: 'Repository Overview', description: 'Extract system description', status: 'pending' as const },
    { name: 'Build & CI/CD', description: 'Analyze deployment pipeline', status: 'pending' as const },
    { name: 'Configuration & Secrets', description: 'Review config management', status: 'pending' as const },
    { name: 'Authentication & Authorization', description: 'Analyze access controls', status: 'pending' as const },
    { name: 'Data Handling', description: 'Review data protection', status: 'pending' as const },
    { name: 'Operational Controls', description: 'Check logging and monitoring', status: 'pending' as const },
    { name: 'Gap Identification', description: 'Identify missing controls', status: 'pending' as const },
  ];

  if (!snapshotId) {
    // List view
    return (
      <div className="container max-w-7xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Repository Analysis</h1>
            <p className="text-muted-foreground mt-1">
              Upload and analyze source code repositories for compliance
            </p>
          </div>
        </div>

        <RepoUploadZone
          onUpload={handleUpload}
          organizationId={organizationId}
          companyProfileId={companyProfileId}
        />

        {loadingRepos ? (
          <div className="text-center py-12">Loading repositories...</div>
        ) : (
          <RepositoryList
            repositories={repositories || []}
            onSelect={(repo) => navigate(`/repository/${repo.id}`)}
            onDelete={handleDeleteRepo}
            onAnalyze={(id) => {
              navigate(`/repository/${id}`);
            }}
          />
        )}
      </div>
    );
  }

  // Detail view
  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/repository')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{currentRepo?.name}</h1>
            <p className="text-muted-foreground mt-1">{currentRepo?.uploadedFileName}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          {currentRepo?.status === 'indexed' && (
            <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Start Analysis
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configure Analysis</DialogTitle>
                  <DialogDescription>
                    Select compliance frameworks to analyze against
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Frameworks</Label>
                    {['SOC2', 'ISO27001', 'NIST80053', 'FedRAMP'].map((fw) => (
                      <div key={fw} className="flex items-center space-x-2">
                        <Checkbox
                          id={fw}
                          checked={selectedFrameworks.includes(fw)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedFrameworks([...selectedFrameworks, fw]);
                            } else {
                              setSelectedFrameworks(selectedFrameworks.filter((f) => f !== fw));
                            }
                          }}
                        />
                        <label htmlFor={fw}>{fw}</label>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleStartAnalysis}
                    disabled={selectedFrameworks.length === 0 || startAnalysisMutation.isPending}
                    className="w-full"
                  >
                    {startAnalysisMutation.isPending ? 'Starting...' : 'Start Analysis'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Analysis Progress */}
      {analysisStatus?.analysisRun && (
        <AnalysisProgress
          phases={phases}
          currentPhase={analysisStatus.analysisRun.phase}
          progress={analysisStatus.analysisRun.progress}
          metrics={{
            filesAnalyzed: analysisStatus.analysisRun.filesAnalyzed,
            findingsGenerated: analysisStatus.analysisRun.findingsGenerated,
            llmCallsMade: analysisStatus.analysisRun.llmCallsMade,
            tokensUsed: analysisStatus.analysisRun.tokensUsed,
          }}
        />
      )}

      {/* Tabs */}
      <Tabs defaultValue="findings" className="w-full">
        <TabsList>
          <TabsTrigger value="findings">
            Findings {findingsData?.total ? `(${findingsData.total})` : ''}
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks {tasks?.length ? `(${tasks.length})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="findings" className="mt-6">
          {findingsData?.findings ? (
            <FindingsTable
              findings={findingsData.findings}
              onReviewFinding={(id) => console.log('Review:', id)}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No findings yet. Start an analysis to generate findings.
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          {tasks ? (
            <TaskBoard
              tasks={tasks}
              onTaskClick={(task) => console.log('Task:', task)}
              onTaskStatusChange={handleTaskStatusChange}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No tasks yet. Tasks are automatically generated from findings.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

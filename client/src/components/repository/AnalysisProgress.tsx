/**
 * Analysis Progress Component
 * Shows real-time progress of repository analysis with phase tracking
 */

import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface AnalysisPhase {
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface AnalysisProgressProps {
  phases: AnalysisPhase[];
  currentPhase: string;
  progress: number;
  metrics?: {
    filesAnalyzed?: number;
    findingsGenerated?: number;
    llmCallsMade?: number;
    tokensUsed?: number;
  };
  className?: string;
}

export function AnalysisProgress({
  phases,
  currentPhase,
  progress,
  metrics,
  className,
}: AnalysisProgressProps) {
  const getPhaseIcon = (phase: AnalysisPhase) => {
    switch (phase.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Complete</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Running</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Analysis Progress</CardTitle>
            <CardDescription>Repository security analysis in progress</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{progress}%</div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Phase {phases.findIndex((p) => p.status === 'running') + 1} of {phases.length}</span>
            <span>{currentPhase}</span>
          </div>
        </div>

        {/* Phase List */}
        <div className="space-y-3">
          {phases.map((phase, index) => (
            <div
              key={phase.name}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg transition-colors',
                phase.status === 'running' && 'bg-primary/5 border border-primary/20',
                phase.status === 'completed' && 'bg-green-50 border border-green-200',
                phase.status === 'failed' && 'bg-red-50 border border-red-200'
              )}
            >
              <div className="mt-0.5">{getPhaseIcon(phase)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-medium">
                    {index + 1}. {phase.name}
                  </h4>
                  {getStatusBadge(phase.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{phase.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            {metrics.filesAnalyzed !== undefined && (
              <div className="space-y-1">
                <div className="text-2xl font-bold">{metrics.filesAnalyzed.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Files Analyzed</div>
              </div>
            )}
            {metrics.findingsGenerated !== undefined && (
              <div className="space-y-1">
                <div className="text-2xl font-bold">{metrics.findingsGenerated}</div>
                <div className="text-xs text-muted-foreground">Findings Generated</div>
              </div>
            )}
            {metrics.llmCallsMade !== undefined && (
              <div className="space-y-1">
                <div className="text-2xl font-bold">{metrics.llmCallsMade}</div>
                <div className="text-xs text-muted-foreground">LLM Calls</div>
              </div>
            )}
            {metrics.tokensUsed !== undefined && (
              <div className="space-y-1">
                <div className="text-2xl font-bold">{(metrics.tokensUsed / 1000).toFixed(1)}K</div>
                <div className="text-xs text-muted-foreground">Tokens Used</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Repository List Component
 * Displays all repository snapshots with status and actions
 */

import { FileArchive, Clock, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'analyzing':
      return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
    case 'failed':
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    case 'extracting':
      return <Loader2 className="h-5 w-5 text-gray-600 animate-spin" />;
    default:
      return <Clock className="h-5 w-5 text-gray-600" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    case 'analyzing':
      return <Badge className="bg-blue-100 text-blue-800">Analyzing</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    case 'extracting':
      return <Badge variant="secondary">Extracting</Badge>;
    default:
      return <Badge variant="outline">Indexed</Badge>;
  }
};

const formatSize = (bytes: number) => {
  const mb = bytes / (1024 * 1024);
  return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    'day'
  );
};

export interface RepositorySnapshot {
  id: string;
  name: string;
  status: 'extracting' | 'indexed' | 'analyzing' | 'completed' | 'failed';
  uploadedFileName: string;
  fileCount: number;
  repositorySize: number;
  detectedLanguages: string[];
  detectedFrameworks: string[];
  analysisPhase?: string;
  createdAt: string;
}

export interface RepositoryListProps {
  repositories: RepositorySnapshot[];
  onSelect?: (repo: RepositorySnapshot) => void;
  onDelete?: (repoId: string) => void;
  onAnalyze?: (repoId: string) => void;
  className?: string;
}

export function RepositoryList({
  repositories,
  onSelect,
  onDelete,
  onAnalyze,
  className,
}: RepositoryListProps) {
  if (repositories.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <FileArchive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Repositories</h3>
          <p className="text-sm text-muted-foreground">
            Upload a repository to get started with analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {repositories.map((repo) => (
        <Card
          key={repo.id}
          className={cn(
            'cursor-pointer transition-all hover:shadow-md',
            onSelect && 'hover:border-primary'
          )}
          onClick={() => onSelect?.(repo)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              {/* Main Info */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="mt-1">{getStatusIcon(repo.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{repo.name}</h3>
                    {getStatusBadge(repo.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {repo.uploadedFileName}
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>📁 {repo.fileCount.toLocaleString()} files</span>
                    <span>•</span>
                    <span>💾 {formatSize(repo.repositorySize)}</span>
                    {repo.detectedLanguages.length > 0 && (
                      <>
                        <span>•</span>
                        <span>🔤 {repo.detectedLanguages.slice(0, 3).join(', ')}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>🕒 {formatDate(repo.createdAt)}</span>
                  </div>

                  {/* Frameworks */}
                  {repo.detectedFrameworks.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {repo.detectedFrameworks.slice(0, 5).map((framework) => (
                        <Badge key={framework} variant="outline" className="text-xs">
                          {framework}
                        </Badge>
                      ))}
                      {repo.detectedFrameworks.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{repo.detectedFrameworks.length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Analysis Phase */}
                  {repo.status === 'analyzing' && repo.analysisPhase && (
                    <div className="mt-2 text-xs text-blue-600">
                      Phase: {repo.analysisPhase}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {repo.status === 'indexed' && onAnalyze && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnalyze(repo.id);
                    }}
                  >
                    Analyze
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(repo.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * API Hooks for Repository Analysis
 * React Query hooks for fetching and mutating repository data
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE = '/api/repository';

// Types
export interface RepositorySnapshot {
  id: string;
  name: string;
  status: 'extracting' | 'indexed' | 'analyzing' | 'completed' | 'failed';
  uploadedFileName: string;
  fileCount: number;
  repositorySize: number;
  detectedLanguages: string[];
  detectedFrameworks: string[];
  detectedInfraTools: string[];
  analysisPhase?: string;
  createdAt: string;
}

export interface AnalysisRun {
  id: string;
  snapshotId: string;
  frameworks: string[];
  analysisDepth: string;
  phase: string;
  phaseStatus: string;
  progress: number;
  filesAnalyzed: number;
  findingsGenerated: number;
  llmCallsMade: number;
  tokensUsed: number;
  createdAt: string;
}

export interface Finding {
  id: string;
  controlId: string;
  framework: string;
  status: 'pass' | 'partial' | 'fail' | 'not_observed' | 'needs_human';
  confidenceLevel: 'high' | 'medium' | 'low';
  summary: string;
  signalType: string;
  evidenceReferences: Array<{
    filePath: string;
    lineStart?: number;
    lineEnd?: number;
    snippet?: string;
  }>;
  recommendation: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'code_change' | 'missing_evidence' | 'policy_needed' | 'procedure_needed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'completed' | 'dismissed';
  findingId?: string;
  createdAt: string;
}

// Fetch all repositories
export function useRepositories() {
  return useQuery({
    queryKey: ['repositories'],
    queryFn: async () => {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error('Failed to fetch repositories');
      const data = await res.json();
      return data.data.snapshots as RepositorySnapshot[];
    },
  });
}

// Fetch single repository
export function useRepository(id: string) {
  return useQuery({
    queryKey: ['repository', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error('Failed to fetch repository');
      const data = await res.json();
      return data.data.snapshot as RepositorySnapshot;
    },
    enabled: !!id,
  });
}

// Upload repository
export function useUploadRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      organizationId,
      companyProfileId,
      name,
    }: {
      file: File;
      organizationId: string;
      companyProfileId: string;
      name: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organizationId', organizationId);
      formData.append('companyProfileId', companyProfileId);
      formData.append('name', name);

      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Upload failed');
      }

      const data = await res.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
    },
  });
}

// Start analysis
export function useStartAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      snapshotId,
      frameworks,
      depth = 'security_relevant',
    }: {
      snapshotId: string;
      frameworks: string[];
      depth?: string;
    }) => {
      const res = await fetch(`${API_BASE}/${snapshotId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frameworks, depth }),
      });

      if (!res.ok) throw new Error('Failed to start analysis');
      const data = await res.json();
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['repository', variables.snapshotId] });
      queryClient.invalidateQueries({ queryKey: ['analysis', variables.snapshotId] });
    },
  });
}

// Get analysis status
export function useAnalysisStatus(snapshotId: string) {
  return useQuery({
    queryKey: ['analysis', snapshotId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/${snapshotId}/analysis`);
      if (!res.ok) throw new Error('Failed to fetch analysis status');
      const data = await res.json();
      return data.data as { analysisRun: AnalysisRun | null; snapshot: Partial<RepositorySnapshot> };
    },
    enabled: !!snapshotId,
    refetchInterval: (query) => {
      // Poll every 3 seconds if analysis is running
      const data = query.state.data as { analysisRun: AnalysisRun | null; snapshot: Partial<RepositorySnapshot> } | undefined;
      const isRunning = data?.analysisRun?.phaseStatus === 'running';
      return isRunning ? 3000 : false;
    },
  });
}

// Get findings
export function useFindings(snapshotId: string, filters?: {
  framework?: string;
  status?: string;
  confidenceLevel?: string;
  page?: number;
  limit?: number;
}) {
  const queryString = filters ? new URLSearchParams(filters as any).toString() : '';

  return useQuery({
    queryKey: ['findings', snapshotId, filters],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/${snapshotId}/findings?${queryString}`);
      if (!res.ok) throw new Error('Failed to fetch findings');
      const data = await res.json();
      return data.data as {
        findings: Finding[];
        total: number;
        summary: any;
      };
    },
    enabled: !!snapshotId,
  });
}

// Review finding
export function useReviewFinding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      snapshotId,
      findingId,
      status,
      humanOverride,
    }: {
      snapshotId: string;
      findingId: string;
      status?: string;
      humanOverride?: any;
    }) => {
      const res = await fetch(`${API_BASE}/${snapshotId}/findings/${findingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, humanOverride }),
      });

      if (!res.ok) throw new Error('Failed to review finding');
      const data = await res.json();
      return data.data.finding;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['findings', variables.snapshotId] });
    },
  });
}

// Get tasks
export function useTasks(snapshotId: string) {
  return useQuery({
    queryKey: ['tasks', snapshotId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/${snapshotId}/tasks`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      return data.data.tasks as Task[];
    },
    enabled: !!snapshotId,
  });
}

// Update task
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      snapshotId,
      taskId,
      status,
    }: {
      snapshotId: string;
      taskId: string;
      status: string;
    }) => {
      const res = await fetch(`${API_BASE}/${snapshotId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Failed to update task');
      const data = await res.json();
      return data.data.task;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.snapshotId] });
    },
  });
}

// Delete repository
export function useDeleteRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (snapshotId: string) => {
      const res = await fetch(`${API_BASE}/${snapshotId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete repository');
      return snapshotId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
    },
  });
}

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  Brain,
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Trash2,
  RefreshCw,
  Sparkles,
  Target,
  BarChart3,
  FileQuestion,
  CloudUpload,
  AlertTriangle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SolverJob {
  id: string;
  organizationId: string;
  fileName: string;
  status: "pending" | "processing" | "completed" | "failed";
  totalQuestionsCount: number;
  completedQuestionsCount: number;
  averageConfidenceScore?: string | null;
  questionsData?: QuestionResult[];
  createdAt: string;
  updatedAt: string;
}

interface QuestionResult {
  question: string;
  response: string;
  confidence: number;
  citation: string;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SolverJob["status"] }) {
  const cfg = {
    pending: { color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: Clock, label: "Pending" },
    processing: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Loader2, label: "Processing", spin: true },
    completed: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2, label: "Completed" },
    failed: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle, label: "Failed" },
  }[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <Icon className={`w-3.5 h-3.5 ${"spin" in cfg && cfg.spin ? "animate-spin" : ""}`} />
      {cfg.label}
    </span>
  );
}

// ─── Confidence Pill ──────────────────────────────────────────────────────────

function ConfidencePill({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";
  return <span className={`font-bold text-sm ${color}`}>{score}%</span>;
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

function DropZone({ onFile }: { onFile: (f: File) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      id="questionnaire-drop-zone"
      className={`relative flex flex-col items-center justify-center gap-4 p-12 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
        dragging
          ? "border-indigo-400 bg-indigo-500/10 scale-[1.01]"
          : "border-white/20 bg-white/3 hover:border-indigo-500/40 hover:bg-white/5"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-xl">
        <CloudUpload className="w-8 h-8 text-white" />
      </div>

      <div className="text-center">
        <p className="text-white font-bold text-lg">Drop your questionnaire file here</p>
        <p className="text-slate-400 text-sm mt-1">
          Supports CSV, XLSX, XLS — up to 20 MB
        </p>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <FileSpreadsheet className="w-4 h-4 text-slate-500" />
        <span className="text-xs text-slate-500">CSV</span>
        <span className="text-xs text-slate-700">•</span>
        <FileSpreadsheet className="w-4 h-4 text-slate-500" />
        <span className="text-xs text-slate-500">XLSX</span>
        <span className="text-xs text-slate-700">•</span>
        <FileSpreadsheet className="w-4 h-4 text-slate-500" />
        <span className="text-xs text-slate-500">XLS</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuestionnaireSolverPage() {
  const { profile } = useOrganization();
  const organizationId = profile?.organizationId;
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const { data: jobs = [], isLoading, refetch } = useQuery<SolverJob[]>({
    queryKey: ["questionnaire-solver", organizationId],
    queryFn: () => apiRequest("/api/questionnaire-solver").then((r) => r.data ?? r),
    enabled: !!organizationId,
    refetchInterval: (query) => {
      // Auto-refresh while any job is actively processing
      const jobs = query.state.data as SolverJob[] | undefined;
      const hasActive = jobs?.some((j) =>
        j.status === "pending" || j.status === "processing"
      );
      return hasActive ? 3000 : false;
    },
  });

  // ─── Upload Mutation ────────────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/questionnaire-solver/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || "Upload failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["questionnaire-solver"] });
      toast({
        title: "Questionnaire uploaded",
        description: `AI solver started — Job ID: ${data.jobId?.slice(0, 8)}...`,
      });
    },
    onError: (err: Error) =>
      toast({ title: "Upload failed", description: err.message, variant: "destructive" }),
  });

  // ─── Delete Mutation ────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/questionnaire-solver/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionnaire-solver"] });
      setDeleteId(null);
      toast({ title: "Job deleted" });
    },
    onError: () =>
      toast({ title: "Error", description: "Failed to delete solver job.", variant: "destructive" }),
  });

  // ─── Download Handler ───────────────────────────────────────────────────────
  const handleDownload = (jobId: string) => {
    window.open(`/api/questionnaire-solver/${jobId}/download`, "_blank");
  };

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const avgConfidence = completedJobs.length > 0
    ? Math.round(completedJobs.reduce((s, j) => s + parseFloat(j.averageConfidenceScore || "0"), 0) / completedJobs.length)
    : 0;
  const totalQuestions = jobs.reduce((s, j) => s + (j.totalQuestionsCount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            AI Questionnaire Solver
          </h1>
          <p className="text-slate-400 mt-1">
            Upload security questionnaires — AI auto-answers using your policy documents
          </p>
        </div>
        <Button
          id="questionnaire-refresh-btn"
          variant="ghost"
          onClick={() => refetch()}
          className="text-slate-400 hover:text-white"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Jobs", value: jobs.length, icon: FileQuestion, color: "from-indigo-600 to-indigo-400" },
          { label: "Questions Solved", value: totalQuestions, icon: Target, color: "from-violet-600 to-purple-400" },
          { label: "Avg Confidence", value: `${avgConfidence}%`, icon: BarChart3, color: "from-emerald-600 to-green-400" },
        ].map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm"
          >
            <div className={`absolute top-3 right-3 w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center opacity-80`}>
              <card.icon className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="text-3xl font-black text-white">{card.value}</div>
            <div className="text-xs font-semibold text-slate-400 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* ── Upload Zone ─────────────────────────────────────────────────────── */}
      <div className="mb-8">
        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12 rounded-3xl border-2 border-indigo-500/40 bg-indigo-500/5">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
            <p className="text-white font-semibold">Uploading &amp; starting AI solver...</p>
            <p className="text-slate-400 text-sm">This may take a minute depending on file size.</p>
          </div>
        ) : (
          <DropZone onFile={(f) => uploadMutation.mutate(f)} />
        )}
      </div>

      {/* ── Jobs List ───────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-400" />
          Solver Jobs
        </h2>

        {isLoading ? (
          <div className="text-center py-16 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
            Loading jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <Brain className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 text-lg font-semibold">No solver jobs yet</p>
            <p className="text-slate-600 text-sm mt-1">
              Upload a CSV or XLSX questionnaire to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const progress =
                job.totalQuestionsCount > 0
                  ? Math.round((job.completedQuestionsCount / job.totalQuestionsCount) * 100)
                  : 0;
              const isExpanded = expandedJob === job.id;

              return (
                <div
                  key={job.id}
                  className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
                >
                  {/* Job Header */}
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-700 to-indigo-700 flex items-center justify-center flex-shrink-0">
                        <FileSpreadsheet className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-bold">{job.fileName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(job.createdAt).toLocaleString()} •{" "}
                          <span className="font-mono">{job.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                      {job.status === "completed" && job.averageConfidenceScore && (
                        <div className="text-center hidden sm:block">
                          <ConfidencePill score={Math.round(parseFloat(job.averageConfidenceScore))} />
                          <div className="text-xs text-slate-500">Avg Confidence</div>
                        </div>
                      )}

                      <div className="text-center hidden sm:block">
                        <div className="text-white font-bold text-sm">
                          {job.completedQuestionsCount}/{job.totalQuestionsCount}
                        </div>
                        <div className="text-xs text-slate-500">Questions</div>
                      </div>

                      <StatusBadge status={job.status} />

                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {job.status === "completed" && (
                          <Button
                            id={`download-job-${job.id}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(job.id)}
                            className="text-emerald-400 hover:text-emerald-300 h-8 w-8 p-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          id={`delete-job-${job.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(job.id)}
                          className="text-slate-400 hover:text-red-400 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {(job.status === "processing" || job.status === "pending") && (
                    <div className="px-5 pb-4">
                      <Progress value={progress} className="h-1.5 bg-white/10" />
                      <p className="text-xs text-slate-500 mt-1">
                        {progress}% complete — {job.completedQuestionsCount} of {job.totalQuestionsCount} questions solved
                      </p>
                    </div>
                  )}

                  {/* Expanded Results */}
                  {isExpanded && job.questionsData && job.questionsData.length > 0 && (
                    <div className="border-t border-white/10 max-h-96 overflow-y-auto">
                      <div className="p-4 space-y-3">
                        {job.questionsData.slice(0, 20).map((q, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-white/5 text-sm">
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <p className="text-slate-300 font-semibold text-xs leading-relaxed">
                                Q{idx + 1}: {q.question}
                              </p>
                              <ConfidencePill score={q.confidence} />
                            </div>
                            <p className="text-slate-400 text-xs leading-relaxed">{q.response}</p>
                            {q.citation && q.citation !== "No specific policy cited" && (
                              <p className="text-indigo-400 text-xs mt-1 font-medium">
                                📄 {q.citation}
                              </p>
                            )}
                          </div>
                        ))}
                        {job.questionsData.length > 20 && (
                          <p className="text-center text-xs text-slate-500 py-2">
                            Download CSV to see all {job.questionsData.length} answers.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {job.status === "failed" && (
                    <div className="px-5 pb-4 flex items-center gap-2 text-red-400 text-xs">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Solver failed — check server logs for details.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Delete Confirm ──────────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Solver Job?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently delete the job, its answers, and the uploaded file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-600 text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              id="confirm-delete-job"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Clock,
  Link as LinkIcon,
  Sparkles,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { SnapshotManager } from "@/components/evidence/SnapshotManager";
import { WebImportDialog } from "@/components/evidence/WebImportDialog";

type BackendProcessingStatus = "pending" | "extracting" | "indexing" | "analyzing" | "completed" | "failed";

interface EvidenceFile {
  id: string;
  serverId?: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "pending" | "extracting" | "indexing" | "analyzing" | "completed" | "error" | "failed";
  progress: number;
  category?: string;
  uploadedAt?: string;
}

interface EvidenceListItem {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category?: string;
  processingStatus?: BackendProcessingStatus;
  createdAt?: string;
}

interface EvidenceListResponse {
  data?:
    | {
        evidence?: EvidenceListItem[];
      }
    | EvidenceListItem[];
}

interface UploadEvidenceResponse {
  data?: EvidenceListItem;
}

const CATEGORIES = ["Company Profile", "Product & System", "Security Program", "Evidence"] as const;

const STATUS_PROGRESS: Record<EvidenceFile["status"], number> = {
  uploading: 0,
  pending: 20,
  extracting: 45,
  indexing: 65,
  analyzing: 85,
  completed: 100,
  failed: 0,
  error: 0,
};

const TERMINAL_FILE_STATUSES = new Set<EvidenceFile["status"]>(["completed", "failed", "error"]);

function mapBackendStatus(status: string | undefined): EvidenceFile["status"] {
  switch (status) {
    case "pending":
    case "extracting":
    case "indexing":
    case "analyzing":
    case "completed":
    case "failed":
      return status;
    default:
      return "pending";
  }
}

function getProgressForStatus(status: EvidenceFile["status"]): number {
  return STATUS_PROGRESS[status] ?? 0;
}

function normalizeEvidenceListResponse(payload: unknown): EvidenceListItem[] {
  if (Array.isArray(payload)) {
    return payload as EvidenceListItem[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const response = payload as EvidenceListResponse;
  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (response.data && typeof response.data === "object") {
    const evidence = (response.data as { evidence?: EvidenceListItem[] }).evidence;
    if (Array.isArray(evidence)) {
      return evidence;
    }
  }

  return [];
}

function normalizeUploadResponse(payload: unknown): EvidenceListItem | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = (payload as UploadEvidenceResponse).data;
  if (!data || typeof data !== "object") {
    return null;
  }

  return data;
}

const getStatusIcon = (status: EvidenceFile["status"]) => {
  switch (status) {
    case "uploading":
      return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
    case "pending":
      return <Clock className="w-4 h-4 text-gray-400" />;
    case "extracting":
      return <FileText className="w-4 h-4 text-orange-500 animate-pulse" />;
    case "indexing":
      return <LinkIcon className="w-4 h-4 text-purple-500 animate-pulse" />;
    case "analyzing":
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    case "completed":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "error":
    case "failed":
      return <AlertCircle className="w-4 h-4 text-red-500" />;
  }
};

const getStatusLabel = (status: EvidenceFile["status"]) => {
  switch (status) {
    case "uploading":
      return "Uploading...";
    case "pending":
      return "Queued";
    case "extracting":
      return "Extracting Text...";
    case "indexing":
      return "Indexing Content...";
    case "analyzing":
      return "AI Analysis...";
    case "completed":
      return "Ready";
    case "error":
    case "failed":
      return "Failed";
    default:
      return status;
  }
};

export default function EvidenceIngestion() {
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Evidence");
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [visionPrompt, setVisionPrompt] = useState("");
  const [auditResult, setAuditResult] = useState<any>(null);

  const { data: evidenceRecords = [] } = useQuery<EvidenceListItem[]>({
    queryKey: ["/api/evidence", selectedSnapshotId],
    enabled: Boolean(selectedSnapshotId),
    refetchInterval: (query) => {
      const records = Array.isArray(query.state.data) ? query.state.data : [];
      const recordById = new Map(records.map((record) => [record.id, record]));
      const trackedFiles = files.filter((file) => Boolean(file.serverId));

      if (trackedFiles.length === 0) {
        return false;
      }

      const hasActiveProcessing = trackedFiles.some((file) => {
        const record = file.serverId ? recordById.get(file.serverId) : undefined;
        const status = record ? mapBackendStatus(record.processingStatus) : file.status;
        return !TERMINAL_FILE_STATUSES.has(status);
      });

      return hasActiveProcessing ? 1500 : false;
    },
    queryFn: async () => {
      if (!selectedSnapshotId) {
        return [];
      }

      const snapshotId = selectedSnapshotId;
      const response = await apiRequest("GET", `/api/evidence?snapshotId=${encodeURIComponent(snapshotId)}`);
      return normalizeEvidenceListResponse(response);
    },
  });

  const imageFiles = useMemo(() => {
    return evidenceRecords.filter(r => 
      r.mimeType.startsWith('image/') || 
      ['png', 'jpg', 'jpeg', 'webp'].includes(r.fileName.split('.').pop()?.toLowerCase() || '')
    );
  }, [evidenceRecords]);

  const visionAuditMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/evidence/${id}/audit-vision`, {
        framework: "SOC2",
        controlId: "CC6.1",
        prompt: visionPrompt || undefined
      });
    },
    onSuccess: (res) => {
      setAuditResult(res.data);
      toast({
        title: "AI Vision Audit Completed",
        description: `Verdict: ${res.data.isVerified ? "Verified (Compliant)" : "Requires Action"}`
      });
    },
    onError: (err) => {
      toast({
        title: "Vision Audit Failed",
        description: err instanceof Error ? err.message : "Internal system error occurred.",
        variant: "destructive"
      });
    }
  });

  const evidenceRecordById = useMemo(
    () => new Map(evidenceRecords.map((record) => [record.id, record])),
    [evidenceRecords],
  );

  const displayFiles = useMemo(
    () =>
      files.map((file) => {
        if (!file.serverId) {
          return file;
        }

        const serverRecord = evidenceRecordById.get(file.serverId);
        if (!serverRecord) {
          return file;
        }

        const mappedStatus = mapBackendStatus(serverRecord.processingStatus);
        return {
          ...file,
          status: mappedStatus,
          progress: getProgressForStatus(mappedStatus),
          uploadedAt: serverRecord.createdAt ?? file.uploadedAt,
          category: serverRecord.category || file.category,
        };
      }),
    [files, evidenceRecordById],
  );

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedSnapshotId) {
        throw new Error("Please select an audit snapshot first.");
      }

      return new Promise<unknown>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const base64String = (reader.result as string).split(",")[1];

          apiRequest("/api/evidence/upload", "POST", {
            fileName: file.name,
            fileData: base64String,
            snapshotId: selectedSnapshotId,
            category: selectedCategory,
          }).then(resolve).catch(reject);
        };
        reader.onerror = (error) => reject(error);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evidence"] });
      toast({
        title: "Evidence uploaded",
        description: "File uploaded and queued for processing.",
      });
    },
    onError: (err) => {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Failed to upload file.",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!selectedSnapshotId) {
        toast({
          title: "Action Required",
          description: "Please select an Audit Snapshot context before uploading.",
          variant: "destructive",
        });
        return;
      }

      const newFiles: EvidenceFile[] = acceptedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploading",
        progress: 0,
        category: selectedCategory,
      }));

      setFiles((prev) => [...prev, ...newFiles]);

      acceptedFiles.forEach((file, index) => {
        const localFile = newFiles[index];

        const progressInterval = setInterval(() => {
          setFiles((prev) =>
            prev.map((queuedFile) => {
              if (queuedFile.id === localFile.id && queuedFile.status === "uploading") {
                const nextProgress = Math.min(queuedFile.progress + 10, 90);
                return { ...queuedFile, progress: nextProgress };
              }
              return queuedFile;
            }),
          );
        }, 200);

        uploadMutation
          .mutateAsync(file)
          .then((responsePayload) => {
            clearInterval(progressInterval);

            const uploadedRecord = normalizeUploadResponse(responsePayload);
            const backendStatus = mapBackendStatus(uploadedRecord?.processingStatus);

            setFiles((prev) =>
              prev.map((queuedFile) => {
                if (queuedFile.id !== localFile.id) {
                  return queuedFile;
                }

                return {
                  ...queuedFile,
                  serverId: uploadedRecord?.id || queuedFile.serverId,
                  status: backendStatus,
                  progress: getProgressForStatus(backendStatus),
                  uploadedAt: uploadedRecord?.createdAt || new Date().toISOString(),
                  category: uploadedRecord?.category || queuedFile.category,
                };
              }),
            );
          })
          .catch(() => {
            clearInterval(progressInterval);
            setFiles((prev) =>
              prev.map((queuedFile) => {
                if (queuedFile.id === localFile.id) {
                  return { ...queuedFile, status: "error", progress: 0 };
                }
                return queuedFile;
              }),
            );
          });
      });
    },
    [selectedSnapshotId, selectedCategory, uploadMutation, toast],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    disabled: !selectedSnapshotId,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Evidence Ingestion</h1>
        <p className="text-muted-foreground">Upload and process compliance evidence for audit readiness</p>
      </div>

      <SnapshotManager selectedSnapshotId={selectedSnapshotId} onSnapshotSelect={(id) => setSelectedSnapshotId(id)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>Upload Evidence</CardTitle>
                <CardDescription>Select a category and drop files to ingest.</CardDescription>
              </div>
              <WebImportDialog snapshotId={selectedSnapshotId} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={!selectedSnapshotId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!selectedSnapshotId && (
                  <p className="text-xs text-orange-500">Select a snapshot above to enable upload.</p>
                )}
              </div>

              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-colors duration-200
                  ${
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : !selectedSnapshotId
                        ? "opacity-50 cursor-not-allowed"
                        : "border-muted-foreground/25 hover:border-primary/50"
                  }
                `}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                {isDragActive ? (
                  <p className="text-lg font-medium">Drop files here...</p>
                ) : (
                  <>
                    <p className="text-lg font-medium">Drag & drop files here</p>
                    <p className="text-sm text-muted-foreground mt-1">or click to select files</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {displayFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Queue</CardTitle>
                <CardDescription>{displayFiles.length} file(s) in queue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {displayFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{file.name}</p>
                        <Badge variant="secondary">{formatFileSize(file.size)}</Badge>
                      </div>
                      {file.status === "uploading" && <Progress value={file.progress} className="h-1 mt-2" />}
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(file.status)}
                        <span className="text-sm text-muted-foreground">{getStatusLabel(file.status)}</span>
                        <Badge variant="outline">{file.category}</Badge>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeFile(file.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* AI Vision Audit Card */}
          {imageFiles.length > 0 && (
            <Card className="border-purple-500/20 bg-gradient-to-b from-card to-background shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  AI Screenshot Vision Auditor
                </CardTitle>
                <CardDescription className="text-xs">
                  Run computer-vision checks against screenshot evidence to prove controls.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase text-muted-foreground">Select Image Evidence</label>
                  <Select value={selectedImageId || ""} onValueChange={(val) => { setSelectedImageId(val); setAuditResult(null); }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Choose screenshot..." />
                    </SelectTrigger>
                    <SelectContent>
                      {imageFiles.map((img) => (
                        <SelectItem key={img.id} value={img.id} className="text-xs">
                          {img.fileName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedImageId && (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase text-muted-foreground">Custom Auditor Focus (Optional)</label>
                      <Input 
                        placeholder="e.g. Ensure AWS MFA badge is active" 
                        value={visionPrompt} 
                        onChange={(e) => setVisionPrompt(e.target.value)} 
                        className="h-8 text-xs font-sans" 
                      />
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full text-xs bg-purple-600 hover:bg-purple-500 font-semibold"
                      disabled={visionAuditMutation.isPending}
                      onClick={() => visionAuditMutation.mutate(selectedImageId)}
                    >
                      {visionAuditMutation.isPending ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Auditing...
                        </>
                      ) : (
                        "Trigger AI Vision Audit"
                      )}
                    </Button>
                  </div>
                )}

                {auditResult && (
                  <div className="p-3 rounded-lg border border-muted-foreground/10 bg-muted/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-muted-foreground">Verdict:</span>
                      {auditResult.isVerified ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] py-0">Verified (Pass)</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px] py-0">Needs Review</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-muted-foreground">Confidence:</span>
                      <span className="font-mono text-purple-400">{auditResult.analysis.confidenceScore || auditResult.analysis.confidence || 85}%</span>
                    </div>
                    <div className="space-y-1 mt-1 pt-1 border-t border-muted-foreground/5 text-left">
                      <span className="font-semibold text-muted-foreground block">Auditor Insights:</span>
                      <p className="text-[10px] text-muted-foreground whitespace-pre-wrap leading-normal">
                        {auditResult.analysis.analysisText || auditResult.analysis.analysis}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Group files by category for better AI context.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Snapshots are isolated workspaces.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

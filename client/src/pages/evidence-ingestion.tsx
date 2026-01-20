import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Link as LinkIcon
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { SnapshotManager } from "@/components/evidence/SnapshotManager";

interface EvidenceFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "pending" | "extracting" | "indexing" | "analyzing" | "completed" | "error" | "failed";
  progress: number;
  category?: string;
  uploadedAt?: string;
}

// ... (existing code)

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
      case "uploading": return "Uploading...";
      case "pending": return "Queued";
      case "extracting": return "Extracting Text...";
      case "indexing": return "Indexing Content...";
      case "analyzing": return "AI Analysis...";
      case "completed": return "Ready";
      case "error": 
      case "failed": return "Failed";
      default: return status;
    }
  };

const CATEGORIES = [
  "Company Profile",
  "Product & System", 
  "Security Program", 
  "Evidence"
];

export default function EvidenceIngestion() {
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Evidence");
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedSnapshotId) throw new Error("Please select an audit snapshot first.");

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const base64String = (reader.result as string).split(',')[1];
          
          apiRequest("POST", "/api/evidence/upload", {
            fileName: file.name,
            fileData: base64String,
            snapshotId: selectedSnapshotId,
            category: selectedCategory
          }).then(resolve).catch(reject);
        };
        reader.onerror = error => reject(error);
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!selectedSnapshotId) {
      toast({
        title: "Action Required",
        description: "Please select an Audit Snapshot context before uploading.",
        variant: "destructive"
      });
      return;
    }

    const newFiles: EvidenceFile[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "uploading",
      progress: 0,
      category: selectedCategory,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Process uploads
    acceptedFiles.forEach((file, index) => {
      const evidenceFile = newFiles[index];
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setFiles((prev) => 
          prev.map((f) => {
            if (f.id === evidenceFile.id && f.status === "uploading") {
              const newProgress = Math.min(f.progress + 10, 90);
              return { ...f, progress: newProgress };
            }
            return f;
          })
        );
      }, 200);

      uploadMutation.mutateAsync(file)
        .then(() => {
          clearInterval(progressInterval);
          setFiles((prev) =>
            prev.map((f) => {
              if (f.id === evidenceFile.id) {
                return { 
                  ...f, 
                  status: "extracting", // Start granular status simulation
                  progress: 100,
                  uploadedAt: new Date().toISOString()
                };
              }
              return f;
            })
          );
          
          // Simulate status progression for UI demo
          setTimeout(() => {
             setFiles(prev => prev.map(f => f.id === evidenceFile.id ? { ...f, status: 'indexing' } : f));
             setTimeout(() => {
                setFiles(prev => prev.map(f => f.id === evidenceFile.id ? { ...f, status: 'analyzing' } : f));
                setTimeout(() => {
                    setFiles(prev => prev.map(f => f.id === evidenceFile.id ? { ...f, status: 'completed' } : f));
                }, 1500);
             }, 1500);
          }, 1500);
        })
        .catch(() => {
          clearInterval(progressInterval);
          setFiles((prev) =>
            prev.map((f) => {
              if (f.id === evidenceFile.id) {
                return { ...f, status: "error", progress: 0 };
              }
              return f;
            })
          );
        });
    });
  }, [selectedSnapshotId, selectedCategory, uploadMutation, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    disabled: !selectedSnapshotId
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };



  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Evidence Ingestion</h1>
        <p className="text-muted-foreground">Upload and process compliance evidence for audit readiness</p>
      </div>

      <SnapshotManager 
        selectedSnapshotId={selectedSnapshotId}
        onSnapshotSelect={(id) => setSelectedSnapshotId(id)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Evidence</CardTitle>
              <CardDescription>
                Select a category and drop files to ingest.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                 <label className="text-sm font-medium">Document Category</label>
                 <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={!selectedSnapshotId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                        {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
                 {!selectedSnapshotId && <p className="text-xs text-orange-500">Select a snapshot above to enable upload.</p>}
              </div>

              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-colors duration-200
                  ${isDragActive 
                    ? "border-primary bg-primary/5" 
                    : !selectedSnapshotId ? "opacity-50 cursor-not-allowed" : "border-muted-foreground/25 hover:border-primary/50"
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

          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Queue</CardTitle>
                <CardDescription>{files.length} file(s) in queue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {files.map((file) => (
                  <div 
                    key={file.id} 
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <FileText className="w-8 h-8 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{file.name}</p>
                        <Badge variant="secondary">{formatFileSize(file.size)}</Badge>
                      </div>
                      {file.status === "uploading" && (
                        <Progress value={file.progress} className="h-1 mt-2" />
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(file.status)}
                        <span className="text-sm text-muted-foreground">
                          {file.status}
                        </span>
                        <Badge variant="outline">{file.category}</Badge>
                      </div>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
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

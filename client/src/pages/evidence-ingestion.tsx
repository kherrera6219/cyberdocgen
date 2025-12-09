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
  Clock, 
  AlertCircle,
  Trash2,
  Eye,
  Link as LinkIcon,
  X
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface EvidenceFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "processing" | "completed" | "error";
  progress: number;
  framework?: string;
  control?: string;
  uploadedAt?: string;
}

interface Control {
  id: string;
  name: string;
  framework: string;
}

export default function EvidenceIngestion() {
  const [selectedFramework, setSelectedFramework] = useState<string>("");
  const [selectedControl, setSelectedControl] = useState<string>("");
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: controls } = useQuery<Control[]>({
    queryKey: ["/api/controls"],
  });

  const filteredControls = controls?.filter(c => 
    !selectedFramework || c.framework === selectedFramework
  ) ?? [];

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("framework", selectedFramework);
      formData.append("control", selectedControl);
      return apiRequest("/api/evidence/upload", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evidence"] });
      toast({
        title: "Evidence uploaded",
        description: "Your evidence file has been uploaded and is being processed.",
      });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload evidence file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: EvidenceFile[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "uploading" as const,
      progress: 0,
      framework: selectedFramework,
      control: selectedControl,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    newFiles.forEach((evidenceFile, index) => {
      const file = acceptedFiles[index];
      
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

      setTimeout(() => {
        clearInterval(progressInterval);
        setFiles((prev) =>
          prev.map((f) => {
            if (f.id === evidenceFile.id) {
              return { 
                ...f, 
                status: "processing", 
                progress: 100,
                uploadedAt: new Date().toISOString()
              };
            }
            return f;
          })
        );

        setTimeout(() => {
          setFiles((prev) =>
            prev.map((f) => {
              if (f.id === evidenceFile.id) {
                return { ...f, status: "completed" };
              }
              return f;
            })
          );
        }, 2000);
      }, 2000);
    });
  }, [selectedFramework, selectedControl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const getStatusIcon = (status: EvidenceFile["status"]) => {
    switch (status) {
      case "uploading":
        return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      case "processing":
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusLabel = (status: EvidenceFile["status"]) => {
    switch (status) {
      case "uploading": return "Uploading";
      case "processing": return "Processing";
      case "completed": return "Completed";
      case "error": return "Error";
    }
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Evidence</CardTitle>
              <CardDescription>
                Drag and drop files or click to select. Supported: PDF, Images, Word, Excel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Framework</label>
                  <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                    <SelectTrigger data-testid="select-framework">
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iso27001">ISO 27001</SelectItem>
                      <SelectItem value="soc2">SOC 2</SelectItem>
                      <SelectItem value="fedramp">FedRAMP</SelectItem>
                      <SelectItem value="nist">NIST 800-53</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Control (Optional)</label>
                  <Select value={selectedControl} onValueChange={setSelectedControl}>
                    <SelectTrigger data-testid="select-control">
                      <SelectValue placeholder="Select control" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredControls.length > 0 ? (
                        filteredControls.map((control) => (
                          <SelectItem key={control.id} value={control.id}>
                            {control.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No controls available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-colors duration-200
                  ${isDragActive 
                    ? "border-primary bg-primary/5" 
                    : "border-muted-foreground/25 hover:border-primary/50"
                  }
                `}
                data-testid="dropzone-area"
              >
                <input {...getInputProps()} data-testid="input-file-upload" />
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
                    data-testid={`file-item-${file.id}`}
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
                          {getStatusLabel(file.status)}
                        </span>
                        {file.framework && (
                          <Badge variant="outline">{file.framework}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.status === "completed" && (
                        <Button size="icon" variant="ghost" data-testid={`button-view-${file.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => removeFile(file.id)}
                        data-testid={`button-remove-${file.id}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Maximum file size: 50MB</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Supported formats: PDF, PNG, JPG, DOCX, XLSX</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                <span>AI will automatically extract and categorize evidence</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Link evidence to specific controls for audit trails</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-md">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">security-policy-2024.pdf</p>
                    <p className="text-xs text-muted-foreground">ISO 27001 - A.5.1</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-md">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">access-review-q4.xlsx</p>
                    <p className="text-xs text-muted-foreground">SOC 2 - CC6.1</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-md">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">penetration-test-report.pdf</p>
                    <p className="text-xs text-muted-foreground">FedRAMP - CA-8</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

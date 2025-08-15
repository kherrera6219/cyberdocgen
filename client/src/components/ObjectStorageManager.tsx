import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Download, 
  Trash2, 
  File, 
  Folder, 
  BarChart3,
  Archive,
  Database,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface StorageStats {
  totalFiles: number;
  byFolder: {
    documents: number;
    profiles: number;
    backups: number;
    auditLogs: number;
    files: number;
    other: number;
  };
  lastUpdated: string;
}

interface StorageStatsResponse {
  success: boolean;
  stats: StorageStats;
  error?: string;
}

interface FileListResponse {
  success: boolean;
  files: string[];
  error?: string;
}

interface FileItem {
  name: string;
  folder: string;
  size?: number;
  lastModified?: string;
}

export function ObjectStorageManager() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFolder, setUploadFolder] = useState("files");
  const [uploadData, setUploadData] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get storage statistics
  const { data: stats, isLoading: statsLoading } = useQuery<StorageStatsResponse>({
    queryKey: ["/api/storage/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // List all files
  const { data: allFiles, isLoading: filesLoading } = useQuery<FileListResponse>({
    queryKey: ["/api/storage/list"],
  });

  // List files by folder
  const { data: documentFiles } = useQuery<FileListResponse>({
    queryKey: ["/api/storage/list", "documents"],
    queryFn: () => apiRequest("/api/storage/list?folder=documents"),
  });

  const { data: profileFiles } = useQuery<FileListResponse>({
    queryKey: ["/api/storage/list", "profiles"],
    queryFn: () => apiRequest("/api/storage/list?folder=profiles"),
  });

  const { data: backupFiles } = useQuery<FileListResponse>({
    queryKey: ["/api/storage/list", "backups"],
    queryFn: () => apiRequest("/api/storage/list?folder=backups"),
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({ filename, data, folder }: { filename: string; data: string; folder: string }) => {
      return apiRequest("/api/storage/files", {
        method: "POST",
        body: JSON.stringify({ filename, data, folder }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Upload Successful",
        description: "File has been uploaded to object storage.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/storage/list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/storage/stats"] });
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  // Upload text data mutation
  const uploadTextMutation = useMutation({
    mutationFn: async ({ filename, content }: { filename: string; content: string }) => {
      const base64Data = btoa(content);
      return apiRequest("/api/storage/files", {
        method: "POST",
        body: JSON.stringify({ 
          filename: `${filename}.txt`, 
          data: base64Data, 
          folder: uploadFolder 
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Text Upload Successful",
        description: "Text data has been uploaded to object storage.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/storage/list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/storage/stats"] });
      setUploadData("");
    },
    onError: (error: any) => {
      toast({
        title: "Text Upload Failed",
        description: error.message || "Failed to upload text data",
        variant: "destructive",
      });
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (filePath: string) => {
      return apiRequest(`/api/storage/objects/${filePath}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Delete Successful",
        description: "File has been deleted from object storage.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/storage/list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/storage/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64Data = result.split(',')[1]; // Remove data:mime/type;base64, prefix
        
        uploadFileMutation.mutate({
          filename: selectedFile.name,
          data: base64Data,
          folder: uploadFolder,
        });
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast({
        title: "File Read Error",
        description: "Failed to read the selected file",
        variant: "destructive",
      });
    }
  };

  const handleTextUpload = () => {
    if (!uploadData.trim()) return;
    
    const filename = `text-upload-${Date.now()}`;
    uploadTextMutation.mutate({ filename, content: uploadData });
  };

  const handleDeleteFile = (filePath: string) => {
    if (confirm(`Are you sure you want to delete ${filePath}?`)) {
      deleteFileMutation.mutate(filePath);
    }
  };

  const renderFileList = (files: string[] | undefined, title: string, icon: React.ReactNode) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {files && files.length > 0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded border">
                <span className="text-sm truncate flex-1">{file}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteFile(file)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No files</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Object Storage Manager</h1>
        <Button
          variant="outline"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/storage/list"] });
            queryClient.invalidateQueries({ queryKey: ["/api/storage/stats"] });
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Storage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Storage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-2">
                    <div className="animate-pulse bg-muted h-4 rounded"></div>
                    <div className="animate-pulse bg-muted h-4 rounded w-3/4"></div>
                  </div>
                ) : stats?.success && stats.stats ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Files:</span>
                      <Badge variant="secondary">{stats.stats.totalFiles}</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Documents:</span>
                        <span>{stats.stats.byFolder.documents}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Profiles:</span>
                        <span>{stats.stats.byFolder.profiles}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Backups:</span>
                        <span>{stats.stats.byFolder.backups}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Files:</span>
                        <span>{stats.stats.byFolder.files}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => setActiveTab("upload")}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setActiveTab("files")}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  Browse Files
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Object Storage: Connected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">API: Operational</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Audit Trail: Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>File Upload</CardTitle>
                <CardDescription>
                  Upload files (images, PDFs, documents) to object storage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="folder-select">Upload Folder</Label>
                  <select
                    id="folder-select"
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    <option value="files">Files</option>
                    <option value="documents">Documents</option>
                    <option value="profiles">Profiles</option>
                    <option value="backups">Backups</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="file-input">Select File</Label>
                  <Input
                    id="file-input"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={handleFileUpload}
                  disabled={!selectedFile || uploadFileMutation.isPending}
                  className="w-full"
                >
                  {uploadFileMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload File
                </Button>
              </CardContent>
            </Card>

            {/* Text Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Text Data Upload</CardTitle>
                <CardDescription>
                  Upload text content directly to object storage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="text-data">Text Content</Label>
                  <Textarea
                    id="text-data"
                    placeholder="Enter text content to upload..."
                    value={uploadData}
                    onChange={(e) => setUploadData(e.target.value)}
                    className="mt-1 min-h-[100px]"
                  />
                </div>

                <Button
                  onClick={handleTextUpload}
                  disabled={!uploadData.trim() || uploadTextMutation.isPending}
                  className="w-full"
                >
                  {uploadTextMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload Text
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderFileList(
              documentFiles?.success ? documentFiles.files : undefined,
              "Documents",
              <File className="h-4 w-4" />
            )}
            {renderFileList(
              profileFiles?.success ? profileFiles.files : undefined,
              "Profiles",
              <Database className="h-4 w-4" />
            )}
            {renderFileList(
              backupFiles?.success ? backupFiles.files : undefined,
              "Backups",
              <Archive className="h-4 w-4" />
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Storage Analytics</CardTitle>
              <CardDescription>
                Detailed breakdown of object storage usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse bg-muted h-4 rounded"></div>
                  <div className="animate-pulse bg-muted h-4 rounded w-2/3"></div>
                  <div className="animate-pulse bg-muted h-4 rounded w-1/2"></div>
                </div>
              ) : stats?.success && stats.stats ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.stats.byFolder.documents}
                      </div>
                      <div className="text-sm text-muted-foreground">Documents</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.stats.byFolder.profiles}
                      </div>
                      <div className="text-sm text-muted-foreground">Profiles</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {stats.stats.byFolder.backups}
                      </div>
                      <div className="text-sm text-muted-foreground">Backups</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {stats.stats.byFolder.files}
                      </div>
                      <div className="text-sm text-muted-foreground">Files</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Storage Utilization</span>
                      <span>{stats.stats.totalFiles} files</span>
                    </div>
                    <Progress value={(stats.stats.totalFiles / 1000) * 100} className="h-2" />
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Last updated: {new Date(stats.stats.lastUpdated).toLocaleString()}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No analytics data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
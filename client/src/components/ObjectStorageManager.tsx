import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  File, 
  Archive,
  Database,
  RefreshCw,
  CheckCircle,
  BarChart3,
  Upload,
  Folder
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Sub-components
import { StorageStatsView, StorageStatsData } from "./storage/StorageStatsView";
import { FileListView } from "./storage/FileListView";
import { UploadDialog } from "./storage/UploadDialog";

interface StorageStatsResponse {
  success: boolean;
  stats: StorageStatsData;
  error?: string;
}

interface FileListResponse {
  success: boolean;
  files: string[];
  error?: string;
}

export function ObjectStorageManager() {
  const [uploadData, setUploadData] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get storage statistics
  const { data: stats, isLoading: statsLoading } = useQuery<StorageStatsResponse>({
    queryKey: ["/api/storage/stats"],
    refetchInterval: 30000,
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
          folder: 'files' // Default for text upload
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

  const handleFileUpload = async (file: File, folder: string) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64Data = result.split(',')[1];

        uploadFileMutation.mutate({
          filename: file.name,
          data: base64Data,
          folder: folder,
        });
      };
      reader.readAsDataURL(file);
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
                <StorageStatsView 
                  stats={stats?.success ? stats.stats : undefined} 
                  isLoading={statsLoading} 
                />
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
                <UploadDialog 
                  onUpload={handleFileUpload} 
                  isUploading={uploadFileMutation.isPending} 
                />
              </CardHeader>
            </Card>

            {/* Text Upload (Still inline for now as it's simple) */}
            <Card>
              <CardHeader>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full h-24">
                      <File className="h-8 w-8" />
                      <span className="ml-2 text-lg">Upload Text</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]" aria-describedby="text-upload-description">
                    <DialogHeader>
                      <DialogTitle>Upload Text Content</DialogTitle>
                      <DialogDescription id="text-upload-description">
                        Upload text content directly to object storage
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
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
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FileListView 
              files={documentFiles?.success ? documentFiles.files : undefined}
              title="Documents"
              icon={<File className="h-4 w-4" />}
              onDelete={handleDeleteFile}
              isLoading={filesLoading}
            />
            <FileListView 
              files={profileFiles?.success ? profileFiles.files : undefined}
              title="Profiles"
              icon={<Database className="h-4 w-4" />}
              onDelete={handleDeleteFile}
              isLoading={filesLoading}
            />
            <FileListView 
              files={backupFiles?.success ? backupFiles.files : undefined}
              title="Backups"
              icon={<Archive className="h-4 w-4" />}
              onDelete={handleDeleteFile}
              isLoading={filesLoading}
            />
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
              <StorageStatsView 
                stats={stats?.success ? stats.stats : undefined} 
                isLoading={statsLoading}
                detailed={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

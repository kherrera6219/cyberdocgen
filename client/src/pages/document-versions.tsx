import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  History,
  Eye,
  Download,
  GitCompare,
  RotateCcw,
  GitBranch,
  User,
  FileText,
  Tag,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import type { Document, DocumentVersion } from "@shared/schema";

interface DocumentVersionsProps {
  documentId: string;
  documentTitle?: string;
}

interface DocumentVersionResponse {
  data?: DocumentVersion[];
}

interface DocumentResponse {
  data?: Document;
}

function normalizeVersionsResponse(payload: unknown): DocumentVersion[] {
  if (Array.isArray(payload)) {
    return payload as DocumentVersion[];
  }

  if (payload && typeof payload === "object") {
    const data = (payload as DocumentVersionResponse).data;
    if (Array.isArray(data)) {
      return data;
    }
  }

  return [];
}

function normalizeDocumentResponse(payload: unknown): Document | null {
  if (payload && typeof payload === "object" && "id" in (payload as Record<string, unknown>)) {
    return payload as Document;
  }

  if (payload && typeof payload === "object") {
    const data = (payload as DocumentResponse).data;
    if (data && typeof data === "object") {
      return data;
    }
  }

  return null;
}

function parseVersionDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function DocumentVersions({ documentId, documentTitle }: DocumentVersionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);

  const { data: versions = [], isLoading } = useQuery<DocumentVersion[]>({
    queryKey: ["/api/documents", documentId, "versions"],
    enabled: Boolean(documentId),
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/documents/${documentId}/versions`);
      return normalizeVersionsResponse(response);
    },
  });

  const { data: documentData } = useQuery<Document | null>({
    queryKey: ["/api/documents", documentId, "detail"],
    enabled: Boolean(documentId),
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/documents/${documentId}`);
      return normalizeDocumentResponse(response);
    },
  });

  const resolvedDocumentTitle = documentTitle || documentData?.title || "Document";

  const restoreVersionMutation = useMutation({
    mutationFn: async (versionNumber: number) => {
      return apiRequest(`/api/documents/${documentId}/versions/${versionNumber}/restore`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Version Restored",
        description: "Document has been restored to the selected version.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents", documentId, "versions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents", documentId, "detail"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Restore Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getChangeTypeColor = (changeType: string | null) => {
    if (!changeType) return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    switch (changeType) {
      case "major":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "minor":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "patch":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "draft":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes <= 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  const formatDate = (value: unknown) => {
    const date = parseVersionDate(value);
    if (!date) return "Unknown date";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleVersionSelect = (versionNumber: number) => {
    if (compareMode) {
      if (selectedVersions.includes(versionNumber)) {
        setSelectedVersions((prev) => prev.filter((id) => id !== versionNumber));
      } else if (selectedVersions.length < 2) {
        setSelectedVersions((prev) => [...prev, versionNumber]);
      }
    }
  };

  const compareVersions = () => {
    if (selectedVersions.length === 2) {
      // Open comparison view
      toast({
        title: "Comparison View",
        description: "Version comparison feature would open here",
      });
    }
  };

  const selectedVersionContent = selectedVersion?.content || "";
  const selectedVersionPreview =
    selectedVersionContent.length > 1000
      ? `${selectedVersionContent.substring(0, 1000)}...`
      : selectedVersionContent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <History className="h-6 w-6" />
            Version History
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {resolvedDocumentTitle} - Track changes and manage document versions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setCompareMode(!compareMode);
              setSelectedVersions([]);
            }}
          >
            <GitCompare className="h-4 w-4 mr-2" />
            {compareMode ? "Exit Compare" : "Compare Versions"}
          </Button>

          {compareMode && selectedVersions.length === 2 && (
            <Button onClick={compareVersions}>
              <GitBranch className="h-4 w-4 mr-2" />
              Compare Selected
            </Button>
          )}
        </div>
      </div>

      {/* Compare Mode Alert */}
      {compareMode && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800 dark:text-blue-200">
                Compare Mode Active - Select up to 2 versions to compare ({selectedVersions.length}/2 selected)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Version Timeline */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading version history...
          </CardContent>
        </Card>
      ) : (
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

        <div className="space-y-6">
          {versions.map((version) => (
            <div key={version.id} className="relative flex items-start gap-6">
              {/* Timeline Node */}
              <div className={`flex items-center justify-center w-16 h-16 rounded-full border-4 ${
                version.status === 'published' 
                  ? 'bg-green-100 border-green-300 dark:bg-green-900 dark:border-green-700' 
                  : 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600'
              }`}>
                <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  v{version.versionNumber}
                </span>
              </div>

              {/* Version Card */}
              <Card className={`flex-1 ${
                compareMode && selectedVersions.includes(version.versionNumber)
                  ? 'ring-2 ring-blue-500 ring-offset-2' 
                  : ''
              } ${compareMode ? 'cursor-pointer hover:shadow-md' : ''}`}
              onClick={() => compareMode && handleVersionSelect(version.versionNumber)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {version.title}
                        {version.status === 'published' && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Current
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(version.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Created by {version.createdBy}
                        </div>
                        <span>{formatFileSize(version.fileSize || 0)}</span>
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={getChangeTypeColor(version.changeType)}>
                        <Tag className="h-3 w-3 mr-1" />
                        {version.changeType}
                      </Badge>
                      <Badge className={getStatusColor(version.status)}>
                        {version.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Changes Description */}
                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                      Changes in this version:
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                      {version.changes || "No change summary provided."}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVersion(version);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      {version.status !== 'published' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            restoreVersionMutation.mutate(version.versionNumber);
                          }}
                          disabled={restoreVersionMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      Checksum: {version.checksum ? `${version.checksum.slice(0, 12)}...` : "N/A"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Version Preview Modal */}
      {selectedVersion && (
        <Dialog open={true} onOpenChange={() => setSelectedVersion(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedVersion.title}
                <Badge className={getStatusColor(selectedVersion.status)}>
                  {selectedVersion.status}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Version {selectedVersion.versionNumber} • 
                Created {formatDate(selectedVersion.createdAt)} • 
                {formatFileSize(selectedVersion.fileSize || 0)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Changes */}
              <div>
                <h4 className="font-medium mb-2">Changes in this version:</h4>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                  <p className="text-sm">{selectedVersion.changes || "No change summary provided."}</p>
                </div>
              </div>

              {/* Content Preview */}
              <div>
                <h4 className="font-medium mb-2">Content Preview:</h4>
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {selectedVersionPreview || "No content available for this version."}
                  </pre>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download Version
                </Button>
                {selectedVersion.status !== 'published' && (
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => restoreVersionMutation.mutate(selectedVersion.versionNumber)}
                    disabled={restoreVersionMutation.isPending}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore to Current
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Empty State */}
      {!isLoading && versions.length === 0 && (
        <div className="text-center py-12">
          <History className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
            No versions found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Document versions will appear here as changes are made
          </p>
        </div>
      )}
    </div>
  );
}

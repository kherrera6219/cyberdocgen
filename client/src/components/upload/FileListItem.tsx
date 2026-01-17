import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, FileIcon, FileText, X } from "lucide-react";

export interface UploadedFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  extractedData?: any;
  error?: string;
}

interface FileListItemProps {
  uploadedFile: UploadedFile;
  isProcessing: boolean;
  onRemove: () => void;
}

export function FileListItem({ uploadedFile, isProcessing, onRemove }: FileListItemProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <FileIcon className="h-4 w-4 text-blue-600 animate-pulse" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'uploading':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon(uploadedFile.status)}
          <div>
            <p className="font-medium text-sm">{uploadedFile.file.name}</p>
            <p className="text-xs text-gray-500">
              {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(uploadedFile.status)}>
            {uploadedFile.status}
          </Badge>
          {!isProcessing && uploadedFile.status === 'pending' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              aria-label={`Remove ${uploadedFile.file.name}`}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {(uploadedFile.status === 'uploading' || uploadedFile.status === 'processing') && (
        <Progress value={uploadedFile.progress} className="w-full" />
      )}

      {/* Error Message */}
      {uploadedFile.status === 'error' && uploadedFile.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{uploadedFile.error}</p>
      )}

      {/* Extracted Data Preview */}
      {uploadedFile.status === 'completed' && uploadedFile.extractedData && (
        <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md">
          <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
            Extracted Information:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {uploadedFile.extractedData.companyName && (
              <div>
                <span className="font-medium">Company:</span> {uploadedFile.extractedData.companyName}
              </div>
            )}
            {uploadedFile.extractedData.incorporationDate && (
              <div>
                <span className="font-medium">Founded:</span> {uploadedFile.extractedData.incorporationDate}
              </div>
            )}
            {uploadedFile.extractedData.businessType && (
              <div>
                <span className="font-medium">Type:</span> {uploadedFile.extractedData.businessType}
              </div>
            )}
            {uploadedFile.extractedData.jurisdiction && (
              <div>
                <span className="font-medium">Jurisdiction:</span> {uploadedFile.extractedData.jurisdiction}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, CheckCircle, AlertCircle, X, FileIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';


interface UploadedFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  extractedData?: any;
  error?: string;
}

interface DocumentUploaderProps {
  onUploadComplete?: (extractedData: any[]) => void;
  acceptedFileTypes?: string[];
  maxFiles?: number;
  title?: string;
  description?: string;
}

export function DocumentUploader({
  onUploadComplete,
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.txt'],
  maxFiles = 5,
  title = "Upload Company Documents",
  description = "Upload incorporation documents, company registration files, or other company profile documents for AI analysis"
}: DocumentUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadAndProcessMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`documents`, file);
      });

      // Upload files and process with RAG
      const response = await fetch("/api/documents/upload-and-extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return await response.json();
    },
    onSuccess: (data: any) => {
      setUploadedFiles(prev => 
        prev.map(file => ({
          ...file,
          status: 'completed' as const,
          extractedData: data.extractedData?.find((d: any) => d.filename === file.file.name)
        }))
      );
      setIsProcessing(false);

      toast({
        title: "Upload Complete",
        description: `Successfully processed ${data.extractedData?.length || 0} documents`,
      });

      onUploadComplete?.(data.extractedData || []);
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: (error: Error) => {
      setUploadedFiles(prev => 
        prev.map(file => ({
          ...file,
          status: 'error',
          error: error.message
        }))
      );
      setIsProcessing(false);

      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload and process documents",
        variant: "destructive",
      });
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      // Add files to state
      const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
        file,
        progress: 0,
        status: 'pending'
      }));

      setUploadedFiles(prev => [...prev, ...newFiles]);
    },
  });

  const startUpload = async () => {
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);

    // Update status to uploading
    setUploadedFiles(prev => 
      prev.map(file => ({ ...file, status: 'uploading' as const, progress: 0 }))
    );

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadedFiles(prev => 
        prev.map(file => {
          if (file.status === 'uploading' && file.progress < 90) {
            return { ...file, progress: file.progress + 10 };
          }
          return file;
        })
      );
    }, 500);

    try {
      const files = uploadedFiles.map(f => f.file);

      // Update to processing status
      setTimeout(() => {
        setUploadedFiles(prev => 
          prev.map(file => ({ ...file, status: 'processing' as const, progress: 100 }))
        );
      }, 2000);

      await uploadAndProcessMutation.mutateAsync(files);

    } finally {
      clearInterval(progressInterval);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setUploadedFiles([]);
    setIsProcessing(false);
  };

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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-10 w-10 mx-auto mb-4 text-gray-400" />
          {isDragActive ? (
            <p className="text-blue-600 dark:text-blue-400">Drop the files here...</p>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-600 dark:text-gray-400">
                Drag & drop company documents here, or <span className="text-blue-600 dark:text-blue-400">click to browse</span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Supported: {acceptedFileTypes.join(', ')} (max {maxFiles} files)
              </p>
            </div>
          )}
        </div>

        {/* File List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Documents to Process</h4>
              <Button variant="outline" size="sm" onClick={clearAll} disabled={isProcessing}>
                Clear All
              </Button>
            </div>

            <div className="space-y-3">
              {uploadedFiles.map((uploadedFile, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
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
                          onClick={() => removeFile(index)}
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
              ))}
            </div>

            <Separator />

            {/* Upload Button */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {uploadedFiles.filter(f => f.status === 'completed').length} of {uploadedFiles.length} processed
              </p>
              <Button
                onClick={startUpload}
                disabled={isProcessing || uploadedFiles.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? "Processing..." : "Upload & Extract Data"}
              </Button>
            </div>
          </div>
        )}

        {/* Processing Info */}
        {isProcessing && (
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">AI Processing</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Our AI is analyzing your documents to extract company information including names, 
              addresses, incorporation details, business type, and key personnel. This helps 
              auto-populate your company profile and compliance documentation.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
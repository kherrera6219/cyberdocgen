/**
 * Repository Upload Zone Component
 * Drag-and-drop interface for uploading repository ZIP files
 */

import { useState, useCallback } from 'react';
import { Upload, FileArchive, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export interface RepoUploadZoneProps {
  onUpload: (file: File, metadata: { organizationId: string; companyProfileId: string; name: string }) => Promise<void>;
  organizationId: string;
  companyProfileId: string;
  maxSize?: number; // in MB
  className?: string;
}

export function RepoUploadZone({
  onUpload,
  organizationId,
  companyProfileId,
  maxSize = 500,
  className,
}: RepoUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [repoName, setRepoName] = useState('');

  const validateFile = useCallback((file: File): string | null => {
    if (!file.name.endsWith('.zip')) {
      return 'Only .zip files are allowed';
    }
    const maxBytes = maxSize * 1024 * 1024;
    if (file.size > maxBytes) {
      return `File size exceeds ${maxSize}MB limit`;
    }
    return null;
  }, [maxSize]);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setSuccess(false);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      const name = repoName || file.name.replace('.zip', '');
      
      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Simulate progress (in real implementation, use XMLHttpRequest for progress)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        await onUpload(file, { organizationId, companyProfileId, name });

        clearInterval(progressInterval);
        setUploadProgress(100);
        setSuccess(true);
        setRepoName('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, organizationId, companyProfileId, repoName, validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all',
        isDragging && 'border-primary border-2 bg-primary/5',
        className
      )}
    >
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="p-8"
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Icon */}
          <div
            className={cn(
              'rounded-full p-6 transition-colors',
              isDragging ? 'bg-primary/10' : 'bg-muted',
              success && 'bg-green-100',
              error && 'bg-red-100'
            )}
          >
            {success ? (
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            ) : error ? (
              <AlertCircle className="h-12 w-12 text-red-600" />
            ) : (
              <FileArchive className="h-12 w-12 text-muted-foreground" />
            )}
          </div>

          {/* Status Messages */}
          {isUploading ? (
            <div className="w-full max-w-md space-y-2">
              <p className="text-center text-sm font-medium">Uploading repository...</p>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-center text-xs text-muted-foreground">{uploadProgress}%</p>
            </div>
          ) : success ? (
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-green-600">Upload Successful!</h3>
              <p className="text-sm text-muted-foreground">Repository is being indexed...</p>
            </div>
          ) : error ? (
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-red-600">Upload Failed</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Upload Repository</h3>
                <p className="text-sm text-muted-foreground">
                  Drag and drop your repository ZIP file or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Maximum file size: {maxSize}MB
                </p>
              </div>

              {/* Repository Name Input */}
              <div className="w-full max-w-md">
                <input
                  type="text"
                  placeholder="Repository name (optional)"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isUploading}
                />
              </div>

              {/* Upload Button */}
              <div>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileInput}
                  className="hidden"
                  id="repo-upload-input"
                  disabled={isUploading}
                />
                <label htmlFor="repo-upload-input">
                  <Button asChild disabled={isUploading}>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Browse Files
                    </span>
                  </Button>
                </label>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

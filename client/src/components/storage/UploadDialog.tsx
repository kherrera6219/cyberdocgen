import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, RefreshCw } from "lucide-react";

interface UploadDialogProps {
  onUpload: (file: File, folder: string) => void;
  isUploading: boolean;
}

export function UploadDialog({ onUpload, isUploading }: UploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFolder, setUploadFolder] = useState("files");

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile, uploadFolder);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full h-24">
          <Upload className="h-8 w-8" />
          <span className="ml-2 text-lg">Upload File</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="file-upload-description">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription id="file-upload-description">
            Select a file to upload to your secure object storage
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload File
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

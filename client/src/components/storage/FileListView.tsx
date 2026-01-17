import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface FileListViewProps {
  files?: string[];
  title: string;
  icon: React.ReactNode;
  onDelete: (fileName: string) => void;
  isLoading?: boolean;
}

export function FileListView({ files, title, icon, onDelete, isLoading }: FileListViewProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
             <div className="space-y-2">
               <div className="animate-pulse bg-muted h-8 rounded"></div>
               <div className="animate-pulse bg-muted h-8 rounded"></div>
             </div>
        ) : files && files.length > 0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded border">
                <span className="text-sm truncate flex-1" title={file}>{file}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(file)}
                  className="text-red-500 hover:text-red-700"
                  aria-label={`Delete ${file}`}
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
}

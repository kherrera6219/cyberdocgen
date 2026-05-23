import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle } from "lucide-react";
import type { Document } from "@shared/schema";

interface RecentDocumentsProps {
  documents: Document[];
}

export function RecentDocuments({ documents }: RecentDocumentsProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="border-b border-gray-200 dark:border-gray-800">
        <CardTitle>Recent Documents</CardTitle>
      </CardHeader>

      <CardContent className="p-6 flex-1 flex flex-col">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 flex-1 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No Documents Yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
              You haven't generated any compliance documents. Run your first generation to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/80 rounded-lg border border-transparent hover:border-primary/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer" 
                data-testid={`document-item-${doc.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white dark:bg-gray-900 rounded-md shadow-sm">
                    <FileText className="w-5 h-5 text-primary/70" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{doc.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{doc.framework} &bull; {doc.category}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">Complete</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

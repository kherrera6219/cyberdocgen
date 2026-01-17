import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle } from "lucide-react";
import type { Document } from "@shared/schema";

interface RecentDocumentsProps {
  documents: Document[];
}

export function RecentDocuments({ documents }: RecentDocumentsProps) {
  if (documents.length === 0) return null;

  return (
    <Card>
      <CardHeader className="border-b border-gray-200">
        <CardTitle>Recent Documents</CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-4">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg" data-testid={`document-item-${doc.id}`}>
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-900">{doc.title}</h4>
                  <p className="text-sm text-gray-500">{doc.framework} - {doc.category}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                <span className="text-sm text-gray-500">Complete</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

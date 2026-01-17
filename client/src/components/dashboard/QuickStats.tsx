import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, FileText, Layers, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Document } from "@shared/schema";

interface QuickStatsProps {
  documents: Document[];
  completedDocs: number;
  activeFrameworks: number;
  nextApprovalDeadline: Date | null;
}

export function QuickStats({ documents, completedDocs, activeFrameworks, nextApprovalDeadline }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-accent dark:bg-gray-800">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-completion-rate">
                {documents.length > 0 ? Math.round((completedDocs / documents.length) * 100) : 0}%
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-accent/10 to-accent/20 rounded-lg flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary dark:bg-gray-800">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Documents Generated</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-documents-generated">{completedDocs}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary/10 to-primary/20 rounded-lg flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500 dark:bg-gray-800">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Active Frameworks</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-active-frameworks">{activeFrameworks}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-500/10 to-yellow-500/20 rounded-lg flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500 dark:bg-gray-800">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Next Deadline</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-next-deadline">
                {nextApprovalDeadline ? format(nextApprovalDeadline, "MMM d, yyyy") : "N/A"}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-500/10 to-red-500/20 rounded-lg flex items-center justify-center shadow-sm">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

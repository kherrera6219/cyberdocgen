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
      <Card className="hover:shadow-md hover:scale-[1.01] transition-all duration-300 border-l-4 border-l-accent bg-card/60 backdrop-blur-md">
        <CardContent className="p-4 sm:p-6 flex flex-col justify-between h-full">
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
          <div className="flex justify-between items-center mt-4 pt-2 border-t border-border/20">
            <span className="text-[9px] text-accent font-semibold bg-accent/10 px-1.5 py-0.5 rounded tracking-wide">Continuous Verification</span>
            <svg className="w-14 h-6 text-accent opacity-60 dark:opacity-40" viewBox="0 0 100 30" fill="none">
              <path d="M0,25 Q15,10 30,18 T60,8 T90,3 T100,5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md hover:scale-[1.01] transition-all duration-300 border-l-4 border-l-primary bg-card/60 backdrop-blur-md">
        <CardContent className="p-4 sm:p-6 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Documents Generated</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-documents-generated">{completedDocs}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary/10 to-primary/20 rounded-lg flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-2 border-t border-border/20">
            <span className="text-[9px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded tracking-wide">Policy Assets</span>
            <svg className="w-14 h-6 text-primary opacity-60 dark:opacity-40" viewBox="0 0 100 30" fill="none">
              <path d="M0,20 Q20,15 40,25 T70,5 T90,12 T100,2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md hover:scale-[1.01] transition-all duration-300 border-l-4 border-l-yellow-500 bg-card/60 backdrop-blur-md">
        <CardContent className="p-4 sm:p-6 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Active Frameworks</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-active-frameworks">{activeFrameworks}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-500/10 to-yellow-500/20 rounded-lg flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-2 border-t border-border/20">
            <span className="text-[9px] text-yellow-600 dark:text-yellow-400 font-semibold bg-yellow-500/10 px-1.5 py-0.5 rounded tracking-wide">Global Frameworks</span>
            <svg className="w-14 h-6 text-yellow-500 opacity-60 dark:opacity-40" viewBox="0 0 100 30" fill="none">
              <path d="M0,25 Q25,20 50,15 T75,10 T100,5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md hover:scale-[1.01] transition-all duration-300 border-l-4 border-l-red-500 bg-card/60 backdrop-blur-md">
        <CardContent className="p-4 sm:p-6 flex flex-col justify-between h-full">
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
          <div className="flex justify-between items-center mt-4 pt-2 border-t border-border/20">
            <span className="text-[9px] text-red-500 font-semibold bg-red-500/10 px-1.5 py-0.5 rounded tracking-wide">Audit Lifecycle</span>
            <svg className="w-14 h-6 text-red-500 opacity-60 dark:opacity-40" viewBox="0 0 100 30" fill="none">
              <path d="M0,10 Q20,25 40,10 T70,22 T90,5 T100,15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

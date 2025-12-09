import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOutput, FileText, FileSpreadsheet, Download, Clock } from "lucide-react";

export default function ExportCenter() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Export Center</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
          Export your compliance documents and reports in various formats
        </p>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">PDF Export</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Export documents as PDF files</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <Button className="w-full" data-testid="button-export-pdf">
              <Download className="h-4 w-4 mr-2" />
              Export to PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Excel Export</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Export data as spreadsheets</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <Button variant="outline" className="w-full" data-testid="button-export-excel">
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Exports */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <CardTitle className="text-base sm:text-lg">Recent Exports</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">Your recent export history</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FolderOutput className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No exports yet</p>
            <p className="text-xs text-muted-foreground mt-1">Your exported documents will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

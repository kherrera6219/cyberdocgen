import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Grid3X3, AlertTriangle, Shield, CheckCircle, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ControlStatus {
  controlId: string;
  framework: string;
  status: string;
  category?: string;
}

interface RiskCell {
  category: string;
  framework: string;
  riskLevel: "low" | "medium" | "high" | "critical" | "none";
  controlsImplemented: number;
  totalControls: number;
}

interface RiskHeatmapProps {
  className?: string;
}

const FRAMEWORKS = ["ISO 27001", "SOC 2", "NIST", "FedRAMP"];
const FRAMEWORK_KEYS = ["ISO27001", "SOC2", "NIST", "FedRAMP"];

const CATEGORIES = [
  "Access Control",
  "Data Protection",
  "Incident Response",
  "Risk Management",
  "Vendor Management",
];

function getRiskLevel(implemented: number, total: number): "low" | "medium" | "high" | "critical" | "none" {
  if (total === 0) return "none";
  const pct = (implemented / total) * 100;
  if (pct >= 80) return "low";
  if (pct >= 60) return "medium";
  if (pct >= 40) return "high";
  return "critical";
}

function getRiskBgColor(level: string) {
  switch (level) {
    case "low":      return "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800";
    case "medium":   return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800";
    case "high":     return "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800";
    case "critical": return "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800";
    default:         return "bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700";
  }
}

function getRiskDotColor(level: string) {
  switch (level) {
    case "low":      return "bg-green-500";
    case "medium":   return "bg-yellow-500";
    case "high":     return "bg-orange-500";
    case "critical": return "bg-red-500";
    default:         return "bg-gray-300";
  }
}

function getRiskIcon(level: string) {
  switch (level) {
    case "low":      return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />;
    case "medium":   return <Shield className="h-4 w-4 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />;
    case "high":
    case "critical": return <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" aria-hidden="true" />;
    default:         return <Info className="h-4 w-4 text-gray-400" aria-hidden="true" />;
  }
}

export function RiskHeatmap({ className }: RiskHeatmapProps) {
  // Fetch real control statuses for each framework
  const queries = FRAMEWORK_KEYS.map((fw) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery<{ success: boolean; data: ControlStatus[] }>({
      queryKey: [`/api/frameworks/${fw}/controls`],
      staleTime: 60_000,
    })
  );

  const isLoading = queries.some((q) => q.isLoading);
  const hasAnyData = queries.some(
    (q) => q.data?.data && q.data.data.length > 0
  );

  // Build the cell matrix from real data
  const cellMatrix: RiskCell[][] = CATEGORIES.map((category) =>
    FRAMEWORK_KEYS.map((fwKey, fwIdx) => {
      const controls: ControlStatus[] = queries[fwIdx].data?.data ?? [];
      // Filter by category if the control has category metadata; otherwise count all
      const categoryControls = controls.filter(
        (c) => !c.category || c.category.toLowerCase() === category.toLowerCase()
      );
      // Distribute total controls evenly across categories if no category tagging
      const total = controls.length > 0
        ? (categoryControls.length > 0 ? categoryControls.length : Math.ceil(controls.length / CATEGORIES.length))
        : 0;
      const implemented = categoryControls.filter(
        (c) => c.status === "implemented" || c.status === "complete" || c.status === "completed"
      ).length;

      return {
        category,
        framework: FRAMEWORKS[fwIdx],
        riskLevel: getRiskLevel(implemented, total),
        controlsImplemented: implemented,
        totalControls: total,
      };
    })
  );

  const allCells = cellMatrix.flat();
  const riskCounts = {
    low:      allCells.filter((c) => c.riskLevel === "low").length,
    medium:   allCells.filter((c) => c.riskLevel === "medium").length,
    high:     allCells.filter((c) => c.riskLevel === "high").length,
    critical: allCells.filter((c) => c.riskLevel === "critical").length,
  };

  const legendId = "risk-heatmap-legend";

  return (
    <Card className={`border-0 bg-white dark:bg-gray-800 shadow-lg ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
              <Grid3X3 className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900 dark:text-white">Risk Heatmap</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">Control gaps across frameworks</p>
            </div>
          </div>
          {hasAnyData && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200">
                Low: {riskCounts.low}
              </Badge>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200">
                Medium: {riskCounts.medium}
              </Badge>
              <Badge variant="outline" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200">
                High: {riskCounts.high}
              </Badge>
              <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200">
                Critical: {riskCounts.critical}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : !hasAnyData ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
              <Grid3X3 className="h-8 w-8 text-gray-400" aria-hidden="true" />
            </div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">No Control Data Yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Risk data will populate here once you start implementing compliance controls for your frameworks.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full"
              role="grid"
              aria-label="Risk heatmap showing control implementation status across compliance frameworks and security categories"
              aria-describedby={legendId}
            >
              <thead>
                <tr role="row">
                  <th
                    role="columnheader"
                    scope="col"
                    className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 pb-3 pr-4"
                  >
                    Category
                  </th>
                  {FRAMEWORKS.map((fw) => (
                    <th
                      key={fw}
                      role="columnheader"
                      scope="col"
                      className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 pb-3 px-2 min-w-[100px]"
                    >
                      {fw}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cellMatrix.map((row, rowIdx) => (
                  <tr key={CATEGORIES[rowIdx]} role="row">
                    <th
                      role="rowheader"
                      scope="row"
                      className="text-left text-sm font-medium text-gray-700 dark:text-gray-300 py-2 pr-4"
                    >
                      {CATEGORIES[rowIdx]}
                    </th>
                    {row.map((cell) => (
                      <td key={cell.framework} className="py-2 px-2" role="gridcell">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className={`w-full p-3 rounded-lg border cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${getRiskBgColor(cell.riskLevel)}`}
                              aria-label={`${cell.category} for ${cell.framework}: ${cell.totalControls === 0 ? "no data" : `${cell.controlsImplemented} of ${cell.totalControls} controls implemented, ${cell.riskLevel} risk`}`}
                              data-testid={`risk-cell-${cell.category.toLowerCase().replace(/ /g, "-")}-${cell.framework.toLowerCase().replace(/ /g, "-")}`}
                            >
                              <div className="flex items-center justify-center gap-1">
                                {getRiskIcon(cell.riskLevel)}
                                <span className="text-xs font-medium">
                                  {cell.totalControls === 0 ? "—" : `${cell.controlsImplemented}/${cell.totalControls}`}
                                </span>
                              </div>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <p className="font-medium">{cell.category} — {cell.framework}</p>
                              {cell.totalControls === 0
                                ? <p className="text-gray-400">No controls tracked yet</p>
                                : <p className="text-gray-400">{cell.controlsImplemented} of {cell.totalControls} controls implemented</p>
                              }
                              {cell.riskLevel !== "none" && (
                                <p className="capitalize text-xs mt-1">Risk: {cell.riskLevel}</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {hasAnyData && (
          <div
            id={legendId}
            className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            role="region"
            aria-label="Risk level legend"
          >
            <div className="flex items-center justify-between text-sm flex-wrap gap-2">
              <span className="text-gray-500 dark:text-gray-400">Legend:</span>
              <div className="flex items-center gap-4 flex-wrap" role="list">
                {(["low", "medium", "high", "critical"] as const).map((level) => (
                  <div key={level} className="flex items-center gap-2" role="listitem">
                    <div className={`w-3 h-3 rounded ${getRiskDotColor(level)}`} aria-hidden="true" />
                    <span className="text-gray-600 dark:text-gray-300 capitalize">
                      {level === "low" ? "Low (80%+)" : level === "medium" ? "Medium (60-79%)" : level === "high" ? "High (40-59%)" : "Critical (<40%)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

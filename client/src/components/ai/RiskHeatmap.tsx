import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Grid3X3, AlertTriangle, Shield, CheckCircle } from "lucide-react";

interface RiskCell {
  category: string;
  framework: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  controlsImplemented: number;
  totalControls: number;
  description: string;
}

interface RiskHeatmapProps {
  className?: string;
}

export function RiskHeatmap({ className }: RiskHeatmapProps) {
  const frameworks = ["ISO 27001", "SOC 2", "NIST", "FedRAMP"];
  const categories = [
    "Access Control",
    "Data Protection",
    "Incident Response",
    "Risk Management",
    "Vendor Management"
  ];

  const riskData: RiskCell[] = [
    { category: "Access Control", framework: "ISO 27001", riskLevel: "low", controlsImplemented: 9, totalControls: 10, description: "9 of 10 controls implemented" },
    { category: "Access Control", framework: "SOC 2", riskLevel: "medium", controlsImplemented: 7, totalControls: 10, description: "7 of 10 controls implemented" },
    { category: "Access Control", framework: "NIST", riskLevel: "medium", controlsImplemented: 6, totalControls: 10, description: "6 of 10 controls implemented" },
    { category: "Access Control", framework: "FedRAMP", riskLevel: "high", controlsImplemented: 5, totalControls: 10, description: "5 of 10 controls implemented" },
    { category: "Data Protection", framework: "ISO 27001", riskLevel: "medium", controlsImplemented: 7, totalControls: 10, description: "7 of 10 controls implemented" },
    { category: "Data Protection", framework: "SOC 2", riskLevel: "low", controlsImplemented: 8, totalControls: 10, description: "8 of 10 controls implemented" },
    { category: "Data Protection", framework: "NIST", riskLevel: "high", controlsImplemented: 4, totalControls: 10, description: "4 of 10 controls implemented" },
    { category: "Data Protection", framework: "FedRAMP", riskLevel: "medium", controlsImplemented: 6, totalControls: 10, description: "6 of 10 controls implemented" },
    { category: "Incident Response", framework: "ISO 27001", riskLevel: "high", controlsImplemented: 5, totalControls: 10, description: "5 of 10 controls implemented" },
    { category: "Incident Response", framework: "SOC 2", riskLevel: "medium", controlsImplemented: 6, totalControls: 10, description: "6 of 10 controls implemented" },
    { category: "Incident Response", framework: "NIST", riskLevel: "low", controlsImplemented: 8, totalControls: 10, description: "8 of 10 controls implemented" },
    { category: "Incident Response", framework: "FedRAMP", riskLevel: "critical", controlsImplemented: 3, totalControls: 10, description: "3 of 10 controls implemented" },
    { category: "Risk Management", framework: "ISO 27001", riskLevel: "low", controlsImplemented: 9, totalControls: 10, description: "9 of 10 controls implemented" },
    { category: "Risk Management", framework: "SOC 2", riskLevel: "low", controlsImplemented: 8, totalControls: 10, description: "8 of 10 controls implemented" },
    { category: "Risk Management", framework: "NIST", riskLevel: "medium", controlsImplemented: 7, totalControls: 10, description: "7 of 10 controls implemented" },
    { category: "Risk Management", framework: "FedRAMP", riskLevel: "high", controlsImplemented: 4, totalControls: 10, description: "4 of 10 controls implemented" },
    { category: "Vendor Management", framework: "ISO 27001", riskLevel: "medium", controlsImplemented: 6, totalControls: 10, description: "6 of 10 controls implemented" },
    { category: "Vendor Management", framework: "SOC 2", riskLevel: "high", controlsImplemented: 5, totalControls: 10, description: "5 of 10 controls implemented" },
    { category: "Vendor Management", framework: "NIST", riskLevel: "medium", controlsImplemented: 7, totalControls: 10, description: "7 of 10 controls implemented" },
    { category: "Vendor Management", framework: "FedRAMP", riskLevel: "low", controlsImplemented: 8, totalControls: 10, description: "8 of 10 controls implemented" }
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return "bg-green-500";
      case "medium": return "bg-yellow-500";
      case "high": return "bg-orange-500";
      case "critical": return "bg-red-500";
      default: return "bg-gray-300";
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case "low": return "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800";
      case "medium": return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800";
      case "high": return "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800";
      case "critical": return "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800";
      default: return "bg-gray-100 dark:bg-gray-800";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "low": return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "medium": return <Shield className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case "high": return <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      case "critical": return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default: return null;
    }
  };

  const getCell = (category: string, framework: string) => {
    return riskData.find(d => d.category === category && d.framework === framework);
  };

  const riskCounts = {
    low: riskData.filter(d => d.riskLevel === "low").length,
    medium: riskData.filter(d => d.riskLevel === "medium").length,
    high: riskData.filter(d => d.riskLevel === "high").length,
    critical: riskData.filter(d => d.riskLevel === "critical").length
  };

  return (
    <Card className={`border-0 bg-white dark:bg-gray-800 shadow-lg ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
              <Grid3X3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900 dark:text-white">Risk Heatmap</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">Control gaps across frameworks</p>
            </div>
          </div>
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
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 pb-3 pr-4">Category</th>
                {frameworks.map(fw => (
                  <th key={fw} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 pb-3 px-2 min-w-[100px]">
                    {fw}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category}>
                  <td className="text-sm font-medium text-gray-700 dark:text-gray-300 py-2 pr-4">
                    {category}
                  </td>
                  {frameworks.map(framework => {
                    const cell = getCell(category, framework);
                    if (!cell) return <td key={framework} />;
                    
                    return (
                      <td key={framework} className="py-2 px-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${getRiskBgColor(cell.riskLevel)}`}
                              data-testid={`risk-cell-${category.toLowerCase().replace(' ', '-')}-${framework.toLowerCase().replace(' ', '-')}`}
                            >
                              <div className="flex items-center justify-center gap-1">
                                {getRiskIcon(cell.riskLevel)}
                                <span className="text-xs font-medium">
                                  {cell.controlsImplemented}/{cell.totalControls}
                                </span>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <p className="font-medium">{category} - {framework}</p>
                              <p className="text-gray-400">{cell.description}</p>
                              <p className="capitalize text-xs mt-1">Risk: {cell.riskLevel}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm flex-wrap gap-2">
            <span className="text-gray-500 dark:text-gray-400">Legend:</span>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${getRiskColor("low")}`} />
                <span className="text-gray-600 dark:text-gray-300">Low (80%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${getRiskColor("medium")}`} />
                <span className="text-gray-600 dark:text-gray-300">Medium (60-79%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${getRiskColor("high")}`} />
                <span className="text-gray-600 dark:text-gray-300">High (40-59%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${getRiskColor("critical")}`} />
                <span className="text-gray-600 dark:text-gray-300">Critical (&lt;40%)</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

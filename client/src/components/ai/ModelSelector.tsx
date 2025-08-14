import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Brain, CheckCircle, Zap } from "lucide-react";

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  showHealth?: boolean;
}

interface AIHealth {
  openai: boolean;
  anthropic: boolean;
  overall: boolean;
}

export function ModelSelector({
  value,
  onValueChange,
  className,
  showHealth = true,
}: ModelSelectorProps) {
  const { data: models } = useQuery({
    queryKey: ["/api/ai/models"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: health } = useQuery<AIHealth>({
    queryKey: ["/api/ai/health"],
    staleTime: 30 * 1000, // 30 seconds
    enabled: showHealth,
    retry: false,
  });

  const modelOptions = [
    {
      value: "auto",
      label: "Auto-Select",
      description: "Automatically choose the best model for each document type",
      icon: <Zap className="h-4 w-4" />,
      available: true,
    },
    {
      value: "gpt-4o",
      label: "GPT-4o",
      description: "OpenAI's latest model - excellent for procedures and technical documentation",
      icon: <Brain className="h-4 w-4" />,
      available: health?.openai ?? true,
    },
    {
      value: "claude-sonnet-4",
      label: "Claude 4.0 Sonnet",
      description: "Anthropic's advanced model - superior for analysis and detailed policies",
      icon: <Brain className="h-4 w-4" />,
      available: health?.anthropic ?? true,
    },
  ];

  const selectedModel = modelOptions.find((m) => m.value === value);

  return (
    <TooltipProvider>
      <div className={className}>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              {selectedModel?.icon}
              <SelectValue placeholder="Select AI Model" />
              {showHealth && health && (
                <Badge variant={health.overall ? "default" : "destructive"} className="ml-auto h-5">
                  {health.overall ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                </Badge>
              )}
            </div>
          </SelectTrigger>
          <SelectContent>
            {modelOptions.map((model) => (
              <Tooltip key={model.value}>
                <TooltipTrigger asChild>
                  <SelectItem
                    value={model.value}
                    disabled={!model.available}
                    className="flex flex-col items-start p-3"
                  >
                    <div className="flex items-center gap-2 w-full">
                      {model.icon}
                      <span className="font-medium">{model.label}</span>
                      {showHealth && (
                        <Badge
                          variant={model.available ? "default" : "destructive"}
                          className="ml-auto h-4 text-xs"
                        >
                          {model.available ? "Available" : "Unavailable"}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p>{model.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </SelectContent>
        </Select>

        {showHealth && health && !health.overall && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4" />
              <span>AI services experiencing issues</span>
            </div>
            <div className="mt-1 text-xs text-red-600 dark:text-red-400">
              OpenAI: {health.openai ? "✓" : "✗"} | Anthropic: {health.anthropic ? "✓" : "✗"}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

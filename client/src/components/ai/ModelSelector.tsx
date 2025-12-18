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
import { AlertCircle, Brain, CheckCircle, XCircle, Zap, Sparkles, Cpu } from "lucide-react";

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  showHealth?: boolean;
}

interface AIHealth {
  openai: boolean;
  anthropic: boolean;
  google?: boolean;
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
    staleTime: 5 * 60 * 1000,
  });

  const { data: health } = useQuery<AIHealth>({
    queryKey: ["/api/ai/health"],
    staleTime: 30 * 1000,
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
      value: "gpt-5.1",
      label: "GPT-5.1",
      description: "OpenAI's flagship model - excellent for procedures and technical documentation",
      icon: <Brain className="h-4 w-4" />,
      available: health?.openai ?? true,
    },
    {
      value: "claude-opus-4.5",
      label: "Claude Opus 4.5",
      description: "Anthropic's latest model - superior for analysis and detailed policies",
      icon: <Sparkles className="h-4 w-4" />,
      available: health?.anthropic ?? true,
    },
    {
      value: "gemini-3.0-pro",
      label: "Gemini 3.0 Pro",
      description: "Google's advanced model - great for multimodal analysis and comprehensive reports",
      icon: <Cpu className="h-4 w-4" />,
      available: health?.google ?? true,
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
                          {model.available ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-sm">{model.description}</p>
                  {!model.available && (
                    <p className="text-xs text-destructive mt-1">
                      Currently unavailable
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            ))}
          </SelectContent>
        </Select>
      </div>
    </TooltipProvider>
  );
}

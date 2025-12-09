import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Wrench,
  Search,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Globe,
  Zap,
  ChevronRight,
  Code,
  FileJson,
  AlertCircle
} from "lucide-react";

interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: unknown;
  enum?: string[];
}

interface Tool {
  name: string;
  description: string;
  type: "internal" | "external" | "advanced";
  parameters: ToolParameter[];
  returns: {
    type: string;
    description: string;
  };
  requiresAuth: boolean;
  rateLimit?: {
    maxCalls: number;
    windowMs: number;
  };
}

interface ToolExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

export default function MCPTools() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [toolParams, setToolParams] = useState<Record<string, string>>({});
  const [executionResult, setExecutionResult] = useState<ToolExecutionResult | null>(null);

  const { data: toolsData, isLoading } = useQuery<{ success: boolean; count: number; tools: Tool[] }>({
    queryKey: ["/api/mcp/tools"],
  });

  const { data: healthData } = useQuery<{ success: boolean; status: string; toolsRegistered: number; agentsRegistered: number }>({
    queryKey: ["/api/mcp/health"],
  });

  const executeToolMutation = useMutation({
    mutationFn: async ({ toolName, parameters }: { toolName: string; parameters: Record<string, unknown> }) => {
      const response = await apiRequest(`/api/mcp/tools/${toolName}/execute`, "POST", {
        parameters,
      });
      return response as { success: boolean; result: ToolExecutionResult };
    },
    onSuccess: (data) => {
      setExecutionResult(data.result);
      if (data.result.success) {
        toast({
          title: "Tool Executed Successfully",
          description: `${selectedTool?.name} completed successfully`,
        });
      } else {
        toast({
          title: "Tool Execution Failed",
          description: data.result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Execution Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const tools = toolsData?.tools || [];
  
  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const internalTools = filteredTools.filter((t) => t.type === "internal");
  const externalTools = filteredTools.filter((t) => t.type === "external");

  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool);
    setToolParams({});
    setExecutionResult(null);
  };

  const handleExecuteTool = () => {
    if (!selectedTool) return;

    const params: Record<string, unknown> = {};
    selectedTool.parameters.forEach((param) => {
      const value = toolParams[param.name];
      if (value !== undefined && value !== "") {
        if (param.type === "number") {
          params[param.name] = parseFloat(value);
        } else if (param.type === "boolean") {
          params[param.name] = value === "true";
        } else {
          params[param.name] = value;
        }
      }
    });

    executeToolMutation.mutate({ toolName: selectedTool.name, parameters: params });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "internal":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "external":
        return <Globe className="h-4 w-4 text-green-500" />;
      default:
        return <Zap className="h-4 w-4 text-purple-500" />;
    }
  };

  const getTypeBadgeVariant = (type: string): "default" | "secondary" | "outline" => {
    switch (type) {
      case "internal":
        return "default";
      case "external":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <Wrench className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-page-title">MCP Tools</h1>
            <p className="text-sm text-muted-foreground">Browse and execute available compliance tools</p>
          </div>
        </div>
        {healthData && (
          <div className="flex items-center gap-2">
            <Badge variant={healthData.status === "healthy" ? "default" : "destructive"}>
              {healthData.status === "healthy" ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <XCircle className="h-3 w-3 mr-1" />
              )}
              {healthData.status}
            </Badge>
            <Badge variant="outline">{healthData.toolsRegistered} Tools</Badge>
            <Badge variant="outline">{healthData.agentsRegistered} Agents</Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Available Tools</CardTitle>
              <CardDescription>Select a tool to view details and execute</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-tools"
                />
              </div>

              <Tabs defaultValue="internal" className="w-full">
                <TabsList className="w-full flex flex-wrap h-auto">
                  <TabsTrigger value="internal" className="flex-1 text-xs sm:text-sm">
                    Internal ({internalTools.length})
                  </TabsTrigger>
                  <TabsTrigger value="external" className="flex-1 text-xs sm:text-sm">
                    External ({externalTools.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="internal" className="mt-3">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : internalTools.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No tools found</p>
                      ) : (
                        internalTools.map((tool) => (
                          <div
                            key={tool.name}
                            className={`p-3 rounded-lg cursor-pointer transition-colors hover-elevate ${
                              selectedTool?.name === tool.name
                                ? "bg-primary/10 border border-primary/20"
                                : "bg-muted/50"
                            }`}
                            onClick={() => handleToolSelect(tool)}
                            data-testid={`tool-item-${tool.name}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getTypeIcon(tool.type)}
                                <span className="font-medium text-sm">{tool.name}</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {tool.description}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="external" className="mt-3">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : externalTools.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No tools found</p>
                      ) : (
                        externalTools.map((tool) => (
                          <div
                            key={tool.name}
                            className={`p-3 rounded-lg cursor-pointer transition-colors hover-elevate ${
                              selectedTool?.name === tool.name
                                ? "bg-primary/10 border border-primary/20"
                                : "bg-muted/50"
                            }`}
                            onClick={() => handleToolSelect(tool)}
                            data-testid={`tool-item-${tool.name}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getTypeIcon(tool.type)}
                                <span className="font-medium text-sm">{tool.name}</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {tool.description}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selectedTool ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(selectedTool.type)}
                      <div>
                        <CardTitle className="text-lg">{selectedTool.name}</CardTitle>
                        <CardDescription>{selectedTool.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getTypeBadgeVariant(selectedTool.type)}>
                        {selectedTool.type}
                      </Badge>
                      {selectedTool.requiresAuth && (
                        <Badge variant="outline">
                          <Shield className="h-3 w-3 mr-1" />
                          Auth Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedTool.rateLimit && (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        Rate limited: {selectedTool.rateLimit.maxCalls} calls per{" "}
                        {Math.round(selectedTool.rateLimit.windowMs / 60000)} minutes
                      </AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Parameters
                    </h3>
                    {selectedTool.parameters.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No parameters required</p>
                    ) : (
                      <div className="space-y-4">
                        {selectedTool.parameters.map((param) => (
                          <div key={param.name} className="space-y-2">
                            <Label htmlFor={param.name} className="flex items-center gap-2">
                              {param.name}
                              <Badge variant="outline" className="text-xs">
                                {param.type}
                              </Badge>
                              {param.required && (
                                <Badge variant="destructive" className="text-xs">
                                  Required
                                </Badge>
                              )}
                            </Label>
                            <p className="text-xs text-muted-foreground">{param.description}</p>
                            {param.enum ? (
                              <select
                                id={param.name}
                                className="w-full px-3 py-2 border rounded-md bg-background"
                                value={toolParams[param.name] || ""}
                                onChange={(e) =>
                                  setToolParams((prev) => ({ ...prev, [param.name]: e.target.value }))
                                }
                                data-testid={`input-param-${param.name}`}
                              >
                                <option value="">Select {param.name}</option>
                                {param.enum.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <Input
                                id={param.name}
                                type={param.type === "number" ? "number" : "text"}
                                placeholder={param.default?.toString() || `Enter ${param.name}`}
                                value={toolParams[param.name] || ""}
                                onChange={(e) =>
                                  setToolParams((prev) => ({ ...prev, [param.name]: e.target.value }))
                                }
                                data-testid={`input-param-${param.name}`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">Returns</h4>
                      <p className="text-xs text-muted-foreground">
                        {selectedTool.returns.type}: {selectedTool.returns.description}
                      </p>
                    </div>
                    <Button
                      onClick={handleExecuteTool}
                      disabled={executeToolMutation.isPending}
                      className="gap-2"
                      data-testid="button-execute-tool"
                    >
                      {executeToolMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      Execute Tool
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {executionResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileJson className="h-5 w-5" />
                      Execution Result
                      {executionResult.success ? (
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                        {JSON.stringify(executionResult.data || executionResult.error, null, 2)}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="h-[500px] flex items-center justify-center">
              <div className="text-center">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Tool</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Choose a tool from the list to view its parameters and execute it
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

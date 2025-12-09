import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Bot, 
  Send, 
  User, 
  Loader2, 
  Sparkles, 
  FileText, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Wrench,
  MessageSquare,
  Brain
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  tools: string[];
  capabilities: string[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolCalls?: Array<{
    toolName: string;
    parameters: Record<string, unknown>;
  }>;
}

interface AgentResponse {
  success: boolean;
  response?: {
    content: string;
    toolCalls?: Array<{
      toolName: string;
      parameters: Record<string, unknown>;
    }>;
  };
  error?: string;
}

export default function AIAssistant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<string>("compliance-assistant");
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data: agentsData, isLoading: agentsLoading } = useQuery<{ success: boolean; agents: Agent[] }>({
    queryKey: ["/api/mcp/agents"],
  });

  const agents = agentsData?.agents || [];

  const executeAgentMutation = useMutation({
    mutationFn: async ({ agentId, prompt }: { agentId: string; prompt: string }) => {
      const response = await apiRequest(`/api/mcp/agents/${agentId}/execute`, "POST", {
        prompt,
        maxIterations: 5,
      });
      return response as AgentResponse;
    },
    onSuccess: (data) => {
      if (data.success && data.response) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response.content,
          timestamp: new Date(),
          toolCalls: data.response.toolCalls,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to get response from AI",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to connect to AI assistant",
        variant: "destructive",
      });
    },
  });

  const clearConversationMutation = useMutation({
    mutationFn: async (agentId: string) => {
      return apiRequest(`/api/mcp/agents/${agentId}/clear`, "POST");
    },
    onSuccess: () => {
      setMessages([]);
      toast({
        title: "Conversation Cleared",
        description: "Started a new conversation with the AI assistant.",
      });
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    executeAgentMutation.mutate({ agentId: selectedAgent, prompt: inputMessage });
    setInputMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case "compliance-assistant":
        return <Shield className="h-4 w-4" />;
      case "document-generator":
        return <FileText className="h-4 w-4" />;
      case "risk-assessment":
        return <AlertTriangle className="h-4 w-4" />;
      case "data-extractor":
        return <Brain className="h-4 w-4" />;
      case "compliance-chat":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const selectedAgentData = agents.find((a) => a.id === selectedAgent);

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-page-title">AI Assistant</h1>
            <p className="text-sm text-muted-foreground">Chat with AI-powered compliance experts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-full sm:w-[220px]" data-testid="select-agent">
              <SelectValue placeholder="Select an agent" />
            </SelectTrigger>
            <SelectContent>
              {agentsLoading ? (
                <SelectItem value="loading" disabled>Loading agents...</SelectItem>
              ) : (
                agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    <div className="flex items-center gap-2">
                      {getAgentIcon(agent.id)}
                      <span>{agent.name}</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => clearConversationMutation.mutate(selectedAgent)}
            disabled={clearConversationMutation.isPending || messages.length === 0}
            data-testid="button-clear-conversation"
          >
            <RefreshCw className={`h-4 w-4 ${clearConversationMutation.isPending ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        <Card className="lg:col-span-3 flex flex-col min-h-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Chat
            </CardTitle>
            <CardDescription>
              {selectedAgentData?.description || "Select an agent to start chatting"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 pr-4 min-h-[300px] max-h-[400px]" ref={scrollAreaRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Ask questions about compliance frameworks, request document analysis, 
                    or get help with your security documentation.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`rounded-lg p-3 max-w-[80%] ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.toolCalls && message.toolCalls.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/50">
                            <p className="text-xs font-medium mb-1 flex items-center gap-1">
                              <Wrench className="h-3 w-3" />
                              Tools Used:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {message.toolCalls.map((tc, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tc.toolName}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <p className="text-xs opacity-60 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      {message.role === "user" && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {executeAgentMutation.isPending && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="rounded-lg p-3 bg-muted">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <Separator className="my-4" />

            <div className="flex gap-2">
              <Textarea
                placeholder="Ask about compliance, request document analysis, or get help..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[60px] resize-none"
                disabled={executeAgentMutation.isPending}
                data-testid="input-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || executeAgentMutation.isPending}
                size="icon"
                className="h-[60px] w-[60px]"
                data-testid="button-send-message"
              >
                {executeAgentMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {getAgentIcon(selectedAgent)}
                Agent Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedAgentData ? (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Model</p>
                    <Badge variant="outline">{selectedAgentData.model}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Capabilities</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedAgentData.capabilities.map((cap) => (
                        <Badge key={cap} variant="secondary" className="text-xs">
                          {cap.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Available Tools ({selectedAgentData.tools.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedAgentData.tools.slice(0, 5).map((tool) => (
                        <Badge key={tool} variant="outline" className="text-xs">
                          {tool}
                        </Badge>
                      ))}
                      {selectedAgentData.tools.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{selectedAgentData.tools.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Select an agent to see details</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-left"
                onClick={() => setInputMessage("Analyze my company's compliance status")}
                data-testid="button-quick-action-1"
              >
                Analyze compliance status
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-left"
                onClick={() => setInputMessage("Generate a security policy document")}
                data-testid="button-quick-action-2"
              >
                Generate security policy
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-left"
                onClick={() => setInputMessage("What are the latest regulatory updates?")}
                data-testid="button-quick-action-3"
              >
                Get regulatory updates
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-left"
                onClick={() => setInputMessage("Perform a risk assessment for my organization")}
                data-testid="button-quick-action-4"
              >
                Run risk assessment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

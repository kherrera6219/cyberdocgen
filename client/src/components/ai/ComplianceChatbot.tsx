import { useState, useEffect, useRef } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Bot,
  Clock,
  FileText,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Send,
  Sparkles,
  User,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    framework?: string;
    confidence?: number;
    sources?: string[];
  };
}

interface ChatResponse {
  content: string;
  confidence: number;
  sources: string[];
  suggestions: string[];
  followUpQuestions: string[];
}

interface ChatbotProps {
  className?: string;
  defaultFramework?: string;
}

export function ComplianceChatbot({ className, defaultFramework }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedFramework, setSelectedFramework] = useState(defaultFramework || "general");
  const [sessionId, setSessionId] = useState<string>();
  const [csrfReady, setCsrfReady] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Pre-fetch CSRF token on mount to establish session
  const initCsrf = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/csrf-token', { credentials: 'include' });
      if (res.ok) {
        setCsrfReady(true);
        return true;
      }
    } catch (error) {
      console.warn('Failed to initialize CSRF token:', error);
    }
    return false;
  };

  useEffect(() => {
    initCsrf();
  }, []);

  // Suggested questions query
  const { data: suggestedQuestions } = useQuery({
    queryKey: ["/api/ai/chat/suggestions", selectedFramework],
    enabled: messages.length === 0,
  });

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (data: {
      message: string;
      framework?: string;
      sessionId?: string;
    }): Promise<ChatResponse> => {
      return apiRequest(`/api/ai/chat`, {
        method: "POST",
        body: data,
      });
    },
    onSuccess: (response: ChatResponse, variables) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + "-assistant",
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
        metadata: {
          framework: variables.framework,
          confidence: response.confidence,
          sources: response.sources,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Show confidence level if low
      if (response.confidence < 70) {
        toast({
          title: "Lower Confidence Response",
          description:
            "This response may need verification. Consider consulting additional sources.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Chat Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Ensure CSRF token is ready before sending
    if (!csrfReady) {
      const success = await initCsrf();
      if (!success) {
        toast({
          title: "Connection Issue",
          description: "Unable to establish a secure connection. Please refresh the page and try again.",
          variant: "destructive",
        });
        return;
      }
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString() + "-user",
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage("");

    // Send to AI
    chatMutation.mutate({
      message: currentMessage,
      framework: selectedFramework,
      sessionId,
    });
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(undefined);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(timestamp);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <Card className="flex flex-col flex-1 min-h-0">
        <CardHeader className="flex-shrink-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MessageSquare className="h-5 w-5" />
            <span className="hidden sm:inline">Compliance AI Assistant</span>
            <span className="sm:hidden">AI Assistant</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Ask questions about compliance frameworks, get personalized guidance, and receive actionable recommendations</span>
            <span className="sm:hidden">Get AI-powered compliance guidance</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 min-h-0 pt-0">
          {/* Framework Selection */}
          <div className="mb-3 flex-shrink-0">
            <label className="block text-xs sm:text-sm font-medium mb-1.5">Framework (Optional)</label>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                <SelectTrigger className="flex-1 min-w-0 text-xs sm:text-sm" data-testid="select-framework">
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Compliance</SelectItem>
                  <SelectItem value="iso27001">ISO 27001</SelectItem>
                  <SelectItem value="soc2">SOC 2</SelectItem>
                  <SelectItem value="fedramp">FedRAMP</SelectItem>
                  <SelectItem value="nist">NIST 800-53</SelectItem>
                </SelectContent>
              </Select>
              {messages.length > 0 && (
                <Button variant="outline" onClick={clearChat} size="sm" data-testid="button-clear-chat" className="flex-shrink-0">
                  <span className="hidden sm:inline">Clear Chat</span>
                  <span className="sm:hidden">Clear</span>
                </Button>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <Card className="flex-1 min-h-0 flex flex-col border-border/50">
            <ScrollArea className="flex-1 p-3 sm:p-4">
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center text-muted-foreground py-6 sm:py-8">
                    <Bot className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-base sm:text-lg font-medium text-foreground">Welcome to your AI Assistant!</p>
                    <p className="text-xs sm:text-sm mt-1">
                      <span className="hidden sm:inline">Ask me anything about cybersecurity compliance, frameworks, or implementation guidance.</span>
                      <span className="sm:hidden">Ask about compliance or get guidance.</span>
                    </p>
                  </div>

                  {/* Suggested Questions */}
                  {Array.isArray(suggestedQuestions) && suggestedQuestions.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 sm:mb-3 flex items-center gap-2 text-sm">
                          <Lightbulb className="h-4 w-4" />
                          Suggested Questions
                        </h4>
                        <div className="grid gap-2">
                          {Array.isArray(suggestedQuestions)
                            ? suggestedQuestions
                                .slice(0, 4)
                                .map((question: string, index: number) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSuggestedQuestion(question)}
                                    className="text-left justify-start h-auto p-2 sm:p-3 whitespace-normal text-xs sm:text-sm"
                                    data-testid={`button-suggested-question-${index}`}
                                  >
                                    <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                                    {question}
                                  </Button>
                                ))
                            : []}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 sm:gap-3 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                      data-testid={`message-${message.role}-${message.id}`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex-shrink-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                          </div>
                        </div>
                      )}

                      <div
                        className={`flex flex-col max-w-[85%] sm:max-w-[80%] ${
                          message.role === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`rounded-lg p-2.5 sm:p-3 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        </div>

                        {/* Message metadata */}
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-1 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {formatTimestamp(message.timestamp)}

                          {message.metadata?.confidence && (
                            <>
                              <Separator orientation="vertical" className="h-2.5 sm:h-3 hidden sm:block" />
                              <Badge
                                variant={message.metadata.confidence > 80 ? "default" : "secondary"}
                                className="text-[10px] sm:text-xs px-1.5 py-0"
                              >
                                {message.metadata.confidence}%
                              </Badge>
                            </>
                          )}

                          {message.metadata?.framework && (
                            <>
                              <Separator orientation="vertical" className="h-2.5 sm:h-3 hidden sm:block" />
                              <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0 hidden sm:inline-flex">
                                {message.metadata.framework}
                              </Badge>
                            </>
                          )}
                        </div>

                        {/* Sources */}
                        {message.metadata?.sources && message.metadata.sources.length > 0 && (
                          <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs">
                            <p className="text-muted-foreground mb-1">Sources:</p>
                            <div className="flex flex-wrap gap-1">
                              {message.metadata.sources.slice(0, 2).map((source, index) => (
                                <Badge key={index} variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0">
                                  <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                  <span className="truncate max-w-[80px] sm:max-w-none">{source}</span>
                                </Badge>
                              ))}
                              {message.metadata.sources.length > 2 && (
                                <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0">
                                  +{message.metadata.sources.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {message.role === "user" && (
                        <div className="flex-shrink-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center">
                            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {chatMutation.isPending && (
                    <div className="flex gap-2 sm:gap-3 justify-start">
                      <div className="flex-shrink-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary animate-pulse" />
                        </div>
                      </div>
                      <div className="bg-muted rounded-lg p-2.5 sm:p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                            <div
                              className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-xs sm:text-sm text-muted-foreground">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-border/50 p-2.5 sm:p-4 flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question..."
                  className="flex-1 text-sm"
                  disabled={chatMutation.isPending}
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || chatMutation.isPending}
                  size="icon"
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Brain, 
  FileText, 
  Lightbulb,
  Clock,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
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
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFramework, setSelectedFramework] = useState(defaultFramework || '');
  const [sessionId, setSessionId] = useState<string>();
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested questions query
  const { data: suggestedQuestions } = useQuery({
    queryKey: ['/api/ai/chat/suggestions', selectedFramework],
    enabled: messages.length === 0,
  });

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (data: { 
      message: string; 
      framework?: string; 
      sessionId?: string;
    }) => {
      return apiRequest(`/api/ai/chat`, {
        method: 'POST',
        body: data
      });
    },
    onSuccess: (response: ChatResponse, variables) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '-assistant',
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: {
          framework: variables.framework,
          confidence: response.confidence,
          sources: response.sources
        }
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Show confidence level if low
      if (response.confidence < 70) {
        toast({
          title: "Lower Confidence Response",
          description: "This response may need verification. Consider consulting additional sources.",
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

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');

    // Send to AI
    chatMutation.mutate({
      message: currentMessage,
      framework: selectedFramework,
      sessionId
    });
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(undefined);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Compliance AI Assistant
          </CardTitle>
          <CardDescription>
            Ask questions about compliance frameworks, get personalized guidance, and receive actionable recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Framework Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Focus Framework (Optional)
            </label>
            <div className="flex gap-2">
              <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select framework for context" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">General Compliance</SelectItem>
                  <SelectItem value="iso27001">ISO 27001</SelectItem>
                  <SelectItem value="soc2">SOC 2</SelectItem>
                  <SelectItem value="fedramp">FedRAMP</SelectItem>
                  <SelectItem value="nist">NIST 800-53</SelectItem>
                </SelectContent>
              </Select>
              {messages.length > 0 && (
                <Button variant="outline" onClick={clearChat} size="sm">
                  Clear Chat
                </Button>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <Card className="h-[500px] flex flex-col">
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center text-gray-500 py-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">Welcome to your AI Compliance Assistant!</p>
                    <p className="text-sm">Ask me anything about cybersecurity compliance, frameworks, or implementation guidance.</p>
                  </div>
                  
                  {/* Suggested Questions */}
                  {suggestedQuestions && suggestedQuestions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Suggested Questions
                      </h4>
                      <div className="grid gap-2">
                        {suggestedQuestions.slice(0, 4).map((question: string, index: number) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestedQuestion(question)}
                            className="text-left justify-start h-auto p-3 whitespace-normal"
                          >
                            <HelpCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                            {question}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Bot className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                      )}
                      
                      <div className={`flex flex-col max-w-[80%] ${
                        message.role === 'user' ? 'items-end' : 'items-start'
                      }`}>
                        <div className={`rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        
                        {/* Message metadata */}
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(message.timestamp)}
                          
                          {message.metadata?.confidence && (
                            <>
                              <Separator orientation="vertical" className="h-3" />
                              <Badge variant={message.metadata.confidence > 80 ? "default" : "secondary"} className="text-xs">
                                {message.metadata.confidence}% confidence
                              </Badge>
                            </>
                          )}
                          
                          {message.metadata?.framework && (
                            <>
                              <Separator orientation="vertical" className="h-3" />
                              <Badge variant="outline" className="text-xs">
                                {message.metadata.framework}
                              </Badge>
                            </>
                          )}
                        </div>
                        
                        {/* Sources */}
                        {message.metadata?.sources && message.metadata.sources.length > 0 && (
                          <div className="mt-2 text-xs">
                            <p className="text-gray-500 mb-1">Sources:</p>
                            <div className="flex flex-wrap gap-1">
                              {message.metadata.sources.map((source, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {source}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Loading indicator */}
                  {chatMutation.isPending && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
                        </div>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-500">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>
            
            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about compliance requirements, implementation guidance, or specific controls..."
                  className="flex-1"
                  disabled={chatMutation.isPending}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || chatMutation.isPending}
                  size="sm"
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
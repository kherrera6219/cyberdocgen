import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useDropzone } from "react-dropzone";
import {
  Bot,
  Send,
  User,
  Loader2,
  Sparkles,
  FileText,
  Shield,
  CheckCircle,
  RefreshCw,
  Wrench,
  MessageSquare,
  Brain,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Paperclip,
  Pencil,
  Upload,
  X,
  Image as ImageIcon,
  File,
  ChevronLeft,
  AlertTriangle,
  Eye,
  Trash2,
} from "lucide-react";
import { logger } from '@/utils/logger';

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  tools: string[];
  capabilities: string[];
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  preview?: string;
  content?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
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
  // const { user } = useAuth(); // User object not currently used in UI
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<string>("compliance-assistant");
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [canvasData, setCanvasData] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("chat");
  
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [displayedContent, setDisplayedContent] = useState<string>("");
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    if (typingMessageId) {
      const message = messages.find(m => m.id === typingMessageId);
      if (message && message.content) {
        let currentIndex = 0;
        const content = message.content;
        
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
        }
        
        typingIntervalRef.current = setInterval(() => {
          if (currentIndex < content.length) {
            const charsToAdd = Math.min(3, content.length - currentIndex);
            setDisplayedContent(content.substring(0, currentIndex + charsToAdd));
            currentIndex += charsToAdd;
          } else {
            if (typingIntervalRef.current) {
              clearInterval(typingIntervalRef.current);
            }
            setTypingMessageId(null);
            setDisplayedContent("");
          }
        }, 15);
      }
    }
    
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [typingMessageId, messages]);

  const { data: agentsData, isLoading: agentsLoading } = useQuery<{ success: boolean; agents: Agent[] }>({
    queryKey: ["/api/mcp/agents"],
  });

  const agents = agentsData?.agents || [];

  const executeAgentMutation = useMutation({
    mutationFn: async ({ agentId, prompt, attachments }: { agentId: string; prompt: string; attachments?: Attachment[] }) => {
      const response = await apiRequest(`/api/mcp/agents/${agentId}/execute`, "POST", {
        prompt,
        maxIterations: 5,
        attachments: attachments?.map(a => ({ name: a.name, type: a.type, content: a.content })),
      });
      return response as AgentResponse;
    },
    onSuccess: (data) => {
      if (data.success && data.response) {
        const messageId = crypto.randomUUID();
        const assistantMessage: Message = {
          id: messageId,
          role: "assistant",
          content: data.response.content,
          timestamp: new Date(),
          toolCalls: data.response.toolCalls,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        setTypingMessageId(messageId);
        setDisplayedContent("");
        
        if (voiceEnabled && data.response.content) {
          speakText(data.response.content);
        }
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
      setAttachments([]);
      setCanvasData(null);
      toast({
        title: "Conversation Cleared",
        description: "Started a new conversation with the AI assistant.",
      });
    },
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const id = crypto.randomUUID();
      
      let preview: string | undefined;
      let content: string | undefined;
      
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setAttachments(prev => prev.map(a => 
            a.id === id ? { ...a, content: base64 } : a
          ));
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'text/plain' || file.type === 'application/json') {
        content = await file.text();
      }
      
      const attachment: Attachment = {
        id,
        name: file.name,
        type: file.type,
        size: file.size,
        preview,
        content,
      };
      
      setAttachments(prev => [...prev, attachment]);
    }
    
    toast({
      title: "Files Added",
      description: `${acceptedFiles.length} file(s) ready to send.`,
    });
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    maxSize: 10 * 1024 * 1024,
    noClick: true,
    noKeyboard: true,
  });

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === id);
      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
      return prev.filter(a => a.id !== id);
    });
  };

  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice Not Supported",
        description: "Your browser doesn't support voice input. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript) {
        setInputMessage(prev => (prev + ' ' + transcript).trim());
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      logger.error('Speech recognition error:', event.error);
      setIsRecording(false);
      if (event.error !== 'no-speech') {
        toast({
          title: "Voice Error",
          description: `Recognition error: ${event.error}`,
          variant: "destructive",
        });
      }
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current.start();
    setIsRecording(true);
    toast({
      title: "Listening...",
      description: "Speak now. Click the microphone again to stop.",
    });
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    
    const cleanText = text.replace(/[#*`_]/g, '').substring(0, 1000);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() && attachments.length === 0) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputMessage || (attachments.length > 0 ? `[Sent ${attachments.length} file(s)]` : ''),
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    
    let prompt = inputMessage;
    if (canvasData) {
      prompt += "\n\n[Canvas drawing attached]";
    }
    if (attachments.length > 0) {
      prompt += `\n\n[Files attached: ${attachments.map(a => a.name).join(', ')}]`;
    }
    
    executeAgentMutation.mutate({ 
      agentId: selectedAgent, 
      prompt,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    
    setInputMessage("");
    setAttachments([]);
    setCanvasData(null);
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

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (type.includes('word')) return <FileText className="h-4 w-4 text-blue-500" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const selectedAgentData = agents.find((a) => a.id === selectedAgent);

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)]" {...getRootProps()}>
      <input {...getInputProps()} data-testid="input-file-dropzone" />
      
      {isDragActive && (
        <div className="fixed inset-0 bg-primary/10 border-2 border-dashed border-primary z-50 flex items-center justify-center">
          <div className="text-center bg-background p-8 rounded-lg shadow-lg">
            <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium">Drop files here</p>
            <p className="text-sm text-muted-foreground">PDF, DOCX, Images, TXT, JSON</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-page-title">AI Assistant</h1>
            <p className="text-sm text-muted-foreground">Chat with voice, upload files, or draw on canvas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={voiceEnabled ? "default" : "outline"}
            size="icon"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            title={voiceEnabled ? "Disable voice output" : "Enable voice output"}
            data-testid="button-toggle-voice-output"
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          {isSpeaking && (
            <Button
              variant="destructive"
              size="icon"
              onClick={stopSpeaking}
              title="Stop speaking"
              data-testid="button-stop-speaking"
            >
              <VolumeX className="h-4 w-4" />
            </Button>
          )}
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="chat" className="flex items-center gap-2" data-testid="tab-chat">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2" data-testid="tab-files">
            <Paperclip className="h-4 w-4" />
            Files {attachments.length > 0 && <Badge variant="secondary">{attachments.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="canvas" className="flex items-center gap-2" data-testid="tab-canvas">
            <Pencil className="h-4 w-4" />
            Canvas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 min-h-0 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
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
                <ScrollArea className="flex-1 pr-4 min-h-[250px] max-h-[350px]" ref={scrollAreaRef}>
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                      <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
                      <p className="text-sm text-muted-foreground max-w-md mb-4">
                        Ask questions, upload files, use voice input, or draw on the canvas.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <Badge variant="outline">Voice Input</Badge>
                        <Badge variant="outline">File Upload</Badge>
                        <Badge variant="outline">Image Analysis</Badge>
                        <Badge variant="outline">Canvas Drawing</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                          data-testid={`message-${message.id}`}
                        >
                          {message.role === "assistant" && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div className={`flex flex-col max-w-[80%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mb-2 flex flex-wrap gap-2">
                                {message.attachments.map((att) => (
                                  <div key={att.id} className="flex items-center gap-1 bg-muted rounded-md px-2 py-1 text-xs">
                                    {att.preview ? (
                                      <img src={att.preview} alt={att.name} className="h-5 w-5 object-cover rounded" />
                                    ) : (
                                      getFileIcon(att.type)
                                    )}
                                    <span className="truncate max-w-[80px]">{att.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div
                              className={`rounded-lg p-3 ${
                                message.role === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">
                                {message.id === typingMessageId ? (
                                  <>
                                    {displayedContent}
                                    <span className="inline-block w-2 h-4 bg-current animate-pulse ml-0.5" />
                                  </>
                                ) : (
                                  message.content
                                )}
                              </p>
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
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
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
                        <div className="flex gap-3" data-testid="typing-indicator">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary animate-pulse" />
                          </div>
                          <div className="rounded-lg p-3 bg-muted">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                              <span className="text-sm text-muted-foreground">AI is thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                {attachments.length > 0 && (
                  <div className="py-2 border-t">
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((att) => (
                        <div key={att.id} className="flex items-center gap-2 bg-muted rounded-md px-2 py-1 text-sm">
                          {att.preview ? (
                            <img src={att.preview} alt={att.name} className="h-6 w-6 object-cover rounded" />
                          ) : (
                            getFileIcon(att.type)
                          )}
                          <span className="truncate max-w-[100px]">{att.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => removeAttachment(att.id)}
                            data-testid={`button-remove-attachment-${att.id}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {canvasData && (
                  <div className="py-2 border-t">
                    <div className="flex items-center gap-2 bg-muted rounded-md px-2 py-1">
                      <Pencil className="h-4 w-4" />
                      <span className="text-sm">Canvas drawing attached</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-auto"
                        onClick={() => setCanvasData(null)}
                        data-testid="button-remove-canvas"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                <Separator className="my-3" />

                <div className="flex gap-2 items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = 'image/*,.pdf,.txt,.json,.docx,.doc';
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files) onDrop(Array.from(files));
                      };
                      input.click();
                    }}
                    title="Upload files"
                    data-testid="button-upload-file"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    variant={isRecording ? "destructive" : "outline"}
                    size="icon"
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                    title={isRecording ? "Stop recording" : "Start voice input"}
                    data-testid="button-voice-input"
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>

                  <Textarea
                    placeholder="Type a message, upload files, or use voice..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                    disabled={executeAgentMutation.isPending}
                    data-testid="input-message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={(!inputMessage.trim() && attachments.length === 0 && !canvasData) || executeAgentMutation.isPending}
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
                          {selectedAgentData.capabilities.slice(0, 4).map((cap) => (
                            <Badge key={cap} variant="secondary" className="text-xs">
                              {cap.replace(/_/g, " ")}
                            </Badge>
                          ))}
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
                    onClick={() => setInputMessage("Analyze the uploaded document for compliance gaps")}
                    data-testid="button-quick-action-3"
                  >
                    Analyze uploaded document
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="files" className="flex-1 min-h-0 mt-0">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                File Upload
              </CardTitle>
              <CardDescription>
                Upload documents for AI analysis. Supported formats: PDF, DOCX, images, TXT, JSON
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6 ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = 'image/*,.pdf,.txt,.json,.docx,.doc';
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) onDrop(Array.from(files));
                  };
                  input.click();
                }}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="outline">PDF</Badge>
                  <Badge variant="outline">DOCX</Badge>
                  <Badge variant="outline">Images</Badge>
                  <Badge variant="outline">TXT</Badge>
                  <Badge variant="outline">JSON</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-4">Max file size: 10MB</p>
              </div>

              {attachments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Uploaded Files ({attachments.length})</h4>
                  <div className="space-y-2">
                    {attachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        {att.preview ? (
                          <img src={att.preview} alt={att.name} className="h-10 w-10 object-cover rounded" />
                        ) : (
                          <div className="h-10 w-10 flex items-center justify-center bg-background rounded">
                            {getFileIcon(att.type)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{att.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(att.size)} - {att.type.split('/')[1] || att.type}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {att.preview && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={att.preview} target="_blank" rel="noopener noreferrer" data-testid={`button-view-${att.id}`}>
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAttachment(att.id)}
                            data-testid={`button-delete-${att.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="canvas" className="flex-1 min-h-0 mt-0">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pencil className="h-5 w-5" />
                  Drawing Canvas
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const ctx = canvasRef.current?.getContext('2d');
                      if (ctx && canvasRef.current) {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        setCanvasData(null);
                      }
                    }}
                    data-testid="button-clear-canvas"
                  >
                    Clear
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      if (canvasRef.current) {
                        const data = canvasRef.current.toDataURL('image/png');
                        setCanvasData(data);
                        setActiveTab('chat');
                        toast({
                          title: "Canvas Saved",
                          description: "Your drawing will be included with your next message.",
                        });
                      }
                    }}
                    data-testid="button-save-canvas"
                  >
                    Save & Use in Chat
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Draw diagrams, annotate screenshots, or sketch compliance workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg bg-white p-1">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={400}
                  className="w-full h-[400px] cursor-crosshair rounded"
                  style={{ touchAction: 'none' }}
                  onMouseDown={(e) => {
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    
                    const rect = canvas.getBoundingClientRect();
                    const scaleX = canvas.width / rect.width;
                    const scaleY = canvas.height / rect.height;
                    
                    ctx.beginPath();
                    ctx.moveTo(
                      (e.clientX - rect.left) * scaleX,
                      (e.clientY - rect.top) * scaleY
                    );
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      ctx.lineTo(
                        (moveEvent.clientX - rect.left) * scaleX,
                        (moveEvent.clientY - rect.top) * scaleY
                      );
                      ctx.stroke();
                    };
                    
                    const handleMouseUp = () => {
                      canvas.removeEventListener('mousemove', handleMouseMove);
                      canvas.removeEventListener('mouseup', handleMouseUp);
                      canvas.removeEventListener('mouseleave', handleMouseUp);
                    };
                    
                    canvas.addEventListener('mousemove', handleMouseMove);
                    canvas.addEventListener('mouseup', handleMouseUp);
                    canvas.addEventListener('mouseleave', handleMouseUp);
                  }}
                  data-testid="canvas-drawing"
                />
              </div>
              
              {canvasData && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-muted rounded-md">
                  <Pencil className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Canvas drawing ready to send</span>
                  <Badge variant="default" className="ml-auto">Saved</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

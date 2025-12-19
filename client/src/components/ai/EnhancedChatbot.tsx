import { useState, useEffect, useRef, useCallback } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { logger } from "@/utils/logger";
import {
  Bot,
  Clock,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Lightbulb,
  Mic,
  MicOff,
  MessageSquare,
  Paperclip,
  Pencil,
  Send,
  Sparkles,
  Upload,
  User,
  Volume2,
  VolumeX,
  X,
  FileUp,
  File,
  Trash2,
  Eye,
  Download,
} from "lucide-react";
import { useDropzone } from 'react-dropzone';

interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  preview?: string;
  content?: string;
  analysisResult?: any;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: ChatAttachment[];
  metadata?: {
    framework?: string;
    confidence?: number;
    sources?: string[];
    hasCanvas?: boolean;
    canvasData?: any;
  };
}

interface ChatResponse {
  content: string;
  confidence: number;
  sources: string[];
  suggestions: string[];
  followUpQuestions: string[];
}

interface EnhancedChatbotProps {
  className?: string;
  defaultFramework?: string;
}

export function EnhancedChatbot({ className, defaultFramework }: EnhancedChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedFramework, setSelectedFramework] = useState(defaultFramework || "general");
  const [sessionId, setSessionId] = useState<string>();
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [canvasData, setCanvasData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("chat");
  
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const { data: suggestedQuestions } = useQuery({
    queryKey: ["/api/ai/chat/suggestions", selectedFramework],
    enabled: messages.length === 0,
  });

  const chatMutation = useMutation({
    mutationFn: async (data: {
      message: string;
      framework?: string;
      sessionId?: string;
      attachments?: any[];
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

      if (voiceEnabled && response.content) {
        speakText(response.content);
      }

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

  const analyzeFileMutation = useMutation({
    mutationFn: async (file: ChatAttachment): Promise<any> => {
      return apiRequest(`/api/ai/analyze-document`, {
        method: "POST",
        body: {
          content: file.content || '',
          filename: file.name,
          framework: selectedFramework,
        },
      });
    },
    onSuccess: (result, file) => {
      setAttachments(prev => prev.map(a => 
        a.id === file.id ? { ...a, analysisResult: result } : a
      ));
      toast({
        title: "File Analyzed",
        description: `${file.name} has been analyzed successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const id = Date.now().toString() + "-" + file.name;
      
      let preview: string | undefined;
      let content: string | undefined;
      
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }
      
      if (file.type === 'text/plain' || file.type === 'application/json') {
        content = await file.text();
      }
      
      const attachment: ChatAttachment = {
        id,
        name: file.name,
        type: file.type,
        size: file.size,
        preview,
        content,
      };
      
      setAttachments(prev => [...prev, attachment]);
      
      if (file.type === 'text/plain' || file.type.includes('pdf') || file.type.includes('word')) {
        analyzeFileMutation.mutate(attachment);
      }
    }
  }, [selectedFramework]);

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

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputMessage(prev => prev + ' ' + transcript);
    };

    recognitionRef.current.onerror = (event: any) => {
      logger.error('Speech recognition error:', { error: event.error });
      setIsRecording(false);
      toast({
        title: "Voice Error",
        description: `Recognition error: ${event.error}`,
        variant: "destructive",
      });
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
    
    const utterance = new SpeechSynthesisUtterance(text);
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && attachments.length === 0) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + "-user",
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      metadata: canvasData ? { hasCanvas: true, canvasData } : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = inputMessage;
    const currentAttachments = attachments;
    setInputMessage("");
    setAttachments([]);
    setCanvasData(null);

    chatMutation.mutate({
      message: currentMessage,
      framework: selectedFramework,
      sessionId,
      attachments: currentAttachments.map(a => ({
        name: a.name,
        type: a.type,
        content: a.content,
        analysisResult: a.analysisResult,
      })),
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
    setAttachments([]);
    setCanvasData(null);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(timestamp);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (type.includes('word')) return <FileText className="h-4 w-4 text-blue-500" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Enhanced AI Assistant
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={voiceEnabled ? "default" : "outline"}
                size="icon"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                title={voiceEnabled ? "Disable voice output" : "Enable voice output"}
                data-testid="button-toggle-voice"
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
            </div>
          </CardTitle>
          <CardDescription>
            Upload files, use voice input, draw on canvas, and get AI-powered compliance guidance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

            <TabsContent value="chat" className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Focus Framework</label>
                <div className="flex gap-2">
                  <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                    <SelectTrigger className="flex-1" data-testid="select-framework">
                      <SelectValue placeholder="Select framework for context" />
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
                    <Button variant="outline" onClick={clearChat} size="sm" data-testid="button-clear-chat">
                      Clear Chat
                    </Button>
                  )}
                </div>
              </div>

              <Card className="h-[400px] flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="space-y-4">
                      <div className="text-center text-muted-foreground py-8">
                        <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Welcome to your Enhanced AI Assistant!</p>
                        <p className="text-sm">
                          Upload files, use voice, or type your compliance questions.
                        </p>
                      </div>

                      {Array.isArray(suggestedQuestions) && suggestedQuestions.length > 0 && (
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
                                data-testid={`button-suggestion-${index}`}
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
                            message.role === "user" ? "justify-end" : "justify-start"
                          }`}
                          data-testid={`message-${message.id}`}
                        >
                          {message.role === "assistant" && (
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <Bot className="h-4 w-4 text-primary" />
                              </div>
                            </div>
                          )}

                          <div
                            className={`flex flex-col max-w-[80%] ${
                              message.role === "user" ? "items-end" : "items-start"
                            }`}
                          >
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mb-2 flex flex-wrap gap-2">
                                {message.attachments.map((att) => (
                                  <div key={att.id} className="flex items-center gap-1 bg-muted rounded-md px-2 py-1 text-xs">
                                    {getFileIcon(att.type)}
                                    <span className="truncate max-w-[100px]">{att.name}</span>
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
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(message.timestamp)}

                              {message.metadata?.confidence && (
                                <>
                                  <Separator orientation="vertical" className="h-3" />
                                  <Badge
                                    variant={message.metadata.confidence > 80 ? "default" : "secondary"}
                                    className="text-xs"
                                  >
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

                            {message.metadata?.sources && message.metadata.sources.length > 0 && (
                              <div className="mt-2 text-xs">
                                <p className="text-muted-foreground mb-1">Sources:</p>
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

                          {message.role === "user" && (
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-primary-foreground" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {chatMutation.isPending && (
                        <div className="flex gap-3 justify-start">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                            </div>
                          </div>
                          <div className="bg-muted rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                              </div>
                              <span className="text-sm text-muted-foreground">AI is thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {attachments.length > 0 && (
                  <div className="border-t p-2">
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((att) => (
                        <div key={att.id} className="flex items-center gap-2 bg-muted rounded-md px-2 py-1 text-sm">
                          {att.preview ? (
                            <img src={att.preview} alt={att.name} className="h-6 w-6 object-cover rounded" />
                          ) : (
                            getFileIcon(att.type)
                          )}
                          <span className="truncate max-w-[120px]">{att.name}</span>
                          <span className="text-xs text-muted-foreground">{formatFileSize(att.size)}</span>
                          {att.analysisResult && (
                            <Badge variant="secondary" className="text-xs">Analyzed</Badge>
                          )}
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

                <div className="border-t p-4">
                  <div className="flex gap-2 items-end">
                    <div {...getRootProps()} className="cursor-pointer">
                      <input {...getInputProps()} data-testid="input-file-upload" />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title="Upload files"
                        data-testid="button-upload-file"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </div>

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
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Type a message, upload files, or use voice..."
                      className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                      disabled={chatMutation.isPending}
                      data-testid="input-chat-message"
                    />

                    <Button
                      onClick={handleSendMessage}
                      disabled={(!inputMessage.trim() && attachments.length === 0) || chatMutation.isPending}
                      size="icon"
                      data-testid="button-send-message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {isDragActive && (
                    <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10">
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="text-sm font-medium">Drop files here</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="files" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                  >
                    <input {...getInputProps()} data-testid="input-file-dropzone" />
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
                    <div className="mt-6">
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
                                {formatFileSize(att.size)} - {att.type}
                              </p>
                            </div>
                            {att.analysisResult && (
                              <Badge variant="default">Analyzed</Badge>
                            )}
                            {analyzeFileMutation.isPending && analyzeFileMutation.variables?.id === att.id && (
                              <Badge variant="secondary">Analyzing...</Badge>
                            )}
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

            <TabsContent value="canvas" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Drawing Canvas</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const ctx = canvasRef.current?.getContext('2d');
                            if (ctx && canvasRef.current) {
                              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                              setCanvasData(null);
                            }
                          }}
                          data-testid="button-clear-canvas"
                        >
                          Clear
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (canvasRef.current) {
                              const data = canvasRef.current.toDataURL('image/png');
                              setCanvasData(data);
                              toast({
                                title: "Canvas Saved",
                                description: "Your drawing will be included with your next message.",
                              });
                            }
                          }}
                          data-testid="button-save-canvas"
                        >
                          Save to Message
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg bg-white dark:bg-gray-900 p-1">
                      <canvas
                        ref={canvasRef}
                        width={600}
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
                          ctx.strokeStyle = '#000';
                          ctx.lineWidth = 2;
                          ctx.lineCap = 'round';
                          
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
                          };
                          
                          canvas.addEventListener('mousemove', handleMouseMove);
                          canvas.addEventListener('mouseup', handleMouseUp);
                        }}
                        data-testid="canvas-drawing"
                      />
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Draw diagrams, annotate screenshots, or sketch compliance workflows. 
                      Click "Save to Message" to include your drawing with your next chat message.
                    </p>
                    
                    {canvasData && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <Pencil className="h-4 w-4" />
                        <span className="text-sm">Canvas drawing ready to send</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-auto"
                          onClick={() => setCanvasData(null)}
                          data-testid="button-remove-canvas"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

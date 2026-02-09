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
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<string>("gemini-3-pro");
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
    // ... (voice recording logic)
  };

  const stopVoiceRecording = () => {
    // ... (voice recording logic)
  };

  const speakText = (text: string) => {
    // ... (text to speech logic)
  };

  const stopSpeaking = () => {
    // ... (text to speech logic)
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
      case "gemini-3-pro":
        return <Sparkles className="h-4 w-4 text-blue-500" />;
      case "compliance-assistant":
        return <Shield className="h-4 w-4" />;
      case "document-generator":
        return <FileText className="h-4 w-4" />;
      case "risk-assessment":
        return <AlertTriangle className="h-4 w-4" />;
      case "data-extractor":
        return <Brain className="h-4 w-4" />;
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

  // Add Gemini Pro to the list of agents
  const allAgents = [
    ...agents,
    {
      id: 'gemini-3-pro',
      name: 'Gemini 3 Pro',
      description: 'Powered by Google Gemini 3.0 Pro for advanced reasoning.',
      model: 'gemini-3-pro',
      tools: [],
      capabilities: ['Advanced Reasoning', 'Content Generation']
    }
  ];

  const selectedAgentData = allAgents.find((a) => a.id === selectedAgent);

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
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-full sm:w-[220px]" data-testid="select-agent">
              <SelectValue placeholder="Select an agent" />
            </SelectTrigger>
            <SelectContent>
              {agentsLoading ? (
                <SelectItem value="loading" disabled>Loading agents...</SelectItem>
              ) : (
                allAgents.map((agent) => (
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
          {/* ... other buttons */}
        </div>
      </div>

      {/* ... rest of the component */}
    </div>
  );
}

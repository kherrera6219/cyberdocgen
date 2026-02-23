import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  tools?: string[];
  availableTools?: string[];
  capabilities?: string[];
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

const MAX_ATTACHMENTS = 10;
const MAX_ATTACHMENT_CONTENT_CHARS = 2_000_000;
const MAX_TOTAL_ATTACHMENT_CONTENT_CHARS = 8_000_000;

const FRAMEWORK_CONTEXTS = [
  { value: "all-frameworks", label: "All Frameworks" },
  { value: "iso-27001", label: "ISO 27001" },
  { value: "soc-2", label: "SOC 2 Type II" },
  { value: "fedramp", label: "FedRAMP" },
  { value: "nist-800-53", label: "NIST 800-53" },
  { value: "gdpr", label: "GDPR" },
  { value: "hipaa", label: "HIPAA" },
  { value: "pci-dss", label: "PCI-DSS" },
] as const;

const QUICK_ACTIONS = [
  { label: "Generate Doc", prompt: "Generate a draft compliance policy document." },
  { label: "Analyze Gap", prompt: "Run a gap analysis and list top missing controls." },
  { label: "Risk Assessment", prompt: "Assess key compliance risks and propose remediations." },
] as const;

function createWelcomeMessage(): Message {
  return {
    id: `welcome-${crypto.randomUUID()}`,
    role: "assistant",
    content:
      "Hello. I am your compliance assistant. Ask questions, attach files, and choose a framework context for targeted guidance.",
    timestamp: new Date(),
  };
}

function getFrameworkLabel(value: string): string {
  return FRAMEWORK_CONTEXTS.find((option) => option.value === value)?.label ?? "All Frameworks";
}

export default function AIAssistant() {
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<string>("compliance-chat");
  const [selectedFramework, setSelectedFramework] = useState<string>("all-frameworks");
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => [createWelcomeMessage()]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isProcessingAttachments, setIsProcessingAttachments] = useState(false);
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
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const attachmentsRef = useRef<Attachment[]>([]);

  const revokeAttachmentPreviews = useCallback((items: Attachment[]) => {
    items.forEach((attachment) => {
      if (attachment.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
    });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      revokeAttachmentPreviews(attachmentsRef.current);
    };
  }, [revokeAttachmentPreviews]);

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

  const agents = useMemo(() => agentsData?.agents || [], [agentsData?.agents]);

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
      setMessages([createWelcomeMessage()]);
      setAttachments((prev) => {
        revokeAttachmentPreviews(prev);
        return [];
      });
      setCanvasData(null);
      setInputMessage("");
      setTypingMessageId(null);
      setDisplayedContent("");
      toast({
        title: "Conversation Cleared",
        description: "Started a new conversation with the AI assistant.",
      });
    },
  });

  const readFileAsDataUrl = useCallback((file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      return;
    }

    const availableSlots = MAX_ATTACHMENTS - attachments.length;
    if (availableSlots <= 0) {
      toast({
        title: "Attachment limit reached",
        description: `You can attach up to ${MAX_ATTACHMENTS} files per message.`,
        variant: "destructive",
      });
      return;
    }

    const filesToProcess = acceptedFiles.slice(0, availableSlots);
    if (acceptedFiles.length > filesToProcess.length) {
      toast({
        title: "Some files were skipped",
        description: `Only ${MAX_ATTACHMENTS} attachments are allowed.`,
      });
    }

    setIsProcessingAttachments(true);
    try {
      const existingContentChars = attachments.reduce(
        (sum, attachment) => sum + (attachment.content?.length ?? 0),
        0,
      );
      let runningContentChars = existingContentChars;
      let skippedPerAttachmentLimit = 0;
      let skippedTotalLimit = 0;
      let skippedReadFailures = 0;
      const processedAttachments: Attachment[] = [];

      for (const file of filesToProcess) {
        const id = crypto.randomUUID();
        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;

        let content: string | undefined;
        try {
          if (file.type === 'text/plain' || file.type === 'application/json') {
            content = await file.text();
          } else {
            // Encode binary formats (images, PDF, DOCX, DOC) as data URL for transport.
            content = await readFileAsDataUrl(file);
          }
        } catch (error) {
          logger.error("Failed to process dropped file", { fileName: file.name, error });
          if (preview) {
            URL.revokeObjectURL(preview);
          }
          skippedReadFailures += 1;
          continue;
        }

        const contentLength = content?.length ?? 0;
        if (contentLength > MAX_ATTACHMENT_CONTENT_CHARS) {
          if (preview) {
            URL.revokeObjectURL(preview);
          }
          skippedPerAttachmentLimit += 1;
          continue;
        }

        if (runningContentChars + contentLength > MAX_TOTAL_ATTACHMENT_CONTENT_CHARS) {
          if (preview) {
            URL.revokeObjectURL(preview);
          }
          skippedTotalLimit += 1;
          continue;
        }

        runningContentChars += contentLength;
        processedAttachments.push({
          id,
          name: file.name,
          type: file.type,
          size: file.size,
          preview,
          content,
        });
      }

      if (processedAttachments.length > 0) {
        setAttachments(prev => [...prev, ...processedAttachments]);
        toast({
          title: "Files Added",
          description: `${processedAttachments.length} file(s) ready to send.`,
        });
      }

      if (skippedPerAttachmentLimit > 0 || skippedTotalLimit > 0 || skippedReadFailures > 0) {
        const details: string[] = [];
        if (skippedPerAttachmentLimit > 0) {
          details.push(`${skippedPerAttachmentLimit} file(s) exceeded the per-file content limit.`);
        }
        if (skippedTotalLimit > 0) {
          details.push(`${skippedTotalLimit} file(s) exceeded the total content limit.`);
        }
        if (skippedReadFailures > 0) {
          details.push(`${skippedReadFailures} file(s) could not be read.`);
        }

        toast({
          title: "Some files were skipped",
          description: details.join(' '),
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessingAttachments(false);
    }
  }, [attachments, readFileAsDataUrl, toast]);

  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } = useDropzone({
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
        revokeAttachmentPreviews([attachment]);
      }
      return prev.filter(a => a.id !== id);
    });
  };

  const startVoiceRecording = () => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechRecognition =
      (window as Window & { webkitSpeechRecognition?: new () => any; SpeechRecognition?: new () => any }).SpeechRecognition
      || (window as Window & { webkitSpeechRecognition?: new () => any; SpeechRecognition?: new () => any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: "Voice input unavailable",
        description: "This browser does not support speech recognition.",
        variant: "destructive",
      });
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => {
        setIsRecording(true);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event: { message?: string; error?: string }) => {
        setIsRecording(false);
        toast({
          title: "Voice input failed",
          description: event?.message || event?.error || "Unable to capture voice input.",
          variant: "destructive",
        });
      };

      recognitionRef.current.onresult = (event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript?: string }>> }) => {
        const parts: string[] = [];
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const transcript = event.results[i]?.[0]?.transcript;
          if (transcript) {
            parts.push(transcript);
          }
        }

        const transcriptText = parts.join(" ").trim();
        if (transcriptText) {
          setInputMessage((prev) => [prev.trim(), transcriptText].filter(Boolean).join(" ").trim());
        }
      };
    }

    try {
      recognitionRef.current.start();
    } catch (error) {
      logger.error("Failed to start speech recognition", { error });
      setIsRecording(false);
      toast({
        title: "Voice input failed",
        description: "Unable to start recording.",
        variant: "destructive",
      });
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const speakText = (text: string) => {
    if (!text.trim()) {
      return;
    }
    if (!synthRef.current) {
      toast({
        title: "Voice output unavailable",
        description: "Speech synthesis is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast({
        title: "Voice output failed",
        description: "Could not play synthesized audio.",
        variant: "destructive",
      });
    };

    setIsSpeaking(true);
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, displayedContent, executeAgentMutation.isPending]);

  const handleSendMessage = () => {
    if (isProcessingAttachments) {
      toast({
        title: "Files still processing",
        description: "Please wait for attachments to finish loading before sending.",
      });
      return;
    }

    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage && attachments.length === 0) return;

    const messageAttachments = attachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      type: attachment.type,
      size: attachment.size,
    }));

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedMessage || (attachments.length > 0 ? `[Sent ${attachments.length} file(s)]` : ''),
      timestamp: new Date(),
      attachments: messageAttachments.length > 0 ? messageAttachments : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    
    let prompt = trimmedMessage;
    if (selectedFramework !== "all-frameworks") {
      const frameworkLabel = getFrameworkLabel(selectedFramework);
      prompt = `Framework context: ${frameworkLabel}\n\n${prompt}`.trim();
    }
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
    setAttachments((prev) => {
      revokeAttachmentPreviews(prev);
      return [];
    });
    setCanvasData(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isProcessingAttachments) {
      return;
    }
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
  const allAgents = useMemo(() => (
    agents.some((agent) => agent.id === 'gemini-3-pro')
      ? agents
      : [
          ...agents,
          {
            id: 'gemini-3-pro',
            name: 'Gemini 3 Pro',
            description: 'Powered by Google Gemini 3.0 Pro for advanced reasoning.',
            model: 'gemini-3-pro',
            tools: [],
            capabilities: ['Advanced Reasoning', 'Content Generation']
          }
        ]
  ), [agents]);

  useEffect(() => {
    if (allAgents.length === 0) {
      return;
    }
    const selectedExists = allAgents.some((agent) => agent.id === selectedAgent);
    if (!selectedExists) {
      setSelectedAgent(allAgents[0].id);
    }
  }, [allAgents, selectedAgent]);

  const selectedAgentData = allAgents.find((a) => a.id === selectedAgent);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4 md:p-6" {...getRootProps()}>
      <input {...getInputProps()} data-testid="input-file-dropzone" />

      {isDragActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-lg border-2 border-dashed border-primary bg-card p-8 text-center shadow-xl">
            <Upload className="mx-auto mb-3 h-10 w-10 text-primary" />
            <p className="text-lg font-semibold">Drop files to attach</p>
            <p className="text-sm text-muted-foreground">PDF, DOCX, TXT, JSON, images</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold" data-testid="text-page-title">AI Assistant</h1>
          <p className="text-sm text-muted-foreground">
            Chat with compliance-focused agents using file uploads and voice controls.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-full sm:w-[240px]" data-testid="select-agent">
              <SelectValue placeholder={agentsLoading ? "Loading agents..." : "Select an agent"} />
            </SelectTrigger>
            <SelectContent>
              {agentsLoading && (
                <SelectItem value="loading" disabled>Loading agents...</SelectItem>
              )}
              {!agentsLoading && allAgents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex items-center gap-2">
                    {getAgentIcon(agent.id)}
                    <span>{agent.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            onClick={() => clearConversationMutation.mutate(selectedAgent)}
            disabled={clearConversationMutation.isPending}
            data-testid="button-new-chat"
          >
            {clearConversationMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            New Chat
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">{selectedAgentData?.name || "AI Agent"}</p>
            <p className="text-xs text-muted-foreground">{selectedAgentData?.description || "No agent description available."}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(selectedAgentData?.capabilities || []).slice(0, 4).map((capability) => (
              <Badge key={capability} variant="secondary" className="text-[11px]">
                <CheckCircle className="mr-1 h-3 w-3" />
                {capability}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col gap-3">
        <TabsList className="w-fit">
          <TabsTrigger value="chat" data-testid="tab-chat">
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="canvas">
            <Pencil className="mr-2 h-4 w-4" />
            Agent Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-0 flex min-h-0 flex-1 flex-col">
          <Card className="flex min-h-0 flex-1 flex-col">
            <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-4">
              <ScrollArea className="min-h-0 flex-1 pr-2" ref={scrollAreaRef}>
                <div className="space-y-4" role="log" aria-live="polite" aria-label="AI assistant conversation">
                  {messages.map((message) => {
                    const isAssistant = message.role === "assistant";
                    const isTyping = typingMessageId === message.id;
                    const content = isTyping ? displayedContent : message.content;

                    return (
                      <div key={message.id} className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
                        <div
                          className={`max-w-[92%] space-y-2 rounded-xl border px-4 py-3 text-sm shadow-sm md:max-w-[80%] ${
                            isAssistant
                              ? "border-border bg-card"
                              : "border-primary/40 bg-primary/10"
                          }`}
                        >
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border bg-background">
                              {isAssistant ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                            </span>
                            <span>{isAssistant ? "Assistant" : "You"}</span>
                            <span>{message.timestamp.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                          </div>

                          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>

                          {message.attachments && message.attachments.length > 0 && (
                            <div className="space-y-1.5 rounded-md border bg-background/70 p-2">
                              {message.attachments.map((attachment) => (
                                <div key={attachment.id} className="flex items-center gap-2 text-xs">
                                  {getFileIcon(attachment.type)}
                                  <span className="truncate">{attachment.name}</span>
                                  <span className="text-muted-foreground">{formatFileSize(attachment.size)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {message.toolCalls && message.toolCalls.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {message.toolCalls.map((toolCall, index) => (
                                <Badge key={`${toolCall.toolName}-${index}`} variant="outline" className="text-[11px]">
                                  <Wrench className="mr-1 h-3 w-3" />
                                  {toolCall.toolName}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {executeAgentMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="max-w-[92%] space-y-2 rounded-xl border bg-card px-4 py-3 text-sm shadow-sm md:max-w-[80%]">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border bg-background">
                            <Bot className="h-3.5 w-3.5" />
                          </span>
                          <span>Assistant</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Analyzing request and drafting response...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <Separator />

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <Button
                      key={action.label}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setInputMessage(action.prompt)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>

                {attachments.length > 0 && (
                  <div className="grid gap-2 md:grid-cols-2">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {getFileIcon(attachment.type)}
                            <p className="truncate text-sm font-medium">{attachment.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {attachment.preview && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => window.open(attachment.preview, "_blank")}
                              aria-label={`Preview ${attachment.name}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => removeAttachment(attachment.id)}
                            aria-label={`Remove ${attachment.name}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Textarea
                  value={inputMessage}
                  onChange={(event) => setInputMessage(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about compliance..."
                  className="min-h-[110px] resize-y"
                  disabled={executeAgentMutation.isPending}
                  data-testid="textarea-message"
                />

                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={openFilePicker}
                      disabled={isProcessingAttachments || executeAgentMutation.isPending}
                    >
                      {isProcessingAttachments ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Paperclip className="mr-2 h-4 w-4" />
                      )}
                      Attach
                    </Button>

                    <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                      <SelectTrigger className="h-9 w-[190px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FRAMEWORK_CONTEXTS.map((framework) => (
                          <SelectItem key={framework.value} value={framework.value}>
                            {framework.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant={isRecording ? "default" : "outline"}
                      size="icon"
                      className="h-9 w-9"
                      onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                      aria-label={isRecording ? "Stop voice recording" : "Start voice recording"}
                    >
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>

                    <Button
                      type="button"
                      variant={voiceEnabled ? "default" : "outline"}
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => {
                        setVoiceEnabled((prev) => {
                          const next = !prev;
                          if (!next) {
                            stopSpeaking();
                          }
                          return next;
                        });
                      }}
                      aria-label={voiceEnabled ? "Disable voice playback" : "Enable voice playback"}
                    >
                      {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>

                    {isSpeaking && (
                      <Button type="button" variant="outline" size="sm" onClick={stopSpeaking}>
                        Stop Voice
                      </Button>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={executeAgentMutation.isPending || isProcessingAttachments || (!inputMessage.trim() && attachments.length === 0)}
                    data-testid="button-send-message"
                  >
                    {executeAgentMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="canvas" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getAgentIcon(selectedAgent)}
                {selectedAgentData?.name || "Selected Agent"}
              </CardTitle>
              <CardDescription>
                Review currently connected tools and capabilities for this assistant.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Model</p>
                <p className="font-medium">{selectedAgentData?.model || "Unknown"}</p>
              </div>

              <div>
                <p className="mb-2 text-muted-foreground">Capabilities</p>
                <div className="flex flex-wrap gap-2">
                  {(selectedAgentData?.capabilities || []).length > 0 ? (
                    (selectedAgentData?.capabilities || []).map((capability) => (
                      <Badge key={capability} variant="secondary">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        {capability}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No capabilities provided.</span>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-muted-foreground">Connected Tools</p>
                <div className="flex flex-wrap gap-2">
                  {(selectedAgentData?.availableTools || selectedAgentData?.tools || []).length > 0 ? (
                    (selectedAgentData?.availableTools || selectedAgentData?.tools || []).map((tool) => (
                      <Badge key={tool} variant="outline">
                        <Wrench className="mr-1 h-3 w-3" />
                        {tool}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No tools reported.</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => setActiveTab("chat")}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Chat
                </Button>
                <Button type="button" variant="outline" onClick={() => clearConversationMutation.mutate(selectedAgent)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset Conversation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

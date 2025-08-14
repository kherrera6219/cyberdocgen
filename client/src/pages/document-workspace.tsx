import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, 
  Download, 
  Edit3, 
  Eye, 
  Trash2, 
  Plus, 
  Search, 
  Filter,
  Bot,
  Users,
  Calendar,
  Star,
  Clock,
  CheckCircle,
  FileSpreadsheet,
  File,
  FileImage
} from "lucide-react";
import type { Document } from "@shared/schema";

// Mock data for documents - in real app this would come from API
const mockDocuments: Document[] = [
  {
    id: "doc-1",
    companyProfileId: "profile-1",
    createdBy: "user-1",
    title: "Information Security Policy",
    description: "Comprehensive information security policy document",
    framework: "ISO27001",
    subFramework: null,
    category: "policy",
    documentType: "pdf",
    content: "This document outlines our information security policy...",
    templateData: null,
    status: "approved",
    version: 2,
    tags: ["security", "policy", "iso27001"],
    fileName: "info-security-policy-v2.pdf",
    fileType: ".pdf",
    fileSize: 2048000,
    downloadUrl: "/downloads/info-security-policy-v2.pdf",
    aiGenerated: true,
    aiModel: "gpt-4",
    generationPrompt: "Generate an ISO 27001 compliant information security policy",
    reviewedBy: "user-2",
    reviewedAt: new Date("2024-08-01"),
    approvedBy: "user-3", 
    approvedAt: new Date("2024-08-10"),
    createdAt: new Date("2024-07-15"),
    updatedAt: new Date("2024-08-10"),
  },
  // Add more mock documents...
];

interface DocumentWorkspaceProps {
  organizationId?: string;
}

export default function DocumentWorkspace({ organizationId }: DocumentWorkspaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFramework, setSelectedFramework] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["/api/documents", organizationId],
    queryFn: () => mockDocuments, // Replace with actual API call
  });

  // Generate new document mutation
  const generateDocumentMutation = useMutation({
    mutationFn: async (data: {
      framework: string;
      category: string;
      title: string;
      description?: string;
    }) => {
      return apiRequest("/api/documents/generate", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Document Generated",
        description: "AI has successfully generated your document.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return apiRequest(`/api/documents/${documentId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Document Deleted",
        description: "Document has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.framework.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFramework = selectedFramework === "all" || doc.framework === selectedFramework;
    const matchesStatus = selectedStatus === "all" || doc.status === selectedStatus;
    
    return matchesSearch && matchesFramework && matchesStatus;
  });

  const getDocumentIcon = (documentType: string) => {
    switch (documentType) {
      case "excel":
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
      case "pdf":
        return <File className="h-5 w-5 text-red-600" />;
      case "word":
        return <FileText className="h-5 w-5 text-blue-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "complete":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Document Workspace
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage, edit, and collaborate on your compliance documents with AI assistance
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Framework Filter */}
            <Select value={selectedFramework} onValueChange={setSelectedFramework}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Frameworks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frameworks</SelectItem>
                <SelectItem value="ISO27001">ISO 27001</SelectItem>
                <SelectItem value="SOC2">SOC 2</SelectItem>
                <SelectItem value="FedRAMP-Low">FedRAMP Low</SelectItem>
                <SelectItem value="FedRAMP-Moderate">FedRAMP Moderate</SelectItem>
                <SelectItem value="FedRAMP-High">FedRAMP High</SelectItem>
                <SelectItem value="NIST-800-53">NIST 800-53</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>

            {/* Generate Document Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate New Document</DialogTitle>
                  <DialogDescription>
                    Use AI to generate a new compliance document based on your company profile
                  </DialogDescription>
                </DialogHeader>
                <GenerateDocumentForm 
                  onGenerate={(data) => generateDocumentMutation.mutate(data)}
                  isLoading={generateDocumentMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Document Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Total Documents</p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{documents.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">Approved</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {documents.filter(d => d.status === "approved").length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                    {documents.filter(d => d.status === "in_progress").length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">AI Generated</p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                    {documents.filter(d => d.aiGenerated).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getDocumentIcon(document.documentType)}
                    <div>
                      <CardTitle className="text-lg">{document.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {document.description}
                      </CardDescription>
                    </div>
                  </div>
                  {document.aiGenerated && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      <Bot className="h-3 w-3 mr-1" />
                      AI
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Document Info */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(document.status)}>
                      {document.status}
                    </Badge>
                    <span className="text-gray-600 dark:text-gray-400">v{document.version}</span>
                  </div>
                  <span className="text-gray-500">{formatFileSize(document.fileSize || 0)}</span>
                </div>

                {/* Framework and Category */}
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{document.framework}</Badge>
                  <Badge variant="outline">{document.category}</Badge>
                </div>

                {/* Tags */}
                {document.tags && document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {document.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {document.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{document.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Last Updated */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  Updated {document.updatedAt.toLocaleDateString()}
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDocument(document)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => deleteDocumentMutation.mutate(document.id)}
                    disabled={deleteDocumentMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
              No documents found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get started by generating your first compliance document
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Your First Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate New Document</DialogTitle>
                  <DialogDescription>
                    Use AI to generate a new compliance document based on your company profile
                  </DialogDescription>
                </DialogHeader>
                <GenerateDocumentForm 
                  onGenerate={(data) => generateDocumentMutation.mutate(data)}
                  isLoading={generateDocumentMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Document Preview Modal */}
        {selectedDocument && (
          <DocumentPreviewModal
            document={selectedDocument}
            onClose={() => setSelectedDocument(null)}
          />
        )}
      </div>
    </div>
  );
}

// Generate Document Form Component
function GenerateDocumentForm({ 
  onGenerate, 
  isLoading 
}: { 
  onGenerate: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    framework: "",
    category: "",
    title: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Framework</label>
        <Select value={formData.framework} onValueChange={(value) => setFormData(prev => ({...prev, framework: value}))}>
          <SelectTrigger>
            <SelectValue placeholder="Select framework" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ISO27001">ISO 27001:2022</SelectItem>
            <SelectItem value="SOC2">SOC 2 Type II</SelectItem>
            <SelectItem value="FedRAMP-Low">FedRAMP Low</SelectItem>
            <SelectItem value="FedRAMP-Moderate">FedRAMP Moderate</SelectItem>
            <SelectItem value="FedRAMP-High">FedRAMP High</SelectItem>
            <SelectItem value="NIST-800-53">NIST 800-53 Rev 5</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Document Category</label>
        <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({...prev, category: value}))}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="policy">Policy</SelectItem>
            <SelectItem value="procedure">Procedure</SelectItem>
            <SelectItem value="assessment">Assessment</SelectItem>
            <SelectItem value="template">Template</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="checklist">Checklist</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Document Title</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
          placeholder="e.g., Information Security Policy"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description (Optional)</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
          placeholder="Describe the document purpose and scope..."
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
        {isLoading ? "Generating..." : "Generate Document"}
      </Button>
    </form>
  );
}

// Document Preview Modal Component
function DocumentPreviewModal({ 
  document, 
  onClose 
}: { 
  document: Document;
  onClose: () => void;
}) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {document.title}
            <Badge className="bg-blue-100 text-blue-800">v{document.version}</Badge>
          </DialogTitle>
          <DialogDescription>
            {document.framework} • {document.category} • {document.status}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Document Content Preview */}
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
            <h4 className="font-medium mb-2">Content Preview</h4>
            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {document.content.substring(0, 500)}...
            </div>
          </div>

          {/* AI Generation Info */}
          {document.aiGenerated && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Bot className="h-4 w-4" />
                AI Generation Details
              </h4>
              <div className="space-y-2 text-sm">
                <div><strong>Model:</strong> {document.aiModel}</div>
                <div><strong>Prompt:</strong> {document.generationPrompt}</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button className="flex-1">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Document
            </Button>
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
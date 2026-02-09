import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Plus, 
  Edit3, 
  Eye, 
  Copy, 
  Trash2,
  Star,
  Download,
  Upload,
  Search,
  Filter,
  Book,
  Building,
  Settings
} from "lucide-react";

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  framework: string;
  category: string;
  content: string;
  variables: string[];
  isPublic: boolean;
  isFavorite: boolean;
  usageCount: number;
  createdBy: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().min(1, "Description is required"),
  framework: z.string().min(1, "Framework is required"),
  category: z.string().min(1, "Category is required"),
  content: z.string().min(1, "Template content is required"),
  isPublic: z.boolean(),
  variables: z.array(z.string()),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface DocumentTemplatesProps {
  framework?: string;
  category?: string;
  onSelectTemplate?: (template: DocumentTemplate) => void;
  mode?: "select" | "manage";
}

export function DocumentTemplates({ 
  framework, 
  category, 
  onSelectTemplate, 
  mode = "manage" 
}: DocumentTemplatesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFramework, setSelectedFramework] = useState(framework || "all");
  const [selectedCategory, setSelectedCategory] = useState(category || "all");
  const [showFavorites, setShowFavorites] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      description: "",
      framework: framework || "ISO27001",
      category: category || "policy",
      content: "",
      isPublic: false,
      variables: [],
    },
  });
  const watchedVariables = useWatch({ control: form.control, name: "variables" }) || [];

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery<DocumentTemplate[]>({
    queryKey: ["/api/document-templates"],
    queryFn: () => {
      // Mock data - replace with actual API call
      return [
        {
          id: "template-1",
          name: "Information Security Policy Template",
          description: "Comprehensive information security policy template compliant with ISO 27001 requirements",
          framework: "ISO27001",
          category: "policy",
          content: `# Information Security Policy

## 1. Purpose and Scope
This policy establishes the framework for securing {COMPANY_NAME}'s information assets...

## 2. Information Security Objectives
{COMPANY_NAME} is committed to:
- Protecting the confidentiality, integrity, and availability of information
- Complying with applicable legal and regulatory requirements
- Continually improving our information security management system

## 3. Roles and Responsibilities
### 3.1 Senior Management
Senior management shall:
- Demonstrate leadership and commitment to the ISMS
- Ensure information security policy is established and reviewed

### 3.2 Information Security Manager
The Information Security Manager ({ISO_CONTACT}) shall:
- Oversee the implementation of security controls
- Report on ISMS performance to senior management

## 4. Risk Management
{COMPANY_NAME} shall:
- Identify and assess information security risks
- Implement appropriate controls to treat identified risks
- Monitor and review risk treatment effectiveness

## 5. Incident Management
All security incidents shall be:
- Reported immediately to {SECURITY_EMAIL}
- Investigated and documented
- Used to improve security controls

## 6. Training and Awareness
All personnel shall:
- Receive information security awareness training
- Understand their security responsibilities
- Report suspected security incidents

## 7. Compliance
This policy shall be:
- Reviewed annually or when significant changes occur
- Communicated to all relevant personnel
- Available to interested parties as appropriate

---
Document Control:
- Version: 1.0
- Approved by: {CEO_NAME}
- Next Review: {REVIEW_DATE}
- Classification: Internal`,
          variables: [
            "COMPANY_NAME",
            "ISO_CONTACT", 
            "SECURITY_EMAIL",
            "CEO_NAME",
            "REVIEW_DATE"
          ],
          isPublic: true,
          isFavorite: true,
          usageCount: 45,
          createdBy: "System",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
        },
        {
          id: "template-2",
          name: "Access Control Procedure",
          description: "Detailed procedure for managing user access controls in accordance with ISO 27001",
          framework: "ISO27001",
          category: "procedure",
          content: `# Access Control Procedure

## 1. Purpose
This procedure defines the process for managing user access to {COMPANY_NAME}'s information systems...

## 2. User Registration
### 2.1 New User Access
- Access requests must be submitted via {TICKETING_SYSTEM}
- Approval required from line manager and data owner
- Minimum access principle applies

## 3. Privilege Management
### 3.1 Privileged Access
- Administrative access requires additional approval
- Regular review of privileged accounts
- Multi-factor authentication mandatory

## 4. User Access Review
- Quarterly access reviews conducted
- Annual privilege certification
- Immediate removal for terminated users`,
          variables: [
            "COMPANY_NAME",
            "TICKETING_SYSTEM"
          ],
          isPublic: true,
          isFavorite: false,
          usageCount: 23,
          createdBy: "System",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)
        }
      ];
    }
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      return apiRequest("/api/document-templates", {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Template Created",
        description: "Document template has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/document-templates"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return apiRequest(`/api/document-templates/${templateId}/favorite`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/document-templates"] });
    },
  });

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFramework = selectedFramework === "all" || template.framework === selectedFramework;
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesFavorites = !showFavorites || template.isFavorite;
    
    return matchesSearch && matchesFramework && matchesCategory && matchesFavorites;
  });

  const onSubmit = (data: TemplateFormData) => {
    createTemplateMutation.mutate(data);
  };

  const handleTemplateSelect = (template: DocumentTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/{([^}]+)}/g);
    return matches ? Array.from(new Set(matches.map(match => match.slice(1, -1)))) : [];
  };

  const handleContentChange = (content: string) => {
    const variables = extractVariables(content);
    form.setValue("variables", variables);
    form.setValue("content", content);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Document Templates
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {mode === "select" 
              ? "Choose a template to start your document"
              : "Manage your organization's document templates"
            }
          </p>
        </div>
        
        {mode === "manage" && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create Template</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Document Template</DialogTitle>
                <DialogDescription>
                  Create a reusable template for generating compliance documents
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Security Policy Template" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="framework"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Framework</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ISO27001">ISO 27001</SelectItem>
                              <SelectItem value="SOC2">SOC 2</SelectItem>
                              <SelectItem value="FedRAMP">FedRAMP</SelectItem>
                              <SelectItem value="NIST">NIST 800-53</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what this template is for and when to use it..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Content</FormLabel>
                        <FormDescription>
                          Use {"{VARIABLE_NAME}"} syntax for variables that will be replaced during generation
                        </FormDescription>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your template content here..."
                            className="min-h-[300px] font-mono text-sm"
                            value={field.value}
                            onChange={(e) => handleContentChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchedVariables.length > 0 && (
                    <div>
                      <FormLabel>Detected Variables</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {watchedVariables.map((variable, index) => (
                          <Badge key={index} variant="outline">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTemplateMutation.isPending}
                    >
                      {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedFramework} onValueChange={setSelectedFramework}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frameworks</SelectItem>
                <SelectItem value="ISO27001">ISO 27001</SelectItem>
                <SelectItem value="SOC2">SOC 2</SelectItem>
                <SelectItem value="FedRAMP">FedRAMP</SelectItem>
                <SelectItem value="NIST">NIST 800-53</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="policy">Policies</SelectItem>
                <SelectItem value="procedure">Procedures</SelectItem>
                <SelectItem value="standard">Standards</SelectItem>
                <SelectItem value="guideline">Guidelines</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showFavorites ? "default" : "outline"}
              onClick={() => setShowFavorites(!showFavorites)}
              className="flex items-center space-x-2"
            >
              <Star className={`h-4 w-4 ${showFavorites ? "fill-current" : ""}`} />
              <span>Favorites</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Loading templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No templates found</p>
          <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoriteMutation.mutate(template.id);
                    }}
                  >
                    <Star className={`h-4 w-4 ${template.isFavorite ? "fill-current text-yellow-500" : ""}`} />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{template.framework}</Badge>
                  <Badge variant="secondary">{template.category}</Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Used {template.usageCount} times</span>
                  <span>{template.variables.length} variables</span>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    {mode === "select" ? (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Use Template
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </>
                    )}
                  </Button>
                  
                  {mode === "manage" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

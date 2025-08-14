import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  FileText, 
  Brain, 
  Target, 
  Users, 
  Shield,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";

const generationSchema = z.object({
  framework: z.string().min(1, "Framework is required"),
  tone: z.enum(["formal", "business", "technical", "friendly"]),
  detailLevel: z.enum(["concise", "standard", "comprehensive", "detailed"]),
  audience: z.enum(["executives", "technical", "auditors", "general"]),
  includeSections: z.array(z.string()).min(1, "Select at least one section"),
  customInstructions: z.string().optional(),
  complianceLevel: z.number().min(1).max(5),
  includeExamples: z.boolean(),
  includeTemplates: z.boolean(),
  includeChecklists: z.boolean(),
  brandAlignment: z.boolean(),
});

type GenerationConfig = z.infer<typeof generationSchema>;

interface GenerationCustomizerProps {
  framework: string;
  onGenerate: (config: GenerationConfig) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const frameworkSections = {
  ISO27001: [
    { id: "context", label: "Context of the Organization", description: "Scope, stakeholders, and ISMS requirements" },
    { id: "leadership", label: "Leadership", description: "Management commitment and information security policy" },
    { id: "planning", label: "Planning", description: "Risk assessment and treatment, objectives" },
    { id: "support", label: "Support", description: "Resources, awareness, communication, documentation" },
    { id: "operation", label: "Operation", description: "Operational planning and control" },
    { id: "performance", label: "Performance Evaluation", description: "Monitoring, measurement, audit, review" },
    { id: "improvement", label: "Improvement", description: "Nonconformity, corrective action, continual improvement" },
    { id: "annex-a", label: "Annex A Controls", description: "114 security controls across 14 categories" }
  ],
  SOC2: [
    { id: "security", label: "Security", description: "Foundational security criteria for all SOC 2 reports" },
    { id: "availability", label: "Availability", description: "System operational and accessible when needed" },
    { id: "processing", label: "Processing Integrity", description: "System processing is complete, valid, accurate" },
    { id: "confidentiality", label: "Confidentiality", description: "Information protection from unauthorized access" },
    { id: "privacy", label: "Privacy", description: "Personal information collection, use, retention, disposal" }
  ],
  FedRAMP: [
    { id: "system-description", label: "System Description", description: "System architecture and boundaries" },
    { id: "control-implementation", label: "Control Implementation", description: "Security control implementation details" },
    { id: "risk-assessment", label: "Risk Assessment", description: "Risk analysis and threat modeling" },
    { id: "contingency-plan", label: "Contingency Plan", description: "Business continuity and disaster recovery" },
    { id: "security-assessment", label: "Security Assessment", description: "Testing and validation procedures" }
  ]
};

export function GenerationCustomizer({ framework, onGenerate, onCancel, isLoading }: GenerationCustomizerProps) {
  const [activeTab, setActiveTab] = useState("basic");

  const form = useForm<GenerationConfig>({
    resolver: zodResolver(generationSchema),
    defaultValues: {
      framework,
      tone: "business",
      detailLevel: "standard", 
      audience: "general",
      includeSections: frameworkSections[framework as keyof typeof frameworkSections]?.map(s => s.id) || [],
      customInstructions: "",
      complianceLevel: 3,
      includeExamples: true,
      includeTemplates: true,
      includeChecklists: true,
      brandAlignment: false,
    },
  });

  const onSubmit = (data: GenerationConfig) => {
    onGenerate(data);
  };

  const sections = frameworkSections[framework as keyof typeof frameworkSections] || [];
  const selectedSections = form.watch("includeSections");
  const complianceLevel = form.watch("complianceLevel");
  const detailLevel = form.watch("detailLevel");

  const getDetailLevelDescription = (level: string) => {
    switch (level) {
      case "concise": return "Essential requirements only (~10-15 pages per document)";
      case "standard": return "Standard detail with examples (~20-30 pages per document)";
      case "comprehensive": return "Detailed with templates and procedures (~40-60 pages per document)";
      case "detailed": return "Maximum detail with extensive guidance (~60+ pages per document)";
      default: return "";
    }
  };

  const getComplianceLevelDescription = (level: number) => {
    switch (level) {
      case 1: return "Basic compliance - minimum requirements";
      case 2: return "Standard compliance - common practices";
      case 3: return "Enhanced compliance - industry best practices";
      case 4: return "Advanced compliance - comprehensive controls";
      case 5: return "Maximum compliance - gold standard implementation";
      default: return "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Customize {framework} Document Generation</span>
          </CardTitle>
          <CardDescription>
            Configure how AI generates your compliance documentation to match your organization's needs and preferences.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="tone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Tone</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="formal">Formal - Traditional business language</SelectItem>
                              <SelectItem value="business">Business - Professional but approachable</SelectItem>
                              <SelectItem value="technical">Technical - IT and security focused</SelectItem>
                              <SelectItem value="friendly">Friendly - Accessible and clear</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="audience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Audience</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="executives">Executives - High-level overview</SelectItem>
                              <SelectItem value="technical">Technical Teams - Implementation details</SelectItem>
                              <SelectItem value="auditors">Auditors - Compliance evidence focus</SelectItem>
                              <SelectItem value="general">General Staff - Broad accessibility</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="detailLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detail Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="concise">Concise</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="comprehensive">Comprehensive</SelectItem>
                            <SelectItem value="detailed">Detailed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {getDetailLevelDescription(detailLevel)}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="complianceLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compliance Rigor Level: {complianceLevel}</FormLabel>
                        <FormControl>
                          <Slider
                            min={1}
                            max={5}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="w-full"
                          />
                        </FormControl>
                        <FormDescription>
                          {getComplianceLevelDescription(complianceLevel)}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="content" className="space-y-6">
                  <FormField
                    control={form.control}
                    name="includeSections"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Include Sections</FormLabel>
                        <FormDescription>
                          Select which sections to include in your generated documents
                        </FormDescription>
                        <div className="grid grid-cols-1 gap-3 mt-3">
                          {sections.map((section) => (
                            <div key={section.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                              <Checkbox
                                id={section.id}
                                checked={field.value?.includes(section.id)}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentValue, section.id]);
                                  } else {
                                    field.onChange(currentValue.filter((item) => item !== section.id));
                                  }
                                }}
                              />
                              <div className="grid gap-1.5 leading-none">
                                <Label htmlFor={section.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  {section.label}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {section.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center space-x-2 mt-3">
                          <Info className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-gray-600">
                            {selectedSections.length} of {sections.length} sections selected
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Additional Content Options</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="includeExamples"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Include Examples</FormLabel>
                              <FormDescription>
                                Add practical examples and use cases
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="includeTemplates"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Include Templates</FormLabel>
                              <FormDescription>
                                Add document templates and forms
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="includeChecklists"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Include Checklists</FormLabel>
                              <FormDescription>
                                Add implementation checklists
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="brandAlignment"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Brand Alignment</FormLabel>
                              <FormDescription>
                                Align with company branding and voice
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6">
                  <FormField
                    control={form.control}
                    name="customInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Instructions</FormLabel>
                        <FormDescription>
                          Provide specific instructions or requirements for document generation
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Example: Focus on cloud-native architectures, include specific vendor requirements, emphasize automated compliance monitoring..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="preview" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Generation Summary</CardTitle>
                      <CardDescription>
                        Review your configuration before generating documents
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Framework</Label>
                          <p className="text-sm text-gray-600">{framework}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Tone</Label>
                          <p className="text-sm text-gray-600 capitalize">{form.watch("tone")}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Detail Level</Label>
                          <p className="text-sm text-gray-600 capitalize">{form.watch("detailLevel")}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Audience</Label>
                          <p className="text-sm text-gray-600 capitalize">{form.watch("audience")}</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label className="text-sm font-medium">Selected Sections ({selectedSections.length})</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedSections.map((sectionId) => {
                            const section = sections.find(s => s.id === sectionId);
                            return section ? (
                              <Badge key={sectionId} variant="outline">
                                {section.label}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">Estimated Generation Time</p>
                          <p className="text-xs text-gray-600">
                            {selectedSections.length * 2}-{selectedSections.length * 4} minutes based on your configuration
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-between items-center pt-6 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <div className="flex space-x-2">
                  <Button 
                    type="submit" 
                    disabled={isLoading || selectedSections.length === 0}
                    className="min-w-32"
                  >
                    {isLoading ? (
                      "Generating..."
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Generate Documents
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
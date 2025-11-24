// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Settings, 
  Target, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap,
  Building,
  Shield,
  Users,
  FileText,
  BarChart3
} from "lucide-react";

interface IndustryConfig {
  id: string;
  name: string;
  description: string;
  primaryFrameworks: string[];
  specializations: string[];
  riskFactors: string[];
  complianceRequirements: string[];
  customPrompts: {
    documentGeneration: string;
    riskAssessment: string;
    complianceCheck: string;
  };
  modelPreferences: {
    preferred: 'openai' | 'anthropic';
    temperature: number;
    maxTokens: number;
    systemPrompts: string[];
  };
  configuration?: {
    name: string;
    description: string;
    primaryFrameworks: string[];
    specializations: string[];
    riskFactors: string[];
    modelPreferences: {
      preferred: 'openai' | 'anthropic';
      temperature: number;
      maxTokens: number;
    };
  };
}

interface FineTuningResult {
  configId: string;
  industryId: string;
  status: string;
  customPrompts: Record<string, string>;
  modelSettings: Record<string, any>;
  accuracy: number;
  lastUpdated: string;
}

interface RiskAssessment {
  riskScore: number;
  identifiedRisks: Array<{
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    mitigation: string;
  }>;
  recommendations: string[];
}

export function IndustrySpecialization() {
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [organizationContext, setOrganizationContext] = useState("");
  const [activeTab, setActiveTab] = useState("configure");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get available industry configurations
  const { data: industries, isLoading: industriesLoading } = useQuery<{ configurations: IndustryConfig[] }>({
    queryKey: ["/api/ai/industries"],
  });

  // Helper function to get industry name
  const getIndustryName = (industryId: string) => {
    return industries?.configurations?.find((i: IndustryConfig) => i.id === industryId)?.name || industryId;
  };

  // Get specific industry configuration
  const { data: industryConfig } = useQuery<IndustryConfig | undefined>({
    queryKey: ["/api/ai/industries", selectedIndustry],
    queryFn: () => apiRequest(`/api/ai/industries/${selectedIndustry}`),
    enabled: !!selectedIndustry,
  });

  // Create fine-tuning configuration mutation
  const createConfigMutation = useMutation({
    mutationFn: async (data: {
      industryId: string;
      requirements: string[];
      customInstructions?: string;
      priority: string;
    }) => {
      return apiRequest("/api/ai/fine-tune", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Configuration Created",
        description: `AI model fine-tuned with ${(data.result.accuracy * 100).toFixed(1)}% accuracy`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/industries"] });
    },
    onError: (error: any) => {
      toast({
        title: "Configuration Failed",
        description: error.message || "Failed to create fine-tuning configuration",
        variant: "destructive",
      });
    },
  });

  // Generate optimized document mutation
  const generateOptimizedMutation = useMutation({
    mutationFn: async (data: {
      documentType: string;
      context: Record<string, any>;
    }) => {
      return apiRequest("/api/ai/generate-optimized", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Document Generated",
        description: "Industry-optimized document generated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate optimized document",
        variant: "destructive",
      });
    },
  });

  // Assess industry risks mutation
  const assessRisksMutation = useMutation({
    mutationFn: async (data: {
      industryId: string;
      organizationContext: Record<string, any>;
    }) => {
      return apiRequest("/api/ai/assess-risks", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Risk Assessment Complete",
        description: "Industry-specific risk analysis completed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Assessment Failed",
        description: error.message || "Failed to assess industry risks",
        variant: "destructive",
      });
    },
  });

  const addRequirement = () => {
    if (newRequirement.trim() && !requirements.includes(newRequirement.trim())) {
      setRequirements([...requirements, newRequirement.trim()]);
      setNewRequirement("");
    }
  };

  const removeRequirement = (req: string) => {
    setRequirements(requirements.filter(r => r !== req));
  };

  const handleCreateConfiguration = () => {
    if (!selectedIndustry) {
      toast({
        title: "Industry Required",
        description: "Please select an industry before creating configuration",
        variant: "destructive",
      });
      return;
    }

    createConfigMutation.mutate({
      industryId: selectedIndustry,
      requirements,
      customInstructions: customInstructions || undefined,
      priority,
    });
  };

  const handleGenerateOptimized = () => {
    if (!selectedIndustry) {
      toast({
        title: "Industry Required",
        description: "Please select an industry first",
        variant: "destructive",
      });
      return;
    }

    generateOptimizedMutation.mutate({
      documentType: "compliance_policy",
      context: {
        industry: selectedIndustry,
        requirements,
        customInstructions,
      },
    });
  };

  const handleAssessRisks = () => {
    if (!selectedIndustry || !organizationContext.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select an industry and provide organization context",
        variant: "destructive",
      });
      return;
    }

    try {
      const context = JSON.parse(organizationContext);
      assessRisksMutation.mutate({
        industryId: selectedIndustry,
        organizationContext: context,
      });
    } catch (error) {
      toast({
        title: "Invalid Context",
        description: "Organization context must be valid JSON",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            AI Industry Specialization
          </h1>
          <p className="text-muted-foreground mt-2">
            Fine-tune AI models for industry-specific compliance and risk management
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          Advanced AI
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configure">Configure</TabsTrigger>
          <TabsTrigger value="industries">Industries</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="assess">Risk Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="configure" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Fine-Tuning Configuration
                </CardTitle>
                <CardDescription>
                  Create a custom AI configuration for your industry and requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="industry-select">Industry</Label>
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries?.configurations?.map((industry: IndustryConfig) => (
                        <SelectItem key={industry.id} value={industry.id}>
                          {industry.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="requirements">Specific Requirements</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      placeholder="Add a requirement..."
                      onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                    />
                    <Button onClick={addRequirement} variant="outline">
                      Add
                    </Button>
                  </div>
                  {requirements.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {requirements.map((req, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{req}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRequirement(req)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="instructions">Custom Instructions</Label>
                  <Textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Additional instructions for AI fine-tuning..."
                    className="min-h-[80px]"
                  />
                </div>

                <Button
                  onClick={handleCreateConfiguration}
                  disabled={!selectedIndustry || createConfigMutation.isPending}
                  className="w-full"
                >
                  {createConfigMutation.isPending ? "Creating..." : "Create Configuration"}
                </Button>
              </CardContent>
            </Card>

            {/* Industry Preview */}
            {industryConfig?.configuration && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {industryConfig.configuration.name}
                  </CardTitle>
                  <CardDescription>
                    {industryConfig.configuration.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Primary Frameworks</h4>
                    <div className="flex flex-wrap gap-1">
                      {industryConfig.configuration.primaryFrameworks.map((framework: string) => (
                        <Badge key={framework} variant="secondary">
                          {framework}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Specializations</h4>
                    <div className="flex flex-wrap gap-1">
                      {industryConfig.configuration.specializations.map((spec: string) => (
                        <Badge key={spec} variant="outline">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Key Risk Factors</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {industryConfig.configuration.riskFactors.map((risk: string) => (
                        <li key={risk} className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Model Preferences</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Preferred Model:</span>
                        <Badge variant={industryConfig.configuration.modelPreferences.preferred === 'anthropic' ? 'default' : 'secondary'}>
                          {industryConfig.configuration.modelPreferences.preferred === 'anthropic' ? 'Claude' : 'GPT-4'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Temperature:</span>
                        <span>{industryConfig.configuration.modelPreferences.temperature}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Tokens:</span>
                        <span>{industryConfig.configuration.modelPreferences.maxTokens}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="industries" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries?.configurations?.map((industry: IndustryConfig) => (
              <Card key={industry.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedIndustry(industry.id)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {industry.name}
                  </CardTitle>
                  <CardDescription>{industry.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium">Frameworks</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {industry.primaryFrameworks.slice(0, 3).map((framework) => (
                          <Badge key={framework} variant="secondary" className="text-xs">
                            {framework}
                          </Badge>
                        ))}
                        {industry.primaryFrameworks.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{industry.primaryFrameworks.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium">Specializations</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {industry.specializations.slice(0, 2).join(", ")}
                        {industry.specializations.length > 2 && "..."}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant={industry.modelPreferences.preferred === 'anthropic' ? 'default' : 'secondary'}>
                        {industry.modelPreferences.preferred === 'anthropic' ? 'Claude' : 'GPT-4'}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {industry.complianceRequirements.length} requirements
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Optimized Documents
              </CardTitle>
              <CardDescription>
                Create industry-specific compliance documents using fine-tuned AI models
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Selected Industry</Label>
                  <div className="mt-1 p-2 bg-muted rounded">
                    {selectedIndustry ? 
                       industries.configurations?.find((i: IndustryConfig) => i.id === selectedIndustry)?.name || selectedIndustry
                      : "No industry selected"
                    }
                  </div>
                </div>

                <div>
                  <Label>Requirements Count</Label>
                  <div className="mt-1 p-2 bg-muted rounded">
                    {requirements.length} specific requirements
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerateOptimized}
                disabled={!selectedIndustry || generateOptimizedMutation.isPending}
                className="w-full"
              >
                {generateOptimizedMutation.isPending ? "Generating..." : "Generate Optimized Document"}
              </Button>

              {generateOptimizedMutation.data?.success && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Generated Document</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded max-h-96 overflow-auto">
                      {generateOptimizedMutation.data.content}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assess" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Risk Assessment Configuration
                </CardTitle>
                <CardDescription>
                  Assess industry-specific risks for your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Selected Industry</Label>
                  <div className="mt-1 p-2 bg-muted rounded">
                    {selectedIndustry ? 
                       industries.configurations?.find((i: IndustryConfig) => i.id === selectedIndustry)?.name || selectedIndustry
                      : "No industry selected"
                    }
                  </div>
                </div>

                <div>
                  <Label htmlFor="org-context">Organization Context (JSON)</Label>
                  <Textarea
                    id="org-context"
                    value={organizationContext}
                    onChange={(e) => setOrganizationContext(e.target.value)}
                    placeholder='{"size": "medium", "sector": "healthcare", "employees": 500, "dataTypes": ["PHI", "financial"]}'
                    className="min-h-[100px] font-mono text-sm"
                  />
                </div>

                <Button
                  onClick={handleAssessRisks}
                  disabled={!selectedIndustry || !organizationContext.trim() || assessRisksMutation.isPending}
                  className="w-full"
                >
                  {assessRisksMutation.isPending ? "Assessing..." : "Assess Industry Risks"}
                </Button>
              </CardContent>
            </Card>

            {assessRisksMutation.data?.success && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Risk Assessment Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Overall Risk Score</span>
                      <Badge variant={assessRisksMutation.data.assessment.riskScore > 70 ? 'destructive' : 
                                   assessRisksMutation.data.assessment.riskScore > 40 ? 'default' : 'secondary'}>
                        {assessRisksMutation.data.assessment.riskScore}/100
                      </Badge>
                    </div>
                    <Progress value={assessRisksMutation.data.assessment.riskScore} className="h-2" />
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Identified Risks</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {assessRisksMutation.data.assessment.identifiedRisks.map((risk: any, index: number) => (
                        <div key={index} className="p-3 border rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{risk.category}</span>
                            <Badge variant="outline" className={getSeverityColor(risk.severity)}>
                              {risk.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{risk.description}</p>
                          <p className="text-xs"><strong>Mitigation:</strong> {risk.mitigation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="text-sm space-y-1">
                      {assessRisksMutation.data.assessment.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
// @ts-nocheck
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Building,
  Cloud,
  Shield,
  Check,
  Loader2,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Eye,
  Download,
} from "lucide-react";
import { logger } from '@/utils/logger';

const formSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.string().min(1, "Please select an industry"),
  companySize: z.string().min(1, "Please select company size"),
  headquarters: z.string().min(2, "Headquarters location is required"),
  cloudProviders: z.array(z.string()).min(1, "Select at least one cloud provider"),
  dataClassification: z.string().min(1, "Please select data classification"),
  businessApplications: z.string().min(10, "Please describe your business applications"),
  frameworks: z.array(z.string()).min(1, "Select at least one compliance framework"),
  soc2TrustPrinciples: z.array(z.string()).optional(),
  fedRampLevel: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Retail",
  "Other",
];

const COMPANY_SIZES = [
  "1-50",
  "51-200",
  "201-1000",
  "1001-5000",
  "5000+",
];

const CLOUD_PROVIDERS = [
  { id: "aws", label: "AWS" },
  { id: "azure", label: "Azure" },
  { id: "gcp", label: "GCP" },
  { id: "private", label: "Private Cloud" },
  { id: "hybrid", label: "Hybrid" },
];

const DATA_CLASSIFICATIONS = [
  "Public",
  "Internal",
  "Confidential",
  "Highly Confidential",
];

const FRAMEWORKS = [
  { id: "iso27001", label: "ISO 27001" },
  { id: "soc2", label: "SOC 2 Type 2" },
  { id: "fedramp", label: "FedRAMP" },
  { id: "nist-csf", label: "NIST CSF" },
];

const SOC2_TRUST_PRINCIPLES = [
  { id: "security", label: "Security" },
  { id: "availability", label: "Availability" },
  { id: "processing-integrity", label: "Processing Integrity" },
  { id: "confidentiality", label: "Confidentiality" },
  { id: "privacy", label: "Privacy" },
];

const FEDRAMP_LEVELS = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
];

const STEPS = [
  { id: 1, title: "Company Basics", icon: Building },
  { id: 2, title: "Infrastructure", icon: Cloud },
  { id: 3, title: "Frameworks", icon: Shield },
  { id: 4, title: "Review", icon: FileText },
  { id: 5, title: "Results", icon: Check },
];

interface GenerationJob {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  documentsGenerated: number;
  totalDocuments: number;
  currentDocument?: string;
  errorMessage?: string;
  completedAt?: string;
}

interface GeneratedDocument {
  id: string;
  title: string;
  framework: string;
  status: string;
  content: string;
  aiGenerated: boolean;
  aiModel: string;
}

export default function AIDocGenerator() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [jobId, setJobId] = useState<string | null>(null);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<GeneratedDocument | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      industry: "",
      companySize: "",
      headquarters: "",
      cloudProviders: [],
      dataClassification: "",
      businessApplications: "",
      frameworks: [],
      soc2TrustPrinciples: [],
      fedRampLevel: "",
    },
  });

  const watchedFrameworks = form.watch("frameworks");

  const { data: jobStatus } = useQuery<GenerationJob>({
    queryKey: ["/api/ai/generation-jobs", jobId],
    enabled: !!jobId && currentStep === 5,
    refetchInterval: (query) => {
      if (!query.state.data) return 2000;
      return query.state.data.status === "running" ? 2000 : false;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("/api/ai/generate-compliance-docs", "POST", {
        companyInfo: {
          companyName: data.companyName,
          industry: data.industry,
          companySize: data.companySize,
          headquarters: data.headquarters,
          cloudProviders: data.cloudProviders,
          dataClassification: data.dataClassification,
          businessApplications: data.businessApplications,
        },
        frameworks: data.frameworks,
        soc2Options: data.soc2TrustPrinciples?.length ? {
          trustPrinciples: data.soc2TrustPrinciples
        } : undefined,
        fedrampOptions: data.fedRampLevel ? {
          impactLevel: data.fedRampLevel
        } : undefined
      });
    },
    onSuccess: (response) => {
      setJobId(response.jobId);
      setCurrentStep(5);
      toast({
        title: "Generation Started",
        description: "Your compliance documents are being generated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (jobStatus?.status === "completed") {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      fetchGeneratedDocs();
    }
  }, [jobStatus?.status]);

  const fetchGeneratedDocs = async () => {
    try {
      const docs = await apiRequest("/api/documents?aiGenerated=true");
      setGeneratedDocs(docs.slice(-10));
    } catch (error) {
      logger.error("Failed to fetch documents:", error);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ["companyName", "industry", "companySize", "headquarters"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["cloudProviders", "dataClassification", "businessApplications"];
    } else if (currentStep === 3) {
      fieldsToValidate = ["frameworks"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleGenerate = () => {
    form.handleSubmit((data) => {
      generateMutation.mutate(data);
    })();
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;

        return (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : isCompleted
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-muted-foreground/30 bg-background text-muted-foreground"
              }`}
              data-testid={`step-indicator-${step.id}`}
            >
              {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            <span
              className={`ml-2 text-sm font-medium hidden md:inline ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.title}
            </span>
            {index < STEPS.length - 1 && (
              <div
                className={`w-8 md:w-16 h-0.5 mx-2 ${
                  isCompleted ? "bg-green-500" : "bg-muted-foreground/30"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          Company Basics
        </CardTitle>
        <CardDescription>
          Enter your company information to personalize the compliance documents.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your company name"
                  data-testid="input-company-name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industry</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-industry">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem
                      key={industry}
                      value={industry}
                      data-testid={`option-industry-${industry.toLowerCase()}`}
                    >
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companySize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Size</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-company-size">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {COMPANY_SIZES.map((size) => (
                    <SelectItem
                      key={size}
                      value={size}
                      data-testid={`option-size-${size}`}
                    >
                      {size} employees
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="headquarters"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Headquarters Location</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., San Francisco, CA, USA"
                  data-testid="input-headquarters"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="w-5 h-5" />
          Infrastructure & Security
        </CardTitle>
        <CardDescription>
          Tell us about your infrastructure to generate relevant compliance controls.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="cloudProviders"
          render={() => (
            <FormItem>
              <FormLabel>Cloud Providers Used</FormLabel>
              <FormDescription>Select all cloud providers your organization uses.</FormDescription>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {CLOUD_PROVIDERS.map((provider) => (
                  <FormField
                    key={provider.id}
                    control={form.control}
                    name="cloudProviders"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(provider.id)}
                            onCheckedChange={(checked) => {
                              const updated = checked
                                ? [...(field.value || []), provider.id]
                                : field.value?.filter((v) => v !== provider.id) || [];
                              field.onChange(updated);
                            }}
                            data-testid={`checkbox-cloud-${provider.id}`}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {provider.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dataClassification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data Classification</FormLabel>
              <FormDescription>
                What is the highest level of data classification in your organization?
              </FormDescription>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-data-classification">
                    <SelectValue placeholder="Select data classification" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DATA_CLASSIFICATIONS.map((classification) => (
                    <SelectItem
                      key={classification}
                      value={classification}
                      data-testid={`option-classification-${classification.toLowerCase().replace(" ", "-")}`}
                    >
                      {classification}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="businessApplications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Applications</FormLabel>
              <FormDescription>
                Describe the key business applications and systems in your organization.
              </FormDescription>
              <FormControl>
                <Textarea
                  placeholder="e.g., CRM systems, ERP platforms, custom web applications, mobile apps, data analytics tools..."
                  className="min-h-[100px]"
                  data-testid="textarea-business-applications"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Framework Selection
        </CardTitle>
        <CardDescription>
          Select the compliance frameworks you need documentation for.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="frameworks"
          render={() => (
            <FormItem>
              <FormLabel>Compliance Frameworks</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {FRAMEWORKS.map((framework) => (
                  <FormField
                    key={framework.id}
                    control={form.control}
                    name="frameworks"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-3 space-y-0 p-4 border rounded-lg">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(framework.id)}
                            onCheckedChange={(checked) => {
                              const updated = checked
                                ? [...(field.value || []), framework.id]
                                : field.value?.filter((v) => v !== framework.id) || [];
                              field.onChange(updated);
                            }}
                            data-testid={`checkbox-framework-${framework.id}`}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-medium cursor-pointer">
                            {framework.label}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchedFrameworks?.includes("soc2") && (
          <FormField
            control={form.control}
            name="soc2TrustPrinciples"
            render={() => (
              <FormItem>
                <FormLabel>SOC 2 Trust Principles</FormLabel>
                <FormDescription>
                  Select the trust service principles to include in your SOC 2 documentation.
                </FormDescription>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {SOC2_TRUST_PRINCIPLES.map((principle) => (
                    <FormField
                      key={principle.id}
                      control={form.control}
                      name="soc2TrustPrinciples"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(principle.id)}
                              onCheckedChange={(checked) => {
                                const updated = checked
                                  ? [...(field.value || []), principle.id]
                                  : field.value?.filter((v) => v !== principle.id) || [];
                                field.onChange(updated);
                              }}
                              data-testid={`checkbox-soc2-${principle.id}`}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {principle.label}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </FormItem>
            )}
          />
        )}

        {watchedFrameworks?.includes("fedramp") && (
          <FormField
            control={form.control}
            name="fedRampLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>FedRAMP Impact Level</FormLabel>
                <FormDescription>
                  Select the FedRAMP impact level for your system.
                </FormDescription>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-fedramp-level">
                      <SelectValue placeholder="Select impact level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FEDRAMP_LEVELS.map((level) => (
                      <SelectItem
                        key={level.value}
                        value={level.value}
                        data-testid={`option-fedramp-${level.value}`}
                      >
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        )}
      </CardContent>
    </Card>
  );

  const renderStep4 = () => {
    const values = form.getValues();
    const selectedFrameworkLabels = FRAMEWORKS.filter((f) =>
      values.frameworks?.includes(f.id)
    ).map((f) => f.label);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Review & Generate
          </CardTitle>
          <CardDescription>
            Review your information before generating compliance documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Company Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company Name</span>
                  <span className="font-medium" data-testid="review-company-name">
                    {values.companyName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Industry</span>
                  <span className="font-medium" data-testid="review-industry">
                    {values.industry}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company Size</span>
                  <span className="font-medium" data-testid="review-company-size">
                    {values.companySize} employees
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Headquarters</span>
                  <span className="font-medium" data-testid="review-headquarters">
                    {values.headquarters}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Infrastructure
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Cloud Providers</span>
                  <div className="flex flex-wrap gap-1 justify-end" data-testid="review-cloud-providers">
                    {values.cloudProviders?.map((p) => (
                      <Badge key={p} variant="secondary">
                        {CLOUD_PROVIDERS.find((cp) => cp.id === p)?.label || p}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Classification</span>
                  <span className="font-medium" data-testid="review-data-classification">
                    {values.dataClassification}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Selected Frameworks
            </h3>
            <div className="flex flex-wrap gap-2" data-testid="review-frameworks">
              {selectedFrameworkLabels.map((f) => (
                <Badge key={f} variant="default">
                  <Shield className="w-3 h-3 mr-1" />
                  {f}
                </Badge>
              ))}
            </div>
            {values.frameworks?.includes("soc2") && (values.soc2TrustPrinciples?.length ?? 0) > 0 && (
              <div className="text-sm text-muted-foreground">
                SOC 2 Principles:{" "}
                {(values.soc2TrustPrinciples ?? [])
                  .map((p) => SOC2_TRUST_PRINCIPLES.find((tp) => tp.id === p)?.label)
                  .join(", ")}
              </div>
            )}
            {values.frameworks?.includes("fedramp") && values.fedRampLevel && (
              <div className="text-sm text-muted-foreground">
                FedRAMP Level: {values.fedRampLevel}
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              Estimated documents to generate: {(values.frameworks?.length || 0) * 3}
            </p>
            <Button
              size="lg"
              className="w-full"
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              data-testid="button-generate-documents"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting Generation...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Compliance Documents
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStep5 = () => {
    const isRunning = jobStatus?.status === "running";
    const isCompleted = jobStatus?.status === "completed";
    const isFailed = jobStatus?.status === "failed";

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isRunning && <Loader2 className="w-5 h-5 animate-spin" />}
            {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            {isFailed && <AlertCircle className="w-5 h-5 text-destructive" />}
            Generation Results
          </CardTitle>
          <CardDescription>
            {isRunning && "Your compliance documents are being generated..."}
            {isCompleted && "All documents have been generated successfully."}
            {isFailed && "Document generation encountered an error."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isRunning && (
            <div className="space-y-6">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping" />
                  </div>
                  <div>
                    <h2 className="font-medium text-foreground">AI Generation in Progress</h2>
                    <p className="text-sm text-muted-foreground">
                      {jobStatus?.currentDocument
                        ? `Creating: ${jobStatus.currentDocument}`
                        : "Analyzing company profile and framework requirements..."}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                  <div id="overall-progress-label" className="text-muted-foreground">Overall Progress</div>
                  <span className="font-semibold text-foreground" data-testid="text-progress-percent">
                    {jobStatus?.progress || 0}%
                  </span>
                </div>
                <Progress
                  value={jobStatus?.progress || 0}
                  className="h-2"
                  data-testid="progress-generation"
                  aria-labelledby="overall-progress-label"
                />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-muted-foreground">
                  Generated {jobStatus?.documentsGenerated || 0} of{" "}
                  {jobStatus?.totalDocuments || 0} documents
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-xs text-muted-foreground uppercase tracking-wider">Preparing documents...</h2>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Skeleton className="w-10 h-10 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isFailed && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground mb-4" data-testid="text-error-message">
                {jobStatus?.errorMessage || "An error occurred during generation."}
              </p>
              <Button
                variant="outline"
                onClick={() => setCurrentStep(4)}
                data-testid="button-retry-generation"
              >
                Try Again
              </Button>
            </div>
          )}

          {isCompleted && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium" data-testid="text-generation-complete">
                  Generated {jobStatus?.documentsGenerated} documents successfully
                </span>
              </div>

              <div className="space-y-3">
                {generatedDocs.length > 0 ? (
                  generatedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`document-item-${doc.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <h2 className="font-medium">{doc.title}</h2>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">
                              {doc.framework}
                            </Badge>
                            <Badge
                              variant={doc.status === "draft" ? "secondary" : "default"}
                            >
                              {doc.status}
                            </Badge>
                            {doc.aiGenerated && (
                              <Badge variant="secondary">
                                AI Generated
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDoc(doc)}
                          data-testid={`button-view-doc-${doc.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`button-download-doc-${doc.id}`}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Documents will appear here once generation is complete.
                  </p>
                )}
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep(1);
                    setJobId(null);
                    setGeneratedDocs([]);
                    form.reset();
                  }}
                  data-testid="button-generate-more"
                >
                  Generate More Documents
                </Button>
              </div>
            </div>
          )}

          {selectedDoc && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle>{selectedDoc.title}</CardTitle>
                    <CardDescription>
                      {selectedDoc.framework} - Generated by {selectedDoc.aiModel}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedDoc(null)}
                    data-testid="button-close-preview"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  <pre className="whitespace-pre-wrap text-sm p-4 bg-muted rounded-lg">
                    {selectedDoc.content}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" data-testid="page-title">
          AI Document Generator
        </h1>
        <p className="text-muted-foreground mt-2">
          Generate compliance documentation tailored to your organization using AI.
        </p>
      </div>

      {renderStepIndicator()}

      <Form {...form}>
        <form className="space-y-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}

          {currentStep < 4 && (
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                data-testid="button-previous"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button type="button" onClick={nextStep} data-testid="button-next">
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {currentStep === 4 && (
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                data-testid="button-previous"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}

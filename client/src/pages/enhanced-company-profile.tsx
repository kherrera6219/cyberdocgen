import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, FileText, Settings, Upload, Building2 } from "lucide-react";
import { insertCompanyProfileSchema, type InsertCompanyProfile } from "@shared/schema";
import { z } from "zod";

// Enhanced form schema with all new fields
const enhancedCompanyProfileSchema = insertCompanyProfileSchema.extend({
  // Key Personnel
  ceoName: z.string().optional(),
  cisoName: z.string().optional(),
  cisoEmail: z.string().email().optional().or(z.literal("")),
  securityOfficerName: z.string().optional(),
  securityOfficerEmail: z.string().email().optional().or(z.literal("")),
  complianceOfficerName: z.string().optional(),
  complianceOfficerEmail: z.string().email().optional().or(z.literal("")),
  itManagerName: z.string().optional(),
  itManagerEmail: z.string().email().optional().or(z.literal("")),
  legalCounselName: z.string().optional(),
  legalCounselEmail: z.string().email().optional().or(z.literal("")),
  
  // Framework configurations
  selectedFrameworks: z.array(z.string()).default([]),
  fedRampLevel: z.enum(["low", "moderate", "high"]).optional(),
  nistControlFamilies: z.array(z.string()).default([]),
  soc2TrustServices: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof enhancedCompanyProfileSchema>;

// Framework and control family data
const COMPLIANCE_FRAMEWORKS = [
  { id: "iso27001", name: "ISO 27001:2022", description: "International information security standard" },
  { id: "soc2", name: "SOC 2 Type II", description: "Trust service criteria for service organizations" },
  { id: "fedramp-low", name: "FedRAMP Low", description: "155+ controls for low-impact systems" },
  { id: "fedramp-moderate", name: "FedRAMP Moderate", description: "300+ controls for moderate-impact systems" },
  { id: "fedramp-high", name: "FedRAMP High", description: "421+ controls for high-impact systems" },
  { id: "nist-800-53", name: "NIST 800-53 Rev 5", description: "20 control families with 1000+ controls" },
];

const NIST_CONTROL_FAMILIES = [
  { id: "AC", name: "Access Control", description: "Controls who can access systems and data" },
  { id: "AT", name: "Awareness and Training", description: "Security awareness and training programs" },
  { id: "AU", name: "Audit and Accountability", description: "Audit capabilities and accountability" },
  { id: "CA", name: "Assessment, Authorization, and Monitoring", description: "Security assessment and monitoring" },
  { id: "CM", name: "Configuration Management", description: "Configuration control and management" },
  { id: "CP", name: "Contingency Planning", description: "Business continuity and disaster recovery" },
  { id: "IA", name: "Identification and Authentication", description: "User and device identity verification" },
  { id: "IR", name: "Incident Response", description: "Security incident detection and response" },
  { id: "MA", name: "Maintenance", description: "System and tool maintenance requirements" },
  { id: "MP", name: "Media Protection", description: "Protection of organizational media" },
  { id: "PE", name: "Physical and Environmental Protection", description: "Physical security controls" },
  { id: "PL", name: "Planning", description: "Security planning policies and procedures" },
  { id: "PM", name: "Program Management", description: "Overall security program management" },
  { id: "PS", name: "Personnel Security", description: "Personnel protection and screening" },
  { id: "PT", name: "PII Processing and Transparency", description: "Privacy and PII protection" },
  { id: "RA", name: "Risk Assessment", description: "Risk assessment and vulnerability management" },
  { id: "SA", name: "System and Services Acquisition", description: "Security requirements for acquisitions" },
  { id: "SC", name: "System and Communications Protection", description: "System and communication security" },
  { id: "SI", name: "System and Information Integrity", description: "System and information integrity" },
  { id: "SR", name: "Supply Chain Risk Management", description: "Supply chain cybersecurity risks" },
];

const SOC2_TRUST_SERVICES = [
  { id: "security", name: "Security", description: "Protection against unauthorized access" },
  { id: "availability", name: "Availability", description: "System accessibility for operation and use" },
  { id: "processing", name: "Processing Integrity", description: "System processing completeness and accuracy" },
  { id: "confidentiality", name: "Confidentiality", description: "Information designated as confidential" },
  { id: "privacy", name: "Privacy", description: "Personal information collection and processing" },
];

export default function EnhancedCompanyProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");

  const form = useForm<FormData>({
    resolver: zodResolver(enhancedCompanyProfileSchema),
    defaultValues: {
      companyName: "",
      industry: "",
      companySize: "",
      headquarters: "",
      cloudInfrastructure: [],
      dataClassification: "",
      businessApplications: "",
      complianceFrameworks: [],
      contactInfo: undefined,
      selectedFrameworks: [],
      nistControlFamilies: [],
      soc2TrustServices: [],
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Transform form data to match schema
      const profileData: InsertCompanyProfile = {
        organizationId: "temp-org-id", // TODO: Get from organization context
        createdBy: "temp-user-id", // TODO: Get from authenticated user context
        companyName: data.companyName,
        industry: data.industry,
        companySize: data.companySize,
        headquarters: data.headquarters,
        cloudInfrastructure: data.cloudInfrastructure || [],
        dataClassification: data.dataClassification,
        businessApplications: data.businessApplications,
        complianceFrameworks: data.selectedFrameworks,
        contactInfo: data.contactInfo,
        keyPersonnel: {
          ceo: data.ceoName ? { name: data.ceoName } : undefined,
          ciso: data.cisoName ? { name: data.cisoName, email: data.cisoEmail } : undefined,
          securityOfficer: data.securityOfficerName ? { name: data.securityOfficerName, email: data.securityOfficerEmail } : undefined,
          complianceOfficer: data.complianceOfficerName ? { name: data.complianceOfficerName, email: data.complianceOfficerEmail } : undefined,
          itManager: data.itManagerName ? { name: data.itManagerName, email: data.itManagerEmail } : undefined,
          legalCounsel: data.legalCounselName ? { name: data.legalCounselName, email: data.legalCounselEmail } : undefined,
        },
        frameworkConfigs: {
          fedramp: data.fedRampLevel ? {
            level: data.fedRampLevel,
            impactLevel: { confidentiality: "moderate", integrity: "moderate", availability: "moderate" },
            selectedControls: [],
          } : undefined,
          nist80053: data.nistControlFamilies.length > 0 ? {
            version: "revision-5" as const,
            selectedControlFamilies: data.nistControlFamilies,
          } : undefined,
          soc2: data.soc2TrustServices.length > 0 ? {
            trustServices: data.soc2TrustServices as any,
            reportType: "type2" as const,
          } : undefined,
        },
      };

      return apiRequest("/api/company-profiles", "POST", profileData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company profile created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company-profiles"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create company profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createProfileMutation.mutate(data);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center shadow-md">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Enhanced Company Profile</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">Create a comprehensive company profile with key personnel and compliance framework configurations</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1">
                <TabsTrigger value="basic" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Basic Info</span>
                  <span className="sm:hidden">Basic</span>
                </TabsTrigger>
                <TabsTrigger value="personnel" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Key Personnel</span>
                  <span className="sm:hidden">Personnel</span>
                </TabsTrigger>
                <TabsTrigger value="frameworks" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden lg:inline">Frameworks</span>
                  <span className="lg:hidden">Frameworks</span>
                </TabsTrigger>
                <TabsTrigger value="fedramp" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden lg:inline">FedRAMP</span>
                  <span className="lg:hidden">FedRAMP</span>
                </TabsTrigger>
                <TabsTrigger value="controls" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden lg:inline">Controls</span>
                  <span className="lg:hidden">Controls</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Company Information</CardTitle>
                    <CardDescription>
                      Fundamental details about your organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Acme Corporation" {...field} />
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
                            <FormLabel>Industry *</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="technology">Technology</SelectItem>
                                  <SelectItem value="healthcare">Healthcare</SelectItem>
                                  <SelectItem value="finance">Financial Services</SelectItem>
                                  <SelectItem value="government">Government</SelectItem>
                                  <SelectItem value="education">Education</SelectItem>
                                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                  <SelectItem value="retail">Retail</SelectItem>
                                  <SelectItem value="consulting">Consulting</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="companySize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Size *</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select company size" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="startup">Startup (1-10)</SelectItem>
                                  <SelectItem value="small">Small (11-50)</SelectItem>
                                  <SelectItem value="medium">Medium (51-200)</SelectItem>
                                  <SelectItem value="large">Large (201-1000)</SelectItem>
                                  <SelectItem value="enterprise">Enterprise (1000+)</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="headquarters"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Headquarters *</FormLabel>
                            <FormControl>
                              <Input placeholder="San Francisco, CA, USA" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="dataClassification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Classification *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select data classification level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="public">Public</SelectItem>
                                <SelectItem value="internal">Internal</SelectItem>
                                <SelectItem value="confidential">Confidential</SelectItem>
                                <SelectItem value="restricted">Restricted</SelectItem>
                                <SelectItem value="top-secret">Top Secret</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessApplications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Applications *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your primary business applications and systems..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            List key business applications, databases, and systems
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="personnel" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Key Personnel for Compliance Documentation</CardTitle>
                    <CardDescription>
                      Specify key stakeholders who will be referenced in SOPs and compliance documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="ceoName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chief Executive Officer (CEO)</FormLabel>
                            <FormControl>
                              <Input placeholder="John Smith" {...field} />
                            </FormControl>
                            <FormDescription>
                              Required for executive oversight responsibilities
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cisoName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chief Information Security Officer (CISO)</FormLabel>
                            <FormControl>
                              <Input placeholder="Jane Doe" {...field} />
                            </FormControl>
                            <FormDescription>
                              Primary security responsibility owner
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="cisoEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CISO Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="ciso@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="securityOfficerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Information Security Officer</FormLabel>
                            <FormControl>
                              <Input placeholder="Bob Johnson" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="securityOfficerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Security Officer Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="security@company.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="complianceOfficerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Compliance Officer</FormLabel>
                            <FormControl>
                              <Input placeholder="Alice Brown" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="complianceOfficerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Compliance Officer Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="compliance@company.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="itManagerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IT Manager</FormLabel>
                            <FormControl>
                              <Input placeholder="Charlie Wilson" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="itManagerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IT Manager Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="it@company.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="legalCounselName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Legal Counsel</FormLabel>
                            <FormControl>
                              <Input placeholder="Diana Clark" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="legalCounselEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Legal Counsel Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="legal@company.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="frameworks" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Compliance Frameworks</CardTitle>
                    <CardDescription>
                      Select the compliance frameworks your organization needs to adhere to
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="selectedFrameworks"
                      render={() => (
                        <FormItem>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {COMPLIANCE_FRAMEWORKS.map((framework) => (
                              <FormField
                                key={framework.id}
                                control={form.control}
                                name="selectedFrameworks"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={framework.id}
                                      className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(framework.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, framework.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== framework.id
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel className="font-medium">
                                          {framework.name}
                                        </FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                          {framework.description}
                                        </p>
                                      </div>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fedramp" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>FedRAMP Configuration</CardTitle>
                    <CardDescription>
                      Configure FedRAMP impact levels based on your system requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="fedRampLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>FedRAMP Impact Level</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select FedRAMP level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">
                                  <div className="space-y-1">
                                    <div className="font-medium">Low Impact Level</div>
                                    <div className="text-sm text-muted-foreground">155+ controls, public information</div>
                                  </div>
                                </SelectItem>
                                <SelectItem value="moderate">
                                  <div className="space-y-1">
                                    <div className="font-medium">Moderate Impact Level</div>
                                    <div className="text-sm text-muted-foreground">300+ controls, CUI information</div>
                                  </div>
                                </SelectItem>
                                <SelectItem value="high">
                                  <div className="space-y-1">
                                    <div className="font-medium">High Impact Level</div>
                                    <div className="text-sm text-muted-foreground">421+ controls, national security data</div>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            Select based on the sensitivity of data your system will process
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("fedRampLevel") && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <h4 className="font-medium mb-2">Impact Level Details</h4>
                        {form.watch("fedRampLevel") === "low" && (
                          <div className="space-y-2 text-sm">
                            <p><strong>Data Type:</strong> Public information, non-sensitive data</p>
                            <p><strong>Impact:</strong> Limited adverse effect on agency operations</p>
                            <p><strong>Controls:</strong> ~155 security controls</p>
                            <p><strong>Use Cases:</strong> Mass consumption data, basic public services</p>
                          </div>
                        )}
                        {form.watch("fedRampLevel") === "moderate" && (
                          <div className="space-y-2 text-sm">
                            <p><strong>Data Type:</strong> Controlled Unclassified Information (CUI)</p>
                            <p><strong>Impact:</strong> Serious adverse effects on operations</p>
                            <p><strong>Controls:</strong> ~300 security controls</p>
                            <p><strong>Use Cases:</strong> Most federal agency operations, business systems</p>
                          </div>
                        )}
                        {form.watch("fedRampLevel") === "high" && (
                          <div className="space-y-2 text-sm">
                            <p><strong>Data Type:</strong> Highly sensitive, national security information</p>
                            <p><strong>Impact:</strong> Catastrophic consequences including potential loss of life</p>
                            <p><strong>Controls:</strong> ~421 security controls</p>
                            <p><strong>Use Cases:</strong> Law enforcement, emergency services, critical infrastructure</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="controls" className="mt-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>NIST 800-53 Rev 5 Control Families</CardTitle>
                      <CardDescription>
                        Select the control families relevant to your organization (20 families, 1000+ controls)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="nistControlFamilies"
                        render={() => (
                          <FormItem>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {NIST_CONTROL_FAMILIES.map((family) => (
                                <FormField
                                  key={family.id}
                                  control={form.control}
                                  name="nistControlFamilies"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={family.id}
                                        className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(family.id)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...field.value, family.id])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (value) => value !== family.id
                                                    )
                                                  );
                                            }}
                                          />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                          <FormLabel className="font-medium">
                                            {family.id} - {family.name}
                                          </FormLabel>
                                          <p className="text-xs text-muted-foreground">
                                            {family.description}
                                          </p>
                                        </div>
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>SOC 2 Trust Service Categories</CardTitle>
                      <CardDescription>
                        Select the trust service criteria relevant to your service organization
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="soc2TrustServices"
                        render={() => (
                          <FormItem>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {SOC2_TRUST_SERVICES.map((service) => (
                                <FormField
                                  key={service.id}
                                  control={form.control}
                                  name="soc2TrustServices"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={service.id}
                                        className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(service.id)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...field.value, service.id])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (value) => value !== service.id
                                                    )
                                                  );
                                            }}
                                          />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                          <FormLabel className="font-medium">
                                            {service.name}
                                          </FormLabel>
                                          <p className="text-sm text-muted-foreground">
                                            {service.description}
                                          </p>
                                        </div>
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const tabs = ["basic", "personnel", "frameworks", "fedramp", "controls"];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex > 0) {
                    setActiveTab(tabs[currentIndex - 1]);
                  }
                }}
                disabled={activeTab === "basic"}
              >
                Previous
              </Button>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const tabs = ["basic", "personnel", "frameworks", "fedramp", "controls"];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex < tabs.length - 1) {
                      setActiveTab(tabs[currentIndex + 1]);
                    }
                  }}
                  disabled={activeTab === "controls"}
                >
                  Next
                </Button>

                <Button
                  type="submit"
                  disabled={createProfileMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createProfileMutation.isPending ? "Creating..." : "Create Profile"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
    </div>
  );
}
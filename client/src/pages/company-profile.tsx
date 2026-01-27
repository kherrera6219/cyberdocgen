import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useWatch, type UseFormReturn, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { HelpTooltip } from "@/components/help/ContextualHelp";
import { insertCompanyProfileSchema, type CompanyProfile as CompanyProfileType, type InsertCompanyProfile } from "@shared/schema";
import { 
  Building, Save, Globe, Briefcase, MapPin, Shield, 
  Truck, Plus, Trash2, Building2, UserCheck, RefreshCw
} from "lucide-react";
import { useEffect } from "react";

interface PersonnelFieldProps {
  title: string;
  fieldPrefix: keyof NonNullable<InsertCompanyProfile['keyPersonnel']>;
  form: UseFormReturn<InsertCompanyProfile>;
}

function PersonnelField({ title, fieldPrefix, form }: PersonnelFieldProps) {
  return (
    <div className="space-y-3 p-4 border rounded-md">
      <h4 className="font-medium text-sm">{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <FormField
          control={form.control}
          name={`keyPersonnel.${String(fieldPrefix)}.name` as Path<InsertCompanyProfile>}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Name</FormLabel>
              <FormControl>
                <Input 
                  data-testid={`input-personnel-${String(fieldPrefix)}-name`}
                  placeholder="Full name" 
                  {...field} 
                  value={field.value || ""} 
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`keyPersonnel.${String(fieldPrefix)}.email` as Path<InsertCompanyProfile>}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Email</FormLabel>
              <FormControl>
                <Input 
                  data-testid={`input-personnel-${String(fieldPrefix)}-email`}
                  type="email" 
                  placeholder="email@company.com" 
                  {...field} 
                  value={field.value || ""} 
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`keyPersonnel.${String(fieldPrefix)}.phone` as Path<InsertCompanyProfile>}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Phone</FormLabel>
              <FormControl>
                <Input 
                  data-testid={`input-personnel-${String(fieldPrefix)}-phone`}
                  type="tel" 
                  placeholder="+1 (555) 000-0000" 
                  {...field} 
                  value={field.value || ""} 
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export default function CompanyProfile() {
  const { toast } = useToast();

  const { data: profiles = [], isLoading } = useQuery<CompanyProfileType[]>({
    queryKey: ["/api/company-profiles"],
  });

  const profile = profiles[0];

  const form = useForm<InsertCompanyProfile>({
    resolver: zodResolver(insertCompanyProfileSchema),
    defaultValues: {
      companyName: "",
      industry: "",
      companySize: "",
      headquarters: "",
      cloudInfrastructure: [],
      dataClassification: "",
      businessApplications: "",
      websiteUrl: "",
      organizationStructure: {
        legalEntityType: "",
        parentCompany: { name: "", relationship: "" },
        subsidiaries: [],
        departments: [],
        totalEmployees: undefined,
      },
      keyPersonnel: {
        ceo: { name: "", email: "", phone: "" },
        cfo: { name: "", email: "", phone: "" },
        coo: { name: "", email: "", phone: "" },
        cto: { name: "", email: "", phone: "" },
        cio: { name: "", email: "", phone: "" },
        ciso: { name: "", email: "", phone: "" },
        dpo: { name: "", email: "", phone: "" },
        cpo: { name: "", email: "", phone: "" },
        securityOfficer: { name: "", email: "", phone: "" },
        complianceOfficer: { name: "", email: "", phone: "" },
        itManager: { name: "", email: "", phone: "" },
        hrDirector: { name: "", email: "", phone: "" },
        legalCounsel: { name: "", email: "", phone: "" },
      },
      productsAndServices: {
        primaryProducts: [],
        primaryServices: [],
        customerSegments: [],
        slaCommitments: [],
        serviceAvailabilityRequirements: "",
      },
      geographicOperations: {
        countriesOfOperation: [],
        officeLocations: [],
        dataCenterLocations: [],
        customerRegionsServed: [],
        regulatoryJurisdictions: [],
      },
      securityInfrastructure: {
        networkArchitectureSummary: "",
        firewallVendor: "",
        idsIpsVendor: "",
        siemSolution: "",
        endpointProtection: "",
        encryptionStandards: [],
        backupSolutions: [],
        disasterRecoverySites: [],
        vpnSolution: "",
        mfaProvider: "",
        identityProvider: "",
      },
      businessContinuity: {
        rtoHours: undefined,
        rpoHours: undefined,
        bcdrPlanExists: false,
        lastDrTestDate: "",
        criticalSystems: [],
        backupFrequency: "",
        incidentResponsePlanExists: false,
        lastIncidentResponseTest: "",
      },
      vendorManagement: {
        criticalVendors: [],
        thirdPartyIntegrations: [],
        vendorRiskAssessmentFrequency: "",
      },
    },
  });

  const subsidiaries = useWatch({ control: form.control, name: "organizationStructure.subsidiaries" }) || [];
  const departments = useWatch({ control: form.control, name: "organizationStructure.departments" }) || [];
  const primaryProducts = useWatch({ control: form.control, name: "productsAndServices.primaryProducts" }) || [];
  const primaryServices = useWatch({ control: form.control, name: "productsAndServices.primaryServices" }) || [];
  const slaCommitments = useWatch({ control: form.control, name: "productsAndServices.slaCommitments" }) || [];
  const officeLocations = useWatch({ control: form.control, name: "geographicOperations.officeLocations" }) || [];
  const dataCenterLocations = useWatch({ control: form.control, name: "geographicOperations.dataCenterLocations" }) || [];
  const criticalSystems = useWatch({ control: form.control, name: "businessContinuity.criticalSystems" }) || [];
  const criticalVendors = useWatch({ control: form.control, name: "vendorManagement.criticalVendors" }) || [];
  const thirdPartyIntegrations = useWatch({ control: form.control, name: "vendorManagement.thirdPartyIntegrations" }) || [];
  const encryptionStandards = useWatch({ control: form.control, name: "securityInfrastructure.encryptionStandards" }) || [];
  const backupSolutions = useWatch({ control: form.control, name: "securityInfrastructure.backupSolutions" }) || [];
  const disasterRecoverySites = useWatch({ control: form.control, name: "securityInfrastructure.disasterRecoverySites" }) || [];

  useEffect(() => {
    if (profile) {
      form.reset({
        companyName: profile.companyName || "",
        industry: profile.industry || "",
        companySize: profile.companySize || "",
        headquarters: profile.headquarters || "",
        cloudInfrastructure: profile.cloudInfrastructure || [],
        dataClassification: profile.dataClassification || "",
        businessApplications: profile.businessApplications || "",
        websiteUrl: profile.websiteUrl || "",
        organizationStructure: profile.organizationStructure || {
          legalEntityType: "",
          parentCompany: { name: "", relationship: "" },
          subsidiaries: [],
          departments: [],
          totalEmployees: undefined,
        },
        keyPersonnel: profile.keyPersonnel || {
          ceo: { name: "", email: "", phone: "" },
          cfo: { name: "", email: "", phone: "" },
          coo: { name: "", email: "", phone: "" },
          cto: { name: "", email: "", phone: "" },
          cio: { name: "", email: "", phone: "" },
          ciso: { name: "", email: "", phone: "" },
          dpo: { name: "", email: "", phone: "" },
          cpo: { name: "", email: "", phone: "" },
          securityOfficer: { name: "", email: "", phone: "" },
          complianceOfficer: { name: "", email: "", phone: "" },
          itManager: { name: "", email: "", phone: "" },
          hrDirector: { name: "", email: "", phone: "" },
          legalCounsel: { name: "", email: "", phone: "" },
        },
        productsAndServices: profile.productsAndServices || {
          primaryProducts: [],
          primaryServices: [],
          customerSegments: [],
          slaCommitments: [],
          serviceAvailabilityRequirements: "",
        },
        geographicOperations: profile.geographicOperations || {
          countriesOfOperation: [],
          officeLocations: [],
          dataCenterLocations: [],
          customerRegionsServed: [],
          regulatoryJurisdictions: [],
        },
        securityInfrastructure: profile.securityInfrastructure || {
          networkArchitectureSummary: "",
          firewallVendor: "",
          idsIpsVendor: "",
          siemSolution: "",
          endpointProtection: "",
          encryptionStandards: [],
          backupSolutions: [],
          disasterRecoverySites: [],
          vpnSolution: "",
          mfaProvider: "",
          identityProvider: "",
        },
        businessContinuity: profile.businessContinuity || {
          rtoHours: undefined,
          rpoHours: undefined,
          bcdrPlanExists: false,
          lastDrTestDate: "",
          criticalSystems: [],
          backupFrequency: "",
          incidentResponsePlanExists: false,
          lastIncidentResponseTest: "",
        },
        vendorManagement: profile.vendorManagement || {
          criticalVendors: [],
          thirdPartyIntegrations: [],
          vendorRiskAssessmentFrequency: "",
        },
      });
    }
  }, [profile, form]);

  const saveProfileMutation = useMutation({
    mutationFn: async (data: InsertCompanyProfile) => {
      if (profile) {
        const response = await apiRequest("PUT", `/api/company-profiles/${profile.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/company-profiles", data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-profiles"] });
      toast({
        title: "Profile Saved",
        description: "Your company profile has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save company profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCompanyProfile) => {
    saveProfileMutation.mutate(data);
  };

  const cloudOptions = [
    { id: "AWS", label: "AWS" },
    { id: "Microsoft Azure", label: "Microsoft Azure" },
    { id: "Google Cloud Platform", label: "Google Cloud Platform" },
    { id: "IBM Cloud", label: "IBM Cloud" },
    { id: "Oracle Cloud", label: "Oracle Cloud" },
  ];

  const legalEntityTypes = [
    "LLC",
    "Corporation (C-Corp)",
    "Corporation (S-Corp)",
    "Partnership",
    "Sole Proprietorship",
    "Non-Profit",
    "Government Agency",
    "Public Company",
  ];

  const customerSegmentOptions: Array<'B2B' | 'B2C' | 'Government' | 'Enterprise' | 'SMB'> = [
    'B2B', 'B2C', 'Government', 'Enterprise', 'SMB'
  ];

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 sm:h-8 bg-muted rounded w-1/2 sm:w-1/4"></div>
          <div className="h-48 sm:h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="space-y-2 sm:space-y-3">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" data-testid="text-page-title">
          Company Profile
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Configure your company information for accurate compliance documentation
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Building className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
            <CardTitle className="text-base sm:text-lg">Company Information</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-4 pb-6 border-b">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Website & AI Data Extraction
                </h3>
                <FormField
                  control={form.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Website URL</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-website-url"
                          type="url"
                          placeholder="https://www.yourcompany.com" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter your company website for AI-powered data extraction and auto-population of profile fields
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Accordion type="multiple" className="w-full space-y-2" defaultValue={["basic-info"]}>
                
                <AccordionItem value="basic-info" className="border rounded-md px-4">
                  <AccordionTrigger 
                    className="text-base font-semibold"
                    data-testid="accordion-trigger-basic-info"
                  >
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Basic Information
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-company-name"
                                  placeholder="Enter company name" 
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
                                    <SelectValue placeholder="Select industry" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Technology Services">Technology Services</SelectItem>
                                  <SelectItem value="Financial Services">Financial Services</SelectItem>
                                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                                  <SelectItem value="Retail">Retail</SelectItem>
                                  <SelectItem value="Education">Education</SelectItem>
                                  <SelectItem value="Government">Government</SelectItem>
                                  <SelectItem value="Non-profit">Non-profit</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
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
                                  <SelectItem value="1-50 employees">1-50 employees</SelectItem>
                                  <SelectItem value="51-200 employees">51-200 employees</SelectItem>
                                  <SelectItem value="201-1000 employees">201-1000 employees</SelectItem>
                                  <SelectItem value="1000+ employees">1000+ employees</SelectItem>
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
                                  data-testid="input-headquarters"
                                  placeholder="e.g., San Francisco, CA" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="technical-env" className="border rounded-md px-4">
                  <AccordionTrigger 
                    className="text-base font-semibold"
                    data-testid="accordion-trigger-technical-env"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Technical Environment
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4">
                    <FormField
                      control={form.control}
                      name="cloudInfrastructure"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span>Cloud Infrastructure</span>
                            <HelpTooltip topic="cloudInfrastructure" />
                          </FormLabel>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                            {cloudOptions.map((option) => (
                              <div key={option.id} className="flex items-center gap-2">
                                <Checkbox
                                  id={option.id}
                                  data-testid={`checkbox-cloud-${option.id.toLowerCase().replace(/\s+/g, '-')}`}
                                  checked={field.value?.includes(option.id) || false}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValue, option.id]);
                                    } else {
                                      field.onChange(currentValue.filter((item: string) => item !== option.id));
                                    }
                                  }}
                                />
                                <Label htmlFor={option.id} className="text-sm font-normal cursor-pointer">
                                  {option.label}
                                </Label>
                              </div>
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
                          <FormLabel className="flex items-center gap-2">
                            <span>Data Classification Level</span>
                            <HelpTooltip topic="dataClassification" />
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-data-classification">
                                <SelectValue placeholder="Select classification level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Public">Public</SelectItem>
                              <SelectItem value="Internal">Internal</SelectItem>
                              <SelectItem value="Confidential">Confidential</SelectItem>
                              <SelectItem value="Restricted">Restricted</SelectItem>
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
                          <FormLabel className="flex items-center gap-2">
                            <span>Primary Business Applications</span>
                            <HelpTooltip topic="businessApplications" />
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              data-testid="textarea-business-applications"
                              placeholder="Describe your main business applications and systems..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="org-structure" className="border rounded-md px-4">
                  <AccordionTrigger 
                    className="text-base font-semibold"
                    data-testid="accordion-trigger-org-structure"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Organization Structure
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="organizationStructure.legalEntityType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Legal Entity Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger data-testid="select-legal-entity-type">
                                  <SelectValue placeholder="Select entity type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {legalEntityTypes.map((type) => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="organizationStructure.totalEmployees"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Employees</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-total-employees"
                                type="number"
                                placeholder="e.g., 500" 
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Parent Company</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="organizationStructure.parentCompany.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Parent Company Name</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-parent-company-name"
                                  placeholder="Parent company name (if applicable)" 
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="organizationStructure.parentCompany.relationship"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relationship</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-parent-company-relationship"
                                  placeholder="e.g., Wholly-owned subsidiary" 
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Subsidiaries</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-subsidiary"
                          onClick={() => {
                            const current = form.getValues("organizationStructure.subsidiaries") || [];
                            form.setValue("organizationStructure.subsidiaries", [
                              ...current,
                              { name: "", location: "" }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Subsidiary
                        </Button>
                      </div>
                      {subsidiaries.map((_: any, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`organizationStructure.subsidiaries.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-subsidiary-name-${index}`}
                                    placeholder="Subsidiary name" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`organizationStructure.subsidiaries.${index}.location`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Location</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-subsidiary-location-${index}`}
                                    placeholder="Location" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-testid={`button-remove-subsidiary-${index}`}
                            onClick={() => {
                              const current = form.getValues("organizationStructure.subsidiaries") || [];
                              form.setValue("organizationStructure.subsidiaries", 
                                current.filter((_: any, i: number) => i !== index)
                              );
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Departments</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-department"
                          onClick={() => {
                            const current = form.getValues("organizationStructure.departments") || [];
                            form.setValue("organizationStructure.departments", [
                              ...current,
                              { name: "", head: "", employeeCount: undefined, responsibilities: "" }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Department
                        </Button>
                      </div>
                      {departments.map((_: any, index: number) => (
                        <div key={index} className="p-4 border rounded-md space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Department {index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              data-testid={`button-remove-department-${index}`}
                              onClick={() => {
                                const current = form.getValues("organizationStructure.departments") || [];
                                form.setValue("organizationStructure.departments", 
                                  current.filter((_, i) => i !== index)
                                );
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <FormField
                              control={form.control}
                              name={`organizationStructure.departments.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Name</FormLabel>
                                  <FormControl>
                                    <Input 
                                      data-testid={`input-department-name-${index}`}
                                      placeholder="Department name" 
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`organizationStructure.departments.${index}.head`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Head</FormLabel>
                                  <FormControl>
                                    <Input 
                                      data-testid={`input-department-head-${index}`}
                                      placeholder="Department head" 
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`organizationStructure.departments.${index}.employeeCount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Employees</FormLabel>
                                  <FormControl>
                                    <Input 
                                      data-testid={`input-department-employees-${index}`}
                                      type="number"
                                      placeholder="Count" 
                                      {...field}
                                      value={field.value || ""}
                                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`organizationStructure.departments.${index}.responsibilities`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Responsibilities</FormLabel>
                                  <FormControl>
                                    <Input 
                                      data-testid={`input-department-responsibilities-${index}`}
                                      placeholder="Key responsibilities" 
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="key-personnel" className="border rounded-md px-4">
                  <AccordionTrigger 
                    className="text-base font-semibold"
                    data-testid="accordion-trigger-key-personnel"
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Key Personnel
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Key personnel information for compliance documentation and communication
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <PersonnelField title="CEO (Chief Executive Officer)" fieldPrefix="ceo" form={form} />
                      <PersonnelField title="CFO (Chief Financial Officer)" fieldPrefix="cfo" form={form} />
                      <PersonnelField title="COO (Chief Operating Officer)" fieldPrefix="coo" form={form} />
                      <PersonnelField title="CTO (Chief Technology Officer)" fieldPrefix="cto" form={form} />
                      <PersonnelField title="CIO (Chief Information Officer)" fieldPrefix="cio" form={form} />
                      <PersonnelField title="CISO (Chief Information Security Officer)" fieldPrefix="ciso" form={form} />
                      <PersonnelField title="DPO (Data Protection Officer)" fieldPrefix="dpo" form={form} />
                      <PersonnelField title="CPO (Chief Privacy Officer)" fieldPrefix="cpo" form={form} />
                      <PersonnelField title="Security Officer" fieldPrefix="securityOfficer" form={form} />
                      <PersonnelField title="Compliance Officer" fieldPrefix="complianceOfficer" form={form} />
                      <PersonnelField title="IT Manager" fieldPrefix="itManager" form={form} />
                      <PersonnelField title="HR Director" fieldPrefix="hrDirector" form={form} />
                      <PersonnelField title="Legal Counsel" fieldPrefix="legalCounsel" form={form} />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="products-services" className="border rounded-md px-4">
                  <AccordionTrigger 
                    className="text-base font-semibold"
                    data-testid="accordion-trigger-products-services"
                  >
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Products & Services
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Primary Products</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-product"
                          onClick={() => {
                            const current = form.getValues("productsAndServices.primaryProducts") || [];
                            form.setValue("productsAndServices.primaryProducts", [
                              ...current,
                              { name: "", description: "" }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Product
                        </Button>
                      </div>
                      {primaryProducts.map((_: any, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`productsAndServices.primaryProducts.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-product-name-${index}`}
                                    placeholder="Product name" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`productsAndServices.primaryProducts.${index}.description`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Description</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-product-description-${index}`}
                                    placeholder="Brief description" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-testid={`button-remove-product-${index}`}
                            onClick={() => {
                              const current = form.getValues("productsAndServices.primaryProducts") || [];
                              form.setValue("productsAndServices.primaryProducts", 
                                current.filter((_, i) => i !== index)
                              );
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Primary Services</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-service"
                          onClick={() => {
                            const current = form.getValues("productsAndServices.primaryServices") || [];
                            form.setValue("productsAndServices.primaryServices", [
                              ...current,
                              { name: "", description: "" }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Service
                        </Button>
                      </div>
                      {primaryServices.map((_: any, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`productsAndServices.primaryServices.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-service-name-${index}`}
                                    placeholder="Service name" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`productsAndServices.primaryServices.${index}.description`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Description</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-service-description-${index}`}
                                    placeholder="Brief description" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-testid={`button-remove-service-${index}`}
                            onClick={() => {
                              const current = form.getValues("productsAndServices.primaryServices") || [];
                              form.setValue("productsAndServices.primaryServices", 
                                current.filter((_, i) => i !== index)
                              );
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <FormField
                      control={form.control}
                      name="productsAndServices.customerSegments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Segments</FormLabel>
                          <div className="flex flex-wrap gap-4 mt-2">
                            {customerSegmentOptions.map((segment) => (
                              <div key={segment} className="flex items-center gap-2">
                                <Checkbox
                                  id={`segment-${segment}`}
                                  data-testid={`checkbox-segment-${segment.toLowerCase()}`}
                                  checked={field.value?.includes(segment) || false}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValue, segment]);
                                    } else {
                                      field.onChange(currentValue.filter((item) => item !== segment));
                                    }
                                  }}
                                />
                                <Label htmlFor={`segment-${segment}`} className="text-sm font-normal cursor-pointer">
                                  {segment}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">SLA Commitments</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-sla"
                          onClick={() => {
                            const current = form.getValues("productsAndServices.slaCommitments") || [];
                            form.setValue("productsAndServices.slaCommitments", [
                              ...current,
                              { service: "", availability: "", responseTime: "" }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add SLA
                        </Button>
                      </div>
                      {slaCommitments.map((_: unknown, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`productsAndServices.slaCommitments.${index}.service`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Service</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-sla-service-${index}`}
                                    placeholder="Service name" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`productsAndServices.slaCommitments.${index}.availability`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Availability</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-sla-availability-${index}`}
                                    placeholder="e.g., 99.9%" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`productsAndServices.slaCommitments.${index}.responseTime`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Response Time</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-sla-response-${index}`}
                                    placeholder="e.g., 4 hours" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-testid={`button-remove-sla-${index}`}
                            onClick={() => {
                              const current = form.getValues("productsAndServices.slaCommitments") || [];
                              form.setValue("productsAndServices.slaCommitments", 
                                current.filter((_, i) => i !== index)
                              );
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <FormField
                      control={form.control}
                      name="productsAndServices.serviceAvailabilityRequirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Availability Requirements</FormLabel>
                          <FormControl>
                            <Textarea 
                              data-testid="textarea-service-availability"
                              placeholder="Describe overall service availability requirements..."
                              rows={3}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="geographic-ops" className="border rounded-md px-4">
                  <AccordionTrigger 
                    className="text-base font-semibold"
                    data-testid="accordion-trigger-geographic-ops"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Geographic Operations
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-6">
                    <FormField
                      control={form.control}
                      name="geographicOperations.countriesOfOperation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Countries of Operation</FormLabel>
                          <FormControl>
                            <Textarea 
                              data-testid="textarea-countries"
                              placeholder="Enter countries separated by commas (e.g., United States, Canada, United Kingdom)"
                              rows={2}
                              value={(field.value || []).join(", ")}
                              onChange={(e) => {
                                const countries = e.target.value.split(",").map(c => c.trim()).filter(c => c);
                                field.onChange(countries);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Office Locations</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-office"
                          onClick={() => {
                            const current = form.getValues("geographicOperations.officeLocations") || [];
                            form.setValue("geographicOperations.officeLocations", [
                              ...current,
                              { address: "", type: "regional" as const, employeeCount: undefined }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Office
                        </Button>
                      </div>
                      {officeLocations.map((_: any, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`geographicOperations.officeLocations.${index}.address`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Address</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-office-address-${index}`}
                                    placeholder="Office address" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`geographicOperations.officeLocations.${index}.type`}
                            render={({ field }) => (
                              <FormItem className="w-40">
                                <FormLabel className="text-xs">Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || "regional"}>
                                  <FormControl>
                                    <SelectTrigger data-testid={`select-office-type-${index}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="headquarters">Headquarters</SelectItem>
                                    <SelectItem value="regional">Regional</SelectItem>
                                    <SelectItem value="satellite">Satellite</SelectItem>
                                    <SelectItem value="remote">Remote</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`geographicOperations.officeLocations.${index}.employeeCount`}
                            render={({ field }) => (
                              <FormItem className="w-28">
                                <FormLabel className="text-xs">Employees</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-office-employees-${index}`}
                                    type="number"
                                    placeholder="Count" 
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-testid={`button-remove-office-${index}`}
                            onClick={() => {
                              const current = form.getValues("geographicOperations.officeLocations") || [];
                              form.setValue("geographicOperations.officeLocations", 
                                current.filter((_, i) => i !== index)
                              );
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Data Center Locations</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-datacenter"
                          onClick={() => {
                            const current = form.getValues("geographicOperations.dataCenterLocations") || [];
                            form.setValue("geographicOperations.dataCenterLocations", [
                              ...current,
                              { location: "", type: "primary" as const, provider: "" }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Data Center
                        </Button>
                      </div>
                      {dataCenterLocations.map((_: any, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`geographicOperations.dataCenterLocations.${index}.location`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Location</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-datacenter-location-${index}`}
                                    placeholder="Data center location" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`geographicOperations.dataCenterLocations.${index}.type`}
                            render={({ field }) => (
                              <FormItem className="w-44">
                                <FormLabel className="text-xs">Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || "primary"}>
                                  <FormControl>
                                    <SelectTrigger data-testid={`select-datacenter-type-${index}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="primary">Primary</SelectItem>
                                    <SelectItem value="disaster_recovery">Disaster Recovery</SelectItem>
                                    <SelectItem value="backup">Backup</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`geographicOperations.dataCenterLocations.${index}.provider`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Provider</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-datacenter-provider-${index}`}
                                    placeholder="e.g., AWS, Azure" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-testid={`button-remove-datacenter-${index}`}
                            onClick={() => {
                              const current = form.getValues("geographicOperations.dataCenterLocations") || [];
                              form.setValue("geographicOperations.dataCenterLocations", 
                                current.filter((_: string, i: number) => i !== index)
                              );
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <FormField
                      control={form.control}
                      name="geographicOperations.customerRegionsServed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Regions Served</FormLabel>
                          <FormControl>
                            <Textarea 
                              data-testid="textarea-customer-regions"
                              placeholder="Enter regions separated by commas (e.g., North America, EMEA, APAC)"
                              rows={2}
                              value={(field.value || []).join(", ")}
                              onChange={(e) => {
                                const regions = e.target.value.split(",").map(r => r.trim()).filter(r => r);
                                field.onChange(regions);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="geographicOperations.regulatoryJurisdictions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Regulatory Jurisdictions</FormLabel>
                          <FormControl>
                            <Textarea 
                              data-testid="textarea-regulatory-jurisdictions"
                              placeholder="Enter jurisdictions separated by commas (e.g., USA, EU, UK)"
                              rows={2}
                              value={(field.value || []).join(", ")}
                              onChange={(e) => {
                                const jurisdictions = e.target.value.split(",").map(j => j.trim()).filter(j => j);
                                field.onChange(jurisdictions);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="security-infra" className="border rounded-md px-4">
                  <AccordionTrigger 
                    className="text-base font-semibold"
                    data-testid="accordion-trigger-security-infra"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Security Infrastructure
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-6">
                    <FormField
                      control={form.control}
                      name="securityInfrastructure.networkArchitectureSummary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Network Architecture Summary</FormLabel>
                          <FormControl>
                            <Textarea 
                              data-testid="textarea-network-architecture"
                              placeholder="Describe your network architecture..."
                              rows={3}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="securityInfrastructure.firewallVendor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Firewall Vendor</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-firewall-vendor"
                                placeholder="e.g., Palo Alto, Cisco" 
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="securityInfrastructure.idsIpsVendor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IDS/IPS Vendor</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-ids-ips-vendor"
                                placeholder="e.g., Snort, Suricata" 
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="securityInfrastructure.siemSolution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SIEM Solution</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-siem-solution"
                                placeholder="e.g., Splunk, Datadog" 
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="securityInfrastructure.endpointProtection"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endpoint Protection</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-endpoint-protection"
                                placeholder="e.g., CrowdStrike, Carbon Black" 
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="securityInfrastructure.vpnSolution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>VPN Solution</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-vpn-solution"
                                placeholder="e.g., OpenVPN, Cisco AnyConnect" 
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="securityInfrastructure.mfaProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>MFA Provider</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-mfa-provider"
                                placeholder="e.g., Okta, Duo" 
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="securityInfrastructure.identityProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Identity Provider</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-identity-provider"
                                placeholder="e.g., Azure AD, Okta" 
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Encryption Standards</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-encryption"
                          onClick={() => {
                            const current = form.getValues("securityInfrastructure.encryptionStandards") || [];
                            form.setValue("securityInfrastructure.encryptionStandards", [
                              ...current,
                              { type: "", algorithm: "", keyLength: undefined }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Standard
                        </Button>
                      </div>
                      {encryptionStandards.map((_: unknown, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`securityInfrastructure.encryptionStandards.${index}.type`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Type</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-encryption-type-${index}`}
                                    placeholder="e.g., At Rest, In Transit" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`securityInfrastructure.encryptionStandards.${index}.algorithm`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Algorithm</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-encryption-algorithm-${index}`}
                                    placeholder="e.g., AES-256" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`securityInfrastructure.encryptionStandards.${index}.keyLength`}
                            render={({ field }) => (
                              <FormItem className="w-28">
                                <FormLabel className="text-xs">Key Length</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-encryption-keylength-${index}`}
                                    type="number"
                                    placeholder="256" 
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-testid={`button-remove-encryption-${index}`}
                            onClick={() => {
                              const current = form.getValues("securityInfrastructure.encryptionStandards") || [];
                              form.setValue("securityInfrastructure.encryptionStandards", 
                                current.filter((_, i) => i !== index)
                              );
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Backup Solutions</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-backup"
                          onClick={() => {
                            const current = form.getValues("securityInfrastructure.backupSolutions") || [];
                            form.setValue("securityInfrastructure.backupSolutions", [
                              ...current,
                              { type: "", frequency: "", retention: "" }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Backup
                        </Button>
                      </div>
                      {backupSolutions.map((_: unknown, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`securityInfrastructure.backupSolutions.${index}.type`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Type</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-backup-type-${index}`}
                                    placeholder="e.g., Full, Incremental" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`securityInfrastructure.backupSolutions.${index}.frequency`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Frequency</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-backup-frequency-${index}`}
                                    placeholder="e.g., Daily, Weekly" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`securityInfrastructure.backupSolutions.${index}.retention`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Retention</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-backup-retention-${index}`}
                                    placeholder="e.g., 30 days" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-testid={`button-remove-backup-${index}`}
                            onClick={() => {
                              const current = form.getValues("securityInfrastructure.backupSolutions") || [];
                              form.setValue("securityInfrastructure.backupSolutions", 
                                current.filter((_, i) => i !== index)
                              );
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Disaster Recovery Sites</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-dr-site"
                          onClick={() => {
                            const current = form.getValues("securityInfrastructure.disasterRecoverySites") || [];
                            form.setValue("securityInfrastructure.disasterRecoverySites", [
                              ...current,
                              { location: "", type: "", rtoHours: undefined }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add DR Site
                        </Button>
                      </div>
                      {disasterRecoverySites.map((_: unknown, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`securityInfrastructure.disasterRecoverySites.${index}.location`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Location</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-dr-location-${index}`}
                                    placeholder="DR site location" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`securityInfrastructure.disasterRecoverySites.${index}.type`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Type</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-dr-type-${index}`}
                                    placeholder="e.g., Hot, Warm, Cold" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`securityInfrastructure.disasterRecoverySites.${index}.rtoHours`}
                            render={({ field }) => (
                              <FormItem className="w-28">
                                <FormLabel className="text-xs">RTO (hrs)</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-dr-rto-${index}`}
                                    type="number"
                                    placeholder="Hours" 
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-testid={`button-remove-dr-site-${index}`}
                            onClick={() => {
                              const current = form.getValues("securityInfrastructure.disasterRecoverySites") || [];
                              form.setValue("securityInfrastructure.disasterRecoverySites", 
                                current.filter((_, i) => i !== index)
                              );
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="business-continuity" className="border rounded-md px-4">
                  <AccordionTrigger 
                    className="text-base font-semibold"
                    data-testid="accordion-trigger-business-continuity"
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Business Continuity
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="businessContinuity.rtoHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>RTO (Hours)</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-rto-hours"
                                type="number"
                                placeholder="Recovery Time Objective" 
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="businessContinuity.rpoHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>RPO (Hours)</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-rpo-hours"
                                type="number"
                                placeholder="Recovery Point Objective" 
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="businessContinuity.backupFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Backup Frequency</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-backup-frequency"
                                placeholder="e.g., Every 4 hours" 
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="businessContinuity.lastDrTestDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last DR Test Date</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-last-dr-test"
                                type="date"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex flex-wrap gap-6">
                      <FormField
                        control={form.control}
                        name="businessContinuity.bcdrPlanExists"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox
                                data-testid="checkbox-bcdr-plan"
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">BC/DR Plan Exists</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="businessContinuity.incidentResponsePlanExists"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox
                                data-testid="checkbox-incident-response-plan"
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">Incident Response Plan Exists</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="businessContinuity.lastIncidentResponseTest"
                      render={({ field }) => (
                        <FormItem className="max-w-xs">
                          <FormLabel>Last Incident Response Test</FormLabel>
                          <FormControl>
                            <Input 
                              data-testid="input-last-ir-test"
                              type="date"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Critical Systems</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-critical-system"
                          onClick={() => {
                            const current = form.getValues("businessContinuity.criticalSystems") || [];
                            form.setValue("businessContinuity.criticalSystems", [
                              ...current,
                              { system: "", rtoHours: 0, rpoHours: 0 }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add System
                        </Button>
                      </div>
                      {criticalSystems.map((_: any, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`businessContinuity.criticalSystems.${index}.system`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">System Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-critical-system-name-${index}`}
                                    placeholder="System name" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`businessContinuity.criticalSystems.${index}.rtoHours`}
                            render={({ field }) => (
                              <FormItem className="w-28">
                                <FormLabel className="text-xs">RTO (hrs)</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-critical-system-rto-${index}`}
                                    type="number"
                                    placeholder="Hours" 
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`businessContinuity.criticalSystems.${index}.rpoHours`}
                            render={({ field }) => (
                              <FormItem className="w-28">
                                <FormLabel className="text-xs">RPO (hrs)</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-critical-system-rpo-${index}`}
                                    type="number"
                                    placeholder="Hours" 
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-testid={`button-remove-critical-system-${index}`}
                            onClick={() => {
                              const current = form.getValues("businessContinuity.criticalSystems") || [];
                              form.setValue("businessContinuity.criticalSystems", 
                                current.filter((_, i) => i !== index)
                              );
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="vendor-management" className="border rounded-md px-4">
                  <AccordionTrigger 
                    className="text-base font-semibold"
                    data-testid="accordion-trigger-vendor-management"
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Vendor Management
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-6">
                    <FormField
                      control={form.control}
                      name="vendorManagement.vendorRiskAssessmentFrequency"
                      render={({ field }) => (
                        <FormItem className="max-w-md">
                          <FormLabel>Vendor Risk Assessment Frequency</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-vendor-assessment-frequency">
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Monthly">Monthly</SelectItem>
                              <SelectItem value="Quarterly">Quarterly</SelectItem>
                              <SelectItem value="Semi-annually">Semi-annually</SelectItem>
                              <SelectItem value="Annually">Annually</SelectItem>
                              <SelectItem value="As needed">As needed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Critical Vendors</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-vendor"
                          onClick={() => {
                            const current = form.getValues("vendorManagement.criticalVendors") || [];
                            form.setValue("vendorManagement.criticalVendors", [
                              ...current,
                              { name: "", service: "", securityAssessmentStatus: "pending" as const, lastAssessmentDate: "" }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Vendor
                        </Button>
                      </div>
                      {criticalVendors.map((_: any, index: number) => (
                        <div key={index} className="p-4 border rounded-md space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Vendor {index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              data-testid={`button-remove-vendor-${index}`}
                              onClick={() => {
                                const current = form.getValues("vendorManagement.criticalVendors") || [];
                                form.setValue("vendorManagement.criticalVendors", 
                                  current.filter((_, i) => i !== index)
                                );
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <FormField
                              control={form.control}
                              name={`vendorManagement.criticalVendors.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Vendor Name</FormLabel>
                                  <FormControl>
                                    <Input 
                                      data-testid={`input-vendor-name-${index}`}
                                      placeholder="Vendor name" 
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`vendorManagement.criticalVendors.${index}.service`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Service Provided</FormLabel>
                                  <FormControl>
                                    <Input 
                                      data-testid={`input-vendor-service-${index}`}
                                      placeholder="Service" 
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`vendorManagement.criticalVendors.${index}.securityAssessmentStatus`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Assessment Status</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || "pending"}>
                                    <FormControl>
                                      <SelectTrigger data-testid={`select-vendor-status-${index}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="approved">Approved</SelectItem>
                                      <SelectItem value="requires_review">Requires Review</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`vendorManagement.criticalVendors.${index}.lastAssessmentDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Last Assessment</FormLabel>
                                  <FormControl>
                                    <Input 
                                      data-testid={`input-vendor-assessment-date-${index}`}
                                      type="date"
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Third-Party Integrations</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-integration"
                          onClick={() => {
                            const current = form.getValues("vendorManagement.thirdPartyIntegrations") || [];
                            form.setValue("vendorManagement.thirdPartyIntegrations", [
                              ...current,
                              { name: "", type: "", dataShared: [] }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Integration
                        </Button>
                      </div>
                      {thirdPartyIntegrations.map((_: any, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`vendorManagement.thirdPartyIntegrations.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Integration Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-integration-name-${index}`}
                                    placeholder="e.g., Salesforce, Slack" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`vendorManagement.thirdPartyIntegrations.${index}.type`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Type</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-integration-type-${index}`}
                                    placeholder="e.g., CRM, Communication" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-testid={`button-remove-integration-${index}`}
                            onClick={() => {
                              const current = form.getValues("vendorManagement.thirdPartyIntegrations") || [];
                              form.setValue("vendorManagement.thirdPartyIntegrations", 
                                current.filter((_, i) => i !== index)
                              );
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

              </Accordion>

              <div className="flex justify-end pt-6 border-t">
                <Button 
                  type="submit" 
                  disabled={saveProfileMutation.isPending}
                  className="min-w-32"
                  data-testid="button-save-profile"
                >
                  {saveProfileMutation.isPending ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

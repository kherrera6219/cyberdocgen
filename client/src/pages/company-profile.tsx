import { BasicInformationSection } from "@/components/company-profile/BasicInformationSection";
import { TechnicalEnvironmentSection } from "@/components/company-profile/TechnicalEnvironmentSection";
import { OrganizationStructureSection } from "@/components/company-profile/OrganizationStructureSection";
import { KeyPersonnelSection } from "@/components/company-profile/KeyPersonnelSection";
import { ProductsAndServicesSection } from "@/components/company-profile/ProductsAndServicesSection";
import { GeographicOperationsSection } from "@/components/company-profile/GeographicOperationsSection";
import { SecurityInfrastructureSection } from "@/components/company-profile/SecurityInfrastructureSection";
import { BusinessContinuitySection } from "@/components/company-profile/BusinessContinuitySection";
import { VendorManagementSection } from "@/components/company-profile/VendorManagementSection";
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
          name={`keyPersonnel.${String(fieldPrefix)}.name`}
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
          name={`keyPersonnel.${String(fieldPrefix)}.email`}
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
          name={`keyPersonnel.${String(fieldPrefix)}.phone`}
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
        return await apiRequest("PUT", `/api/company-profiles/${profile.id}`, data);
      } else {
        return await apiRequest("POST", "/api/company-profiles", data);
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
                
                <BasicInformationSection form={form} />

                <TechnicalEnvironmentSection form={form} />

                <OrganizationStructureSection form={form} />

                <KeyPersonnelSection form={form} />

                <ProductsAndServicesSection form={form} />

                <GeographicOperationsSection form={form} />

                <SecurityInfrastructureSection form={form} />

                <BusinessContinuitySection form={form} />

                <VendorManagementSection form={form} />

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

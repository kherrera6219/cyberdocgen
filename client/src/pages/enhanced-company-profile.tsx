import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, FileText, Settings, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { type InsertCompanyProfile } from "@shared/schema";

import { 
  enhancedCompanyProfileSchema, 
  type CompanyProfileFormData 
} from "@/components/company-profile/schema";
import { BasicInfoTab } from "@/components/company-profile/BasicInfoTab";
import { PersonnelTab } from "@/components/company-profile/PersonnelTab";
import { FrameworksTab } from "@/components/company-profile/FrameworksTab";
import { FedRampTab } from "@/components/company-profile/FedRampTab";
import { ControlsTab } from "@/components/company-profile/ControlsTab";

export default function EnhancedCompanyProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const form = useForm<CompanyProfileFormData>({
    resolver: zodResolver(enhancedCompanyProfileSchema) as any,
    defaultValues: {
      organizationId: "",
      createdBy: "",
      companyName: "",
      industry: "",
      companySize: "",
      headquarters: "",
      cloudInfrastructure: [],
      dataClassification: "",
      businessApplications: "",
      ceoName: "",
      cisoName: "",
      cisoEmail: "",
      securityOfficerName: "",
      securityOfficerEmail: "",
      complianceOfficerName: "",
      complianceOfficerEmail: "",
      itManagerName: "",
      itManagerEmail: "",
      legalCounselName: "",
      legalCounselEmail: "",
      complianceFrameworks: [],
      contactInfo: undefined,
      selectedFrameworks: [],
      nistControlFamilies: [],
      soc2TrustServices: [],
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: CompanyProfileFormData) => {
      // Transform form data to match schema
      const profileData: InsertCompanyProfile = {
        organizationId: (user as any)?.organizationId || "default-org",
        createdBy: user?.id ? String(user.id) : "unknown-user",
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
            trustServices: data.soc2TrustServices,
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

  const onSubmit = (data: CompanyProfileFormData) => {
    createProfileMutation.mutate(data);
  };

  if (isInitialLoading) {
    return (
      <div className="space-y-6 sm:space-y-8" data-testid="loading-skeleton">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center shadow-md">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">Enhanced Company Profile</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">Create a comprehensive company profile with key personnel and compliance framework configurations</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1" aria-label="Company profile sections">
                <TabsTrigger value="basic" data-testid="tab-basic" aria-label="Basic company information" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Building2 className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Basic Info</span>
                  <span className="sm:hidden">Basic</span>
                </TabsTrigger>
                <TabsTrigger value="personnel" data-testid="tab-personnel" aria-label="Key personnel information" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Key Personnel</span>
                  <span className="sm:hidden">Personnel</span>
                </TabsTrigger>
                <TabsTrigger value="frameworks" data-testid="tab-frameworks" aria-label="Compliance frameworks selection" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                  <span className="hidden lg:inline">Frameworks</span>
                  <span className="lg:hidden">Frameworks</span>
                </TabsTrigger>
                <TabsTrigger value="fedramp" data-testid="tab-fedramp" aria-label="FedRAMP configuration" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                  <span className="hidden lg:inline">FedRAMP</span>
                  <span className="lg:hidden">FedRAMP</span>
                </TabsTrigger>
                <TabsTrigger value="controls" data-testid="tab-controls" aria-label="Control families configuration" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                  <span className="hidden lg:inline">Controls</span>
                  <span className="lg:hidden">Controls</span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-6">
              <BasicInfoTab />
            </TabsContent>

            <TabsContent value="personnel" className="mt-6">
              <PersonnelTab />
            </TabsContent>

            <TabsContent value="frameworks" className="mt-6">
              <FrameworksTab />
            </TabsContent>

            <TabsContent value="fedramp" className="mt-6">
              <FedRampTab />
            </TabsContent>

            <TabsContent value="controls" className="mt-6">
              <ControlsTab />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
               type="submit"
               className="inline-flex justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Save Profile
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}

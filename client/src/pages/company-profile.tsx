import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { HelpTooltip } from "@/components/help/ContextualHelp";
import { insertCompanyProfileSchema } from "@shared/schema";
import type { CompanyProfile, InsertCompanyProfile } from "@shared/schema";
import { Building, Save } from "lucide-react";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";


export default function CompanyProfile() {
  const { toast } = useToast();

  // Get company profiles
  const { data: profiles = [], isLoading } = useQuery<CompanyProfile[]>({
    queryKey: ["/api/company-profiles"],
  });

  const profile = profiles[0];

  const form = useForm<InsertCompanyProfile>({
    resolver: zodResolver(insertCompanyProfileSchema),
    defaultValues: {
      companyName: profile?.companyName || "",
      industry: profile?.industry || "",
      companySize: profile?.companySize || "",
      headquarters: profile?.headquarters || "",
      cloudInfrastructure: profile?.cloudInfrastructure || [],
      dataClassification: profile?.dataClassification || "",
      businessApplications: profile?.businessApplications || "",
    },
  });

  // Create/update company profile mutation
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

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 sm:w-1/4"></div>
          <div className="h-48 sm:h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="space-y-2 sm:space-y-3">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Company Profile</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Configure your company information for accurate compliance documentation</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Building className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
            <CardTitle className="text-base sm:text-lg">Company Information</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter company name" {...field} />
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
                              <SelectTrigger>
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

                    <FormField
                      control={form.control}
                      name="companySize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Size</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
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
                            <Input placeholder="e.g., San Francisco, CA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Technical Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Environment</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="cloudInfrastructure"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <span>Cloud Infrastructure</span>
                            <HelpTooltip topic="cloudInfrastructure" />
                          </FormLabel>
                          <div className="space-y-2">
                            {cloudOptions.map((option) => (
                              <div key={option.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={option.id}
                                  checked={field.value?.includes(option.id) || false}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValue, option.id]);
                                    } else {
                                      field.onChange(currentValue.filter((item) => item !== option.id));
                                    }
                                  }}
                                />
                                <Label htmlFor={option.id} className="text-sm font-normal">
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
                          <FormLabel className="flex items-center space-x-2">
                            <span>Data Classification Level</span>
                            <HelpTooltip topic="dataClassification" />
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
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
                          <FormLabel className="flex items-center space-x-2">
                            <span>Primary Business Applications</span>
                            <HelpTooltip topic="businessApplications" />
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your main business applications and systems..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button 
                  type="submit" 
                  disabled={saveProfileMutation.isPending}
                  className="min-w-32"
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
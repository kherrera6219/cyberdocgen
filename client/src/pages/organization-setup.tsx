import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building, Users, Plus, Settings, Globe, Mail } from "lucide-react";
import { insertOrganizationSchema, type Organization } from "@shared/schema";
import { z } from "zod";



const formSchema = insertOrganizationSchema.extend({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
});

type FormData = z.infer<typeof formSchema>;

export function OrganizationSetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: null,
      website: null,
      contactEmail: null,
    },
  });

  const { data: organizations = [], isLoading } = useQuery<(Organization & { role: string })[]>({
    queryKey: ["/api/organizations"],
  });

  const createOrganizationMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("/api/organizations", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Organization Created",
        description: "Your organization has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setIsCreating(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create organization. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createOrganizationMutation.mutate(data);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    form.setValue('name', name);
    if (!form.formState.dirtyFields.slug) {
      form.setValue('slug', generateSlug(name));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading Organizations...</h2>
          <p className="text-gray-600 dark:text-gray-300">Please wait while we fetch your information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organizations</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Create and manage your organizations for compliance documentation
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Organization List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Organizations</h2>
              <Button 
                onClick={() => setIsCreating(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Organization</span>
              </Button>
            </div>

            {organizations.length > 0 ? (
              <div className="space-y-4">
                {organizations.map((org: Organization & { role: string }) => (
                  <Card key={org.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{org.name}</CardTitle>
                            <CardDescription className="flex items-center space-x-4 mt-1">
                              <span>@{org.slug}</span>
                              {org.website && (
                                <span className="flex items-center space-x-1">
                                  <Globe className="h-3 w-3" />
                                  <span>{org.website}</span>
                                </span>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={org.isActive ? "default" : "secondary"}>
                            {org.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {org.description && (
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-300">{org.description}</p>
                        {org.contactEmail && (
                          <div className="flex items-center space-x-2 mt-3 text-sm text-gray-500">
                            <Mail className="h-4 w-4" />
                            <span>{org.contactEmail}</span>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <Building className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Organizations Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Create your first organization to start managing compliance documentation.
                  </p>
                  <Button onClick={() => setIsCreating(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Organization
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Create Organization Form */}
          <div className="lg:col-span-1">
            {isCreating && (
              <Card>
                <CardHeader>
                  <CardTitle>Create Organization</CardTitle>
                  <CardDescription>
                    Set up a new organization for your compliance documentation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Acme Corporation"
                                {...field}
                                onChange={(e) => handleNameChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL Slug</FormLabel>
                            <FormControl>
                              <Input placeholder="acme-corp" {...field} />
                            </FormControl>
                            <FormDescription>
                              Used in URLs and must be unique
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Brief description of your organization"
                                rows={3}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Email (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="contact@example.com" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <div className="flex space-x-2">
                        <Button 
                          type="submit" 
                          disabled={createOrganizationMutation.isPending}
                          className="flex-1"
                        >
                          {createOrganizationMutation.isPending ? "Creating..." : "Create Organization"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setIsCreating(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Help Card */}
            <Card className={isCreating ? "mt-6" : ""}>
              <CardHeader>
                <CardTitle className="text-lg">Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                    <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Create Organization</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Set up your organization to start managing compliance
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded">
                    <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Invite Team Members</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Collaborate with your team on compliance documentation
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded">
                    <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Configure Settings</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Customize your organization's compliance requirements
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
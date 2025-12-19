import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Settings,
  Bell,
  Shield,
  Globe,
  Moon,
  Palette,
  Layout,
  Monitor,
  Smartphone,
  Clock,
  Calendar,
  FileText,
  Mail,
  AlertTriangle,
  Users,
  Newspaper,
  Lock,
  Key,
  LogOut,
} from "lucide-react";

interface ProfileData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: string;
  phoneNumber: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  profilePreferences: {
    theme?: "light" | "dark" | "system";
    language?: string;
    timezone?: string;
    dateFormat?: string;
    dashboardLayout?: "compact" | "standard" | "expanded";
    defaultFramework?: string;
    aiAssistantEnabled?: boolean;
  };
  notificationSettings: {
    emailNotifications?: boolean;
    documentUpdates?: boolean;
    complianceAlerts?: boolean;
    teamActivity?: boolean;
    weeklyDigest?: boolean;
    securityAlerts?: boolean;
    marketingEmails?: boolean;
  };
  createdAt: string;
  lastLoginAt: string | null;
}

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
});

const preferencesFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.string(),
  timezone: z.string(),
  dashboardLayout: z.enum(["compact", "standard", "expanded"]),
  defaultFramework: z.string(),
  aiAssistantEnabled: z.boolean(),
});

const notificationsFormSchema = z.object({
  emailNotifications: z.boolean(),
  documentUpdates: z.boolean(),
  complianceAlerts: z.boolean(),
  teamActivity: z.boolean(),
  weeklyDigest: z.boolean(),
  securityAlerts: z.boolean(),
  marketingEmails: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;
type PreferencesFormData = z.infer<typeof preferencesFormSchema>;
type NotificationsFormData = z.infer<typeof notificationsFormSchema>;

const timezones = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
];

const frameworks = [
  { value: "soc2", label: "SOC 2" },
  { value: "iso27001", label: "ISO 27001" },
  { value: "fedramp", label: "FedRAMP" },
  { value: "nist", label: "NIST 800-53" },
  { value: "hipaa", label: "HIPAA" },
  { value: "gdpr", label: "GDPR" },
];

function ProfileSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfileSettings() {
  const { toast } = useToast();

  const { data: profile, isLoading, error } = useQuery<ProfileData>({
    queryKey: ["/api/profile/me"],
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
    },
    values: profile
      ? {
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          email: profile.email,
          phoneNumber: profile.phoneNumber || "",
        }
      : undefined,
  });

  const preferencesForm = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      theme: "system",
      language: "en",
      timezone: "UTC",
      dashboardLayout: "standard",
      defaultFramework: "soc2",
      aiAssistantEnabled: true,
    },
    values: profile?.profilePreferences
      ? {
          theme: profile.profilePreferences.theme || "system",
          language: profile.profilePreferences.language || "en",
          timezone: profile.profilePreferences.timezone || "UTC",
          dashboardLayout: profile.profilePreferences.dashboardLayout || "standard",
          defaultFramework: profile.profilePreferences.defaultFramework || "soc2",
          aiAssistantEnabled: profile.profilePreferences.aiAssistantEnabled !== false,
        }
      : undefined,
  });

  const notificationsForm = useForm<NotificationsFormData>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      emailNotifications: true,
      documentUpdates: true,
      complianceAlerts: true,
      teamActivity: true,
      weeklyDigest: false,
      securityAlerts: true,
      marketingEmails: false,
    },
    values: profile?.notificationSettings
      ? {
          emailNotifications: profile.notificationSettings.emailNotifications !== false,
          documentUpdates: profile.notificationSettings.documentUpdates !== false,
          complianceAlerts: profile.notificationSettings.complianceAlerts !== false,
          teamActivity: profile.notificationSettings.teamActivity !== false,
          weeklyDigest: profile.notificationSettings.weeklyDigest === true,
          securityAlerts: profile.notificationSettings.securityAlerts !== false,
          marketingEmails: profile.notificationSettings.marketingEmails === true,
        }
      : undefined,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return apiRequest("/api/profile/me", "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile/me"] });
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: PreferencesFormData) => {
      return apiRequest("/api/profile/me/preferences", "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile/me"] });
      toast({
        title: "Preferences Updated",
        description: "Your preferences have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationsFormData) => {
      return apiRequest("/api/profile/me/notifications", "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile/me"] });
      toast({
        title: "Notification Settings Updated",
        description: "Your notification preferences have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <ProfileSettingsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold" data-testid="text-error-title">
            Failed to Load Profile
          </h2>
          <p className="text-muted-foreground" data-testid="text-error-message">
            There was an error loading your profile. Please try again.
          </p>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/profile/me"] })}
            data-testid="button-retry"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-page-title">
          Profile & Settings
        </h1>
        <p className="text-muted-foreground" data-testid="text-page-description">
          Manage your account settings, preferences, and notifications
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4" data-testid="tabs-settings">
          <TabsTrigger value="profile" data-testid="tab-profile">
            <User className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" data-testid="tab-preferences">
            <Settings className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">
            <Shield className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter your first name"
                              data-testid="input-first-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter your last name"
                              data-testid="input-last-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter your email"
                            disabled
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormDescription>
                          Email cannot be changed. Contact support if you need to update it.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="Enter your phone number"
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormDescription>
                          Used for two-factor authentication and account recovery
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance & Display
              </CardTitle>
              <CardDescription>
                Customize how the application looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...preferencesForm}>
                <form
                  onSubmit={preferencesForm.handleSubmit((data) =>
                    updatePreferencesMutation.mutate(data)
                  )}
                  className="space-y-6"
                >
                  <FormField
                    control={preferencesForm.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Theme
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-theme">
                              <SelectValue placeholder="Select theme" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="light" data-testid="option-theme-light">
                              Light
                            </SelectItem>
                            <SelectItem value="dark" data-testid="option-theme-dark">
                              Dark
                            </SelectItem>
                            <SelectItem value="system" data-testid="option-theme-system">
                              System
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={preferencesForm.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Language
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-language">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languages.map((lang) => (
                              <SelectItem
                                key={lang.value}
                                value={lang.value}
                                data-testid={`option-language-${lang.value}`}
                              >
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={preferencesForm.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Timezone
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-timezone">
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timezones.map((tz) => (
                              <SelectItem
                                key={tz.value}
                                value={tz.value}
                                data-testid={`option-timezone-${tz.value}`}
                              >
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <FormField
                    control={preferencesForm.control}
                    name="dashboardLayout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Layout className="h-4 w-4" />
                          Dashboard Layout
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-dashboard-layout">
                              <SelectValue placeholder="Select layout" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="compact" data-testid="option-layout-compact">
                              Compact
                            </SelectItem>
                            <SelectItem value="standard" data-testid="option-layout-standard">
                              Standard
                            </SelectItem>
                            <SelectItem value="expanded" data-testid="option-layout-expanded">
                              Expanded
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose how information is displayed on your dashboard
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={preferencesForm.control}
                    name="defaultFramework"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Default Compliance Framework
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-default-framework">
                              <SelectValue placeholder="Select framework" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {frameworks.map((fw) => (
                              <SelectItem
                                key={fw.value}
                                value={fw.value}
                                data-testid={`option-framework-${fw.value}`}
                              >
                                {fw.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Default framework for new documents and analyses
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={preferencesForm.control}
                    name="aiAssistantEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">AI Assistant</FormLabel>
                          <FormDescription>
                            Enable AI-powered suggestions and assistance
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-ai-assistant"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={updatePreferencesMutation.isPending}
                      data-testid="button-save-preferences"
                    >
                      {updatePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationsForm}>
                <form
                  onSubmit={notificationsForm.handleSubmit((data) =>
                    updateNotificationsMutation.mutate(data)
                  )}
                  className="space-y-6"
                >
                  <FormField
                    control={notificationsForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Notifications
                          </FormLabel>
                          <FormDescription>
                            Receive email notifications for important updates
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-email-notifications"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationsForm.control}
                    name="documentUpdates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Document Updates
                          </FormLabel>
                          <FormDescription>
                            Get notified when documents are created or updated
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-document-updates"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationsForm.control}
                    name="complianceAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Compliance Alerts
                          </FormLabel>
                          <FormDescription>
                            Receive alerts for compliance issues and deadlines
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-compliance-alerts"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationsForm.control}
                    name="teamActivity"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Team Activity
                          </FormLabel>
                          <FormDescription>
                            Get notified about team member actions and updates
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-team-activity"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationsForm.control}
                    name="weeklyDigest"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="flex items-center gap-2">
                            <Newspaper className="h-4 w-4" />
                            Weekly Digest
                          </FormLabel>
                          <FormDescription>
                            Receive a weekly summary of activity and progress
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-weekly-digest"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationsForm.control}
                    name="securityAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Security Alerts
                          </FormLabel>
                          <FormDescription>
                            Get notified about security events and login activity
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-security-alerts"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationsForm.control}
                    name="marketingEmails"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Marketing Emails
                          </FormLabel>
                          <FormDescription>
                            Receive product updates, tips, and promotional content
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-marketing-emails"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={updateNotificationsMutation.isPending}
                      data-testid="button-save-notifications"
                    >
                      {updateNotificationsMutation.isPending
                        ? "Saving..."
                        : "Save Notification Settings"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    <span className="font-medium">2FA Status</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {profile?.twoFactorEnabled
                      ? "Two-factor authentication is enabled for your account"
                      : "Two-factor authentication is not enabled"}
                  </p>
                </div>
                <Badge
                  variant={profile?.twoFactorEnabled ? "default" : "secondary"}
                  data-testid="badge-2fa-status"
                >
                  {profile?.twoFactorEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              <Button
                variant={profile?.twoFactorEnabled ? "outline" : "default"}
                className="w-full sm:w-auto"
                data-testid="button-manage-2fa"
              >
                <Lock className="h-4 w-4 mr-2" />
                {profile?.twoFactorEnabled ? "Manage 2FA Settings" : "Enable Two-Factor Authentication"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Account Verification
              </CardTitle>
              <CardDescription>
                Verify your contact information for enhanced security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">Email Verification</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
                <Badge
                  variant={profile?.emailVerified ? "default" : "secondary"}
                  data-testid="badge-email-verified"
                >
                  {profile?.emailVerified ? "Verified" : "Not Verified"}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="font-medium">Phone Verification</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {profile?.phoneNumber || "No phone number added"}
                  </p>
                </div>
                <Badge
                  variant={profile?.phoneVerified ? "default" : "secondary"}
                  data-testid="badge-phone-verified"
                >
                  {profile?.phoneVerified ? "Verified" : "Not Verified"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Session Information
              </CardTitle>
              <CardDescription>Details about your account activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <Label className="text-sm text-muted-foreground">Account Created</Label>
                  <p className="font-medium" data-testid="text-account-created">
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Unknown"}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <Label className="text-sm text-muted-foreground">Last Login</Label>
                  <p className="font-medium" data-testid="text-last-login">
                    {profile?.lastLoginAt
                      ? new Date(profile.lastLoginAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Unknown"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" data-testid="button-view-sessions">
                  <Monitor className="h-4 w-4 mr-2" />
                  View Active Sessions
                </Button>
                <Button variant="outline" data-testid="button-logout-all">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out All Devices
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

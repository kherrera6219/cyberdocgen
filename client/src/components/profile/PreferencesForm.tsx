import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Palette, Moon, Globe, Clock, Layout, FileText } from "lucide-react";
import type { ProfileData } from "@/pages/profile-settings";

const preferencesFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.string(),
  timezone: z.string(),
  dashboardLayout: z.enum(["compact", "standard", "expanded"]),
  defaultFramework: z.string(),
  aiAssistantEnabled: z.boolean(),
});

type PreferencesFormData = z.infer<typeof preferencesFormSchema>;

interface PreferencesFormProps {
  profile?: ProfileData;
  onSubmit: (data: PreferencesFormData) => void;
  isLoading: boolean;
}

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

export function PreferencesForm({ profile, onSubmit, isLoading }: PreferencesFormProps) {
  const form = useForm<PreferencesFormData>({
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

  return (
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
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
                disabled={isLoading}
                data-testid="button-save-preferences"
              >
                {isLoading ? "Saving..." : "Save Preferences"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

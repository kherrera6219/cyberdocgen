import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, FileText, AlertTriangle, Users, Newspaper, Shield } from "lucide-react";
import type { ProfileData } from "@/pages/profile-settings";

const notificationsFormSchema = z.object({
  emailNotifications: z.boolean(),
  documentUpdates: z.boolean(),
  complianceAlerts: z.boolean(),
  teamActivity: z.boolean(),
  weeklyDigest: z.boolean(),
  securityAlerts: z.boolean(),
  marketingEmails: z.boolean(),
});

type NotificationsFormData = z.infer<typeof notificationsFormSchema>;

interface NotificationSettingsFormProps {
  profile?: ProfileData;
  onSubmit: (data: NotificationsFormData) => void;
  isLoading: boolean;
}

export function NotificationSettingsForm({ profile, onSubmit, isLoading }: NotificationSettingsFormProps) {
  const form = useForm<NotificationsFormData>({
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

  return (
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
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
                disabled={isLoading}
                data-testid="button-save-notifications"
              >
                {isLoading ? "Saving..." : "Save Notification Settings"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Settings, Bell, Shield, AlertTriangle } from "lucide-react";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PreferencesForm } from "@/components/profile/PreferencesForm";
import { NotificationSettingsForm } from "@/components/profile/NotificationSettingsForm";
import { SecuritySettings } from "@/components/profile/SecuritySettings";

// Type definitions
export interface ProfileData {
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

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
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
    mutationFn: async (data: any) => {
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
    mutationFn: async (data: any) => {
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
          <ProfileForm 
            profile={profile} 
            onSubmit={(data) => updateProfileMutation.mutate(data)}
            isLoading={updateProfileMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <PreferencesForm 
            profile={profile}
            onSubmit={(data) => updatePreferencesMutation.mutate(data)}
            isLoading={updatePreferencesMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettingsForm 
            profile={profile}
            onSubmit={(data) => updateNotificationsMutation.mutate(data)}
            isLoading={updateNotificationsMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecuritySettings profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

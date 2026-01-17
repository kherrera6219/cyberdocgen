import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Shield, Key, Lock, Monitor, Mail, Smartphone, Calendar, LogOut } from "lucide-react";
import type { ProfileData } from "@/pages/profile-settings";

interface SecuritySettingsProps {
  profile?: ProfileData;
}

export function SecuritySettings({ profile }: SecuritySettingsProps) {
  return (
    <div className="space-y-6">
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
    </div>
  );
}

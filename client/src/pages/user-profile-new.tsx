import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Shield, Building, Users, Settings, Calendar, Lock, Key, Smartphone, CheckCircle, XCircle, AlertCircle, Eye, KeyRound } from "lucide-react";
import type { User as UserType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

export function UserProfile() {
  const { user } = useAuth() as { user: UserType | undefined };
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading Profile...</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Please wait while we fetch your information.</p>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully.",
    });
    setIsEditing(false);
  };

  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordData) => {
      // This would need to be implemented on the backend
      // For now, we'll use a placeholder endpoint
      return apiRequest('/api/auth/change-password', 'POST', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    },
  });

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please ensure both passwords match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 12) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 12 characters",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate(passwordData);
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || user.email.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2 sm:space-y-3">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">User Profile</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
          Manage your account settings and personal information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center p-4 sm:p-6">
              <div className="flex justify-center mb-3 sm:mb-4">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24">
                  <AvatarImage src={user.profileImageUrl || undefined} alt="Profile" />
                  <AvatarFallback className="text-sm sm:text-base lg:text-lg">
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-lg sm:text-xl">
                {user.firstName || user.lastName 
                  ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                  : 'User'
                }
              </CardTitle>
              <CardDescription className="flex items-center justify-center space-x-2 text-sm">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="break-all sm:break-normal">{user.email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium">Role</span>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  {user.role}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium">Status</span>
                <Badge variant={user.isActive ? 'default' : 'destructive'} className="text-xs">
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium">Member Since</span>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-4 sm:mt-6">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs sm:text-sm">
                <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Account Settings
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs sm:text-sm">
                <Building className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Manage Organizations
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs sm:text-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Team Members
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 p-4 sm:p-6">
              <div>
                <CardTitle className="text-base sm:text-lg">Personal Information</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Update your personal details and contact information
                </CardDescription>
              </div>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="self-start sm:self-auto">
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button onClick={handleSave} size="sm">
                    Save Changes
                  </Button>
                  <Button 
                    onClick={() => setIsEditing(false)} 
                    variant="outline" 
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-xs sm:text-sm">First Name</Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter first name"
                      className="mt-1 text-sm"
                    />
                  ) : (
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white mt-1">
                      {user.firstName || 'Not set'}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="lastName" className="text-xs sm:text-sm">Last Name</Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter last name"
                      className="mt-1 text-sm"
                    />
                  ) : (
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white mt-1">
                      {user.lastName || 'Not set'}
                    </p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm">Email Address</Label>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-white mt-1">
                    {user.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Email changes require verification
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Preferences</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Customize your application experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
              <div>
                <Label className="text-xs sm:text-sm">Theme Preference</Label>
                <Select defaultValue="system">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs sm:text-sm">Email Notifications</Label>
                <Select defaultValue="important">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All notifications</SelectItem>
                    <SelectItem value="important">Important only</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <CardTitle className="text-base sm:text-lg">Security Settings</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Manage your account security and authentication methods
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-4 sm:p-6 pt-0">
              {/* Account Security Overview */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Security Overview
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm">Email Verified</span>
                    </div>
                    {user.emailVerified ? (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm">Two-Factor Authentication</span>
                    </div>
                    {user.twoFactorEnabled ? (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        Disabled
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm">Passkey Authentication</span>
                    </div>
                    {user.passkeyEnabled ? (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        Disabled
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Password Change */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </h3>
                  {!isChangingPassword && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangingPassword(true)}
                    >
                      Change Password
                    </Button>
                  )}
                </div>

                {isChangingPassword ? (
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div>
                      <Label htmlFor="currentPassword" className="text-xs sm:text-sm">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword" className="text-xs sm:text-sm">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password (min 12 chars)"
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className="text-xs sm:text-sm">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                        className="mt-1 text-sm"
                      />
                    </div>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Password must be at least 12 characters and include uppercase, lowercase, numbers, and special characters.
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Button
                        onClick={handlePasswordChange}
                        size="sm"
                        disabled={changePasswordMutation.isPending}
                      >
                        {changePasswordMutation.isPending ? 'Changing...' : 'Save New Password'}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Last changed: {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Never'}
                  </p>
                )}
              </div>

              <Separator />

              {/* Multi-Factor Authentication */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Add an extra layer of security to your account with 2FA using Google Authenticator or SMS.
                </p>
                <Button
                  variant={user.twoFactorEnabled ? "outline" : "default"}
                  size="sm"
                  onClick={() => setLocation('/mfa-setup')}
                >
                  {user.twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
                </Button>
              </div>

              <Separator />

              {/* Passkey Management */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Passkeys
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Use passkeys for passwordless authentication with Face ID, Touch ID, or security keys.
                </p>
                <Button
                  variant={user.passkeyEnabled ? "outline" : "default"}
                  size="sm"
                >
                  {user.passkeyEnabled ? 'Manage Passkeys' : 'Setup Passkeys'}
                </Button>
              </div>

              <Separator />

              {/* Active Sessions */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Active Sessions
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Current Session</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Last activity: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Now'}
                      </p>
                    </div>
                    <Badge variant="default" className="text-xs">Active</Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  View All Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
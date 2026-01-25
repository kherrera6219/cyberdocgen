import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Shield, Building, Users, Settings, Calendar } from "lucide-react";
import type { User as UserType } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function UserProfile() {
  const { user } = useAuth() as { user: UserType | undefined };
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line
      setFormData(prev => {
        const newFirstName = user.firstName || '';
        const newLastName = user.lastName || '';
        if (prev.firstName !== newFirstName || prev.lastName !== newLastName) {
          return {
            firstName: newFirstName,
            lastName: newLastName,
          };
        }
        return prev;
      });
    }
  }, [user]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("PATCH", "/api/user", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
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
    updateUserMutation.mutate(formData);
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
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-xs sm:text-sm"
                onClick={() => setLocation('/profile/settings')}
                data-testid="button-account-settings"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Account Settings
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-xs sm:text-sm"
                onClick={() => setLocation('/organizations')}
                data-testid="button-manage-organizations"
              >
                <Building className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Manage Organizations
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-xs sm:text-sm"
                onClick={() => setLocation('/organizations')}
                data-testid="button-team-members"
              >
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
              <div className="flex space-x-2">
                <Button onClick={() => setIsEditing(!isEditing)} variant="outline" size="sm" disabled={updateUserMutation.isPending}>
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
                {isEditing && (
                  <Button onClick={handleSave} size="sm" disabled={updateUserMutation.isPending}>
                    {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-xs sm:text-sm">First Name</Label>
                  {isEditing ? (
                    <Input 
                      id="firstName" 
                      value={formData.firstName} 
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                      className="mt-1"
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
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                      className="mt-1"
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
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
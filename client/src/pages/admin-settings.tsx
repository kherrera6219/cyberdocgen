import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Settings, 
  Key, 
  Cloud, 
  Shield, 
  Save, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  Trash2,
  Folder,
  FileText,
  Users,
  UserPlus,
  ShieldCheck
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { logger } from '../utils/logger';

const oauthConfigSchema = z.object({
  googleClientId: z.string().optional(),
  googleClientSecret: z.string().optional(),
  microsoftClientId: z.string().optional(),
  microsoftClientSecret: z.string().optional(),
});

const pdfSecurityDefaultsSchema = z.object({
  defaultEncryptionLevel: z.enum(['RC4_40', 'RC4_128', 'AES128', 'AES256']),
  defaultAllowPrinting: z.boolean(),
  defaultAllowCopying: z.boolean(),
  defaultAllowModifying: z.boolean(),
  defaultAllowAnnotations: z.boolean(),
  defaultWatermarkText: z.string(),
  defaultWatermarkOpacity: z.number().min(0).max(1),
});

type OAuthConfigForm = z.infer<typeof oauthConfigSchema>;
type PDFSecurityDefaultsForm = z.infer<typeof pdfSecurityDefaultsSchema>;

interface OAuthSettings {
  googleConfigured?: boolean;
  microsoftConfigured?: boolean;
  googleClientId?: string;
  microsoftClientId?: string;
}

interface CloudIntegration {
  id: string;
  provider: string;
  displayName: string;
  email: string;
  isActive: boolean;
  lastSyncAt: string;
  syncStatus: string;
  createdAt: string;
}

interface OrgUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  permissions: Record<string, boolean>;
  isDefault: boolean;
}

interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  roleName: string;
  roleDisplayName: string;
  userEmail: string;
  userFirstName: string | null;
  userLastName: string | null;
  createdAt: string;
}

export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center py-16">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Administrator privileges required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const oauthForm = useForm<OAuthConfigForm>({
    resolver: zodResolver(oauthConfigSchema),
    defaultValues: {
      googleClientId: '',
      googleClientSecret: '',
      microsoftClientId: '',
      microsoftClientSecret: '',
    },
  });

  const pdfForm = useForm<PDFSecurityDefaultsForm>({
    resolver: zodResolver(pdfSecurityDefaultsSchema),
    defaultValues: {
      defaultEncryptionLevel: 'AES256',
      defaultAllowPrinting: false,
      defaultAllowCopying: false,
      defaultAllowModifying: false,
      defaultAllowAnnotations: false,
      defaultWatermarkText: 'CONFIDENTIAL',
      defaultWatermarkOpacity: 0.3,
    },
  });

  // Get current OAuth settings
  const { data: oauthSettings } = useQuery<OAuthSettings>({
    queryKey: ['/api/admin/oauth-settings'],
  });

  // Get PDF security defaults
  const { data: pdfDefaults } = useQuery({
    queryKey: ['/api/admin/pdf-defaults'],
  });

  // Get all organization cloud integrations
  const { data: integrations } = useQuery<{ integrations: CloudIntegration[] }>({
    queryKey: ['/api/admin/cloud-integrations'],
  });

  // Get user's organizations
  const { data: organizations } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['/api/organizations'],
  });

  // Get roles for selected organization
  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['/api/roles', selectedOrgId],
    enabled: !!selectedOrgId,
  });

  // Get role assignments for selected organization
  const { data: roleAssignments = [], isLoading: assignmentsLoading } = useQuery<RoleAssignment[]>({
    queryKey: ['/api/roles/assignments/organization', selectedOrgId],
    enabled: !!selectedOrgId,
  });

  // Save OAuth settings
  const saveOAuthMutation = useMutation({
    mutationFn: async (data: OAuthConfigForm) => {
      return apiRequest('/api/admin/oauth-settings', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: 'OAuth Settings Saved',
        description: 'Cloud integration settings have been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/oauth-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save OAuth settings',
        variant: 'destructive',
      });
    },
  });

  // Save PDF security defaults
  const savePDFDefaultsMutation = useMutation({
    mutationFn: async (data: PDFSecurityDefaultsForm) => {
      return apiRequest('/api/admin/pdf-defaults', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: 'PDF Defaults Saved',
        description: 'Default PDF security settings have been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pdf-defaults'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save PDF defaults',
        variant: 'destructive',
      });
    },
  });

  // Delete cloud integration
  const deleteIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      return apiRequest(`/api/admin/cloud-integrations/${integrationId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: 'Integration Deleted',
        description: 'Cloud integration has been removed successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cloud-integrations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete integration',
        variant: 'destructive',
      });
    },
  });

  // Assign role to user
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId, organizationId }: { userId: string; roleId: string; organizationId: string }) => {
      return apiRequest('/api/roles/assignments', 'POST', { userId, roleId, organizationId });
    },
    onSuccess: () => {
      toast({
        title: 'Role Assigned',
        description: 'Role has been assigned to the user.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roles/assignments/organization', selectedOrgId] });
      setSelectedUserId('');
      setSelectedRoleId('');
    },
    onError: (error: any) => {
      toast({
        title: 'Assignment Failed',
        description: error.message || 'Failed to assign role',
        variant: 'destructive',
      });
    },
  });

  // Remove role assignment
  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return apiRequest(`/api/roles/assignments/${assignmentId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: 'Role Removed',
        description: 'Role assignment has been removed.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roles/assignments/organization', selectedOrgId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Removal Failed',
        description: error.message || 'Failed to remove role assignment',
        variant: 'destructive',
      });
    },
  });

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  const onSaveOAuth = (data: OAuthConfigForm) => {
    saveOAuthMutation.mutate(data);
  };

  const onSavePDFDefaults = (data: PDFSecurityDefaultsForm) => {
    savePDFDefaultsMutation.mutate(data);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Admin Settings</h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Configure system-wide settings for cloud integrations and security defaults
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1 w-full">
            <TabsTrigger value="users" className="flex-1 min-w-[100px] flex items-center justify-center gap-2 text-xs sm:text-sm" data-testid="tab-users">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users & Roles</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="oauth" className="flex-1 min-w-[100px] flex items-center justify-center gap-2 text-xs sm:text-sm" data-testid="tab-oauth">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">OAuth Settings</span>
              <span className="sm:hidden">OAuth</span>
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex-1 min-w-[100px] flex items-center justify-center gap-2 text-xs sm:text-sm" data-testid="tab-pdf">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">PDF Security</span>
              <span className="sm:hidden">PDF</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex-1 min-w-[100px] flex items-center justify-center gap-2 text-xs sm:text-sm" data-testid="tab-integrations">
              <Cloud className="h-4 w-4" />
              <span className="hidden sm:inline">Integrations</span>
              <span className="sm:hidden">Cloud</span>
            </TabsTrigger>
          </TabsList>

          {/* Users & Roles Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Role Management
                </CardTitle>
                <CardDescription>
                  Manage user roles and permissions across your organizations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Organization Selector */}
                <div className="space-y-2">
                  <Label>Select Organization</Label>
                  <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                    <SelectTrigger data-testid="select-organization">
                      <SelectValue placeholder="Choose an organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations?.map((org) => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedOrgId && (
                  <>
                    {/* Available Roles */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Available Roles
                      </h3>
                      {rolesLoading ? (
                        <div className="text-center py-4 text-muted-foreground">Loading roles...</div>
                      ) : roles.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">No roles found for this organization</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {roles.map((role) => (
                            <div key={role.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold">{role.displayName}</h4>
                                {role.isDefault && <Badge variant="secondary">Default</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{role.description || 'No description'}</p>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(role.permissions || {}).filter(([_, v]) => v).slice(0, 3).map(([key]) => (
                                  <Badge key={key} variant="outline" className="text-xs">{key.replace(/_/g, ' ')}</Badge>
                                ))}
                                {Object.values(role.permissions || {}).filter(Boolean).length > 3 && (
                                  <Badge variant="outline" className="text-xs">+{Object.values(role.permissions).filter(Boolean).length - 3} more</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Current Role Assignments */}
                    <div className="space-y-4 pt-6 border-t">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Role Assignments
                      </h3>
                      {assignmentsLoading ? (
                        <div className="text-center py-4 text-muted-foreground">Loading assignments...</div>
                      ) : roleAssignments.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">No role assignments found</div>
                      ) : (
                        <div className="space-y-2">
                          {roleAssignments.map((assignment) => (
                            <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                  {(assignment.userFirstName?.[0] || assignment.userEmail[0]).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {assignment.userFirstName && assignment.userLastName 
                                      ? `${assignment.userFirstName} ${assignment.userLastName}` 
                                      : assignment.userEmail}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{assignment.userEmail}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge>{assignment.roleDisplayName}</Badge>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => removeAssignmentMutation.mutate(assignment.id)}
                                  disabled={removeAssignmentMutation.isPending}
                                  data-testid={`button-remove-assignment-${assignment.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {!selectedOrgId && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-300">Select an organization to manage users and roles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* OAuth Settings Tab */}
          <TabsContent value="oauth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Cloud Provider OAuth Credentials
                </CardTitle>
                <CardDescription>
                  Configure OAuth applications for Google Drive and Microsoft OneDrive integrations.
                  These credentials will be used by all users in your organization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={oauthForm.handleSubmit(onSaveOAuth)} className="space-y-6">
                  {/* Google OAuth Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        Google Drive Integration
                      </h3>
                      <Badge variant={oauthSettings?.googleConfigured ? "default" : "secondary"}>
                        {oauthSettings?.googleConfigured ? "Configured" : "Not Configured"}
                      </Badge>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Setup Instructions:</h4>
                      <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                        <li>1. Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
                          Google Cloud Console <ExternalLink className="h-3 w-3" />
                        </a></li>
                        <li>2. Create a new project or select existing</li>
                        <li>3. Enable Google Drive API and Google+ API</li>
                        <li>4. Create OAuth 2.0 credentials</li>
                        <li>5. Set authorized redirect URI to: <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">
                          {window.location.origin}/api/cloud/auth/google/callback
                        </code></li>
                      </ol>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="googleClientId">Google Client ID</Label>
                        <Input
                          id="googleClientId"
                          placeholder="Enter Google Client ID"
                          {...oauthForm.register('googleClientId')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="googleClientSecret">Google Client Secret</Label>
                        <div className="relative">
                          <Input
                            id="googleClientSecret"
                            type={showSecrets.googleClientSecret ? 'text' : 'password'}
                            placeholder="Enter Google Client Secret"
                            {...oauthForm.register('googleClientSecret')}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                            onClick={() => toggleSecretVisibility('googleClientSecret')}
                          >
                            {showSecrets.googleClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Microsoft OAuth Section */}
                  <div className="space-y-4 pt-6 border-t">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        Microsoft OneDrive Integration
                      </h3>
                      <Badge variant={oauthSettings?.microsoftConfigured ? "default" : "secondary"}>
                        {oauthSettings?.microsoftConfigured ? "Configured" : "Not Configured"}
                      </Badge>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Setup Instructions:</h4>
                      <ol className="text-sm text-purple-700 dark:text-purple-400 space-y-1">
                        <li>1. Go to <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
                          Azure Portal <ExternalLink className="h-3 w-3" />
                        </a></li>
                        <li>2. Register a new application in Azure Active Directory</li>
                        <li>3. Add Microsoft Graph API permissions (User.Read, Files.Read)</li>
                        <li>4. Create a client secret</li>
                        <li>5. Set redirect URI to: <code className="bg-purple-200 dark:bg-purple-800 px-1 rounded">
                          {window.location.origin}/api/cloud/auth/microsoft/callback
                        </code></li>
                      </ol>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="microsoftClientId">Microsoft Client ID</Label>
                        <Input
                          id="microsoftClientId"
                          placeholder="Enter Microsoft Client ID"
                          {...oauthForm.register('microsoftClientId')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="microsoftClientSecret">Microsoft Client Secret</Label>
                        <div className="relative">
                          <Input
                            id="microsoftClientSecret"
                            type={showSecrets.microsoftClientSecret ? 'text' : 'password'}
                            placeholder="Enter Microsoft Client Secret"
                            {...oauthForm.register('microsoftClientSecret')}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                            onClick={() => toggleSecretVisibility('microsoftClientSecret')}
                          >
                            {showSecrets.microsoftClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={saveOAuthMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {saveOAuthMutation.isPending ? 'Saving...' : 'Save OAuth Settings'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PDF Security Defaults Tab */}
          <TabsContent value="pdf" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Default PDF Security Settings
                </CardTitle>
                <CardDescription>
                  Configure default security settings that will be applied to new PDF files.
                  Users can override these settings for individual files.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={pdfForm.handleSubmit(onSavePDFDefaults)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Encryption Settings</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="defaultEncryptionLevel">Default Encryption Level</Label>
                        <select
                          id="defaultEncryptionLevel"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          {...pdfForm.register('defaultEncryptionLevel')}
                        >
                          <option value="AES256">AES 256-bit (Highest Security)</option>
                          <option value="AES128">AES 128-bit (High Security)</option>
                          <option value="RC4_128">RC4 128-bit (Medium Security)</option>
                          <option value="RC4_40">RC4 40-bit (Low Security)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Default Permissions</h3>
                      
                      <div className="space-y-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            {...pdfForm.register('defaultAllowPrinting')}
                            className="rounded border-gray-300"
                          />
                          <span>Allow Printing</span>
                        </label>
                        
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            {...pdfForm.register('defaultAllowCopying')}
                            className="rounded border-gray-300"
                          />
                          <span>Allow Text/Image Copying</span>
                        </label>
                        
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            {...pdfForm.register('defaultAllowModifying')}
                            className="rounded border-gray-300"
                          />
                          <span>Allow Document Modification</span>
                        </label>
                        
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            {...pdfForm.register('defaultAllowAnnotations')}
                            className="rounded border-gray-300"
                          />
                          <span>Allow Annotations</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t">
                    <h3 className="text-lg font-semibold">Default Watermark Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="defaultWatermarkText">Default Watermark Text</Label>
                        <Input
                          id="defaultWatermarkText"
                          placeholder="e.g., CONFIDENTIAL"
                          {...pdfForm.register('defaultWatermarkText')}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="defaultWatermarkOpacity">Default Watermark Opacity</Label>
                        <Input
                          id="defaultWatermarkOpacity"
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          placeholder="0.3"
                          {...pdfForm.register('defaultWatermarkOpacity', { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={savePDFDefaultsMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {savePDFDefaultsMutation.isPending ? 'Saving...' : 'Save PDF Defaults'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Active Cloud Integrations
                </CardTitle>
                <CardDescription>
                  Monitor and manage all cloud storage integrations across your organization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!integrations?.integrations || integrations.integrations.length === 0 ? (
                  <div className="text-center py-8">
                    <Cloud className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-300">No cloud integrations found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Users will see cloud integration options once OAuth settings are configured.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {integrations.integrations.map((integration) => (
                      <div key={integration.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                              {integration.provider === 'google_drive' ? <Folder className="h-5 w-5 text-yellow-500" /> : <FileText className="h-5 w-5 text-blue-500" />}
                            </div>
                            <div>
                              <h3 className="font-semibold">{integration.displayName}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{integration.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={integration.isActive ? "default" : "secondary"}>
                                  {integration.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Badge variant={
                                  integration.syncStatus === 'completed' ? "default" :
                                  integration.syncStatus === 'error' ? "destructive" :
                                  integration.syncStatus === 'syncing' ? "secondary" : "outline"
                                }>
                                  {integration.syncStatus}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="text-right text-sm text-gray-500">
                              <div>Created: {new Date(integration.createdAt).toLocaleDateString()}</div>
                              {integration.lastSyncAt && (
                                <div>Last sync: {new Date(integration.lastSyncAt).toLocaleDateString()}</div>
                              )}
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteIntegrationMutation.mutate(integration.id)}
                              disabled={deleteIntegrationMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

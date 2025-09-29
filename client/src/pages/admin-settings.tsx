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
  Trash2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const oauthConfigSchema = z
  .object({
    googleClientId: z.string().optional(),
    googleClientSecret: z.string().optional(),
    microsoftClientId: z.string().optional(),
    microsoftClientSecret: z.string().optional(),
    microsoftTenantId: z
      .string()
      .regex(/^[0-9a-fA-F-]{36}$/, 'Tenant ID must be a valid Microsoft GUID')
      .optional(),
    microsoftAuthorityHost: z.string().url('Authority host must be a valid URL').optional(),
  })
  .superRefine((data, ctx) => {
    const hasGoogleConfig = data.googleClientId || data.googleClientSecret;
    if (hasGoogleConfig && (!data.googleClientId || !data.googleClientSecret)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['googleClientId'],
        message: 'Google Client ID and Secret are both required when configuring Google OAuth.',
      });
    }

    const hasMicrosoftConfig =
      data.microsoftClientId || data.microsoftClientSecret || data.microsoftTenantId || data.microsoftAuthorityHost;

    if (hasMicrosoftConfig && (!data.microsoftClientId || !data.microsoftClientSecret || !data.microsoftTenantId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['microsoftTenantId'],
        message: 'Microsoft Client ID, Secret, and Tenant ID are required for enterprise compliance.',
      });
    }
  });

const pdfSecurityDefaultsSchema = z.object({
  defaultEncryptionLevel: z.enum(['RC4_40', 'RC4_128', 'AES128', 'AES256']).default('AES256'),
  defaultAllowPrinting: z.boolean().default(false),
  defaultAllowCopying: z.boolean().default(false),
  defaultAllowModifying: z.boolean().default(false),
  defaultAllowAnnotations: z.boolean().default(false),
  defaultWatermarkText: z.string().default('CONFIDENTIAL'),
  defaultWatermarkOpacity: z.number().min(0).max(1).default(0.3),
});

type OAuthConfigForm = z.infer<typeof oauthConfigSchema>;
type PDFSecurityDefaultsForm = z.infer<typeof pdfSecurityDefaultsSchema>;

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

export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
      microsoftTenantId: '',
      microsoftAuthorityHost: 'https://login.microsoftonline.com',
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
  const { data: oauthSettings } = useQuery({
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold">Admin Settings</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Configure system-wide settings for cloud integrations and security defaults
          </p>
        </div>

        <Tabs defaultValue="oauth" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="oauth" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              OAuth Settings
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              PDF Security
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              Active Integrations
            </TabsTrigger>
          </TabsList>

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
                        <li>4. Capture the Directory (tenant) ID from Azure Active Directory &gt; Overview</li>
                        <li>5. Create a client secret</li>
                        <li>6. Set redirect URI to: <code className="bg-purple-200 dark:bg-purple-800 px-1 rounded">
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
                      <div className="space-y-2">
                        <Label htmlFor="microsoftTenantId">Microsoft Tenant ID</Label>
                        <Input
                          id="microsoftTenantId"
                          placeholder="Enter Microsoft Tenant (Directory) ID"
                          {...oauthForm.register('microsoftTenantId')}
                        />
                        <p className="text-xs text-muted-foreground">
                          Use the Directory (tenant) ID from Azure Active Directory to enforce enterprise scoping.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="microsoftAuthorityHost">Authority Host (optional)</Label>
                        <Input
                          id="microsoftAuthorityHost"
                          placeholder="https://login.microsoftonline.com"
                          {...oauthForm.register('microsoftAuthorityHost')}
                        />
                        <p className="text-xs text-muted-foreground">
                          Override for national cloud deployments. Defaults to the global Microsoft authority.
                        </p>
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
                              {integration.provider === 'google_drive' ? '📁' : '📄'}
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
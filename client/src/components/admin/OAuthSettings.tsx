import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, Eye, EyeOff, Save, ExternalLink } from 'lucide-react';

export const oauthConfigSchema = z.object({
  googleClientId: z.string().optional(),
  googleClientSecret: z.string().optional(),
  microsoftClientId: z.string().optional(),
  microsoftClientSecret: z.string().optional(),
});

export type OAuthConfigForm = z.infer<typeof oauthConfigSchema>;

export interface OAuthSettingsData {
  googleConfigured?: boolean;
  microsoftConfigured?: boolean;
  googleClientId?: string;
  microsoftClientId?: string;
}

interface OAuthSettingsProps {
  settings?: OAuthSettingsData;
  onSave: (data: OAuthConfigForm) => void;
  isSaving: boolean;
}

export function OAuthSettings({ settings, onSave, isSaving }: OAuthSettingsProps) {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const form = useForm<OAuthConfigForm>({
    resolver: zodResolver(oauthConfigSchema),
    defaultValues: {
      googleClientId: '',
      googleClientSecret: '',
      microsoftClientId: '',
      microsoftClientSecret: '',
    },
  });

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
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
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
          {/* Google OAuth Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Google Drive Integration
              </h3>
              <Badge variant={settings?.googleConfigured ? "default" : "secondary"}>
                {settings?.googleConfigured ? "Configured" : "Not Configured"}
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
                  {...form.register('googleClientId')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="googleClientSecret">Google Client Secret</Label>
                <div className="relative">
                  <Input
                    id="googleClientSecret"
                    type={showSecrets.googleClientSecret ? 'text' : 'password'}
                    placeholder="Enter Google Client Secret"
                    {...form.register('googleClientSecret')}
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
              <Badge variant={settings?.microsoftConfigured ? "default" : "secondary"}>
                {settings?.microsoftConfigured ? "Configured" : "Not Configured"}
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
                  {...form.register('microsoftClientId')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="microsoftClientSecret">Microsoft Client Secret</Label>
                <div className="relative">
                  <Input
                    id="microsoftClientSecret"
                    type={showSecrets.microsoftClientSecret ? 'text' : 'password'}
                    placeholder="Enter Microsoft Client Secret"
                    {...form.register('microsoftClientSecret')}
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
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save OAuth Settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Cloud, 
  Plus, 
  RefreshCw, 
  FileText, 
  Shield, 
  Download, 
  Eye,
  Settings,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Folder,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

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

interface CloudFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  securityLevel: string;
  isSecurityLocked: boolean;
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canDownload: boolean;
    canShare: boolean;
  };
  webViewUrl?: string;
  downloadUrl?: string;
  lastModified: string;
  syncedAt: string;
}

export default function CloudIntegrations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');

  // Get user's cloud integrations
  const { data: integrationsData, isLoading: integrationsLoading } = useQuery<{ integrations: CloudIntegration[] }>({
    queryKey: ['/api/cloud/integrations'],
  });

  // Get cloud files
  const { data: filesData, isLoading: filesLoading } = useQuery<{ files: CloudFile[] }>({
    queryKey: ['/api/cloud/files', { 
      provider: selectedProvider !== 'all' ? selectedProvider : undefined,
      fileType: selectedFileType !== 'all' ? selectedFileType : undefined,
    }],
  });

  // Sync files mutation
  const syncFilesMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      return apiRequest('/api/cloud/sync', 'POST', { integrationId });
    },
    onSuccess: () => {
      toast({
        title: 'Sync Started',
        description: 'Files are being synchronized from your cloud storage.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cloud/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cloud/integrations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync files',
        variant: 'destructive',
      });
    },
  });

  // Delete integration mutation
  const deleteIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      return apiRequest(`/api/cloud/integrations/${integrationId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: 'Integration Removed',
        description: 'Cloud integration has been disconnected successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cloud/integrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cloud/files'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to remove integration',
        variant: 'destructive',
      });
    },
  });

  const handleConnectGoogle = () => {
    window.location.href = '/api/cloud/auth/google?organizationId=default';
  };

  const handleConnectMicrosoft = () => {
    window.location.href = '/api/cloud/auth/microsoft?organizationId=default';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google_drive':
        return <Folder className="w-4 h-4" />;
      case 'onedrive':
        return <FileText className="w-4 h-4" />;
      default:
        return <Cloud className="w-4 h-4" />;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google_drive':
        return 'Google Drive';
      case 'onedrive':
        return 'Microsoft OneDrive';
      default:
        return provider;
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'syncing':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'confidential':
        return 'destructive';
      case 'restricted':
        return 'secondary';
      case 'standard':
      default:
        return 'outline';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cloud className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold">Cloud Integrations</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Connect and manage your cloud storage accounts
                </p>
              </div>
            </div>
            
            {user.role === 'admin' && (
              <Button
                variant="outline"
                onClick={() => window.location.href = '/admin'}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Admin Settings
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          {/* Connection Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="h-5 w-5" /> Google Drive
                </CardTitle>
                <CardDescription>
                  Access and secure your Google Drive documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {integrationsData?.integrations?.find(i => i.provider === 'google_drive') ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {integrationsData.integrations.find(i => i.provider === 'google_drive')?.displayName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {integrationsData.integrations.find(i => i.provider === 'google_drive')?.email}
                        </p>
                      </div>
                      <Badge variant={getSyncStatusColor(
                        integrationsData.integrations.find(i => i.provider === 'google_drive')?.syncStatus || ''
                      )}>
                        {integrationsData.integrations.find(i => i.provider === 'google_drive')?.syncStatus}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const integration = integrationsData.integrations.find(i => i.provider === 'google_drive');
                          if (integration) {
                            syncFilesMutation.mutate(integration.id);
                          }
                        }}
                        disabled={syncFilesMutation.isPending}
                        className="flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Sync Files
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const integration = integrationsData.integrations.find(i => i.provider === 'google_drive');
                          if (integration) {
                            deleteIntegrationMutation.mutate(integration.id);
                          }
                        }}
                        disabled={deleteIntegrationMutation.isPending}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Connect your Google Drive to access and secure your documents
                    </p>
                    <Button onClick={handleConnectGoogle} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Connect Google Drive
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Microsoft OneDrive
                </CardTitle>
                <CardDescription>
                  Access and secure your OneDrive documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {integrationsData?.integrations?.find(i => i.provider === 'onedrive') ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {integrationsData.integrations.find(i => i.provider === 'onedrive')?.displayName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {integrationsData.integrations.find(i => i.provider === 'onedrive')?.email}
                        </p>
                      </div>
                      <Badge variant={getSyncStatusColor(
                        integrationsData.integrations.find(i => i.provider === 'onedrive')?.syncStatus || ''
                      )}>
                        {integrationsData.integrations.find(i => i.provider === 'onedrive')?.syncStatus}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const integration = integrationsData.integrations.find(i => i.provider === 'onedrive');
                          if (integration) {
                            syncFilesMutation.mutate(integration.id);
                          }
                        }}
                        disabled={syncFilesMutation.isPending}
                        className="flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Sync Files
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const integration = integrationsData.integrations.find(i => i.provider === 'onedrive');
                          if (integration) {
                            deleteIntegrationMutation.mutate(integration.id);
                          }
                        }}
                        disabled={deleteIntegrationMutation.isPending}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Connect your Microsoft OneDrive to access and secure your documents
                    </p>
                    <Button onClick={handleConnectMicrosoft} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Connect OneDrive
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cloud Files */}
          {filesData?.files && filesData.files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Cloud Files
                </CardTitle>
                <CardDescription>
                  Your synchronized cloud storage files with security controls
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Provider:</label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="all">All Providers</option>
                      <option value="google_drive">Google Drive</option>
                      <option value="onedrive">OneDrive</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Type:</label>
                    <select
                      value={selectedFileType}
                      onChange={(e) => setSelectedFileType(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="all">All Files</option>
                      <option value="pdf">PDF</option>
                      <option value="docx">Word Documents</option>
                      <option value="xlsx">Excel Spreadsheets</option>
                    </select>
                  </div>
                </div>

                {/* File List */}
                <div className="space-y-3">
                  {filesData.files.map((file) => (
                    <div key={file.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                            {file.fileType === 'pdf' ? <FileText className="h-5 w-5 text-red-500" /> : 
                             file.fileType === 'docx' ? <FileText className="h-5 w-5 text-blue-500" /> : 
                             file.fileType === 'xlsx' ? <FileSpreadsheet className="h-5 w-5 text-green-500" /> : <Folder className="h-5 w-5 text-yellow-500" />}
                          </div>
                          <div>
                            <h3 className="font-semibold">{file.fileName}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                              <span>{formatFileSize(file.fileSize)}</span>
                              <span>•</span>
                              <span>Modified {new Date(file.lastModified).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={getSecurityLevelColor(file.securityLevel)}>
                                {file.securityLevel}
                              </Badge>
                              {file.isSecurityLocked && (
                                <Badge variant="secondary">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Secured
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {file.webViewUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(file.webViewUrl, '_blank')}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </Button>
                          )}
                          
                          {file.permissions.canDownload && file.downloadUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(file.downloadUrl, '_blank')}
                              className="flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" />
                              Download
                            </Button>
                          )}
                          
                          {file.fileType === 'pdf' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <Shield className="h-3 w-3" />
                              Secure
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!integrationsLoading && (!integrationsData?.integrations || integrationsData.integrations.length === 0) && (
            <Card>
              <CardContent className="text-center py-12">
                <Cloud className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Cloud Integrations</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Connect your Google Drive or Microsoft OneDrive to get started
                </p>
                <div className="flex justify-center gap-4">
                  <Button onClick={handleConnectGoogle} className="flex items-center gap-2">
                    <Folder className="h-4 w-4" /> Connect Google Drive
                  </Button>
                  <Button onClick={handleConnectMicrosoft} variant="outline" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Connect OneDrive
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Notice */}
          {(!process.env.GOOGLE_CLIENT_ID || !process.env.MICROSOFT_CLIENT_ID) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Cloud integrations require OAuth credentials to be configured by an administrator.
                {user.role === 'admin' && (
                  <Button
                    variant="link"
                    className="p-0 h-auto ml-2"
                    onClick={() => window.location.href = '/admin'}
                  >
                    Configure now
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
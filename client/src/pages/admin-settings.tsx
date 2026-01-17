import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings, 
  Key, 
  Cloud, 
  Shield, 
  Users,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Sub-components
import { OAuthSettings, OAuthConfigForm, OAuthSettingsData } from '@/components/admin/OAuthSettings';
import { PDFSecuritySettings, PDFSecurityDefaultsForm } from '@/components/admin/PDFSecuritySettings';
import { CloudIntegrationList, CloudIntegration } from '@/components/admin/CloudIntegrationList';
import { UserRoleManager, Role, RoleAssignment } from '@/components/admin/UserRoleManager';

export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  // Get current OAuth settings
  const { data: oauthSettings } = useQuery<OAuthSettingsData>({
    queryKey: ['/api/admin/oauth-settings'],
  });

  // Get all organization cloud integrations
  const { data: integrationsData } = useQuery<{ integrations: CloudIntegration[] }>({
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
    onError: (error: Error) => {
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
    onError: (error: Error) => {
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
    onError: (error: Error) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete integration',
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
    onError: (error: Error) => {
      toast({
        title: 'Removal Failed',
        description: error.message || 'Failed to remove role assignment',
        variant: 'destructive',
      });
    },
  });

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

          <TabsContent value="users" className="space-y-6">
            <UserRoleManager 
              organizations={organizations}
              roles={roles}
              roleAssignments={roleAssignments}
              selectedOrgId={selectedOrgId}
              onOrgChange={setSelectedOrgId}
              onRemoveAssignment={(id) => removeAssignmentMutation.mutate(id)}
              rolesLoading={rolesLoading}
              assignmentsLoading={assignmentsLoading}
              isRemovingAssignment={removeAssignmentMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="oauth" className="space-y-6">
            <OAuthSettings 
              settings={oauthSettings}
              onSave={(data) => saveOAuthMutation.mutate(data)}
              isSaving={saveOAuthMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="pdf" className="space-y-6">
            <PDFSecuritySettings 
              onSave={(data) => savePDFDefaultsMutation.mutate(data)}
              isSaving={savePDFDefaultsMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <CloudIntegrationList 
              integrations={integrationsData?.integrations}
              onDelete={(id) => deleteIntegrationMutation.mutate(id)}
              isDeleting={deleteIntegrationMutation.isPending}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cloud, Folder, FileText, Trash2 } from 'lucide-react';

export interface CloudIntegration {
  id: string;
  provider: string;
  displayName: string;
  email: string;
  isActive: boolean;
  lastSyncAt: string;
  syncStatus: string;
  createdAt: string;
}

interface CloudIntegrationListProps {
  integrations?: CloudIntegration[];
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function CloudIntegrationList({ integrations, onDelete, isDeleting }: CloudIntegrationListProps) {
  return (
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
        {!integrations || integrations.length === 0 ? (
          <div className="text-center py-8">
            <Cloud className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-300">No cloud integrations found</p>
            <p className="text-sm text-gray-500 mt-2">
              Users will see cloud integration options once OAuth settings are configured.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {integrations.map((integration) => (
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
                      onClick={() => onDelete(integration.id)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-700"
                      data-testid={`delete-integration-${integration.id}`}
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
  );
}

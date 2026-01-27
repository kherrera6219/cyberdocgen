/**
 * Local Settings Page
 * Sprint 2: Desktop Integration & Hardening
 *
 * Provides management interface for local mode:
 * - Database information and statistics
 * - Backup and restore operations
 * - Storage statistics
 * - Maintenance operations
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Database,
  HardDrive,
  Download,
  Upload,
  Settings,
  Trash2,
  Info,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DatabaseInfo {
  path: string;
  size: number;
  pageCount: number;
  pageSize: number;
  walMode: boolean;
  formattedSize: string;
}

interface StorageInfo {
  path: string;
  totalSize: number;
  fileCount: number;
  formattedSize: string;
}

interface RuntimeInfo {
  mode: 'local' | 'cloud';
  features: Record<string, boolean>;
  database: { type: string };
  storage: { type: string };
  auth: { enabled: boolean; provider: string };
}

export default function LocalSettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch runtime info
  const { data: runtime } = useQuery<RuntimeInfo>({
    queryKey: ['runtime-mode'],
    queryFn: async () => {
      const res = await fetch('/api/local/runtime/mode');
      if (!res.ok) throw new Error('Failed to fetch runtime mode');
      return res.json();
    },
  });

  // Fetch database info
  const { data: dbInfo, isLoading: dbLoading, error: dbError } = useQuery<DatabaseInfo>({
    queryKey: ['db-info'],
    queryFn: async () => {
      const res = await fetch('/api/local/db-info');
      if (!res.ok) throw new Error('Failed to fetch database info');
      return res.json();
    },
    enabled: runtime?.mode === 'local',
  });

  // Fetch storage info
  const { data: storageInfo, isLoading: storageLoading } = useQuery<StorageInfo>({
    queryKey: ['storage-info'],
    queryFn: async () => {
      const res = await fetch('/api/local/storage-info');
      if (!res.ok) throw new Error('Failed to fetch storage info');
      return res.json();
    },
    enabled: runtime?.mode === 'local',
  });

  // Backup mutation
  const backupMutation = useMutation({
    mutationFn: async (destinationPath: string) => {
      const res = await fetch('/api/local/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationPath }),
      });
      if (!res.ok) throw new Error('Backup failed');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Database backup created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['db-info'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Maintenance mutation
  const maintenanceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/local/maintenance', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Maintenance failed');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Database maintenance completed successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['db-info'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Maintenance failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/local/cleanup', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Cleanup failed');
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Cleanup completed. Removed ${data.removedDirectories} empty directories.`,
      });
      queryClient.invalidateQueries({ queryKey: ['storage-info'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  const handleBackup = () => {
    // In Electron, this would trigger a native save dialog via IPC
    // For now, use a default path
    const timestamp = new Date().toISOString().split('T')[0];
    const defaultPath = `${dbInfo?.path}-backup-${timestamp}.db`;

    // Check if running in Electron
    if ((window as any).electron) {
      // Trigger backup via Electron IPC
      (window as any).electron.send('menu-backup-database', defaultPath);
    } else {
      // Fallback for non-Electron environment
      backupMutation.mutate(defaultPath);
    }
  };

  const handleMaintenance = () => {
    if (confirm('Run database maintenance? This may take a few moments.')) {
      maintenanceMutation.mutate();
    }
  };

  const handleCleanup = () => {
    if (confirm('Clean up empty storage directories?')) {
      cleanupMutation.mutate();
    }
  };

  if (runtime?.mode !== 'local') {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Local settings are only available when running in local mode.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Local Mode Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your local database, storage, and application settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <Alert>
            <HardDrive className="h-4 w-4" />
            <AlertDescription>
              All your data is stored locally on this computer. No data is sent to the cloud.
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database
                </CardTitle>
                <CardDescription>SQLite local database</CardDescription>
              </CardHeader>
              <CardContent>
                {dbLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : dbError ? (
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm">Failed to load database info</span>
                  </div>
                ) : (
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium">Size</dt>
                      <dd className="text-sm text-muted-foreground">{dbInfo?.formattedSize}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium">WAL Mode</dt>
                      <dd className="text-sm text-muted-foreground">
                        {dbInfo?.walMode ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            Enabled
                          </span>
                        ) : (
                          'Disabled'
                        )}
                      </dd>
                    </div>
                  </dl>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Storage
                </CardTitle>
                <CardDescription>Local file storage</CardDescription>
              </CardHeader>
              <CardContent>
                {storageLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : (
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium">Total Size</dt>
                      <dd className="text-sm text-muted-foreground">{storageInfo?.formattedSize}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium">Files</dt>
                      <dd className="text-sm text-muted-foreground">{storageInfo?.fileCount}</dd>
                    </div>
                  </dl>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Information</CardTitle>
              <CardDescription>Details about your local SQLite database</CardDescription>
            </CardHeader>
            <CardContent>
              {dbLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading database information...</span>
                </div>
              ) : dbError ? (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load database information. Please check your connection.
                  </AlertDescription>
                </Alert>
              ) : (
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium">Location</dt>
                    <dd className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded mt-1 break-all">
                      {dbInfo?.path}
                    </dd>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium">Size</dt>
                      <dd className="text-sm text-muted-foreground">{dbInfo?.formattedSize}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium">Page Count</dt>
                      <dd className="text-sm text-muted-foreground">{dbInfo?.pageCount.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium">Page Size</dt>
                      <dd className="text-sm text-muted-foreground">{dbInfo?.pageSize} bytes</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium">WAL Mode</dt>
                      <dd className="text-sm text-muted-foreground">
                        {dbInfo?.walMode ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Enabled
                          </span>
                        ) : (
                          'Disabled'
                        )}
                      </dd>
                    </div>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Operations</CardTitle>
              <CardDescription>Backup, restore, and maintenance operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">Backup Database</div>
                  <div className="text-sm text-muted-foreground">
                    Create a backup of your database
                  </div>
                </div>
                <Button
                  onClick={handleBackup}
                  disabled={backupMutation.isPending}
                >
                  {backupMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Backup
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">Run Maintenance</div>
                  <div className="text-sm text-muted-foreground">
                    Vacuum and optimize the database
                  </div>
                </div>
                <Button
                  onClick={handleMaintenance}
                  disabled={maintenanceMutation.isPending}
                  variant="outline"
                >
                  {maintenanceMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  Maintenance
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Storage Information</CardTitle>
              <CardDescription>Details about your local file storage</CardDescription>
            </CardHeader>
            <CardContent>
              {storageLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading storage information...</span>
                </div>
              ) : (
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium">Location</dt>
                    <dd className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded mt-1 break-all">
                      {storageInfo?.path}
                    </dd>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium">Total Size</dt>
                      <dd className="text-sm text-muted-foreground">{storageInfo?.formattedSize}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium">File Count</dt>
                      <dd className="text-sm text-muted-foreground">{storageInfo?.fileCount}</dd>
                    </div>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Storage Operations</CardTitle>
              <CardDescription>Manage your local storage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">Cleanup Empty Directories</div>
                  <div className="text-sm text-muted-foreground">
                    Remove empty directories from storage
                  </div>
                </div>
                <Button
                  onClick={handleCleanup}
                  disabled={cleanupMutation.isPending}
                  variant="outline"
                >
                  {cleanupMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Cleanup
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

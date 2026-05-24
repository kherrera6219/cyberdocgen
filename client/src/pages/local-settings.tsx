/**
 * Local Settings Page
 * Sprint 2: Desktop Integration & Hardening
 *
 * Provides management interface for local mode:
 * - Database information and statistics
 * - Backup and restore operations
 * - Storage statistics
 * - Maintenance operations
 * - Network bindings & CA SSL uploads
 * - Redacted system diagnostics bundler
 */

import { useEffect, useState } from 'react';
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
  Loader2,
  Globe,
  FileArchive,
  Key,
  ShieldAlert
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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

  // Network Settings and Diagnostics state
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState('5231');
  const [sslEnabled, setSslEnabled] = useState(false);
  const [certPem, setCertPem] = useState('');
  const [keyPem, setKeyPem] = useState('');

  // Fetch runtime info
  const { data: runtime } = useQuery<RuntimeInfo>({
    queryKey: ['runtime-mode'],
    queryFn: () => apiRequest('/api/local/runtime/mode').then(res => res.data || res),
  });

  // Fetch database info
  const { data: dbInfo, isLoading: dbLoading, error: dbError } = useQuery<DatabaseInfo>({
    queryKey: ['db-info'],
    queryFn: () => apiRequest('/api/local/db-info').then(res => res.data || res),
    enabled: runtime?.mode === 'local',
  });

  // Fetch storage info
  const { data: storageInfo, isLoading: storageLoading } = useQuery<StorageInfo>({
    queryKey: ['storage-info'],
    queryFn: () => apiRequest('/api/local/storage-info').then(res => res.data || res),
    enabled: runtime?.mode === 'local',
  });

  // Fetch Network settings
  const { data: netResponse, refetch: refetchNetwork } = useQuery<{ success: boolean; hasCert?: boolean; hasKey?: boolean; sslEnabled?: boolean; host?: string; port?: number }>({
    queryKey: ['admin-network-settings'],
    queryFn: () => apiRequest('/api/admin/network-settings').then(res => res.data),
    enabled: runtime?.mode === 'local',
  });

  useEffect(() => {
    if (netResponse) {
      setTimeout(() => {
        setHost(netResponse.host || '127.0.0.1');
        setPort(String(netResponse.port || '5231'));
        setSslEnabled(!!netResponse.sslEnabled);
      }, 0);
    }
  }, [netResponse]);

  // Backup mutation
  const backupMutation = useMutation({
    mutationFn: (destinationPath: string) =>
      apiRequest('/api/local/backup', 'POST', { destinationPath }),
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
    mutationFn: () => apiRequest('/api/local/maintenance', 'POST'),
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
    mutationFn: () => apiRequest('/api/local/cleanup', 'POST'),
    onSuccess: (data: any) => {
      toast({
        title: 'Success',
        description: `Cleanup completed. Removed ${data?.removedDirectories || 0} empty directories.`,
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

  const restoreMutation = useMutation({
    mutationFn: (backupPath: string) => apiRequest('/api/local/restore', 'POST', { backupPath }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Database restored successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['db-info'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Network Settings mutation
  const saveNetworkMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/network-settings', 'POST', {
        host,
        port: parseInt(port, 10),
        sslEnabled,
        certPem: certPem.trim() || undefined,
        keyPem: keyPem.trim() || undefined
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Network configurations saved successfully',
      });
      refetchNetwork();
      setCertPem('');
      setKeyPem('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to save network settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });

  // Diagnostics bundle mutation
  const diagnosticsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('/api/admin/network-settings/diagnostics/bundle', 'POST');
      return res.data || res;
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Compiled successfully',
        description: 'Downloading diagnostics package...',
      });
      
      // Trigger dynamic file download
      window.location.href = `/api/admin/network-settings/diagnostics/download/${data.filename}`;
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to compile diagnostics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });

  useEffect(() => {
    if (!window.electronAPI) {
      return undefined;
    }

    const unsubscribeBackup = window.electronAPI.onMenuBackupDatabase((destinationPath) => {
      backupMutation.mutate(destinationPath);
    });
    const unsubscribeRestore = window.electronAPI.onMenuRestoreDatabase((backupPath) => {
      if (confirm(`Restore database from "${backupPath}"? This will replace current data.`)) {
        restoreMutation.mutate(backupPath);
      }
    });
    const unsubscribeDatabaseInfo = window.electronAPI.onMenuDatabaseInfo(() => {
      setActiveTab('database');
    });

    return () => {
      unsubscribeBackup();
      unsubscribeRestore();
      unsubscribeDatabaseInfo();
    };
  }, [backupMutation, restoreMutation]);

  const handleBackup = async () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const defaultPath = `${dbInfo?.path}-backup-${timestamp}.db`;

    if (window.electronAPI?.selectBackupDestination) {
      const destinationPath = await window.electronAPI.selectBackupDestination(defaultPath);
      if (!destinationPath) {
        return;
      }
      backupMutation.mutate(destinationPath);
      return;
    }

    backupMutation.mutate(defaultPath);
  };

  const handleRestore = async () => {
    const confirmed = confirm(
      'Restore database from backup? This will overwrite your current local database and cannot be undone.'
    );
    if (!confirmed) {
      return;
    }

    if (window.electronAPI?.selectRestoreSource) {
      const backupPath = await window.electronAPI.selectRestoreSource();
      if (!backupPath) {
        return;
      }
      restoreMutation.mutate(backupPath);
      return;
    }

    const backupPath = prompt('Enter backup file path (.db):');
    if (backupPath && backupPath.trim()) {
      restoreMutation.mutate(backupPath.trim());
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="network">Network & Bindings</TabsTrigger>
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

              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">Restore Database</div>
                  <div className="text-sm text-muted-foreground">
                    Restore from a previous backup file
                  </div>
                </div>
                <Button
                  onClick={handleRestore}
                  disabled={restoreMutation.isPending}
                  variant="outline"
                >
                  {restoreMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Restore
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

        <TabsContent value="network" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                Network Binding & Host Configurations
              </CardTitle>
              <CardDescription>
                Configure server listener ports and select host isolation modes for corporate LAN accessibility.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500">Host Binding Address</label>
                  <select 
                    value={host} 
                    onChange={(e) => setHost(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-800 dark:bg-slate-950 focus:outline-none"
                  >
                    <option value="127.0.0.1">Private Desktop Isolation (127.0.0.1)</option>
                    <option value="0.0.0.0">Corporate LAN Sharing (0.0.0.0)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500">Server Binding Port</label>
                  <input 
                    type="number" 
                    value={port} 
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full h-10 px-3.5 text-sm rounded-lg border border-gray-300 dark:border-gray-800 dark:bg-slate-950 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <Info className="h-5.5 w-5.5 text-blue-500 mt-0.5" />
                <span className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                  <strong>Network Warning:</strong> Binding the hostname to <code>0.0.0.0</code> exposes the local PGlite database and files to other devices on your local network. Enforce CA SSL validation keys to encrypt server traffic!
                </span>
              </div>

              <div className="h-[1px] bg-gray-150 dark:bg-gray-850" />

              <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-amber-500" /> Private CA SSL Certificate Uploader
                </h3>
                
                <div className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={sslEnabled} 
                    onChange={(e) => setSslEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 focus:ring-offset-0"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Enforce HTTPS Secure Connections</span>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500">SSL Certificate (cert.pem)</label>
                    <textarea 
                      value={certPem} 
                      onChange={(e) => setCertPem(e.target.value)}
                      placeholder="-----BEGIN CERTIFICATE-----&#10;..."
                      className="w-full h-24 p-3.5 font-mono text-[10px] rounded-lg border border-gray-300 dark:border-gray-800 dark:bg-slate-950 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500">SSL Private Key (key.pem)</label>
                    <textarea 
                      value={keyPem} 
                      onChange={(e) => setKeyPem(e.target.value)}
                      placeholder="-----BEGIN PRIVATE KEY-----&#10;..."
                      className="w-full h-24 p-3.5 font-mono text-[10px] rounded-lg border border-gray-300 dark:border-gray-800 dark:bg-slate-950 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 p-2 text-xs">
                  <div>
                    <span className="text-gray-400">Cert Stored Status:</span>{" "}
                    {netResponse?.hasCert ? (
                      <span className="text-emerald-500 font-semibold">Loaded ✓</span>
                    ) : (
                      <span className="text-amber-500 font-semibold">Not Uploaded !</span>
                    )}
                  </div>
                  <div className="w-[1px] bg-gray-200 dark:bg-gray-850" />
                  <div>
                    <span className="text-gray-400">HTTPS Enforced:</span>{" "}
                    {netResponse?.sslEnabled ? (
                      <span className="text-emerald-500 font-semibold">Active ✓</span>
                    ) : (
                      <span className="text-gray-400 font-semibold">Inactive</span>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => saveNetworkMutation.mutate()}
                disabled={saveNetworkMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-10 rounded-xl"
              >
                {saveNetworkMutation.isPending ? "Saving Configurations..." : "Save Network Settings"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileArchive className="h-5 w-5 text-blue-500" />
                1-Click Redacted Diagnostic Bundler
              </CardTitle>
              <CardDescription>
                Generates a zip file containing host specifications, PGlite statistics, and recent Winston logs (all operational passwords and API keys redacted).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => diagnosticsMutation.mutate()}
                disabled={diagnosticsMutation.isPending}
                className="w-full"
                variant="outline"
              >
                {diagnosticsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Compiling System Logs...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" /> Compile & Download Diagnostic Bundle (.zip)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

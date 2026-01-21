/**
 * Local Mode Banner Component
 * Sprint 2: Desktop Integration & Hardening
 *
 * Displays a banner indicating the app is running in local mode
 * with quick access to local settings
 */

import { HardDrive, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';

interface RuntimeMode {
  mode: 'local' | 'cloud';
  features: {
    organizationManagement: boolean;
    userManagement: boolean;
    multiTenant: boolean;
    sso: boolean;
    mfa: boolean;
  };
  database: {
    type: 'sqlite' | 'postgres';
  };
  storage: {
    type: 'local' | 'cloud';
  };
  auth: {
    enabled: boolean;
    provider: string;
  };
}

export function LocalModeBanner() {
  const { data: runtime, isLoading } = useQuery<RuntimeMode>({
    queryKey: ['runtime-mode'],
    queryFn: async () => {
      const res = await fetch('/api/local/runtime/mode');
      if (!res.ok) throw new Error('Failed to fetch runtime mode');
      return res.json();
    },
    // Cache for the session
    staleTime: Infinity,
  });

  // Don't show banner if not in local mode or still loading
  if (isLoading || runtime?.mode !== 'local') {
    return null;
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800 px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-blue-900 dark:text-blue-100 font-medium">
            Running in Local Mode
          </span>
          <span className="text-sm text-blue-700 dark:text-blue-300">
            • All data stored securely on this computer
          </span>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/local-settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Link>
        </Button>
      </div>
    </div>
  );
}

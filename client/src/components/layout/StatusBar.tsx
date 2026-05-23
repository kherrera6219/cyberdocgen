import { Database, Brain, Wifi, ShieldCheck, HardDrive } from "lucide-react";
import { useRuntimeConfig } from "@/hooks/useRuntimeConfig";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function StatusBar() {
  const { isLocalMode } = useRuntimeConfig();
  const { isOnline } = useOnlineStatus();

  return (
    <div className="h-6 bg-primary/5 dark:bg-primary/10 border-t border-border flex items-center justify-between px-4 text-[11px] font-medium text-muted-foreground z-50 shrink-0 select-none">
      <div className="flex items-center space-x-4">
        {/* Environment Status */}
        <div className="flex items-center space-x-1">
          {isLocalMode ? (
            <>
              <HardDrive className="h-3 w-3 text-blue-500" />
              <span>Local Desktop Mode</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-3 w-3 text-green-500" />
              <span>Cloud Enterprise</span>
            </>
          )}
        </div>

        {/* Database Connection */}
        <div className="flex items-center space-x-1">
          <Database className="h-3 w-3 text-green-500" />
          <span>SQLite Connected</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Network Status */}
        <div className="flex items-center space-x-1">
          <Wifi className={`h-3 w-3 ${isOnline ? "text-green-500" : "text-amber-500"}`} />
          <span>{isOnline ? "Online" : "Offline Working Mode"}</span>
        </div>

        {/* AI Status */}
        <div className="flex items-center space-x-1">
          <Brain className="h-3 w-3 text-purple-500" />
          <span>GPT-5.4 Ready</span>
        </div>
      </div>
    </div>
  );
}

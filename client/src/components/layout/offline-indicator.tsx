import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 rounded-md border border-warning bg-warning/10 px-3 py-2 text-sm text-foreground shadow-sm",
        className,
      )}
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      <span className="font-medium">You are offline.</span>
      <span className="text-muted-foreground">
        Changes will sync automatically once your connection is back.
      </span>
    </div>
  );
}

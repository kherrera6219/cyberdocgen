import type { ReactNode } from "react";
import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRuntimeConfig } from "@/hooks/useRuntimeConfig";
import type { DeploymentMode, RuntimeFeatures } from "@/lib/runtimeConfig";

interface ModeGateProps {
  children: ReactNode;
  requiredMode?: DeploymentMode;
  requiredFeature?: keyof RuntimeFeatures;
  fallback?: ReactNode;
}

function DefaultModeGateFallback({
  requiredMode,
  requiredFeature,
}: Pick<ModeGateProps, "requiredMode" | "requiredFeature">) {
  const modeText = requiredMode === "local" ? "local desktop mode" : "cloud mode";
  const featureText = requiredFeature ? ` and requires "${requiredFeature}" support` : "";

  return (
    <div className="flex min-h-[40vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Page Not Available</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This route is only available in {modeText}{featureText}.
        </p>
        <Button asChild className="mt-4" size="sm">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

export function ModeGate({ children, requiredMode, requiredFeature, fallback }: ModeGateProps) {
  const { config, isLoading } = useRuntimeConfig();

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const modeAllowed = !requiredMode || config.deploymentMode === requiredMode;
  const featureAllowed = !requiredFeature || config.features[requiredFeature] === true;

  if (!modeAllowed || !featureAllowed) {
    return <>{fallback ?? <DefaultModeGateFallback requiredMode={requiredMode} requiredFeature={requiredFeature} />}</>;
  }

  return <>{children}</>;
}

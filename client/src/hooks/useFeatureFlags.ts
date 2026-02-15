import { useRuntimeConfig } from "@/hooks/useRuntimeConfig";
import type { RuntimeFeatures } from "@/lib/runtimeConfig";

export function useFeatureFlags() {
  const { config, isLocalMode, isCloudMode, isLoading } = useRuntimeConfig();

  const hasFeature = (feature: keyof RuntimeFeatures): boolean => {
    return config.features[feature] === true;
  };

  return {
    isLoading,
    deploymentMode: config.deploymentMode,
    isLocalMode,
    isCloudMode,
    features: config.features,
    hasFeature,
  };
}

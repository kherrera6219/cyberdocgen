import { useQuery } from "@tanstack/react-query";
import { normalizeRuntimeConfig, resolveApiUrl, type RuntimeConfigResponse } from "@/lib/runtimeConfig";

export function useRuntimeConfig() {
  const query = useQuery<RuntimeConfigResponse>({
    queryKey: ["/api/config"],
    queryFn: async () => {
      const res = await fetch(resolveApiUrl("/api/config"), {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to load runtime configuration");
      }

      const payload = await res.json();
      return normalizeRuntimeConfig(payload);
    },
    staleTime: Infinity,
    retry: false,
  });

  const config = query.data ?? normalizeRuntimeConfig();

  return {
    ...query,
    config,
    deploymentMode: config.deploymentMode,
    isLocalMode: config.deploymentMode === "local",
    isCloudMode: config.deploymentMode === "cloud",
    features: config.features,
  };
}

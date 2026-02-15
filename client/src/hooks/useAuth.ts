import { useQuery } from "@tanstack/react-query";
import { logger } from '../utils/logger';
import { User } from "@shared/schema";
import { resolveApiUrl, type RuntimeFeatures } from "@/lib/runtimeConfig";
import { useRuntimeConfig } from "@/hooks/useRuntimeConfig";

export function useAuth() {
  const runtime = useRuntimeConfig();
  const config = runtime.config;

  const { data: user, isLoading, isFetching, status } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      if (process.env.NODE_ENV === 'test') {
        return null;
      }
      try {
        const res = await fetch(resolveApiUrl("/api/auth/user"), {
          credentials: "include",
        });
        if (res.status === 401) {
          return null;
        }
        if (!res.ok) {
          return null;
        }
        return await res.json();
      } catch (error) {
        logger.error("Auth check failed:", error);
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  const showLoading = (status === 'pending' && isFetching) || runtime.isLoading;

  // Safe access to user properties with optional chaining in case typing is loose at runtime
  const isTemporaryUser = (user?.id && String(user.id).startsWith('temp-')) || (user as any)?.isTemporary === true;
  const hasFeature = (feature: keyof RuntimeFeatures) => config.features[feature] === true;

  return {
    user,
    isLoading: showLoading,
    isAuthenticated: !!user,
    isTemporaryUser,
    deploymentMode: config.deploymentMode,
    isLocalMode: runtime.isLocalMode,
    isCloudMode: runtime.isCloudMode,
    isProduction: config.isProduction,
    features: config.features,
    hasFeature,
    runtimeConfig: config,
  };
}

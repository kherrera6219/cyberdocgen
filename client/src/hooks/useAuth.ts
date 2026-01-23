import { useQuery } from "@tanstack/react-query";
import { logger } from '../utils/logger';
import { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, isFetching, status } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/user", {
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

  const showLoading = status === 'pending' && isFetching;

  // Safe access to user properties with optional chaining in case typing is loose at runtime
  const isTemporaryUser = (user?.id && String(user.id).startsWith('temp-')) || (user as any)?.isTemporary === true;

  return {
    user,
    isLoading: showLoading,
    isAuthenticated: !!user,
    isTemporaryUser,
  };
}

import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, isFetching, status } = useQuery({
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
        console.error("Auth check failed:", error);
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  const showLoading = status === 'pending' && isFetching;

  const isTemporaryUser = user?.id?.startsWith('temp-') || user?.isTemporary === true;

  return {
    user,
    isLoading: showLoading,
    isAuthenticated: !!user,
    isTemporaryUser,
  };
}

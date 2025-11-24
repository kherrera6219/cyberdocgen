import { useQuery } from "@tanstack/react-query";

interface AuthClaims {
  sub?: string;
  [key: string]: unknown;
}

export interface AuthUser {
  id?: string;
  role?: string;
  organizationId?: string;
  industry?: string;
  companySize?: string;
  claims?: AuthClaims;
  [key: string]: unknown;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
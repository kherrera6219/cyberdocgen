import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CompanyProfile } from "@shared/schema";

interface OrganizationContextValue {
  profile: CompanyProfile | null;
  profiles: CompanyProfile[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const {
    data: profiles = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<CompanyProfile[]>({
    queryKey: ["/api/company-profiles"],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const profile = profiles.length > 0 ? profiles[0] : null;

  return (
    <OrganizationContext.Provider
      value={{
        profile,
        profiles,
        isLoading,
        isError,
        refetch,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization(): OrganizationContextValue {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}

export function useOrganizationOptional(): OrganizationContextValue | null {
  return useContext(OrganizationContext);
}

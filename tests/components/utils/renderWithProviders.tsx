import React, { type PropsWithChildren } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

export type QueryOverrides = Record<string, unknown>;

function normalizeQueryKey(queryKey: readonly unknown[]): string {
  return queryKey.map(part => String(part)).join("/");
}

function defaultQueryData(queryKey: readonly unknown[]): unknown {
  const key = normalizeQueryKey(queryKey);

  if (key.includes("/api/company-profiles")) return [];
  if (key.includes("/api/company-profile")) return { industry: "Technology", companySize: "100-500" };
  if (key.includes("/api/frameworks")) return [];
  if (key.includes("/api/framework-control-statuses")) return [];
  if (key.includes("/api/evidence/files")) return { evidence: [], count: 0 };
  if (key.includes("/api/evidence/snapshots")) return [];
  if (key.includes("/api/organizations")) return [];
  if (key.includes("/api/approvals")) return [];
  if (key.includes("/api/mcp/tools")) return { success: true, count: 0, tools: [] };
  if (key.includes("/api/mcp/health")) {
    return { success: true, status: "healthy", toolsRegistered: 0, agentsRegistered: 0 };
  }
  if (key.includes("/api/mcp/agents")) return { success: true, agents: [] };
  if (key.includes("/api/cloud/integrations")) return { integrations: [] };
  if (key.includes("/api/cloud/files")) return { files: [] };
  if (key.includes("/api/cloud/microsoft/sharepoint/sites")) return { sites: [] };
  if (key.includes("/api/cloud/microsoft/teams/channels")) return { teams: [] };
  if (key.includes("/api/ai/hub-insights")) {
    return {
      success: true,
      stats: {
        documentsGenerated: 0,
        totalDocuments: 0,
        gapsIdentified: 0,
        risksAssessed: 0,
        complianceScore: 0,
        controlsTotal: 0,
        controlsImplemented: 0,
        controlsInProgress: 0,
        controlsNotStarted: 0,
      },
      insights: [],
      risks: [],
    };
  }
  if (key.includes("/api/audit-trail")) {
    return {
      logs: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
      },
    };
  }
  if (key.includes("/api/analytics/summary")) {
    return {
      totalDocuments: 0,
      completedDocuments: 0,
      averageQualityScore: 0,
      totalRiskScore: 0,
      frameworkProgress: {},
      recentActivity: [],
      qualityTrends: [],
      complianceGaps: [],
    };
  }
  if (key.includes("/api/analytics/quality-trends")) return [];
  if (key.includes("/api/analytics/risk-history")) return [];
  if (key.includes("/api/analytics/ai-usage")) return [];
  if (key.includes("/api/ai/industries")) return { configurations: [] };
  if (key.includes("/api/documents")) return [];
  return undefined;
}

export function createTestQueryClient(overrides: QueryOverrides = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
        queryFn: async ({ queryKey }) => {
          const normalized = normalizeQueryKey(queryKey);
          if (Object.prototype.hasOwnProperty.call(overrides, normalized)) {
            return overrides[normalized];
          }
          return defaultQueryData(queryKey);
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

type RenderWithProvidersOptions = Omit<RenderOptions, "wrapper"> & {
  queryClient?: QueryClient;
};

export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderWithProvidersOptions = {},
) {
  const queryClient = options.queryClient ?? createTestQueryClient();

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>{children}</TooltipProvider>
      </QueryClientProvider>
    );
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

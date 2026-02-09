import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import ApiKeysPage from "../../../client/src/pages/api-keys";
import LocalSettingsPage from "../../../client/src/pages/local-settings";
import DocumentVersions from "../../../client/src/pages/document-versions";
import MCPTools from "../../../client/src/pages/mcp-tools";
import { Home } from "../../../client/src/pages/home";
import AuditTrail from "../../../client/src/pages/audit-trail";
import { OrganizationSetup } from "../../../client/src/pages/organization-setup";
import AIAssistant from "../../../client/src/pages/ai-assistant";
import AuditorWorkspace from "../../../client/src/pages/auditor-workspace";
import EvidenceIngestion from "../../../client/src/pages/evidence-ingestion";
import ControlApprovals from "../../../client/src/pages/control-approvals";
import EnterpriseSignup from "../../../client/src/pages/enterprise-signup";
import AIHub from "../../../client/src/pages/ai-hub";
import CloudIntegrations from "../../../client/src/pages/cloud-integrations";
import { renderWithProviders } from "../utils/renderWithProviders";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", firstName: "Kevin", lastName: "Herrera", email: "kevin@example.com" },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock("@/components/onboarding/WelcomeTutorial", () => ({
  WelcomeTutorial: ({ open }: { open: boolean }) =>
    open ? <div data-testid="welcome-tutorial">Welcome Tutorial</div> : null,
}));

vi.mock("@/components/onboarding/QuickStartChecklist", () => ({
  QuickStartChecklist: () => <div data-testid="quick-start-checklist">Quick Start</div>,
}));

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
  const url = resolveUrl(input);

  if (url.includes("/api/config")) {
    return jsonResponse({ deploymentMode: "local", isProduction: false });
  }
  if (url.includes("/api/local/api-keys/configured")) {
    return jsonResponse({ configured: [] });
  }
  if (url.includes("/api/local/runtime/mode")) {
    return jsonResponse({
      mode: "local",
      features: {},
      database: { type: "sqlite" },
      storage: { type: "local" },
      auth: { enabled: false, provider: "bypass" },
    });
  }
  if (url.includes("/api/local/db-info")) {
    return jsonResponse({
      path: "C:/cyberdocgen/local.db",
      size: 1024,
      pageCount: 1,
      pageSize: 1024,
      walMode: true,
      formattedSize: "1 KB",
    });
  }
  if (url.includes("/api/local/storage-info")) {
    return jsonResponse({
      path: "C:/cyberdocgen/storage",
      totalSize: 0,
      fileCount: 0,
      formattedSize: "0 Bytes",
    });
  }
  if (url.includes("/api/audit-trail/stats")) {
    return jsonResponse({
      totalActions: 0,
      activeUsers: 0,
      actionsByType: {},
      recentActivity: [],
    });
  }
  if (url.includes("/api/audit-trail")) {
    return jsonResponse({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    });
  }
  if (url.includes("/api/ai/hub-insights")) {
    return jsonResponse({
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
    });
  }
  if (url.includes("/api/cloud/integrations")) {
    return jsonResponse({ integrations: [] });
  }
  if (url.includes("/api/cloud/files")) {
    return jsonResponse({ files: [] });
  }
  if (url.includes("/api/cloud/microsoft/sharepoint/sites")) {
    return jsonResponse({ sites: [] });
  }
  if (url.includes("/api/cloud/microsoft/teams/channels")) {
    return jsonResponse({ teams: [] });
  }

  return jsonResponse({});
});

describe("Additional page smoke coverage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("renders API keys page", async () => {
    renderWithProviders(<ApiKeysPage />);
    expect(
      await screen.findByRole("heading", { name: /ai provider api keys/i }),
    ).toBeInTheDocument();
  });

  it("renders local settings page", async () => {
    renderWithProviders(<LocalSettingsPage />);
    expect(await screen.findByText(/local mode settings/i)).toBeInTheDocument();
  });

  it("renders document versions page", () => {
    renderWithProviders(<DocumentVersions documentId="doc-1" documentTitle="Policy Document" />);
    expect(screen.getByText(/version history/i)).toBeInTheDocument();
  });

  it("renders MCP tools page", () => {
    renderWithProviders(<MCPTools />);
    expect(screen.getByTestId("text-page-title")).toHaveTextContent(/mcp tools/i);
  });

  it("renders home page", () => {
    renderWithProviders(<Home />);
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it("renders audit trail page", async () => {
    renderWithProviders(<AuditTrail />);
    expect(await screen.findAllByText(/audit trail/i)).not.toHaveLength(0);
  });

  it("renders organization setup page", async () => {
    renderWithProviders(<OrganizationSetup />);
    expect(await screen.findByText(/organizations/i)).toBeInTheDocument();
  });

  it("renders AI assistant page", () => {
    renderWithProviders(<AIAssistant />);
    expect(screen.getByTestId("text-page-title")).toHaveTextContent(/ai assistant/i);
  });

  it("renders auditor workspace page", () => {
    renderWithProviders(<AuditorWorkspace />);
    expect(screen.getByTestId("text-page-title")).toHaveTextContent(/auditor workspace/i);
  });

  it("renders evidence ingestion page", () => {
    renderWithProviders(<EvidenceIngestion />);
    expect(screen.getByTestId("text-page-title")).toHaveTextContent(/evidence ingestion/i);
  });

  it("renders control approvals page", () => {
    renderWithProviders(<ControlApprovals />);
    expect(screen.getByTestId("text-page-title")).toHaveTextContent(/control approvals/i);
  });

  it("renders enterprise signup page", () => {
    renderWithProviders(<EnterpriseSignup />);
    expect(screen.getAllByText(/create enterprise account/i).length).toBeGreaterThan(0);
  });

  it("renders AI hub page", () => {
    renderWithProviders(<AIHub />);
    expect(screen.getByTestId("text-page-title")).toHaveTextContent(/ai assistant hub/i);
  });

  it("renders cloud integrations page", async () => {
    renderWithProviders(<CloudIntegrations />);
    expect(await screen.findByText(/cloud integrations/i)).toBeInTheDocument();
  });
});

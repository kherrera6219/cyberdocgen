import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CloudIntegrations from "../../../client/src/pages/cloud-integrations";
import { createTestQueryClient, renderWithProviders } from "../utils/renderWithProviders";

const toastMock = vi.hoisted(() => vi.fn());
const apiRequestMock = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({
  user: {
    id: "user-1",
    role: "admin",
    email: "kevin@example.com",
  } as any,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock("@/lib/queryClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/queryClient")>("@/lib/queryClient");
  return {
    ...actual,
    apiRequest: apiRequestMock,
  };
});

describe("CloudIntegrations page interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = {
      id: "user-1",
      role: "admin",
      email: "kevin@example.com",
    } as any;
  });

  it("renders nothing when user is not authenticated", () => {
    authState.user = null as any;
    renderWithProviders(<CloudIntegrations />);

    expect(screen.queryByText(/cloud integrations/i)).not.toBeInTheDocument();
  });

  it("shows empty integration state and admin guidance", async () => {
    renderWithProviders(<CloudIntegrations />);

    expect(await screen.findByText(/no cloud integrations/i)).toBeInTheDocument();
    expect(screen.getByText(/cloud integrations require oauth credentials/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /configure now/i })).toBeInTheDocument();
  });

  it("syncs files, removes integrations, and sends adobe sign requests", async () => {
    const queryClient = createTestQueryClient({
      "/api/cloud/integrations": {
        integrations: [
          {
            id: "integration-google",
            provider: "google_drive",
            displayName: "Google Workspace",
            email: "secops@lucentry.ai",
            isActive: true,
            lastSyncAt: "2026-01-01T00:00:00.000Z",
            syncStatus: "completed",
            createdAt: "2025-12-01T00:00:00.000Z",
          },
          {
            id: "integration-onedrive",
            provider: "onedrive",
            displayName: "Microsoft 365",
            email: "audit@lucentry.ai",
            isActive: true,
            lastSyncAt: "2026-01-02T00:00:00.000Z",
            syncStatus: "syncing",
            createdAt: "2025-12-01T00:00:00.000Z",
          },
        ],
      },
      "/api/cloud/files/[object Object]": {
        files: [
          {
            id: "file-1",
            fileName: "security-policy.pdf",
            fileType: "pdf",
            fileSize: 2048,
            securityLevel: "confidential",
            isSecurityLocked: true,
            permissions: {
              canView: true,
              canEdit: true,
              canDownload: true,
              canShare: false,
            },
            webViewUrl: "https://example.com/view",
            downloadUrl: "https://example.com/download",
            lastModified: "2026-01-01T00:00:00.000Z",
            syncedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      },
      "/api/cloud/microsoft/sharepoint/sites": {
        sites: [
          {
            id: "site-1",
            displayName: "Security Team Site",
            webUrl: "https://contoso.sharepoint.com/sites/security",
          },
        ],
      },
      "/api/cloud/microsoft/teams/channels": {
        teams: [
          {
            id: "team-1",
            displayName: "Compliance Ops",
          },
        ],
      },
    });

    apiRequestMock.mockImplementation(async (url: string) => {
      if (url === "/api/cloud/adobe/sign") {
        return { data: { agreementId: "agreement-123" } };
      }
      return { success: true };
    });

    vi.stubGlobal("prompt", vi.fn(() => "auditor@example.com"));

    const user = userEvent.setup();
    renderWithProviders(<CloudIntegrations />, { queryClient });

    expect(await screen.findByText("Google Workspace")).toBeInTheDocument();
    expect(screen.getByText("Microsoft 365")).toBeInTheDocument();
    expect(screen.getAllByText(/sharepoint sites/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/microsoft teams/i).length).toBeGreaterThan(0);
    expect(screen.getByText("security-policy.pdf")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /sync files/i })[0]!);
    await user.click(screen.getAllByRole("button", { name: /disconnect/i })[0]!);
    await user.click(screen.getByRole("button", { name: /^sign$/i }));

    expect(apiRequestMock).toHaveBeenCalledWith("/api/cloud/sync", "POST", {
      integrationId: "integration-google",
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/cloud/integrations/integration-google", "DELETE");
    expect(apiRequestMock).toHaveBeenCalledWith("/api/cloud/adobe/sign", "POST", {
      documentId: "file-1",
      recipientEmail: "auditor@example.com",
      recipientName: "auditor",
    });
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Sync Started" }));
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Integration Removed" }));
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Sign Request Sent" }));

    vi.unstubAllGlobals();
  });
});

import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminSettings from "../../../client/src/pages/admin-settings";
import ConnectorsHub from "../../../client/src/pages/connectors-hub";
import { RepositoryAnalysisPage } from "../../../client/src/pages/repository-analysis";
import { createTestQueryClient, renderWithProviders } from "../utils/renderWithProviders";

const toastMock = vi.hoisted(() => vi.fn());
const apiRequestMock = vi.hoisted(() => vi.fn());
const setLocationMock = vi.hoisted(() => vi.fn());

const authState = vi.hoisted(() => ({
  user: {
    id: "admin-1",
    email: "admin@example.com",
    role: "admin",
  } as any,
}));

const routeState = vi.hoisted(() => ({
  snapshotId: undefined as string | undefined,
}));

const useRepositoriesMock = vi.hoisted(() => vi.fn());
const useRepositoryMock = vi.hoisted(() => vi.fn());
const useUploadRepositoryMock = vi.hoisted(() => vi.fn());
const useStartAnalysisMock = vi.hoisted(() => vi.fn());
const useAnalysisStatusMock = vi.hoisted(() => vi.fn());
const useFindingsMock = vi.hoisted(() => vi.fn());
const useTasksMock = vi.hoisted(() => vi.fn());
const useUpdateTaskMock = vi.hoisted(() => vi.fn());
const useDeleteRepositoryMock = vi.hoisted(() => vi.fn());

vi.mock("wouter", () => ({
  useParams: () => ({ snapshotId: routeState.snapshotId }),
  useLocation: () => ["/repository", setLocationMock],
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
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

vi.mock("@/components/admin/OAuthSettings", () => ({
  OAuthSettings: ({ onSave }: { onSave: (data: any) => void }) => (
    <button data-testid="admin-oauth-save" onClick={() => onSave({ googleClientId: "id", googleClientSecret: "secret" })}>
      Save OAuth
    </button>
  ),
}));

vi.mock("@/components/admin/PDFSecuritySettings", () => ({
  PDFSecuritySettings: ({ onSave }: { onSave: (data: any) => void }) => (
    <button
      data-testid="admin-pdf-save"
      onClick={() =>
        onSave({
          defaultEncryptionLevel: "AES256",
          defaultAllowPrinting: false,
          defaultAllowCopying: false,
          defaultAllowModifying: false,
          defaultAllowAnnotations: false,
          defaultWatermarkText: "CONFIDENTIAL",
          defaultWatermarkOpacity: 0.3,
        })
      }
    >
      Save PDF
    </button>
  ),
}));

vi.mock("@/components/admin/CloudIntegrationList", () => ({
  CloudIntegrationList: ({ onDelete }: { onDelete: (id: string) => void }) => (
    <button data-testid="admin-delete-integration" onClick={() => onDelete("integration-1")}>
      Delete Integration
    </button>
  ),
}));

vi.mock("@/components/admin/UserRoleManager", () => ({
  UserRoleManager: ({
    onOrgChange,
    onRemoveAssignment,
  }: {
    onOrgChange: (id: string) => void;
    onRemoveAssignment: (id: string) => void;
  }) => (
    <div>
      <button data-testid="admin-select-org" onClick={() => onOrgChange("org-1")}>
        Select Org
      </button>
      <button data-testid="admin-remove-role" onClick={() => onRemoveAssignment("assignment-1")}>
        Remove Role
      </button>
    </div>
  ),
}));

vi.mock("@/components/evidence/SnapshotManager", () => ({
  SnapshotManager: ({ onSnapshotSelect }: { onSnapshotSelect: (id: string) => void }) => (
    <button data-testid="snapshot-select" onClick={() => onSnapshotSelect("snapshot-1")}>
      Select Snapshot
    </button>
  ),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/repository/RepoUploadZone", () => ({
  RepoUploadZone: ({
    onUpload,
    organizationId,
    companyProfileId,
  }: {
    onUpload: (file: File, metadata: { organizationId: string; companyProfileId: string; name: string }) => void;
    organizationId: string;
    companyProfileId: string;
  }) => (
    <button
      data-testid="repo-upload-trigger"
      onClick={() =>
        onUpload(new File(["repo"], "repo.zip"), {
          organizationId,
          companyProfileId,
          name: "Uploaded Repo",
        })
      }
    >
      Upload Repo
    </button>
  ),
}));

vi.mock("@/components/repository/RepositoryList", () => ({
  RepositoryList: ({
    repositories,
    onSelect,
    onDelete,
    onAnalyze,
  }: {
    repositories: Array<{ id: string }>;
    onSelect: (repo: { id: string }) => void;
    onDelete: (id: string) => void;
    onAnalyze: (id: string) => void;
  }) => (
    <div>
      <div data-testid="repo-count">{repositories.length}</div>
      <button data-testid="repo-select" onClick={() => onSelect({ id: repositories[0].id })}>
        Select Repo
      </button>
      <button data-testid="repo-delete" onClick={() => onDelete(repositories[0].id)}>
        Delete Repo
      </button>
      <button data-testid="repo-analyze" onClick={() => onAnalyze(repositories[0].id)}>
        Analyze Repo
      </button>
    </div>
  ),
}));

vi.mock("@/components/repository/AnalysisProgress", () => ({
  AnalysisProgress: ({ currentPhase }: { currentPhase: string }) => (
    <div data-testid="analysis-phase">{currentPhase}</div>
  ),
}));

vi.mock("@/components/repository/FindingsTable", () => ({
  FindingsTable: ({ findings }: { findings: Array<{ id: string }> }) => (
    <div data-testid="findings-count">{findings.length}</div>
  ),
}));

vi.mock("@/components/repository/TaskBoard", () => ({
  TaskBoard: ({
    tasks,
    onTaskStatusChange,
  }: {
    tasks: Array<{ id: string }>;
    onTaskStatusChange: (taskId: string, status: string) => void;
  }) => (
    <button data-testid="task-update" onClick={() => onTaskStatusChange(tasks[0].id, "completed")}>
      Update Task
    </button>
  ),
}));

vi.mock("@/hooks/useRepositoryAPI", () => ({
  useRepositories: () => useRepositoriesMock(),
  useRepository: () => useRepositoryMock(),
  useUploadRepository: () => useUploadRepositoryMock(),
  useStartAnalysis: () => useStartAnalysisMock(),
  useAnalysisStatus: () => useAnalysisStatusMock(),
  useFindings: () => useFindingsMock(),
  useTasks: () => useTasksMock(),
  useUpdateTask: () => useUpdateTaskMock(),
  useDeleteRepository: () => useDeleteRepositoryMock(),
}));

describe("Admin, connectors, and repository pages", () => {
  const buildAdminQueryClient = () =>
    createTestQueryClient({
      "/api/admin/oauth-settings": {},
      "/api/admin/cloud-integrations": { integrations: [] },
      "/api/roles/org-1": [],
      "/api/roles/assignments/organization/org-1": [],
    });

  beforeEach(() => {
    vi.clearAllMocks();
    routeState.snapshotId = undefined;
    authState.user = {
      id: "admin-1",
      email: "admin@example.com",
      role: "admin",
    };

    useRepositoriesMock.mockReturnValue({
      data: [{ id: "repo-1", name: "Repository 1" }],
      isLoading: false,
    });
    useRepositoryMock.mockReturnValue({ data: undefined });
    useUploadRepositoryMock.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ snapshotId: "snap-99" }),
    });
    useStartAnalysisMock.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    });
    useAnalysisStatusMock.mockReturnValue({ data: null });
    useFindingsMock.mockReturnValue({ data: null });
    useTasksMock.mockReturnValue({ data: null });
    useUpdateTaskMock.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
    });
    useDeleteRepositoryMock.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
    });

    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  it("renders admin access-denied state for non-admin users", async () => {
    authState.user = {
      id: "user-1",
      email: "user@example.com",
      role: "user",
    };

    renderWithProviders(<AdminSettings />, { queryClient: buildAdminQueryClient() });
    expect(await screen.findByText(/access denied/i)).toBeInTheDocument();
  });

  it("runs admin settings tab actions", async () => {
    const user = userEvent.setup();
    apiRequestMock.mockResolvedValue({});

    renderWithProviders(<AdminSettings />, { queryClient: buildAdminQueryClient() });
    expect(await screen.findByText(/admin settings/i)).toBeInTheDocument();

    await user.click(screen.getByTestId("admin-select-org"));
    await user.click(screen.getByTestId("admin-remove-role"));

    await user.click(screen.getByTestId("tab-oauth"));
    await user.click(screen.getByTestId("admin-oauth-save"));

    await user.click(screen.getByTestId("tab-pdf"));
    await user.click(screen.getByTestId("admin-pdf-save"));

    await user.click(screen.getByTestId("tab-integrations"));
    await user.click(screen.getByTestId("admin-delete-integration"));

    expect(apiRequestMock).toHaveBeenCalledWith("/api/roles/assignments/assignment-1", "DELETE");
    expect(apiRequestMock).toHaveBeenCalledWith(
      "/api/admin/oauth-settings",
      "POST",
      expect.objectContaining({ googleClientId: "id" }),
    );
    expect(apiRequestMock).toHaveBeenCalledWith(
      "/api/admin/pdf-defaults",
      "POST",
      expect.objectContaining({ defaultEncryptionLevel: "AES256" }),
    );
    expect(apiRequestMock).toHaveBeenCalledWith("/api/admin/cloud-integrations/integration-1", "DELETE");
  });

  it("creates and imports connectors from the hub", async () => {
    const user = userEvent.setup();

    apiRequestMock.mockImplementation(async (arg1: string, arg2?: string) => {
      if (arg1 === "GET" && arg2 === "/api/connectors") {
        return {
          json: async () => ({
            data: [
              {
                id: "connector-1",
                name: "SharePoint Connector",
                connectorType: "sharepoint",
              },
            ],
          }),
        };
      }
      return {};
    });

    renderWithProviders(<ConnectorsHub />);
    expect(await screen.findByText(/connectors hub/i)).toBeInTheDocument();

    await user.click(screen.getByTestId("snapshot-select"));
    await user.click(screen.getByRole("button", { name: /new connector/i }));
    await user.type(screen.getByPlaceholderText(/engineering jira board/i), "My Connector");
    await user.click(screen.getByRole("button", { name: /^create$/i }));
    await user.click(screen.getByRole("button", { name: /run import/i }));

    expect(apiRequestMock).toHaveBeenCalledWith(
      "POST",
      "/api/connectors",
      expect.objectContaining({ name: "My Connector" }),
    );
    expect(apiRequestMock).toHaveBeenCalledWith("POST", "/api/connectors/connector-1/import", {
      snapshotId: "snapshot-1",
    });
  });

  it("handles repository list and detail actions", async () => {
    const user = userEvent.setup();

    const uploadMutation = { mutateAsync: vi.fn().mockResolvedValue({ snapshotId: "snap-99" }) };
    const deleteMutation = { mutateAsync: vi.fn().mockResolvedValue({}) };
    const startMutation = { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false };
    const updateTaskMutation = { mutateAsync: vi.fn().mockResolvedValue({}) };

    useUploadRepositoryMock.mockReturnValue(uploadMutation);
    useDeleteRepositoryMock.mockReturnValue(deleteMutation);
    useStartAnalysisMock.mockReturnValue(startMutation);
    useUpdateTaskMock.mockReturnValue(updateTaskMutation);

    routeState.snapshotId = undefined;
    const listRender = renderWithProviders(<RepositoryAnalysisPage />);

    await user.click(screen.getByTestId("repo-upload-trigger"));
    await waitFor(() => expect(uploadMutation.mutateAsync).toHaveBeenCalled());
    expect(setLocationMock).toHaveBeenCalledWith("/repository/snap-99");

    await user.click(screen.getByTestId("repo-delete"));
    expect(deleteMutation.mutateAsync).toHaveBeenCalledWith("repo-1");

    await user.click(screen.getByTestId("repo-select"));
    expect(setLocationMock).toHaveBeenCalledWith("/repository/repo-1");
    listRender.unmount();

    routeState.snapshotId = "snap-1";
    useRepositoryMock.mockReturnValue({
      data: {
        id: "snap-1",
        name: "Repository Detail",
        uploadedFileName: "repo.zip",
        status: "indexed",
      },
    });
    useAnalysisStatusMock.mockReturnValue({
      data: {
        analysisRun: {
          phase: "Gap Identification",
          progress: 50,
          filesAnalyzed: 5,
          findingsGenerated: 2,
          llmCallsMade: 1,
          tokensUsed: 200,
        },
      },
    });
    useFindingsMock.mockReturnValue({
      data: {
        findings: [{ id: "finding-1" }],
        total: 1,
      },
    });
    useTasksMock.mockReturnValue({
      data: [{ id: "task-1" }],
    });

    renderWithProviders(<RepositoryAnalysisPage />);
    await user.click(screen.getByRole("tab", { name: /tasks/i }));
    await user.click(screen.getByTestId("task-update"));
    expect(updateTaskMutation.mutateAsync).toHaveBeenCalledWith({
      snapshotId: "snap-1",
      taskId: "task-1",
      status: "completed",
    });

    const startButtons = screen.getAllByRole("button", { name: /start analysis/i });
    await user.click(startButtons[startButtons.length - 1]);
    expect(startMutation.mutateAsync).toHaveBeenCalledWith({
      snapshotId: "snap-1",
      frameworks: ["SOC2"],
      depth: "security_relevant",
    });
  });
});

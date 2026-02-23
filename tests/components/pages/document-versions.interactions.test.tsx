import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentVersions from "../../../client/src/pages/document-versions";
import { renderWithProviders } from "../utils/renderWithProviders";

const toastMock = vi.hoisted(() => vi.fn());
const apiRequestMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "kevin@example.com" },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

const mockVersions = [
  {
    id: "ver-3",
    documentId: "doc-1",
    versionNumber: 3,
    title: "Information Security Policy v3.0",
    content: "v3 content",
    changes: "Major update",
    changeType: "major",
    createdBy: "user-2",
    createdAt: "2024-08-14T16:00:00.000Z",
    status: "published",
    fileSize: 45000,
    checksum: "a1b2c3d4e5f6",
  },
  {
    id: "ver-2",
    documentId: "doc-1",
    versionNumber: 2,
    title: "Information Security Policy v2.1",
    content: "v2 content",
    changes: "Minor update",
    changeType: "minor",
    createdBy: "user-1",
    createdAt: "2024-08-10T14:30:00.000Z",
    status: "archived",
    fileSize: 42000,
    checksum: "b2c3d4e5f6g7",
  },
  {
    id: "ver-1",
    documentId: "doc-1",
    versionNumber: 1,
    title: "Information Security Policy v1.0",
    content: "v1 content",
    changes: "Initial version",
    changeType: "major",
    createdBy: "user-1",
    createdAt: "2024-07-15T10:00:00.000Z",
    status: "archived",
    fileSize: 35000,
    checksum: "c3d4e5f6g7h8",
  },
];

describe("DocumentVersions interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequestMock.mockImplementation(async (urlOrMethod: unknown, maybeUrl: unknown) => {
      const resolvedUrl =
        typeof urlOrMethod === "string" && (urlOrMethod === "GET" || urlOrMethod === "POST")
          ? String(maybeUrl)
          : String(urlOrMethod);

      if (resolvedUrl === "/api/documents/doc-1/versions") {
        return { success: true, data: mockVersions };
      }

      if (resolvedUrl === "/api/documents/doc-1") {
        return { success: true, data: { id: "doc-1", title: "Policy", framework: "ISO27001", category: "policy", status: "draft", version: 3 } };
      }

      if (resolvedUrl === "/api/documents/doc-does-not-exist/versions") {
        return { success: true, data: [] };
      }

      if (resolvedUrl === "/api/documents/doc-does-not-exist") {
        return { success: false };
      }

      return {};
    });
  });

  it("supports compare mode selection and comparison action", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DocumentVersions documentId="doc-1" documentTitle="Policy" />);

    await user.click(screen.getByRole("button", { name: /compare versions/i }));
    expect(screen.getByText(/compare mode active/i)).toBeInTheDocument();

    await user.click(screen.getByText("Information Security Policy v3.0"));
    await user.click(screen.getByText("Information Security Policy v2.1"));

    expect(screen.getByText(/\(2\/2 selected\)/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /compare selected/i }));
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Comparison View",
      })
    );
  });

  it("opens preview dialog and restores a non-published version", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DocumentVersions documentId="doc-1" documentTitle="Policy" />);

    const card = (await screen.findByText("Information Security Policy v2.1")).closest(
      '[class*="flex-1"]'
    );
    expect(card).not.toBeNull();

    await user.click(within(card as HTMLElement).getByRole("button", { name: /preview/i }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/content preview/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/version 2/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /restore to current/i }));
    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/documents/doc-1/versions/2/restore",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("shows empty state when no versions exist for the document", async () => {
    renderWithProviders(<DocumentVersions documentId="doc-does-not-exist" documentTitle="Unknown" />);

    expect(await screen.findByText(/no versions found/i)).toBeInTheDocument();
    expect(
      screen.getByText(/document versions will appear here as changes are made/i)
    ).toBeInTheDocument();
  });
});

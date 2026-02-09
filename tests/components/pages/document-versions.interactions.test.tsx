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

describe("DocumentVersions interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    apiRequestMock.mockResolvedValue({});

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
        "/api/documents/doc-1/versions/ver-2/restore",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("shows empty state when no versions exist for the document", () => {
    renderWithProviders(<DocumentVersions documentId="doc-does-not-exist" documentTitle="Unknown" />);

    expect(screen.getByText(/no versions found/i)).toBeInTheDocument();
    expect(
      screen.getByText(/document versions will appear here as changes are made/i)
    ).toBeInTheDocument();
  });
});

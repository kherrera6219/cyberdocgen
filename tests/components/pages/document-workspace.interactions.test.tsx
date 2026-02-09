import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentWorkspace from "../../../client/src/pages/document-workspace";
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

describe("DocumentWorkspace interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters documents by search text and shows empty state", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DocumentWorkspace organizationId="org-1" />);

    expect(
      screen.getByRole("heading", { name: /document workspace/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Total Documents")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("AI Generated")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/search documents/i);
    await user.type(searchInput, "not-a-real-document");
    expect(screen.getByText(/no documents found/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /generate your first document/i })
    ).toBeInTheDocument();

    await user.clear(searchInput);
    await user.type(searchInput, "iso27001");
    expect(screen.getByText("Information Security Policy")).toBeInTheDocument();
  });

  it("opens preview modal and deletes a document", async () => {
    const user = userEvent.setup();
    apiRequestMock.mockResolvedValue({});

    renderWithProviders(<DocumentWorkspace organizationId="org-1" />);

    const titleNode = await screen.findByText("Information Security Policy");
    const card = titleNode.closest('[class*="hover:shadow-lg"]');
    expect(card).not.toBeNull();

    const actionButtons = within(card as HTMLElement).getAllByRole("button");
    await user.click(actionButtons[0]);

    const previewDialog = await screen.findByRole("dialog");
    expect(
      within(previewDialog).getByText(/ai generation details/i)
    ).toBeInTheDocument();
    expect(within(previewDialog).getByText(/model:/i)).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await user.click(actionButtons[actionButtons.length - 1]);
    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/documents/doc-1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Document Deleted" })
    );
  });

  it("submits the generate document form from the dialog", async () => {
    const user = userEvent.setup();
    apiRequestMock.mockResolvedValue({});

    renderWithProviders(<DocumentWorkspace organizationId="org-1" />);

    await user.click(screen.getByRole("button", { name: /^generate document$/i }));

    const dialog = await screen.findByRole("dialog");
    const titleInput = within(dialog).getByPlaceholderText(
      /information security policy/i
    );
    await user.type(titleInput, "Access Control Policy");

    await user.click(within(dialog).getByRole("button", { name: /^generate document$/i }));

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/documents/generate",
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});

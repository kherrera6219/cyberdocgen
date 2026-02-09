import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentComments } from "../../../client/src/components/collaboration/DocumentComments";
import { renderWithProviders } from "../utils/renderWithProviders";

const toastMock = vi.hoisted(() => vi.fn());
const apiRequestMock = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({
  user: { id: "user-1", email: "kevin@example.com" },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

vi.mock("@/lib/queryClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/queryClient")>("@/lib/queryClient");
  return {
    ...actual,
    apiRequest: (...args: unknown[]) => apiRequestMock(...args),
  };
});

function getMenuButtons(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll('button[aria-haspopup="menu"]'))
    .filter((button): button is HTMLButtonElement => button instanceof HTMLButtonElement);
}

describe("DocumentComments interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequestMock.mockResolvedValue({ success: true });
  });

  it("renders comments and supports add, resolve, and reply actions", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<DocumentComments documentId="doc-1" />);

    expect(await screen.findByText(/comments & reviews/i)).toBeInTheDocument();
    expect(await screen.findByText(/encryption standards/i)).toBeInTheDocument();
    expect(screen.getByText(/approved\. this section/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^add comment$/i }));
    await user.selectOptions(screen.getByRole("combobox"), "issue");
    await user.type(
      screen.getByPlaceholderText(/add your comment or feedback/i),
      "Please include a key management section."
    );
    await user.click(screen.getAllByRole("button", { name: /^add comment$/i })[1]);

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/documents/doc-1/comments",
        "POST",
        expect.objectContaining({
          content: "Please include a key management section.",
          type: "issue",
        })
      );
    });

    const [firstMenu] = getMenuButtons(container);
    expect(firstMenu).toBeDefined();

    await user.click(firstMenu);
    await user.click(await screen.findByText(/mark resolved/i));

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/comments/comment-1",
        "PATCH",
        { status: "resolved" }
      );
    });

    await user.click(firstMenu);
    await user.click(await screen.findByText(/^reply$/i));
    await user.type(screen.getByPlaceholderText(/write a reply/i), "Agree, will update this section.");
    await user.click(screen.getByRole("button", { name: /^reply$/i }));

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/documents/doc-1/comments",
        "POST",
        expect.objectContaining({
          content: "Agree, will update this section.",
          parentId: "comment-1",
        })
      );
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Comment Added" })
    );
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Comment Updated" })
    );
  });

  it("shows delete action for comments owned by the current user", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<DocumentComments documentId="doc-1" />);
    expect(await screen.findByText("John Doe")).toBeInTheDocument();

    const [firstMenu] = getMenuButtons(container);
    expect(firstMenu).toBeDefined();
    await user.click(firstMenu);
    expect(await screen.findByText(/delete/i)).toBeInTheDocument();
  });

  it("filters by section and shows empty state when no comments match", async () => {
    renderWithProviders(
      <DocumentComments documentId="doc-1" section="Nonexistent Section" />
    );

    expect(await screen.findByText(/no comments yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/encryption standards/i)).not.toBeInTheDocument();
  });
});

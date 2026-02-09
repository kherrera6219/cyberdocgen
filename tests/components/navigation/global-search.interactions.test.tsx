import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GlobalSearch } from "../../../client/src/components/navigation/GlobalSearch";
import {
  createTestQueryClient,
  renderWithProviders,
} from "../utils/renderWithProviders";

const setLocationMock = vi.hoisted(() => vi.fn());

vi.mock("wouter", () => ({
  useLocation: () => ["/dashboard", setLocationMock],
}));

describe("GlobalSearch interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("searches results, navigates on select, and stores recent search", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient({
      "/api/documents": [
        {
          id: "doc-1",
          title: "Access Control Policy",
          description: "Policy for access controls",
          framework: "ISO27001",
          status: "approved",
          tags: ["security"],
          updatedAt: new Date(),
        },
      ],
      "/api/company-profiles": [
        {
          id: "profile-1",
          companyName: "Lucentry AI",
          industry: "Technology",
          companySize: "100-500",
        },
      ],
    });

    renderWithProviders(<GlobalSearch />, { queryClient });

    await user.click(screen.getByRole("button", { name: /search/i }));
    const input = await screen.findByPlaceholderText(
      /search documents, profiles, pages/i
    );
    await user.type(input, "access");

    expect(await screen.findByText("Access Control Policy")).toBeInTheDocument();
    await user.click(screen.getByText("Access Control Policy"));

    await waitFor(() => {
      expect(setLocationMock).toHaveBeenCalledWith("/workspace?doc=doc-1");
    });

    expect(JSON.parse(window.localStorage.getItem("recentSearches") || "[]")).toContain(
      "access"
    );
  });

  it("shows and clears recent searches", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("recentSearches", JSON.stringify(["audit", "profile"]));

    renderWithProviders(<GlobalSearch />);

    await user.click(screen.getByRole("button", { name: /search/i }));
    expect(await screen.findByText("Recent Searches")).toBeInTheDocument();
    expect(screen.getByText("audit")).toBeInTheDocument();
    expect(screen.getByText("profile")).toBeInTheDocument();

    await user.click(screen.getByText(/clear recent searches/i));
    expect(window.localStorage.getItem("recentSearches")).toBeNull();
  });

  it("opens dialog with keyboard shortcut", async () => {
    renderWithProviders(<GlobalSearch />);

    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(
      await screen.findByPlaceholderText(/search documents, profiles, pages/i)
    ).toBeInTheDocument();
  });
});

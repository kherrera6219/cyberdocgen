import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NotificationDropdown from "../../../client/src/components/notifications/NotificationDropdown";
import {
  createTestQueryClient,
  renderWithProviders,
} from "../utils/renderWithProviders";

const apiRequestMock = vi.hoisted(() => vi.fn());
const setLocationMock = vi.hoisted(() => vi.fn());
const queryClientMock = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/", setLocationMock] as const,
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
  queryClient: queryClientMock,
}));

describe("NotificationDropdown interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequestMock.mockResolvedValue({ success: true });
  });

  it("handles mark-read, mark-all, delete, and navigation actions", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient({
      "/api/notifications/unread-count": { count: 2 },
      "/api/notifications": [
        {
          id: "n-1",
          userId: "user-1",
          organizationId: "org-1",
          type: "document",
          title: "Document Updated",
          message: "Policy file changed",
          link: "/documents/1",
          isRead: false,
          metadata: { severity: "high" },
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "n-2",
          userId: "user-1",
          organizationId: "org-1",
          type: "ai",
          title: "AI Insight Ready",
          message: "A new insight is available",
          link: null,
          isRead: true,
          metadata: { severity: "low" },
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });

    renderWithProviders(<NotificationDropdown />, { queryClient });

    await user.click(screen.getByTestId("button-notifications"));
    expect(await screen.findByText(/notifications/i)).toBeInTheDocument();
    expect(screen.getByText(/document updated/i)).toBeInTheDocument();
    expect(screen.getByTestId("button-mark-all-read")).toBeInTheDocument();

    await user.click(screen.getByTestId("button-mark-all-read"));
    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/notifications/mark-all-read",
        { method: "PATCH" }
      );
    });

    await user.click(screen.getByTestId("notification-item-n-1"));
    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/notifications/n-1/read",
        { method: "PATCH" }
      );
    });
    expect(setLocationMock).toHaveBeenCalledWith("/documents/1");

    await user.click(screen.getByTestId("button-notifications"));
    await user.click(screen.getByTestId("button-delete-notification-n-2"));
    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/notifications/n-2",
        { method: "DELETE" }
      );
    });

    await user.click(screen.getByTestId("link-notification-settings"));
    expect(setLocationMock).toHaveBeenCalledWith("/profile/settings");
    expect(queryClientMock.invalidateQueries).toHaveBeenCalled();
  });

  it("renders empty state when there are no notifications", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient({
      "/api/notifications/unread-count": { count: 0 },
      "/api/notifications": [],
    });

    renderWithProviders(<NotificationDropdown />, { queryClient });
    await user.click(screen.getByTestId("button-notifications"));

    expect(await screen.findByText(/no notifications yet/i)).toBeInTheDocument();
    expect(screen.queryByTestId("button-mark-all-read")).not.toBeInTheDocument();
  });
});

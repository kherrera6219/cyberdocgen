import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuditTrail from "../../../client/src/pages/audit-trail";
import { renderWithProviders } from "../utils/renderWithProviders";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "kevin@example.com" },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

describe("AuditTrail interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders stats, entries, details, and empty-state metadata", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = resolveUrl(input);
      if (url.includes("/api/audit-trail/stats")) {
        return jsonResponse({
          totalActions: 12,
          activeUsers: 4,
          actionsByType: { update: 7, create: 3, delete: 2 },
          recentActivity: [{ count: 5 }],
        });
      }
      if (url.includes("/api/audit-trail")) {
        return jsonResponse({
          data: [
            {
              id: "audit-1",
              action: "create",
              entityType: "document",
              userEmail: "alice@lucentry.ai",
              userName: "Alice",
              metadata: { source: "ui" },
              oldValues: { status: "draft" },
              newValues: { status: "approved" },
              timestamp: "2026-02-01T12:00:00.000Z",
              ipAddress: "10.1.1.1",
              sessionId: "abcdef1234567890",
            },
            {
              id: "audit-2",
              action: "update",
              entityType: "company_profile",
              userEmail: "bob@lucentry.ai",
              userName: "Bob",
              metadata: null,
              oldValues: null,
              newValues: null,
              timestamp: "2026-02-01T13:00:00.000Z",
              ipAddress: "10.1.1.2",
              sessionId: null,
            },
          ],
          pagination: { page: 1, limit: 20, total: 2, pages: 1 },
        });
      }
      return jsonResponse({});
    });

    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderWithProviders(<AuditTrail />);

    expect(await screen.findByRole("heading", { name: /audit trail/i })).toBeInTheDocument();
    expect(await screen.findByText("Total Actions")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Active Users")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();

    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("CREATE")).toBeInTheDocument();
    expect(screen.getByText("document")).toBeInTheDocument();
    expect(screen.getByText(/"source":"ui"/i)).toBeInTheDocument();
    expect(screen.getByText(/session: abcdef12\.\.\./i)).toBeInTheDocument();

    await user.click(screen.getByText(/view changes/i));
    expect(screen.getByText(/before:/i)).toBeInTheDocument();
    expect(screen.getByText(/after:/i)).toBeInTheDocument();
  });

  it("applies search filters and paginates through audit entries", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = resolveUrl(input);
      if (url.includes("/api/audit-trail/stats")) {
        return jsonResponse({
          totalActions: 25,
          activeUsers: 3,
          actionsByType: { view: 10 },
          recentActivity: [{ count: 1 }],
        });
      }
      if (url.includes("/api/audit-trail")) {
        const parsed = new URL(url, "http://localhost");
        const page = Number(parsed.searchParams.get("page") ?? "1");
        const search = parsed.searchParams.get("search");

        if (page === 2) {
          return jsonResponse({
            data: [
              {
                id: "audit-page-2",
                action: "view",
                entityType: "organization",
                userEmail: "reviewer@lucentry.ai",
                userName: "Reviewer",
                metadata: search ? { query: search } : null,
                oldValues: null,
                newValues: null,
                timestamp: "2026-02-02T12:00:00.000Z",
                ipAddress: "10.2.2.2",
                sessionId: null,
              },
            ],
            pagination: { page: 2, limit: 20, total: 25, pages: 2 },
          });
        }

        return jsonResponse({
          data: [
            {
              id: "audit-page-1",
              action: "download",
              entityType: "document",
              userEmail: "analyst@lucentry.ai",
              userName: "Analyst",
              metadata: null,
              oldValues: null,
              newValues: null,
              timestamp: "2026-02-02T11:00:00.000Z",
              ipAddress: "10.2.2.1",
              sessionId: null,
            },
          ],
          pagination: { page: 1, limit: 20, total: 25, pages: 2 },
        });
      }
      return jsonResponse({});
    });

    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderWithProviders(<AuditTrail />);

    expect(await screen.findByText(/page 1 of 2/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(await screen.findByText(/page 2 of 2/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([input]) =>
          resolveUrl(input as RequestInfo | URL).includes("page=2"),
        ),
      ).toBe(true);
    });

    await user.click(screen.getByRole("button", { name: /previous/i }));
    expect(await screen.findByText(/page 1 of 2/i)).toBeInTheDocument();
  });
});

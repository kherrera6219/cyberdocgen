import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ControlApprovals from "../../../client/src/pages/control-approvals";
import { renderWithProviders } from "../utils/renderWithProviders";

const toastMock = vi.hoisted(() => vi.fn());
const apiRequestMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/lib/queryClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/queryClient")>("@/lib/queryClient");
  return {
    ...actual,
    apiRequest: (...args: unknown[]) => apiRequestMock(...args),
  };
});

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

const pendingApproval = {
  id: "approval-1",
  documentId: "doc-1",
  documentTitle: "Access Control Policy",
  documentFramework: "ISO27001",
  status: "pending",
  priority: "high",
  approverRole: "security_reviewer",
  requestedBy: "kevin@lucentry.ai",
  comment: null,
  reviewerComment: null,
  reviewedBy: null,
  dueDate: null,
  createdAt: "2026-02-02T12:00:00.000Z",
  updatedAt: "2026-02-02T12:00:00.000Z",
};

const approvedApproval = {
  ...pendingApproval,
  id: "approval-2",
  documentTitle: "Vendor Risk Procedure",
  status: "approved",
  priority: "low",
};

describe("ControlApprovals interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reviews and approves a pending request with reviewer comments", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = resolveUrl(input);
      if (url.includes("/api/approvals")) {
        return jsonResponse([pendingApproval]);
      }
      return jsonResponse({});
    });

    vi.stubGlobal("fetch", fetchMock);
    apiRequestMock.mockResolvedValueOnce({ success: true });

    const user = userEvent.setup();
    renderWithProviders(<ControlApprovals />);

    expect(await screen.findByText("Access Control Policy")).toBeInTheDocument();
    await user.click(screen.getByTestId("button-review-approval-1"));
    expect(await screen.findByText(/review approval request/i)).toBeInTheDocument();

    await user.type(
      screen.getByTestId("textarea-review-comment"),
      "Control mapping and evidence trail look good.",
    );
    await user.click(screen.getByTestId("button-approve"));

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/approvals/approval-1/approve",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            comment: "Control mapping and evidence trail look good.",
          }),
        }),
      );
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Approved",
      }),
    );
  });

  it("filters by status and fetches the selected dataset", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = resolveUrl(input);
      if (url.includes("/api/approvals?status=approved")) {
        return jsonResponse([approvedApproval]);
      }
      if (url.includes("/api/approvals")) {
        return jsonResponse([pendingApproval]);
      }
      return jsonResponse({});
    });

    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderWithProviders(<ControlApprovals />);

    expect(await screen.findByText("Access Control Policy")).toBeInTheDocument();
    await user.click(screen.getByTestId("select-status-filter"));
    await user.click(await screen.findByRole("option", { name: /approved/i }));

    expect(await screen.findByText("Vendor Risk Procedure")).toBeInTheDocument();
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([input]) =>
          resolveUrl(input as RequestInfo | URL).includes("status=approved"),
        ),
      ).toBe(true);
    });
  });

  it("shows the error state when approvals cannot be loaded", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = resolveUrl(input);
      if (url.includes("/api/approvals")) {
        return jsonResponse({ error: "failed" }, 500);
      }
      return jsonResponse({});
    });

    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<ControlApprovals />);

    expect(await screen.findByText(/failed to load approvals/i)).toBeInTheDocument();
  });
});

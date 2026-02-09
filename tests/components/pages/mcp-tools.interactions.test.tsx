import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MCPTools from "../../../client/src/pages/mcp-tools";
import {
  createTestQueryClient,
  renderWithProviders,
} from "../utils/renderWithProviders";

const toastMock = vi.hoisted(() => vi.fn());
const apiRequestMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

describe("MCPTools interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders health state and tool tabs from query data", async () => {
    const queryClient = createTestQueryClient({
      "/api/mcp/tools": {
        success: true,
        count: 2,
        tools: [
          {
            name: "internal_scan",
            description: "Internal compliance scan",
            type: "internal",
            parameters: [],
            returns: { type: "object", description: "Scan result" },
            requiresAuth: true,
          },
          {
            name: "external_lookup",
            description: "External lookup",
            type: "external",
            parameters: [],
            returns: { type: "object", description: "Lookup result" },
            requiresAuth: false,
          },
        ],
      },
      "/api/mcp/health": {
        success: true,
        status: "degraded",
        toolsRegistered: 2,
        agentsRegistered: 1,
      },
    });

    renderWithProviders(<MCPTools />, { queryClient });

    expect(screen.getByTestId("text-page-title")).toHaveTextContent(/mcp tools/i);
    expect(await screen.findByText(/degraded/i)).toBeInTheDocument();
    expect(screen.getByText(/2 tools/i)).toBeInTheDocument();
    expect(screen.getByText(/1 agents/i)).toBeInTheDocument();

    expect(screen.getByRole("tab", { name: /internal \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /external \(1\)/i })).toBeInTheDocument();
    expect(await screen.findByTestId("tool-item-internal_scan")).toBeInTheDocument();
  });

  it("parses parameters and executes selected tool successfully", async () => {
    const user = userEvent.setup();
    apiRequestMock.mockResolvedValueOnce({
      success: true,
      result: {
        success: true,
        data: { findings: 3 },
      },
    });

    const queryClient = createTestQueryClient({
      "/api/mcp/tools": {
        success: true,
        count: 1,
        tools: [
          {
            name: "internal_scan",
            description: "Internal compliance scan",
            type: "internal",
            parameters: [
              {
                name: "limit",
                type: "number",
                description: "Maximum records",
                required: true,
              },
              {
                name: "includeArchived",
                type: "boolean",
                description: "Include archived data",
                required: false,
              },
              {
                name: "mode",
                type: "string",
                description: "Scan mode",
                required: false,
                enum: ["quick", "deep"],
              },
            ],
            returns: { type: "object", description: "Scan result" },
            requiresAuth: true,
          },
        ],
      },
    });

    renderWithProviders(<MCPTools />, { queryClient });

    await user.click(await screen.findByTestId("tool-item-internal_scan"));
    await user.type(screen.getByTestId("input-param-limit"), "5");
    await user.type(screen.getByTestId("input-param-includeArchived"), "true");
    await user.selectOptions(screen.getByTestId("input-param-mode"), "deep");
    await user.click(screen.getByTestId("button-execute-tool"));

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/mcp/tools/internal_scan/execute",
        "POST",
        {
          parameters: {
            limit: 5,
            includeArchived: true,
            mode: "deep",
          },
        }
      );
    });
    expect(await screen.findByText(/execution result/i)).toBeInTheDocument();
    expect(screen.getByText(/success/i)).toBeInTheDocument();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Tool Executed Successfully" })
    );
  });

  it("shows destructive toast when execution returns failure payload", async () => {
    const user = userEvent.setup();
    apiRequestMock.mockResolvedValueOnce({
      success: true,
      result: {
        success: false,
        error: "rate limit exceeded",
      },
    });

    const queryClient = createTestQueryClient({
      "/api/mcp/tools": {
        success: true,
        count: 1,
        tools: [
          {
            name: "internal_scan",
            description: "Internal compliance scan",
            type: "internal",
            parameters: [],
            returns: { type: "object", description: "Scan result" },
            requiresAuth: true,
          },
        ],
      },
    });

    renderWithProviders(<MCPTools />, { queryClient });
    await user.click(await screen.findByTestId("tool-item-internal_scan"));
    await user.click(screen.getByTestId("button-execute-tool"));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Tool Execution Failed",
          description: "rate limit exceeded",
          variant: "destructive",
        })
      );
    });
  });
});

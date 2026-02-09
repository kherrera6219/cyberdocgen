import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganizationSetup } from "../../../client/src/pages/organization-setup";
import { createTestQueryClient, renderWithProviders } from "../utils/renderWithProviders";

const toastMock = vi.hoisted(() => vi.fn());
const apiRequestMock = vi.hoisted(() => vi.fn());

vi.mock("@shared/schema", async () => {
  const { z } = await vi.importActual<typeof import("zod")>("zod");
  return {
    insertOrganizationSchema: z.object({
      name: z.string().min(1),
      description: z.string().nullable().optional(),
      website: z.string().nullable().optional(),
      contactEmail: z.string().nullable().optional(),
    }),
  };
});

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

describe("OrganizationSetup interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an organization and auto-generates slug from name", async () => {
    apiRequestMock.mockResolvedValue({ id: "org-1" });
    const user = userEvent.setup();

    renderWithProviders(<OrganizationSetup />);
    expect(await screen.findByText(/no organizations yet/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /create your first organization/i }));
    await user.type(screen.getByLabelText(/organization name/i), "Acme Compliance Team");

    const slugInput = screen.getByLabelText(/url slug/i);
    expect(slugInput).toHaveValue("acme-compliance-team");

    await user.click(screen.getAllByRole("button", { name: /^create organization$/i })[1]!);

    expect(apiRequestMock).toHaveBeenCalledWith("/api/organizations", "POST", expect.objectContaining({
      name: "Acme Compliance Team",
      slug: "acme-compliance-team",
    }));
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Organization Created",
      }),
    );
  });

  it("renders existing organizations with website and contact details", async () => {
    const queryClient = createTestQueryClient({
      "/api/organizations": [
        {
          id: "org-2",
          name: "Lucentry",
          slug: "lucentry",
          description: "Security and compliance engineering",
          website: "https://lucentry.ai",
          contactEmail: "security@lucentry.ai",
          isActive: true,
          role: "admin",
        },
      ],
    });

    renderWithProviders(<OrganizationSetup />, { queryClient });

    expect(await screen.findByText("Lucentry")).toBeInTheDocument();
    expect(screen.getByText("@lucentry")).toBeInTheDocument();
    expect(screen.getByText("https://lucentry.ai")).toBeInTheDocument();
    expect(screen.getByText("security@lucentry.ai")).toBeInTheDocument();
    expect(screen.getByText(/active/i)).toBeInTheDocument();
  });

  it("shows destructive toast when organization creation fails", async () => {
    apiRequestMock.mockRejectedValue(new Error("create failed"));
    const user = userEvent.setup();

    renderWithProviders(<OrganizationSetup />);
    await user.click(await screen.findByRole("button", { name: /create your first organization/i }));
    await user.type(screen.getByLabelText(/organization name/i), "Failing Org");
    await user.click(screen.getAllByRole("button", { name: /^create organization$/i })[1]!);

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Error",
        variant: "destructive",
      }),
    );
  });
});

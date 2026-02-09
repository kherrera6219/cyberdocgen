import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompanyProfile from "../../../client/src/pages/company-profile";
import { createTestQueryClient, renderWithProviders } from "../utils/renderWithProviders";

const apiRequestMock = vi.hoisted(() => vi.fn());
const invalidateQueriesMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/components/help/ContextualHelp", () => ({
  HelpTooltip: ({ title }: { title: string }) => <span>{title}</span>,
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: apiRequestMock,
  queryClient: {
    invalidateQueries: invalidateQueriesMock,
  },
}));

describe("CompanyProfile interactions", () => {
  it("adds and removes dynamic rows across accordions", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanyProfile />);

    expect(await screen.findByTestId("text-page-title")).toHaveTextContent(/company profile/i);

    const triggers = [
      "accordion-trigger-org-structure",
      "accordion-trigger-products-services",
      "accordion-trigger-geographic-ops",
      "accordion-trigger-security-infra",
      "accordion-trigger-business-continuity",
      "accordion-trigger-vendor-management",
    ];

    for (const testId of triggers) {
      await user.click(screen.getByTestId(testId));
    }

    const addButtons = [
      "button-add-subsidiary",
      "button-add-department",
      "button-add-product",
      "button-add-service",
      "button-add-sla",
      "button-add-office",
      "button-add-datacenter",
      "button-add-encryption",
      "button-add-backup",
      "button-add-dr-site",
      "button-add-critical-system",
      "button-add-vendor",
      "button-add-integration",
    ];

    for (const testId of addButtons) {
      await user.click(screen.getByTestId(testId));
    }

    expect(screen.getByTestId("input-subsidiary-name-0")).toBeInTheDocument();
    expect(screen.getByTestId("input-department-name-0")).toBeInTheDocument();
    expect(screen.getByTestId("input-product-name-0")).toBeInTheDocument();
    expect(screen.getByTestId("input-service-name-0")).toBeInTheDocument();
    expect(screen.getByTestId("input-sla-service-0")).toBeInTheDocument();
    expect(screen.getByTestId("input-office-address-0")).toBeInTheDocument();
    expect(screen.getByTestId("input-datacenter-location-0")).toBeInTheDocument();
    expect(screen.getByTestId("input-encryption-type-0")).toBeInTheDocument();
    expect(screen.getByTestId("input-backup-type-0")).toBeInTheDocument();
    expect(screen.getByTestId("input-dr-location-0")).toBeInTheDocument();
    expect(screen.getByTestId("input-critical-system-name-0")).toBeInTheDocument();
    expect(screen.getByTestId("input-vendor-name-0")).toBeInTheDocument();
    expect(screen.getByTestId("input-integration-name-0")).toBeInTheDocument();

    const removeButtons = [
      "button-remove-subsidiary-0",
      "button-remove-department-0",
      "button-remove-product-0",
      "button-remove-service-0",
      "button-remove-sla-0",
      "button-remove-office-0",
      "button-remove-datacenter-0",
      "button-remove-encryption-0",
      "button-remove-backup-0",
      "button-remove-dr-site-0",
      "button-remove-critical-system-0",
      "button-remove-vendor-0",
      "button-remove-integration-0",
    ];

    for (const testId of removeButtons) {
      await user.click(screen.getByTestId(testId));
    }

    expect(screen.queryByTestId("input-subsidiary-name-0")).not.toBeInTheDocument();
    expect(screen.queryByTestId("input-vendor-name-0")).not.toBeInTheDocument();
    expect(screen.queryByTestId("input-integration-name-0")).not.toBeInTheDocument();
  });

  it("hydrates form fields from an existing profile payload", async () => {
    const queryClient = createTestQueryClient({
      "/api/company-profiles": [
        {
          id: "profile-1",
          companyName: "Lucentry AI",
          industry: "Technology",
          companySize: "100-500",
          headquarters: "Seattle, WA",
          cloudInfrastructure: ["AWS"],
          dataClassification: "Confidential",
          businessApplications: "Internal apps",
          websiteUrl: "https://lucentry.ai",
          organizationStructure: {},
          keyPersonnel: {},
          productsAndServices: {},
          geographicOperations: {},
          securityInfrastructure: {},
          businessContinuity: {},
          vendorManagement: {},
        },
      ],
    });

    renderWithProviders(<CompanyProfile />, { queryClient });

    expect(await screen.findByDisplayValue("Lucentry AI")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Seattle, WA")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://lucentry.ai")).toBeInTheDocument();
  });
});

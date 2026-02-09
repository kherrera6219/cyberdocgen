import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EnhancedCompanyProfile from "../../../client/src/pages/enhanced-company-profile";
import { renderWithProviders } from "../utils/renderWithProviders";

const toastMock = vi.hoisted(() => vi.fn());
const apiRequestMock = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({
  user: { id: "user-7", email: "kevin@example.com", organizationId: "org-7" },
}));

vi.mock("@hookform/resolvers/zod", () => ({
  zodResolver: () => async (values: unknown) => ({ values, errors: {} }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

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

async function selectOption(
  user: ReturnType<typeof userEvent.setup>,
  triggerTestId: string,
  optionName: string
) {
  await user.click(screen.getByTestId(triggerTestId));
  await user.click(await screen.findByRole("option", { name: new RegExp(optionName, "i") }));
}

describe("EnhancedCompanyProfile interactions", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    toastMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads, supports tab interactions, and submits transformed profile payload", async () => {
    const user = userEvent.setup();
    apiRequestMock.mockResolvedValue({ id: "profile-1" });

    renderWithProviders(<EnhancedCompanyProfile />);

    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
    expect(
      await screen.findByTestId("text-page-title", undefined, { timeout: 3000 })
    ).toHaveTextContent(
      /enhanced company profile/i
    );

    await user.type(screen.getByTestId("input-companyName"), "Lucentry AI");
    await selectOption(user, "select-industry", "Technology");
    await selectOption(user, "select-companySize", "Small");
    await user.type(screen.getByTestId("input-headquarters"), "Austin, TX");
    await selectOption(user, "select-dataClassification", "Confidential");
    await user.type(screen.getByTestId("input-businessApplications"), "GRC platform");

    await user.click(screen.getByTestId("tab-personnel"));
    await user.type(await screen.findByTestId("input-ceoName"), "Kevin Herrera");
    await user.type(screen.getByTestId("input-cisoName"), "Jane Doe");
    await user.type(screen.getByTestId("input-cisoEmail"), "ciso@lucentry.ai");

    await user.click(screen.getByTestId("tab-frameworks"));
    await user.click(await screen.findByTestId("checkbox-framework-iso27001"));

    await user.click(screen.getByTestId("tab-fedramp"));
    await selectOption(user, "select-fedRampLevel", "Moderate Impact Level");
    expect(await screen.findByText(/controlled unclassified information/i)).toBeInTheDocument();

    await user.click(screen.getByTestId("tab-controls"));
    await user.click(await screen.findByTestId("checkbox-nist-AC"));
    await user.click(await screen.findByTestId("checkbox-soc2-security"));

    await user.click(screen.getByRole("button", { name: /save profile/i }));

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/company-profiles",
        "POST",
        expect.objectContaining({
          organizationId: "org-7",
          createdBy: "user-7",
          companyName: "Lucentry AI",
          industry: "technology",
          companySize: "small",
          headquarters: "Austin, TX",
          dataClassification: "confidential",
          businessApplications: "GRC platform",
          complianceFrameworks: expect.arrayContaining(["iso27001"]),
          frameworkConfigs: expect.objectContaining({
            fedramp: expect.objectContaining({ level: "moderate" }),
            nist80053: expect.objectContaining({
              selectedControlFamilies: expect.arrayContaining(["AC"]),
            }),
            soc2: expect.objectContaining({
              trustServices: expect.arrayContaining(["security"]),
            }),
          }),
        })
      );
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Success",
        description: "Company profile created successfully!",
      })
    );
  });

  it("shows error toast when save fails", async () => {
    const user = userEvent.setup();
    apiRequestMock.mockRejectedValueOnce(new Error("save failed"));

    renderWithProviders(<EnhancedCompanyProfile />);
    expect(
      await screen.findByTestId("text-page-title", undefined, { timeout: 3000 })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /save profile/i }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error",
          description: "save failed",
          variant: "destructive",
        })
      );
    });
  });
});

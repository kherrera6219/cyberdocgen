import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComplianceInsights } from "../../../client/src/components/ai/ComplianceInsights";
import { renderWithProviders } from "../utils/renderWithProviders";

const apiRequestMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/queryClient", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

describe("ComplianceInsights interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates and refreshes high-risk insight analysis", async () => {
    const user = userEvent.setup();
    apiRequestMock.mockResolvedValue({
      riskScore: 85,
      keyRisks: ["Missing access review cadence"],
      recommendations: ["Automate quarterly access certification"],
      priorityActions: ["Assign control owner for AC-2 immediately"],
    });

    renderWithProviders(
      <ComplianceInsights companyProfileId="profile-1" framework="ISO27001" />
    );

    await user.click(screen.getByRole("button", { name: /Generate Insights/i }));

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/ai/generate-insights",
        expect.objectContaining({
          method: "POST",
          body: {
            companyProfileId: "profile-1",
            framework: "ISO27001",
          },
        })
      );
    });

    expect(await screen.findByText(/High Risk \(85\/100\)/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Key Risk Areas/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Priority Actions/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Strategic Recommendations/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Refresh Analysis/i }));
    expect(apiRequestMock).toHaveBeenCalledTimes(2);
  });

  it("renders low-risk state and omits optional sections when lists are empty", async () => {
    const user = userEvent.setup();
    apiRequestMock.mockResolvedValue({
      riskScore: 20,
      keyRisks: [],
      recommendations: [],
      priorityActions: [],
    });

    renderWithProviders(
      <ComplianceInsights companyProfileId="profile-2" framework="SOC2" />
    );

    await user.click(screen.getByRole("button", { name: /Generate Insights/i }));

    expect(await screen.findByText(/Low Risk \(20\/100\)/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Key Risk Areas/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Priority Actions/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Strategic Recommendations/i })
    ).not.toBeInTheDocument();
  });
});

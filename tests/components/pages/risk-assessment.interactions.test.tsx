import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RiskAssessment } from "../../../client/src/components/ai/RiskAssessment";
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

const assessmentResponse = {
  overallRiskScore: 72,
  riskLevel: "high",
  riskFactors: [
    {
      category: "Data Breach Exposure",
      description: "Privileged access controls are incomplete.",
      impact: "critical",
      likelihood: "likely",
      riskScore: 24,
      mitigationStrategies: ["Enforce MFA for privileged accounts"],
      complianceFrameworks: ["ISO27001", "SOC2"],
    },
    {
      category: "Policy Drift",
      description: "Policies are not reviewed regularly.",
      impact: "medium",
      likelihood: "possible",
      riskScore: 12,
      mitigationStrategies: ["Run quarterly policy reviews"],
      complianceFrameworks: ["NIST"],
    },
  ],
  complianceGaps: [
    {
      requirement: "Access Control Review",
      framework: "ISO27001",
      currentState: "Annual reviews",
      requiredState: "Quarterly reviews",
      gapSeverity: "critical",
      remediation: {
        actions: ["Implement quarterly access recertification"],
        timeframe: "30 days",
        cost: "medium",
        priority: 1,
      },
    },
  ],
  prioritizedActions: {
    immediate: ["Close privileged access gap"],
    shortTerm: ["Automate policy review reminders"],
    longTerm: ["Deploy identity governance tooling"],
  },
  frameworkReadiness: {
    iso27001: {
      readiness: 95,
      criticalGaps: ["A.9 quarterly review control missing"],
      estimatedTimeToCompliance: "2 weeks",
    },
    soc2: {
      readiness: 55,
      criticalGaps: ["Access certifications missing"],
      estimatedTimeToCompliance: "8 weeks",
    },
  },
  recommendations: {
    strategic: ["Strengthen IAM strategy"],
    tactical: ["Add periodic access attestations"],
    operational: ["Track remediation SLAs weekly"],
  },
};

const threatResponse = {
  industry: "Technology",
  threatLandscape: [
    {
      name: "Credential Stuffing",
      probability: 88,
      impact: 5,
      description: "Automated account takeover campaigns continue to rise.",
      mitigations: ["MFA", "rate limiting"],
    },
    {
      name: "Supply Chain Malware",
      probability: 45,
      impact: 3,
      description: "Third-party package compromise risks remain elevated.",
      mitigations: ["SBOM", "dependency scanning"],
    },
  ],
};

describe("RiskAssessment interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a destructive toast when company profile is missing", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient({
      "/api/company-profile": null,
    });

    renderWithProviders(<RiskAssessment />, { queryClient });

    await user.click(screen.getByRole("button", { name: /run risk assessment/i }));

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Company Profile Required",
        variant: "destructive",
      })
    );
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("disables run assessment when all frameworks are unselected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RiskAssessment />);

    await user.click(screen.getByRole("button", { name: /iso 27001/i }));

    expect(
      screen.getByRole("button", { name: /run risk assessment/i })
    ).toBeDisabled();
  });

  it("renders assessment and threat analysis results on success", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["/api/company-profile"], {
      industry: "Technology",
      companySize: "100-500",
    });
    apiRequestMock.mockImplementation(async (url: string) => {
      if (url === "/api/ai/risk-assessment") {
        return assessmentResponse;
      }
      if (url === "/api/ai/threat-analysis") {
        return threatResponse;
      }
      throw new Error(`Unhandled endpoint: ${url}`);
    });

    renderWithProviders(<RiskAssessment />, { queryClient });

    await user.click(screen.getByRole("button", { name: /run risk assessment/i }));

    expect(
      await screen.findByText(/risk assessment results/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/HIGH RISK \(72\/100\)/i)).toBeInTheDocument();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Risk Assessment Complete" })
    );

    await user.click(screen.getByRole("tab", { name: /risk factors/i }));
    expect(screen.getByText("Data Breach Exposure")).toBeInTheDocument();
    expect(screen.getByText("Run quarterly policy reviews")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /compliance gaps/i }));
    expect(screen.getByText("Access Control Review")).toBeInTheDocument();
    expect(screen.getByText("Priority 1")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /framework readiness/i }));
    expect(screen.getByText("95% Ready")).toBeInTheDocument();
    expect(screen.getByText(/estimated time to compliance: 2 weeks/i)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /action roadmap/i }));
    expect(screen.getByText("Close privileged access gap")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /threat analysis/i }));
    expect(
      await screen.findByText(/industry threat analysis/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Credential Stuffing")).toBeInTheDocument();
    expect(screen.getByText("Impact: 5/5")).toBeInTheDocument();
  });

  it("shows assessment failure toast when the mutation errors", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["/api/company-profile"], {
      industry: "Technology",
      companySize: "100-500",
    });
    apiRequestMock.mockRejectedValueOnce(new Error("assessment service down"));

    renderWithProviders(<RiskAssessment />, { queryClient });
    await user.click(screen.getByRole("button", { name: /run risk assessment/i }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Assessment Failed",
          description: "assessment service down",
          variant: "destructive",
        })
      );
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IndustrySpecialization } from "../../../client/src/components/ai/IndustrySpecialization";
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

const industryConfig = {
  configuration: {
    id: "healthcare",
    name: "Healthcare",
    description: "Healthcare compliance optimization",
    primaryFrameworks: ["HIPAA", "SOC2"],
    specializations: ["PHI handling", "Clinical workflow governance"],
    riskFactors: ["PHI breach risk", "Vendor security gaps"],
    complianceRequirements: ["HIPAA 164.312", "SOC2 CC6.1"],
    customPrompts: {
      documentGeneration: "Use HIPAA-safe wording",
      riskAssessment: "Prioritize patient data risks",
      complianceCheck: "Map controls to HIPAA safeguards",
    },
    modelPreferences: {
      preferred: "anthropic",
      temperature: 0.2,
      maxTokens: 4096,
      systemPrompts: ["Healthcare compliance assistant"],
    },
  },
};

describe("IndustrySpecialization interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("supports configuring requirements and creating a fine-tuning config", async () => {
    const user = userEvent.setup();
    apiRequestMock.mockImplementation(async (url: string) => {
      if (url === "/api/ai/industries/healthcare") {
        return industryConfig;
      }
      if (url === "/api/ai/fine-tune") {
        return { result: { accuracy: 0.873 } };
      }
      throw new Error(`Unhandled endpoint: ${url}`);
    });

    const queryClient = createTestQueryClient({
      "/api/ai/industries": {
        configurations: [
          {
            id: "healthcare",
            name: "Healthcare",
            description: "Healthcare compliance optimization",
            primaryFrameworks: ["HIPAA", "SOC2"],
            specializations: ["PHI handling", "Clinical workflow governance"],
            riskFactors: ["PHI breach risk"],
            complianceRequirements: ["HIPAA 164.312", "SOC2 CC6.1"],
            customPrompts: {
              documentGeneration: "",
              riskAssessment: "",
              complianceCheck: "",
            },
            modelPreferences: {
              preferred: "anthropic",
              temperature: 0.2,
              maxTokens: 4096,
              systemPrompts: [],
            },
          },
        ],
      },
    });

    renderWithProviders(<IndustrySpecialization />, { queryClient });

    await user.click(screen.getByRole("tab", { name: "Industries" }));
    await user.click(await screen.findByText("Healthcare"));

    await user.click(screen.getByRole("tab", { name: "Configure" }));
    expect(await screen.findByText("Healthcare compliance optimization")).toBeInTheDocument();

    const requirementInput = screen.getByPlaceholderText(/add a requirement/i);
    await user.type(requirementInput, "  HIPAA controls  ");
    await user.keyboard("{Enter}");
    expect(screen.getByText("HIPAA controls")).toBeInTheDocument();

    await user.type(requirementInput, "HIPAA controls");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getAllByText("HIPAA controls")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "×" }));
    expect(screen.queryByText("HIPAA controls")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /create configuration/i }));
    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/ai/fine-tune",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Configuration Created",
      })
    );
  });

  it("generates optimized docs and validates risk assessment JSON", async () => {
    const user = userEvent.setup();
    apiRequestMock.mockImplementation(async (url: string) => {
      if (url === "/api/ai/industries/healthcare") {
        return industryConfig;
      }
      if (url === "/api/ai/generate-optimized") {
        return { success: true, content: "Generated healthcare policy text" };
      }
      if (url === "/api/ai/assess-risks") {
        return {
          success: true,
          assessment: {
            riskScore: 75,
            identifiedRisks: [
              {
                category: "Data Leakage",
                severity: "high",
                description: "Unencrypted PHI exports detected",
                mitigation: "Enforce encryption and DLP policy",
              },
            ],
            recommendations: ["Roll out endpoint DLP"],
          },
        };
      }
      throw new Error(`Unhandled endpoint: ${url}`);
    });

    const queryClient = createTestQueryClient({
      "/api/ai/industries": {
        configurations: [
          {
            id: "healthcare",
            name: "Healthcare",
            description: "Healthcare compliance optimization",
            primaryFrameworks: ["HIPAA"],
            specializations: ["PHI"],
            riskFactors: ["PHI breach risk"],
            complianceRequirements: ["HIPAA 164.312"],
            customPrompts: {
              documentGeneration: "",
              riskAssessment: "",
              complianceCheck: "",
            },
            modelPreferences: {
              preferred: "anthropic",
              temperature: 0.2,
              maxTokens: 4096,
              systemPrompts: [],
            },
          },
        ],
      },
    });

    renderWithProviders(<IndustrySpecialization />, { queryClient });

    await user.click(screen.getByRole("tab", { name: "Industries" }));
    await user.click(await screen.findByText("Healthcare"));

    await user.click(screen.getByRole("tab", { name: "Generate" }));
    await user.click(
      screen.getByRole("button", { name: /generate optimized document/i })
    );
    expect(await screen.findByText("Generated Document")).toBeInTheDocument();
    expect(screen.getByText(/generated healthcare policy text/i)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Risk Assessment" }));
    const contextInput = screen.getByLabelText(/organization context \(json\)/i);
    fireEvent.change(contextInput, { target: { value: "{bad json" } });
    await user.click(screen.getByRole("button", { name: /assess industry risks/i }));
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Invalid Context",
        variant: "destructive",
      })
    );

    fireEvent.change(contextInput, {
      target: { value: '{"size":"medium","employees":500}' },
    });
    await user.click(screen.getByRole("button", { name: /assess industry risks/i }));

    expect(await screen.findByText(/risk assessment results/i)).toBeInTheDocument();
    expect(screen.getByText("75/100")).toBeInTheDocument();
    expect(screen.getByText("Data Leakage")).toBeInTheDocument();
    expect(screen.getByText("Roll out endpoint DLP")).toBeInTheDocument();
  });
});

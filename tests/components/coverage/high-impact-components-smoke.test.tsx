import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IndustrySpecialization } from "../../../client/src/components/ai/IndustrySpecialization";
import { EnhancedAnalytics } from "../../../client/src/components/ai/EnhancedAnalytics";
import { RiskAssessment } from "../../../client/src/components/ai/RiskAssessment";
import { GenerationCustomizer } from "../../../client/src/components/generation/GenerationCustomizer";
import { DocumentTemplates } from "../../../client/src/components/templates/DocumentTemplates";
import { DocumentAnalyzer } from "../../../client/src/components/ai/DocumentAnalyzer";
import { renderWithProviders } from "../utils/renderWithProviders";

describe("High-impact component smoke coverage", () => {
  it("renders industry specialization", () => {
    renderWithProviders(<IndustrySpecialization />);
    expect(screen.getByText(/industry specialization/i)).toBeInTheDocument();
  });

  it("renders enhanced analytics", async () => {
    renderWithProviders(<EnhancedAnalytics />);
    expect(await screen.findByText(/enhanced analytics dashboard/i)).toBeInTheDocument();
  });

  it("renders risk assessment", () => {
    renderWithProviders(<RiskAssessment />);
    expect(screen.getByText(/ai-powered risk assessment/i)).toBeInTheDocument();
  });

  it("renders generation customizer and submits", async () => {
    const onGenerate = vi.fn();
    const onCancel = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <GenerationCustomizer
        framework="ISO27001"
        onGenerate={onGenerate}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByText(/customize iso27001 document generation/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /generate documents/i }));
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it("renders document templates", () => {
    renderWithProviders(<DocumentTemplates framework="ISO27001" />);
    expect(screen.getByRole("heading", { name: /document templates/i })).toBeInTheDocument();
  });

  it("renders document analyzer", () => {
    renderWithProviders(<DocumentAnalyzer />);
    expect(screen.getByText(/document analysis & rag/i)).toBeInTheDocument();
  });
});

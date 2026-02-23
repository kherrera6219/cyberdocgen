import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import CompanyProfile from "../../../client/src/pages/company-profile";
import ISO27001Framework from "../../../client/src/pages/iso27001-framework";
import SOC2Framework from "../../../client/src/pages/soc2-framework";
import FedRAMPFramework from "../../../client/src/pages/fedramp-framework";
import NISTFramework from "../../../client/src/pages/nist-framework";
import DocumentWorkspace from "../../../client/src/pages/document-workspace";
import { renderWithProviders } from "../utils/renderWithProviders";

const apiRequestMock = vi.hoisted(() => vi.fn(async () => ({ success: true, data: [] })));

vi.mock("@/components/compliance/FrameworkSpreadsheet", () => ({
  FrameworkSpreadsheet: () => <div data-testid="framework-spreadsheet">FrameworkSpreadsheet</div>,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "kevin@example.com", firstName: "Kevin", lastName: "Herrera" },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock("@/components/help/ContextualHelp", () => ({
  HelpTooltip: ({ title }: { title: string }) => <span data-testid={`help-${title}`}>{title}</span>,
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

describe("Framework and profile page smoke coverage", () => {
  it("renders company profile page", async () => {
    renderWithProviders(<CompanyProfile />);
    expect(await screen.findByTestId("text-page-title")).toHaveTextContent(/company profile/i);
  });

  it("renders ISO 27001 framework page", () => {
    renderWithProviders(<ISO27001Framework />);
    expect(screen.getByTestId("text-page-title")).toHaveTextContent(/iso 27001/i);
  });

  it("renders SOC 2 framework page", () => {
    renderWithProviders(<SOC2Framework />);
    expect(screen.getByTestId("text-page-title")).toHaveTextContent(/soc 2/i);
  });

  it("renders FedRAMP framework page", () => {
    renderWithProviders(<FedRAMPFramework />);
    expect(screen.getByTestId("text-page-title")).toHaveTextContent(/fedramp/i);
  });

  it("renders NIST framework page", () => {
    renderWithProviders(<NISTFramework />);
    expect(screen.getByTestId("text-page-title")).toHaveTextContent(/nist/i);
  });

  it("renders document workspace page", () => {
    renderWithProviders(<DocumentWorkspace organizationId="org-1" />);
    expect(screen.getByRole("heading", { name: /document workspace/i })).toBeInTheDocument();
  });
});

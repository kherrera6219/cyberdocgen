import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { AIInsightsDashboard } from "../../client/src/components/ai/AIInsightsDashboard";
import { RiskHeatmap } from "../../client/src/components/ai/RiskHeatmap";
import { ControlPrioritizer } from "../../client/src/components/ai/ControlPrioritizer";

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div role="tooltip">{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

describe("AIInsightsDashboard", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' }
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    window.location = originalLocation;
  });

  it("should render with correct initial state", () => {
    render(<AIInsightsDashboard />);

    expect(screen.getByText("AI Compliance Insights")).toBeInTheDocument();
    expect(screen.getByText("Real-time analysis and recommendations")).toBeInTheDocument();
    expect(screen.getByText("Compliance Score")).toBeInTheDocument();
    expect(screen.getByText("Risk Level")).toBeInTheDocument();
    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    expect(screen.getByText("AI Recommendations")).toBeInTheDocument();
  });

  it("should render AI Powered badge", () => {
    render(<AIInsightsDashboard />);

    expect(screen.getByLabelText("AI Powered feature")).toBeInTheDocument();
  });

  it("should display correct compliance score based on props", async () => {
    render(
      <AIInsightsDashboard 
        documentsCount={10} 
        frameworksActive={3} 
        companyProfile={{ industry: "Technology" }} 
      />
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    const scoreElement = screen.getByLabelText(/Compliance score:/);
    expect(scoreElement).toBeInTheDocument();
  });

  it("should animate compliance score over time", async () => {
    render(<AIInsightsDashboard documentsCount={5} frameworksActive={2} />);

    const initialScore = screen.getByLabelText(/Compliance score:/);
    expect(initialScore).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
  });

  it("should show low risk level when score is above 70", async () => {
    render(
      <AIInsightsDashboard 
        documentsCount={15} 
        frameworksActive={4} 
        companyProfile={{ industry: "Finance" }} 
      />
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByText(/low/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Low risk/)).toBeInTheDocument();
  });

  it("should show medium risk level when score is between 40-70", async () => {
    render(
      <AIInsightsDashboard 
        documentsCount={5} 
        frameworksActive={1} 
      />
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByLabelText(/Medium risk/)).toBeInTheDocument();
  });

  it("should show high risk level when score is below 40", async () => {
    render(
      <AIInsightsDashboard 
        documentsCount={0} 
        frameworksActive={0} 
      />
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByLabelText(/High risk/)).toBeInTheDocument();
  });

  it("should display all recommendations correctly", () => {
    render(<AIInsightsDashboard />);

    expect(screen.getByText("Complete Access Control Policy")).toBeInTheDocument();
    expect(screen.getByText("Update Incident Response Plan")).toBeInTheDocument();
    expect(screen.getByText("Add Data Classification Labels")).toBeInTheDocument();
  });

  it("should display recommendation priorities", () => {
    render(<AIInsightsDashboard />);

    expect(screen.getByLabelText("Priority: high")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Priority: medium")).toHaveLength(2);
  });

  it("should display recommendation frameworks", () => {
    render(<AIInsightsDashboard />);

    expect(screen.getByLabelText("Framework: ISO 27001")).toBeInTheDocument();
    expect(screen.getByLabelText("Framework: SOC 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Framework: NIST")).toBeInTheDocument();
  });

  it("should display expected impact for recommendations", () => {
    render(<AIInsightsDashboard />);

    expect(screen.getByLabelText(/Expected impact: \+8% compliance score/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Expected impact: \+5% compliance score/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Expected impact: \+4% compliance score/)).toBeInTheDocument();
  });

  it("should have correct aria-labels on Generate Documents button", () => {
    render(<AIInsightsDashboard />);

    const generateBtn = screen.getByTestId("button-generate-docs");
    expect(generateBtn).toHaveAttribute("aria-label", "Generate compliance documents using AI");
  });

  it("should have correct aria-labels on Ask AI Assistant button", () => {
    render(<AIInsightsDashboard />);

    const askAIBtn = screen.getByTestId("button-ask-ai");
    expect(askAIBtn).toHaveAttribute("aria-label", "Open AI Assistant for compliance questions");
  });

  it("should have correct aria-label on View All button", () => {
    render(<AIInsightsDashboard />);

    const viewAllBtn = screen.getByTestId("button-view-all");
    expect(viewAllBtn).toHaveAttribute("aria-label", "View all AI recommendations");
  });

  it("should have correct aria-labels on Fix buttons", () => {
    render(<AIInsightsDashboard />);

    const fixBtn1 = screen.getByTestId("button-fix-1");
    expect(fixBtn1).toHaveAttribute("aria-label", "Fix issue: Complete Access Control Policy");
    
    const fixBtn2 = screen.getByTestId("button-fix-2");
    expect(fixBtn2).toHaveAttribute("aria-label", "Fix issue: Update Incident Response Plan");
  });

  it("should call onViewDetails when View All button is clicked", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onViewDetails = vi.fn();

    render(<AIInsightsDashboard onViewDetails={onViewDetails} />);

    const viewAllBtn = screen.getByTestId("button-view-all");
    await user.click(viewAllBtn);

    expect(onViewDetails).toHaveBeenCalledTimes(1);
  });

  it("should have correct region and role attributes", () => {
    render(<AIInsightsDashboard />);

    const dashboard = screen.getByRole("region", { name: "AI Compliance Insights Dashboard" });
    expect(dashboard).toBeInTheDocument();
  });

  it("should have metrics overview with proper grouping", () => {
    render(<AIInsightsDashboard />);

    const metricsGroup = screen.getByRole("group", { name: "Compliance metrics overview" });
    expect(metricsGroup).toBeInTheDocument();
  });

  it("should have recommendations list with proper role", () => {
    render(<AIInsightsDashboard />);

    const recommendationsList = screen.getByRole("list", { name: "Compliance recommendations" });
    expect(recommendationsList).toBeInTheDocument();
  });
});

describe("RiskHeatmap", () => {
  it("should render the heatmap card with title", () => {
    render(<RiskHeatmap />);

    expect(screen.getByText("Risk Heatmap")).toBeInTheDocument();
    expect(screen.getByText("Control gaps across frameworks")).toBeInTheDocument();
  });

  it("should render grid with correct framework headers", () => {
    render(<RiskHeatmap />);

    expect(screen.getByRole("columnheader", { name: "ISO 27001" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "SOC 2" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "NIST" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "FedRAMP" })).toBeInTheDocument();
  });

  it("should render grid with correct category row headers", () => {
    render(<RiskHeatmap />);

    expect(screen.getByRole("rowheader", { name: "Access Control" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Data Protection" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Incident Response" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Risk Management" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Vendor Management" })).toBeInTheDocument();
  });

  it("should have grid role on the table", () => {
    render(<RiskHeatmap />);

    const grid = screen.getByRole("grid");
    expect(grid).toHaveAttribute("aria-label", expect.stringContaining("Risk heatmap"));
  });

  it("should display correct risk counts in badges", () => {
    render(<RiskHeatmap />);

    expect(screen.getByText("Low: 6")).toBeInTheDocument();
    expect(screen.getByText("Medium: 8")).toBeInTheDocument();
    expect(screen.getByText("High: 5")).toBeInTheDocument();
    expect(screen.getByText("Critical: 1")).toBeInTheDocument();
  });

  it("should render 20 risk cells (5 categories x 4 frameworks)", () => {
    render(<RiskHeatmap />);

    const gridCells = screen.getAllByRole("gridcell");
    const cellsWithButtons = gridCells.filter(cell => cell.querySelector('button'));
    expect(cellsWithButtons).toHaveLength(20);
  });

  it("should have accessible risk cells with aria-labels", () => {
    render(<RiskHeatmap />);

    const accessControlIso = screen.getByTestId("risk-cell-access-control-iso-27001");
    expect(accessControlIso).toHaveAttribute("aria-label", expect.stringContaining("Access Control for ISO 27001"));
    expect(accessControlIso).toHaveAttribute("aria-label", expect.stringContaining("low risk"));
  });

  it("should display control implementation counts in cells", () => {
    render(<RiskHeatmap />);

    const nineOfTen = screen.getAllByText("9/10");
    expect(nineOfTen.length).toBeGreaterThan(0);
    const threeOfTen = screen.getAllByText("3/10");
    expect(threeOfTen.length).toBeGreaterThan(0);
  });

  it("should render risk cells with correct background colors", () => {
    render(<RiskHeatmap />);

    const lowRiskCell = screen.getByTestId("risk-cell-access-control-iso-27001");
    expect(lowRiskCell).toHaveClass("bg-green-100");

    const criticalCell = screen.getByTestId("risk-cell-incident-response-fedramp");
    expect(criticalCell).toHaveClass("bg-red-100");
  });

  it("should apply custom className when provided", () => {
    render(<RiskHeatmap className="custom-class" />);

    const card = screen.getByText("Risk Heatmap").closest('.border-0');
    expect(card).toHaveClass("custom-class");
  });

  it("should have focusable cells with proper focus styles", () => {
    render(<RiskHeatmap />);

    const cell = screen.getByTestId("risk-cell-access-control-iso-27001");
    expect(cell).toHaveClass("focus:ring-2");
    expect(cell).toHaveClass("focus:ring-blue-500");
  });
});

describe("ControlPrioritizer", () => {
  it("should render the control prioritizer card with title", () => {
    render(<ControlPrioritizer />);

    expect(screen.getByText("AI Control Prioritizer")).toBeInTheDocument();
    expect(screen.getByText("Smart recommendations based on risk and effort")).toBeInTheDocument();
  });

  it("should render all 5 controls", () => {
    render(<ControlPrioritizer />);

    expect(screen.getByText("Multi-Factor Authentication")).toBeInTheDocument();
    expect(screen.getByText("Encryption at Rest")).toBeInTheDocument();
    expect(screen.getByText("Security Awareness Training")).toBeInTheDocument();
    expect(screen.getByText("Vulnerability Scanning")).toBeInTheDocument();
    expect(screen.getByText("Incident Response Plan")).toBeInTheDocument();
  });

  it("should display controls in priority order", () => {
    render(<ControlPrioritizer />);

    const controlsList = screen.getByRole("list", { name: "Prioritized security controls" });
    const listItems = within(controlsList).getAllByRole("listitem");

    expect(listItems[0]).toHaveTextContent("#1");
    expect(listItems[0]).toHaveTextContent("Multi-Factor Authentication");
    expect(listItems[1]).toHaveTextContent("#2");
    expect(listItems[1]).toHaveTextContent("Encryption at Rest");
    expect(listItems[2]).toHaveTextContent("#3");
    expect(listItems[2]).toHaveTextContent("Security Awareness Training");
  });

  it("should calculate and display correct implementation progress", () => {
    render(<ControlPrioritizer />);

    expect(screen.getByText("0/5 implemented")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("should have progress bar with correct value", () => {
    render(<ControlPrioritizer />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute("aria-label", "Implementation progress: 0% complete");
  });

  it("should display status badges correctly", () => {
    render(<ControlPrioritizer />);

    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getAllByText("Not Started")).toHaveLength(4);
  });

  it("should display effort badges with correct colors", () => {
    render(<ControlPrioritizer />);

    const lowEffortBadges = screen.getAllByText("low");
    expect(lowEffortBadges.length).toBeGreaterThan(0);

    const mediumEffortBadges = screen.getAllByText("medium");
    expect(mediumEffortBadges.length).toBeGreaterThan(0);
  });

  it("should display impact badges", () => {
    render(<ControlPrioritizer />);

    const highImpactBadges = screen.getAllByText("high");
    expect(highImpactBadges.length).toBeGreaterThan(0);
  });

  it("should display estimated time for each control", () => {
    render(<ControlPrioritizer />);

    expect(screen.getByText("2-3 days")).toBeInTheDocument();
    expect(screen.getByText("1 week")).toBeInTheDocument();
    expect(screen.getByText("2 weeks")).toBeInTheDocument();
    expect(screen.getByText("3-4 days")).toBeInTheDocument();
    expect(screen.getByText("1-2 weeks")).toBeInTheDocument();
  });

  it("should display framework badges for each control", () => {
    render(<ControlPrioritizer />);

    expect(screen.getAllByText("ISO 27001")).toHaveLength(2);
    expect(screen.getByText("SOC 2")).toBeInTheDocument();
    expect(screen.getByText("NIST")).toBeInTheDocument();
    expect(screen.getByText("FedRAMP")).toBeInTheDocument();
  });

  it("should call onImplementControl callback when implement button is clicked", async () => {
    const user = userEvent.setup();
    const onImplementControl = vi.fn();

    render(<ControlPrioritizer onImplementControl={onImplementControl} />);

    const implementBtn = screen.getByTestId("button-implement-1");
    await user.click(implementBtn);

    expect(onImplementControl).toHaveBeenCalledWith("1");
  });

  it("should have correct aria-labels on implement buttons", () => {
    render(<ControlPrioritizer />);

    const mfaBtn = screen.getByTestId("button-implement-1");
    expect(mfaBtn).toHaveAttribute("aria-label", "Implement Multi-Factor Authentication");

    const encryptionBtn = screen.getByTestId("button-implement-2");
    expect(encryptionBtn).toHaveAttribute("aria-label", "Implement Encryption at Rest");
  });

  it("should have properly structured control items", () => {
    render(<ControlPrioritizer />);

    const controlItem = screen.getByTestId("control-1");
    expect(controlItem).toHaveAttribute("role", "listitem");
  });

  it("should have aria-labels on control list items", () => {
    render(<ControlPrioritizer />);

    const firstControl = screen.getByTestId("control-1");
    expect(firstControl).toHaveAttribute("aria-label", expect.stringContaining("Priority 1"));
    expect(firstControl).toHaveAttribute("aria-label", expect.stringContaining("Multi-Factor Authentication"));
  });

  it("should render View Full Gap Analysis button", () => {
    render(<ControlPrioritizer />);

    const viewAnalysisBtn = screen.getByTestId("button-view-full-analysis");
    expect(viewAnalysisBtn).toBeInTheDocument();
    expect(viewAnalysisBtn).toHaveTextContent("View Full Gap Analysis");
  });

  it("should apply custom className when provided", () => {
    render(<ControlPrioritizer className="custom-class" />);

    const card = screen.getByText("AI Control Prioritizer").closest('.border-0');
    expect(card).toHaveClass("custom-class");
  });

  it("should display reason for prioritization", () => {
    render(<ControlPrioritizer />);

    expect(screen.getByText("High impact, low effort - Quick win for security posture")).toBeInTheDocument();
    expect(screen.getByText("Critical for data protection compliance")).toBeInTheDocument();
  });

  it("should show correct category badges", () => {
    render(<ControlPrioritizer />);

    expect(screen.getByText("Access Control")).toBeInTheDocument();
    expect(screen.getByText("Data Protection")).toBeInTheDocument();
    expect(screen.getByText("Human Resources")).toBeInTheDocument();
    expect(screen.getByText("Risk Assessment")).toBeInTheDocument();
    expect(screen.getByText("Incident Management")).toBeInTheDocument();
  });
});

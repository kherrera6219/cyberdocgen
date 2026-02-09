import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  FindingsTable,
  type Finding,
} from "../../../client/src/components/repository/FindingsTable";
import { renderWithProviders } from "../utils/renderWithProviders";

const findings: Finding[] = [
  {
    id: "finding-1",
    controlId: "A.5.1",
    framework: "ISO27001",
    status: "pass",
    confidenceLevel: "high",
    summary: "Policy found and up to date",
    signalType: "policy_scan",
    evidenceReferences: [{ filePath: "policies/is-policy.md", lineStart: 3, lineEnd: 8 }],
    recommendation: "Keep policy review cadence quarterly.",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "finding-2",
    controlId: "CC1.1",
    framework: "SOC2",
    status: "partial",
    confidenceLevel: "medium",
    summary: "Control evidence is incomplete",
    signalType: "gap_analysis",
    evidenceReferences: [{ filePath: "controls/soc2/cc1-1.md" }],
    recommendation: "Add owner approvals and timestamps.",
    createdAt: "2026-01-02T00:00:00Z",
  },
  {
    id: "finding-3",
    controlId: "AC-1",
    framework: "ISO27001",
    status: "fail",
    confidenceLevel: "low",
    summary: "Access policy missing required sections",
    signalType: "template_validation",
    evidenceReferences: [{ filePath: "access/ac-policy.md", snippet: "TODO: fill controls" }],
    recommendation: "Regenerate and route for security review.",
    createdAt: "2026-01-03T00:00:00Z",
  },
  {
    id: "finding-4",
    controlId: "ID.AM-1",
    framework: "NIST",
    status: "needs_human",
    confidenceLevel: "high",
    summary: "Asset inventory consistency requires analyst review",
    signalType: "inventory_compare",
    evidenceReferences: [{ filePath: "inventory/assets.csv" }],
    recommendation: "Confirm asset ownership and lifecycle metadata.",
    createdAt: "2026-01-04T00:00:00Z",
  },
  {
    id: "finding-5",
    controlId: "CM-2",
    framework: "FedRAMP",
    status: "not_observed",
    confidenceLevel: "medium",
    summary: "No direct evidence observed in repository",
    signalType: "repository_scan",
    evidenceReferences: [{ filePath: "README.md" }],
    recommendation: "Upload baseline configuration artifacts.",
    createdAt: "2026-01-05T00:00:00Z",
  },
];

describe("FindingsTable interactions", () => {
  it("filters findings and opens detail review flow", async () => {
    const user = userEvent.setup();
    const onReviewFinding = vi.fn();

    renderWithProviders(
      <FindingsTable findings={findings} onReviewFinding={onReviewFinding} />
    );

    expect(screen.getByText(/Findings \(5\)/i)).toBeInTheDocument();
    expect(screen.getByText("A.5.1")).toBeInTheDocument();
    expect(screen.getByText("CC1.1")).toBeInTheDocument();

    const selects = screen.getAllByRole("combobox");

    await user.click(selects[0]);
    await user.click(screen.getByRole("option", { name: "ISO27001" }));
    expect(screen.getByText(/Findings \(2\)/i)).toBeInTheDocument();

    await user.click(selects[1]);
    await user.click(screen.getByRole("option", { name: "Fail" }));
    expect(screen.getByText(/Findings \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText("AC-1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /View Details/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Regenerate and route for security review/i)).toBeInTheDocument();
    expect(screen.getByText(/Evidence \(1\)/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Review Finding/i }));
    expect(onReviewFinding).toHaveBeenCalledWith("finding-3");
  });

  it("shows empty state when filters remove all results", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FindingsTable findings={findings} />);

    const selects = screen.getAllByRole("combobox");
    await user.click(selects[0]);
    await user.click(screen.getByRole("option", { name: "FedRAMP" }));
    await user.click(selects[1]);
    await user.click(screen.getByRole("option", { name: "Pass" }));

    expect(screen.getByText(/No findings match the selected filters/i)).toBeInTheDocument();
  });
});

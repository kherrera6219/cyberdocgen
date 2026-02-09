import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  RepositoryList,
  type RepositorySnapshot,
} from "../../../client/src/components/repository/RepositoryList";
import { renderWithProviders } from "../utils/renderWithProviders";

function buildRepo(overrides: Partial<RepositorySnapshot>): RepositorySnapshot {
  return {
    id: "repo-1",
    name: "core-repo",
    status: "indexed",
    uploadedFileName: "core.zip",
    fileCount: 120,
    repositorySize: 2_500_000,
    detectedLanguages: ["TypeScript", "JavaScript", "SQL", "Python"],
    detectedFrameworks: ["ISO", "SOC2", "NIST", "FedRAMP", "HIPAA", "PCI"],
    analysisPhase: undefined,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("RepositoryList interactions", () => {
  it("renders empty state when there are no repositories", () => {
    renderWithProviders(<RepositoryList repositories={[]} />);
    expect(screen.getByText(/no repositories/i)).toBeInTheDocument();
    expect(screen.getByText(/upload a repository/i)).toBeInTheDocument();
  });

  it("supports select, analyze, and delete actions", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onDelete = vi.fn();
    const onAnalyze = vi.fn();

    renderWithProviders(
      <RepositoryList
        repositories={[
          buildRepo({ id: "repo-indexed", status: "indexed", name: "indexed-repo" }),
          buildRepo({ id: "repo-analyzing", status: "analyzing", name: "analyzing-repo", analysisPhase: "Parsing AST" }),
          buildRepo({ id: "repo-failed", status: "failed", name: "failed-repo" }),
          buildRepo({ id: "repo-extracting", status: "extracting", name: "extracting-repo" }),
          buildRepo({ id: "repo-completed", status: "completed", name: "completed-repo" }),
        ]}
        onSelect={onSelect}
        onDelete={onDelete}
        onAnalyze={onAnalyze}
      />
    );

    expect(screen.getByText(/indexed-repo/i)).toBeInTheDocument();
    expect(screen.getByText(/analyzing-repo/i)).toBeInTheDocument();
    expect(screen.getByText(/^Analyzing$/)).toBeInTheDocument();
    expect(screen.getByText(/^Failed$/)).toBeInTheDocument();
    expect(screen.getByText(/^Extracting$/)).toBeInTheDocument();
    expect(screen.getByText(/^Completed$/)).toBeInTheDocument();
    expect(screen.getAllByText(/\+1 more/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/phase: parsing ast/i)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /analyze/i })[0]);
    expect(onAnalyze).toHaveBeenCalledWith("repo-indexed");
    expect(onSelect).not.toHaveBeenCalled();

    const deleteButtons = screen.getAllByRole("button").filter((button) =>
      button.querySelector("svg.lucide-trash2")
    );
    await user.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith("repo-indexed");

    await user.click(screen.getByText(/completed-repo/i));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "repo-completed" })
    );
  });
});

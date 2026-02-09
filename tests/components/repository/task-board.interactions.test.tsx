import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  TaskBoard,
  type Task,
} from "../../../client/src/components/repository/TaskBoard";
import { renderWithProviders } from "../utils/renderWithProviders";

function buildTask(overrides: Partial<Task>): Task {
  return {
    id: "task-1",
    title: "Review policy gap",
    description: "Control mapping needs policy update.",
    category: "policy_needed",
    priority: "high",
    status: "open",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("TaskBoard interactions", () => {
  it("renders kanban columns, empty states, and task metadata", () => {
    renderWithProviders(
      <TaskBoard
        tasks={[
          buildTask({
            id: "task-open",
            status: "open",
            priority: "critical",
            category: "code_change",
          }),
          buildTask({
            id: "task-progress",
            status: "in_progress",
            priority: "medium",
            category: "missing_evidence",
            dueDate: "2026-03-01T00:00:00.000Z",
          }),
        ]}
      />
    );

    expect(screen.getByText(/to do/i)).toBeInTheDocument();
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
    expect(screen.getByText(/dismissed/i)).toBeInTheDocument();

    expect(screen.getByText(/critical/i)).toBeInTheDocument();
    expect(screen.getByText(/code change/i)).toBeInTheDocument();
    expect(screen.getByText(/missing evidence/i)).toBeInTheDocument();
    expect(screen.getByText(/due:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no tasks/i).length).toBeGreaterThan(0);
  });

  it("supports task click and status transitions", async () => {
    const user = userEvent.setup();
    const onTaskClick = vi.fn();
    const onTaskStatusChange = vi.fn();

    renderWithProviders(
      <TaskBoard
        tasks={[
          buildTask({ id: "task-open", status: "open", title: "Open Task" }),
          buildTask({ id: "task-progress", status: "in_progress", title: "In Progress Task" }),
          buildTask({ id: "task-completed", status: "completed", title: "Completed Task" }),
        ]}
        onTaskClick={onTaskClick}
        onTaskStatusChange={onTaskStatusChange}
      />
    );

    await user.click(screen.getByText(/open task/i));
    expect(onTaskClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "task-open" })
    );

    await user.click(screen.getByRole("button", { name: /start/i }));
    expect(onTaskStatusChange).toHaveBeenCalledWith("task-open", "in_progress");

    await user.click(screen.getByRole("button", { name: /complete/i }));
    expect(onTaskStatusChange).toHaveBeenCalledWith("task-progress", "completed");

    await user.click(screen.getByRole("button", { name: /reopen/i }));
    expect(onTaskStatusChange).toHaveBeenCalledWith("task-progress", "open");

    const completedCard = screen.getByText(/completed task/i).closest("div");
    expect(completedCard).toBeTruthy();
    expect(screen.queryByRole("button", { name: /start/i })).not.toBeNull();
  });
});

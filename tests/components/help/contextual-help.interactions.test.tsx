import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContextualHelp, HelpTooltip } from "../../../client/src/components/help/ContextualHelp";

describe("ContextualHelp interactions", () => {
  it("renders inline help and truncates examples/tips to two items", () => {
    render(
      <ContextualHelp
        topic="custom-topic"
        variant="inline"
        content={{
          title: "Inline Title",
          description: "Inline description",
          examples: ["Example A", "Example B", "Example C"],
          tips: ["Tip A", "Tip B", "Tip C"],
        }}
      />
    );

    expect(screen.getByText("Inline Title")).toBeInTheDocument();
    expect(screen.getByText("Examples:")).toBeInTheDocument();
    expect(screen.getByText("Tips:")).toBeInTheDocument();
    expect(screen.getByText(/Example A/)).toBeInTheDocument();
    expect(screen.getByText(/Example B/)).toBeInTheDocument();
    expect(screen.queryByText(/Example C/)).not.toBeInTheDocument();
    expect(screen.getByText(/Tip A/)).toBeInTheDocument();
    expect(screen.getByText(/Tip B/)).toBeInTheDocument();
    expect(screen.queryByText(/Tip C/)).not.toBeInTheDocument();
  });

  it("opens tooltip/modal help dialog and shows full sections", async () => {
    const user = userEvent.setup();
    render(
      <ContextualHelp
        topic="custom-topic"
        variant="tooltip"
        content={{
          title: "Modal Title",
          description: "Modal description",
          examples: ["Ex 1", "Ex 2", "Ex 3"],
          tips: ["Tip 1", "Tip 2", "Tip 3"],
          resources: [{ title: "Docs Link", url: "#", type: "docs" }],
        }}
      />
    );

    await user.click(screen.getByRole("button"));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Modal Title")).toBeInTheDocument();
    expect(screen.getByText("Examples")).toBeInTheDocument();
    expect(screen.getByText("Tips")).toBeInTheDocument();
    expect(screen.getByText("Additional Resources")).toBeInTheDocument();
    expect(screen.getByText("Ex 3")).toBeInTheDocument();
    expect(screen.getByText("Tip 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Docs Link/i })).toBeInTheDocument();
    expect(screen.getByText("docs")).toBeInTheDocument();
  });

  it("returns null when no help content exists", () => {
    const { container } = render(
      <ContextualHelp topic="missing-topic" content={undefined as any} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders HelpTooltip wrapper content from built-in database", async () => {
    const user = userEvent.setup();
    render(<HelpTooltip topic="frameworkSelection" />);

    await user.click(screen.getByRole("button"));
    expect(await screen.findByText(/Compliance Framework Selection/i)).toBeInTheDocument();
    expect(
      screen.getByText(/ISO 27001: Global information security standard/i)
    ).toBeInTheDocument();
  });
});

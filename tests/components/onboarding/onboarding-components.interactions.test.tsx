import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WelcomeWizard } from "../../../client/src/components/onboarding/welcome-wizard";
import { WelcomeTutorial } from "../../../client/src/components/onboarding/WelcomeTutorial";
import { QuickStartChecklist } from "../../../client/src/components/onboarding/QuickStartChecklist";
import {
  createTestQueryClient,
  renderWithProviders,
} from "../utils/renderWithProviders";

const setLocationMock = vi.hoisted(() => vi.fn());
const organizationState = vi.hoisted(() => ({
  profile: null as
    | null
    | {
        companyName?: string;
        industry?: string;
      },
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/", setLocationMock],
}));

vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => organizationState,
}));

describe("Onboarding component interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    organizationState.profile = null;
  });

  it("completes the welcome wizard and navigates to profile setup", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    renderWithProviders(<WelcomeWizard onComplete={onComplete} />);

    expect(screen.getByText(/welcome to cyberdocgen/i)).toBeInTheDocument();
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByText(/choose your framework/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByText(/next steps/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /get started/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(setLocationMock).toHaveBeenCalledWith("/profile");
  });

  it("skips the welcome wizard and returns to dashboard route", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    renderWithProviders(<WelcomeWizard onComplete={onComplete} />);
    await user.click(screen.getByRole("button", { name: /skip tutorial/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(setLocationMock).toHaveBeenCalledWith("/");
  });

  it("runs tutorial action and finish flows", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onComplete = vi.fn();

    renderWithProviders(
      <WelcomeTutorial isOpen={true} onClose={onClose} onComplete={onComplete} />
    );

    expect(screen.getByText(/welcome to cyberdocgen/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^next$/i }));

    await user.click(screen.getByRole("button", { name: /set up profile/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    onComplete.mockClear();
    onClose.mockClear();

    renderWithProviders(
      <WelcomeTutorial isOpen={true} onClose={onClose} onComplete={onComplete} />
    );

    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.click(screen.getByRole("button", { name: /finish/i }));

    expect(await screen.findByText(/welcome aboard/i)).toBeInTheDocument();
    await waitFor(
      () => {
        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
      },
      { timeout: 2500 }
    );
  });

  it("renders and dismisses quick start checklist, and hides when fully completed", async () => {
    const user = userEvent.setup();
    const incompleteClient = createTestQueryClient({
      "/api/documents": [],
    });

    renderWithProviders(<QuickStartChecklist />, { queryClient: incompleteClient });

    expect(screen.getByText(/quick start checklist/i)).toBeInTheDocument();
    expect(screen.getByText(/0 of 3 completed/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /set up profile/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByText(/quick start checklist/i)).not.toBeInTheDocument();

    organizationState.profile = {
      companyName: "Lucentry AI",
      industry: "Technology",
    };

    const completedClient = createTestQueryClient({
      "/api/documents": [{ id: "doc-1", status: "complete" }] as any,
    });

    const { container } = renderWithProviders(<QuickStartChecklist />, {
      queryClient: completedClient,
    });

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });
});

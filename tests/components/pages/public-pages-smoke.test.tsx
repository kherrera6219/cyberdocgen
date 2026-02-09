import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import About from "../../../client/src/pages/about";
import Contact from "../../../client/src/pages/contact";
import Pricing from "../../../client/src/pages/pricing";
import Privacy from "../../../client/src/pages/privacy";
import Terms from "../../../client/src/pages/terms";
import EnterpriseLogin from "../../../client/src/pages/enterprise-login";
import { renderWithProviders } from "../utils/renderWithProviders";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isLocalMode: false,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/components/TemporaryLoginDialog", () => ({
  TemporaryLoginDialog: ({ trigger }: { trigger: ReactNode }) => <>{trigger}</>,
}));

describe("Public pages smoke coverage", () => {
  it("renders about page", async () => {
    renderWithProviders(<About />);
    expect(await screen.findByText(/about cyberdocgen/i)).toBeInTheDocument();
  });

  it("renders contact page", async () => {
    renderWithProviders(<Contact />);
    expect(await screen.findByText(/get in touch/i)).toBeInTheDocument();
  });

  it("renders features page", async () => {
    const { default: Features } = await import("../../../client/src/pages/features");
    renderWithProviders(<Features />);
    expect(await screen.findByText(/everything you need for/i)).toBeInTheDocument();
  });

  it("renders pricing page", async () => {
    renderWithProviders(<Pricing />);
    expect(await screen.findByText(/pricing coming soon/i)).toBeInTheDocument();
  });

  it("renders privacy page", async () => {
    renderWithProviders(<Privacy />);
    expect(
      await screen.findByRole("heading", { level: 1, name: /privacy policy/i }),
    ).toBeInTheDocument();
  });

  it("renders terms page", async () => {
    renderWithProviders(<Terms />);
    expect(
      await screen.findByRole("heading", { level: 1, name: /terms of service/i }),
    ).toBeInTheDocument();
  });

  it("renders enterprise login page", async () => {
    renderWithProviders(<EnterpriseLogin />);
    expect(
      await screen.findByRole("heading", { level: 1, name: /sign in to cyberdocgen/i }),
    ).toBeInTheDocument();
  });
});

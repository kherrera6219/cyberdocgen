import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import type { ReactNode } from "react";
import App from "../../client/src/App";
import { renderWithProviders } from "./utils/renderWithProviders";

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: false,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

vi.mock("wouter", () => ({
  Switch: ({ children }: { children: ReactNode }) => (
    <div data-testid="mock-switch">{children}</div>
  ),
  Route: ({ path, children }: { path?: string; children?: ReactNode }) => (
    <div data-testid={`route-${path ?? "fallback"}`}>{children}</div>
  ),
  useParams: () => ({ id: "doc-1" }),
}));

describe("App routing shell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows centered loading state when auth is loading", () => {
    authState.isAuthenticated = false;
    authState.isLoading = true;

    renderWithProviders(<App />);
    expect(screen.getByText(/loading\.\.\./i)).toBeInTheDocument();
  });

  it("renders public shell when user is not authenticated", () => {
    authState.isAuthenticated = false;
    authState.isLoading = false;

    renderWithProviders(<App />);
    expect(screen.getByRole("link", { name: /skip to main content/i })).toHaveAttribute(
      "href",
      "#main-content"
    );
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });
});

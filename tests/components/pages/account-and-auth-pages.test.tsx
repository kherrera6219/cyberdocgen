import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPassword from "../../../client/src/pages/forgot-password";
import ResetPassword from "../../../client/src/pages/reset-password";
import UserProfile from "../../../client/src/pages/user-profile";
import ExportCenter from "../../../client/src/pages/export-center";
import NotFound from "../../../client/src/pages/not-found";
import { renderWithProviders } from "../utils/renderWithProviders";

const toastMock = vi.hoisted(() => vi.fn());
const apiRequestMock = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({
  user: null as any,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock("@/lib/queryClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/queryClient")>("@/lib/queryClient");
  return {
    ...actual,
    apiRequest: apiRequestMock,
  };
});

describe("Account and auth page coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = {
      id: "user-1",
      email: "kevin@example.com",
      firstName: "Kevin",
      lastName: "Herrera",
      role: "admin",
      isActive: true,
      createdAt: "2025-01-01T00:00:00.000Z",
      profileImageUrl: null,
    };
  });

  it("renders and updates user profile", async () => {
    apiRequestMock.mockResolvedValue({
      json: async () => ({ success: true }),
    });

    const user = userEvent.setup();
    renderWithProviders(<UserProfile />);

    expect(await screen.findByText(/user profile/i)).toBeInTheDocument();
    expect(screen.getAllByText("kevin@example.com").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    await user.clear(screen.getByLabelText(/first name/i));
    await user.type(screen.getByLabelText(/first name/i), "Kevin Updated");
    await user.clear(screen.getByLabelText(/last name/i));
    await user.type(screen.getByLabelText(/last name/i), "Herrera Updated");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(apiRequestMock).toHaveBeenCalledWith("PATCH", "/api/user", {
      firstName: "Kevin Updated",
      lastName: "Herrera Updated",
    });
    expect(toastMock).toHaveBeenCalled();
  });

  it("renders forgot-password flow and success step", async () => {
    apiRequestMock.mockResolvedValue({
      resetToken: "reset-token-123",
    });

    const user = userEvent.setup();
    renderWithProviders(<ForgotPassword />);

    await user.type(screen.getByLabelText(/email address/i), "kevin@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText(/password reset email sent/i)).toBeInTheDocument();
    expect(screen.getByText(/development mode/i)).toBeInTheDocument();
  });

  it("renders reset-password invalid-token and success flows", async () => {
    const user = userEvent.setup();

    window.history.pushState({}, "", "/reset-password");
    const invalidRender = renderWithProviders(<ResetPassword />);
    expect(await screen.findByText(/invalid reset link/i)).toBeInTheDocument();
    invalidRender.unmount();

    apiRequestMock.mockResolvedValue({ success: true });
    window.history.pushState({}, "", "/reset-password?token=token-abc");
    renderWithProviders(<ResetPassword />);

    await user.type(screen.getByLabelText(/^new password$/i), "StrongPass123!");
    await user.type(screen.getByLabelText(/confirm new password/i), "StrongPass123!");
    await user.click(screen.getByRole("button", { name: /^reset password$/i }));

    expect(await screen.findByText(/password updated/i)).toBeInTheDocument();
    expect(apiRequestMock).toHaveBeenCalledWith("/api/auth/enterprise/reset-password", "POST", {
      token: "token-abc",
      newPassword: "StrongPass123!",
    });
  });

  it("renders export center and not-found pages", async () => {
    const user = userEvent.setup();

    renderWithProviders(<ExportCenter />);
    expect(screen.getByText(/export center/i)).toBeInTheDocument();
    await user.click(screen.getByTestId("button-export-pdf"));
    await user.click(screen.getByTestId("button-export-excel"));
    expect(toastMock).toHaveBeenCalledTimes(2);

    renderWithProviders(<NotFound fullScreen />);
    expect(screen.getByText(/404 page not found/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("button-go-home"));
  });
});

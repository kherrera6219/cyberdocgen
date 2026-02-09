import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GoogleAuthenticatorSetup from "../../../client/src/components/auth/GoogleAuthenticatorSetup";
import { renderWithProviders } from "../utils/renderWithProviders";

const toastMock = vi.hoisted(() => vi.fn());
const apiRequestMock = vi.hoisted(() => vi.fn());
const clipboardWriteMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

describe("GoogleAuthenticatorSetup interactions", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    toastMock.mockReset();
    clipboardWriteMock.mockReset();
    clipboardWriteMock.mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: { writeText: clipboardWriteMock },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs setup, copies secret, verifies, and completes successfully", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    apiRequestMock
      .mockResolvedValueOnce({
        setup: {
          secret: "SECRET123",
          qrCodeUrl: "https://example.com/qr.png",
          backupCodes: ["BACKUP-1", "BACKUP-2"],
        },
      })
      .mockResolvedValueOnce({ success: true });

    const { container } = renderWithProviders(
      <GoogleAuthenticatorSetup userId="user-1" onComplete={onComplete} />
    );

    await user.click(screen.getByRole("button", { name: /start setup/i }));
    expect(await screen.findByText(/verify setup/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("SECRET123")).toBeInTheDocument();

    const copyButton = container.querySelector("button svg.lucide-copy")?.closest("button");
    expect(copyButton).toBeTruthy();
    await user.click(copyButton as HTMLButtonElement);
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Copied!",
          description: "Secret key copied to clipboard",
        })
      );
    });

    await user.type(screen.getByLabelText(/verification code/i), "123456");
    await user.click(screen.getByRole("button", { name: /verify & enable/i }));

    expect(await screen.findByText(/google authenticator enabled/i)).toBeInTheDocument();
    expect(screen.getByText("BACKUP-1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(onComplete).toHaveBeenCalled();

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/api/auth/enterprise/setup-google-authenticator",
      "POST",
      { userId: "user-1" }
    );
    expect(apiRequestMock).toHaveBeenCalledWith(
      "/api/auth/enterprise/verify-google-authenticator",
      "POST",
      { userId: "user-1", token: "123456" }
    );
  });

  it("shows a destructive toast when setup fails", async () => {
    const user = userEvent.setup();
    apiRequestMock.mockRejectedValueOnce(new Error("setup failed"));

    renderWithProviders(<GoogleAuthenticatorSetup userId="user-1" />);
    await user.click(screen.getByRole("button", { name: /start setup/i }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Setup Failed",
          description: "setup failed",
          variant: "destructive",
        })
      );
    });
  });

  it("shows validation and server errors during verification", async () => {
    const user = userEvent.setup();

    apiRequestMock
      .mockResolvedValueOnce({
        setup: {
          secret: "SECRET123",
          qrCodeUrl: "https://example.com/qr.png",
          backupCodes: [],
        },
      })
      .mockRejectedValueOnce(new Error("Invalid verification code"));

    renderWithProviders(<GoogleAuthenticatorSetup userId="user-1" />);
    await user.click(screen.getByRole("button", { name: /start setup/i }));
    expect(await screen.findByText(/verify setup/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /verify & enable/i }));
    expect(await screen.findByText(/code must be 6 digits/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/verification code/i), "123456");
    await user.click(screen.getByRole("button", { name: /verify & enable/i }));

    expect(await screen.findByText(/invalid verification code/i)).toBeInTheDocument();
  });

  it("invokes cancel callback in both setup and verify steps", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    apiRequestMock.mockResolvedValueOnce({
      setup: { secret: "SECRET123", qrCodeUrl: "https://example.com/qr.png", backupCodes: [] },
    });

    renderWithProviders(
      <GoogleAuthenticatorSetup userId="user-1" onCancel={onCancel} />
    );

    await user.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /start setup/i }));
    expect(await screen.findByText(/verify setup/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});

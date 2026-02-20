import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MFASetupPage from "../../../client/src/pages/mfa-setup";
import { renderWithProviders } from "../utils/renderWithProviders";

const toastMock = vi.hoisted(() => vi.fn());
const clipboardWriteMock = vi.hoisted(() => vi.fn());

vi.mock("../../../client/src/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "kevin@example.com" },
  }),
}));

vi.mock("../../../client/src/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock("../../../client/src/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

describe("MFA setup page flows", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    clipboardWriteMock.mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: {
        writeText: clipboardWriteMock,
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("configures and verifies authenticator app (TOTP)", async () => {
    const user = userEvent.setup();

    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          enabled: false,
          totpEnabled: false,
          smsEnabled: false,
          backupCodesGenerated: false,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          secret: "totp-secret",
          qrCode: "data:image/png;base64,AAA",
          manualEntryKey: "ABCDEF123456",
        }),
      )
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(
        jsonResponse({
          enabled: true,
          totpEnabled: true,
          smsEnabled: false,
          backupCodesGenerated: false,
        }),
      );

    renderWithProviders(<MFASetupPage />);

    expect(await screen.findByText(/multi-factor authentication/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /setup authenticator/i }));
    expect(await screen.findByText(/setup authenticator app/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("000000"), "123456");
    await user.click(screen.getByRole("button", { name: /verify & enable/i }));

    await waitFor(() =>
      expect(screen.getByText(/totp authentication enabled successfully/i)).toBeInTheDocument(),
    );
  });

  it("configures SMS and generates backup codes", async () => {
    const user = userEvent.setup();
    const createObjectURLMock = vi.fn(() => "blob:test-url");
    const revokeObjectURLMock = vi.fn();
    const clickMock = vi.fn();
    const originalCreateElement = document.createElement.bind(document);

    class URLWithBlobHelpers extends URL {}
    (URLWithBlobHelpers as unknown as { createObjectURL: typeof createObjectURLMock }).createObjectURL = createObjectURLMock;
    (URLWithBlobHelpers as unknown as { revokeObjectURL: typeof revokeObjectURLMock }).revokeObjectURL = revokeObjectURLMock;
    vi.stubGlobal("URL", URLWithBlobHelpers as unknown as typeof URL);

    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === "a") {
        return {
          href: "",
          download: "",
          click: clickMock,
        } as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tagName);
    });

    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          enabled: false,
          totpEnabled: false,
          smsEnabled: false,
          backupCodesGenerated: false,
        }),
      )
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(
        jsonResponse({
          enabled: false,
          totpEnabled: false,
          smsEnabled: true,
          backupCodesGenerated: false,
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ codes: ["CODE-1", "CODE-2", "CODE-3", "CODE-4"] }))
      .mockResolvedValueOnce(
        jsonResponse({
          enabled: true,
          totpEnabled: false,
          smsEnabled: true,
          backupCodesGenerated: true,
        }),
      );

    renderWithProviders(<MFASetupPage />);
    expect(await screen.findByText(/multi-factor authentication/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("+1 (555) 123-4567"), "+15555550100");
    await user.click(screen.getByRole("button", { name: /setup sms/i }));
    expect(await screen.findByText(/verify phone number/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("000000"), "654321");
    await user.click(screen.getByRole("button", { name: /verify & enable/i }));

    await waitFor(() =>
      expect(screen.getByText(/sms authentication enabled successfully/i)).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /generate codes/i }));
    expect(await screen.findByText(/backup codes generated/i)).toBeInTheDocument();
    expect(screen.getByText("CODE-1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /copy all/i }));
    expect(await screen.findByText(/copied to clipboard/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /download/i }));
    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();
  });
});

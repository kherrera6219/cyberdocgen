import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ApiKeysPage from "../../../client/src/pages/api-keys";
import { renderWithProviders } from "../utils/renderWithProviders";

const toastMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-toast", () => ({
  toast: toastMock,
  useToast: () => ({ toast: toastMock }),
}));

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

describe("ApiKeysPage interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows local-mode warning when app is running in cloud mode", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = resolveUrl(input);
      if (url.includes("/api/config")) {
        return jsonResponse({ deploymentMode: "cloud", isProduction: true });
      }
      return jsonResponse({});
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<ApiKeysPage />);
    expect(await screen.findByText(/only available in local desktop mode/i)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("tests, saves, and deletes OPENAI keys in local mode", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = resolveUrl(input);
      if (url.includes("/api/config")) {
        return jsonResponse({ deploymentMode: "local", isProduction: false });
      }
      if (url.includes("/api/local/api-keys/configured")) {
        return jsonResponse({ configured: ["OPENAI"] });
      }
      if (url.includes("/api/local/api-keys/test")) {
        return jsonResponse({ valid: true });
      }
      if (url.includes("/api/local/api-keys/OPENAI") && init?.method === "POST") {
        return jsonResponse({ success: true });
      }
      if (url.includes("/api/local/api-keys/OPENAI") && init?.method === "DELETE") {
        return jsonResponse({ success: true });
      }
      return jsonResponse({});
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("confirm", vi.fn(() => true));

    const user = userEvent.setup();
    renderWithProviders(<ApiKeysPage />);

    expect(await screen.findByRole("heading", { name: /ai provider api keys/i })).toBeInTheDocument();
    expect(await screen.findByPlaceholderText(/enter your openai api key/i)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /remove key/i })).toBeInTheDocument();
    expect(screen.getByText(/stored securely in windows credential manager/i)).toBeInTheDocument();

    const openAiInput = screen.getByPlaceholderText(/enter your openai api key/i);
    await user.type(openAiInput, "sk-abcdefghijklmnopqrstuvwxyz1234");

    await user.click(screen.getAllByRole("button", { name: /^test$/i })[0]!);
    await user.click(screen.getAllByRole("button", { name: /^save$/i })[0]!);
    await user.click(screen.getByRole("button", { name: /remove key/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/local/api-keys/test",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/local/api-keys/OPENAI",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/local/api-keys/OPENAI",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Success",
      }),
    );

    vi.unstubAllGlobals();
  });

  it("shows configured-provider query error and disables actions", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = resolveUrl(input);
      if (url.includes("/api/config")) {
        return jsonResponse({ deploymentMode: "local", isProduction: false });
      }
      if (url.includes("/api/local/api-keys/configured")) {
        return jsonResponse({ error: "boom" }, 500);
      }
      return jsonResponse({});
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    renderWithProviders(<ApiKeysPage />);

    expect(await screen.findByText(/failed to load api key status/i)).toBeInTheDocument();
    const openAiInput = screen.getByPlaceholderText(/enter your openai api key/i);
    await user.type(openAiInput, "sk-abcdefghijklmnopqrstuvwxyz1234");

    const saveButtons = screen.getAllByRole("button", { name: /^save$/i });
    const testButtons = screen.getAllByRole("button", { name: /^test$/i });
    expect(saveButtons.every(button => button.hasAttribute("disabled"))).toBe(true);
    expect(testButtons.every(button => button.hasAttribute("disabled"))).toBe(true);

    vi.unstubAllGlobals();
  });
});

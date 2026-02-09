import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LocalSettingsPage from "../../../client/src/pages/local-settings";
import { renderWithProviders } from "../utils/renderWithProviders";

const toastMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
  useToast: () => ({ toast: (...args: unknown[]) => toastMock(...args) }),
}));

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

describe("LocalSettings interactions", () => {
  const originalConfirm = window.confirm;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.confirm = originalConfirm;
    vi.unstubAllGlobals();
  });

  it("shows local-mode gate message when runtime is cloud", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = resolveUrl(input);
      if (url.includes("/api/local/runtime/mode")) {
        return jsonResponse({
          mode: "cloud",
          features: {},
          database: { type: "postgres" },
          storage: { type: "cloud" },
          auth: { enabled: true, provider: "oidc" },
        });
      }
      return jsonResponse({});
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<LocalSettingsPage />);

    expect(
      await screen.findByText(/local settings are only available when running in local mode/i)
    ).toBeInTheDocument();
  });

  it("runs backup, maintenance, and cleanup actions in local mode", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = resolveUrl(input);
      if (url.includes("/api/local/runtime/mode")) {
        return jsonResponse({
          mode: "local",
          features: {},
          database: { type: "sqlite" },
          storage: { type: "local" },
          auth: { enabled: false, provider: "bypass" },
        });
      }
      if (url.includes("/api/local/db-info")) {
        return jsonResponse({
          path: "C:/cyberdocgen/local.db",
          size: 1024,
          pageCount: 10,
          pageSize: 1024,
          walMode: true,
          formattedSize: "1 KB",
        });
      }
      if (url.includes("/api/local/storage-info")) {
        return jsonResponse({
          path: "C:/cyberdocgen/storage",
          totalSize: 1234,
          fileCount: 12,
          formattedSize: "1.2 KB",
        });
      }
      if (url.includes("/api/local/backup")) {
        expect(init?.method).toBe("POST");
        return jsonResponse({ success: true });
      }
      if (url.includes("/api/local/maintenance")) {
        expect(init?.method).toBe("POST");
        return jsonResponse({ success: true });
      }
      if (url.includes("/api/local/cleanup")) {
        expect(init?.method).toBe("POST");
        return jsonResponse({ success: true, removedDirectories: 3 });
      }
      return jsonResponse({});
    });

    vi.stubGlobal("fetch", fetchMock);
    window.confirm = vi.fn(() => true);
    (window as any).electron = undefined;

    const user = userEvent.setup();
    renderWithProviders(<LocalSettingsPage />);

    expect(await screen.findByText(/local mode settings/i)).toBeInTheDocument();
    await screen.findByText("1 KB");
    expect(screen.getAllByText(/enabled/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("tab", { name: /database/i }));
    await user.click(screen.getByRole("button", { name: /backup/i }));

    await user.click(screen.getByRole("button", { name: /maintenance/i }));
    expect(window.confirm).toHaveBeenCalledWith(
      "Run database maintenance? This may take a few moments."
    );

    await user.click(screen.getByRole("tab", { name: /storage/i }));
    await user.click(screen.getByRole("button", { name: /cleanup/i }));
    expect(window.confirm).toHaveBeenCalledWith("Clean up empty storage directories?");

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/local/backup"),
        expect.objectContaining({ method: "POST" })
      );
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/local/maintenance"),
        expect.objectContaining({ method: "POST" })
      );
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/local/cleanup"),
        expect.objectContaining({ method: "POST" })
      );
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Success" })
    );
  });

  it("shows database load failure state when db-info endpoint fails", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = resolveUrl(input);
      if (url.includes("/api/local/runtime/mode")) {
        return jsonResponse({
          mode: "local",
          features: {},
          database: { type: "sqlite" },
          storage: { type: "local" },
          auth: { enabled: false, provider: "bypass" },
        });
      }
      if (url.includes("/api/local/db-info")) {
        return jsonResponse({ error: "failed" }, 500);
      }
      if (url.includes("/api/local/storage-info")) {
        return jsonResponse({
          path: "C:/cyberdocgen/storage",
          totalSize: 0,
          fileCount: 0,
          formattedSize: "0 B",
        });
      }
      return jsonResponse({});
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<LocalSettingsPage />);
    expect(await screen.findByText(/failed to load database info/i)).toBeInTheDocument();
  });
});

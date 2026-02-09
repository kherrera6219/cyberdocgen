// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../../client/src/lib/queryClient";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

describe("apiRequest compatibility", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.cookie = "csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses URL-first requests and sends CSRF headers for mutating calls", async () => {
    document.cookie = "csrf-token=test-csrf";
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

    const result = await apiRequest("/api/ping", "POST", { hello: "world" });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ping",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf",
        }),
      }),
    );
  });

  it("supports legacy method-first call signatures", async () => {
    document.cookie = "csrf-token=legacy-token";
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

    const result = await apiRequest("POST", "/api/legacy", { legacy: true });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/legacy",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-CSRF-Token": "legacy-token",
        }),
      }),
    );
  });

  it("fetches a CSRF token when no cookie is present", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ csrfToken: "from-api" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    await apiRequest("/api/needs-csrf", "POST", { ok: true });

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/csrf-token", {
      credentials: "include",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/needs-csrf",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-CSRF-Token": "from-api",
        }),
      }),
    );
  });
});

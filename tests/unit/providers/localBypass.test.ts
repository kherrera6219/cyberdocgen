import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { localAuthBypassMiddleware } from "../../../server/providers/auth/localBypass";

const originalEnv = { ...process.env };

function createMockResponse() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("localAuthBypassMiddleware", () => {
  beforeEach(() => {
    process.env = { ...originalEnv, DEPLOYMENT_MODE: "local" };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("injects default synthetic identity when session is empty", () => {
    const req: any = {
      socket: { remoteAddress: "127.0.0.1" },
      session: {},
    };
    const res = createMockResponse();
    const next = vi.fn();

    localAuthBypassMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.id).toBe("1");
    expect(req.user.claims.sub).toBe("1");
    expect(req.user.email).toBe("admin@local");
    expect(req.session.userId).toBe("1");
    expect(req.session.organizationId).toBe("1");
    expect(typeof req.isAuthenticated).toBe("function");
    expect(req.isAuthenticated()).toBe(true);
  });

  it("preserves temp-login session identity instead of overwriting it", () => {
    const req: any = {
      socket: { remoteAddress: "127.0.0.1" },
      session: {
        userId: "temp-123",
        tempUserEmail: "Demo.User@Example.COM",
        tempUserName: "Demo User",
        organizationId: "org-temp",
      },
    };
    const res = createMockResponse();
    const next = vi.fn();

    localAuthBypassMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.id).toBe("temp-123");
    expect(req.user.claims.sub).toBe("temp-123");
    expect(req.user.email).toBe("demo.user@example.com");
    expect(req.user.firstName).toBe("Demo");
    expect(req.user.lastName).toBe("User");
    expect(req.user.organizationId).toBe("org-temp");
    expect(req.session.userId).toBe("temp-123");
    expect(req.session.organizationId).toBe("org-temp");
  });

  it("blocks non-loopback requests", () => {
    const req: any = {
      socket: { remoteAddress: "10.20.30.40" },
      session: {},
    };
    const res = createMockResponse();
    const next = vi.fn();

    localAuthBypassMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Local auth bypass only accepts loopback requests",
    });
  });
});


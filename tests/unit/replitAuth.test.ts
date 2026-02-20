import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sessionMock = vi.hoisted(() =>
  vi.fn((options: any) => {
    const middleware: any = (_req: any, _res: any, next: any) => next?.();
    middleware.__sessionOptions = options;
    return middleware;
  })
);

const memoryStoreCtorMock = vi.hoisted(() =>
  vi.fn(function MockMemoryStore(this: any, options: any) {
    this.options = options;
  })
);

const createMemoryStoreMock = vi.hoisted(() => vi.fn(() => memoryStoreCtorMock));

const pgStoreCtorMock = vi.hoisted(() =>
  vi.fn(function MockPgStore(this: any, options: any) {
    this.options = options;
  })
);

const connectPgMock = vi.hoisted(() => vi.fn(() => pgStoreCtorMock));

const discoveryMock = vi.hoisted(() => vi.fn(async () => ({ issuer: "mock-issuer" })));
const refreshTokenGrantMock = vi.hoisted(() =>
  vi.fn(async () => ({
    access_token: "new-access-token",
    refresh_token: "new-refresh-token",
    claims: () => ({
      sub: "oauth-user",
      email: "oauth@example.com",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  }))
);
const buildEndSessionUrlMock = vi.hoisted(() =>
  vi.fn(() => new URL("https://logout.example.com/session-end"))
);

const strategyCtorMock = vi.hoisted(() =>
  vi.fn(function MockStrategy(this: any, options: any, verify: any) {
    this.name = options.name;
    this.options = options;
    this.verify = verify;
  })
);

const passportMock = vi.hoisted(() => ({
  initialize: vi.fn(() => (_req: any, _res: any, next: any) => next?.()),
  session: vi.fn(() => (_req: any, _res: any, next: any) => next?.()),
  use: vi.fn(),
  authenticate: vi.fn((strategyName: string, optionsOrCb?: any) => {
    if (typeof optionsOrCb === "function") {
      const callback = optionsOrCb;
      return (req: any, _res: any, _next: any) => {
        if (req.__authError) {
          callback(req.__authError, false, req.__authInfo);
          return;
        }
        const hasUser = Object.prototype.hasOwnProperty.call(req, "__authUser");
        const user = hasUser
          ? req.__authUser
          : {
              claims: { sub: "oauth-user" },
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            };
        callback(null, user, req.__authInfo);
      };
    }
    return (_req: any, _res: any, next: any) => next?.();
  }),
  serializeUser: vi.fn(),
  deserializeUser: vi.fn(),
}));

const storageMock = vi.hoisted(() => ({
  getUserRoleAssignments: vi.fn(),
  getUser: vi.fn(),
  upsertUser: vi.fn(),
  updateUser: vi.fn(),
  getUserOrganizations: vi.fn(),
  createOrganization: vi.fn(),
  addUserToOrganization: vi.fn(),
}));

const isLocalModeMock = vi.hoisted(() => vi.fn(() => false));

const loggerMock = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock("express-session", () => ({ default: sessionMock }));
vi.mock("memorystore", () => ({ default: createMemoryStoreMock }));
vi.mock("connect-pg-simple", () => ({ default: connectPgMock }));
vi.mock("openid-client", () => ({
  discovery: discoveryMock,
  refreshTokenGrant: refreshTokenGrantMock,
  buildEndSessionUrl: buildEndSessionUrlMock,
}));
vi.mock("openid-client/passport", () => ({ Strategy: strategyCtorMock }));
vi.mock("passport", () => ({ default: passportMock }));
vi.mock("../../server/storage", () => ({ storage: storageMock }));
vi.mock("../../server/config/runtime", () => ({ isLocalMode: isLocalModeMock }));
vi.mock("../../server/utils/logger", () => ({ logger: loggerMock }));

const originalEnv = { ...process.env };

const loadAuthModule = async () => {
  vi.resetModules();
  return await import("../../server/replitAuth");
};

const createMockApp = () => {
  const routes: Record<string, (...args: any[]) => any> = {};
  return {
    routes,
    set: vi.fn(),
    use: vi.fn(),
    get: vi.fn((path: string, handler: (...args: any[]) => any) => {
      routes[path] = handler;
    }),
  };
};

describe("replitAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    isLocalModeMock.mockReturnValue(false);
    storageMock.getUserRoleAssignments.mockResolvedValue([]);
    storageMock.getUser.mockResolvedValue({ id: "dev-admin-001" });
    storageMock.upsertUser.mockResolvedValue(undefined);
    storageMock.updateUser.mockResolvedValue(undefined);
    storageMock.getUserOrganizations.mockResolvedValue([{ organizationId: "org-existing" }]);
    storageMock.createOrganization.mockResolvedValue({ id: "org-dev" });
    storageMock.addUserToOrganization.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("builds a local memory-backed session config in local mode", async () => {
    process.env.DEPLOYMENT_MODE = "local";
    process.env.NODE_ENV = "development";
    delete process.env.SESSION_SECRET;

    const { getSession } = await loadAuthModule();
    const middleware = getSession();

    expect(typeof middleware).toBe("function");
    expect(createMemoryStoreMock).toHaveBeenCalledTimes(1);
    expect(memoryStoreCtorMock).toHaveBeenCalledWith(
      expect.objectContaining({ checkPeriod: 86400000 })
    );
    expect(sessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        secret: "local-secret",
        cookie: expect.objectContaining({
          secure: false,
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        }),
      })
    );
  });

  it("builds a postgres-backed session config outside local mode", async () => {
    process.env.DEPLOYMENT_MODE = "cloud";
    process.env.NODE_ENV = "production";
    process.env.SESSION_SECRET = "prod-secret";
    process.env.DATABASE_URL = "postgres://db.example.com/app";

    const { getSession } = await loadAuthModule();
    getSession();

    expect(connectPgMock).toHaveBeenCalledTimes(1);
    expect(pgStoreCtorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        conString: "postgres://db.example.com/app",
        createTableIfMissing: true,
        tableName: "sessions",
      })
    );
    expect(sessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        secret: "prod-secret",
        cookie: expect.objectContaining({
          secure: true,
          sameSite: "strict",
        }),
      })
    );
  });

  it("sets up stub auth routes in test mode", async () => {
    process.env.NODE_ENV = "test";
    process.env.REPL_ID = "test-repl-id";

    const { setupAuth } = await loadAuthModule();
    const app = createMockApp();

    await setupAuth(app as any);

    expect(app.routes["/api/login"]).toBeDefined();
    expect(app.routes["/api/callback"]).toBeDefined();
    expect(app.routes["/api/logout"]).toBeDefined();

    const loginRes = { json: vi.fn() };
    app.routes["/api/login"]({} as any, loginRes as any);
    expect(loginRes.json).toHaveBeenCalledWith({
      message: "Login endpoint (auth disabled)",
    });

    const callbackRes = { redirect: vi.fn() };
    app.routes["/api/callback"]({} as any, callbackRes as any);
    expect(callbackRes.redirect).toHaveBeenCalledWith("/");
  });

  it("configures full OIDC routes and handles login/callback/logout success", async () => {
    process.env.NODE_ENV = "production";
    process.env.REPL_ID = "repl-123";
    process.env.REPLIT_DOMAINS = "Alpha.Example.com, beta.example.com";

    const { setupAuth } = await loadAuthModule();
    const app = createMockApp();

    await setupAuth(app as any);

    expect(discoveryMock).toHaveBeenCalledTimes(1);
    expect(strategyCtorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "replitauth:alpha.example.com",
        callbackURL: "https://alpha.example.com/api/callback",
      }),
      expect.any(Function)
    );
    expect(strategyCtorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "replitauth:beta.example.com",
        callbackURL: "https://beta.example.com/api/callback",
      }),
      expect.any(Function)
    );

    const next = vi.fn();
    app.routes["/api/login"](
      { hostname: "tenant.example.com" } as any,
      {} as any,
      next
    );
    expect(passportMock.authenticate).toHaveBeenCalledWith(
      "replitauth:tenant.example.com",
      expect.objectContaining({
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })
    );
    expect(next).toHaveBeenCalled();

    const callbackRes = { redirect: vi.fn() };
    app.routes["/api/callback"](
      {
        hostname: "tenant.example.com",
        query: { code: "abc" },
        logIn: (_user: unknown, cb: (err?: Error | null) => void) => cb(null),
      } as any,
      callbackRes as any,
      vi.fn()
    );
    expect(callbackRes.redirect).toHaveBeenCalledWith("/dashboard");

    const logoutRes = { redirect: vi.fn() };
    app.routes["/api/logout"](
      {
        hostname: "tenant.example.com",
        logout: (cb: () => void) => cb(),
      } as any,
      logoutRes as any
    );
    expect(buildEndSessionUrlMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        client_id: "repl-123",
        post_logout_redirect_uri: "https://tenant.example.com",
      })
    );
    expect(logoutRes.redirect).toHaveBeenCalledWith(
      "https://logout.example.com/session-end"
    );
  });

  it("redirects callback to login on authentication error", async () => {
    process.env.NODE_ENV = "production";
    process.env.REPL_ID = "repl-123";
    process.env.REPLIT_DOMAINS = "";

    const { setupAuth } = await loadAuthModule();
    const app = createMockApp();
    await setupAuth(app as any);

    const callbackRes = { redirect: vi.fn() };
    app.routes["/api/callback"](
      {
        hostname: "tenant.example.com",
        query: {},
        __authError: new Error("OIDC failed"),
        logIn: vi.fn(),
      } as any,
      callbackRes as any,
      vi.fn()
    );

    expect(callbackRes.redirect).toHaveBeenCalledWith("/login?error=OIDC%20failed");
  });

  it("returns user IDs from session or OAuth claims", async () => {
    const { getUserId } = await loadAuthModule();

    expect(getUserId({ session: { userId: "session-user" } } as any)).toBe("session-user");
    expect(getUserId({ user: { claims: { sub: "oauth-user" } } } as any)).toBe("oauth-user");
    expect(getUserId({} as any)).toBeUndefined();
  });

  it("throws from getRequiredUserId when no authenticated user exists", async () => {
    const { getRequiredUserId } = await loadAuthModule();
    expect(() => getRequiredUserId({} as any)).toThrow("User not authenticated");
  });

  it("allows requests when permission exists in role assignment JSON", async () => {
    storageMock.getUserRoleAssignments.mockResolvedValue([
      { role: { permissions: JSON.stringify({ manage_users: true }) } },
    ]);

    const { requirePermission } = await loadAuthModule();
    const middleware = requirePermission("manage_users");
    const next = vi.fn();

    await middleware({ session: { userId: "user-1" } } as any, {} as any, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("denies requests with invalid permission JSON", async () => {
    storageMock.getUserRoleAssignments.mockResolvedValue([
      { role: { permissions: "{bad json}" } },
    ]);

    const { requirePermission } = await loadAuthModule();
    const middleware = requirePermission("view_audit_logs");
    const next = vi.fn();

    await middleware({ session: { userId: "user-1" } } as any, {} as any, next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("PERMISSION_DENIED");
  });

  it("maps requireAdmin and requireAuditor to their permission checks", async () => {
    storageMock.getUserRoleAssignments.mockResolvedValue([
      { role: { permissions: { manage_users: true, view_audit_logs: true } } },
    ]);

    const { requireAdmin, requireAuditor } = await loadAuthModule();
    const req = { session: { userId: "admin-user" } } as any;

    const adminNext = vi.fn();
    await requireAdmin()(req, {} as any, adminNext);
    expect(adminNext).toHaveBeenCalledWith();

    const auditorNext = vi.fn();
    await requireAuditor()(req, {} as any, auditorNext);
    expect(auditorNext).toHaveBeenCalledWith();
  });

  it("returns AppError when permission check throws", async () => {
    storageMock.getUserRoleAssignments.mockRejectedValue(new Error("db offline"));

    const { requirePermission } = await loadAuthModule();
    const middleware = requirePermission("manage_users");
    const next = vi.fn();

    await middleware({ session: { userId: "user-1" } } as any, {} as any, next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe("Permission check failed");
  });

  it("auto-provisions development admin session", async () => {
    process.env.NODE_ENV = "development";
    storageMock.getUser.mockResolvedValue(null);
    storageMock.getUserOrganizations.mockResolvedValue([]);
    storageMock.createOrganization.mockResolvedValue({ id: "org-dev-created" });

    const { isAuthenticated } = await loadAuthModule();

    const req: any = {
      session: {},
      user: undefined,
      isAuthenticated: vi.fn(() => false),
    };
    const next = vi.fn();

    await isAuthenticated(req, {} as any, next);

    expect(storageMock.upsertUser).toHaveBeenCalled();
    expect(storageMock.updateUser).toHaveBeenCalledWith("dev-admin-001", {
      role: "admin",
    });
    expect(storageMock.addUserToOrganization).toHaveBeenCalled();
    expect(req.session.userId).toBe("dev-admin-001");
    expect(req.session.organizationId).toBe("org-dev-created");
    expect(next).toHaveBeenCalledWith();
  });

  it("accepts enterprise session auth and local-mode bypass", async () => {
    const { isAuthenticated } = await loadAuthModule();

    const sessionReq: any = {
      session: { userId: "enterprise-user" },
      user: undefined,
      isAuthenticated: vi.fn(() => false),
    };
    const sessionNext = vi.fn();
    await isAuthenticated(sessionReq, {} as any, sessionNext);
    expect(sessionNext).toHaveBeenCalledWith();

    isLocalModeMock.mockReturnValue(true);
    const localReq: any = {
      session: {},
      user: undefined,
      isAuthenticated: vi.fn(() => false),
    };
    const localNext = vi.fn();
    await isAuthenticated(localReq, {} as any, localNext);
    expect(localNext).toHaveBeenCalledWith();
  });

  it("refreshes expired OAuth sessions and fails without refresh token", async () => {
    process.env.NODE_ENV = "production";

    const { isAuthenticated } = await loadAuthModule();

    const expiredWithoutRefreshReq: any = {
      session: {},
      user: { expires_at: Math.floor(Date.now() / 1000) - 100 },
      isAuthenticated: vi.fn(() => true),
    };
    const noRefreshNext = vi.fn();
    await isAuthenticated(expiredWithoutRefreshReq, {} as any, noRefreshNext);
    expect(noRefreshNext.mock.calls[0][0].statusCode).toBe(401);
    expect(noRefreshNext.mock.calls[0][0].message).toBe(
      "Session expired, please login again"
    );

    const expiredReq: any = {
      session: {},
      user: {
        expires_at: Math.floor(Date.now() / 1000) - 100,
        refresh_token: "refresh-token",
      },
      isAuthenticated: vi.fn(() => true),
    };
    const refreshedNext = vi.fn();
    await isAuthenticated(expiredReq, {} as any, refreshedNext);
    expect(refreshTokenGrantMock).toHaveBeenCalled();
    expect(expiredReq.user.access_token).toBe("new-access-token");
    expect(refreshedNext).toHaveBeenCalledWith();
  });

  it("returns unauthorized when token refresh fails", async () => {
    process.env.NODE_ENV = "production";
    refreshTokenGrantMock.mockRejectedValueOnce(new Error("refresh failed"));

    const { isAuthenticated } = await loadAuthModule();
    const req: any = {
      session: {},
      user: {
        expires_at: Math.floor(Date.now() / 1000) - 100,
        refresh_token: "refresh-token",
      },
      isAuthenticated: vi.fn(() => true),
    };
    const next = vi.fn();

    await isAuthenticated(req, {} as any, next);

    expect(next.mock.calls[0][0].statusCode).toBe(401);
    expect(next.mock.calls[0][0].message).toBe("Failed to refresh session");
  });
});

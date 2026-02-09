import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { isLocalMode } from "./config/runtime";
import { logger } from "./utils/logger";
import { 
  UnauthorizedError, 
  ForbiddenError, 
  AppError 
} from "./utils/errorHandling";

interface ReplitUser {
  id?: string;
  claims?: {
    sub: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
    exp?: number;
  };
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

import createMemoryStore from "memorystore";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const isProduction = process.env.NODE_ENV === 'production';
  const isLocalMode = process.env.DEPLOYMENT_MODE === 'local';

  if (isLocalMode) {
    const MemoryStore = createMemoryStore(session);
    return session({
      secret: process.env.SESSION_SECRET || 'local-secret',
      store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // Localhost/file doesn't need secure cookies
        sameSite: 'lax',
        maxAge: sessionTtl,
      },
    });
  }

  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: ReplitUser,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims() as ReplitUser['claims'];
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: ReplitUser['claims']) {
  if (!claims?.sub) return;
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"] || '',
    firstName: claims["first_name"] || null,
    lastName: claims["last_name"] || null,
    profileImageUrl: claims["profile_image_url"] || null,
  });
}

// Track registered strategies to avoid duplicates
const registeredStrategies = new Set<string>();

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  // Note: Session middleware is now initialized in server/index.ts BEFORE CSRF protection
  // This ensures CSRF has access to session for token storage
  // app.use(getSession()); - Moved to server/index.ts
  app.use(passport.initialize());
  app.use(passport.session());

  // Skip OIDC configuration in test environment or when REPL_ID is not set
  if (process.env.NODE_ENV === 'test' || !process.env.REPL_ID) {
    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));
    app.get("/api/login", (req, res) => res.json({ message: "Login endpoint (auth disabled)" }));
    app.get("/api/callback", (req, res) => res.redirect("/"));
    app.get("/api/logout", (req, res) => res.json({ message: "Logout endpoint (auth disabled)" }));
    return;
  }

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user: ReplitUser = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims() as ReplitUser['claims']);
    verified(null, user as any);
  };

  // Helper to get or create a strategy for a specific domain
  function getOrCreateStrategy(domain: string): string {
    const strategyName = `replitauth:${domain}`;
    
    if (!registeredStrategies.has(strategyName)) {
      logger.info(`[Auth] Registering new strategy for domain: ${domain}`);
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
    
    return strategyName;
  }

  // Pre-register strategies for known domains from REPLIT_DOMAINS
  if (process.env.REPLIT_DOMAINS) {
    for (const rawDomain of process.env.REPLIT_DOMAINS.split(",")) {
      const domain = rawDomain.trim().toLowerCase();
      if (domain) {
        getOrCreateStrategy(domain);
      }
    }
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Login route - dynamically creates strategy for the current hostname
  app.get("/api/login", (req, res, next) => {
    const hostname = req.hostname.toLowerCase();
    logger.info(`[Auth Login] Request from hostname: ${hostname}`);

    // Dynamically register strategy for this hostname if not already registered
    const strategyName = getOrCreateStrategy(hostname);
    logger.info(`[Auth Login] Using strategy: ${strategyName}`);
    
    passport.authenticate(strategyName, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  // Callback route - uses the same hostname-based strategy
  app.get("/api/callback", (req, res, next) => {
    const hostname = req.hostname.toLowerCase();
    const strategyName = `replitauth:${hostname}`;

    logger.info(`[Auth Callback] Hostname: ${hostname}`);
    logger.info(`[Auth Callback] Strategy: ${strategyName}`);
    logger.info(`[Auth Callback] Query params:`, { query: req.query });

    // Check if strategy exists
    if (!registeredStrategies.has(strategyName)) {
      logger.error(`[Auth Callback] Strategy not found for hostname: ${hostname}`);
      logger.info(`[Auth Callback] Registered strategies:`, { strategies: Array.from(registeredStrategies) });
      
      // Try to register it now (the login might have been initiated from this domain)
      getOrCreateStrategy(hostname);
    }
    
    passport.authenticate(strategyName, (err: Error | null, user: ReplitUser | false, info: any) => {
      if (err) {
        logger.error(`[Auth Callback] Authentication error:`, { error: err });
        return res.redirect(`/login?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
      }

      if (!user) {
        logger.error(`[Auth Callback] No user returned. Info:`, { info });
        return res.redirect('/login?error=Authentication%20failed');
      }

      req.logIn(user as any, (loginErr) => {
        if (loginErr) {
          logger.error(`[Auth Callback] Login error:`, { error: loginErr });
          return res.redirect(`/login?error=${encodeURIComponent(loginErr.message || 'Login failed')}`);
        }

        logger.info(`[Auth Callback] Successfully authenticated user`);
        return res.redirect('/dashboard');
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    const hostname = req.hostname.toLowerCase();
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `https://${hostname}`,
        }).href
      );
    });
  });

  logger.info(`[Auth Setup] Registered ${registeredStrategies.size} initial strategies`);
}

// Helper function to get user ID from either OAuth or session-based auth
export function getUserId(req: Request): string | undefined {
  // Check for temporary/enterprise session first
  const session = (req as any).session;
  if (session?.userId) {
    return session.userId;
  }
  // Check for OAuth user
  const user = req.user as ReplitUser | undefined;
  if (user?.claims?.sub) {
    return user.claims.sub;
  }
  return undefined;
}

// Helper that throws if user is not authenticated - use after isAuthenticated middleware
export function getRequiredUserId(req: Request): string {
  const userId = getUserId(req);
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }
  return userId;
}

// Role-based access control middleware
// Checks if user has the required permission in any of their organizations
export function requirePermission(permission: string): RequestHandler {
  return async (req, res, next) => {
    const userId = getUserId(req);
    if (!userId) {
      return next(new UnauthorizedError("Authentication required"));
    }

    try {
      // Check user's role assignments for this permission
      const userRoles = await storage.getUserRoleAssignments(userId);
      
      const hasPermission = userRoles.some(assignment => {
        if (!assignment.role) return false;
        
        // Safely parse permissions - handle both object and string JSON
        let permissions: Record<string, boolean> = {};
        try {
          if (typeof assignment.role.permissions === 'string') {
            permissions = JSON.parse(assignment.role.permissions);
          } else if (assignment.role.permissions && typeof assignment.role.permissions === 'object') {
            permissions = assignment.role.permissions as Record<string, boolean>;
          }
        } catch {
          return false; // Invalid permissions JSON, skip this role
        }
        
        const permissionMap = new Map<string, boolean>(Object.entries(permissions));
        return permissionMap.get(permission) === true;
      });

      if (!hasPermission) {
        logger.warn('Permission denied', { userId, permission });
        return next(new ForbiddenError("Insufficient permissions", "PERMISSION_DENIED"));
      }

      return next();
    } catch (error) {
      logger.error('Permission check failed', { 
        message: error instanceof Error ? error.message : 'Unknown error',
        userId, 
        permission 
      });
      return next(new AppError("Permission check failed", 500));
    }
  };
}

// Check if user has admin role
export function requireAdmin(): RequestHandler {
  return requirePermission('manage_users');
}

// Check if user has auditor role (read-only access)
export function requireAuditor(): RequestHandler {
  return requirePermission('view_audit_logs');
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    // MVP Development Mode: Auto-authenticate as admin user
    // This bypasses login for faster development iteration
    // SECURITY: This is ONLY enabled in development mode, NOT in test or production
    if (process.env.NODE_ENV === 'development') {
      const session = req.session as any;
      
      // If no session userId, set up dev admin user
      if (!session?.userId) {
        const devAdminId = 'dev-admin-001';
        
        // Ensure the dev admin user and organization exist
        try {
          const adminUser = await storage.getUser(devAdminId);
          if (!adminUser) {
            await storage.upsertUser({
              id: devAdminId,
              email: 'admin@cyberdocgen.dev',
              firstName: 'Admin',
              lastName: 'User',
              profileImageUrl: null,
            });
            // Update role to admin
            await storage.updateUser(devAdminId, { role: 'admin' });
          }
          
          // Ensure dev organization exists and admin is a member
          const userOrgs = await storage.getUserOrganizations(devAdminId);
          let activeOrgId: string;
          
          if (userOrgs.length === 0) {
            // Create the dev organization
            const devOrg = await storage.createOrganization({
              name: 'Development Organization',
              slug: 'dev-org',
            });
            activeOrgId = devOrg.id;
            
            // Add user to organization as owner
            await storage.addUserToOrganization({
              userId: devAdminId,
              organizationId: activeOrgId,
              role: 'owner',
            });
          } else {
            // Use the first organization the user belongs to
            activeOrgId = userOrgs[0].organizationId;
          }
          
          // Set up the session with organization context
          session.userId = devAdminId;
          session.organizationId = activeOrgId;
          session.isTemporary = false;
        } catch (error) {
          logger.warn('Dev admin setup failed, continuing with session check', { error });
        }
      }
      
      // With dev session set, continue
      if (session?.userId) {
        return next();
      }
    }

    // Check for Enterprise auth session first (email/password login)
    const session = req.session as any;
    if (session?.userId) {
      return next();
    }

    // Check for Replit OAuth
    const user = req.user as any;

    // Check if isAuthenticated method exists and is a function
    const isAuthenticatedMethod = typeof req.isAuthenticated === 'function'
      ? req.isAuthenticated()
      : false;

    // For local mode, we bypass the expires_at check since the user is synthetic
    // and doesn't have an OIDC token expiry.
    if (isLocalMode()) {
      return next();
    }

    if (!isAuthenticatedMethod || !user?.expires_at) {
      return next(new UnauthorizedError("Authentication required"));
    }

    const now = Math.floor(Date.now() / 1000);
    if (now <= user.expires_at) {
      return next();
    }

    const refreshToken = user.refresh_token;
    if (!refreshToken) {
      return next(new UnauthorizedError("Session expired, please login again"));
    }

    try {
      const config = await getOidcConfig();
      const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
      updateUserSession(user, tokenResponse);
      return next();
    } catch (error) {
      return next(new UnauthorizedError("Failed to refresh session"));
    }
  } catch (error) {
    // If any error occurs in authentication check, return 401
    logger.error('Authentication middleware error', { error });
    return next(new UnauthorizedError("Authentication check failed"));
  }
};

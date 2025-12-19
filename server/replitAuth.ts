import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { logger } from "./utils/logger";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  const isProduction = process.env.NODE_ENV === 'production';
  
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
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
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
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
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
    
    passport.authenticate(strategyName, (err: any, user: any, info: any) => {
      if (err) {
        logger.error(`[Auth Callback] Authentication error:`, { error: err });
        return res.redirect(`/login?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
      }

      if (!user) {
        logger.error(`[Auth Callback] No user returned. Info:`, { info });
        return res.redirect('/login?error=Authentication%20failed');
      }

      req.logIn(user, (loginErr) => {
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
export function getUserId(req: any): string | undefined {
  // Check for temporary/enterprise session first
  const session = req.session as any;
  if (session?.userId) {
    return session.userId;
  }
  // Check for OAuth user
  if (req.user?.claims?.sub) {
    return req.user.claims.sub;
  }
  return undefined;
}

// Helper that throws if user is not authenticated - use after isAuthenticated middleware
export function getRequiredUserId(req: any): string {
  const userId = getUserId(req);
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Check for Enterprise auth session first (email/password login)
  const session = req.session as any;
  if (session?.userId) {
    return next();
  }

  // Check for Replit OAuth
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Skip Replit auth validation in test environment
if (!process.env.REPLIT_DOMAINS && process.env.NODE_ENV !== 'test') {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
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

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  // In development, secure cookies won't work without HTTPS
  const isProduction = process.env.NODE_ENV === 'production';
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction, // Only require secure in production
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

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Skip OIDC configuration in test environment
  if (process.env.NODE_ENV === 'test') {
    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));

    // Mock login/callback/logout routes for tests
    app.get("/api/login", (req, res) => res.json({ message: "Login endpoint (test mode)" }));
    app.get("/api/callback", (req, res) => res.redirect("/"));
    app.get("/api/logout", (req, res) => res.json({ message: "Logout endpoint (test mode)" }));
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

  // Parse all configured domains and store them for lookup
  const configuredDomains: string[] = [];
  for (const rawDomain of process.env.REPLIT_DOMAINS!.split(",")) {
    const domain = rawDomain.trim().toLowerCase();
    if (!domain) continue;
    configuredDomains.push(domain);
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  // Helper to find the best matching strategy for a hostname
  function findStrategyForHost(hostname: string): string | null {
    const normalizedHost = hostname.toLowerCase();
    
    // Exact match first
    if (configuredDomains.includes(normalizedHost)) {
      return `replitauth:${normalizedHost}`;
    }
    
    // Try to match by suffix (e.g., replit.app, replit.dev, repl.co)
    for (const domain of configuredDomains) {
      // Check if both are from the same Replit infrastructure
      const hostParts = normalizedHost.split('.');
      const domainParts = domain.split('.');
      
      // Match replit.app, replit.dev, repl.co domains
      if (hostParts.length >= 2 && domainParts.length >= 2) {
        const hostSuffix = hostParts.slice(-2).join('.');
        const domainSuffix = domainParts.slice(-2).join('.');
        
        // If both are Replit domains, use the first configured domain
        const replitSuffixes = ['replit.app', 'replit.dev', 'repl.co'];
        if (replitSuffixes.some(s => hostSuffix.includes(s.split('.')[0])) &&
            replitSuffixes.some(s => domainSuffix.includes(s.split('.')[0]))) {
          return `replitauth:${domain}`;
        }
      }
    }
    
    // Fallback to first configured domain if available
    if (configuredDomains.length > 0) {
      console.log(`[Auth] Using fallback domain: ${configuredDomains[0]} for hostname: ${hostname}`);
      return `replitauth:${configuredDomains[0]}`;
    }
    
    return null;
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const strategyName = findStrategyForHost(req.hostname);
    if (!strategyName) {
      console.error(`[Auth Login] No strategy found for hostname: ${req.hostname}`);
      return res.redirect('/login?error=Authentication%20not%20configured');
    }
    
    console.log(`[Auth Login] Using strategy: ${strategyName} for hostname: ${req.hostname}`);
    passport.authenticate(strategyName, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const strategyName = findStrategyForHost(req.hostname);
    console.log(`[Auth Callback] Processing callback for hostname: ${req.hostname}`);
    console.log(`[Auth Callback] Using strategy: ${strategyName}`);
    console.log(`[Auth Callback] Query params:`, req.query);
    
    if (!strategyName) {
      console.error(`[Auth Callback] No strategy found for hostname: ${req.hostname}`);
      return res.redirect('/login?error=Authentication%20not%20configured');
    }
    
    passport.authenticate(strategyName, (err: any, user: any, info: any) => {
      if (err) {
        console.error(`[Auth Callback] Authentication error:`, err);
        return res.redirect(`/login?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
      }
      
      if (!user) {
        console.error(`[Auth Callback] No user returned. Info:`, info);
        return res.redirect('/login?error=Authentication%20failed');
      }
      
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error(`[Auth Callback] Login error:`, loginErr);
          return res.redirect(`/login?error=${encodeURIComponent(loginErr.message || 'Login failed')}`);
        }
        
        console.log(`[Auth Callback] Successfully authenticated user`);
        return res.redirect('/dashboard');
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Check for Enterprise auth session first (email/password login)
  const session = req.session as any;
  if (session?.userId) {
    // Enterprise auth session exists
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
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Get the primary domain for OAuth (first in REPLIT_DOMAINS list)
function getPrimaryDomain(): string {
  const domains = process.env.REPLIT_DOMAINS;
  if (!domains && process.env.NODE_ENV !== 'test') {
    throw new Error("Environment variable REPLIT_DOMAINS not provided");
  }
  if (!domains) return 'localhost';
  
  const primaryDomain = domains.split(",")[0]?.trim().toLowerCase();
  if (!primaryDomain) {
    throw new Error("REPLIT_DOMAINS is empty");
  }
  return primaryDomain;
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
  const primaryDomain = getPrimaryDomain();
  const strategyName = "replitauth";
  
  console.log(`[Auth Setup] Primary domain: ${primaryDomain}`);
  console.log(`[Auth Setup] Callback URL: https://${primaryDomain}/api/callback`);

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Use a single strategy with the primary domain
  const strategy = new Strategy(
    {
      name: strategyName,
      config,
      scope: "openid email profile offline_access",
      callbackURL: `https://${primaryDomain}/api/callback`,
    },
    verify,
  );
  passport.use(strategy);

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    console.log(`[Auth Login] Initiating login from hostname: ${req.hostname}`);
    console.log(`[Auth Login] Will callback to: https://${primaryDomain}/api/callback`);
    
    passport.authenticate(strategyName, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    console.log(`[Auth Callback] Processing callback`);
    console.log(`[Auth Callback] Hostname: ${req.hostname}`);
    console.log(`[Auth Callback] Query params:`, req.query);
    
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
          post_logout_redirect_uri: `https://${primaryDomain}`,
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

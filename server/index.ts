import express from "express";
import crypto from "crypto";
import fs from "fs";
import type { Server } from "http";
import { onRequest } from "firebase-functions/v2/https";
import { registerRoutes } from "./routes";
import { validateEnvironment } from "./utils/validation";
import { logger } from "./utils/logger";
import { healthCheckHandler, readinessCheckHandler, livenessCheckHandler } from "./utils/health";
import { getRuntimeConfig, isLocalMode, logRuntimeConfig } from "./config/runtime";
import { getProviders } from "./providers";

const app = express();

type LocalApiKeyEnvironmentVariable =
  | "OPENAI_API_KEY"
  | "ANTHROPIC_API_KEY"
  | "GOOGLE_GENERATIVE_AI_KEY"
  | "GEMINI_API_KEY";

function setKnownLocalApiKeyEnvironmentValue(envKey: LocalApiKeyEnvironmentVariable, value: string): void {
  switch (envKey) {
    case "OPENAI_API_KEY":
      process.env.OPENAI_API_KEY = value;
      return;
    case "ANTHROPIC_API_KEY":
      process.env.ANTHROPIC_API_KEY = value;
      return;
    case "GOOGLE_GENERATIVE_AI_KEY":
      process.env.GOOGLE_GENERATIVE_AI_KEY = value;
      return;
    case "GEMINI_API_KEY":
      process.env.GEMINI_API_KEY = value;
      return;
    default:
      return;
  }
}

// Start a local HTTP server for development and desktop local-mode runtime.
const shouldRunLocalServer =
  process.env.NODE_ENV !== "production" ||
  process.env.LOCAL_SERVER === "true" ||
  process.env.DEPLOYMENT_MODE?.toLowerCase() === "local";

let localHttpServer: Server | null = null;

async function hydrateLocalAIKeysFromSecrets(providers: Awaited<ReturnType<typeof getProviders>>): Promise<void> {
  if (!isLocalMode()) {
    return;
  }

  try {
    const { LLM_API_KEYS } = await import("./providers/secrets/windowsCredMan");
    const mappings: Array<{ secretName: string; envKeys: LocalApiKeyEnvironmentVariable[] }> = [
      { secretName: LLM_API_KEYS.OPENAI, envKeys: ["OPENAI_API_KEY"] },
      { secretName: LLM_API_KEYS.ANTHROPIC, envKeys: ["ANTHROPIC_API_KEY"] },
      { secretName: LLM_API_KEYS.GOOGLE_AI, envKeys: ["GOOGLE_GENERATIVE_AI_KEY", "GEMINI_API_KEY"] },
    ];

    for (const mapping of mappings) {
      const value = await providers.secrets.get(mapping.secretName);
      if (!value) {
        continue;
      }
      for (const envKey of mapping.envKeys) {
        setKnownLocalApiKeyEnvironmentValue(envKey, value);
      }
    }

    const [{ resetAIClients }, { resetGeminiClient }, { resetAgentModelClients }] = await Promise.all([
      import("./services/aiClients"),
      import("./services/gemini"),
      import("./mcp/agentClient"),
    ]);
    resetAIClients();
    resetGeminiClient();
    resetAgentModelClients();

    logger.info("Hydrated local AI API keys from secrets provider");
  } catch (error) {
    logger.warn("Failed to hydrate local AI API keys from secrets provider", { error });
  }
}

// This promise ensures that all async initialization is complete before handling requests.
const initializationPromise = (async () => {
  try {
    const { initTelemetry } = await import("./monitoring/telemetry.js");
    initTelemetry();
    logger.debug('[Server] Telemetry initialized');
  } catch (error) {
    console.warn('[Server] Telemetry initialization failed (non-critical):', error);
  }

  try {
    const { initializeGoogleCloudOperations } = await import("./monitoring/googleCloud.js");
    initializeGoogleCloudOperations();
    logger.debug('[Server] Google Cloud Operations initialized');
  } catch (error) {
    console.warn('[Server] Google Cloud Operations initialization failed (non-critical):', error);
  }

  logger.debug('[Server] Validating environment variables...');
  try {
    validateEnvironment();
    logger.debug('[Server] Environment validation passed');
  } catch (error) {
    logger.error('[Server] FATAL: Environment validation failed:', error);
    throw error; // Throw to prevent the function from becoming operational.
  }

  logRuntimeConfig();

  // Trust proxy for rate limiting, essential for cloud environments.
  app.set('trust proxy', true);

  app.get('/health', healthCheckHandler);
  app.get('/ready', readinessCheckHandler);
  app.get('/live', livenessCheckHandler);

  app.use((req: any, res: any, next: any) => {
    req.requestId = crypto.randomUUID();
    next();
  });

  try {
    logger.info('Initializing providers...');
    const providers = await getProviders();
    const runtimeConfig = getRuntimeConfig();
    if (
      runtimeConfig.mode === 'local'
      && (
        !runtimeConfig.database.migrationsPath
        || !fs.existsSync(runtimeConfig.database.migrationsPath)
      )
    ) {
      throw new Error(
        `SQLite migrations path is not available: ${runtimeConfig.database.migrationsPath || 'undefined'}`
      );
    }
    await hydrateLocalAIKeysFromSecrets(providers);
    await providers.db.connect();
    logger.info('Database connection established');
    await providers.db.migrate();
    logger.info('Database migrations complete');
    if (providers.auth.initialize) {
      await providers.auth.initialize();
      logger.info('Auth provider initialized');
    }
    logger.info('All providers initialized successfully');
  } catch (error) {
    logger.error('[Server] FATAL ERROR during provider initialization:', error);
    throw error; // Throw to prevent the function from becoming operational.
  }

  try {
    const { initializeMCP } = await import('./mcp/initialize.js');
    initializeMCP();
    logger.info('MCP system initialized');
  } catch (error) {
    logger.error('Failed to initialize MCP system', { error });
  }

  const httpServer = await registerRoutes(app);
  if (shouldRunLocalServer) {
    localHttpServer = httpServer;

    if (process.env.NODE_ENV === "production") {
      const { serveStatic } = await import("./static");
      serveStatic(app);
      logger.info("Static client middleware enabled");
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(app, httpServer);
      logger.info("Vite middleware enabled");
    }
  }
  logger.info('API routes registered successfully');

})();

if (shouldRunLocalServer) {
  const config = getRuntimeConfig();
  const PORT = config.server.port;
  const HOST = config.server.host;
  
  initializationPromise.then(() => {
    if (!localHttpServer) {
      throw new Error("Local HTTP server was not initialized");
    }

    localHttpServer.listen(PORT, HOST, () => {
      logger.info(`🚀 Local development server running at http://${HOST}:${PORT}`);
      logger.info(`Health check: http://${HOST}:${PORT}/health`);
    });
  }).catch((error) => {
    logger.error('Failed to start local server:', error);
    process.exit(1);
  });
}

// Export the express app as a single HTTPS Cloud Function.
// Firebase will handle the server lifecycle.
export const api = onRequest(async (req, res) => {
  try {
    // Wait for all async initialization to complete on the first request (cold start).
    await initializationPromise;
    // Handle the request with the fully configured express app.
    app(req, res);
  } catch (error) {
    logger.error("Critical error during function execution:", error);
    res.status(500).send("Internal Server Error");
  }
});

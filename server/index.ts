import express from "express";
import crypto from "crypto";
import { onRequest } from "firebase-functions/v2/https";
import { registerRoutes } from "./routes";
import { validateEnvironment } from "./utils/validation";
import { logger } from "./utils/logger";
import { healthCheckHandler, readinessCheckHandler, livenessCheckHandler } from "./utils/health";
import { getRuntimeConfig, logRuntimeConfig } from "./config/runtime";
import { getProviders } from "./providers";

const app = express();

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

  await registerRoutes(app);
  logger.info('API routes registered successfully');

})();

// Local development server
if (process.env.NODE_ENV !== 'production' || process.env.LOCAL_SERVER === 'true') {
  const config = getRuntimeConfig();
  const PORT = config.server.port;
  const HOST = config.server.host;
  
  initializationPromise.then(() => {
    app.listen(PORT, HOST, () => {
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

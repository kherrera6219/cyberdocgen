import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { logger } from "./utils/logger";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Connection pool configuration with timeouts and error handling
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection cannot be established
};

export const pool = new Pool(poolConfig);

// Connection pool error handling
pool.on("error", (err) => {
  logger.error("Unexpected database pool error", { error: err.message, stack: err.stack });
});

pool.on("connect", () => {
  logger.debug("New database connection established");
});

pool.on("remove", () => {
  logger.debug("Database connection removed from pool");
});

// Configure query timeout (30 seconds default)
neonConfig.fetchConnectionCache = true;

export const db = drizzle({ client: pool, schema });

/**
 * Test database connection health
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    logger.info("Database connection test successful");
    return true;
  } catch (error) {
    logger.error("Database connection test failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}

/**
 * Get database connection pool metrics
 */
export function getPoolMetrics() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

/**
 * Execute query with retry logic
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (attempt < maxRetries) {
        logger.warn(`Database operation failed, retrying (${attempt}/${maxRetries})`, {
          error: lastError.message,
          attempt,
        });
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  logger.error("Database operation failed after all retries", {
    error: lastError?.message,
    maxRetries,
  });
  throw lastError;
}

/**
 * Gracefully close database connections
 */
export async function closeDatabaseConnections(): Promise<void> {
  try {
    await pool.end();
    logger.info("Database connections closed gracefully");
  } catch (error) {
    logger.error("Error closing database connections", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

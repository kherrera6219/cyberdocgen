import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import ws from "ws";
import path from "path";
import fs from "fs";
import { logger } from "./utils/logger";

neonConfig.webSocketConstructor = ws;

// In local mode, we use SQLite via providers instead of PostgreSQL
// This file is only used in cloud mode
const isLocalMode = process.env.DEPLOYMENT_MODE === 'local';

// DATABASE_URL validation moved to providers - they check at runtime after env is set
// Early check removed because DEPLOYMENT_MODE isn't set when this module loads
// if (!isLocalMode && !process.env.DATABASE_URL) {
//   throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
// }


// Only initialize PostgreSQL pool in cloud mode
let pool: Pool | null = null;
let db: any = null;

if (isLocalMode) {
  try {
    const dataPath = process.env.LOCAL_DATA_PATH || './local-data';
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
    }
    const dbPath = path.join(dataPath, 'cyberdocgen.db');
    logger.info(`Initializing SQLite Drizzle at ${dbPath}`);
    const sqlite = new Database(dbPath);
    db = drizzleSqlite(sqlite, { schema });
  } catch (error) {
    logger.error("Failed to initialize SQLite", { error });
  }
} else {
  // Connection pool configuration with timeouts and error handling
  const poolConfig = {
    connectionString: process.env.DATABASE_URL!,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection cannot be established
  };

  pool = new Pool(poolConfig);

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

  db = drizzleNeon({ client: pool, schema });
}

/**
 * Safe database instance accessor
 */
export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Ensure connect() is called first.");
  }
  return db;
}

export { pool, db };

/**
 * Test database connection health
 */
export async function testDatabaseConnection(): Promise<boolean> {
  if (!pool) {
    // In local mode, providers handle database connection testing
    return true;
  }

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
  if (!pool) {
    return { totalCount: 0, idleCount: 0, waitingCount: 0 };
  }

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
  if (!pool) {
    // In local mode, providers handle database connection closing
    return;
  }

  try {
    await pool.end();
    logger.info("Database connections closed gracefully");
  } catch (error) {
    logger.error("Error closing database connections", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

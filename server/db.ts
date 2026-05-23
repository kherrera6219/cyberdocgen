import * as schema from "@shared/schema";
import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite/vector";
import path from "path";
import fs from "fs";
import os from "os";
import { logger } from "./utils/logger";
import { getRuntimeConfig } from "./config/runtime";
import { createIntegrityEnvelope, verifyIntegrityEnvelope, type IntegrityEnvelope } from "./utils/dataIntegrity";

// Typed as non-null — db is guaranteed to be initialized before requests are served.
// Use getDb() for lazy-safe access during startup.
type DbInstance = ReturnType<typeof drizzle<typeof schema>>;
let _db: DbInstance | null = null;
let pgInstance: PGlite | null = null;
let pgDataDir: string | null = null;

// Proxy that satisfies `typeof db` for repository type signatures.
// At runtime, repositories are called after init so _db is guaranteed non-null.
export const db: DbInstance = new Proxy({} as DbInstance, {
  get(_target, prop) {
    if (!_db) throw new Error('[PGlite] Database accessed before initialization.');
    return (_db as any)[prop];
  }
});

interface LocalBackupIntegritySidecar {
  version: 1;
  backupPath: string;
  sourcePath?: string;
  dirSize: number;
  generatedAt: string;
  envelope: IntegrityEnvelope;
}

function isIntegrityEnvelope(value: unknown): value is IntegrityEnvelope {
  if (!value || typeof value !== "object") {
    return false;
  }

  const envelope = value as Partial<IntegrityEnvelope>;
  return (
    typeof envelope.algorithm === "string" &&
    typeof envelope.hash === "string" &&
    typeof envelope.hmac === "string" &&
    typeof envelope.generatedAt === "string"
  );
}

function getLocalDataDir(): string {
  const runtimeConfig = getRuntimeConfig();
  if (runtimeConfig.mode === 'local' && runtimeConfig.database.dataDir) {
    return path.resolve(runtimeConfig.database.dataDir);
  }

  const configured = process.env.LOCAL_DATA_PATH?.trim();
  if (configured) {
    return path.resolve(configured, 'pgdata');
  }

  const localAppData = process.env.LOCALAPPDATA?.trim();
  if (localAppData) {
    return path.resolve(localAppData, 'CyberDocGen', 'pgdata');
  }

  return path.resolve(os.homedir(), '.cyberdocgen', 'pgdata');
}

async function initializePgliteConnection(): Promise<void> {
  const dataDir = getLocalDataDir();

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  logger.info(`Initializing PGlite at ${dataDir}`);

  const pg = new PGlite({
    dataDir,
    extensions: { vector },
  });

  await pg.waitReady;
  await pg.exec("CREATE EXTENSION IF NOT EXISTS vector;");

  pgInstance = pg;
  pgDataDir = dataDir;
  _db = drizzle({ client: pg, schema });

  logger.info("[PGlite] Database ready with pgvector support");
}

// Initialize on module load
try {
  // initializePgliteConnection is async, so we schedule it  
  initializePgliteConnection().catch((error) => {
    logger.error("Failed to initialize PGlite", { error });
  });
} catch (error) {
  logger.error("Failed to initialize PGlite synchronously", { error });
}

/**
 * Safe database instance accessor. Waits for initialization if needed.
 */
export async function getDbAsync(): Promise<DbInstance> {
  if (!_db) {
    await initializePgliteConnection();
  }
  return _db!;
}

export function getDb(): DbInstance {
  if (!_db) {
    throw new Error("Database not initialized yet. Use getDbAsync() instead.");
  }
  return _db;
}

export const pool = null;

/**
 * Test database connection health
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    if (!pgInstance) return false;
    await pgInstance.exec('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

/**
 * Get database connection pool metrics
 */
export function getPoolMetrics() {
  return {
    totalCount: 1,
    idleCount: 0,
    waitingCount: 0,
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
  if (pgInstance) {
    await pgInstance.close();
    pgInstance = null;
    _db = null;
    logger.info("PGlite connection closed gracefully");
  }
}

export function getLocalDatabasePath(): string {
  return pgDataDir || getLocalDataDir();
}

export async function backupLocalDatabase(destinationPath: string): Promise<string> {
  const resolvedDestination = path.resolve(destinationPath);
  const destinationDir = path.dirname(resolvedDestination);
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }

  const sourceDir = pgDataDir || getLocalDataDir();
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`PGlite data directory not found at ${sourceDir}`);
  }

  fs.cpSync(sourceDir, resolvedDestination, { recursive: true });
  logger.info("PGlite backup completed", { destinationPath: resolvedDestination });
  return resolvedDestination;
}

export async function restoreLocalDatabase(sourcePath: string): Promise<void> {
  const resolvedSourcePath = path.resolve(sourcePath);
  if (!fs.existsSync(resolvedSourcePath)) {
    throw new Error(`Backup directory does not exist: ${resolvedSourcePath}`);
  }

  const targetDir = pgDataDir || getLocalDataDir();

  if (pgInstance) {
    await pgInstance.close();
    pgInstance = null;
    _db = null;
  }

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.cpSync(resolvedSourcePath, targetDir, { recursive: true });
  await initializePgliteConnection();
  logger.info("PGlite restore completed", { sourcePath: resolvedSourcePath, targetDir });
}

export async function runLocalDatabaseMaintenance(): Promise<void> {
  if (!pgInstance) {
    await initializePgliteConnection();
  }
  await pgInstance!.exec("VACUUM ANALYZE;");
  logger.info("PGlite maintenance (VACUUM ANALYZE) completed");
}

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
export let pgInstance: PGlite | null = null;
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

let initPromise: Promise<void> | null = null;

/**
 * Known PGlite WASM crash/corruption signatures.
 * These indicate the on-disk data directory is unrecoverable and must be reset.
 */
function isCorruptionError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('Aborted()') ||
    msg.includes('WASM') ||
    msg.includes('abort') ||
    msg.includes('RuntimeError') ||
    msg.includes('memory access out of bounds') ||
    msg.includes('unreachable') ||
    msg.includes('invalid table size')
  );
}

/**
 * Rename the corrupted pgdata directory to a timestamped backup and return
 * the fresh (now non-existent) data directory path so PGlite can reinitialize.
 */
function quarantineCorruptDataDir(dataDir: string): void {
  try {
    const ts = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, 19);
    const quarantinePath = `${dataDir}.corrupt-${ts}`;
    fs.renameSync(dataDir, quarantinePath);
    logger.warn(
      `[PGlite] Corrupt data directory quarantined to: ${quarantinePath}. ` +
      'A fresh database will be created. All previously entered data has been reset.'
    );
  } catch (renameError) {
    // If rename fails (e.g. cross-device), force-remove it
    logger.error('[PGlite] Could not quarantine corrupt data directory; force-removing.', { error: renameError });
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

async function initializePgliteConnection(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const dataDir = getLocalDataDir();

    // Attempt 1: Normal initialization
    // Attempt 2: After quarantining a corrupt data directory
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      logger.info(`Initializing PGlite at ${dataDir}${attempt > 1 ? ' (fresh after corruption recovery)' : ''}`);

      try {
        const pg = new PGlite({
          dataDir,
          extensions: { vector },
        });

        await pg.waitReady;
        await pg.exec("CREATE EXTENSION IF NOT EXISTS vector;");

        pgInstance = pg;
        pgDataDir = dataDir;
        _db = drizzle({ client: pg, schema });

        if (attempt > 1) {
          logger.info("[PGlite] Successfully recovered from database corruption. Fresh database initialized.");
        } else {
          logger.info("[PGlite] Database ready with pgvector support");
        }
        return; // Success
      } catch (error) {
        if (attempt === 1 && isCorruptionError(error)) {
          logger.error("[PGlite] WASM abort detected — database corruption confirmed. Attempting self-recovery...", { error });
          // Reset state so we retry cleanly
          initPromise = null;
          pgInstance = null;
          _db = null;
          quarantineCorruptDataDir(dataDir);
          // Continue to attempt 2
        } else {
          // Non-corruption error or second attempt failed — rethrow
          throw error;
        }
      }
    }
  })();

  return initPromise;
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

import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import BetterSqlite3, { type Database as BetterSqliteDatabase } from "better-sqlite3";
import ws from "ws";
import path from "path";
import fs from "fs";
import { logger } from "./utils/logger";
import { getRuntimeConfig, isLocalMode as runtimeIsLocalMode } from "./config/runtime";
import { createIntegrityEnvelope, verifyIntegrityEnvelope, type IntegrityEnvelope } from "./utils/dataIntegrity";
import { registerSqliteCompatibilityFunctions } from "./utils/sqliteCompatibility";

neonConfig.webSocketConstructor = ws;

const isLocalMode = runtimeIsLocalMode();

let pool: Pool | null = null;
let db: any = null;
let localSqlite: BetterSqliteDatabase | null = null;
let localDbPath: string | null = null;
let localDatabaseOperationQueue: Promise<void> = Promise.resolve();

interface LocalBackupIntegritySidecar {
  version: 1;
  backupPath: string;
  sourcePath?: string;
  fileSize: number;
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

function getLocalDataPath(): string {
  const runtimeConfig = getRuntimeConfig();
  if (runtimeConfig.mode === 'local' && runtimeConfig.database.filePath) {
    return path.resolve(path.dirname(runtimeConfig.database.filePath));
  }

  const configured = process.env.LOCAL_DATA_PATH?.trim();
  if (configured) {
    return path.resolve(configured);
  }

  const localAppData = process.env.LOCALAPPDATA?.trim();
  if (localAppData) {
    return path.resolve(localAppData, 'CyberDocGen');
  }

  return path.resolve(process.cwd(), 'local-data');
}

function resolveLocalTemplateDbPath(): string | null {
  const runtimeConfig = getRuntimeConfig();
  const configuredDbPath =
    runtimeConfig.mode === 'local' && runtimeConfig.database.filePath
      ? path.resolve(runtimeConfig.database.filePath)
      : null;
  const candidates = [
    process.env.LOCAL_TEMPLATE_DB_PATH,
    configuredDbPath,
    path.resolve('local-data', 'cyberdocgen.db'),
    path.resolve(process.cwd(), 'local-data', 'cyberdocgen.db'),
  ].filter((candidate): candidate is string => Boolean(candidate));

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function ensureLocalSqliteDatabaseExists(dbPath: string): void {
  if (fs.existsSync(dbPath)) {
    return;
  }

  const templatePath = resolveLocalTemplateDbPath();
  if (!templatePath) {
    return;
  }

  fs.copyFileSync(templatePath, dbPath);
  logger.info(`Seeded local SQLite database from template: ${templatePath}`);
}

function getBackupIntegritySidecarPath(backupPath: string): string {
  return `${backupPath}.integrity.json`;
}

function shouldRequireSignedBackups(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.ALLOW_UNSIGNED_BACKUP_RESTORE !== 'true';
}

function writeBackupIntegritySidecar(backupPath: string, sourcePath?: string): void {
  const content = fs.readFileSync(backupPath);
  const sidecar: LocalBackupIntegritySidecar = {
    version: 1,
    backupPath,
    sourcePath,
    fileSize: content.length,
    generatedAt: new Date().toISOString(),
    envelope: createIntegrityEnvelope(content),
  };
  fs.writeFileSync(getBackupIntegritySidecarPath(backupPath), JSON.stringify(sidecar, null, 2), "utf8");
}

function verifyBackupIntegrityIfPresent(backupPath: string): void {
  const sidecarPath = getBackupIntegritySidecarPath(backupPath);
  if (!fs.existsSync(sidecarPath)) {
    if (shouldRequireSignedBackups()) {
      throw new Error(`Backup integrity sidecar missing: ${sidecarPath}`);
    }

    logger.warn("Backup integrity sidecar missing; skipping signature verification", { backupPath, sidecarPath });
    return;
  }

  const sidecarRaw = fs.readFileSync(sidecarPath, "utf8");
  const sidecar = JSON.parse(sidecarRaw) as Partial<LocalBackupIntegritySidecar>;
  if (!isIntegrityEnvelope(sidecar.envelope)) {
    throw new Error(`Backup integrity sidecar is invalid: ${sidecarPath}`);
  }

  const content = fs.readFileSync(backupPath);
  const verification = verifyIntegrityEnvelope(content, sidecar.envelope);

  if (!verification.valid) {
    throw new Error(
      `Backup integrity verification failed (hashValid=${verification.hashValid}, hmacValid=${verification.hmacValid})`
    );
  }
}

function configureLocalSqliteConnection(sqlite: BetterSqliteDatabase): void {
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('foreign_keys = ON');
  registerSqliteCompatibilityFunctions(sqlite);
}

function initializeLocalSqliteConnection(): void {
  const dataPath = getLocalDataPath();
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }
  const dbPath = path.join(dataPath, 'cyberdocgen.db');
  ensureLocalSqliteDatabaseExists(dbPath);
  logger.info(`Initializing SQLite Drizzle at ${dbPath}`);
  const sqlite = new BetterSqlite3(dbPath);
  configureLocalSqliteConnection(sqlite);
  localSqlite = sqlite;
  localDbPath = dbPath;
  db = drizzleSqlite(sqlite, { schema });
}

async function queueLocalDatabaseOperation<T>(operation: () => Promise<T>): Promise<T> {
  const run = localDatabaseOperationQueue.then(operation, operation);
  localDatabaseOperationQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

if (isLocalMode) {
  try {
    initializeLocalSqliteConnection();
  } catch (error) {
    logger.error("Failed to initialize SQLite", { error });
  }
} else {
  // In cloud mode, require DATABASE_URL
  if (!process.env.DATABASE_URL) {
    logger.warn("DATABASE_URL is not set. Database initialization may fail.");
  } else {
    // Connection pool configuration with timeouts and error handling
    const poolConfig = {
      connectionString: process.env.DATABASE_URL,
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
    db = drizzleNeon({ client: pool, schema });
  }
}

/**
 * Safe database instance accessor
 */
export function getDb() {
  if (!db) {
    // Attempt lazy initialization if null
    logger.warn("Database not initialized. Attempting lazy initialization...");
    if (isLocalMode) {
      try {
        initializeLocalSqliteConnection();
        return db;
      } catch (error) {
        throw new Error("Failed to lazily initialize SQLite: " + error);
      }
    }
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
    // In local mode, if db is initialized, we assume it's working (file-based)
    return !!db;
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
    if (localSqlite && localSqlite.open) {
      localSqlite.close();
      localSqlite = null;
      db = null;
      logger.info("SQLite connection closed gracefully");
    }
    return;
  }

  try {
    await pool.end();
    pool = null;
    logger.info("Database connections closed gracefully");
  } catch (error) {
    logger.error("Error closing database connections", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export function getLocalDatabasePath(): string {
  if (!isLocalMode) {
    throw new Error('Local database path is only available in local mode');
  }
  if (localDbPath) {
    return localDbPath;
  }
  const dataPath = getLocalDataPath();
  return path.join(dataPath, 'cyberdocgen.db');
}

export async function backupLocalDatabase(destinationPath: string): Promise<string> {
  if (!isLocalMode) {
    throw new Error('Local database backup is only available in local mode');
  }

  return queueLocalDatabaseOperation(async () => {
    const resolvedDestination = path.resolve(destinationPath);
    const destinationDir = path.dirname(resolvedDestination);
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    if (localSqlite && localSqlite.open) {
      await localSqlite.backup(resolvedDestination);
    } else {
      const sourcePath = getLocalDatabasePath();
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Local database file not found at ${sourcePath}`);
      }
      fs.copyFileSync(sourcePath, resolvedDestination);
    }

    writeBackupIntegritySidecar(resolvedDestination, getLocalDatabasePath());

    logger.info('Local database backup completed', { destinationPath: resolvedDestination });
    return resolvedDestination;
  });
}

export async function restoreLocalDatabase(sourcePath: string): Promise<void> {
  if (!isLocalMode) {
    throw new Error('Local database restore is only available in local mode');
  }

  await queueLocalDatabaseOperation(async () => {
    const resolvedSourcePath = path.resolve(sourcePath);
    if (!fs.existsSync(resolvedSourcePath)) {
      throw new Error(`Backup file does not exist: ${resolvedSourcePath}`);
    }

    verifyBackupIntegrityIfPresent(resolvedSourcePath);

    const targetPath = getLocalDatabasePath();

    if (localSqlite && localSqlite.open) {
      localSqlite.close();
      localSqlite = null;
    }
    db = null;

    const dbDir = path.dirname(targetPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    fs.copyFileSync(resolvedSourcePath, targetPath);

    const walPath = `${targetPath}-wal`;
    const shmPath = `${targetPath}-shm`;
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

    initializeLocalSqliteConnection();
    logger.info('Local database restore completed', { sourcePath: resolvedSourcePath, targetPath });
  });
}

export async function runLocalDatabaseMaintenance(): Promise<void> {
  if (!isLocalMode) {
    throw new Error('Local database maintenance is only available in local mode');
  }

  await queueLocalDatabaseOperation(async () => {
    if (!localSqlite || !localSqlite.open) {
      initializeLocalSqliteConnection();
    }

    localSqlite!.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    localSqlite!.exec('VACUUM;');
    localSqlite!.exec('ANALYZE;');
    logger.info('Local database maintenance completed');
  });
}

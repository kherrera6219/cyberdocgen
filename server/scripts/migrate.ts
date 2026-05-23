/**
 * PGlite Migration Script
 *
 * Runs Drizzle migrations against the local embedded PGlite database.
 * Replaces the old postgres-js migrator.
 */

import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite/vector";
import path from "path";
import os from "os";
import fs from "fs";
import { logger } from "../utils/logger";

async function runMigration() {
  const localAppData = process.env.LOCALAPPDATA?.trim();
  const pgDataDir = localAppData
    ? path.resolve(localAppData, 'CyberDocGen', 'pgdata')
    : path.resolve(os.homedir(), '.cyberdocgen', 'pgdata');

  if (!fs.existsSync(pgDataDir)) {
    fs.mkdirSync(pgDataDir, { recursive: true });
  }

  logger.info(`Running PGlite migrations at ${pgDataDir}...`);

  const pg = new PGlite({
    dataDir: pgDataDir,
    extensions: { vector },
  });

  await pg.waitReady;
  await pg.exec("CREATE EXTENSION IF NOT EXISTS vector;");

  const db = drizzle({ client: pg });

  await migrate(db, { migrationsFolder: "./server/migrations/pglite" });

  logger.info("Migrations completed!");
  await pg.close();
}

runMigration().catch((err) => {
  logger.error("Migration failed!", err);
  process.exit(1);
});

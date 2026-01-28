
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(migrationClient);

  logger.debug("Running migrations...");
  
  await migrate(db, { migrationsFolder: "./drizzle" });

  logger.debug("Migrations completed!");
  await migrationClient.end();
}

runMigration().catch((err) => {
  logger.error("Migration failed!", err);
  process.exit(1);
});

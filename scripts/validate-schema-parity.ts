import fs from "fs";
import path from "path";

interface SchemaParityReport {
  sqliteTables: string[];
  postgresTables: string[];
  missingInPostgres: string[];
  missingInSqlite: string[];
}

function readSqlFiles(directoryPath: string): string[] {
  if (!fs.existsSync(directoryPath)) {
    return [];
  }

  return fs
    .readdirSync(directoryPath)
    .filter((file) => file.toLowerCase().endsWith(".sql"))
    .sort()
    .map((file) => fs.readFileSync(path.join(directoryPath, file), "utf8"));
}

function normalizeTableName(rawName: string): string {
  return rawName
    .replace(/["'`]/g, "")
    .trim()
    .toLowerCase();
}

function isWhitespace(char: string): boolean {
  return char === " " || char === "\n" || char === "\r" || char === "\t" || char === "\f";
}

function skipWhitespace(source: string, start: number): number {
  let cursor = start;
  while (cursor < source.length && isWhitespace(source.charAt(cursor))) {
    cursor += 1;
  }
  return cursor;
}

function isIdentifierChar(char: string): boolean {
  if ((char >= "a" && char <= "z") || (char >= "A" && char <= "Z") || (char >= "0" && char <= "9")) {
    return true;
  }

  return char === "_" || char === '"' || char === "'" || char === "`" || char === "." || char === "-";
}

function extractCreateTableNames(sqlStatements: string[]): string[] {
  const names = new Set<string>();

  for (const sql of sqlStatements) {
    const lowerSql = sql.toLowerCase();
    let cursor = 0;
    while (cursor < lowerSql.length) {
      const createPos = lowerSql.indexOf("create", cursor);
      if (createPos === -1) {
        break;
      }

      let tokenCursor = skipWhitespace(lowerSql, createPos + "create".length);
      if (!lowerSql.startsWith("table", tokenCursor)) {
        cursor = createPos + "create".length;
        continue;
      }

      tokenCursor = skipWhitespace(lowerSql, tokenCursor + "table".length);
      if (lowerSql.startsWith("if", tokenCursor)) {
        let optionalCursor = skipWhitespace(lowerSql, tokenCursor + "if".length);
        if (lowerSql.startsWith("not", optionalCursor)) {
          optionalCursor = skipWhitespace(lowerSql, optionalCursor + "not".length);
          if (lowerSql.startsWith("exists", optionalCursor)) {
            tokenCursor = skipWhitespace(lowerSql, optionalCursor + "exists".length);
          }
        }
      }

      let endCursor = tokenCursor;
      while (endCursor < sql.length && isIdentifierChar(sql.charAt(endCursor))) {
        endCursor += 1;
      }

      if (endCursor > tokenCursor) {
        names.add(normalizeTableName(sql.slice(tokenCursor, endCursor)));
      }

      cursor = endCursor > createPos ? endCursor : createPos + "create".length;
    }
  }

  return Array.from(names).sort();
}

function buildParityReport(sqliteMigrationDir: string, postgresMigrationDir: string): SchemaParityReport {
  const sqliteSql = readSqlFiles(sqliteMigrationDir);
  const postgresSql = readSqlFiles(postgresMigrationDir);
  const sqliteTables = extractCreateTableNames(sqliteSql);
  const postgresTables = extractCreateTableNames(postgresSql);

  const sqliteSet = new Set(sqliteTables);
  const postgresSet = new Set(postgresTables);

  const missingInPostgres = sqliteTables.filter((table) => !postgresSet.has(table));
  const missingInSqlite = postgresTables.filter((table) => !sqliteSet.has(table));

  return {
    sqliteTables,
    postgresTables,
    missingInPostgres,
    missingInSqlite,
  };
}

function printReport(report: SchemaParityReport): void {
  const summary = {
    sqliteTableCount: report.sqliteTables.length,
    postgresTableCount: report.postgresTables.length,
    missingInPostgres: report.missingInPostgres.length,
    missingInSqlite: report.missingInSqlite.length,
  };

  console.log(JSON.stringify({ summary, report }, null, 2));
}

function shouldFail(report: SchemaParityReport): boolean {
  const strictMode = process.env.SCHEMA_PARITY_STRICT === "true";
  if (!strictMode) {
    return false;
  }
  return report.missingInPostgres.length > 0 || report.missingInSqlite.length > 0;
}

function main(): void {
  const sqliteMigrationDir = path.resolve("server/migrations/sqlite");
  const postgresMigrationDir = path.resolve("server/migrations/postgres");

  const report = buildParityReport(sqliteMigrationDir, postgresMigrationDir);
  printReport(report);

  if (shouldFail(report)) {
    process.exitCode = 1;
  }
}

main();

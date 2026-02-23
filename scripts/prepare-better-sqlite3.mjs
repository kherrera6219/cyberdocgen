#!/usr/bin/env node
/* global process, console */

import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json");

function normalizeSemver(versionRange) {
  if (typeof versionRange !== "string" || versionRange.trim().length === 0) {
    return "";
  }
  return versionRange.replace(/^[~^]/, "").trim();
}

const electronVersion = normalizeSemver(
  process.env.ELECTRON_VERSION || packageJson.devDependencies?.electron,
);

if (!electronVersion) {
  console.error("[native] Could not resolve Electron version from package.json");
  process.exit(1);
}

const targetArch = process.env.BUILD_ARCH || "x64";
const targetPlatform = process.env.BUILD_PLATFORM || "win32";
const moduleDir = path.resolve(process.cwd(), "node_modules", "better-sqlite3");
const binaryPath = path.join(moduleDir, "build", "Release", "better_sqlite3.node");

if (!fs.existsSync(moduleDir)) {
  console.error(`[native] Missing module directory: ${moduleDir}`);
  process.exit(1);
}

const prebuildInstallBin = (() => {
  try {
    return require.resolve("prebuild-install/bin.js", { paths: [moduleDir, process.cwd()] });
  } catch (error) {
    console.error("[native] Could not resolve prebuild-install/bin.js", error);
    process.exit(1);
  }
})();

console.log(
  `[native] Installing better-sqlite3 prebuild for Electron ${electronVersion} (${targetPlatform}-${targetArch})`,
);

const installResult = spawnSync(
  process.execPath,
  [
    prebuildInstallBin,
    "-r",
    "electron",
    "-t",
    electronVersion,
    "-a",
    targetArch,
    `--platform=${targetPlatform}`,
    "--verbose",
  ],
  {
    cwd: moduleDir,
    stdio: "inherit",
    env: process.env,
  },
);

if (installResult.status !== 0) {
  console.error("[native] Failed to install better-sqlite3 prebuild");
  process.exit(installResult.status ?? 1);
}

if (!fs.existsSync(binaryPath)) {
  console.error(`[native] Expected binary not found: ${binaryPath}`);
  process.exit(1);
}

const stats = fs.statSync(binaryPath);
console.log(`[native] better-sqlite3 binary ready: ${binaryPath} (${stats.size} bytes)`);

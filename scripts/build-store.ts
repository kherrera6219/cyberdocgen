import { spawnSync } from "child_process";

function readRequiredEnv(value: string | undefined, name: string): string {
  if (!value || value.trim().length === 0) {
    console.error(`Missing required Store environment variable: ${name}`);
    process.exit(1);
  }
  return value.trim();
}

function parseFlag(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

const identityName = readRequiredEnv(
  process.env.WINDOWS_STORE_IDENTITY_NAME,
  "WINDOWS_STORE_IDENTITY_NAME",
);
const publisher = readRequiredEnv(
  process.env.WINDOWS_STORE_PUBLISHER,
  "WINDOWS_STORE_PUBLISHER",
);
const publisherDisplayName = readRequiredEnv(
  process.env.WINDOWS_STORE_PUBLISHER_DISPLAY_NAME,
  "WINDOWS_STORE_PUBLISHER_DISPLAY_NAME",
);

const releaseBuild = process.argv.includes("--release") || parseFlag(process.env.RELEASE_BUILD);
const forceCodeSigning =
  process.argv.includes("--force-code-signing") || parseFlag(process.env.RELEASE_FORCE_CODESIGN);

const args = [
  "build",
  "--win",
  "appx",
  `-c.appx.identityName=${identityName}`,
  `-c.appx.publisher=${publisher}`,
  `-c.appx.publisherDisplayName=${publisherDisplayName}`,
];

if (releaseBuild || forceCodeSigning) {
  args.push("-c.win.forceCodeSigning=true");
}

const result = spawnSync("electron-builder", args, {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(result.error ? 1 : 0);

import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.hoisted(() => vi.fn());
const dbState = vi.hoisted(() => ({
  rows: [] as any[],
  error: null as Error | null,
}));

vi.mock("../../server/db", () => ({
  db: {
    select: selectMock,
  },
}));

vi.mock("../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { AppError } from "../../server/utils/errorHandling";
import { CodeSignalDetectorService } from "../../server/services/codeSignalDetectorService";

async function writeFixture(baseDir: string, relativePath: string, content: string | Buffer) {
  const fullPath = path.join(baseDir, relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content);
}

describe("CodeSignalDetectorService", () => {
  let service: CodeSignalDetectorService;
  let tempDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    service = new CodeSignalDetectorService();
    dbState.rows = [];
    dbState.error = null;
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codesignal-"));

    selectMock.mockImplementation(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => {
          if (dbState.error) {
            return Promise.reject(dbState.error);
          }
          return Promise.resolve(dbState.rows);
        }),
      })),
    }));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("detects auth patterns across repository files", async () => {
    dbState.rows = [
      {
        relativePath: "src/auth.ts",
        fileName: "auth.ts",
        fileType: ".ts",
        category: "code",
      },
    ];
    await writeFixture(
      tempDir,
      "src/auth.ts",
      [
        "const token = jwt.sign(payload, secret)",
        "const flow = 'oauth2'",
        "req.session.userId = user.id",
        "const code = totp.generate(secret)",
      ].join("\n"),
    );

    const signals = await service.scanForAuthPatterns("snapshot-1", tempDir);
    const types = new Set(signals.map(signal => signal.type));

    expect(types.has("jwt")).toBe(true);
    expect(types.has("oauth")).toBe(true);
    expect(types.has("session")).toBe(true);
    expect(types.has("mfa")).toBe(true);
    expect(signals.every(signal => signal.files[0]?.path === "src/auth.ts")).toBe(true);
  });

  it("detects encryption patterns", async () => {
    dbState.rows = [
      {
        relativePath: "src/security.ts",
        fileName: "security.ts",
        fileType: ".ts",
        category: "code",
      },
    ];
    await writeFixture(
      tempDir,
      "src/security.ts",
      [
        "const encrypted = encrypt(payload)",
        "const endpoint = 'https://secure.example.com'",
        "const hash = createHash('sha256').update('x').digest('hex')",
      ].join("\n"),
    );

    const signals = await service.scanForEncryption("snapshot-1", tempDir);
    const types = new Set(signals.map(signal => signal.type));

    expect(types).toEqual(new Set(["at_rest", "in_transit", "hashing"]));
  });

  it("detects logging and access control patterns", async () => {
    dbState.rows = [
      {
        relativePath: "src/app.ts",
        fileName: "app.ts",
        fileType: ".ts",
        category: "code",
      },
    ];
    await writeFixture(
      tempDir,
      "src/app.ts",
      [
        "const logger = winston.createLogger({})",
        "auditTrail.record(event)",
        "if (userRole === 'admin') { return true; }",
        "app.use(requireAuth)",
      ].join("\n"),
    );

    const loggingSignals = await service.scanForLogging("snapshot-1", tempDir);
    const accessSignals = await service.scanForAccessControl("snapshot-1", tempDir);

    expect(new Set(loggingSignals.map(signal => signal.type))).toEqual(new Set(["structured", "audit"]));
    expect(new Set(accessSignals.map(signal => signal.type))).toEqual(new Set(["rbac", "middleware"]));
  });

  it("detects GitHub Actions and GitLab CI with scanning flags", async () => {
    dbState.rows = [
      {
        relativePath: ".github/workflows/ci.yml",
        fileName: "ci.yml",
        fileType: ".yml",
        category: "config",
      },
      {
        relativePath: ".gitlab-ci.yml",
        fileName: ".gitlab-ci.yml",
        fileType: ".yml",
        category: "config",
      },
    ];

    await writeFixture(
      tempDir,
      ".github/workflows/ci.yml",
      [
        "name: CI",
        "uses: github/codeql-action/init@v2",
        "run: gitleaks detect",
        "run: npm audit",
      ].join("\n"),
    );
    await writeFixture(tempDir, ".gitlab-ci.yml", "stages:\n  - test");

    const signals = await service.scanForCICD("snapshot-1", tempDir);
    const ghSignal = signals.find(signal => signal.type === "github_actions");
    const glSignal = signals.find(signal => signal.type === "gitlab_ci");

    expect(ghSignal).toBeDefined();
    expect(ghSignal?.hasSecurityScanning).toBe(true);
    expect(ghSignal?.hasSecretScanning).toBe(true);
    expect(ghSignal?.hasDependencyScanning).toBe(true);
    expect(glSignal).toBeDefined();
  });

  it("detects hardcoded secrets, redacts evidence, and skips test/template files", async () => {
    dbState.rows = [
      {
        relativePath: "src/config.ts",
        fileName: "config.ts",
        fileType: ".ts",
        category: "code",
      },
      {
        relativePath: "src/example-config.ts",
        fileName: "example-config.ts",
        fileType: ".ts",
        category: "code",
      },
      {
        relativePath: "tests/secret.test.ts",
        fileName: "secret.test.ts",
        fileType: ".ts",
        category: "test",
      },
    ];

    await writeFixture(tempDir, "src/config.ts", "api_key = \"ABCDEF1234567890ABCDEF1234567890\"");
    await writeFixture(tempDir, "src/example-config.ts", "api_key = \"SHOULD_NOT_MATCH_EXAMPLE_FILE_123456\"");
    await writeFixture(tempDir, "tests/secret.test.ts", "password = \"Password12345\"");

    const warnings = await service.scanForSecrets("snapshot-1", tempDir);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.type).toBe("api_key");
    expect(warnings[0]?.files[0]?.evidence).toBe("[REDACTED]");
  });

  it("skips large files during scanning", async () => {
    dbState.rows = [
      {
        relativePath: "src/large.ts",
        fileName: "large.ts",
        fileType: ".ts",
        category: "code",
      },
    ];

    const oversized = Buffer.from(`jwt.sign(payload, secret)\n${"x".repeat(1024 * 1024)}`);
    await writeFixture(tempDir, "src/large.ts", oversized);

    const signals = await service.scanForAuthPatterns("snapshot-1", tempDir);
    expect(signals).toEqual([]);
  });

  it("wraps auth scan failures in AppError", async () => {
    dbState.error = new Error("db unavailable");

    await expect(service.scanForAuthPatterns("snapshot-1", tempDir)).rejects.toBeInstanceOf(AppError);
    await expect(service.scanForAuthPatterns("snapshot-1", tempDir)).rejects.toMatchObject({
      code: "AUTH_SCAN_ERROR",
      statusCode: 500,
    });
  });

  it("returns an empty secrets result when scanning fails", async () => {
    dbState.error = new Error("db unavailable");

    const warnings = await service.scanForSecrets("snapshot-1", tempDir);
    expect(warnings).toEqual([]);
  });
});

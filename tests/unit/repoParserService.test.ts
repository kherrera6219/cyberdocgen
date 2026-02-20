import path from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { repositoryFiles, repositorySnapshots } from "@shared/schema";
import { AppError, ValidationError } from "../../server/utils/errorHandling";

const mkdirMock = vi.hoisted(() => vi.fn());
const writeFileMock = vi.hoisted(() => vi.fn());
const chmodMock = vi.hoisted(() => vi.fn());
const readdirMock = vi.hoisted(() => vi.fn());
const statMock = vi.hoisted(() => vi.fn());
const readFileMock = vi.hoisted(() => vi.fn());

const zipState = vi.hoisted(() => ({
  throwOnConstruct: null as Error | null,
  entries: [] as any[],
}));
const admZipConstructorMock = vi.hoisted(() => vi.fn());

const insertMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());
const snapshotInsertValuesMock = vi.hoisted(() => vi.fn());
const snapshotInsertReturningMock = vi.hoisted(() => vi.fn());
const fileInsertValuesMock = vi.hoisted(() => vi.fn());
const updateSetMock = vi.hoisted(() => vi.fn());
const updateWhereMock = vi.hoisted(() => vi.fn());
const auditLogActionMock = vi.hoisted(() => vi.fn());

const dbState = vi.hoisted(() => ({
  snapshotRows: [] as any[],
  fileInsertError: null as Error | null,
}));

vi.mock("fs/promises", () => ({
  default: {
    mkdir: mkdirMock,
    writeFile: writeFileMock,
    chmod: chmodMock,
    readdir: readdirMock,
    stat: statMock,
    readFile: readFileMock,
  },
  mkdir: mkdirMock,
  writeFile: writeFileMock,
  chmod: chmodMock,
  readdir: readdirMock,
  stat: statMock,
  readFile: readFileMock,
}));

vi.mock("adm-zip", () => ({
  default: admZipConstructorMock,
}));

vi.mock("../../server/db", () => ({
  db: {
    insert: insertMock,
    update: updateMock,
  },
}));

vi.mock("../../server/services/auditService", () => ({
  auditService: {
    logAction: auditLogActionMock,
  },
}));

vi.mock("../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { RepoParserService } from "../../server/services/repoParserService";

function createZipEntry(
  entryName: string,
  opts: { isDirectory?: boolean; size?: number; data?: Buffer } = {},
) {
  return {
    entryName,
    isDirectory: !!opts.isDirectory,
    header: {
      size: opts.size ?? (opts.data?.length ?? 32),
    },
    getData: () => opts.data ?? Buffer.from(`content:${entryName}`),
  };
}

function direntDirectory(name: string) {
  return {
    name,
    isDirectory: () => true,
    isFile: () => false,
  };
}

function direntFile(name: string) {
  return {
    name,
    isDirectory: () => false,
    isFile: () => true,
  };
}

describe("RepoParserService", () => {
  let service: RepoParserService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RepoParserService();

    zipState.throwOnConstruct = null;
    zipState.entries = [];

    dbState.snapshotRows = [{ id: "snapshot-1" }];
    dbState.fileInsertError = null;

    mkdirMock.mockResolvedValue(undefined);
    writeFileMock.mockResolvedValue(undefined);
    chmodMock.mockResolvedValue(undefined);
    readdirMock.mockResolvedValue([]);
    statMock.mockResolvedValue({ size: 16 });
    readFileMock.mockResolvedValue(Buffer.from("file-body"));

    admZipConstructorMock.mockImplementation(() => {
      if (zipState.throwOnConstruct) {
        throw zipState.throwOnConstruct;
      }
      return {
        getEntries: () => zipState.entries,
      };
    });

    snapshotInsertReturningMock.mockImplementation(() => Promise.resolve(dbState.snapshotRows));
    snapshotInsertValuesMock.mockImplementation(() => ({
      returning: snapshotInsertReturningMock,
    }));

    fileInsertValuesMock.mockImplementation(() => {
      if (dbState.fileInsertError) {
        return Promise.reject(dbState.fileInsertError);
      }
      return Promise.resolve(undefined);
    });

    insertMock.mockImplementation((table: any) => {
      if (table === repositorySnapshots) {
        return {
          values: snapshotInsertValuesMock,
        };
      }
      if (table === repositoryFiles) {
        return {
          values: fileInsertValuesMock,
        };
      }
      return {
        values: fileInsertValuesMock,
      };
    });

    updateWhereMock.mockResolvedValue(undefined);
    updateSetMock.mockImplementation(() => ({
      where: updateWhereMock,
    }));
    updateMock.mockImplementation(() => ({
      set: updateSetMock,
    }));

    auditLogActionMock.mockResolvedValue(undefined);
  });

  it("rejects oversized uploads before any database writes", async () => {
    const oversized = {
      filePath: "C:/tmp/oversized.zip",
      fileSize: 500 * 1024 * 1024 + 1,
    } as any;

    await expect(
      service.uploadAndExtract(
        oversized,
        "repo.zip",
        "org-1",
        "profile-1",
        "user-1",
        "snapshot",
      ),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rejects non-zip uploads", async () => {
    await expect(
      service.uploadAndExtract(
        Buffer.from("archive"),
        "repo.tar.gz",
        "org-1",
        "profile-1",
        "user-1",
        "snapshot",
      ),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(insertMock).not.toHaveBeenCalled();
  });

  it("uploads and extracts safely while skipping blocked or suspicious entries", async () => {
    zipState.entries = [
      createZipEntry("src/", { isDirectory: true }),
      createZipEntry("../evil.ts"),
      createZipEntry("bin/malware.exe"),
      createZipEntry("notes.weird"),
      createZipEntry(`${"a".repeat(4100)}.ts`),
      createZipEntry("src/app.ts", { size: 128 }),
    ];

    const result = await service.uploadAndExtract(
      Buffer.alloc(1024, 1),
      "repo.zip",
      "org-1",
      "profile-1",
      "user-1",
      "snapshot",
    );

    expect(result.snapshotId).toBe("snapshot-1");
    expect(result.fileCount).toBe(1);
    expect(result.extractedPath).toContain(path.join("org-1", "snapshot-1"));
    expect(writeFileMock).toHaveBeenCalledTimes(1);
    expect(auditLogActionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "create",
        entityType: "repository_snapshot",
      }),
    );
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "indexed",
        fileCount: 1,
      }),
    );
  });

  it("rejects invalid zip payloads", async () => {
    zipState.throwOnConstruct = new Error("corrupt zip");

    await expect(
      service.uploadAndExtract(
        Buffer.from("not-a-zip"),
        "repo.zip",
        "org-1",
        "profile-1",
        "user-1",
        "snapshot",
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects zip files with too many entries", async () => {
    zipState.entries = Array.from({ length: 50001 }, (_, idx) => createZipEntry(`src/file-${idx}.ts`));

    await expect(
      (service as any).extractZipSecurely(Buffer.alloc(100, 1), "snapshot-1", "org-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects suspicious compression ratios and excessive uncompressed sizes", async () => {
    zipState.entries = [createZipEntry("src/app.ts", { size: 50_000 })];
    await expect(
      (service as any).extractZipSecurely(Buffer.alloc(100, 1), "snapshot-1", "org-1"),
    ).rejects.toBeInstanceOf(ValidationError);

    zipState.entries = [createZipEntry("src/big.ts", { size: 2 * 1024 * 1024 * 1024 + 1 })];
    await expect(
      (service as any).extractZipSecurely({ filePath: "C:/tmp/repo.zip", fileSize: 30_000_000 } as any, "snapshot-1", "org-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("generates manifests and updates snapshot hash", async () => {
    const basePath = path.join("C:", "repo");
    const srcPath = path.join(basePath, "src");
    const testsPath = path.join(basePath, "tests");
    const githubPath = path.join(basePath, ".github");
    const workflowsPath = path.join(githubPath, "workflows");

    readdirMock.mockImplementation((currentPath: string) => {
      const map: Record<string, any[]> = {
        [basePath]: [
          direntDirectory("src"),
          direntDirectory("tests"),
          direntDirectory(".github"),
          direntFile("package.json"),
          direntFile("README.md"),
          direntFile("Dockerfile"),
        ],
        [srcPath]: [direntFile("auth.middleware.ts"), direntFile("policy.txt")],
        [testsPath]: [direntFile("auth.test.ts")],
        [githubPath]: [direntDirectory("workflows")],
        [workflowsPath]: [direntFile("ci.yml")],
      };
      return Promise.resolve(map[currentPath] ?? []);
    });

    const fileSizes: Record<string, number> = {
      [path.join(basePath, "package.json")]: 200,
      [path.join(basePath, "README.md")]: 50,
      [path.join(basePath, "Dockerfile")]: 120,
      [path.join(srcPath, "auth.middleware.ts")]: 80,
      [path.join(srcPath, "policy.txt")]: 24,
      [path.join(testsPath, "auth.test.ts")]: 32,
      [path.join(workflowsPath, "ci.yml")]: 64,
    };
    statMock.mockImplementation((filePath: string) => Promise.resolve({ size: fileSizes[filePath] ?? 16 }));
    readFileMock.mockImplementation((filePath: string) => Promise.resolve(Buffer.from(`body:${filePath}`)));

    const manifest = await service.generateManifest("snapshot-1", basePath);

    expect(manifest.totalFiles).toBe(7);
    expect(manifest.totalSize).toBe(570);
    expect(manifest.manifestHash).toMatch(/^[a-f0-9]{64}$/);
    expect(manifest.files.find(file => file.relativePath.includes("auth.middleware.ts"))?.isSecurityRelevant).toBe(
      true,
    );
    const getCategory = (relativePath: string) =>
      manifest.files.find(file => file.relativePath.replace(/\\/g, "/") === relativePath)?.category;

    expect(getCategory("README.md")).toBe("docs");
    expect(getCategory("Dockerfile")).toBe("iac");
    expect(getCategory("tests/auth.test.ts")).toBe("test");
    expect(getCategory(".github/workflows/ci.yml")).toBe("ci_cd");
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        manifestHash: manifest.manifestHash,
      }),
    );
  });

  it("wraps manifest generation failures in AppError", async () => {
    readdirMock.mockRejectedValueOnce(new Error("cannot read"));

    await expect(service.generateManifest("snapshot-1", "C:/repo")).rejects.toMatchObject({
      code: "MANIFEST_GENERATION_ERROR",
      statusCode: 500,
    });
  });

  it("detects technologies and persists detection metadata", async () => {
    const detected = await service.detectTechnologies("snapshot-1", [
      {
        relativePath: "src/app.ts",
        fileName: "app.ts",
        fileType: ".ts",
        fileSize: 100,
        fileHash: "hash-1",
        language: "TypeScript",
        category: "source",
        isSecurityRelevant: false,
      },
      {
        relativePath: "package.json",
        fileName: "package.json",
        fileType: ".json",
        fileSize: 10,
        fileHash: "hash-2",
        language: "JSON",
        category: "config",
        isSecurityRelevant: false,
      },
      {
        relativePath: "requirements.txt",
        fileName: "requirements.txt",
        fileType: ".txt",
        fileSize: 10,
        fileHash: "hash-3",
        language: null,
        category: "other",
        isSecurityRelevant: false,
      },
      {
        relativePath: "pom.xml",
        fileName: "pom.xml",
        fileType: ".xml",
        fileSize: 10,
        fileHash: "hash-4",
        language: "XML",
        category: "config",
        isSecurityRelevant: false,
      },
      {
        relativePath: "go.mod",
        fileName: "go.mod",
        fileType: ".mod",
        fileSize: 10,
        fileHash: "hash-5",
        language: null,
        category: "other",
        isSecurityRelevant: false,
      },
      {
        relativePath: "Cargo.toml",
        fileName: "Cargo.toml",
        fileType: ".toml",
        fileSize: 10,
        fileHash: "hash-6",
        language: null,
        category: "config",
        isSecurityRelevant: false,
      },
      {
        relativePath: "infra/main.tf",
        fileName: "main.tf",
        fileType: ".tf",
        fileSize: 10,
        fileHash: "hash-7",
        language: "Terraform",
        category: "iac",
        isSecurityRelevant: true,
      },
      {
        relativePath: "Dockerfile",
        fileName: "Dockerfile",
        fileType: "none",
        fileSize: 10,
        fileHash: "hash-8",
        language: null,
        category: "iac",
        isSecurityRelevant: true,
      },
      {
        relativePath: "k8s/deploy.yml",
        fileName: "deploy.yml",
        fileType: ".yml",
        fileSize: 10,
        fileHash: "hash-9",
        language: "YAML",
        category: "iac",
        isSecurityRelevant: true,
      },
      {
        relativePath: ".github/workflows/ci.yml",
        fileName: "ci.yml",
        fileType: ".yml",
        fileSize: 10,
        fileHash: "hash-10",
        language: "YAML",
        category: "ci_cd",
        isSecurityRelevant: true,
      },
      {
        relativePath: ".gitlab-ci.yml",
        fileName: ".gitlab-ci.yml",
        fileType: ".yml",
        fileSize: 10,
        fileHash: "hash-11",
        language: "YAML",
        category: "ci_cd",
        isSecurityRelevant: true,
      },
    ] as any);

    expect(detected.languages).toContain("TypeScript");
    expect(detected.frameworks).toEqual(
      expect.arrayContaining(["Node.js", "Python", "Java/Maven/Gradle", "Go Modules", "Rust/Cargo"]),
    );
    expect(detected.infraTools).toEqual(
      expect.arrayContaining(["Terraform", "Docker", "Kubernetes", "GitHub Actions", "GitLab CI"]),
    );
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        detectedLanguages: expect.arrayContaining(["TypeScript"]),
      }),
    );
  });

  it("indexes files in 1000-record batches and wraps indexing failures", async () => {
    const files = Array.from({ length: 1001 }, (_, i) => ({
      relativePath: `src/file-${i}.ts`,
      fileName: `file-${i}.ts`,
      fileType: ".ts",
      fileSize: 10,
      fileHash: `hash-${i}`,
      language: "TypeScript",
      category: "source" as const,
      isSecurityRelevant: i % 2 === 0,
    }));

    await service.indexFiles("snapshot-1", files as any);
    expect(fileInsertValuesMock).toHaveBeenCalledTimes(2);
    expect(fileInsertValuesMock).toHaveBeenNthCalledWith(1, expect.any(Array));
    expect(fileInsertValuesMock).toHaveBeenNthCalledWith(2, expect.any(Array));

    dbState.fileInsertError = new Error("insert failed");
    await expect(service.indexFiles("snapshot-1", files.slice(0, 1) as any)).rejects.toMatchObject({
      code: "FILE_INDEXING_ERROR",
      statusCode: 500,
    });
  });

  it("covers private path and classification helpers", () => {
    const svc = service as any;

    expect(svc.sanitizeEntryPath("src/app.ts")).toBe("src/app.ts");
    expect(svc.sanitizeEntryPath("src\\app.ts")).toBe("src/app.ts");
    expect(svc.sanitizeEntryPath("../etc/passwd")).toBeNull();
    expect(svc.sanitizeEntryPath("/absolute/path.ts")).toBeNull();
    expect(svc.sanitizeEntryPath("")).toBeNull();

    expect(svc.detectLanguage("app.ts", ".ts")).toBe("TypeScript");
    expect(svc.detectLanguage("README", "")).toBeNull();

    expect(svc.categorizeFile(".github/workflows/ci.yml", "ci.yml")).toBe("ci_cd");
    expect(svc.categorizeFile("terraform/main.tf", "main.tf")).toBe("iac");
    expect(svc.categorizeFile("tests/auth.test.ts", "auth.test.ts")).toBe("test");
    expect(svc.categorizeFile("docs/guide.md", "guide.md")).toBe("docs");
    expect(svc.categorizeFile("package.json", "package.json")).toBe("config");
    expect(svc.categorizeFile("src/app.ts", "app.ts")).toBe("source");
    expect(svc.categorizeFile("assets/logo.svg", "logo.svg")).toBe("other");

    expect(svc.isSecurityRelevant("src/auth/service.ts", "service.ts", "source")).toBe(true);
    expect(svc.isSecurityRelevant("src/core/index.ts", "access-control.ts", "source")).toBe(true);
    expect(svc.isSecurityRelevant("infra/main.tf", "main.tf", "iac")).toBe(true);
    expect(svc.isSecurityRelevant("src/core/index.ts", "index.ts", "source")).toBe(false);
  });

  it("swallows errors while setting recursive read-only permissions", async () => {
    const nested = path.join("C:", "repo", "nested");
    readdirMock
      .mockResolvedValueOnce([direntDirectory("nested"), direntFile("file.ts")])
      .mockResolvedValueOnce([direntFile("inner.ts")]);
    chmodMock.mockRejectedValueOnce(new Error("permission denied"));

    await expect((service as any).makeDirectoryReadOnly(path.join("C:", "repo"))).resolves.toBeUndefined();

    expect(readdirMock).toHaveBeenCalledWith(path.join("C:", "repo"), { withFileTypes: true });
    expect(readdirMock).toHaveBeenCalledWith(nested, { withFileTypes: true });
  });

  it("rethrows AppError instances unchanged in indexing", async () => {
    dbState.fileInsertError = new AppError("already wrapped", 400, "ALREADY_WRAPPED");

    await expect(
      service.indexFiles("snapshot-1", [
        {
          relativePath: "a.ts",
          fileName: "a.ts",
          fileType: ".ts",
          fileSize: 1,
          fileHash: "h",
          language: "TypeScript",
          category: "source",
          isSecurityRelevant: false,
        },
      ] as any),
    ).rejects.toMatchObject({
      code: "FILE_INDEXING_ERROR",
      statusCode: 500,
    });
  });
});

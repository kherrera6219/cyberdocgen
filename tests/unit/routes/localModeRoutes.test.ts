import express from "express";
import os from "os";
import path from "path";
import request from "supertest";
import fs from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getRuntimeConfigMock = vi.hoisted(() => vi.fn());
const isLocalModeMock = vi.hoisted(() => vi.fn());
const getProvidersMock = vi.hoisted(() => vi.fn());

vi.mock("../../../server/config/runtime", () => ({
  getRuntimeConfig: getRuntimeConfigMock,
  isLocalMode: isLocalModeMock,
}));

vi.mock("../../../server/providers", () => ({
  getProviders: getProvidersMock,
}));

vi.mock("../../../server/providers/secrets/windowsCredMan", () => ({
  LLM_API_KEYS: {
    OPENAI: "llm:openai",
    ANTHROPIC: "llm:anthropic",
    GOOGLE_AI: "llm:google",
  },
}));

vi.mock("../../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import localModeRouter from "../../../server/routes/localMode";

type MockProviders = {
  db: {
    getStats: ReturnType<typeof vi.fn>;
    backup: ReturnType<typeof vi.fn>;
    restore: ReturnType<typeof vi.fn>;
    maintenance: ReturnType<typeof vi.fn>;
  };
  storage: {
    getStorageStats: ReturnType<typeof vi.fn>;
    cleanupEmptyDirectories: ReturnType<typeof vi.fn>;
  };
  secrets: {
    getConfiguredProviders: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/local", localModeRouter);
  return app;
}

function createProviders(): MockProviders {
  return {
    db: {
      getStats: vi.fn().mockResolvedValue({
        path: "C:/data/local.db",
        size: 1024,
        pageCount: 10,
        pageSize: 1024,
        walMode: true,
      }),
      backup: vi.fn().mockResolvedValue("ok"),
      restore: vi.fn().mockResolvedValue(undefined),
      maintenance: vi.fn().mockResolvedValue(undefined),
    },
    storage: {
      getStorageStats: vi.fn().mockResolvedValue({
        totalSize: 4096,
        fileCount: 7,
        path: "C:/data/storage",
      }),
      cleanupEmptyDirectories: vi.fn().mockResolvedValue(3),
    },
    secrets: {
      getConfiguredProviders: vi.fn().mockResolvedValue(["OPENAI"]),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  };
}

describe("localMode routes", () => {
  let app: ReturnType<typeof createApp>;
  let providers: MockProviders;

  beforeEach(() => {
    vi.clearAllMocks();

    app = createApp();
    providers = createProviders();
    getProvidersMock.mockResolvedValue(providers);

    isLocalModeMock.mockReturnValue(true);
    getRuntimeConfigMock.mockReturnValue({
      mode: "local",
      features: {
        organizationManagement: false,
        userManagement: false,
        multiTenant: false,
        sso: false,
        mfa: false,
      },
      database: {
        type: "sqlite",
        filePath: path.join(os.homedir(), "cyberdocgen", "local.db"),
      },
      storage: { type: "local" },
      auth: { enabled: false, provider: "bypass" },
      server: { host: "127.0.0.1", port: 5000 },
    });
  });

  it("returns runtime mode details", async () => {
    const response = await request(app).get("/api/local/runtime/mode").expect(200);
    expect(response.body.mode).toBe("local");
    expect(response.body.database.type).toBe("sqlite");
    expect(response.body.auth.provider).toBe("bypass");
  });

  it("blocks endpoints when not in local mode", async () => {
    isLocalModeMock.mockReturnValue(false);
    const response = await request(app).get("/api/local/runtime/mode").expect(403);
    expect(response.body.error).toMatch(/only available in local mode/i);
  });

  it("returns database info with formatted size", async () => {
    const response = await request(app).get("/api/local/db-info").expect(200);
    expect(response.body.path).toBe("C:/data/local.db");
    expect(response.body.formattedSize).toBe("1 KB");
    expect(providers.db.getStats).toHaveBeenCalledTimes(1);
  });

  it("returns storage info with formatted size", async () => {
    const response = await request(app).get("/api/local/storage-info").expect(200);
    expect(response.body.path).toBe("C:/data/storage");
    expect(response.body.formattedSize).toBe("4 KB");
    expect(providers.storage.getStorageStats).toHaveBeenCalledTimes(1);
  });

  it("validates backup request payload", async () => {
    const response = await request(app).post("/api/local/backup").send({}).expect(400);
    expect(response.body.error).toMatch(/destinationPath is required/i);
  });

  it("creates backup for an allowed path", async () => {
    const destinationPath = path.join(os.homedir(), "cyberdocgen-backup.db");
    const response = await request(app)
      .post("/api/local/backup")
      .send({ destinationPath })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.path).toContain("cyberdocgen-backup.db");
    expect(providers.db.backup).toHaveBeenCalledTimes(1);
  });

  it("rejects backup path outside allowed roots", async () => {
    const response = await request(app)
      .post("/api/local/backup")
      .send({ destinationPath: "C:/Windows/System32/blocked.db" })
      .expect(400);
    expect(response.body.error).toMatch(/within application data or your user profile/i);
  });

  it("validates restore path existence", async () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    const backupPath = path.join(os.homedir(), "missing.db");
    const response = await request(app).post("/api/local/restore").send({ backupPath }).expect(400);
    expect(response.body.error).toMatch(/backup file not found/i);
  });

  it("restores backup for valid path", async () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "statSync").mockReturnValue({ isFile: () => true } as fs.Stats);

    const backupPath = path.join(os.homedir(), "restore.db");
    const response = await request(app).post("/api/local/restore").send({ backupPath }).expect(200);

    expect(response.body.success).toBe(true);
    expect(providers.db.restore).toHaveBeenCalledTimes(1);
  });

  it("runs database maintenance", async () => {
    const response = await request(app).post("/api/local/maintenance").send({}).expect(200);
    expect(response.body.success).toBe(true);
    expect(providers.db.maintenance).toHaveBeenCalledTimes(1);
  });

  it("runs storage cleanup", async () => {
    const response = await request(app).post("/api/local/cleanup").send({}).expect(200);
    expect(response.body.removedDirectories).toBe(3);
    expect(providers.storage.cleanupEmptyDirectories).toHaveBeenCalledTimes(1);
  });

  it("returns configured API key providers", async () => {
    providers.secrets.getConfiguredProviders.mockResolvedValue(["OPENAI"]);
    const response = await request(app).get("/api/local/api-keys/configured").expect(200);
    expect(response.body.configured).toEqual(["OPENAI"]);
  });

  it("returns 400 when provider capabilities are unavailable", async () => {
    providers.db = {} as any;
    providers.storage = {} as any;

    const dbInfo = await request(app).get("/api/local/db-info").expect(400);
    expect(dbInfo.body.error).toMatch(/statistics not available/i);

    const storageInfo = await request(app).get("/api/local/storage-info").expect(400);
    expect(storageInfo.body.error).toMatch(/statistics not available/i);
  });

  it("validates API key testing payload and provider", async () => {
    await request(app).post("/api/local/api-keys/test").send({}).expect(400);

    const invalidProvider = await request(app)
      .post("/api/local/api-keys/test")
      .send({ provider: "INVALID", apiKey: "not-used" })
      .expect(400);

    expect(invalidProvider.body.error).toMatch(/invalid provider/i);
  });

  it("returns invalid for malformed API key", async () => {
    const response = await request(app)
      .post("/api/local/api-keys/test")
      .send({ provider: "OPENAI", apiKey: "invalid-key-format" })
      .expect(200);

    expect(response.body.valid).toBe(false);
    expect(response.body.error).toMatch(/format is invalid/i);
  });

  it("tests OPENAI API keys against provider endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const response = await request(app)
      .post("/api/local/api-keys/test")
      .send({ provider: "OPENAI", apiKey: "sk-abcdefghijklmnopqrstuvwxyz1234" })
      .expect(200);

    expect(response.body.valid).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/models",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer sk-abcdefghijklmnopqrstuvwxyz1234",
        }),
      }),
    );

    vi.unstubAllGlobals();
  });

  it("returns timeout error when OPENAI key test aborts", async () => {
    const abortError = new Error("aborted");
    Object.assign(abortError, { name: "AbortError" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    const response = await request(app)
      .post("/api/local/api-keys/test")
      .send({ provider: "OPENAI", apiKey: "sk-abcdefghijklmnopqrstuvwxyz1234" })
      .expect(200);

    expect(response.body.valid).toBe(false);
    expect(response.body.error).toMatch(/timed out/i);
    vi.unstubAllGlobals();
  });

  it("tests ANTHROPIC API keys against provider endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const response = await request(app)
      .post("/api/local/api-keys/test")
      .send({ provider: "ANTHROPIC", apiKey: "sk-ant-abcdefghijklmnopqrstuvwxyz1234" })
      .expect(200);

    expect(response.body.valid).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/models",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-api-key": "sk-ant-abcdefghijklmnopqrstuvwxyz1234",
        }),
      }),
    );

    vi.unstubAllGlobals();
  });

  it("enforces API key length limits for test and save endpoints", async () => {
    const tooLongOpenAi = `sk-${"a".repeat(5000)}`;

    const testResponse = await request(app)
      .post("/api/local/api-keys/test")
      .send({ provider: "OPENAI", apiKey: tooLongOpenAi })
      .expect(400);
    expect(testResponse.body.error).toMatch(/exceeds maximum length/i);

    const saveResponse = await request(app)
      .post("/api/local/api-keys/openai")
      .send({ apiKey: tooLongOpenAi })
      .expect(400);
    expect(saveResponse.body.error).toMatch(/exceeds maximum length/i);
  });

  it("validates backup and restore path rules", async () => {
    const invalidExt = await request(app)
      .post("/api/local/backup")
      .send({ destinationPath: path.join(os.homedir(), "backup.txt") })
      .expect(400);
    expect(invalidExt.body.error).toMatch(/must end with \.db/i);

    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "statSync").mockReturnValue({ isFile: () => false } as fs.Stats);
    const restoreResponse = await request(app)
      .post("/api/local/restore")
      .send({ backupPath: path.join(os.homedir(), "not-a-file.db") })
      .expect(400);
    expect(restoreResponse.body.error).toMatch(/must be a file/i);
  });

  it("returns 400 when maintenance or cleanup is unsupported", async () => {
    providers.db.maintenance = undefined as any;
    providers.storage.cleanupEmptyDirectories = undefined as any;

    const maintenance = await request(app).post("/api/local/maintenance").send({}).expect(400);
    expect(maintenance.body.error).toMatch(/maintenance not available/i);

    const cleanup = await request(app).post("/api/local/cleanup").send({}).expect(400);
    expect(cleanup.body.error).toMatch(/cleanup not available/i);
  });

  it("rejects invalid providers for save and delete routes", async () => {
    const save = await request(app)
      .post("/api/local/api-keys/not-real")
      .send({ apiKey: "sk-abcdefghijklmnopqrstuvwxyz1234567890" })
      .expect(400);
    expect(save.body.error).toMatch(/invalid provider/i);

    const del = await request(app).delete("/api/local/api-keys/not-real").expect(400);
    expect(del.body.error).toMatch(/invalid provider/i);
  });

  it("saves and deletes provider API keys", async () => {
    const saveResponse = await request(app)
      .post("/api/local/api-keys/openai")
      .send({ apiKey: "sk-abcdefghijklmnopqrstuvwxyz1234567890" })
      .expect(200);
    expect(saveResponse.body.success).toBe(true);
    expect(providers.secrets.set).toHaveBeenCalledWith(
      "llm:openai",
      "sk-abcdefghijklmnopqrstuvwxyz1234567890",
    );

    const deleteResponse = await request(app).delete("/api/local/api-keys/openai").expect(200);
    expect(deleteResponse.body.success).toBe(true);
    expect(providers.secrets.delete).toHaveBeenCalledWith("llm:openai");
  });
});

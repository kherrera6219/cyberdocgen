import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getRequiredUserIdMock = vi.hoisted(() => vi.fn(() => "user-1"));

const setupTOTPMock = vi.hoisted(() => vi.fn());
const storeTOTPSettingsMock = vi.hoisted(() => vi.fn());
const getTOTPSettingsMock = vi.hoisted(() => vi.fn());
const verifyBackupCodeMock = vi.hoisted(() => vi.fn());
const updateBackupCodesMock = vi.hoisted(() => vi.fn());
const verifyTOTPMock = vi.hoisted(() => vi.fn());
const markTOTPVerifiedMock = vi.hoisted(() => vi.fn());
const setupSMSMock = vi.hoisted(() => vi.fn());
const verifySMSMock = vi.hoisted(() => vi.fn());

const logAuditEventMock = vi.hoisted(() => vi.fn());
const encryptSensitiveFieldMock = vi.hoisted(() => vi.fn());

vi.mock("../../../server/replitAuth", () => ({
  getRequiredUserId: getRequiredUserIdMock,
}));

vi.mock("../../../server/services/mfaService", () => ({
  mfaService: {
    setupTOTP: setupTOTPMock,
    storeTOTPSettings: storeTOTPSettingsMock,
    getTOTPSettings: getTOTPSettingsMock,
    verifyBackupCode: verifyBackupCodeMock,
    updateBackupCodes: updateBackupCodesMock,
    verifyTOTP: verifyTOTPMock,
    markTOTPVerified: markTOTPVerifiedMock,
    setupSMS: setupSMSMock,
    verifySMS: verifySMSMock,
  },
}));

vi.mock("../../../server/services/auditService", () => ({
  auditService: {
    logAuditEvent: logAuditEventMock,
  },
  AuditAction: {
    READ: "read",
    CREATE: "create",
    DELETE: "delete",
  },
  RiskLevel: {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
  },
}));

vi.mock("../../../server/services/encryption", () => ({
  encryptionService: {
    encryptSensitiveField: encryptSensitiveFieldMock,
  },
  DataClassification: {
    RESTRICTED: "restricted",
  },
}));

vi.mock("../../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import mfaRouter from "../../../server/routes/mfa";

function createApp(sessionTemplateRef: { value: any }) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).session = { ...sessionTemplateRef.value };
    next();
  });
  app.use("/api/auth/mfa", mfaRouter);
  return app;
}

describe("mfa routes", () => {
  const sessionTemplateRef = { value: {} as Record<string, unknown> };
  const app = createApp(sessionTemplateRef);

  beforeEach(() => {
    vi.clearAllMocks();
    sessionTemplateRef.value = {};

    setupTOTPMock.mockResolvedValue({
      secret: "totp-secret",
      backupCodes: ["backup-a", "backup-b"],
      qrCodeUrl: "otpauth://totp/test",
    });
    storeTOTPSettingsMock.mockResolvedValue(undefined);
    getTOTPSettingsMock.mockResolvedValue({
      secret: "totp-secret",
      backupCodes: ["backup-a", "backup-b"],
      qrCodeUrl: "otpauth://totp/test",
    });
    verifyBackupCodeMock.mockResolvedValue(true);
    updateBackupCodesMock.mockResolvedValue(undefined);
    verifyTOTPMock.mockResolvedValue({ verified: true });
    markTOTPVerifiedMock.mockResolvedValue(undefined);
    setupSMSMock.mockResolvedValue({ verificationCode: "654321" });
    verifySMSMock.mockResolvedValue(true);

    logAuditEventMock.mockResolvedValue(undefined);
    encryptSensitiveFieldMock.mockResolvedValue("encrypted-value");
  });

  it("returns MFA status, challenge details, and method guidance", async () => {
    const status = await request(app).get("/api/auth/mfa/status").expect(200);
    expect(status.body.success).toBe(true);
    expect(status.body.data.isSetupComplete).toBe(false);

    const setup = await request(app).post("/api/auth/mfa/setup").send({}).expect(400);
    expect(setup.body.error.code).toBe("VALIDATION_ERROR");
    expect(setup.body.error.message).toMatch(/specify MFA method/i);

    const challenge = await request(app).post("/api/auth/mfa/challenge").send({}).expect(200);
    expect(challenge.body.data.challengeRequired).toBe(true);
    expect(challenge.body.data.availableMethods).toEqual(["totp", "sms"]);
    expect(logAuditEventMock).toHaveBeenCalledTimes(2);
  });

  it("handles TOTP setup and verification branches", async () => {
    const setup = await request(app).post("/api/auth/mfa/setup/totp").send({ enable: true }).expect(200);
    expect(setup.body.data.setupComplete).toBe(false);
    expect(setup.body.data.backupCodes).toEqual(["backup-a", "backup-b"]);
    expect(storeTOTPSettingsMock).toHaveBeenCalledWith(
      "user-1",
      "totp-secret",
      ["backup-a", "backup-b"],
      "otpauth://totp/test",
    );

    getTOTPSettingsMock.mockResolvedValueOnce(null);
    const missingSetup = await request(app)
      .post("/api/auth/mfa/verify/totp")
      .send({ token: "123456" })
      .expect(404);
    expect(missingSetup.body.error.code).toBe("NOT_FOUND");

    getTOTPSettingsMock.mockResolvedValueOnce({ secret: "totp-secret", backupCodes: ["backup-a"] });
    verifyBackupCodeMock.mockResolvedValueOnce(true);
    const backupVerified = await request(app)
      .post("/api/auth/mfa/verify/totp")
      .send({ token: "123456", backupCode: "backup-a" })
      .expect(200);
    expect(backupVerified.body.data.message).toMatch(/backup code verified/i);
    expect(updateBackupCodesMock).toHaveBeenCalled();
    expect(markTOTPVerifiedMock).toHaveBeenCalled();

    getTOTPSettingsMock.mockResolvedValueOnce({ secret: "totp-secret", backupCodes: [] });
    verifyTOTPMock.mockResolvedValueOnce({ verified: true });
    const tokenVerified = await request(app)
      .post("/api/auth/mfa/verify/totp")
      .send({ token: "123456" })
      .expect(200);
    expect(tokenVerified.body.data.message).toMatch(/TOTP token verified successfully/i);

    getTOTPSettingsMock.mockResolvedValueOnce({ secret: "totp-secret", backupCodes: [] });
    verifyTOTPMock.mockResolvedValueOnce({ verified: false });
    const invalidToken = await request(app)
      .post("/api/auth/mfa/verify/totp")
      .send({ token: "123456" })
      .expect(400);
    expect(invalidToken.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("handles SMS setup and SMS verification outcomes", async () => {
    const setupSms = await request(app)
      .post("/api/auth/mfa/setup/sms")
      .send({ phoneNumber: "+15551234567" })
      .expect(200);

    expect(setupSms.body.success).toBe(true);
    expect(setupSms.body.data.phoneNumber).toContain("*");
    expect(setupSms.body.data.phoneNumber).toMatch(/4567$/);
    expect(setupSms.body.data.devCode).toBe("654321");

    verifySMSMock.mockResolvedValueOnce(true);
    const verified = await request(app).post("/api/auth/mfa/verify/sms").send({ code: "123456" }).expect(200);
    expect(verified.body.data.verified).toBe(true);

    verifySMSMock.mockResolvedValueOnce(false);
    const failed = await request(app).post("/api/auth/mfa/verify/sms").send({ code: "000000" }).expect(400);
    expect(failed.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("generates backup codes and protects MFA disable endpoint", async () => {
    const backupCodes = await request(app).post("/api/auth/mfa/backup-codes").send({}).expect(200);
    expect(backupCodes.body.data.backupCodes).toEqual(["backup-a", "backup-b"]);
    expect(encryptSensitiveFieldMock).toHaveBeenCalledWith(
      JSON.stringify(["backup-a", "backup-b"]),
      "restricted",
    );

    const forbiddenDisable = await request(app).delete("/api/auth/mfa/disable").expect(403);
    expect(forbiddenDisable.body.error.code).toBe("FORBIDDEN");

    sessionTemplateRef.value = { mfaVerified: true };
    const disabled = await request(app).delete("/api/auth/mfa/disable").expect(200);
    expect(disabled.body.success).toBe(true);
    expect(disabled.body.data.mfaEnabled).toBe(false);
    expect(logAuditEventMock).toHaveBeenCalled();
  });
});

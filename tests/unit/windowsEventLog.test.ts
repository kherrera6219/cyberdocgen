import { describe, it, expect, vi, beforeEach } from "vitest";
import { WindowsEventLogService } from "../../server/services/windowsEventLogService";
import { exec } from "child_process";
import { logger } from "../../server/utils/logger";

vi.mock("child_process", () => ({
  exec: vi.fn((cmd, cb) => cb(null, "success", ""))
}));

vi.mock("../../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

describe("WindowsEventLogService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gracefully runs logger on non-Windows platform without executing powershell", async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });

    const service = new WindowsEventLogService();
    const result = await service.logEvent(1001, "Information", "Test Log", { foo: "bar" });

    expect(result).toBe(false);
    expect(logger.info).toHaveBeenCalled();
    expect(exec).not.toHaveBeenCalled();

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it("calls powershell event logging on Windows platform", async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });

    const service = new WindowsEventLogService();
    // Simulate active source
    (service as any).isWindows = true;

    const result = await service.logEvent(2001, "Warning", "Compliance Warning Test", { rule: "SOC2" });

    expect(exec).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it("handles powershell log failure gracefully with fallback", async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });

    (exec as any).mockImplementation((cmd, cb) => {
      if (cmd.includes("Write-EventLog")) {
        cb(new Error("Access Denied"), "", "error details");
      } else {
        cb(null, "success", "");
      }
    });

    const service = new WindowsEventLogService();
    (service as any).isWindows = true;

    const result = await service.logEvent(3001, "Error", "System Crash simulation", { system: "auth" });

    expect(result).toBe(false);
    expect(logger.error).toHaveBeenCalled();

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });
});

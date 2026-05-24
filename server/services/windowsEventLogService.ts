import { exec } from "child_process";
import { logger } from "../utils/logger";

export type EventLogSeverity = "Information" | "Warning" | "Error";

export class WindowsEventLogService {
  private isWindows: boolean;
  private isSourceRegistered: boolean = false;
  private readonly eventSource = "CyberDocGen";

  constructor() {
    this.isWindows = process.platform === "win32";
    if (this.isWindows) {
      logger.info("[WindowsEventLogService] Windows OS detected. Attempting to register Event Source...");
      this.registerEventSource();
    } else {
      logger.info("[WindowsEventLogService] Non-Windows OS detected. Running in standard Winston fallback mode.");
    }
  }

  /**
   * Registers the Event Source "CyberDocGen" in Windows Application logs.
   * Requires administrative privileges. Fallback is handled gracefully if access is denied.
   */
  private registerEventSource() {
    if (!this.isWindows) return;

    const command = `powershell -Command "if (-not [System.Diagnostics.EventLog]::SourceExists('${this.eventSource}')) { New-EventLog -LogName 'Application' -Source '${this.eventSource}' }"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        logger.warn("[WindowsEventLogService] Failed to register Windows Event Source (requires admin privileges). Logging will fall back to Winston.", {
          error: error.message,
          stderr
        });
        this.isSourceRegistered = false;
      } else {
        logger.info(`[WindowsEventLogService] Successfully verified/registered Windows Event Source: ${this.eventSource}`);
        this.isSourceRegistered = true;
      }
    });
  }

  /**
   * Log a security or compliance event to the Windows Event Viewer or fallback to Winston.
   * 
   * @param eventId Numeric identifier for the event type (e.g. 1001 for failed login, 2001 for compliance breach)
   * @param severity Event entry type (Information, Warning, Error)
   * @param message Text explanation of the event
   * @param metadata Structured data logs for searchability
   */
  async logEvent(
    eventId: number,
    severity: EventLogSeverity,
    message: string,
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${severity.toUpperCase()}] [ID: ${eventId}] ${message}\nMetadata: ${JSON.stringify(metadata)}`;

    // Always log to standard Winston logs first
    if (severity === "Error") {
      logger.error(`[WindowsEventViewerFallback] ${message}`, metadata);
    } else if (severity === "Warning") {
      logger.warn(`[WindowsEventViewerFallback] ${message}`, metadata);
    } else {
      logger.info(`[WindowsEventViewerFallback] ${message}`, metadata);
    }

    if (!this.isWindows) {
      return false;
    }

    // Try Windows Event Viewer
    return new Promise<boolean>((resolve) => {
      // Escape single quotes for PowerShell message parameter
      const escapedMsg = formattedMessage.replace(/'/g, "''");
      const writeCommand = `powershell -Command "Write-EventLog -LogName 'Application' -Source '${this.eventSource}' -EventID ${eventId} -EntryType '${severity}' -Message '${escapedMsg}'"`;

      exec(writeCommand, (error, stdout, stderr) => {
        if (error) {
          logger.debug("[WindowsEventLogService] Could not write to Windows Event Viewer (source may not be registered or requires admin permission).", {
            error: error.message,
            stderr
          });
          resolve(false);
        } else {
          logger.info(`[WindowsEventLogService] Piped event ${eventId} to Windows Event Viewer successfully.`);
          resolve(true);
        }
      });
    });
  }
}

export const windowsEventLogService = new WindowsEventLogService();

import os from "os";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { logger } from "../utils/logger";
import { databaseHealthService } from "./databaseHealthService";

const SECRETS_PATTERNS = [
  /(?:password|passwd|pwd|secret|token|apikey|api_key|bearer|authorization)\s*[:=]\s*["']?([a-zA-Z0-9_\-./=+]{4,})["']?/gi,
  /(?:ENCRYPTION_KEY|DATA_INTEGRITY_SECRET|SESSION_SECRET|OPENAI_API_KEY|ANTHROPIC_API_KEY|GOOGLE_GENERATIVE_AI_KEY)\s*[:=]\s*["']?([a-zA-Z0-9_\-./=+]{4,})["']?/gi
];

export class DiagnosticsService {
  /**
   * Generates a redacted diagnostic bundle
   */
  async generateDiagnosticBundle(organizationId: string): Promise<{
    success: boolean;
    filePath?: string;
    filename?: string;
    error?: string;
  }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `diagnostic-bundle-${organizationId}-${timestamp}.zip`;
      
      const baseDir = process.env.LOCAL_DATA_PATH 
        ? path.resolve(process.env.LOCAL_DATA_PATH, 'diagnostics')
        : path.resolve(process.cwd(), 'data/diagnostics');

      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }

      const filePath = path.join(baseDir, filename);
      const zip = new AdmZip();

      // 1. Gather Host OS Specifications
      const osInfo = this.collectSystemSpecs();
      zip.addFile("system_specs.json", Buffer.from(JSON.stringify(osInfo, null, 2), "utf8"));

      // 2. Gather Database Telemetries
      const dbStats = await databaseHealthService.getDatabaseStats();
      zip.addFile("database_stats.json", Buffer.from(JSON.stringify(dbStats, null, 2), "utf8"));

      // 3. Read and Redact Recent Log Files
      const logDir = process.env.LOCAL_DATA_PATH 
        ? path.resolve(process.env.LOCAL_DATA_PATH, 'logs')
        : path.resolve(process.cwd(), 'logs');

      if (fs.existsSync(logDir)) {
        const files = fs.readdirSync(logDir);
        const logFiles = files.filter(f => f.startsWith("cyberdocgen-") && f.endsWith(".log")).sort();
        
        // Take the 3 most recent log files
        const recentLogs = logFiles.slice(-3);
        
        for (const logFile of recentLogs) {
          const logPath = path.join(logDir, logFile);
          try {
            const rawContent = fs.readFileSync(logPath, "utf8");
            const scrubbedContent = this.redactSecrets(rawContent);
            zip.addFile(`logs/${logFile}`, Buffer.from(scrubbedContent, "utf8"));
          } catch (e) {
            logger.warn(`Failed to include log file ${logFile} in diagnostics`, { error: e });
          }
        }
      }

      // Write diagnostic bundle file to disk
      zip.writeZip(filePath);

      logger.info("Diagnostic bundle generated successfully", { organizationId, filePath });

      return {
        success: true,
        filePath,
        filename
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error("Failed to generate diagnostic bundle", { error: msg, organizationId });
      return {
        success: false,
        error: msg
      };
    }
  }

  private collectSystemSpecs() {
    return {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      uptimeSeconds: os.uptime(),
      hostname: os.hostname(),
      totalMemoryBytes: os.totalmem(),
      freeMemoryBytes: os.freemem(),
      cpuCount: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || "unknown",
      nodeVersion: process.version,
      platformEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };
  }

  private redactSecrets(content: string): string {
    let scrubbed = content;
    for (const pattern of SECRETS_PATTERNS) {
      scrubbed = scrubbed.replace(pattern, (match, secretVal) => {
        // Redact the captured secret value
        return match.replace(secretVal, "[REDACTED_CREDENTIAL]");
      });
    }
    return scrubbed;
  }
}

export const diagnosticsService = new DiagnosticsService();

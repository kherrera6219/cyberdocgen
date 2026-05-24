import fs from "fs";
import os from "os";
import path from "path";
import { logger } from "../utils/logger";

export interface NetworkSettings {
  host: string;
  port: number;
  sslEnabled: boolean;
  sslCertPath?: string;
  sslKeyPath?: string;
}

export class NetworkSettingsManager {
  private settingsFilePath: string;
  private certsDir: string;

  constructor() {
    const dataPath = this.resolveDataPath();
    this.settingsFilePath = path.join(dataPath, "settings", "network.json");
    this.certsDir = path.join(dataPath, "security");
    
    // Ensure settings and certs directories exist
    fs.mkdirSync(path.dirname(this.settingsFilePath), { recursive: true });
    fs.mkdirSync(this.certsDir, { recursive: true });
  }

  private resolveDataPath(): string {
    const configuredDataPath = process.env.LOCAL_DATA_PATH?.trim();
    if (configuredDataPath) {
      return path.resolve(configuredDataPath);
    }

    const localAppData = process.env.LOCALAPPDATA?.trim();
    if (localAppData) {
      return path.resolve(localAppData, 'CyberDocGen');
    }

    return path.resolve(os.homedir(), '.cyberdocgen');
  }

  /**
   * Reads persistent network settings from disk
   */
  getSettings(): NetworkSettings {
    try {
      if (fs.existsSync(this.settingsFilePath)) {
        const raw = fs.readFileSync(this.settingsFilePath, "utf8");
        const parsed = JSON.parse(raw) as NetworkSettings;
        return {
          host: parsed.host || "127.0.0.1",
          port: parsed.port || 5231,
          sslEnabled: !!parsed.sslEnabled,
          sslCertPath: parsed.sslCertPath,
          sslKeyPath: parsed.sslKeyPath,
        };
      }
    } catch (e) {
      logger.warn("Failed to load local network settings, using defaults", { error: e });
    }

    // Default configuration
    return {
      host: process.env.HOST || "127.0.0.1",
      port: parseInt(process.env.PORT || process.env.LOCAL_PORT || "5231", 10),
      sslEnabled: false
    };
  }

  /**
   * Persists network settings to disk
   */
  saveSettings(updates: Partial<NetworkSettings>): NetworkSettings {
    const current = this.getSettings();
    const updated: NetworkSettings = {
      host: updates.host ?? current.host,
      port: updates.port ?? current.port,
      sslEnabled: updates.sslEnabled ?? current.sslEnabled,
      sslCertPath: updates.sslCertPath ?? current.sslCertPath,
      sslKeyPath: updates.sslKeyPath ?? current.sslKeyPath,
    };

    try {
      fs.writeFileSync(this.settingsFilePath, JSON.stringify(updated, null, 2), "utf8");
      logger.info("Local network settings updated persistently", { host: updated.host, port: updated.port, sslEnabled: updated.sslEnabled });
    } catch (e) {
      logger.error("Failed to persist local network settings", { error: e });
      throw e;
    }

    return updated;
  }

  /**
   * Upload and save CA SSL Certificate & Private Key
   */
  saveSSLCertificate(certPem: string, keyPem: string): { success: boolean; certPath: string; keyPath: string } {
    const certPath = path.join(this.certsDir, "cert.pem");
    const keyPath = path.join(this.certsDir, "key.pem");

    try {
      fs.writeFileSync(certPath, certPem, "utf8");
      fs.writeFileSync(keyPath, keyPem, "utf8");
      
      // Update settings automatically
      this.saveSettings({
        sslEnabled: true,
        sslCertPath: certPath,
        sslKeyPath: keyPath
      });

      logger.info("SSL Certificate uploaded and stored securely", { certPath, keyPath });

      return {
        success: true,
        certPath,
        keyPath
      };
    } catch (e) {
      logger.error("Failed to store SSL Certificates", { error: e });
      throw e;
    }
  }
}

export const networkSettingsManager = new NetworkSettingsManager();

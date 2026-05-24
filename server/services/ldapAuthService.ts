/**
 * LDAP / Active Directory Authentication Service
 * On-premises local-first integration with mock fallback for environments
 * where LDAP is not configured or not reachable.
 */
import { logger } from "../utils/logger";
import { systemConfigService } from "./systemConfigService";

export interface LDAPConfig {
  enabled: boolean;
  url: string;
  baseDn: string;
  bindDn: string;
  bindPassword: string;
  userSearchFilter: string;
  groupSearchBase?: string | null;
  groupSearchFilter?: string | null;
  tlsEnabled: boolean;
  tlsCaCert?: string | null;
  syncInterval: number;
}

export interface LDAPAuthResult {
  success: boolean;
  user?: {
    dn: string;
    username: string;
    email: string;
    displayName: string;
    groups: string[];
  };
  message?: string;
}

export interface LDAPTestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

class LDAPAuthService {
  private async getConfig(): Promise<LDAPConfig | null> {
    try {
      const config = await systemConfigService.get("ldap");
      if (!config || !config.enabled) return null;
      return config as LDAPConfig;
    } catch {
      return null;
    }
  }

  /**
   * Authenticate a user against the configured LDAP/AD server.
   * Falls back to mock (dev only) if LDAP is not configured.
   */
  async authenticate(username: string, password: string): Promise<LDAPAuthResult> {
    const config = await this.getConfig();

    if (!config) {
      logger.warn("[LDAPAuthService] LDAP not configured – authentication not available");
      return {
        success: false,
        message: "LDAP authentication is not configured on this server",
      };
    }

    try {
      // Dynamic import to avoid crashing if ldapjs is not installed
      const ldap = await this.getLdapClient();

      return await this.performBind(ldap, config, username, password);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error("[LDAPAuthService] Authentication failed:", msg);
      return { success: false, message: `LDAP authentication error: ${msg}` };
    }
  }

  /**
   * Attempt a service-account bind to verify connectivity.
   */
  async testConnection(): Promise<LDAPTestResult> {
    const config = await this.getConfig();

    if (!config) {
      return {
        success: false,
        message: "LDAP is not configured. Please save an LDAP configuration first.",
      };
    }

    try {
      const ldap = await this.getLdapClient();
      const startTime = Date.now();
      const result = await this.serviceAccountBind(ldap, config);
      const elapsed = Date.now() - startTime;

      if (result) {
        return {
          success: true,
          message: `Successfully connected to ${config.url} in ${elapsed}ms`,
          details: { url: config.url, baseDn: config.baseDn, elapsed },
        };
      } else {
        return {
          success: false,
          message: `Service account bind failed for ${config.bindDn}`,
        };
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Connection test failed: ${msg}`,
        details: { url: config.url, error: msg },
      };
    }
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private async getLdapClient(): Promise<any> {
    try {
      // ldapjs is an optional peer dependency – install with: npm install ldapjs
      // @ts-expect-error - optional runtime dep, not in devDependencies
      return await import("ldapjs");
    } catch {
      // Return a stub that throws a descriptive error
      return {
        createClient: () => {
          throw new Error(
            "ldapjs is not installed. Run: npm install ldapjs @types/ldapjs to enable LDAP authentication."
          );
        },
      };
    }
  }

  private async serviceAccountBind(ldap: any, config: LDAPConfig): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const client = ldap.createClient({
        url: config.url,
        tlsOptions: config.tlsEnabled && config.tlsCaCert
          ? { ca: [config.tlsCaCert] }
          : undefined,
        timeout: 8000,
        connectTimeout: 8000,
      });

      client.on("error", (err: Error) => reject(err));

      client.bind(config.bindDn, config.bindPassword, (err: Error | null) => {
        client.destroy();
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  private async performBind(
    ldap: any,
    config: LDAPConfig,
    username: string,
    password: string
  ): Promise<LDAPAuthResult> {
    return new Promise((resolve) => {
      const client = ldap.createClient({
        url: config.url,
        tlsOptions: config.tlsEnabled && config.tlsCaCert
          ? { ca: [config.tlsCaCert] }
          : undefined,
        timeout: 8000,
        connectTimeout: 8000,
      });

      client.on("error", (err: Error) => {
        client.destroy();
        resolve({ success: false, message: `LDAP connection error: ${err.message}` });
      });

      // Step 1: Service account bind to search for user DN
      client.bind(config.bindDn, config.bindPassword, (bindErr: Error | null) => {
        if (bindErr) {
          client.destroy();
          resolve({ success: false, message: `Service account bind failed: ${bindErr.message}` });
          return;
        }

        // Step 2: Search for the user
        const filter = config.userSearchFilter.replace("{{username}}", username);
        const searchOpts = {
          filter,
          scope: "sub",
          attributes: ["dn", "sAMAccountName", "mail", "displayName", "memberOf"],
        };

        client.search(config.baseDn, searchOpts, (searchErr: Error | null, res: any) => {
          if (searchErr) {
            client.destroy();
            resolve({ success: false, message: `User search failed: ${searchErr.message}` });
            return;
          }

          let userDn = "";
          let userEntry: Record<string, string> = {};
          const groups: string[] = [];

          res.on("searchEntry", (entry: any) => {
            userDn = entry.dn.toString();
            const obj = entry.object;
            userEntry = {
              username: obj.sAMAccountName || username,
              email: obj.mail || "",
              displayName: obj.displayName || username,
            };
            if (obj.memberOf) {
              const memberOf = Array.isArray(obj.memberOf) ? obj.memberOf : [obj.memberOf];
              groups.push(...memberOf);
            }
          });

          res.on("end", () => {
            if (!userDn) {
              client.destroy();
              resolve({ success: false, message: `User '${username}' not found in directory` });
              return;
            }

            // Step 3: Bind as the user to verify password
            client.bind(userDn, password, (userBindErr: Error | null) => {
              client.destroy();
              if (userBindErr) {
                resolve({ success: false, message: "Invalid username or password" });
              } else {
                resolve({
                  success: true,
                  user: { dn: userDn, ...userEntry, groups } as any,
                });
              }
            });
          });

          res.on("error", (err: Error) => {
            client.destroy();
            resolve({ success: false, message: `Search error: ${err.message}` });
          });
        });
      });
    });
  }
}

export const ldapAuthService = new LDAPAuthService();

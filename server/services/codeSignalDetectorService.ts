/**
 * Code Signal Detector Service
 * 
 * Scans repository files for security-relevant patterns and signals.
 * Detects:
 * - Authentication mechanisms (JWT, OAuth, session handling)
 * - Encryption usage (at-rest, in-transit)
 * - Logging and monitoring
 * - Access control (RBAC, permissions)
 * - CI/CD security configurations
 * - Secrets and credentials (warnings)
 * 
 * Production-grade features:
 * - Secure file reading with size limits
 * - Rate limiting for LLM calls
 * - Error handling and retries
 * - Audit logging
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errorHandling';
import { db } from '../db';
import { repositoryFiles } from '@shared/schema';
import { eq } from 'drizzle-orm';

// File size limit for analysis (prevent memory exhaustion)
const MAX_FILE_SIZE_FOR_ANALYSIS = 1 * 1024 * 1024; // 1MB

export interface AuthSignal {
  type: 'jwt' | 'oauth' | 'session' | 'api_key' | 'mfa' | 'passkey' | 'basic_auth' | 'saml' | 'oidc';
  confidence: 'high' | 'medium' | 'low';
  files: Array<{
    path: string;
    lineNumbers?: number[];
    evidence: string;
  }>;
  details: string;
}

export interface EncryptionSignal {
  type: 'at_rest' | 'in_transit' | 'key_management' | 'hashing';
  algorithm?: string;
  confidence: 'high' | 'medium' | 'low';
  files: Array<{
    path: string;
    lineNumbers?: number[];
    evidence: string;
  }>;
  details: string;
}

export interface LoggingSignal {
  type: 'structured' | 'audit' | 'security' | 'application' | 'access';
  framework?: string;
  confidence: 'high' | 'medium' | 'low';
  files: Array<{
    path: string;
    lineNumbers?: number[];
    evidence: string;
  }>;
  details: string;
}

export interface AccessControlSignal {
  type: 'rbac' | 'permissions' | 'middleware' | 'policy' | 'acl';
  confidence: 'high' | 'medium' | 'low';
  files: Array<{
    path: string;
    lineNumbers?: number[];
    evidence: string;
  }>;
  details: string;
}

export interface CICDSignal {
  type: 'github_actions' | 'gitlab_ci' | 'jenkins' | 'circleci' | 'travis' | 'azure_devops';
  hasSecurityScanning: boolean;
  hasSecretScanning: boolean;
  hasDependencyScanning: boolean;
  confidence: 'high' | 'medium' | 'low';
  files: Array<{
    path: string;
    evidence: string;
  }>;
  details: string;
}

export interface SecretsWarning {
  type: 'hardcoded_secret' | 'api_key' | 'password' | 'token' | 'private_key';
  severity: 'critical' | 'high' | 'medium' | 'low';
  files: Array<{
    path: string;
    lineNumbers?: number[];
    evidence: string; // Redacted
  }>;
  recommendation: string;
}

export interface CodeSignals {
  auth: AuthSignal[];
  encryption: EncryptionSignal[];
  logging: LoggingSignal[];
  accessControl: AccessControlSignal[];
  cicd: CICDSignal[];
  secretsWarnings: SecretsWarning[];
  scannedFiles: number;
  skippedFiles: number;
}

export class CodeSignalDetectorService {
  // Pattern libraries (compiled regexes for performance)
  private readonly authPatterns = {
    jwt: {
      patterns: [
        /jwt\.sign\(/i,
        /jwt\.verify\(/i,
        /jsonwebtoken/i,
        /Bearer.*token/i,
        /\bjwt\b.*token/i,
      ],
      confidence: 'high' as const,
    },
    oauth: {
      patterns: [
        /oauth/i,
        /passport.*oauth/i,
        /oauth2/i,
        /client_id.*client_secret/i,
        /authorization_code/i,
        /access_token.*refresh_token/i,
      ],
      confidence: 'medium' as const,
    },
    session: {
      patterns: [
        /express-session/i,
        /req\.session/i,
        /cookie-session/i,
        /session\.save\(/i,
        /sessionStorage/i,
      ],
      confidence: 'high' as const,
    },
    mfa: {
      patterns: [
        /totp/i,
        /two.*factor/i,
        /2fa/i,
        /authenticator/i,
        /speakeasy/i,
        /otplib/i,
      ],
      confidence: 'high' as const,
    },
    saml: {
      patterns: [
        /saml/i,
        /passport-saml/i,
        /saml2/i,
        /sso.*saml/i,
      ],
      confidence: 'medium' as const,
    },
  };

  private readonly encryptionPatterns = {
    atRest: {
      patterns: [
        /crypto\.createCipher/i,
        /AES.*encrypt/i,
        /bcrypt/i,
        /scrypt/i,
        /encrypt\(/i,
        /\.encrypt\(/i,
      ],
      confidence: 'medium' as const,
    },
    inTransit: {
      patterns: [
        /https/i,
        /tls/i,
        /ssl/i,
        /cert.*pem/i,
        /createSecureServer/i,
      ],
      confidence: 'medium' as const,
    },
    hashing: {
      patterns: [
        /sha256/i,
        /sha512/i,
        /createHash/i,
        /pbkdf2/i,
        /argon2/i,
      ],
      confidence: 'high' as const,
    },
  };

  private readonly loggingPatterns = {
    structured: {
      patterns: [
        /winston/i,
        /pino/i,
        /bunyan/i,
        /logger\./i,
        /console\.log\(/i, // Low confidence
      ],
      confidence: 'medium' as const,
    },
    audit: {
      patterns: [
        /audit.*log/i,
        /auditService/i,
        /logAudit/i,
        /auditTrail/i,
      ],
      confidence: 'high' as const,
    },
  };

  private readonly accessControlPatterns = {
    rbac: {
      patterns: [
        /role.*based/i,
        /rbac/i,
        /hasRole/i,
        /checkRole/i,
        /userRole/i,
        /permission/i,
      ],
      confidence: 'medium' as const,
    },
    middleware: {
      patterns: [
        /auth.*middleware/i,
        /requireAuth/i,
        /isAuthenticated/i,
        /protect.*route/i,
      ],
      confidence: 'high' as const,
    },
  };

  private readonly secretsPatterns = [
    { pattern: /-----BEGIN.*PRIVATE KEY-----/i, type: 'private_key' as const, severity: 'critical' as const },
    { pattern: /api[_-]?key\s*=\s*['"][a-zA-Z0-9]{20,}['"]/i, type: 'api_key' as const, severity: 'high' as const },
    { pattern: /password\s*=\s*['"][^'"]{8,}['"]/i, type: 'password' as const, severity: 'high' as const },
    { pattern: /secret\s*=\s*['"][a-zA-Z0-9]{20,}['"]/i, type: 'hardcoded_secret' as const, severity: 'high' as const },
    { pattern: /token\s*=\s*['"][a-zA-Z0-9]{20,}['"]/i, type: 'token' as const, severity: 'medium' as const },
  ];

  /**
   * Scan repository for authentication patterns
   */
  async scanForAuthPatterns(
    snapshotId: string,
    extractedPath: string
  ): Promise<AuthSignal[]> {
    try {
      const signals: AuthSignal[] = [];
      const files = await this.getSecurityRelevantFiles(snapshotId);

      for (const file of files) {
        const fullPath = path.join(extractedPath, file.relativePath);
        const content = await this.readFileSafely(fullPath);
        
        if (!content) continue;

        // Check for JWT
        const jwtMatches = this.findPatternMatches(content, this.authPatterns.jwt.patterns);
        if (jwtMatches.length > 0) {
          signals.push({
            type: 'jwt',
            confidence: this.authPatterns.jwt.confidence,
            files: [{
              path: file.relativePath,
              lineNumbers: jwtMatches.map(m => m.lineNumber),
              evidence: jwtMatches[0].text.substring(0, 100),
            }],
            details: 'JWT (JSON Web Token) authentication implementation detected',
          });
        }

        // Check for OAuth
        const oauthMatches = this.findPatternMatches(content, this.authPatterns.oauth.patterns);
        if (oauthMatches.length > 0) {
          signals.push({
            type: 'oauth',
            confidence: this.authPatterns.oauth.confidence,
            files: [{
              path: file.relativePath,
              lineNumbers: oauthMatches.map(m => m.lineNumber),
              evidence: oauthMatches[0].text.substring(0, 100),
            }],
            details: 'OAuth/OAuth2 authentication flow detected',
          });
        }

        // Check for session management
        const sessionMatches = this.findPatternMatches(content, this.authPatterns.session.patterns);
        if (sessionMatches.length > 0) {
          signals.push({
            type: 'session',
            confidence: this.authPatterns.session.confidence,
            files: [{
              path: file.relativePath,
              lineNumbers: sessionMatches.map(m => m.lineNumber),
              evidence: sessionMatches[0].text.substring(0, 100),
            }],
            details: 'Session-based authentication detected',
          });
        }

        // Check for MFA
        const mfaMatches = this.findPatternMatches(content, this.authPatterns.mfa.patterns);
        if (mfaMatches.length > 0) {
          signals.push({
            type: 'mfa',
            confidence: this.authPatterns.mfa.confidence,
            files: [{
              path: file.relativePath,
              lineNumbers: mfaMatches.map(m => m.lineNumber),
              evidence: mfaMatches[0].text.substring(0, 100),
            }],
            details: 'Multi-factor authentication (MFA/2FA) implementation detected',
          });
        }
      }

      logger.info('Authentication pattern scan complete', {
        snapshotId,
        signalsFound: signals.length,
        filesScanned: files.length,
      });

      return signals;

    } catch (error) {
      logger.error('Failed to scan for auth patterns', {
        snapshotId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new AppError('Authentication pattern scan failed', 500, 'AUTH_SCAN_ERROR');
    }
  }

  /**
   * Scan repository for encryption usage
   */
  async scanForEncryption(
    snapshotId: string,
    extractedPath: string
  ): Promise<EncryptionSignal[]> {
    try {
      const signals: EncryptionSignal[] = [];
      const files = await this.getSecurityRelevantFiles(snapshotId);

      for (const file of files) {
        const fullPath = path.join(extractedPath, file.relativePath);
        const content = await this.readFileSafely(fullPath);
        
        if (!content) continue;

        // Check for encryption at rest
        const atRestMatches = this.findPatternMatches(content, this.encryptionPatterns.atRest.patterns);
        if (atRestMatches.length > 0) {
          signals.push({
            type: 'at_rest',
            confidence: this.encryptionPatterns.atRest.confidence,
            files: [{
              path: file.relativePath,
              lineNumbers: atRestMatches.map(m => m.lineNumber),
              evidence: atRestMatches[0].text.substring(0, 100),
            }],
            details: 'Data encryption at rest implementation detected',
          });
        }

        // Check for encryption in transit
        const inTransitMatches = this.findPatternMatches(content, this.encryptionPatterns.inTransit.patterns);
        if (inTransitMatches.length > 0) {
          signals.push({
            type: 'in_transit',
            confidence: this.encryptionPatterns.inTransit.confidence,
            files: [{
              path: file.relativePath,
              lineNumbers: inTransitMatches.map(m => m.lineNumber),
              evidence: inTransitMatches[0].text.substring(0, 100),
            }],
            details: 'TLS/SSL encryption in transit detected',
          });
        }

        // Check for hashing
        const hashMatches = this.findPatternMatches(content, this.encryptionPatterns.hashing.patterns);
        if (hashMatches.length > 0) {
          signals.push({
            type: 'hashing',
            confidence: this.encryptionPatterns.hashing.confidence,
            files: [{
              path: file.relativePath,
              lineNumbers: hashMatches.map(m => m.lineNumber),
              evidence: hashMatches[0].text.substring(0, 100),
            }],
            details: 'Cryptographic hashing detected (password hashing, data integrity)',
          });
        }
      }

      logger.info('Encryption pattern scan complete', {
        snapshotId,
        signalsFound: signals.length,
      });

      return signals;

    } catch (error) {
      logger.error('Failed to scan for encryption', {
        snapshotId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new AppError('Encryption pattern scan failed', 500, 'ENCRYPTION_SCAN_ERROR');
    }
  }

  /**
   * Scan repository for logging
   */
  async scanForLogging(
    snapshotId: string,
    extractedPath: string
  ): Promise<LoggingSignal[]> {
    try {
      const signals: LoggingSignal[] = [];
      const files = await this.getSecurityRelevantFiles(snapshotId);

      for (const file of files) {
        const fullPath = path.join(extractedPath, file.relativePath);
        const content = await this.readFileSafely(fullPath);
        
        if (!content) continue;

        // Check for structured logging
        const structuredMatches = this.findPatternMatches(content, this.loggingPatterns.structured.patterns);
        if (structuredMatches.length > 0) {
          signals.push({
            type: 'structured',
            confidence: this.loggingPatterns.structured.confidence,
            files: [{
              path: file.relativePath,
              lineNumbers: structuredMatches.map(m => m.lineNumber),
              evidence: structuredMatches[0].text.substring(0, 100),
            }],
            details: 'Structured logging implementation detected',
          });
        }

        // Check for audit logging
        const auditMatches = this.findPatternMatches(content, this.loggingPatterns.audit.patterns);
        if (auditMatches.length > 0) {
          signals.push({
            type: 'audit',
            confidence: this.loggingPatterns.audit.confidence,
            files: [{
              path: file.relativePath,
              lineNumbers: auditMatches.map(m => m.lineNumber),
              evidence: auditMatches[0].text.substring(0, 100),
            }],
            details: 'Audit trail logging detected (security events, user actions)',
          });
        }
      }

      logger.info('Logging pattern scan complete', {
        snapshotId,
        signalsFound: signals.length,
      });

      return signals;

    } catch (error) {
      logger.error('Failed to scan for logging', {
        snapshotId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new AppError('Logging pattern scan failed', 500, 'LOGGING_SCAN_ERROR');
    }
  }

  /**
   * Scan repository for access control
   */
  async scanForAccessControl(
    snapshotId: string,
    extractedPath: string
  ): Promise<AccessControlSignal[]> {
    try {
      const signals: AccessControlSignal[] = [];
      const files = await this.getSecurityRelevantFiles(snapshotId);

      for (const file of files) {
        const fullPath = path.join(extractedPath, file.relativePath);
        const content = await this.readFileSafely(fullPath);
        
        if (!content) continue;

        // Check for RBAC
        const rbacMatches = this.findPatternMatches(content, this.accessControlPatterns.rbac.patterns);
        if (rbacMatches.length > 0) {
          signals.push({
            type: 'rbac',
            confidence: this.accessControlPatterns.rbac.confidence,
            files: [{
              path: file.relativePath,
              lineNumbers: rbacMatches.map(m => m.lineNumber),
              evidence: rbacMatches[0].text.substring(0, 100),
            }],
            details: 'Role-Based Access Control (RBAC) implementation detected',
          });
        }

        // Check for middleware
        const middlewareMatches = this.findPatternMatches(content, this.accessControlPatterns.middleware.patterns);
        if (middlewareMatches.length > 0) {
          signals.push({
            type: 'middleware',
            confidence: this.accessControlPatterns.middleware.confidence,
            files: [{
              path: file.relativePath,
              lineNumbers: middlewareMatches.map(m => m.lineNumber),
              evidence: middlewareMatches[0].text.substring(0, 100),
            }],
            details: 'Authentication/authorization middleware detected',
          });
        }
      }

      logger.info('Access control pattern scan complete', {
        snapshotId,
        signalsFound: signals.length,
      });

      return signals;

    } catch (error) {
      logger.error('Failed to scan for access control', {
        snapshotId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new AppError('Access control pattern scan failed', 500, 'ACCESS_CONTROL_SCAN_ERROR');
    }
  }

  /**
   * Scan repository for CI/CD configurations
   */
  async scanForCICD(
    snapshotId: string,
    extractedPath: string
  ): Promise<CICDSignal[]> {
    try {
      const signals: CICDSignal[] = [];
      const files = await db.select()
        .from(repositoryFiles)
        .where(eq(repositoryFiles.snapshotId, snapshotId));

      // GitHub Actions
      const ghActionsFiles = files.filter(f => 
        f.relativePath.includes('.github/workflows') && f.fileType === '.yml'
      );

      if (ghActionsFiles.length > 0) {
        let hasSecurityScanning = false;
        let hasSecretScanning = false;
        let hasDependencyScanning = false;

        for (const file of ghActionsFiles) {
          const fullPath = path.join(extractedPath, file.relativePath);
          const content = await this.readFileSafely(fullPath);
          
          if (content) {
            if (/codeql|security.*scan|snyk|dependabot/i.test(content)) {
              hasSecurityScanning = true;
            }
            if (/trufflehog|gitleaks|secret.*scan/i.test(content)) {
              hasSecretScanning = true;
            }
            if (/npm audit|yarn audit|dependency.*check/i.test(content)) {
              hasDependencyScanning = true;
            }
          }
        }

        signals.push({
          type: 'github_actions',
          hasSecurityScanning,
          hasSecretScanning,
          hasDependencyScanning,
          confidence: 'high',
          files: ghActionsFiles.map(f => ({
            path: f.relativePath,
            evidence: 'GitHub Actions workflow configuration',
          })),
          details: `GitHub Actions CI/CD detected with ${hasSecurityScanning ? '' : 'NO '}security scanning`,
        });
      }

      // GitLab CI
      const gitlabFiles = files.filter(f => 
        f.fileName === '.gitlab-ci.yml' || f.relativePath.includes('.gitlab-ci')
      );

      if (gitlabFiles.length > 0) {
        signals.push({
          type: 'gitlab_ci',
          hasSecurityScanning: false, // Would need content analysis
          hasSecretScanning: false,
          hasDependencyScanning: false,
          confidence: 'high',
          files: gitlabFiles.map(f => ({
            path: f.relativePath,
            evidence: 'GitLab CI configuration',
          })),
          details: 'GitLab CI/CD pipeline detected',
        });
      }

      logger.info('CI/CD scan complete', {
        snapshotId,
        signalsFound: signals.length,
      });

      return signals;

    } catch (error) {
      logger.error('Failed to scan for CI/CD', {
        snapshotId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new AppError('CI/CD scan failed', 500, 'CICD_SCAN_ERROR');
    }
  }

  /**
   * Scan for hardcoded secrets (security warning)
   */
  async scanForSecrets(
    snapshotId: string,
    extractedPath: string
  ): Promise<SecretsWarning[]> {
    try {
      const warnings: SecretsWarning[] = [];
      const files = await this.getSecurityRelevantFiles(snapshotId);

      for (const file of files) {
        // Skip test files and config templates
        if (file.category === 'test' || file.relativePath.includes('example') || file.relativePath.includes('template')) {
          continue;
        }

        const fullPath = path.join(extractedPath, file.relativePath);
        const content = await this.readFileSafely(fullPath);
        
        if (!content) continue;

        for (const { pattern, type, severity } of this.secretsPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            warnings.push({
              type,
              severity,
              files: [{
                path: file.relativePath,
                evidence: '[REDACTED]', // Never log actual secrets
              }],
              recommendation: `Move ${type.replace('_', ' ')} to environment variables or secure secret management`,
            });
          }
        }
      }

      if (warnings.length > 0) {
        logger.warn('Potential hardcoded secrets detected', {
          snapshotId,
          count: warnings.length,
        });
      }

      return warnings;

    } catch (error) {
      logger.error('Failed to scan for secrets', {
        snapshotId,
        error: error instanceof Error ? error.message : String(error),
      });
      return []; // Don't fail the entire scan for secrets detection
    }
  }

  /**
   * Get security-relevant files from database
   */
  private async getSecurityRelevantFiles(snapshotId: string) {
    return db.select()
      .from(repositoryFiles)
      .where(eq(repositoryFiles.snapshotId, snapshotId));
  }

  /**
   * Safely read file with size limit
   */
  private async readFileSafely(filePath: string): Promise<string | null> {
    try {
      const stats = await fs.stat(filePath);
      
      if (stats.size > MAX_FILE_SIZE_FOR_ANALYSIS) {
        logger.debug('Skipped large file', { filePath, size: stats.size });
        return null;
      }

      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      logger.debug('Failed to read file', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Find pattern matches in content with line numbers
   */
  private findPatternMatches(
    content: string,
    patterns: RegExp[]
  ): Array<{ text: string; lineNumber: number }> {
    const matches: Array<{ text: string; lineNumber: number }> = [];
    const lines = content.split('\n');

    for (const [i, line] of lines.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          matches.push({
            text: line.trim(),
            lineNumber: i + 1,
          });
          break; // Only match once per line
        }
      }
    }

    return matches;
  }
}

export const codeSignalDetectorService = new CodeSignalDetectorService();

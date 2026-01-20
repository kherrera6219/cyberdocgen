/**
 * Control Mapping Service
 * 
 * Maps detected code signals to compliance framework controls.
 * Generates findings with confidence scores and evidence references.
 * Supports:
 * - SOC 2 Trust Service Criteria
 * - ISO 270012022 Annex A controls
 * - NIST 800-53 Rev 5 control families
 * - FedRAMP baselines (Low/Moderate/High)
 * 
 * Features:
 * - Intelligent confidence scoring
 * - Evidence-based recommendations
 * - Multi-framework support
 * - Audit logging
 */

import { logger } from '../utils/logger';
import { AppError } from '../utils/errorHandling';
import type {
  CodeSignals,
  AuthSignal,
  EncryptionSignal,
  LoggingSignal,
  AccessControlSignal,
  CICDSignal,
} from './codeSignalDetectorService';

export type ControlStatus = 'pass' | 'partial' | 'fail' | 'not_observed' | 'needs_human';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ControlFinding {
  controlId: string;
  framework: string;
  status: ControlStatus;
  confidenceLevel: ConfidenceLevel;
  signalType: string;
  summary: string;
  details: Record<string, any>;
  evidenceReferences: Array<{
    filePath: string;
    lineStart?: number;
    lineEnd?: number;
    snippet?: string;
  }>;
  recommendation: string;
  aiModel: string;
}

// SOC 2 Trust Service Criteria mapping
const SOC2_MAPPINGS = {
  // CC6 - Logical and Physical Access Controls
  authentication: {
    controlId: 'CC6.1',
    title: 'Logical Access - Authentication',
    description: 'System requires user authentication for access',
  },
  mfa: {
    controlId: 'CC6.2',
    title: 'Multi-Factor Authentication',
    description: 'Multi-factor authentication for privileged users',
  },
  rbac: {
    controlId: 'CC6.3',
    title: 'Authorization and Access',
    description: 'Authorization mechanisms restrict user access',
  },
  encryption_at_rest: {
    controlId: 'CC6.6',
    title: 'Encryption of Data at Rest',
    description: 'Sensitive data encrypted at rest',
  },
  encryption_in_transit: {
    controlId: 'CC6.7',
    title: 'Encryption of Data in Transit',
    description: 'Data encrypted in transit using TLS/SSL',
  },
  // CC7 - System Operations
  logging: {
    controlId: 'CC7.2',
    title: 'Logging and Monitoring',
    description: 'System events logged and monitored',
  },
  audit_trail: {
    controlId: 'CC7.3',
    title: 'Audit Logging',
    description: 'Security events captured in audit logs',
  },
  // CC8 - Change Management
  cicd: {
    controlId: 'CC8.1',
    title: 'Change Management Process',
    description: 'Changes managed through CI/CD pipeline',
  },
};

// ISO 27001:2022 Annex A mapping
const ISO27001_MAPPINGS = {
  authentication: {
    controlId: 'A.9.2.1',
    title: 'User registration and de-registration',
    description: 'User access provisioning',
  },
  access_control: {
    controlId: 'A.9.4.1',
    title: 'Information access restriction',
    description: 'Access control mechanisms',
  },
  encryption: {
    controlId: 'A.10.1.1',
    title: 'Cryptographic controls',
    description: 'Use of cryptography',
  },
  logging: {
    controlId: 'A.12.4.1',
    title: 'Event logging',
    description: 'Event logs recorded and protected',
  },
  change_management: {
    controlId: 'A.14.2.2',
    title: 'System change control procedures',
    description: 'Formal change control',
  },
};

// NIST 800-53 Rev 5 mapping
const NIST_MAPPINGS = {
  authentication: {
    controlId: 'IA-2',
    family: 'IA',
    title: 'Identification and Authentication (Organizational Users)',
    description: 'Uniquely identify and authenticate users',
  },
  mfa: {
    controlId: 'IA-2(1)',
    family: 'IA',
    title: 'Multi-Factor Authentication',
    description: 'Multi-factor authentication for privileged/network access',
  },
  access_control: {
    controlId: 'AC-3',
    family: 'AC',
    title: 'Access Enforcement',
    description: 'Enforce approved authorizations',
  },
  encryption_at_rest: {
    controlId: 'SC-28',
    family: 'SC',
    title: 'Protection of Information at Rest',
    description: 'Protect confidentiality and integrity of data at rest',
  },
  encryption_in_transit: {
    controlId: 'SC-8',
    family: 'SC',
    title: 'Transmission Confidentiality and Integrity',
    description: 'Protect confidentiality and integrity of transmitted information',
  },
  audit_logging: {
    controlId: 'AU-2',
    family: 'AU',
    title: 'Audit Events',
    description: 'Determine auditable events',
  },
  change_management: {
    controlId: 'CM-3',
    family: 'CM',
    title: 'Configuration Change Control',
    description: 'Authorize, document, and control changes',
  },
};

export class ControlMappingService {
  private readonly aiModel = 'static-pattern-matching'; // For now, will use LLM later

  /**
   * Map all detected signals to framework controls
   */
  async mapSignalsToControls(
    signals: CodeSignals,
    framework: string
  ): Promise<ControlFinding[]> {
    try {
      const findings: ControlFinding[] = [];

      // Map authentication signals
      for (const signal of signals.auth) {
        const authFindings = this.mapAuthSignal(signal, framework);
        findings.push(...authFindings);
      }

      // Map encryption signals
      for (const signal of signals.encryption) {
        const encryptionFindings = this.mapEncryptionSignal(signal, framework);
        findings.push(...encryptionFindings);
      }

      // Map logging signals
      for (const signal of signals.logging) {
        const loggingFindings = this.mapLoggingSignal(signal, framework);
        findings.push(...loggingFindings);
      }

      // Map access control signals
      for (const signal of signals.accessControl) {
        const accessFindings = this.mapAccessControlSignal(signal, framework);
        findings.push(...accessFindings);
      }

      // Map CI/CD signals
      for (const signal of signals.cicd) {
        const cicdFindings = this.mapCICDSignal(signal, framework);
        findings.push(...cicdFindings);
      }

      logger.info('Signal-to-control mapping complete', {
        framework,
        findingsCount: findings.length,
        totalSignals: signals.auth.length + signals.encryption.length + signals.logging.length,
      });

      return findings;

    } catch (error) {
      logger.error('Failed to map signals to controls', {
        framework,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new AppError('Signal-to-control mapping failed', 500, 'CONTROL_MAPPING_ERROR');
    }
  }

  /**
   * Map authentication signal to control findings
   */
  private mapAuthSignal(signal: AuthSignal, framework: string): ControlFinding[] {
    const findings: ControlFinding[] = [];
    const frameworkUpper = framework.toUpperCase();

    if (frameworkUpper === 'SOC2') {
      // Map to CC6.1 (Authentication)
      findings.push({
        controlId: 'CC6.1',
        framework: 'SOC2',
        status: 'partial', // Needs human verification
        confidenceLevel: signal.confidence,
        signalType: `authentication_${signal.type}`,
        summary: `${signal.type.toUpperCase()} authentication detected`,
        details: {
          authType: signal.type,
          filesWithEvidence: signal.files.length,
          implementationDetails: signal.details,
        },
        evidenceReferences: signal.files.map(f => ({
          filePath: f.path,
          lineStart: f.lineNumbers?.[0],
          lineEnd: f.lineNumbers?.[f.lineNumbers.length - 1],
          snippet: f.evidence,
        })),
        recommendation: this.generateAuthRecommendation(signal),
        aiModel: this.aiModel,
      });

      // If MFA, also map to CC6.2
      if (signal.type === 'mfa') {
        findings.push({
          controlId: 'CC6.2',
          framework: 'SOC2',
          status: 'partial',
          confidenceLevel: signal.confidence,
          signalType: 'mfa',
          summary: 'Multi-factor authentication implementation detected',
          details: {
            filesWithEvidence: signal.files.length,
          },
          evidenceReferences: signal.files.map(f => ({
            filePath: f.path,
            snippet: f.evidence,
          })),
          recommendation: 'Verify MFA is enforced for all privileged users and admin access',
          aiModel: this.aiModel,
        });
      }
    }

    if (frameworkUpper === 'ISO27001') {
      findings.push({
        controlId: 'A.9.2.1',
        framework: 'ISO27001',
        status: 'partial',
        confidenceLevel: signal.confidence,
        signalType: `authentication_${signal.type}`,
        summary: `User authentication mechanism detected (${signal.type})`,
        details: {
          authType: signal.type,
          filesWithEvidence: signal.files.length,
        },
        evidenceReferences: signal.files.map(f => ({
          filePath: f.path,
          snippet: f.evidence,
        })),
        recommendation: this.generateAuthRecommendation(signal),
        aiModel: this.aiModel,
      });
    }

    if (frameworkUpper === 'NIST' || frameworkUpper === 'NIST80053') {
      findings.push({
        controlId: 'IA-2',
        framework: 'NIST80053',
        status: 'partial',
        confidenceLevel: signal.confidence,
        signalType: `authentication_${signal.type}`,
        summary: `User identification and authentication detected`,
        details: {
          authType: signal.type,
          controlFamily: 'IA',
        },
        evidenceReferences: signal.files.map(f => ({
          filePath: f.path,
          snippet: f.evidence,
        })),
        recommendation: this.generateAuthRecommendation(signal),
        aiModel: this.aiModel,
      });

      if (signal.type === 'mfa') {
        findings.push({
          controlId: 'IA-2(1)',
          framework: 'NIST80053',
          status: 'partial',
          confidenceLevel: signal.confidence,
          signalType: 'mfa',
          summary: 'Multi-factor authentication detected',
          details: { controlFamily: 'IA' },
          evidenceReferences: signal.files.map(f => ({
            filePath: f.path,
            snippet: f.evidence,
          })),
          recommendation: 'Document MFA enforcement policy for all users',
          aiModel: this.aiModel,
        });
      }
    }

    return findings;
  }

  /**
   * Map encryption signal to control findings
   */
  private mapEncryptionSignal(signal: EncryptionSignal, framework: string): ControlFinding[] {
    const findings: ControlFinding[] = [];
    const frameworkUpper = framework.toUpperCase();

    if (frameworkUpper === 'SOC2') {
      const controlId = signal.type === 'at_rest' ? 'CC6.6' : signal.type === 'in_transit' ? 'CC6.7' : 'CC6.1';
      
      findings.push({
        controlId,
        framework: 'SOC2',
        status: 'partial',
        confidenceLevel: signal.confidence,
        signalType: `encryption_${signal.type}`,
        summary: `Encryption ${signal.type.replace('_', ' ')} detected`,
        details: {
          encryptionType: signal.type,
          algorithm: signal.algorithm,
          filesWithEvidence: signal.files.length,
        },
        evidenceReferences: signal.files.map(f => ({
          filePath: f.path,
          snippet: f.evidence,
        })),
        recommendation: this.generateEncryptionRecommendation(signal),
        aiModel: this.aiModel,
      });
    }

    if (frameworkUpper === 'ISO27001') {
      findings.push({
        controlId: 'A.10.1.1',
        framework: 'ISO27001',
        status: 'partial',
        confidenceLevel: signal.confidence,
        signalType: `encryption_${signal.type}`,
        summary: 'Cryptographic controls detected',
        details: {
          encryptionType: signal.type,
          algorithm: signal.algorithm,
        },
        evidenceReferences: signal.files.map(f => ({
          filePath: f.path,
          snippet: f.evidence,
        })),
        recommendation: this.generateEncryptionRecommendation(signal),
        aiModel: this.aiModel,
      });
    }

    if (frameworkUpper === 'NIST' || frameworkUpper === 'NIST80053') {
      const controlId = signal.type === 'at_rest' ? 'SC-28' : signal.type === 'in_transit' ? 'SC-8' : 'SC-13';
      
      findings.push({
        controlId,
        framework: 'NIST80053',
        status: 'partial',
        confidenceLevel: signal.confidence,
        signalType: `encryption_${signal.type}`,
        summary: `Cryptographic protection ${signal.type.replace('_', ' ')} detected`,
        details: {
          encryptionType: signal.type,
          controlFamily: 'SC',
        },
        evidenceReferences: signal.files.map(f => ({
          filePath: f.path,
          snippet: f.evidence,
        })),
        recommendation: this.generateEncryptionRecommendation(signal),
        aiModel: this.aiModel,
      });
    }

    return findings;
  }

  /**
   * Map logging signal to control findings
   */
  private mapLoggingSignal(signal: LoggingSignal, framework: string): ControlFinding[] {
    const findings: ControlFinding[] = [];
    const frameworkUpper = framework.toUpperCase();

    if (frameworkUpper === 'SOC2') {
      const controlId = signal.type === 'audit' ? 'CC7.3' : 'CC7.2';
      
      findings.push({
        controlId,
        framework: 'SOC2',
        status: 'partial',
        confidenceLevel: signal.confidence,
        signalType: `logging_${signal.type}`,
        summary: `${signal.type} logging detected`,
        details: {
          loggingType: signal.type,
          framework: signal.framework,
          filesWithEvidence: signal.files.length,
        },
        evidenceReferences: signal.files.map(f => ({
          filePath: f.path,
          snippet: f.evidence,
        })),
        recommendation: 'Verify logging captures all security-relevant events including authentication, authorization failures, and administrative actions',
        aiModel: this.aiModel,
      });
    }

    if (frameworkUpper === 'ISO27001') {
      findings.push({
        controlId: 'A.12.4.1',
        framework: 'ISO27001',
        status: 'partial',
        confidenceLevel: signal.confidence,
        signalType: `logging_${signal.type}`,
        summary: 'Event logging implementation detected',
        details: {
          loggingType: signal.type,
        },
        evidenceReferences: signal.files.map(f => ({
          filePath: f.path,
          snippet: f.evidence,
        })),
        recommendation: 'Document log retention policy and ensure logs are protected from tampering',
        aiModel: this.aiModel,
      });
    }

    if (frameworkUpper === 'NIST' || frameworkUpper === 'NIST80053') {
      findings.push({
        controlId: 'AU-2',
        framework: 'NIST80053',
        status: 'partial',
        confidenceLevel: signal.confidence,
        signalType: `logging_${signal.type}`,
        summary: 'Audit event logging detected',
        details: {
          loggingType: signal.type,
          controlFamily: 'AU',
        },
        evidenceReferences: signal.files.map(f => ({
          filePath: f.path,
          snippet: f.evidence,
        })),
        recommendation: 'Define and document the list of auditable events per AU-2 requirements',
        aiModel: this.aiModel,
      });
    }

    return findings;
  }

  /**
   * Map access control signal to control findings
   */
  private mapAccessControlSignal(signal: AccessControlSignal, framework: string): ControlFinding[] {
    const findings: ControlFinding[] = [];
    const frameworkUpper = framework.toUpperCase();

    if (frameworkUpper === 'SOC2') {
      findings.push({
        controlId: 'CC6.3',
        framework: 'SOC2',
        status: 'partial',
        confidenceLevel: signal.confidence,
        signalType: `access_control_${signal.type}`,
        summary: `Access control mechanism detected (${signal.type})`,
        details: {
          accessControlType: signal.type,
          filesWithEvidence: signal.files.length,
        },
        evidenceReferences: signal.files.map(f => ({
          filePath: f.path,
          snippet: f.evidence,
        })),
        recommendation: 'Document access control matrix and verify least privilege principle is enforced',
        aiModel: this.aiModel,
      });
    }

    if (frameworkUpper === 'ISO27001') {
      findings.push({
        controlId: 'A.9.4.1',
        framework: 'ISO27001',
        status: 'partial',
        confidenceLevel: signal.confidence,
        signalType: `access_control_${signal.type}`,
        summary: 'Information access restriction detected',
        details: {
          accessControlType: signal.type,
        },
        evidenceReferences: signal.files.map(f => ({
          filePath: f.path,
          snippet: f.evidence,
        })),
        recommendation: 'Define and document access control policy aligned with business requirements',
        aiModel: this.aiModel,
      });
    }

    if (frameworkUpper === 'NIST' || frameworkUpper === 'NIST80053') {
      findings.push({
        controlId: 'AC-3',
        framework: 'NIST80053',
        status: 'partial',
        confidenceLevel: signal.confidence,
        signalType: `access_control_${signal.type}`,
        summary: 'Access enforcement mechanism detected',
        details: {
          accessControlType: signal.type,
          controlFamily: 'AC',
        },
        evidenceReferences: signal.files.map(f => ({
          filePath: f.path,
          snippet: f.evidence,
        })),
        recommendation: 'Document approved authorizations and verify enforcement at all access points',
        aiModel: this.aiModel,
      });
    }

    return findings;
  }

  /**
   * Map CI/CD signal to control findings
   */
  private mapCICDSignal(signal: CICDSignal, framework: string): ControlFinding[] {
    const findings: ControlFinding[] = [];
    const frameworkUpper = framework.toUpperCase();

    const status: ControlStatus = signal.hasSecurityScanning ? 'partial' : 'fail';

    if (frameworkUpper === 'SOC2') {
      findings.push({
        controlId: 'CC8.1',
        framework: 'SOC2',
        status,
        confidenceLevel: signal.confidence,
        signalType: `cicd_${signal.type}`,
        summary: `CI/CD pipeline detected (${signal.type})`,
        details: {
          cicdType: signal.type,
          hasSecurityScanning: signal.hasSecurityScanning,
          hasSecretScanning: signal.hasSecretScanning,
          hasDependencyScanning: signal.hasDependencyScanning,
        },
        evidenceReferences: signal.files.map(f => ({
          filePath: f.path,
          snippet: f.evidence,
        })),
        recommendation: signal.hasSecurityScanning
          ? 'Document change management procedures and approval workflows'
          : 'Enable security scanning, secret detection, and dependency vulnerability scanning in CI/CD pipeline',
        aiModel: this.aiModel,
      });
    }

    if (frameworkUpper === 'ISO27001') {
      findings.push({
        controlId: 'A.14.2.2',
        framework: 'ISO27001',
        status,
        confidenceLevel: signal.confidence,
        signalType: `cicd_${signal.type}`,
        summary: 'System change control procedures detected',
        details: {
          cicdType: signal.type,
        },
        evidenceReferences: signal.files.map(f => ({
          filePath: f.path,
          snippet: f.evidence,
        })),
        recommendation: 'Formalize change control procedures with approval gates and testing requirements',
        aiModel: this.aiModel,
      });
    }

    if (frameworkUpper === 'NIST' || frameworkUpper === 'NIST80053') {
      findings.push({
        controlId: 'CM-3',
        framework: 'NIST80053',
        status,
        confidenceLevel: signal.confidence,
        signalType: `cicd_${signal.type}`,
        summary: 'Configuration change control detected',
        details: {
          cicdType: signal.type,
          controlFamily: 'CM',
        },
        evidenceReferences: signal.files.map(f => ({
          filePath: f.path,
          snippet: f.evidence,
        })),
        recommendation: 'Document change control process including authorization, documentation, and testing procedures',
        aiModel: this.aiModel,
      });
    }

    return findings;
  }

  /**
   * Generate recommendation for authentication findings
   */
  private generateAuthRecommendation(signal: AuthSignal): string {
    switch (signal.type) {
      case 'jwt':
        return 'Verify JWT tokens use strong signing algorithms (HS256+ or RS256), include expiration, and are properly validated on all endpoints';
      case 'oauth':
        return 'Document OAuth 2.0 flows, verify PKCE is used for public clients, and ensure proper token storage';
      case 'session':
        return 'Verify sessions use secure, HTTPOnly, SameSite cookies with appropriate timeout and rotation';
      case 'mfa':
        return 'Document MFA enrollment process,backup codes, and ensure MFA is enforced for privileged accounts';
      case 'saml':
        return 'Document SAML configuration, verify signature validation, and ensure proper certificate management';
      default:
        return 'Document authentication mechanism and verify it meets security best practices';
    }
  }

  /**
   * Generate recommendation for encryption findings
   */
  private generateEncryptionRecommendation(signal: EncryptionSignal): string {
    switch (signal.type) {
      case 'at_rest':
        return 'Document encryption key management, verify AES-256 or stronger is used, and implement key rotation';
      case 'in_transit':
        return 'Verify TLS 1.2+ is enforced, weak ciphers are disabled, and certificate management is documented';
      case 'hashing':
        return 'Ensure strong hashing algorithms (bcrypt, argon2, or PBKDF2) are used for passwords with appropriate work factors';
      case 'key_management':
        return 'Document key generation, storage, rotation, and destruction procedures. Consider using HSM or KMS';
      default:
        return 'Document cryptographic implementation and verify compliance with industry standards (FIPS 140-2/3)';
    }
  }
}

export const controlMappingService = new ControlMappingService();

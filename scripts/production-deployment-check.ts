#!/usr/bin/env tsx

/**
 * Production Deployment Readiness Check
 * Validates all requirements for SOC 2 compliant production deployment
 */

import { generateComplianceReport } from './validate-compliance';
import { validateEncryption } from './encrypt-existing-data';
import { logger } from '../server/utils/logger';

interface DeploymentCheck {
  name: string;
  status: 'ready' | 'warning' | 'blocked';
  message: string;
  action?: string;
}

async function checkEnvironmentVariables(): Promise<DeploymentCheck> {
  const required = ['DATABASE_URL', 'SESSION_SECRET', 'ENCRYPTION_KEY'];
  const envMap = new Map(Object.entries(process.env));
  const missing = required.filter(key => !envMap.get(key));

  if (missing.length === 0) {
    return {
      name: 'Environment Variables',
      status: 'ready',
      message: 'All required environment variables configured'
    };
  }

  return {
    name: 'Environment Variables',
    status: 'blocked',
    message: `Missing required variables: ${missing.join(', ')}`,
    action: 'Configure missing environment variables before deployment'
  };
}

async function checkDatabaseConnection(): Promise<DeploymentCheck> {
  try {
    const { db } = await import('../server/db');
    await db.execute('SELECT 1');
    
    return {
      name: 'Database Connection',
      status: 'ready',
      message: 'Database connection successful'
    };
  } catch (error: any) {
    return {
      name: 'Database Connection',
      status: 'blocked',
      message: `Database connection failed: ${error.message}`,
      action: 'Verify DATABASE_URL and database availability'
    };
  }
}

async function checkEncryptionReadiness(): Promise<DeploymentCheck> {
  try {
    const isValid = await validateEncryption();
    
    if (isValid) {
      return {
        name: 'Encryption Service',
        status: 'ready',
        message: 'Encryption service validated and operational'
      };
    }

    return {
      name: 'Encryption Service',
      status: 'blocked',
      message: 'Encryption validation failed',
      action: 'Verify ENCRYPTION_KEY configuration and run validation'
    };
  } catch (error: any) {
    return {
      name: 'Encryption Service',
      status: 'blocked',
      message: `Encryption check failed: ${error.message}`,
      action: 'Generate and configure ENCRYPTION_KEY: npm run security:generate-key'
    };
  }
}

async function checkComplianceStatus(): Promise<DeploymentCheck> {
  try {
    const report = await generateComplianceReport();
    
    if (report.status === 'compliant' || (report.status === 'conditional' && report.overallScore >= 80)) {
      return {
        name: 'SOC 2 Compliance',
        status: 'ready',
        message: `Compliance score: ${report.overallScore}% - ${report.status}`
      };
    }

    return {
      name: 'SOC 2 Compliance',
      status: 'warning',
      message: `Compliance score: ${report.overallScore}% - ${report.status}`,
      action: 'Address compliance issues identified in validation report'
    };
  } catch (error: any) {
    return {
      name: 'SOC 2 Compliance',
      status: 'blocked',
      message: `Compliance validation failed: ${error.message}`,
      action: 'Run compliance validation: npm run compliance:validate'
    };
  }
}

async function checkSecurityConfiguration(): Promise<DeploymentCheck> {
  const checks = [
    process.env.NODE_ENV === 'production',
    process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32,
    process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length === 64
  ];

  const passedChecks = checks.filter(Boolean).length;
  const totalChecks = checks.length;

  if (passedChecks === totalChecks) {
    return {
      name: 'Security Configuration',
      status: 'ready',
      message: 'All security configurations validated'
    };
  }

  return {
    name: 'Security Configuration',
    status: 'warning',
    message: `${passedChecks}/${totalChecks} security checks passed`,
    action: 'Review environment configuration for production deployment'
  };
}

async function main() {
  console.log('🚀 ComplianceAI Production Deployment Readiness Check');
  console.log('===================================================\n');

  const checks = await Promise.all([
    checkEnvironmentVariables(),
    checkDatabaseConnection(),
    checkEncryptionReadiness(),
    checkComplianceStatus(),
    checkSecurityConfiguration()
  ]);

  const ready = checks.filter(c => c.status === 'ready').length;
  const warnings = checks.filter(c => c.status === 'warning').length;
  const blocked = checks.filter(c => c.status === 'blocked').length;

  // Display results
  for (const check of checks) {
    const icon = check.status === 'ready' ? '✅' : 
                check.status === 'warning' ? '⚠️' : '❌';
    
    console.log(`${icon} ${check.name}: ${check.message}`);
    if (check.action) {
      console.log(`   Action: ${check.action}`);
    }
    console.log();
  }

  // Overall assessment
  console.log('📊 Deployment Readiness Summary:');
  console.log(`✅ Ready: ${ready}/${checks.length}`);
  console.log(`⚠️  Warnings: ${warnings}/${checks.length}`);
  console.log(`❌ Blocked: ${blocked}/${checks.length}\n`);

  if (blocked === 0 && warnings <= 1) {
    console.log('🎉 DEPLOYMENT APPROVED');
    console.log('System meets SOC 2 requirements and is ready for production deployment.');
    console.log('\nNext steps:');
    console.log('1. Deploy to production environment');
    console.log('2. Configure production environment variables');
    console.log('3. Run post-deployment validation');
    console.log('4. Monitor security metrics and audit logs');
  } else if (blocked === 0) {
    console.log('⚠️  CONDITIONAL DEPLOYMENT');
    console.log('System has minor warnings but can be deployed with caution.');
    console.log('Address warnings before handling sensitive production data.');
  } else {
    console.log('❌ DEPLOYMENT BLOCKED');
    console.log('Critical issues must be resolved before production deployment.');
    console.log('Address all blocked items and re-run this check.');
  }

  process.exit(blocked > 0 ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

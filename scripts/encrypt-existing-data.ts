#!/usr/bin/env tsx

/**
 * Data Migration Script: Encrypt Existing Company Profiles
 * This script encrypts sensitive fields in existing company profiles
 * for SOC 2 compliance data protection requirements.
 */

import { db } from '../server/db';
import { companyProfiles } from '../shared/schema';
import { encryptionService, DataClassification } from '../server/services/encryption';
import { logger } from '../server/utils/logger';
import { eq, sql } from 'drizzle-orm';

interface MigrationStats {
  totalProfiles: number;
  encrypted: number;
  skipped: number;
  errors: number;
}

async function encryptExistingCompanyProfiles(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalProfiles: 0,
    encrypted: 0,
    skipped: 0,
    errors: 0
  };

  try {
    logger.info('Starting data encryption migration for company profiles');
    
    // Fetch all company profiles that haven't been encrypted yet
    const profiles = await db
      .select()
      .from(companyProfiles)
      .where(sql`encryption_version IS NULL`);

    stats.totalProfiles = profiles.length;
    logger.info(`Found ${stats.totalProfiles} profiles to encrypt`);

    if (stats.totalProfiles === 0) {
      logger.info('No profiles found that need encryption');
      return stats;
    }

    for (const profile of profiles) {
      try {
        logger.info(`Encrypting profile ${profile.id}: ${profile.companyName}`);

        // Encrypt sensitive fields
        const encryptedCompanyName = profile.companyName 
          ? await encryptionService.encryptSensitiveField(
              profile.companyName, 
              DataClassification.CONFIDENTIAL
            )
          : null;

        const encryptedIndustry = profile.industry
          ? await encryptionService.encryptSensitiveField(
              profile.industry,
              DataClassification.INTERNAL
            )
          : null;

        const encryptedHeadquarters = profile.headquarters
          ? await encryptionService.encryptSensitiveField(
              profile.headquarters,
              DataClassification.CONFIDENTIAL
            )
          : null;

        // Update profile with encrypted data
        await db
          .update(companyProfiles)
          .set({
            companyNameEncrypted: encryptedCompanyName ? JSON.stringify(encryptedCompanyName) : null,
            industryEncrypted: encryptedIndustry ? JSON.stringify(encryptedIndustry) : null,
            headquartersEncrypted: encryptedHeadquarters ? JSON.stringify(encryptedHeadquarters) : null,
            encryptionVersion: 1,
            encryptedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(companyProfiles.id, profile.id));

        stats.encrypted++;
        logger.info(`✓ Successfully encrypted profile ${profile.id}`);

      } catch (error: any) {
        stats.errors++;
        logger.error(`✗ Failed to encrypt profile ${profile.id}`, {
          error: error.message,
          profileId: profile.id
        });
      }
    }

    logger.info('Data encryption migration completed', {
      total: stats.totalProfiles,
      encrypted: stats.encrypted,
      skipped: stats.skipped,
      errors: stats.errors,
      successRate: `${Math.round((stats.encrypted / stats.totalProfiles) * 100)}%`
    });

    return stats;

  } catch (error: any) {
    logger.error('Data encryption migration failed', { error: error.message });
    throw error;
  }
}

async function validateEncryption(): Promise<boolean> {
  try {
    logger.info('Validating encryption implementation');

    // Test encryption/decryption with sample data
    const testData = "ComplianceAI Test Company";
    const encrypted = await encryptionService.encryptSensitiveField(
      testData, 
      DataClassification.CONFIDENTIAL
    );
    
    const decrypted = await encryptionService.decryptSensitiveField(
      encrypted, 
      DataClassification.CONFIDENTIAL
    );

    if (decrypted === testData) {
      logger.info('✓ Encryption validation successful');
      return true;
    } else {
      logger.error('✗ Encryption validation failed: decrypted data does not match');
      return false;
    }

  } catch (error: any) {
    logger.error('✗ Encryption validation failed', { error: error.message });
    return false;
  }
}

async function main() {
  try {
    // Check if ENCRYPTION_KEY is available
    if (!process.env.ENCRYPTION_KEY) {
      console.error('❌ ENCRYPTION_KEY environment variable is required');
      console.log('Generate one with: openssl rand -hex 32');
      process.exit(1);
    }

    console.log('🔐 ComplianceAI Data Encryption Migration');
    console.log('========================================');
    
    // Validate encryption service
    const isValidEncryption = await validateEncryption();
    if (!isValidEncryption) {
      console.error('❌ Encryption validation failed. Aborting migration.');
      process.exit(1);
    }

    // Run the migration
    const stats = await encryptExistingCompanyProfiles();
    
    console.log('\n📊 Migration Results:');
    console.log(`✓ Total profiles processed: ${stats.totalProfiles}`);
    console.log(`✓ Successfully encrypted: ${stats.encrypted}`);
    console.log(`⚠ Skipped: ${stats.skipped}`);
    console.log(`❌ Errors: ${stats.errors}`);
    
    if (stats.errors > 0) {
      console.log('\n⚠️  Some profiles failed to encrypt. Check logs for details.');
      process.exit(1);
    }
    
    if (stats.encrypted > 0) {
      console.log('\n🎉 Data encryption migration completed successfully!');
      console.log('Your company profiles are now protected with AES-256-GCM encryption.');
    } else {
      console.log('\n✅ No profiles needed encryption (already encrypted or no data to encrypt).');
    }

  } catch (error: any) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { encryptExistingCompanyProfiles, validateEncryption };
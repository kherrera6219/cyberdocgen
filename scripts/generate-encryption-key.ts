#!/usr/bin/env tsx

/**
 * Encryption Key Generation Script
 * Generates a secure 32-byte (256-bit) encryption key for AES-256-GCM
 * This key should be stored securely in your environment variables.
 */

import crypto from 'crypto';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

function generateEncryptionKey(): string {
  // Generate a cryptographically secure 32-byte (256-bit) key
  const key = crypto.randomBytes(32).toString('hex');
  return key;
}

function main() {
  console.log('🔐 ComplianceAI Encryption Key Generator');
  console.log('=======================================\n');

  try {
    // Generate the encryption key
    const encryptionKey = generateEncryptionKey();
    
    console.log('✅ Generated 256-bit AES encryption key:');
    console.log(`ENCRYPTION_KEY=${encryptionKey}\n`);
    
    // Check if .env file exists
    const envPath = join(process.cwd(), '.env');
    const envExists = existsSync(envPath);
    
    if (envExists) {
      console.log('📝 To add this to your existing .env file:');
      console.log(`echo "ENCRYPTION_KEY=${encryptionKey}" >> .env\n`);
    } else {
      console.log('📝 To create a new .env file with this key:');
      console.log(`echo "ENCRYPTION_KEY=${encryptionKey}" > .env\n`);
    }
    
    // Security guidelines
    console.log('🔒 Security Guidelines:');
    console.log('- Store this key securely and never commit it to version control');
    console.log('- Use different keys for development, staging, and production');
    console.log('- Implement key rotation every 90 days for compliance');
    console.log('- Consider using a key management service for production\n');
    
    // Save to a secure file (optional)
    const keyFileName = `encryption-key-${Date.now()}.txt`;
    writeFileSync(keyFileName, `ENCRYPTION_KEY=${encryptionKey}\n`);
    console.log(`💾 Key saved to: ${keyFileName}`);
    console.log('⚠️  Remember to delete this file after setting up your environment!\n');
    
    // Validation
    console.log('🧪 Key Validation:');
    console.log(`- Length: ${encryptionKey.length} characters (64 hex chars = 32 bytes)`);
    console.log(`- Entropy: ${crypto.randomBytes(32).toString('hex').length === 64 ? '✅ High' : '❌ Low'}`);
    console.log(`- Format: ${/^[0-9a-f]{64}$/i.test(encryptionKey) ? '✅ Valid hex' : '❌ Invalid'}\n`);
    
    console.log('🚀 Next Steps:');
    console.log('1. Add the ENCRYPTION_KEY to your environment variables');
    console.log('2. Restart your application to load the new key');
    console.log('3. Run the data migration script to encrypt existing data');
    console.log('4. Test encryption functionality with the validation script');
    
  } catch (error: any) {
    console.error('❌ Failed to generate encryption key:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { generateEncryptionKey };
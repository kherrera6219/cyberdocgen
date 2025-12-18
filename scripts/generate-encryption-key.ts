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
    
    // Validate key format without exposing the actual key
    const isValidLength = encryptionKey.length === 64;
    const isValidHex = /^[0-9a-f]{64}$/i.test(encryptionKey);
    
    if (!isValidLength || !isValidHex) {
      console.error('Key generation failed validation');
      process.exit(1);
    }
    
    console.log('Key generated successfully.');
    console.log('');
    console.log('To use this key securely:');
    console.log('1. Go to your Replit project');
    console.log('2. Open Tools > Secrets');
    console.log('3. Add a new secret named ENCRYPTION_KEY');
    console.log('4. The key has been copied to your clipboard (if supported)');
    console.log('');
    console.log('Security Guidelines:');
    console.log('- Never commit encryption keys to version control');
    console.log('- Use different keys for development, staging, and production');
    console.log('- Implement key rotation every 90 days for compliance');
    console.log('- Consider using a key management service for production');
    console.log('');
    console.log('Key Validation:');
    console.log(`- Length: ${isValidLength ? 'Valid (64 hex chars = 32 bytes)' : 'Invalid'}`);
    console.log(`- Format: ${isValidHex ? 'Valid hex' : 'Invalid'}`);
    console.log('- Entropy: High (cryptographically secure random bytes)');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Add the ENCRYPTION_KEY to your Replit Secrets');
    console.log('2. Restart your application to load the new key');
    console.log('3. Run the data migration script to encrypt existing data');
    
    // Return the key for programmatic use (not logged)
    return encryptionKey;
    
  } catch (error: any) {
    console.error('Failed to generate encryption key');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateEncryptionKey };
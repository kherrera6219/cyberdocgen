import bcrypt from 'bcrypt';
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

const SALT_ROUNDS = 12;

interface TestAccount {
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
}

const testAccounts: TestAccount[] = [
  { email: 'betatester1@cyberdocgen.com', firstName: 'Beta', lastName: 'Tester1', role: 'user' },
  { email: 'betatester2@cyberdocgen.com', firstName: 'Beta', lastName: 'Tester2', role: 'user' },
  { email: 'betatester3@cyberdocgen.com', firstName: 'Beta', lastName: 'Tester3', role: 'user' },
  { email: 'kevin.herrera@cyberdocgen.com', firstName: 'Kevin', lastName: 'Herrera', role: 'admin' },
  { email: 'lucero.huante-frias@cyberdocgen.com', firstName: 'Lucero', lastName: 'Huante-Frias', role: 'admin' },
];

async function seedTestAccounts() {
  const password = process.env.BETA_TESTER_PASSWORD;
  
  if (!password) {
    console.error('Error: BETA_TESTER_PASSWORD environment variable is not set');
    console.error('Please set it before running this script:');
    console.error('  export BETA_TESTER_PASSWORD="YourSecurePassword"');
    process.exit(1);
  }

  console.log('Creating test accounts...\n');
  
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  for (const account of testAccounts) {
    try {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, account.email),
      });

      if (existingUser) {
        console.log(`Updating existing account: ${account.email} (${account.role})`);
        await db.update(users)
          .set({
            passwordHash,
            emailVerified: true,
            accountStatus: 'active',
            firstName: account.firstName,
            lastName: account.lastName,
            role: account.role,
            isActive: true,
            twoFactorEnabled: false,
            passkeyEnabled: false,
            failedLoginAttempts: 0,
            accountLockedUntil: null,
          })
          .where(eq(users.email, account.email));
      } else {
        console.log(`Creating new account: ${account.email} (${account.role})`);
        await db.insert(users).values({
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
          passwordHash,
          emailVerified: true,
          accountStatus: 'active',
          twoFactorEnabled: false,
          passkeyEnabled: false,
          role: account.role,
          isActive: true,
        });
      }
      console.log(`  Account ready for ${account.email}`);
    } catch (error) {
      console.error(`  Failed to create/update ${account.email}:`, error);
    }
  }

  console.log('\nTest accounts setup complete!');
  console.log('\nBeta Tester Accounts:');
  console.log('  betatester1@cyberdocgen.com, betatester2@cyberdocgen.com, betatester3@cyberdocgen.com');
  console.log('\nAdmin Accounts:');
  console.log('  kevin.herrera@cyberdocgen.com, lucero.huante-frias@cyberdocgen.com');
  console.log('\nPassword: (as set in BETA_TESTER_PASSWORD environment variable)');
  
  process.exit(0);
}

seedTestAccounts().catch((error) => {
  console.error('Failed to seed test accounts:', error);
  process.exit(1);
});

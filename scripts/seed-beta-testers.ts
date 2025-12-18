import bcrypt from 'bcrypt';
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

const SALT_ROUNDS = 12;

interface BetaTester {
  email: string;
  firstName: string;
  lastName: string;
}

const betaTesters: BetaTester[] = [
  { email: 'betatester1@cyberdocgen.com', firstName: 'Beta', lastName: 'Tester1' },
  { email: 'betatester2@cyberdocgen.com', firstName: 'Beta', lastName: 'Tester2' },
  { email: 'betatester3@cyberdocgen.com', firstName: 'Beta', lastName: 'Tester3' },
];

async function seedBetaTesters() {
  const password = process.env.BETA_TESTER_PASSWORD;
  
  if (!password) {
    console.error('Error: BETA_TESTER_PASSWORD environment variable is not set');
    console.error('Please set it before running this script:');
    console.error('  export BETA_TESTER_PASSWORD="YourSecurePassword"');
    process.exit(1);
  }

  console.log('Creating beta tester accounts...\n');
  
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  for (const tester of betaTesters) {
    try {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, tester.email),
      });

      if (existingUser) {
        console.log(`Updating existing account: ${tester.email}`);
        await db.update(users)
          .set({
            passwordHash,
            emailVerified: true,
            accountStatus: 'active',
            firstName: tester.firstName,
            lastName: tester.lastName,
            isActive: true,
            twoFactorEnabled: false,
            passkeyEnabled: false,
            failedLoginAttempts: 0,
            accountLockedUntil: null,
          })
          .where(eq(users.email, tester.email));
      } else {
        console.log(`Creating new account: ${tester.email}`);
        await db.insert(users).values({
          email: tester.email,
          firstName: tester.firstName,
          lastName: tester.lastName,
          passwordHash,
          emailVerified: true,
          accountStatus: 'active',
          twoFactorEnabled: false,
          passkeyEnabled: false,
          role: 'user',
          isActive: true,
        });
      }
      console.log(`  Account ready for ${tester.email}`);
    } catch (error) {
      console.error(`  Failed to create/update ${tester.email}:`, error);
    }
  }

  console.log('\nBeta tester accounts setup complete!');
  console.log('\nLogin credentials:');
  console.log('  Usernames: betatester1@cyberdocgen.com, betatester2@cyberdocgen.com, betatester3@cyberdocgen.com');
  console.log('  Password: (as set in BETA_TESTER_PASSWORD environment variable)');
  
  process.exit(0);
}

seedBetaTesters().catch((error) => {
  console.error('Failed to seed beta testers:', error);
  process.exit(1);
});

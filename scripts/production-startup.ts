
import { validateEnvironment } from '../server/utils/validation';
import { logger } from '../server/utils/logger';
import { performanceService } from '../server/services/performanceService';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

/**
 * Production startup validation and initialization
 */
async function productionStartup() {
  try {
    logger.info('Starting production validation...');

    // 1. Validate environment
    validateEnvironment();
    logger.info('✅ Environment validation passed');

    // 2. Test database connection
    await db.execute(sql`SELECT 1`);
    logger.info('✅ Database connection verified');

    // 3. Initialize performance monitoring (auto-initialized on service import)
    logger.info('✅ Performance monitoring initialized');

    // 4. Validate encryption setup
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY is required for production');
    }
    logger.info('✅ Encryption configuration verified');

    // 5. Check MFA configuration
    if (process.env.MFA_ENABLED === 'true' && !process.env.MFA_SECRET_KEY) {
      throw new Error('MFA_SECRET_KEY is required when MFA is enabled');
    }
    logger.info('✅ MFA configuration verified');

    logger.info('🚀 Production startup validation completed successfully');
    return true;

  } catch (error) {
    logger.error('❌ Production startup validation failed', { error: error.message });
    process.exit(1);
  }
}

if (require.main === module) {
  productionStartup();
}

export { productionStartup };

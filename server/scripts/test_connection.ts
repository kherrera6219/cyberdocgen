import { getRuntimeConfig } from '../config/runtime';
import { PostgresDbProvider } from '../providers/db/postgres';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config({ path: 'server/.env' });

async function testConnection() {
  logger.info('Testing database connection...');
  
  try {
    const config = getRuntimeConfig();
    
    console.log('Database connection string:', config.database.connection);

    if (!config.database.connection) {
      logger.error('Database connection string not found in runtime configuration.');
      process.exit(1);
    }
    
    const dbProvider = new PostgresDbProvider(config.database.connection);
    
    await dbProvider.connect();
    logger.info('Database connection successful!');
    
    await dbProvider.close();
    process.exit(0);
    
  } catch (error) {
    console.log('Caught an error:', error);
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();

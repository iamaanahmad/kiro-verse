#!/usr/bin/env tsx

/**
 * Analytics Database Migration Runner
 * 
 * This script sets up the analytics database schema and collections
 * Run with: npx tsx scripts/run-analytics-migration.ts
 */

// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

// Now import the migration functions
import { runAnalyticsMigration, checkAnalyticsMigrationStatus } from '../src/lib/firebase/migrations/analytics-migration';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'migrate';

  switch (command) {
    case 'migrate':
      console.log('🚀 Running analytics database migration...');
      await runAnalyticsMigration();
      break;
      
    case 'status':
      console.log('📊 Checking migration status...');
      await checkAnalyticsMigrationStatus();
      break;
      
    case 'help':
      console.log(`
Analytics Migration Tool

Usage:
  npx tsx scripts/run-analytics-migration.ts [command]

Commands:
  migrate    Run the analytics database migration (default)
  status     Check the current migration status
  help       Show this help message

Examples:
  npx tsx scripts/run-analytics-migration.ts migrate
  npx tsx scripts/run-analytics-migration.ts status
      `);
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Run with "help" for usage information');
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
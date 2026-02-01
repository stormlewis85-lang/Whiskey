/**
 * WhiskeyPedia Database Reset Script
 *
 * Clears all user data while preserving:
 * - Admin account (ID 5)
 * - Distilleries table (reference data)
 *
 * Run with: npx tsx server/reset-database.ts
 */

// Load environment variables first, before any other imports
import dotenv from 'dotenv';
dotenv.config();

// Now import database dependencies
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

const ADMIN_USER_ID = 5;

async function resetDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set in .env file');
  }

  console.log('Connecting to database...');
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle({ client: pool, schema });

  console.log('Starting database reset...');
  console.log(`Preserving admin account (ID: ${ADMIN_USER_ID})`);
  console.log('Preserving distilleries table');
  console.log('---');

  // Helper to safely truncate/delete from a table (handles if table doesn't exist)
  async function safeDelete(tableName: string) {
    try {
      await db.execute(sql.raw(`DELETE FROM ${tableName}`));
      console.log(`Cleared ${tableName}`);
    } catch (error: any) {
      if (error.code === '42P01') {
        console.log(`Skipped ${tableName} (table does not exist)`);
      } else {
        throw error;
      }
    }
  }

  try {
    // Step 1: Clear Rick House tables
    await safeDelete('generated_scripts');
    await safeDelete('tasting_sessions');

    // Step 2: Clear AI usage logs
    await safeDelete('ai_usage_logs');

    // Step 3: Clear blind tasting tables
    await safeDelete('blind_tasting_whiskeys');
    await safeDelete('blind_tastings');

    // Step 4: Clear flight tables
    await safeDelete('flight_whiskeys');
    await safeDelete('flights');

    // Step 5: Clear review social features
    await safeDelete('review_likes');
    await safeDelete('review_comments');

    // Step 6: Clear price tracking
    await safeDelete('market_values');
    await safeDelete('price_tracks');

    // Step 7: Clear all whiskeys
    await safeDelete('whiskeys');

    // Step 8: Clear follows
    await safeDelete('follows');

    // Step 9: Delete all users except admin
    console.log(`Deleting all users except admin (ID: ${ADMIN_USER_ID})...`);
    try {
      await db.execute(sql.raw(`DELETE FROM users WHERE id != ${ADMIN_USER_ID}`));
      console.log('Deleted non-admin users');
    } catch (error: any) {
      if (error.code === '42P01') {
        console.log('Skipped users (table does not exist)');
      } else {
        throw error;
      }
    }

    // Step 10: Reset admin profile to clean state
    console.log('Resetting admin profile...');
    try {
      await db.execute(sql.raw(`
        UPDATE users
        SET display_name = 'Admin',
            profile_image = NULL,
            bio = NULL,
            is_public = false,
            show_wishlist_on_profile = false
        WHERE id = ${ADMIN_USER_ID}
      `));
      console.log('Admin profile reset');
    } catch (error: any) {
      if (error.code === '42P01') {
        console.log('Skipped admin reset (table does not exist)');
      } else {
        throw error;
      }
    }

    // Verify the reset
    console.log('---');
    console.log('Verifying reset...');

    try {
      const userResult = await db.execute(sql.raw('SELECT COUNT(*) as count FROM users'));
      const whiskeyResult = await db.execute(sql.raw('SELECT COUNT(*) as count FROM whiskeys'));
      const distilleryResult = await db.execute(sql.raw('SELECT COUNT(*) as count FROM distilleries'));

      console.log(`Users remaining: ${(userResult.rows[0] as any).count}`);
      console.log(`Whiskeys remaining: ${(whiskeyResult.rows[0] as any).count}`);
      console.log(`Distilleries remaining: ${(distilleryResult.rows[0] as any).count}`);
    } catch (error: any) {
      console.log('Could not verify counts (some tables may not exist)');
    }

    console.log('---');
    console.log('Database reset complete!');
    console.log(`Admin account (ID: ${ADMIN_USER_ID}) preserved`);
    console.log('Distilleries table preserved');

    // Close connection
    await pool.end();

  } catch (error) {
    console.error('Error during database reset:', error);
    await pool.end();
    throw error;
  }
}

// Run the reset
resetDatabase()
  .then(() => {
    console.log('Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Reset failed:', error);
    process.exit(1);
  });

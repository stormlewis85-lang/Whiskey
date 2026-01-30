/**
 * Migration script to create tasting_sessions table for Rick House
 * Run with: npx tsx server/create-tasting-sessions-table.ts
 */

import 'dotenv/config';
import { db } from './db';
import { sql } from 'drizzle-orm';

async function createTastingSessionsTable() {
  console.log('Creating tasting_sessions table...');

  try {
    // Create tasting_session_mode enum if not exists
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tasting_session_mode') THEN
          CREATE TYPE tasting_session_mode AS ENUM('guided', 'notes');
        END IF;
      END $$;
    `);
    console.log('  - Enum tasting_session_mode created (or already exists)');

    // Create tasting_sessions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tasting_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        whiskey_id INTEGER NOT NULL REFERENCES whiskeys(id) ON DELETE CASCADE,
        mode tasting_session_mode DEFAULT 'guided' NOT NULL,
        script_json JSONB,
        audio_url TEXT,
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - Table tasting_sessions created (or already exists)');

    console.log('Done! tasting_sessions table is ready.');
  } catch (error) {
    console.error('Error creating tasting_sessions table:', error);
    process.exit(1);
  }

  process.exit(0);
}

createTastingSessionsTable();

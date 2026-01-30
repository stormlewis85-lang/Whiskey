/**
 * Migration script to create generated_scripts cache table for Rick House
 * Run with: npx tsx server/create-generated-scripts-table.ts
 */

import 'dotenv/config';
import { db } from './db';
import { sql } from 'drizzle-orm';

async function createGeneratedScriptsTable() {
  console.log('Creating generated_scripts table...');

  try {
    // Create generated_scripts table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS generated_scripts (
        id SERIAL PRIMARY KEY,
        whiskey_id INTEGER NOT NULL REFERENCES whiskeys(id) ON DELETE CASCADE,
        script_json JSONB NOT NULL,
        review_count_at_generation INTEGER NOT NULL DEFAULT 0,
        generated_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
      );
    `);
    console.log('  - Table generated_scripts created (or already exists)');

    // Create index for faster lookups by whiskey_id
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_generated_scripts_whiskey_id
      ON generated_scripts(whiskey_id);
    `);
    console.log('  - Index on whiskey_id created (or already exists)');

    console.log('Done! generated_scripts table is ready.');
  } catch (error) {
    console.error('Error creating generated_scripts table:', error);
    process.exit(1);
  }

  process.exit(0);
}

createGeneratedScriptsTable();

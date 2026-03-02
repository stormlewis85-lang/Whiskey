/**
 * FIX-001: Create the 5 missing database tables
 * Run with: npx tsx scripts/create-missing-tables.ts
 */
import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SQL_STATEMENTS = [
  // Create enums if they don't exist
  `DO $$ BEGIN
    CREATE TYPE blind_tasting_status AS ENUM ('active', 'revealed', 'completed');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;`,

  // 1. follows
  `CREATE TABLE IF NOT EXISTS "follows" (
    "id" serial PRIMARY KEY,
    "follower_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "following_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "created_at" timestamp DEFAULT now(),
    CONSTRAINT "unique_follow" UNIQUE("follower_id", "following_id")
  );`,

  // 2. flights
  `CREATE TABLE IF NOT EXISTS "flights" (
    "id" serial PRIMARY KEY,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "description" text,
    "tasting_date" date,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
  );`,

  // 3. flight_whiskeys
  `CREATE TABLE IF NOT EXISTS "flight_whiskeys" (
    "id" serial PRIMARY KEY,
    "flight_id" integer NOT NULL REFERENCES "flights"("id") ON DELETE CASCADE,
    "whiskey_id" integer NOT NULL REFERENCES "whiskeys"("id") ON DELETE CASCADE,
    "order" integer NOT NULL DEFAULT 0,
    "notes" text,
    "created_at" timestamp DEFAULT now()
  );`,

  // 4. blind_tastings
  `CREATE TABLE IF NOT EXISTS "blind_tastings" (
    "id" serial PRIMARY KEY,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "status" blind_tasting_status DEFAULT 'active',
    "created_at" timestamp DEFAULT now(),
    "revealed_at" timestamp,
    "completed_at" timestamp
  );`,

  // 5. blind_tasting_whiskeys
  `CREATE TABLE IF NOT EXISTS "blind_tasting_whiskeys" (
    "id" serial PRIMARY KEY,
    "blind_tasting_id" integer NOT NULL REFERENCES "blind_tastings"("id") ON DELETE CASCADE,
    "whiskey_id" integer NOT NULL REFERENCES "whiskeys"("id") ON DELETE CASCADE,
    "label" text NOT NULL,
    "order" integer NOT NULL DEFAULT 0,
    "blind_rating" real,
    "blind_notes" text,
    "revealed_at" timestamp,
    "created_at" timestamp DEFAULT now()
  );`,
];

async function main() {
  const client = await pool.connect();
  try {
    for (const sql of SQL_STATEMENTS) {
      const tableName = sql.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/)?.[1]
        || sql.match(/CREATE TYPE (\w+)/)?.[1]
        || 'enum';
      console.log(`Creating: ${tableName}...`);
      await client.query(sql);
      console.log(`  ✓ ${tableName} ready`);
    }

    // Verify all 5 tables exist
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('follows', 'flights', 'flight_whiskeys', 'blind_tastings', 'blind_tasting_whiskeys')
      ORDER BY table_name;
    `);

    console.log(`\nVerification: ${result.rows.length}/5 tables present`);
    for (const row of result.rows) {
      console.log(`  ✓ ${row.table_name}`);
    }

    if (result.rows.length === 5) {
      console.log('\nFIX-001 COMPLETE: All 5 missing tables created.');
    } else {
      console.error('\nWARNING: Some tables may be missing!');
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});

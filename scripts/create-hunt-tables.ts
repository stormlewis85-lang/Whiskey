/**
 * Create The Hunt tables: stores, store_follows, drops, notifications
 * Run with: npx tsx scripts/create-hunt-tables.ts
 */
import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SQL_STATEMENTS = [
  // Create drop_status enum if it doesn't exist
  `DO $$ BEGIN
    CREATE TYPE drop_status AS ENUM ('active', 'expired', 'sold_out');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;`,

  // 1. stores
  `CREATE TABLE IF NOT EXISTS "stores" (
    "id" serial PRIMARY KEY,
    "name" text NOT NULL,
    "location" text,
    "address" text,
    "instagram_handle" text,
    "latitude" real,
    "longitude" real,
    "is_verified" boolean DEFAULT false,
    "submitted_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
  );`,

  // 2. store_follows
  `CREATE TABLE IF NOT EXISTS "store_follows" (
    "id" serial PRIMARY KEY,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "store_id" integer NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
    "created_at" timestamp DEFAULT now(),
    CONSTRAINT "unique_store_follow" UNIQUE("user_id", "store_id")
  );`,

  // 3. drops
  `CREATE TABLE IF NOT EXISTS "drops" (
    "id" serial PRIMARY KEY,
    "store_id" integer NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
    "created_by" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "whiskey_name" text NOT NULL,
    "whiskey_type" text,
    "whiskey_id" integer REFERENCES "whiskeys"("id") ON DELETE SET NULL,
    "price" real,
    "status" drop_status DEFAULT 'active',
    "dropped_at" timestamp DEFAULT now(),
    "expires_at" timestamp,
    "notes" text,
    "created_at" timestamp DEFAULT now()
  );`,

  // 4. notifications
  `CREATE TABLE IF NOT EXISTS "notifications" (
    "id" serial PRIMARY KEY,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "type" text NOT NULL,
    "title" text NOT NULL,
    "message" text NOT NULL,
    "data" jsonb,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp DEFAULT now()
  );`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS "idx_stores_name" ON "stores" ("name");`,
  `CREATE INDEX IF NOT EXISTS "idx_drops_store" ON "drops" ("store_id");`,
  `CREATE INDEX IF NOT EXISTS "idx_drops_status" ON "drops" ("status");`,
  `CREATE INDEX IF NOT EXISTS "idx_drops_dropped_at" ON "drops" ("dropped_at");`,
  `CREATE INDEX IF NOT EXISTS "idx_notifications_user" ON "notifications" ("user_id");`,
  `CREATE INDEX IF NOT EXISTS "idx_notifications_unread" ON "notifications" ("user_id", "is_read") WHERE "is_read" = false;`,
];

async function main() {
  const client = await pool.connect();
  try {
    for (const sql of SQL_STATEMENTS) {
      const tableName = sql.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/)?.[1]
        || sql.match(/CREATE TYPE (\w+)/)?.[1]
        || sql.match(/CREATE INDEX.*"(\w+)"/)?.[1]
        || 'statement';
      console.log(`Creating: ${tableName}...`);
      await client.query(sql);
      console.log(`  ✓ ${tableName} ready`);
    }

    // Verify all 4 tables exist
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('stores', 'store_follows', 'drops', 'notifications')
      ORDER BY table_name;
    `);

    console.log(`\nVerification: ${result.rows.length}/4 tables present`);
    for (const row of result.rows) {
      console.log(`  ✓ ${row.table_name}`);
    }

    if (result.rows.length === 4) {
      console.log('\nThe Hunt tables created successfully.');
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

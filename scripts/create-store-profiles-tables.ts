/**
 * Phase 2: Store Profiles — schema extensions
 * Adds profile columns to stores, creates store_claims and store_views tables.
 * Run with: npx tsx scripts/create-store-profiles-tables.ts
 */
import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SQL_STATEMENTS = [
  // Create claim_status enum
  `DO $$ BEGIN
    CREATE TYPE claim_status AS ENUM ('pending', 'approved', 'rejected');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;`,

  // Add profile columns to stores table
  `ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "claimed_by" integer REFERENCES "users"("id") ON DELETE SET NULL;`,
  `ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "claimed_at" timestamp;`,
  `ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "description" text;`,
  `ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "phone" text;`,
  `ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "website" text;`,
  `ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "hours" text;`,
  `ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "cover_image" text;`,
  `ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "logo_image" text;`,

  // store_claims table
  `CREATE TABLE IF NOT EXISTS "store_claims" (
    "id" serial PRIMARY KEY,
    "store_id" integer NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "status" claim_status DEFAULT 'pending',
    "business_role" text,
    "verification_note" text,
    "review_note" text,
    "reviewed_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
    "created_at" timestamp DEFAULT now(),
    "reviewed_at" timestamp
  );`,

  // store_views table
  `CREATE TABLE IF NOT EXISTS "store_views" (
    "id" serial PRIMARY KEY,
    "store_id" integer NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
    "viewed_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
    "created_at" timestamp DEFAULT now()
  );`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS "idx_store_claims_store" ON "store_claims" ("store_id");`,
  `CREATE INDEX IF NOT EXISTS "idx_store_claims_status" ON "store_claims" ("status");`,
  `CREATE INDEX IF NOT EXISTS "idx_store_views_store" ON "store_views" ("store_id");`,
  `CREATE INDEX IF NOT EXISTS "idx_store_views_date" ON "store_views" ("store_id", "created_at");`,
  `CREATE INDEX IF NOT EXISTS "idx_stores_claimed_by" ON "stores" ("claimed_by");`,
];

async function main() {
  const client = await pool.connect();
  try {
    for (const sql of SQL_STATEMENTS) {
      const label = sql.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/)?.[1]
        || sql.match(/CREATE TYPE (\w+)/)?.[1]
        || sql.match(/CREATE INDEX.*"(\w+)"/)?.[1]
        || sql.match(/ADD COLUMN.*"(\w+)"/)?.[1]
        || 'statement';
      console.log(`Executing: ${label}...`);
      await client.query(sql);
      console.log(`  ✓ done`);
    }

    // Verify new tables
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('store_claims', 'store_views')
      ORDER BY table_name;
    `);

    console.log(`\nVerification: ${result.rows.length}/2 new tables present`);
    for (const row of result.rows) {
      console.log(`  ✓ ${row.table_name}`);
    }

    // Verify new columns on stores
    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'stores' AND column_name IN ('claimed_by', 'claimed_at', 'description', 'phone', 'website', 'hours', 'cover_image', 'logo_image')
      ORDER BY column_name;
    `);
    console.log(`\n${cols.rows.length}/8 new columns on stores table`);
    for (const row of cols.rows) {
      console.log(`  ✓ stores.${row.column_name}`);
    }

    console.log('\nPhase 2 Store Profiles migration complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});

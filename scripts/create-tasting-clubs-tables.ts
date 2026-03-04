/**
 * Phase 3: Tasting Clubs — schema creation
 * Creates clubs, club_members, club_sessions, club_session_whiskeys, club_session_ratings tables.
 * Run with: npx tsx scripts/create-tasting-clubs-tables.ts
 */
import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SQL_STATEMENTS = [
  // Create enums
  `DO $$ BEGIN
    CREATE TYPE club_role AS ENUM ('admin', 'member');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;`,

  `DO $$ BEGIN
    CREATE TYPE club_member_status AS ENUM ('invited', 'active', 'removed');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;`,

  `DO $$ BEGIN
    CREATE TYPE club_session_status AS ENUM ('draft', 'active', 'revealed', 'completed');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;`,

  // clubs table
  `CREATE TABLE IF NOT EXISTS "clubs" (
    "id" serial PRIMARY KEY,
    "name" text NOT NULL,
    "description" text,
    "created_by" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "is_private" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
  );`,

  // club_members table
  `CREATE TABLE IF NOT EXISTS "club_members" (
    "id" serial PRIMARY KEY,
    "club_id" integer NOT NULL REFERENCES "clubs"("id") ON DELETE CASCADE,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "role" club_role DEFAULT 'member',
    "status" club_member_status DEFAULT 'invited',
    "joined_at" timestamp,
    "created_at" timestamp DEFAULT now(),
    CONSTRAINT "unique_club_member" UNIQUE ("club_id", "user_id")
  );`,

  // club_sessions table
  `CREATE TABLE IF NOT EXISTS "club_sessions" (
    "id" serial PRIMARY KEY,
    "club_id" integer NOT NULL REFERENCES "clubs"("id") ON DELETE CASCADE,
    "created_by" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "description" text,
    "status" club_session_status DEFAULT 'draft',
    "scheduled_for" timestamp,
    "started_at" timestamp,
    "revealed_at" timestamp,
    "completed_at" timestamp,
    "created_at" timestamp DEFAULT now()
  );`,

  // club_session_whiskeys table
  `CREATE TABLE IF NOT EXISTS "club_session_whiskeys" (
    "id" serial PRIMARY KEY,
    "session_id" integer NOT NULL REFERENCES "club_sessions"("id") ON DELETE CASCADE,
    "whiskey_id" integer NOT NULL REFERENCES "whiskeys"("id") ON DELETE CASCADE,
    "label" text NOT NULL,
    "order" integer NOT NULL DEFAULT 0,
    "created_at" timestamp DEFAULT now()
  );`,

  // club_session_ratings table
  `CREATE TABLE IF NOT EXISTS "club_session_ratings" (
    "id" serial PRIMARY KEY,
    "session_whiskey_id" integer NOT NULL REFERENCES "club_session_whiskeys"("id") ON DELETE CASCADE,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "rating" real NOT NULL,
    "notes" text,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now(),
    CONSTRAINT "unique_session_whiskey_user" UNIQUE ("session_whiskey_id", "user_id")
  );`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS "idx_club_members_club" ON "club_members" ("club_id");`,
  `CREATE INDEX IF NOT EXISTS "idx_club_members_user" ON "club_members" ("user_id");`,
  `CREATE INDEX IF NOT EXISTS "idx_club_members_status" ON "club_members" ("status");`,
  `CREATE INDEX IF NOT EXISTS "idx_club_sessions_club" ON "club_sessions" ("club_id");`,
  `CREATE INDEX IF NOT EXISTS "idx_club_sessions_status" ON "club_sessions" ("status");`,
  `CREATE INDEX IF NOT EXISTS "idx_club_session_whiskeys_session" ON "club_session_whiskeys" ("session_id");`,
  `CREATE INDEX IF NOT EXISTS "idx_club_session_ratings_whiskey" ON "club_session_ratings" ("session_whiskey_id");`,
  `CREATE INDEX IF NOT EXISTS "idx_club_session_ratings_user" ON "club_session_ratings" ("user_id");`,
  `CREATE INDEX IF NOT EXISTS "idx_clubs_created_by" ON "clubs" ("created_by");`,
];

async function main() {
  const client = await pool.connect();
  try {
    for (const sql of SQL_STATEMENTS) {
      const label = sql.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/)?.[1]
        || sql.match(/CREATE TYPE (\w+)/)?.[1]
        || sql.match(/CREATE INDEX.*"(\w+)"/)?.[1]
        || 'statement';
      console.log(`Executing: ${label}...`);
      await client.query(sql);
      console.log(`  ✓ done`);
    }

    // Verify new tables
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('clubs', 'club_members', 'club_sessions', 'club_session_whiskeys', 'club_session_ratings')
      ORDER BY table_name;
    `);

    console.log(`\nVerification: ${result.rows.length}/5 new tables present`);
    for (const row of result.rows) {
      console.log(`  ✓ ${row.table_name}`);
    }

    console.log('\nPhase 3 Tasting Clubs migration complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});

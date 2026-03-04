import "dotenv/config";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Phase 3+4 enums
    console.log("Creating Phase 3+4 enums...");
    await client.query(`CREATE TYPE "public"."activity_type" AS ENUM('follow', 'add_bottle', 'review', 'like', 'trade_list', 'trade_complete')`);
    await client.query(`CREATE TYPE "public"."club_member_status" AS ENUM('invited', 'active', 'removed')`);
    await client.query(`CREATE TYPE "public"."club_role" AS ENUM('admin', 'member')`);
    await client.query(`CREATE TYPE "public"."club_session_status" AS ENUM('draft', 'active', 'revealed', 'completed')`);
    await client.query(`CREATE TYPE "public"."trade_status" AS ENUM('available', 'pending', 'completed', 'withdrawn')`);

    // Phase 3: Tasting Clubs
    console.log("Creating Phase 3 tables (clubs)...");
    await client.query(`
      CREATE TABLE "clubs" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "created_by" integer NOT NULL,
        "is_private" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);
    await client.query(`ALTER TABLE "clubs" ADD CONSTRAINT "clubs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action`);

    await client.query(`
      CREATE TABLE "club_members" (
        "id" serial PRIMARY KEY NOT NULL,
        "club_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "role" "club_role" DEFAULT 'member',
        "status" "club_member_status" DEFAULT 'invited',
        "joined_at" timestamp,
        "created_at" timestamp DEFAULT now(),
        CONSTRAINT "unique_club_member" UNIQUE("club_id","user_id")
      )
    `);
    await client.query(`ALTER TABLE "club_members" ADD CONSTRAINT "club_members_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action`);
    await client.query(`ALTER TABLE "club_members" ADD CONSTRAINT "club_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action`);

    await client.query(`
      CREATE TABLE "club_sessions" (
        "id" serial PRIMARY KEY NOT NULL,
        "club_id" integer NOT NULL,
        "created_by" integer NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "status" "club_session_status" DEFAULT 'draft',
        "scheduled_for" timestamp,
        "started_at" timestamp,
        "revealed_at" timestamp,
        "completed_at" timestamp,
        "created_at" timestamp DEFAULT now()
      )
    `);
    await client.query(`ALTER TABLE "club_sessions" ADD CONSTRAINT "club_sessions_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action`);
    await client.query(`ALTER TABLE "club_sessions" ADD CONSTRAINT "club_sessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action`);

    await client.query(`
      CREATE TABLE "club_session_whiskeys" (
        "id" serial PRIMARY KEY NOT NULL,
        "session_id" integer NOT NULL,
        "whiskey_id" integer NOT NULL,
        "label" text NOT NULL,
        "order" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now()
      )
    `);
    await client.query(`ALTER TABLE "club_session_whiskeys" ADD CONSTRAINT "club_session_whiskeys_session_id_club_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."club_sessions"("id") ON DELETE cascade ON UPDATE no action`);
    await client.query(`ALTER TABLE "club_session_whiskeys" ADD CONSTRAINT "club_session_whiskeys_whiskey_id_whiskeys_id_fk" FOREIGN KEY ("whiskey_id") REFERENCES "public"."whiskeys"("id") ON DELETE cascade ON UPDATE no action`);

    await client.query(`
      CREATE TABLE "club_session_ratings" (
        "id" serial PRIMARY KEY NOT NULL,
        "session_whiskey_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "rating" real NOT NULL,
        "notes" text,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "unique_session_whiskey_user" UNIQUE("session_whiskey_id","user_id")
      )
    `);
    await client.query(`ALTER TABLE "club_session_ratings" ADD CONSTRAINT "club_session_ratings_session_whiskey_id_club_session_whiskeys_id_fk" FOREIGN KEY ("session_whiskey_id") REFERENCES "public"."club_session_whiskeys"("id") ON DELETE cascade ON UPDATE no action`);
    await client.query(`ALTER TABLE "club_session_ratings" ADD CONSTRAINT "club_session_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action`);

    // Phase 4: Social Layer
    console.log("Creating Phase 4 tables (activities, trade_listings)...");
    await client.query(`
      CREATE TABLE "activities" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "type" "activity_type" NOT NULL,
        "target_user_id" integer,
        "whiskey_id" integer,
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now()
      )
    `);
    await client.query(`ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action`);
    await client.query(`ALTER TABLE "activities" ADD CONSTRAINT "activities_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action`);
    await client.query(`ALTER TABLE "activities" ADD CONSTRAINT "activities_whiskey_id_whiskeys_id_fk" FOREIGN KEY ("whiskey_id") REFERENCES "public"."whiskeys"("id") ON DELETE cascade ON UPDATE no action`);

    await client.query(`
      CREATE TABLE "trade_listings" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "whiskey_id" integer NOT NULL,
        "status" "trade_status" DEFAULT 'available',
        "seeking" text,
        "notes" text,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);
    await client.query(`ALTER TABLE "trade_listings" ADD CONSTRAINT "trade_listings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action`);
    await client.query(`ALTER TABLE "trade_listings" ADD CONSTRAINT "trade_listings_whiskey_id_whiskeys_id_fk" FOREIGN KEY ("whiskey_id") REFERENCES "public"."whiskeys"("id") ON DELETE cascade ON UPDATE no action`);

    // Phase 5: Palate Development enums
    console.log("Creating Phase 5 enums...");
    await client.query(`CREATE TYPE "public"."challenge_difficulty" AS ENUM('beginner', 'intermediate', 'advanced', 'expert')`);
    await client.query(`CREATE TYPE "public"."challenge_type" AS ENUM('blind_identify', 'flavor_hunt', 'review_streak', 'explore_type', 'community_challenge')`);
    await client.query(`CREATE TYPE "public"."user_challenge_status" AS ENUM('active', 'completed', 'abandoned', 'expired')`);

    // Phase 5: Palate Development tables
    console.log("Creating Phase 5 tables...");
    await client.query(`
      CREATE TABLE "challenges" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "description" text NOT NULL,
        "type" "challenge_type" NOT NULL,
        "difficulty" "challenge_difficulty" DEFAULT 'beginner' NOT NULL,
        "goal_count" integer DEFAULT 1 NOT NULL,
        "goal_details" jsonb,
        "xp_reward" integer DEFAULT 50 NOT NULL,
        "duration_days" integer,
        "is_active" boolean DEFAULT true NOT NULL,
        "is_recurring" boolean DEFAULT false NOT NULL,
        "created_at" timestamp DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE "user_challenges" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "challenge_id" integer NOT NULL,
        "progress" integer DEFAULT 0 NOT NULL,
        "status" "user_challenge_status" DEFAULT 'active' NOT NULL,
        "started_at" timestamp DEFAULT now(),
        "completed_at" timestamp,
        "metadata" jsonb
      )
    `);
    await client.query(`ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action`);
    await client.query(`ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action`);

    await client.query(`
      CREATE TABLE "user_progress" (
        "user_id" integer PRIMARY KEY NOT NULL,
        "xp" integer DEFAULT 0 NOT NULL,
        "level" integer DEFAULT 1 NOT NULL,
        "current_streak" integer DEFAULT 0 NOT NULL,
        "longest_streak" integer DEFAULT 0 NOT NULL,
        "last_activity_date" date,
        "total_reviews" integer DEFAULT 0 NOT NULL,
        "total_challenges_completed" integer DEFAULT 0 NOT NULL,
        "total_flavor_ids" integer DEFAULT 0 NOT NULL,
        "updated_at" timestamp DEFAULT now()
      )
    `);
    await client.query(`ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action`);

    await client.query(`
      CREATE TABLE "palate_exercises" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "title" text NOT NULL,
        "description" text NOT NULL,
        "exercise_type" text NOT NULL,
        "difficulty" "challenge_difficulty" DEFAULT 'beginner' NOT NULL,
        "instructions" jsonb NOT NULL,
        "target_flavors" jsonb,
        "whiskey_ids" jsonb,
        "is_completed" boolean DEFAULT false NOT NULL,
        "completed_at" timestamp,
        "user_notes" text,
        "created_at" timestamp DEFAULT now()
      )
    `);
    await client.query(`ALTER TABLE "palate_exercises" ADD CONSTRAINT "palate_exercises_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action`);

    await client.query("COMMIT");
    console.log("\nAll Phase 3-5 migrations applied successfully!");

    // Verify
    const result = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
    console.log(`\nTotal tables: ${result.rows.length}`);
    console.log(result.rows.map((r: any) => r.tablename).join(", "));

  } catch (e: any) {
    await client.query("ROLLBACK");
    console.error("Migration failed, rolled back:", e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();

CREATE TYPE "public"."challenge_difficulty" AS ENUM('beginner', 'intermediate', 'advanced', 'expert');--> statement-breakpoint
CREATE TYPE "public"."challenge_type" AS ENUM('blind_identify', 'flavor_hunt', 'review_streak', 'explore_type', 'community_challenge');--> statement-breakpoint
CREATE TYPE "public"."user_challenge_status" AS ENUM('active', 'completed', 'abandoned', 'expired');--> statement-breakpoint
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
);
--> statement-breakpoint
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
);
--> statement-breakpoint
CREATE TABLE "user_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"challenge_id" integer NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"status" "user_challenge_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"metadata" jsonb
);
--> statement-breakpoint
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
);
--> statement-breakpoint
ALTER TABLE "palate_exercises" ADD CONSTRAINT "palate_exercises_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
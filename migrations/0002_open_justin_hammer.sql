CREATE TYPE "public"."tasting_session_mode" AS ENUM('guided', 'notes');--> statement-breakpoint
CREATE TABLE "ai_usage_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"endpoint" text NOT NULL,
	"whiskey_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasting_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"whiskey_id" integer NOT NULL,
	"mode" "tasting_session_mode" DEFAULT 'guided' NOT NULL,
	"script_json" jsonb,
	"audio_url" text,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_whiskey_id_whiskeys_id_fk" FOREIGN KEY ("whiskey_id") REFERENCES "public"."whiskeys"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_sessions" ADD CONSTRAINT "tasting_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_sessions" ADD CONSTRAINT "tasting_sessions_whiskey_id_whiskeys_id_fk" FOREIGN KEY ("whiskey_id") REFERENCES "public"."whiskeys"("id") ON DELETE cascade ON UPDATE no action;
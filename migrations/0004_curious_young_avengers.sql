CREATE TYPE "public"."activity_type" AS ENUM('follow', 'add_bottle', 'review', 'like', 'trade_list', 'trade_complete');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."club_member_status" AS ENUM('invited', 'active', 'removed');--> statement-breakpoint
CREATE TYPE "public"."club_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."club_session_status" AS ENUM('draft', 'active', 'revealed', 'completed');--> statement-breakpoint
CREATE TYPE "public"."drop_status" AS ENUM('active', 'expired', 'sold_out');--> statement-breakpoint
CREATE TYPE "public"."trade_status" AS ENUM('available', 'pending', 'completed', 'withdrawn');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "activity_type" NOT NULL,
	"target_user_id" integer,
	"whiskey_id" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "club_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"club_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" "club_role" DEFAULT 'member',
	"status" "club_member_status" DEFAULT 'invited',
	"joined_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_club_member" UNIQUE("club_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "club_session_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_whiskey_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"rating" real NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_session_whiskey_user" UNIQUE("session_whiskey_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "club_session_whiskeys" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"whiskey_id" integer NOT NULL,
	"label" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
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
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" integer NOT NULL,
	"is_private" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drops" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"created_by" integer NOT NULL,
	"whiskey_name" text NOT NULL,
	"whiskey_type" text,
	"whiskey_id" integer,
	"price" real,
	"status" "drop_status" DEFAULT 'active',
	"dropped_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "store_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"status" "claim_status" DEFAULT 'pending',
	"business_role" text,
	"verification_note" text,
	"review_note" text,
	"reviewed_by" integer,
	"created_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "store_follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"store_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_store_follow" UNIQUE("user_id","store_id")
);
--> statement-breakpoint
CREATE TABLE "store_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"viewed_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"address" text,
	"instagram_handle" text,
	"latitude" real,
	"longitude" real,
	"is_verified" boolean DEFAULT false,
	"submitted_by" integer,
	"claimed_by" integer,
	"claimed_at" timestamp,
	"description" text,
	"phone" text,
	"website" text,
	"hours" text,
	"cover_image" text,
	"logo_image" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trade_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"whiskey_id" integer NOT NULL,
	"status" "trade_status" DEFAULT 'available',
	"seeking" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_whiskey_id_whiskeys_id_fk" FOREIGN KEY ("whiskey_id") REFERENCES "public"."whiskeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_session_ratings" ADD CONSTRAINT "club_session_ratings_session_whiskey_id_club_session_whiskeys_id_fk" FOREIGN KEY ("session_whiskey_id") REFERENCES "public"."club_session_whiskeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_session_ratings" ADD CONSTRAINT "club_session_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_session_whiskeys" ADD CONSTRAINT "club_session_whiskeys_session_id_club_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."club_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_session_whiskeys" ADD CONSTRAINT "club_session_whiskeys_whiskey_id_whiskeys_id_fk" FOREIGN KEY ("whiskey_id") REFERENCES "public"."whiskeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_sessions" ADD CONSTRAINT "club_sessions_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_sessions" ADD CONSTRAINT "club_sessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drops" ADD CONSTRAINT "drops_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drops" ADD CONSTRAINT "drops_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drops" ADD CONSTRAINT "drops_whiskey_id_whiskeys_id_fk" FOREIGN KEY ("whiskey_id") REFERENCES "public"."whiskeys"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_claims" ADD CONSTRAINT "store_claims_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_claims" ADD CONSTRAINT "store_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_claims" ADD CONSTRAINT "store_claims_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_follows" ADD CONSTRAINT "store_follows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_follows" ADD CONSTRAINT "store_follows_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_views" ADD CONSTRAINT "store_views_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_views" ADD CONSTRAINT "store_views_viewed_by_users_id_fk" FOREIGN KEY ("viewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_claimed_by_users_id_fk" FOREIGN KEY ("claimed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_listings" ADD CONSTRAINT "trade_listings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_listings" ADD CONSTRAINT "trade_listings_whiskey_id_whiskeys_id_fk" FOREIGN KEY ("whiskey_id") REFERENCES "public"."whiskeys"("id") ON DELETE cascade ON UPDATE no action;
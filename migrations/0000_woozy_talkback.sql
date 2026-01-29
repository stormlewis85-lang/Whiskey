CREATE TYPE "public"."blind_tasting_status" AS ENUM('active', 'revealed', 'completed');--> statement-breakpoint
CREATE TYPE "public"."bottle_status" AS ENUM('sealed', 'open', 'finished', 'gifted');--> statement-breakpoint
CREATE TABLE "blind_tasting_whiskeys" (
	"id" serial PRIMARY KEY NOT NULL,
	"blind_tasting_id" integer NOT NULL,
	"whiskey_id" integer NOT NULL,
	"label" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"blind_rating" real,
	"blind_notes" text,
	"revealed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "blind_tastings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"status" "blind_tasting_status" DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"revealed_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "flight_whiskeys" (
	"id" serial PRIMARY KEY NOT NULL,
	"flight_id" integer NOT NULL,
	"whiskey_id" integer NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "flights" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tasting_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"follower_id" integer NOT NULL,
	"following_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_follow" UNIQUE("follower_id","following_id")
);
--> statement-breakpoint
CREATE TABLE "market_values" (
	"id" serial PRIMARY KEY NOT NULL,
	"whiskey_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"retail_price" real,
	"secondary_value" real,
	"auction_value" real,
	"source" text,
	"date" date DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "price_tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"whiskey_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"price" real NOT NULL,
	"store" text,
	"location" text,
	"date" date DEFAULT now() NOT NULL,
	"url" text,
	"is_available" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "review_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"whiskey_id" integer NOT NULL,
	"review_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "review_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"whiskey_id" integer NOT NULL,
	"review_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_review_unique" UNIQUE("user_id","review_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"display_name" text,
	"email" text,
	"first_name" text,
	"last_name" text,
	"profile_image" text,
	"auth_token" text,
	"token_expiry" timestamp,
	"bio" text,
	"profile_slug" text,
	"is_public" boolean DEFAULT false,
	"show_wishlist_on_profile" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "username_unique" UNIQUE("username"),
	CONSTRAINT "email_unique" UNIQUE("email"),
	CONSTRAINT "profile_slug_unique" UNIQUE("profile_slug")
);
--> statement-breakpoint
CREATE TABLE "whiskeys" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"distillery" text,
	"type" text,
	"age" integer,
	"price" real,
	"abv" real,
	"proof" real,
	"region" text,
	"rating" real DEFAULT 0,
	"date_added" timestamp DEFAULT now(),
	"last_reviewed" timestamp,
	"release_date" date,
	"msrp" real,
	"price_paid" real,
	"image" text,
	"notes" jsonb DEFAULT '[]'::jsonb,
	"bottle_type" text,
	"mash_bill" text,
	"cask_strength" text,
	"finished" text,
	"finish_type" text,
	"is_wishlist" boolean DEFAULT false,
	"status" "bottle_status" DEFAULT 'sealed',
	"quantity" integer DEFAULT 1,
	"purchase_date" date,
	"purchase_location" text,
	"is_public" boolean DEFAULT false,
	"barcode" text,
	"upc" text,
	"user_id" integer
);
--> statement-breakpoint
ALTER TABLE "blind_tasting_whiskeys" ADD CONSTRAINT "blind_tasting_whiskeys_blind_tasting_id_blind_tastings_id_fk" FOREIGN KEY ("blind_tasting_id") REFERENCES "public"."blind_tastings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blind_tasting_whiskeys" ADD CONSTRAINT "blind_tasting_whiskeys_whiskey_id_whiskeys_id_fk" FOREIGN KEY ("whiskey_id") REFERENCES "public"."whiskeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blind_tastings" ADD CONSTRAINT "blind_tastings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_whiskeys" ADD CONSTRAINT "flight_whiskeys_flight_id_flights_id_fk" FOREIGN KEY ("flight_id") REFERENCES "public"."flights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_whiskeys" ADD CONSTRAINT "flight_whiskeys_whiskey_id_whiskeys_id_fk" FOREIGN KEY ("whiskey_id") REFERENCES "public"."whiskeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flights" ADD CONSTRAINT "flights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_values" ADD CONSTRAINT "market_values_whiskey_id_whiskeys_id_fk" FOREIGN KEY ("whiskey_id") REFERENCES "public"."whiskeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_values" ADD CONSTRAINT "market_values_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_tracks" ADD CONSTRAINT "price_tracks_whiskey_id_whiskeys_id_fk" FOREIGN KEY ("whiskey_id") REFERENCES "public"."whiskeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_tracks" ADD CONSTRAINT "price_tracks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_whiskey_id_whiskeys_id_fk" FOREIGN KEY ("whiskey_id") REFERENCES "public"."whiskeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_likes" ADD CONSTRAINT "review_likes_whiskey_id_whiskeys_id_fk" FOREIGN KEY ("whiskey_id") REFERENCES "public"."whiskeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_likes" ADD CONSTRAINT "review_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whiskeys" ADD CONSTRAINT "whiskeys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
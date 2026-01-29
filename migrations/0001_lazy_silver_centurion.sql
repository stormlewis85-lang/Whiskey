CREATE TABLE "distilleries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"country" text,
	"region" text,
	"type" text,
	"year_founded" integer,
	"parent_company" text,
	"website" text,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "whiskeys" ADD COLUMN "distillery_id" integer;--> statement-breakpoint
ALTER TABLE "whiskeys" ADD CONSTRAINT "whiskeys_distillery_id_distilleries_id_fk" FOREIGN KEY ("distillery_id") REFERENCES "public"."distilleries"("id") ON DELETE set null ON UPDATE no action;
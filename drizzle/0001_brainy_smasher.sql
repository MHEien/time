CREATE TABLE IF NOT EXISTS "acme_api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"key" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	CONSTRAINT "acme_api_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_key_user_idx" ON "acme_api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_key_key_idx" ON "acme_api_keys" USING btree ("key");
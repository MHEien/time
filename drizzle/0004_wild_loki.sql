ALTER TABLE "acme_users" DROP CONSTRAINT "acme_users_discord_id_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "user_discord_idx";--> statement-breakpoint
ALTER TABLE "acme_users" ADD COLUMN "provider" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "acme_users" ADD COLUMN "provider_id" varchar(255);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_provider_idx" ON "acme_users" USING btree ("provider_id");--> statement-breakpoint
ALTER TABLE "acme_users" DROP COLUMN IF EXISTS "discord_id";--> statement-breakpoint
ALTER TABLE "acme_users" ADD CONSTRAINT "acme_users_provider_id_unique" UNIQUE("provider_id");
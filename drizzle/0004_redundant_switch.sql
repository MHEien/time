CREATE TABLE IF NOT EXISTS "acme_github_commits" (
	"id" varchar(15) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"project_id" varchar(15),
	"message" text NOT NULL,
	"sha" varchar(40) NOT NULL,
	"created_at" timestamp NOT NULL,
	"github_url" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "acme_github_issues" (
	"id" varchar(15) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"project_id" varchar(15),
	"title" varchar(255) NOT NULL,
	"body" text,
	"status" varchar(20) NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"github_id" integer NOT NULL,
	"github_url" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "acme_github_pull_requests" (
	"id" varchar(15) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"project_id" varchar(15),
	"title" varchar(255) NOT NULL,
	"body" text,
	"status" varchar(20) NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"github_id" integer NOT NULL,
	"github_url" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "acme_oauth_accounts" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
DROP TABLE "acme_integration_tokens";--> statement-breakpoint
ALTER TABLE "acme_users" DROP CONSTRAINT "acme_users_provider_id_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "user_provider_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "oauth_account_user_idx" ON "acme_oauth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "oauth_account_provider_idx" ON "acme_oauth_accounts" USING btree ("provider");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_provider_unique_idx" ON "acme_oauth_accounts" USING btree ("user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "provider_id_unique_idx" ON "acme_oauth_accounts" USING btree ("provider","provider_id");--> statement-breakpoint
ALTER TABLE "acme_users" DROP COLUMN IF EXISTS "provider";--> statement-breakpoint
ALTER TABLE "acme_users" DROP COLUMN IF EXISTS "provider_id";
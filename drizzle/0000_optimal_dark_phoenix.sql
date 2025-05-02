CREATE TABLE IF NOT EXISTS "acme_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"activity_type" varchar(50) NOT NULL,
	"application_name" varchar(255),
	"window_title" varchar(255),
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"duration" interval,
	"project_id" varchar(15)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "acme_ai_suggested_events" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"suggested_start_time" timestamp with time zone NOT NULL,
	"suggested_end_time" timestamp with time zone NOT NULL,
	"priority" integer,
	"related_activity_id" varchar(15),
	"related_project_id" varchar(15),
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"feedback" text,
	"steps" text,
	"background" text,
	"challenges" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "acme_api_keys" (
	"id" varchar(15) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"key" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	CONSTRAINT "acme_api_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "acme_calendar_events" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"location" varchar(255),
	"is_all_day" boolean DEFAULT false,
	"recurrence_rule" text,
	"external_calendar_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "acme_email_verification_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"email" varchar(255) NOT NULL,
	"code" varchar(8) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "acme_email_verification_codes_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "acme_github_commits" (
	"id" varchar(15) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"project_id" varchar(15),
	"message" text NOT NULL,
	"sha" varchar(40) NOT NULL,
	"created_at" timestamp NOT NULL,
	"github_url" varchar(255) NOT NULL,
	CONSTRAINT "acme_github_commits_sha_user_id_unique" UNIQUE("sha","user_id")
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
	"github_id" bigint NOT NULL,
	"github_url" varchar(255) NOT NULL,
	CONSTRAINT "acme_github_issues_github_id_user_id_unique" UNIQUE("github_id","user_id")
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
	"github_id" bigint NOT NULL,
	"github_url" varchar(255) NOT NULL,
	CONSTRAINT "acme_github_pull_requests_github_id_user_id_unique" UNIQUE("github_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "acme_oauth_accounts" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"username" varchar(255),
	"provider" varchar(50) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "acme_password_reset_tokens" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "acme_posts" (
	"id" varchar(15) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"excerpt" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"status" varchar(10) DEFAULT 'draft' NOT NULL,
	"tags" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "acme_projects" (
	"id" varchar(15) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "acme_sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "acme_user_settings" (
	"user_id" varchar(21) PRIMARY KEY NOT NULL,
	"time_zone" varchar(50) DEFAULT 'UTC',
	"working_hours_start" time,
	"working_hours_end" time,
	"week_start_day" integer,
	"default_activity_tracking_enabled" boolean DEFAULT true,
	"default_calendar_sync_enabled" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "acme_users" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"hashed_password" varchar(255),
	"avatar" varchar(255),
	"stripe_subscription_id" varchar(191),
	"stripe_price_id" varchar(191),
	"stripe_customer_id" varchar(191),
	"stripe_current_period_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "acme_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "acme_wakatime_data" (
	"id" varchar(15) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"project_id" varchar(15),
	"language" varchar(50),
	"editor" varchar(50),
	"duration" interval,
	"recorded_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_user_idx" ON "acme_activities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_start_time_idx" ON "acme_activities" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_suggested_event_user_idx" ON "acme_ai_suggested_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_suggested_event_status_idx" ON "acme_ai_suggested_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_key_user_idx" ON "acme_api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_key_key_idx" ON "acme_api_keys" USING btree ("key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_event_user_idx" ON "acme_calendar_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_event_start_time_idx" ON "acme_calendar_events" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_code_user_idx" ON "acme_email_verification_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_code_email_idx" ON "acme_email_verification_codes" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_commits_user_id_idx" ON "acme_github_commits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_commits_project_id_idx" ON "acme_github_commits" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_issues_user_id_idx" ON "acme_github_issues" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_issues_project_id_idx" ON "acme_github_issues" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_pull_requests_user_id_idx" ON "acme_github_pull_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_pull_requests_project_id_idx" ON "acme_github_pull_requests" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "oauth_account_user_idx" ON "acme_oauth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "oauth_account_provider_idx" ON "acme_oauth_accounts" USING btree ("provider");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_provider_unique_idx" ON "acme_oauth_accounts" USING btree ("user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "provider_id_unique_idx" ON "acme_oauth_accounts" USING btree ("provider","provider_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "password_token_user_idx" ON "acme_password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_user_idx" ON "acme_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_created_at_idx" ON "acme_posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_user_idx" ON "acme_projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_user_idx" ON "acme_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_email_idx" ON "acme_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wakatime_data_user_idx" ON "acme_wakatime_data" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wakatime_data_recorded_at_idx" ON "acme_wakatime_data" USING btree ("recorded_at");
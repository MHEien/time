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
	"id" varchar(15) PRIMARY KEY NOT NULL,
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
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "acme_calendar_events" (
	"id" varchar(15) PRIMARY KEY NOT NULL,
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
CREATE TABLE IF NOT EXISTS "acme_integration_tokens" (
	"id" varchar(15) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"integration_type" varchar(50) NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp with time zone,
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
CREATE INDEX IF NOT EXISTS "calendar_event_user_idx" ON "acme_calendar_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_event_start_time_idx" ON "acme_calendar_events" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "integration_token_user_idx" ON "acme_integration_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "integration_token_type_idx" ON "acme_integration_tokens" USING btree ("integration_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_user_idx" ON "acme_projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wakatime_data_user_idx" ON "acme_wakatime_data" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wakatime_data_recorded_at_idx" ON "acme_wakatime_data" USING btree ("recorded_at");
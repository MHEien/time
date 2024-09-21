ALTER TABLE "acme_github_pull_requests" ALTER COLUMN "github_id" SET DATA TYPE bigint;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_commits_user_id_idx" ON "acme_github_commits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_commits_project_id_idx" ON "acme_github_commits" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_issues_user_id_idx" ON "acme_github_issues" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_issues_project_id_idx" ON "acme_github_issues" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_pull_requests_user_id_idx" ON "acme_github_pull_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_pull_requests_project_id_idx" ON "acme_github_pull_requests" USING btree ("project_id");--> statement-breakpoint
ALTER TABLE "acme_github_commits" ADD CONSTRAINT "acme_github_commits_sha_user_id_unique" UNIQUE("sha","user_id");--> statement-breakpoint
ALTER TABLE "acme_github_issues" ADD CONSTRAINT "acme_github_issues_github_id_user_id_unique" UNIQUE("github_id","user_id");--> statement-breakpoint
ALTER TABLE "acme_github_pull_requests" ADD CONSTRAINT "acme_github_pull_requests_github_id_user_id_unique" UNIQUE("github_id","user_id");
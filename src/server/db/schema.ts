import { relations } from "drizzle-orm";
import {
  pgTableCreator,
  serial,
  bigint,
  boolean,
  index,
  text,
  timestamp,
  varchar,
  time,
  integer,
  interval,
  uniqueIndex,
  unique,
} from "drizzle-orm/pg-core";
import { DATABASE_PREFIX as prefix } from "@/lib/constants";

export const pgTable = pgTableCreator((name) => `${prefix}_${name}`);

export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).unique().notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    hashedPassword: varchar("hashed_password", { length: 255 }),
    avatar: varchar("avatar", { length: 255 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 191 }),
    stripePriceId: varchar("stripe_price_id", { length: 191 }),
    stripeCustomerId: varchar("stripe_customer_id", { length: 191 }),
    stripeCurrentPeriodEnd: timestamp("stripe_current_period_end"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
  },
  (t) => ({
    emailIdx: index("user_email_idx").on(t.email),
  }),
);

export const oauthAccounts = pgTable(
  "oauth_accounts",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    userId: varchar("user_id", { length: 21 }).notNull(),
    username: varchar("username", { length: 255 }),
    provider: varchar("provider", { length: 50 }).notNull(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
  },
  (t) => ({
    userIdx: index("oauth_account_user_idx").on(t.userId),
    providerIdx: index("oauth_account_provider_idx").on(t.provider),
    userProviderUnique: uniqueIndex("user_provider_unique_idx").on(t.userId, t.provider),
    providerIdUnique: uniqueIndex("provider_id_unique_idx").on(t.provider, t.providerId),
  }),
);

export const oauthAccountRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userId],
    references: [users.id],
  }),
}));

export const userRelations = relations(users, ({ many }) => ({
  oauthAccounts: many(oauthAccounts),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type NewOAuthAccount = typeof oauthAccounts.$inferInsert;

export const sessions = pgTable(
  "sessions",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    userId: varchar("user_id", { length: 21 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => ({
    userIdx: index("session_user_idx").on(t.userId),
  }),
);

export const emailVerificationCodes = pgTable(
  "email_verification_codes",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 21 }).unique().notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    code: varchar("code", { length: 8 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => ({
    userIdx: index("verification_code_user_idx").on(t.userId),
    emailIdx: index("verification_code_email_idx").on(t.email),
  }),
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    userId: varchar("user_id", { length: 21 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => ({
    userIdx: index("password_token_user_idx").on(t.userId),
  }),
);

export const posts = pgTable(
  "posts",
  {
    id: varchar("id", { length: 15 }).primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    excerpt: varchar("excerpt", { length: 255 }).notNull(),
    content: text("content").notNull(),
    status: varchar("status", { length: 10, enum: ["draft", "published"] })
      .default("draft")
      .notNull(),
    tags: varchar("tags", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
  },
  (t) => ({
    userIdx: index("post_user_idx").on(t.userId),
    createdAtIdx: index("post_created_at_idx").on(t.createdAt),
  }),
);

export const postRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
}));

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;


export const apiKeys = pgTable(
  "api_keys",
  {
    id: varchar("id", { length: 15 }).primaryKey(),
    userId: varchar("user_id", { length: 21 }).notNull(),
    key: varchar("key", { length: 64 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: "date" }),
  },
  (t) => ({
    userIdx: index("api_key_user_idx").on(t.userId),
    keyIdx: index("api_key_key_idx").on(t.key),
  })
);

export const apiKeyRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));


export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

export const activities = pgTable(
  "activities",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 21 }).notNull(),
    activityType: varchar("activity_type", { length: 50 }).notNull(),
    applicationName: varchar("application_name", { length: 255 }),
    windowTitle: varchar("window_title", { length: 255 }),
    startTime: timestamp("start_time", { withTimezone: true, mode: "date" }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true, mode: "date" }),
    duration: interval("duration"),
    projectId: varchar("project_id", { length: 15 }),
  },
  (t) => ({
    userIdx: index("activity_user_idx").on(t.userId),
    startTimeIdx: index("activity_start_time_idx").on(t.startTime),
  }),
);

export const activityRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [activities.projectId],
    references: [projects.id],
  }),
}));

export const projects = pgTable(
  "projects",
  {
    id: varchar("id", { length: 15 }).primaryKey(),
    userId: varchar("user_id", { length: 21 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
  },
  (t) => ({
    userIdx: index("project_user_idx").on(t.userId),
  }),
);

export const projectRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  activities: many(activities),
}));

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    userId: varchar("user_id", { length: 21 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    startTime: timestamp("start_time", { withTimezone: true, mode: "date" }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true, mode: "date" }).notNull(),
    location: varchar("location", { length: 255 }),
    isAllDay: boolean("is_all_day").default(false),
    recurrenceRule: text("recurrence_rule"),
    externalCalendarId: varchar("external_calendar_id", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
  },
  (t) => ({
    userIdx: index("calendar_event_user_idx").on(t.userId),
    startTimeIdx: index("calendar_event_start_time_idx").on(t.startTime),
  }),
);

export const calendarEventRelations = relations(calendarEvents, ({ one }) => ({
  user: one(users, {
    fields: [calendarEvents.userId],
    references: [users.id],
  }),
}));

export const aiSuggestedEvents = pgTable(
  "ai_suggested_events",
  {
    id: varchar("id", { length: 30 }).primaryKey(),
    userId: varchar("user_id", { length: 21 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    suggestedStartTime: timestamp("suggested_start_time", { withTimezone: true, mode: "date" }).notNull(),
    suggestedEndTime: timestamp("suggested_end_time", { withTimezone: true, mode: "date" }).notNull(),
    priority: integer("priority"),
    relatedActivityId: varchar("related_activity_id", { length: 15 }),
    relatedProjectId: varchar("related_project_id", { length: 15 }),
    status: varchar("status", { length: 20, enum: ["pending", "accepted", "rejected"] }).default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(() => new Date()),
    feedback: text("feedback"),
    steps: text("steps"), 
    background: text("background"),
    challenges: text("challenges"),
  },
  (t) => ({
    userIdx: index("ai_suggested_event_user_idx").on(t.userId),
    statusIdx: index("ai_suggested_event_status_idx").on(t.status),
  }),
);

// The relations remain the same
export const aiSuggestedEventRelations = relations(aiSuggestedEvents, ({ one }) => ({
  user: one(users, {
    fields: [aiSuggestedEvents.userId],
    references: [users.id],
  }),
  activity: one(activities, {
    fields: [aiSuggestedEvents.relatedActivityId],
    references: [activities.id],
  }),
  project: one(projects, {
    fields: [aiSuggestedEvents.relatedProjectId],
    references: [projects.id],
  }),
}));

export const wakatimeData = pgTable(
  "wakatime_data",
  {
    id: varchar("id", { length: 15 }).primaryKey(),
    userId: varchar("user_id", { length: 21 }).notNull(),
    projectId: varchar("project_id", { length: 15 }),
    language: varchar("language", { length: 50 }),
    editor: varchar("editor", { length: 50 }),
    duration: interval("duration"),
    recordedAt: timestamp("recorded_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => ({
    userIdx: index("wakatime_data_user_idx").on(t.userId),
    recordedAtIdx: index("wakatime_data_recorded_at_idx").on(t.recordedAt),
  }),
);

export const wakatimeDataRelations = relations(wakatimeData, ({ one }) => ({
  user: one(users, {
    fields: [wakatimeData.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [wakatimeData.projectId],
    references: [projects.id],
  }),
}));

export const userSettings = pgTable(
  "user_settings",
  {
    userId: varchar("user_id", { length: 21 }).primaryKey(),
    timeZone: varchar("time_zone", { length: 50 }).default("UTC"),
    workingHoursStart: time("working_hours_start"),
    workingHoursEnd: time("working_hours_end"),
    weekStartDay: integer("week_start_day"),
    defaultActivityTrackingEnabled: boolean("default_activity_tracking_enabled").default(true),
    defaultCalendarSyncEnabled: boolean("default_calendar_sync_enabled").default(true),
  },
);

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));


export const githubIssues = pgTable("github_issues", {
  id: varchar("id", { length: 15 }).primaryKey(),
  userId: varchar("user_id", { length: 21 }).notNull(),
  projectId: varchar("project_id", { length: 15 }),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  status: varchar("status", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  githubId: bigint("github_id", { mode: 'bigint' }).notNull(),
  githubUrl: varchar("github_url", { length: 255 }).notNull(),
}, (table) => ({
  uniqueGithubIssue: unique().on(table.githubId, table.userId),
  userIdIdx: index("github_issues_user_id_idx").on(table.userId),
  projectIdIdx: index("github_issues_project_id_idx").on(table.projectId),
}));

export const githubPullRequests = pgTable("github_pull_requests", {
  id: varchar("id", { length: 15 }).primaryKey(),
  userId: varchar("user_id", { length: 21 }).notNull(),
  projectId: varchar("project_id", { length: 15 }),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  status: varchar("status", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  githubId: bigint("github_id", { mode: 'bigint' }).notNull(), // Changed to bigint for consistency
  githubUrl: varchar("github_url", { length: 255 }).notNull(),
}, (table) => ({
  uniqueGithubPR: unique().on(table.githubId, table.userId),
  userIdIdx: index("github_pull_requests_user_id_idx").on(table.userId),
  projectIdIdx: index("github_pull_requests_project_id_idx").on(table.projectId),
}));

export const githubCommits = pgTable("github_commits", {
  id: varchar("id", { length: 15 }).primaryKey(),
  userId: varchar("user_id", { length: 21 }).notNull(),
  projectId: varchar("project_id", { length: 15 }),
  message: text("message").notNull(),
  sha: varchar("sha", { length: 40 }).notNull(),
  createdAt: timestamp("created_at").notNull(),
  githubUrl: varchar("github_url", { length: 255 }).notNull(),
}, (table) => ({
  uniqueGithubCommit: unique().on(table.sha, table.userId),
  userIdIdx: index("github_commits_user_id_idx").on(table.userId),
  projectIdIdx: index("github_commits_project_id_idx").on(table.projectId),
}));

export const githubRelations = relations(githubIssues, ({ one }) => ({
  user: one(users, { fields: [githubIssues.userId], references: [users.id] }),
  project: one(projects, { fields: [githubIssues.projectId], references: [projects.id] }),
}));

export const githubPullRequestRelations = relations(githubPullRequests, ({ one }) => ({
  user: one(users, { fields: [githubPullRequests.userId], references: [users.id] }),
  project: one(projects, { fields: [githubPullRequests.projectId], references: [projects.id] }),
}));

export const githubCommitRelations = relations(githubCommits, ({ one }) => ({
  user: one(users, { fields: [githubCommits.userId], references: [users.id] }),
  project: one(projects, { fields: [githubCommits.projectId], references: [projects.id] }),
}));
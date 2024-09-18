import type { APIKeyTRPCContext, ProtectedTRPCContext } from "../../trpc";
import type {
  CreateActivityInput,
  DeleteActivityInput,
  GetActivityInput,
  ListActivitiesInput,
  UpdateActivityInput,
  GetDailyActivitySummaryInput,
  CreateActivityWithApiKeyInput,
} from "./activity.input";
import { activities } from "@/server/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";

export const listActivities = async (ctx: ProtectedTRPCContext, input: ListActivitiesInput) => {
  return ctx.db.query.activities.findMany({
    where: (table, { and, eq, gte, lte }) => {
      const conditions = [eq(table.userId, ctx.user.id)];
      if (input.startDate) {
        conditions.push(gte(table.startTime, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(table.startTime, new Date(input.endDate)));
      }
      return and(...conditions);
    },
    offset: (input.page - 1) * input.perPage,
    limit: input.perPage,
    orderBy: (table, { desc }) => [desc(table.startTime)],
  });
};

export const getActivity = async (ctx: ProtectedTRPCContext, { id }: GetActivityInput) => {
  return ctx.db.query.activities.findFirst({
    where: (table, { and, eq }) => and(eq(table.id, id), eq(table.userId, ctx.user.id)),
  });
};

export const createActivity = async (ctx: ProtectedTRPCContext, input: CreateActivityInput) => {
  const [activity] = await ctx.db.insert(activities).values({
    userId: ctx.user.id,
    activityType: input.activityType,
    applicationName: input.applicationName,
    windowTitle: input.windowTitle,
    startTime: new Date(input.startTime),
    endTime: input.endTime ? new Date(input.endTime) : undefined,
    duration: input.duration,
    projectId: input.projectId,
  }).returning();

  return activity;
};

export const updateActivity = async (ctx: ProtectedTRPCContext, input: UpdateActivityInput) => {
  const [activity] = await ctx.db
    .update(activities)
    .set({
      activityType: input.activityType,
      applicationName: input.applicationName,
      windowTitle: input.windowTitle,
      startTime: new Date(input.startTime),
      endTime: input.endTime ? new Date(input.endTime) : undefined,
      duration: input.duration,
      projectId: input.projectId,
    })
    .where(and(eq(activities.id, input.id), eq(activities.userId, ctx.user.id)))
    .returning();

  return activity;
};

export const deleteActivity = async (ctx: ProtectedTRPCContext, { id }: DeleteActivityInput) => {
  const [activity] = await ctx.db
    .delete(activities)
    .where(and(eq(activities.id, id), eq(activities.userId, ctx.user.id)))
    .returning();

  return activity;
};

export const getDailyActivitySummary = async (ctx: ProtectedTRPCContext, input: GetDailyActivitySummaryInput) => {
  const startOfDay = new Date(input.date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(input.date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await ctx.db
    .select({
      activityType: activities.activityType,
      totalDuration: sql<string>`sum(${activities.duration})`.as('totalDuration'),
    })
    .from(activities)
    .where(
      and(
        eq(activities.userId, ctx.user.id),
        gte(activities.startTime, startOfDay),
        lte(activities.startTime, endOfDay)
      )
    )
    .groupBy(activities.activityType);

  return result;
};

export const createActivityWithApiKey = async (ctx: APIKeyTRPCContext, input: CreateActivityWithApiKeyInput) => {
  const activity = await ctx.db.insert(activities).values({
    userId: ctx.user.id, // Use the user ID from the context
    activityType: input.activityType,
    applicationName: input.applicationName,
    windowTitle: input.windowTitle,
    startTime: new Date(input.startTime),
    endTime: input.endTime ? new Date(input.endTime) : undefined,
    duration: input.duration,
    projectId: input.projectId,
  }).returning();

  return activity;
};
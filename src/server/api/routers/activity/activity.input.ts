import { z } from "zod";

export const listActivitiesSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(12),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type ListActivitiesInput = z.infer<typeof listActivitiesSchema>;

export const getActivitySchema = z.object({
  id: z.number(),
});
export type GetActivityInput = z.infer<typeof getActivitySchema>;

export const createActivitySchema = z.object({
  activityType: z.string().max(50),
  applicationName: z.string().max(255).optional(),
  windowTitle: z.string().max(255).optional(),
  startTime: z.string(),
  endTime: z.string().optional(),
  duration: z.string().optional(),
  projectId: z.string().optional(),
});
export type CreateActivityInput = z.infer<typeof createActivitySchema>;

export const updateActivitySchema = createActivitySchema.extend({
  id: z.number(),
});
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;

export const deleteActivitySchema = z.object({
  id: z.number(),
});
export type DeleteActivityInput = z.infer<typeof deleteActivitySchema>;

export const getDailyActivitySummarySchema = z.object({
  date: z.string(),
});
export type GetDailyActivitySummaryInput = z.infer<typeof getDailyActivitySummarySchema>;

export const createActivityWithApiKeySchema = createActivitySchema.extend({
  activityType: z.string().max(50),
  applicationName: z.string().max(255).optional(),
  windowTitle: z.string().max(255).optional(),
  startTime: z.string(),
  endTime: z.string().optional(),
  duration: z.string().optional(),
  projectId: z.string().optional(),
});
export type CreateActivityWithApiKeyInput = z.infer<typeof createActivityWithApiKeySchema>;

export const myActivitiesSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(12),
});
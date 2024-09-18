import { z } from "zod";

export const getUserSettingsSchema = z.object({});
export type GetUserSettingsInput = z.infer<typeof getUserSettingsSchema>;

export const updateUserSettingsSchema = z.object({
  timeZone: z.string().max(50).optional(),
  workingHoursStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  workingHoursEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  weekStartDay: z.number().int().min(0).max(6).optional(),
  defaultActivityTrackingEnabled: z.boolean().optional(),
  defaultCalendarSyncEnabled: z.boolean().optional(),
});
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;

export const mySettingsSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(12),
});
export type MySettingsInput = z.infer<typeof mySettingsSchema>;
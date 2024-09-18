import { z } from "zod";

export const listCalendarEventsSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(12),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type ListCalendarEventsInput = z.infer<typeof listCalendarEventsSchema>;

export const getCalendarEventSchema = z.object({
  id: z.string(),
});
export type GetCalendarEventInput = z.infer<typeof getCalendarEventSchema>;

export const createCalendarEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().max(255).optional(),
  isAllDay: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
  externalCalendarId: z.string().max(255).optional(),
});
export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;

export const updateCalendarEventSchema = createCalendarEventSchema.extend({
  id: z.string(),
});
export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>;

export const deleteCalendarEventSchema = z.object({
  id: z.string(),
});
export type DeleteCalendarEventInput = z.infer<typeof deleteCalendarEventSchema>;

export const getCalendarEventsByDateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});
export type GetCalendarEventsByDateRangeInput = z.infer<typeof getCalendarEventsByDateRangeSchema>;

export const myCalendarEventsSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(12),
});
export type MyCalendarEventsInput = z.infer<typeof myCalendarEventsSchema>;
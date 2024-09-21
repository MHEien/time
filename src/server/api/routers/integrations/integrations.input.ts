import { z } from "zod";

export const myOutlookCalendarEventsSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(12),
});
export type myOutlookCalendarEventsInput = z.infer<typeof myOutlookCalendarEventsSchema>;

export const fetchOutlookCalendarEventsSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(12),
});
export type fetchOutlookCalendarEventsInput = z.infer<typeof fetchOutlookCalendarEventsSchema>;
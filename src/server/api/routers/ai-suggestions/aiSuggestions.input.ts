import { z } from "zod";

export const generateWorkScheduleSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(10),
});

export const myEventsSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(10),
});
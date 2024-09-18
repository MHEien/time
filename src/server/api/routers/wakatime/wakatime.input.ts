import { z } from "zod";

export const listWakatimeDataSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(10),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  projectId: z.string().optional(),
});
export type ListWakatimeDataInput = z.infer<typeof listWakatimeDataSchema>;

export const getWakatimeDataSchema = z.object({
  id: z.string(),
});
export type GetWakatimeDataInput = z.infer<typeof getWakatimeDataSchema>;

export const createWakatimeDataSchema = z.object({
  projectId: z.string().optional(),
  language: z.string().max(50).optional(),
  editor: z.string().max(50).optional(),
  duration: z.string(),
  recordedAt: z.string(),
});
export type CreateWakatimeDataInput = z.infer<typeof createWakatimeDataSchema>;

export const deleteWakatimeDataSchema = z.object({
  id: z.string(),
});
export type DeleteWakatimeDataInput = z.infer<typeof deleteWakatimeDataSchema>;

export const getWakatimeDataSummarySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  projectId: z.string().optional(),
});
export type GetWakatimeDataSummaryInput = z.infer<typeof getWakatimeDataSummarySchema>;

export const myWakatimeDataSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(12),
});
export type MyWakatimeDataInput = z.infer<typeof myWakatimeDataSchema>;
import { z } from "zod";

export const listAiSuggestedEventsSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(10),
  status: z.enum(["pending", "accepted", "rejected"]).optional(),
});
export type ListAiSuggestedEventsInput = z.infer<typeof listAiSuggestedEventsSchema>;

export const getAiSuggestedEventSchema = z.object({
  id: z.string(),
});
export type GetAiSuggestedEventInput = z.infer<typeof getAiSuggestedEventSchema>;

export const createAiSuggestedEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  suggestedStartTime: z.string(),
  suggestedEndTime: z.string(),
  priority: z.number().int().min(1).max(10).optional(),
  relatedActivityId: z.string().optional(),
  relatedProjectId: z.string().optional(),
  status: z.enum(["pending", "accepted", "rejected"]).optional(),
});
export type CreateAiSuggestedEventInput = z.infer<typeof createAiSuggestedEventSchema>;

export const updateAiSuggestedEventSchema = z.object({
  id: z.string(),
  status: z.enum(["pending", "accepted", "rejected"]),
});
export type UpdateAiSuggestedEventInput = z.infer<typeof updateAiSuggestedEventSchema>;

export const deleteAiSuggestedEventSchema = z.object({
  id: z.string(),
});
export type DeleteAiSuggestedEventInput = z.infer<typeof deleteAiSuggestedEventSchema>;

export const generateNextWeekEventsSchema = z.object({});
export type GenerateNextWeekEventsInput = z.infer<typeof generateNextWeekEventsSchema>;

export const myEventsSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(10),
});
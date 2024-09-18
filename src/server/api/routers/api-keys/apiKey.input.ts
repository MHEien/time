import { z } from "zod";

export const listApiKeysSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(10),
});
export type ListApiKeysInput = z.infer<typeof listApiKeysSchema>;

export const getApiKeySchema = z.object({
  id: z.number(),
});
export type GetApiKeyInput = z.infer<typeof getApiKeySchema>;

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(255),
});
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

export const updateApiKeySchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(255),
});
export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>;

export const deleteApiKeySchema = z.object({
  id: z.number(),
});
export type DeleteApiKeyInput = z.infer<typeof deleteApiKeySchema>;

export const myApiKeysSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(12),
});
export type MyApiKeysInput = z.infer<typeof myApiKeysSchema>;
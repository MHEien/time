import { z } from "zod";

export const listIntegrationTokensSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(10),
});
export type ListIntegrationTokensInput = z.infer<typeof listIntegrationTokensSchema>;

export const getIntegrationTokenSchema = z.object({
  id: z.string(),
});
export type GetIntegrationTokenInput = z.infer<typeof getIntegrationTokenSchema>;

export const createIntegrationTokenSchema = z.object({
  integrationType: z.string().max(50),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.string().optional(),
});
export type CreateIntegrationTokenInput = z.infer<typeof createIntegrationTokenSchema>;

export const updateIntegrationTokenSchema = z.object({
  id: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.string().optional(),
});
export type UpdateIntegrationTokenInput = z.infer<typeof updateIntegrationTokenSchema>;

export const deleteIntegrationTokenSchema = z.object({
  id: z.string(),
});
export type DeleteIntegrationTokenInput = z.infer<typeof deleteIntegrationTokenSchema>;
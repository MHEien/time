import { z } from "zod";

export const myOauthAccountsSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(12),
});
export type MyOauthAccountsInput = z.infer<typeof myOauthAccountsSchema>;

export const addOauthAccountSchema = z.object({
  userId: z.string(),
  username: z.string(),
  provider: z.string(),
  providerId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.string().optional(),
});
export type AddOauthAccountInput = z.infer<typeof addOauthAccountSchema>;

export const updateOauthAccountSchema = z.object({
  userId: z.string(),
  username: z.string(),
  provider: z.string(),
  providerId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.string().optional(),
});
export type UpdateOauthAccountInput = z.infer<typeof updateOauthAccountSchema>;

export const deleteOauthAccountSchema = z.object({
  userId: z.string(),
  providerId: z.string(),
});
export type DeleteOauthAccountInput = z.infer<typeof deleteOauthAccountSchema>;
import { z } from "zod";

export const myGithubPRsSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(12),
});
export type MyGithubPRsInput = z.infer<typeof myGithubPRsSchema>;

export const myGithubIssuesSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(12),
});
export type MyGithubIssuesInput = z.infer<typeof myGithubIssuesSchema>;

export const myGithubCommitsSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(12),
});
export type MyGithubCommitsInput = z.infer<typeof myGithubCommitsSchema>;

export const fetchGithubDataSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(12),
});
export type FetchGithubDataInput = z.infer<typeof fetchGithubDataSchema>;
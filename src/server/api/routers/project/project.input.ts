import { z } from "zod";

export const listProjectsSchema = z.object({
  page: z.number().int().default(1),
  perPage: z.number().int().default(12),
});
export type ListProjectsInput = z.infer<typeof listProjectsSchema>;

export const getProjectSchema = z.object({
  id: z.string(),
});
export type GetProjectInput = z.infer<typeof getProjectSchema>;

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.extend({
  id: z.string(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const deleteProjectSchema = z.object({
  id: z.string(),
});
export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;

export const getProjectActivitiesSchema = z.object({
  id: z.string(),
  page: z.number().int().default(1),
  perPage: z.number().int().default(12),
});
export type GetProjectActivitiesInput = z.infer<typeof getProjectActivitiesSchema>;
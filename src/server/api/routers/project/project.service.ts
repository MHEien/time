import { generateId } from "lucia";
import type { ProtectedTRPCContext } from "../../trpc";
import type {
  CreateProjectInput,
  DeleteProjectInput,
  GetProjectInput,
  ListProjectsInput,
  UpdateProjectInput,
  GetProjectActivitiesInput,
} from "./project.input";
import { projects, activities } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const listProjects = async (ctx: ProtectedTRPCContext, input: ListProjectsInput) => {
  return ctx.db.query.projects.findMany({
    where: (table, { eq }) => eq(table.userId, ctx.user.id),
    offset: (input.page - 1) * input.perPage,
    limit: input.perPage,
    orderBy: (table, { desc }) => desc(table.createdAt),
  });
};

export const getProject = async (ctx: ProtectedTRPCContext, { id }: GetProjectInput) => {
  return ctx.db.query.projects.findFirst({
    where: (table, { and, eq }) => and(eq(table.id, id), eq(table.userId, ctx.user.id)),
  });
};

export const createProject = async (ctx: ProtectedTRPCContext, input: CreateProjectInput) => {
  const id = generateId(15);

  const [project] = await ctx.db.insert(projects).values({
    id,
    userId: ctx.user.id,
    name: input.name,
    description: input.description,
  }).returning();

  return project;
};

export const updateProject = async (ctx: ProtectedTRPCContext, input: UpdateProjectInput) => {
  const [project] = await ctx.db
    .update(projects)
    .set({
      name: input.name,
      description: input.description,
    })
    .where(eq(projects.id, input.id))
    .returning();

  return project;
};

export const deleteProject = async (ctx: ProtectedTRPCContext, { id }: DeleteProjectInput) => {
  const [project] = await ctx.db.delete(projects).where(eq(projects.id, id)).returning();
  return project;
};

export const getProjectActivities = async (ctx: ProtectedTRPCContext, input: GetProjectActivitiesInput) => {
  return ctx.db.query.activities.findMany({
    where: (table, { and, eq }) => and(eq(table.projectId, input.id), eq(table.userId, ctx.user.id)),
    offset: (input.page - 1) * input.perPage,
    limit: input.perPage,
    orderBy: (table, { desc }) => desc(table.startTime),
  });
};
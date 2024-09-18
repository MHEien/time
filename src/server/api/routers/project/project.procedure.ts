import { createTRPCRouter, protectedProcedure } from "../../trpc";
import * as inputs from "./project.input";
import * as services from "./project.service";

export const projectRouter = createTRPCRouter({
  list: protectedProcedure
    .input(inputs.listProjectsSchema)
    .query(({ ctx, input }) => services.listProjects(ctx, input)),

  get: protectedProcedure
    .input(inputs.getProjectSchema)
    .query(({ ctx, input }) => services.getProject(ctx, input)),

  create: protectedProcedure
    .input(inputs.createProjectSchema)
    .mutation(({ ctx, input }) => services.createProject(ctx, input)),

  update: protectedProcedure
    .input(inputs.updateProjectSchema)
    .mutation(({ ctx, input }) => services.updateProject(ctx, input)),

  delete: protectedProcedure
    .input(inputs.deleteProjectSchema)
    .mutation(({ ctx, input }) => services.deleteProject(ctx, input)),

  getActivities: protectedProcedure
    .input(inputs.getProjectActivitiesSchema)
    .query(({ ctx, input }) => services.getProjectActivities(ctx, input)),
});
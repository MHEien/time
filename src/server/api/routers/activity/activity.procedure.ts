import { createTRPCRouter, protectedProcedure, apiKeyProcedure } from "../../trpc";
import * as inputs from "./activity.input";
import * as services from "./activity.service";

export const activityRouter = createTRPCRouter({
  list: protectedProcedure
    .input(inputs.listActivitiesSchema)
    .query(({ ctx, input }) => services.listActivities(ctx, input)),

  get: protectedProcedure
    .input(inputs.getActivitySchema)
    .query(({ ctx, input }) => services.getActivity(ctx, input)),

  create: protectedProcedure
    .input(inputs.createActivitySchema)
    .mutation(({ ctx, input }) => services.createActivity(ctx, input)),

  update: protectedProcedure
    .input(inputs.updateActivitySchema)
    .mutation(({ ctx, input }) => services.updateActivity(ctx, input)),

  delete: protectedProcedure
    .input(inputs.deleteActivitySchema)
    .mutation(({ ctx, input }) => services.deleteActivity(ctx, input)),

  getDailySummary: protectedProcedure
    .input(inputs.getDailyActivitySummarySchema)
    .query(({ ctx, input }) => services.getDailyActivitySummary(ctx, input)),

    createWithApiKey: apiKeyProcedure
    .input(inputs.createActivityWithApiKeySchema)
    .mutation(({ ctx, input }) => services.createActivityWithApiKey(ctx, input)),
    myActivities: protectedProcedure
    .input(inputs.myActivitiesSchema)
    .query(({ ctx }) => services.myActivities(ctx)),
});
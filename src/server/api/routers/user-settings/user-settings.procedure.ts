import { createTRPCRouter, protectedProcedure } from "../../trpc";
import * as inputs from "./user-settings.input";
import * as services from "./user-settings.service";

export const userSettingsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(inputs.getUserSettingsSchema)
    .query(({ ctx }) => services.getUserSettings(ctx)),

  update: protectedProcedure
    .input(inputs.updateUserSettingsSchema)
    .mutation(({ ctx, input }) => services.updateUserSettings(ctx, input)),
  mySettings: protectedProcedure
    .input(inputs.mySettingsSchema)
    .query(({ ctx }) => services.mySettings(ctx)),
});
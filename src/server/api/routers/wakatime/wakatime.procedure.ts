import { createTRPCRouter, protectedProcedure } from "../../trpc";
import * as inputs from "./wakatime.input";
import * as services from "./wakatime.service";

export const wakatimeDataRouter = createTRPCRouter({
  list: protectedProcedure
    .input(inputs.listWakatimeDataSchema)
    .query(({ ctx, input }) => services.listWakatimeData(ctx, input)),

  get: protectedProcedure
    .input(inputs.getWakatimeDataSchema)
    .query(({ ctx, input }) => services.getWakatimeData(ctx, input)),

  create: protectedProcedure
    .input(inputs.createWakatimeDataSchema)
    .mutation(({ ctx, input }) => services.createWakatimeData(ctx, input)),

  delete: protectedProcedure
    .input(inputs.deleteWakatimeDataSchema)
    .mutation(({ ctx, input }) => services.deleteWakatimeData(ctx, input)),

  getSummary: protectedProcedure
    .input(inputs.getWakatimeDataSummarySchema)
    .query(({ ctx, input }) => services.getWakatimeDataSummary(ctx, input)),
  myData: protectedProcedure
    .input(inputs.myWakatimeDataSchema)
    .query(({ ctx }) => services.myWakatimeData(ctx)),
});
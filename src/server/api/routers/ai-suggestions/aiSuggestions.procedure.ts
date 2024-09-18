import { createTRPCRouter, protectedProcedure } from "../../trpc";
import * as inputs from "./aiSuggestions.input";
import * as services from "./aiSuggestions.service";

export const aiSuggestedEventsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(inputs.listAiSuggestedEventsSchema)
    .query(({ ctx, input }) => services.listAiSuggestedEvents(ctx, input)),

  get: protectedProcedure
    .input(inputs.getAiSuggestedEventSchema)
    .query(({ ctx, input }) => services.getAiSuggestedEvent(ctx, input)),

  create: protectedProcedure
    .input(inputs.createAiSuggestedEventSchema)
    .mutation(({ ctx, input }) => services.createAiSuggestedEvent(ctx, input)),

  update: protectedProcedure
    .input(inputs.updateAiSuggestedEventSchema)
    .mutation(({ ctx, input }) => services.updateAiSuggestedEvent(ctx, input)),

  delete: protectedProcedure
    .input(inputs.deleteAiSuggestedEventSchema)
    .mutation(({ ctx, input }) => services.deleteAiSuggestedEvent(ctx, input)),
  generateNextWeekEvents: protectedProcedure
    .input(inputs.generateNextWeekEventsSchema)
    .mutation(({ ctx }) => services.generateNextWeekEvents(ctx)),
  myEvents: protectedProcedure
    .input(inputs.myEventsSchema)
    .query(({ ctx }) => services.myEvents(ctx)),
    
});
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import * as inputs from "./aiSuggestions.input";
import * as services from "./aiSuggestions.service";

export const aiSuggestedEventsRouter = createTRPCRouter({
  generateWorkSchedule: protectedProcedure
    .input(inputs.generateWorkScheduleSchema)
    .mutation(({ ctx }) => services.generateWorkSchedule(ctx)),
  myEvents: protectedProcedure
    .input(inputs.myEventsSchema)
    .query(({ ctx }) => services.myEvents(ctx)),
});
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import * as inputs from "./calendar.input";
import * as services from "./calendar.service";

export const calendarEventRouter = createTRPCRouter({
  list: protectedProcedure
    .input(inputs.listCalendarEventsSchema)
    .query(({ ctx, input }) => services.listCalendarEvents(ctx, input)),

  get: protectedProcedure
    .input(inputs.getCalendarEventSchema)
    .query(({ ctx, input }) => services.getCalendarEvent(ctx, input)),

  create: protectedProcedure
    .input(inputs.createCalendarEventSchema)
    .mutation(({ ctx, input }) => services.createCalendarEvent(ctx, input)),

  update: protectedProcedure
    .input(inputs.updateCalendarEventSchema)
    .mutation(({ ctx, input }) => services.updateCalendarEvent(ctx, input)),

  delete: protectedProcedure
    .input(inputs.deleteCalendarEventSchema)
    .mutation(({ ctx, input }) => services.deleteCalendarEvent(ctx, input)),

  getByDateRange: protectedProcedure
    .input(inputs.getCalendarEventsByDateRangeSchema)
    .query(({ ctx, input }) => services.getCalendarEventsByDateRange(ctx, input)),
  myEvents: protectedProcedure
    .input(inputs.myCalendarEventsSchema)
    .query(({ ctx }) => services.myCalendarEvents(ctx)),
});
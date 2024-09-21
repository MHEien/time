import { createTRPCRouter, protectedProcedure } from "../../trpc";
import * as inputs from "./integrations.input";
import * as services from "./integrations.service";

export const outlookCalendarRouter = createTRPCRouter({
  fetchEvents: protectedProcedure
    .input(inputs.fetchOutlookCalendarEventsSchema)
    .query(({ ctx }) => services.fetchOutlookCalendarEvents(ctx)),
});
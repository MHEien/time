import type { ProtectedTRPCContext } from "../../trpc";
import { calendarEvents, oauthAccounts } from "@/server/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { getUserCalendar } from "./m-graph";

export const fetchOutlookCalendarEvents = async (ctx: ProtectedTRPCContext) => {
  // Set date range for fetching events
  const startDate = new Date(new Date().setMonth(new Date().getMonth() - 2));
  const endDate = new Date(new Date().setDate(new Date().getDate() + 14));

  // Fetch access token from the database
  const accessToken = await ctx.db.query.oauthAccounts.findFirst({
    where: and(eq(oauthAccounts.userId, ctx.user.id), eq(oauthAccounts.provider, 'entraId')),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  if (!accessToken) throw new Error('No Outlook integration found');

  // Fetch events from the Outlook API
  const events = await getUserCalendar(accessToken.accessToken, ctx.user.email, startDate, endDate);

  if (!events.length) return { inserted: [], updated: [] };

  // Fetch existing events from the database within the same date range
  const existingEvents = await ctx.db.query.calendarEvents.findMany({
    where: and(
      eq(calendarEvents.userId, ctx.user.id),
      gte(calendarEvents.startTime, startDate),
      lte(calendarEvents.endTime, endDate)
    ),
    orderBy: (table, { desc }) => [desc(calendarEvents.startTime)],
  });

  // Prepare events to be inserted or updated
  const eventsToInsert = events.filter(event => !existingEvents.find(existingEvent => existingEvent.externalCalendarId === event.id));
  
  // Events to update (if their fields have changed)
  const eventsToUpdate = events.filter(event => {
    const existingEvent = existingEvents.find(existingEvent => existingEvent.externalCalendarId === event.id);
    return existingEvent && (
      existingEvent.title !== event.subject ||
      existingEvent.description !== event.bodyPreview ||
      existingEvent.startTime.toISOString() !== new Date(event.start.dateTime).toISOString() ||
      existingEvent.endTime.toISOString() !== new Date(event.end.dateTime).toISOString() ||
      existingEvent.location !== event.location?.displayName
    );
  });

  // Insert new events if needed
  if (eventsToInsert.length) {
    await ctx.db.insert(calendarEvents).values(
      eventsToInsert.map(event => ({
        id: event.id,
        userId: ctx.user.id,
        title: event.subject,
        description: event.bodyPreview,
        startTime: new Date(event.start.dateTime),
        endTime: new Date(event.end.dateTime),
        externalCalendarId: event.id,
        location: event.location?.displayName ?? '',
      }))
    );
  }

  // Update existing events if needed
  if (eventsToUpdate.length) {
    for (const event of eventsToUpdate) {
      await ctx.db.update(calendarEvents)
        .set({
          title: event.subject,
          description: event.bodyPreview,
          startTime: new Date(event.start.dateTime),
          endTime: new Date(event.end.dateTime),
          location: event.location?.displayName ?? '',
        })
        .where(eq(calendarEvents.externalCalendarId, event.id));
    }
  }

  return { inserted: eventsToInsert, updated: eventsToUpdate };
};

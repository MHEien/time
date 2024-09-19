import type { ProtectedTRPCContext } from "../../trpc";
import type {
  CreateCalendarEventInput,
  DeleteCalendarEventInput,
  GetCalendarEventInput,
  ListCalendarEventsInput,
  UpdateCalendarEventInput,
  GetCalendarEventsByDateRangeInput,
} from "./calendar.input";
import { calendarEvents } from "@/server/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";

export const listCalendarEvents = async (ctx: ProtectedTRPCContext, input: ListCalendarEventsInput) => {
  return ctx.db.query.calendarEvents.findMany({
    where: (table, { and, eq, gte, lte }) => {
      const conditions = [eq(table.userId, ctx.user.id)];
      if (input.startDate) {
        conditions.push(gte(table.startTime, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(table.endTime, new Date(input.endDate)));
      }
      return and(...conditions);
    },
    offset: (input.page - 1) * input.perPage,
    limit: input.perPage,
    orderBy: (table, { asc }) => [asc(table.startTime)],
  });
};

export const getCalendarEvent = async (ctx: ProtectedTRPCContext, { id }: GetCalendarEventInput) => {
  return ctx.db.query.calendarEvents.findFirst({
    where: (table, { and, eq }) => and(eq(table.id, id), eq(table.userId, ctx.user.id)),
  });
};

export const createCalendarEvent = async (ctx: ProtectedTRPCContext, input: CreateCalendarEventInput) => {
  const id = crypto.randomUUID();

  const [event] = await ctx.db.insert(calendarEvents).values({
    id,
    userId: ctx.user.id,
    title: input.title,
    description: input.description,
    startTime: new Date(input.startTime),
    endTime: new Date(input.endTime),
    location: input.location,
    isAllDay: input.isAllDay,
    recurrenceRule: input.recurrenceRule,
    externalCalendarId: input.externalCalendarId,
  }).returning();

  return event;
};

export const updateCalendarEvent = async (ctx: ProtectedTRPCContext, input: UpdateCalendarEventInput) => {
  const [event] = await ctx.db
    .update(calendarEvents)
    .set({
      title: input.title,
      description: input.description,
      startTime: new Date(input.startTime),
      endTime: new Date(input.endTime),
      location: input.location,
      isAllDay: input.isAllDay,
      recurrenceRule: input.recurrenceRule,
      externalCalendarId: input.externalCalendarId,
    })
    .where(and(eq(calendarEvents.id, input.id), eq(calendarEvents.userId, ctx.user.id)))
    .returning();

  return event;
};

export const deleteCalendarEvent = async (ctx: ProtectedTRPCContext, { id }: DeleteCalendarEventInput) => {
  const [event] = await ctx.db
    .delete(calendarEvents)
    .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, ctx.user.id)))
    .returning();

  return event;
};

export const getCalendarEventsByDateRange = async (ctx: ProtectedTRPCContext, input: GetCalendarEventsByDateRangeInput) => {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  const events = await ctx.db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.userId, ctx.user.id),
        gte(calendarEvents.startTime, startDate),
        lte(calendarEvents.startTime, endDate)
      )
    )
    .orderBy(calendarEvents.startTime);

  return events;
};

export const myCalendarEvents = async (ctx: ProtectedTRPCContext) => {
  return ctx.db.query.calendarEvents.findMany({
    where: eq(calendarEvents.userId, ctx.user.id),
    limit: 10,
    orderBy: (table, { desc }) => [desc(calendarEvents.startTime)],
  });
};
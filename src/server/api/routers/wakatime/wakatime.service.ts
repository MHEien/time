import { generateId } from "lucia";
import type { ProtectedTRPCContext } from "../../trpc";
import type {
  ListWakatimeDataInput,
  GetWakatimeDataInput,
  CreateWakatimeDataInput,
  DeleteWakatimeDataInput,
  GetWakatimeDataSummaryInput,
} from "./wakatime.input";
import { wakatimeData } from "@/server/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";

export const listWakatimeData = async (ctx: ProtectedTRPCContext, input: ListWakatimeDataInput) => {
  return ctx.db.query.wakatimeData.findMany({
    where: (table, { and, eq, gte, lte }) => {
      const conditions = [eq(table.userId, ctx.user.id)];
      if (input.startDate) {
        conditions.push(gte(table.recordedAt, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(table.recordedAt, new Date(input.endDate)));
      }
      if (input.projectId) {
        conditions.push(eq(table.projectId, input.projectId));
      }
      return and(...conditions);
    },
    limit: input.perPage,
    offset: (input.page - 1) * input.perPage,
    orderBy: (table, { desc }) => [desc(table.recordedAt)],
    columns: {
      id: true,
      projectId: true,
      language: true,
      editor: true,
      duration: true,
      recordedAt: true,
    },
  });
};

export const getWakatimeData = async (ctx: ProtectedTRPCContext, input: GetWakatimeDataInput) => {
  return ctx.db.query.wakatimeData.findFirst({
    where: (table, { and, eq }) => and(eq(table.id, input.id), eq(table.userId, ctx.user.id)),
  });
};

export const createWakatimeData = async (ctx: ProtectedTRPCContext, input: CreateWakatimeDataInput) => {
  const id = generateId(15);

  const [data] = await ctx.db.insert(wakatimeData).values({
    id,
    userId: ctx.user.id,
    projectId: input.projectId,
    language: input.language,
    editor: input.editor,
    duration: input.duration,
    recordedAt: new Date(input.recordedAt),
  }).returning();

  return data;
};

export const deleteWakatimeData = async (ctx: ProtectedTRPCContext, input: DeleteWakatimeDataInput) => {
  const [data] = await ctx.db
    .delete(wakatimeData)
    .where(and(eq(wakatimeData.id, input.id), eq(wakatimeData.userId, ctx.user.id)))
    .returning();

  return data;
};


export const getWakatimeDataSummary = async (ctx: ProtectedTRPCContext, input: GetWakatimeDataSummaryInput) => {
  const query = ctx.db.query.wakatimeData.findMany({
    where: (table, { and, eq, gte, lte }) => {
      const conditions = [
        eq(table.userId, ctx.user.id),
        gte(table.recordedAt, new Date(input.startDate)),
        lte(table.recordedAt, new Date(input.endDate))
      ];
      if (input.projectId) {
        conditions.push(eq(table.projectId, input.projectId));
      }
      return and(...conditions);
    },
    columns: {
      language: true,
      editor: true,
    },
    extras: {
      totalDuration: sql<string>`sum(${wakatimeData.duration})`.as('totalDuration'),
    },
    orderBy: (_, { desc }) => [desc(sql`totalDuration`)],
  });

  return query;
};

export const myWakatimeData = async (ctx: ProtectedTRPCContext) => {
  return ctx.db.query.wakatimeData.findMany({
    where: eq(wakatimeData.userId, ctx.user.id),
    limit: 10,
    orderBy: (table, { desc }) => [desc(wakatimeData.recordedAt)],
  });
};
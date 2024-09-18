import { generateId } from "lucia";
import type { ProtectedTRPCContext } from "../../trpc";
import type {
  ListIntegrationTokensInput,
  GetIntegrationTokenInput,
  CreateIntegrationTokenInput,
  UpdateIntegrationTokenInput,
  DeleteIntegrationTokenInput,
} from "./integration-tokens.input";
import { integrationTokens } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

export const listIntegrationTokens = async (ctx: ProtectedTRPCContext, input: ListIntegrationTokensInput) => {
  return ctx.db.query.integrationTokens.findMany({
    where: (table, { eq }) => eq(table.userId, ctx.user.id),
    limit: input.perPage,
    offset: (input.page - 1) * input.perPage,
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    columns: {
      id: true,
      integrationType: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const getIntegrationToken = async (ctx: ProtectedTRPCContext, input: GetIntegrationTokenInput) => {
  return ctx.db.query.integrationTokens.findFirst({
    where: (table, { and, eq }) => and(eq(table.id, input.id), eq(table.userId, ctx.user.id)),
  });
};

export const createIntegrationToken = async (ctx: ProtectedTRPCContext, input: CreateIntegrationTokenInput) => {
  const id = generateId(15);

  const [token] = await ctx.db.insert(integrationTokens).values({
    id,
    userId: ctx.user.id,
    integrationType: input.integrationType,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
  }).returning();

  return token;
};

export const updateIntegrationToken = async (ctx: ProtectedTRPCContext, input: UpdateIntegrationTokenInput) => {
  const [token] = await ctx.db
    .update(integrationTokens)
    .set({
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .where(and(eq(integrationTokens.id, input.id), eq(integrationTokens.userId, ctx.user.id)))
    .returning();

  return token;
};

export const deleteIntegrationToken = async (ctx: ProtectedTRPCContext, input: DeleteIntegrationTokenInput) => {
  const [token] = await ctx.db
    .delete(integrationTokens)
    .where(and(eq(integrationTokens.id, input.id), eq(integrationTokens.userId, ctx.user.id)))
    .returning();

  return token;
};
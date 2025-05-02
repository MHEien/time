import { generateId } from "lucia";
import type { ProtectedTRPCContext } from "../../trpc";
import type {
  CreateApiKeyInput,
  DeleteApiKeyInput,
  GetApiKeyInput,
  ListApiKeysInput,
  MyApiKeysInput,
  UpdateApiKeyInput,
} from "./apiKey.input";
import { apiKeys } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const listApiKeys = async (ctx: ProtectedTRPCContext, input: ListApiKeysInput) => {
  return ctx.db.query.apiKeys.findMany({
    where: (table, { eq }) => eq(table.userId, ctx.user.id),
    offset: (input.page - 1) * input.perPage,
    limit: input.perPage,
    orderBy: (table, { desc }) => desc(table.createdAt),
  });
};

export const getApiKey = async (ctx: ProtectedTRPCContext, { id }: GetApiKeyInput) => {
  return ctx.db.query.apiKeys.findFirst({
    where: (table, { and, eq }) => and(eq(table.id, id.toString()), eq(table.userId, ctx.user.id.toString())),
  });
};

export const createApiKey = async (ctx: ProtectedTRPCContext, input: CreateApiKeyInput) => {
  const id = generateId(15);
  const key = generateId(32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days

  const apiKey = await ctx.db.insert(apiKeys).values({
    id,
    userId: ctx.user.id,
    key,
    name: input.name,
    expiresAt,
  }).returning();

  return { ...apiKey, key }; // Return the key only on creation
};

export const updateApiKey = async (ctx: ProtectedTRPCContext, input: UpdateApiKeyInput) => {
  const [apiKey] = await ctx.db
    .update(apiKeys)
    .set({ name: input.name })
    .where(eq(apiKeys.id, input.id.toString()))
    .returning();

  return apiKey;
};

export const deleteApiKey = async (ctx: ProtectedTRPCContext, { id }: DeleteApiKeyInput) => {
  const [apiKey] = await ctx.db
    .delete(apiKeys)
    .where(eq(apiKeys.id, id.toString())) // Convert id to string to match the PgColumn type
    .returning();

  return apiKey;
};

export const myApiKeys = async (ctx: ProtectedTRPCContext, input: MyApiKeysInput) => {
  return ctx.db.query.apiKeys.findMany({
    where: (table, { eq }) => eq(table.userId, ctx.user.id),
    offset: (input.page - 1) * input.perPage,
    limit: input.perPage,
    orderBy: (table, { desc }) => desc(table.createdAt),
    columns: {
      id: true,
      name: true,
      key: true,
      expiresAt: true,
      lastUsedAt: true,
    },
  });
};
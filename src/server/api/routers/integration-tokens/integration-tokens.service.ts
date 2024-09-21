import { generateId } from "lucia";
import type { ProtectedTRPCContext } from "../../trpc";
import type {
  AddOauthAccountInput,
  UpdateOauthAccountInput,
  DeleteOauthAccountInput,
  MyOauthAccountsInput,
} from "./integration-tokens.input";
import { oauthAccounts } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

export const myOauthAccounts = async (ctx: ProtectedTRPCContext, input: MyOauthAccountsInput) => {
  return ctx.db.query.oauthAccounts.findMany({
    where: (table, { eq }) => eq(table.userId, ctx.user.id),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    limit: input.perPage,
    offset: (input.page - 1) * input.perPage,
    columns: {
      id: true,
      userId: true,
      username: true,
      provider: true,
      providerId: true,
      accessToken: true,
      refreshToken: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const addOauthAccount = async (ctx: ProtectedTRPCContext, input: AddOauthAccountInput) => {
  const [account] = await ctx.db.insert(oauthAccounts).values({
    id: generateId(21),
    userId: ctx.user.id,
    username: input.username,
    accessToken: input.accessToken,
    provider: input.provider,
    providerId: input.providerId,
    refreshToken: input.refreshToken ?? null,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
  }).returning();

  return account;
};

export const updateOauthAccount = async (ctx: ProtectedTRPCContext, input: UpdateOauthAccountInput) => {
  const [account] = await ctx.db
    .update(oauthAccounts)
    .set({
      ...input,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .where(and(eq(oauthAccounts.userId, ctx.user.id), eq(oauthAccounts.providerId, input.providerId)))
    .returning();
    
  return account;
};

export const deleteOauthAccount = async (ctx: ProtectedTRPCContext, input: DeleteOauthAccountInput) => {
  const [account] = await ctx.db
    .delete(oauthAccounts)
    .where(and(eq(oauthAccounts.userId, ctx.user.id), eq(oauthAccounts.providerId, input.providerId)))
    .returning();
    
  return account;
}
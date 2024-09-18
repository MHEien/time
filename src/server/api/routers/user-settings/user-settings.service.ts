import type { ProtectedTRPCContext } from "../../trpc";
import type { UpdateUserSettingsInput } from "./user-settings.input";
import { userSettings } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const getUserSettings = async (ctx: ProtectedTRPCContext) => {
  const settings = await ctx.db.query.userSettings.findFirst({
    where: (table, { eq }) => eq(table.userId, ctx.user.id),
  });

  return settings ?? { userId: ctx.user.id };
};

export const updateUserSettings = async (ctx: ProtectedTRPCContext, input: UpdateUserSettingsInput) => {
  const existingSettings = await ctx.db.query.userSettings.findFirst({
    where: (table, { eq }) => eq(table.userId, ctx.user.id),
  });

  if (existingSettings) {
    const [updatedSettings] = await ctx.db
      .update(userSettings)
      .set(input)
      .where(eq(userSettings.userId, ctx.user.id))
      .returning();

    return updatedSettings;
  } else {
    const [newSettings] = await ctx.db
      .insert(userSettings)
      .values({
        userId: ctx.user.id,
        ...input,
      })
      .returning();

    return newSettings;
  }
};

export const mySettings = async (ctx: ProtectedTRPCContext) => {
  const settings = await ctx.db.query.userSettings.findFirst({
    where: eq(userSettings.userId, ctx.user.id),
  });


  return settings;
};
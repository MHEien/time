import { createTRPCRouter, protectedProcedure } from "../../trpc";
import * as inputs from "./integration-tokens.input";
import * as services from "./integration-tokens.service";

export const integrationTokensRouter = createTRPCRouter({
  myOauthAccounts: protectedProcedure
    .input(inputs.myOauthAccountsSchema)
    .query(({ ctx, input }) => services.myOauthAccounts(ctx, input)),
  addOauthAccount: protectedProcedure
    .input(inputs.addOauthAccountSchema)
    .mutation(({ ctx, input }) => services.addOauthAccount(ctx, input)),
  updateOauthAccount: protectedProcedure
    .input(inputs.updateOauthAccountSchema)
    .mutation(({ ctx, input }) => services.updateOauthAccount(ctx, input)),
  deleteOauthAccount: protectedProcedure
    .input(inputs.deleteOauthAccountSchema)
    .mutation(({ ctx, input }) => services.deleteOauthAccount(ctx, input)),
});
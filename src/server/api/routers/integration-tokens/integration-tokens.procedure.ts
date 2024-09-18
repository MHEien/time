import { createTRPCRouter, protectedProcedure } from "../../trpc";
import * as inputs from "./integration-tokens.input";
import * as services from "./integration-tokens.service";

export const integrationTokensRouter = createTRPCRouter({
  list: protectedProcedure
    .input(inputs.listIntegrationTokensSchema)
    .query(({ ctx, input }) => services.listIntegrationTokens(ctx, input)),

  get: protectedProcedure
    .input(inputs.getIntegrationTokenSchema)
    .query(({ ctx, input }) => services.getIntegrationToken(ctx, input)),

  create: protectedProcedure
    .input(inputs.createIntegrationTokenSchema)
    .mutation(({ ctx, input }) => services.createIntegrationToken(ctx, input)),

  update: protectedProcedure
    .input(inputs.updateIntegrationTokenSchema)
    .mutation(({ ctx, input }) => services.updateIntegrationToken(ctx, input)),

  delete: protectedProcedure
    .input(inputs.deleteIntegrationTokenSchema)
    .mutation(({ ctx, input }) => services.deleteIntegrationToken(ctx, input)),
});
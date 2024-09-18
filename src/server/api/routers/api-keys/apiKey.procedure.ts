import { createTRPCRouter, protectedProcedure } from "../../trpc";
import * as inputs from "./apiKey.input";
import * as services from "./apiKey.service";

export const apiKeyRouter = createTRPCRouter({
  list: protectedProcedure
    .input(inputs.listApiKeysSchema)
    .query(({ ctx, input }) => services.listApiKeys(ctx, input)),

  get: protectedProcedure
    .input(inputs.getApiKeySchema)
    .query(({ ctx, input }) => services.getApiKey(ctx, input)),

  create: protectedProcedure
    .input(inputs.createApiKeySchema)
    .mutation(({ ctx, input }) => services.createApiKey(ctx, input)),

  update: protectedProcedure
    .input(inputs.updateApiKeySchema)
    .mutation(({ ctx, input }) => services.updateApiKey(ctx, input)),

  delete: protectedProcedure
    .input(inputs.deleteApiKeySchema)
    .mutation(({ ctx, input }) => services.deleteApiKey(ctx, input)),
  myApiKeys: protectedProcedure
    .input(inputs.myApiKeysSchema)
    .query(({ ctx, input }) => services.myApiKeys(ctx, input)),
});

/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { uncachedValidateRequest } from "@/lib/auth/validate-request";
import { stripe } from "@/lib/stripe";
import { db } from "@/server/db";
import { initTRPC, TRPCError, type inferAsyncReturnType } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const { session, user } = await uncachedValidateRequest();
  return {
    session,
    user,
    db,
    headers: opts.headers,
    stripe: stripe,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      // infers the `session` and `user` as non-nullable
      session: { ...ctx.session },
      user: { ...ctx.user },
    },
  });
});

/**
 * API key authenticated procedure
 *
 * This procedure is used for routes that should be accessible via API key authentication.
 * It verifies the API key and associates the request with the corresponding user.
 */
export const apiKeyProcedure = t.procedure.use(async ({ ctx, next }) => {
  const apiKey = ctx.headers.get("x-api-key");
  if (!apiKey) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "API key is required" });
  }

  // Verify the API key and get the associated user
  const apiKeyRecord = await ctx.db.query.apiKeys.findFirst({
    where: (apiKeys, { eq }) => eq(apiKeys.key, apiKey),
    with: {
      user: true,
    },
  });

  if (!apiKeyRecord?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid API key" });
  }

  return next({
    ctx: {
      user: apiKeyRecord.user,
      apiKey: apiKeyRecord.key,
    },
  });
});

export type TRPCContext = inferAsyncReturnType<typeof createTRPCContext>;
export type ProtectedTRPCContext = TRPCContext & {
  user: NonNullable<TRPCContext["user"]>;
  session: NonNullable<TRPCContext["session"]>;
};

export type APIKeyTRPCContext = TRPCContext & {
  user: NonNullable<TRPCContext["user"]>;
  apiKey: string;
};
import { cookies } from "next/headers";
import { generateId } from "lucia";
import { OAuth2RequestError } from "arctic";
import { eq } from "drizzle-orm";
import { entraId, lucia } from "@/lib/auth";
import { db } from "@/server/db";
import { Paths } from "@/lib/constants";
import { users } from "@/server/db/schema";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = cookies().get("entra_id_oauth_state")?.value ?? null;
  const storedCodeVerifier = cookies().get("entra_id_oauth_code_verifier")?.value ?? null;

  if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
    return new Response(null, {
      status: 400,
      headers: { Location: Paths.Login },
    });
  }

  try {
    const tokens = await entraId.validateAuthorizationCode(code, storedCodeVerifier);

    const entraIdUserRes = await fetch("https://graph.microsoft.com/oidc/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`
      }
    });

    console.log("User info response:", entraIdUserRes);
    const entraIdUser = await entraIdUserRes.json() as EntraIdUser;

    if (!entraIdUser.email) {
      return new Response(
        JSON.stringify({
          error: "Your Microsoft account must have an email address.",
        }),
        { status: 400, headers: { Location: Paths.Login } },
      );
    }

    const existingUser = await db.query.users.findFirst({
      where: (table, { eq, or }) =>
        or(eq(table.providerId, entraIdUser.sub), eq(table.email, entraIdUser.email)),
    });

    const avatar = entraIdUser.picture ?? null;

    if (!existingUser) {
      const userId = generateId(21);
      await db.insert(users).values({
        id: userId,
        email: entraIdUser.email,
        emailVerified: true,
        providerId: entraIdUser.sub,
        provider: "entraId",
        avatar,
        name: entraIdUser.name ?? null,
      });
      const session = await lucia.createSession(userId, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
      return new Response(null, {
        status: 302,
        headers: { Location: Paths.Dashboard },
      });
    }

    if (existingUser.providerId !== entraIdUser.sub || existingUser.avatar !== avatar) {
      await db
        .update(users)
        .set({
          providerId: entraIdUser.sub,
          emailVerified: true,
          avatar,
          name: entraIdUser.name ?? existingUser.name,
        })
        .where(eq(users.id, existingUser.id));
    }
    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    return new Response(null, {
      status: 302,
      headers: { Location: Paths.Dashboard },
    });
  } catch (e) {
    if (e instanceof OAuth2RequestError) {
      return new Response(JSON.stringify({ message: "Invalid code" }), {
        status: 400,
      });
    }
    console.error(e);

    return new Response(JSON.stringify({ message: "internal server error" }), {
      status: 500,
    });
  }
}

interface EntraIdUser {
  sub: string;
  name?: string;
  email: string;
  picture?: string;
}
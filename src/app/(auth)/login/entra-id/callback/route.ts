import { cookies } from "next/headers";
import { generateId } from "lucia";
import { OAuth2RequestError } from "arctic";
import { eq } from "drizzle-orm";
import { entraId, lucia } from "@/lib/auth";
import { db } from "@/server/db";
import { Paths } from "@/lib/constants";
import { users, integrationTokens } from "@/server/db/schema";

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
    console.log("Tokens:", tokens);

    if (!tokens.accessToken) {
      return new Response(JSON.stringify({ message: "Invalid code" }), {
        status: 400,
      });
    }
    const entraIdUserRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`
      }
    });
    
    if (!entraIdUserRes.ok) {
      const errorBody = await entraIdUserRes.text();
      console.error("Graph API Error:", entraIdUserRes.status, errorBody);
      return new Response(JSON.stringify({ error: "Failed to fetch user info" }), {
        status: 500,
        headers: { Location: Paths.Login }
      });
    }
    
    const entraIdUser = await entraIdUserRes.json() as EntraIdUser;


    if (!entraIdUser.mail) {
      return new Response(
        JSON.stringify({
          error: "Your Microsoft account must have an email address.",
        }),
        { status: 400, headers: { Location: Paths.Login } },
      );
    }

    const existingUser = await db.query.users.findFirst({
      where: (table, { eq, or }) =>
        or(eq(table.providerId, entraIdUser.id), eq(table.email, entraIdUser.mail)),
    });

    const avatar = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value')
    if (!existingUser) {
      const userId = generateId(21);
      await db.insert(users).values({
        id: userId,
        email: entraIdUser.mail,
        emailVerified: true,
        providerId: entraIdUser.id,
        provider: "entraId",
        avatar: avatar.url,
        name: entraIdUser.displayName ?? null,
      });

      await db.insert(integrationTokens).values({
        id: generateId(15),
        userId: userId,
        integrationType: "entraId",
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(tokens.accessTokenExpiresAt),
      });

      const session = await lucia.createSession(userId, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
      return new Response(null, {
        status: 302,
        headers: { Location: Paths.Dashboard },
      });
    }

    await db
      .update(users)
      .set({
        providerId: entraIdUser.id,
        emailVerified: true,
        avatar: avatar.url,
        name: entraIdUser.displayName ?? existingUser.name,
      })
      .where(eq(users.id, existingUser.id));

    await db
      .insert(integrationTokens)
      .values({
        id: generateId(15),
        userId: existingUser.id,
        integrationType: "entraId",
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(tokens.accessTokenExpiresAt),
      })
      .onConflictDoUpdate({
        target: [integrationTokens.userId, integrationTokens.integrationType],
        set: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(tokens.accessTokenExpiresAt),
          updatedAt: new Date(),
        },
      });

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
  id: string;
  displayName?: string;
  mail: string;
  photo?: string;
}
// File: lib/auth-utils.ts

import { generateId } from "lucia";
import { OAuth2RequestError } from "arctic";
import { eq } from "drizzle-orm";
import { discord, entraId, github, lucia } from "@/lib/auth";
import { db } from "@/server/db";
import { Paths } from "@/lib/constants";
import { users, oauthAccounts } from "@/server/db/schema";

export interface OAuthProvider {
  name: "discord" | "entraId" | "github";
  getUserData: (accessToken: string) => Promise<{
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  }>;
  validateAuthorizationCode: (code: string, codeVerifier?: string) => Promise<{
    accessToken: string;
    refreshToken: string | null;
    accessTokenExpiresAt: Date | null;
  }>;
}

const providers: Record<string, OAuthProvider> = {
  discord: {
    name: "discord",
    getUserData: async (accessToken) => {
      const res = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json() as { id: string, email: string, username: string, avatar: string };
      return {
        id: data.id,
        email: data.email,
        name: data.username,
        avatar: data.avatar
          ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.webp`
          : null,
      };
    },
    validateAuthorizationCode: (code) => discord.validateAuthorizationCode(code),
  },
  entraId: {
    name: "entraId",
    getUserData: async (accessToken) => {
      const res = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json() as { id: string, mail: string, displayName: string };
      const avatarRes = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return {
        id: data.id,
        email: data.mail,
        name: data.displayName,
        avatar: avatarRes.ok ? avatarRes.url : null,
      };
    },
    validateAuthorizationCode: (code, codeVerifier) =>
      entraId.validateAuthorizationCode(code, codeVerifier!),
  },
  github: {
    name: "github",
    getUserData: async (accessToken) => {
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json() as { id: string, login: string, name: string, avatar_url: string };
      return {
        id: data.id,
        email: data.login,
        name: data.name,
        avatar: data.avatar_url,
      };
    },
    validateAuthorizationCode: async (code) => {
      const tokens = await github.validateAuthorizationCode(code);
      return {
        accessToken: tokens.accessToken,
        refreshToken: null, // GitHub doesn't provide a refresh token
        accessTokenExpiresAt: null, // GitHub tokens don't have an expiration
      };
    },
  },
};

export async function handleOAuthCallback(
  providerName: OAuthProvider["name"],
  code: string,
  storedState: string | null,
  state: string,
  storedCodeVerifier?: string | null,
  existingSessionId?: string | null
): Promise<Response> {
  if (!code || !state || !storedState || state !== storedState) {
    return new Response(null, {
      status: 400,
      headers: { Location: Paths.Login },
    });
  }

  const provider = providers[providerName];

  try {
    const tokens = await provider?.validateAuthorizationCode(code, storedCodeVerifier ?? undefined);
    if (!tokens) throw new Error("Invalid code");
    const userData = await provider?.getUserData(tokens.accessToken);

    if (!userData?.email) {
      return new Response(
        JSON.stringify({
          error: `Your ${providerName} account must have an email address.`,
        }),
        { status: 400, headers: { Location: Paths.Login } }
      );
    }

    const existingOAuthAccount = await db.query.oauthAccounts.findFirst({
      where: (table, { eq, and }) =>
        and(eq(table.provider, providerName), eq(table.providerId, userData.id)),
    });

    let userId: string;
    let accountLinked = false;

    if (existingSessionId) {
      // User is already signed in, link the new OAuth account
      const existingSession = await lucia.validateSession(existingSessionId);
      if (!existingSession.user) {
        throw new Error("Invalid session");
      }
      userId = existingSession.user.id;

      // Check if this OAuth account is already linked to another user
      if (existingOAuthAccount && existingOAuthAccount.userId !== userId) {
        return new Response(
          JSON.stringify({
            error: "This OAuth account is already linked to another user.",
          }),
          { status: 400, headers: { Location: Paths.Dashboard } }
        );
      }

      // Link the new OAuth account to the existing user
      if (!existingOAuthAccount) {
        await db.insert(oauthAccounts).values({
          id: generateId(21),
          userId: userId,
          provider: providerName,
          providerId: userData.id,
          username: userData.name,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken ?? null,
          expiresAt: tokens.accessTokenExpiresAt,
        });
        accountLinked = true;
      }
    } else {
      // Handle the case where the user is not signed in (existing logic)
      if (existingOAuthAccount) {
        userId = existingOAuthAccount.userId;
      } else {
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, userData.email),
        });

        if (existingUser) {
          userId = existingUser.id;
          await db.insert(oauthAccounts).values({
            id: generateId(21),
            userId: userId,
            provider: providerName,
            providerId: userData.id,
            username: userData.name,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken ?? null,
            expiresAt: tokens.accessTokenExpiresAt,
          });
        } else {
          userId = generateId(21);
          await db.insert(users).values({
            id: userId,
            email: userData.email,
            emailVerified: true,
            name: userData.name,
            avatar: userData.avatar,
          });
          await db.insert(oauthAccounts).values({
            id: generateId(21),
            userId,
            username: userData.name,
            provider: providerName,
            providerId: userData.id,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken ?? null,
            expiresAt: tokens.accessTokenExpiresAt,
          });
        }
      }
    }

    // Update user information
    await db
      .update(users)
      .set({ name: userData.name, avatar: userData.avatar })
      .where(eq(users.id, userId));

    // If the user wasn't already signed in, create a new session
    if (!existingSessionId) {
      const session = await lucia.createSession(userId, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      return new Response(null, {
        status: 302,
        headers: {
          Location: Paths.Dashboard,
          "Set-Cookie": sessionCookie.serialize(),
        },
      });
    }

    // If the user was already signed in and linked a new account, redirect to /dashboard/integrations
    if (accountLinked) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${Paths.Dashboard}/settings/integrations`,
        },
      });
    }

    // If the user was already signed in but didn't link a new account, just redirect to the dashboard
    return new Response(null, {
      status: 302,
      headers: {
        Location: Paths.Dashboard,
      },
    });
  } catch (e) {
    if (e instanceof OAuth2RequestError) {
      return new Response(JSON.stringify({ message: "Invalid code" }), {
        status: 400,
      });
    }
    console.error(e);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
    });
  }
}
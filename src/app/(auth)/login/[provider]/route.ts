import { cookies } from "next/headers";
import { generateState, generateCodeVerifier } from "arctic";
import { discord, entraId, github } from "@/lib/auth";
import { env } from "@/env";

type OAuthProviderName = "discord" | "entraId" | "github";
export const runtime = 'edge';
interface BaseOAuthProviderConfig {
  scopes: string[];
}

interface StandardOAuthProviderConfig extends BaseOAuthProviderConfig {
  type: "standard";
  createAuthorizationURL: (state: string, options: { scopes: string[] }) => Promise<URL>;
}

interface PKCEOAuthProviderConfig extends BaseOAuthProviderConfig {
  type: "pkce";
  createAuthorizationURL: (state: string, codeVerifier: string, options: { scopes: string[] }) => Promise<URL>;
}

type OAuthProviderConfig = StandardOAuthProviderConfig | PKCEOAuthProviderConfig;

const providers: Record<OAuthProviderName, OAuthProviderConfig> = {
  discord: {
    type: "standard",
    createAuthorizationURL: discord.createAuthorizationURL.bind(discord),
    scopes: ["identify", "email"],
  },
  entraId: {
    type: "pkce",
    createAuthorizationURL: entraId.createAuthorizationURL.bind(entraId),
    scopes: ["profile", "User.Read", "email", "openid", "offline_access", "Calendars.ReadWrite"],
  },
  github: {
    type: "standard",
    createAuthorizationURL: github.createAuthorizationURL.bind(github),
    scopes: ["user", "repo", "read:user", "read:org", "read:discussion", "user:email"],
  },
};

export async function GET(
  request: Request,
  { params }: { params: { provider: OAuthProviderName } }
): Promise<Response> {
  const provider = providers[params.provider];

  if (!provider) {
    return new Response(null, {
      status: 400,
      headers: { Location: "/login" },
    });
  }

  const state = generateState();
  let url: URL;
  
  if (provider.type === "pkce") {
    const codeVerifier = generateCodeVerifier();
    url = await provider.createAuthorizationURL(state, codeVerifier, {
      scopes: provider.scopes,
    });

    cookies().set(`${params.provider}_oauth_code_verifier`, codeVerifier, {
      secure: env.NODE_ENV === "production",
      path: "/",
      httpOnly: true,
      maxAge: 60 * 10 // 10 min
    });
  } else {
    url = await provider.createAuthorizationURL(state, {
      scopes: provider.scopes,
    });
  }

  cookies().set(`${params.provider}_oauth_state`, state, {
    path: "/",
    secure: env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  return Response.redirect(url);
}
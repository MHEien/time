import { cookies } from "next/headers";
import { handleOAuthCallback } from "@/lib/auth/auth-utils";
import type { OAuthProvider } from "@/lib/auth/auth-utils";
import { lucia } from "@/lib/auth";
export const runtime = 'edge';
export async function GET(
  request: Request,
  { params }: { params: { provider: OAuthProvider["name"] } }
): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const provider = params.provider;
  
  const storedState = cookies().get(`${provider}_oauth_state`)?.value ?? null;
  const storedCodeVerifier = cookies().get(`${provider}_oauth_code_verifier`)?.value ?? null;

  if (!code || !state || !provider) {
    return new Response(null, {
      status: 400,
      headers: { Location: "/login" },
    });
  }

  // Check for existing session
  const existingSessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;

  // Pass the existingSessionId to handleOAuthCallback
  return handleOAuthCallback(provider, code, storedState, state, storedCodeVerifier, existingSessionId);
}
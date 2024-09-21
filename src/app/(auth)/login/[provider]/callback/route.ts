import { cookies } from "next/headers";
import { handleOAuthCallback } from "@/lib/auth/auth-utils";
import type { OAuthProvider } from "@/lib/auth/auth-utils";


export async function GET(
  request: Request,
  { params }: { params: { provider: OAuthProvider["name"] } }
): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const provider = params.provider;
  
  // Use the correct cookie name
  const storedState = cookies().get(`${provider}_oauth_state`)?.value ?? null;
  const storedCodeVerifier = cookies().get(`${provider}_oauth_code_verifier`)?.value ?? null;

  if (!code || !state || !provider) {
    return new Response(null, {
      status: 400,
      headers: { Location: "/login" },
    });
  }

  return handleOAuthCallback(provider, code, storedState, state, storedCodeVerifier);
}
import { cookies } from "next/headers";
import { generateCodeVerifier, generateState } from "arctic";
import { entraId } from "@/lib/auth";
import { env } from "@/env";

export async function GET(): Promise<Response> {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = await entraId.createAuthorizationURL(state, codeVerifier, {
      scopes: ["profile", "email"],
  });
  
  cookies().set("entra_id_oauth_state", state, {
    path: "/",
    secure: env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  cookies().set("entra_id_oauth_code_verifier", codeVerifier, {
    secure: env.NODE_ENV === "production",
    path: "/",
    httpOnly: true,
    maxAge: 60 * 10 // 10 min
  });

  return Response.redirect(url);
}

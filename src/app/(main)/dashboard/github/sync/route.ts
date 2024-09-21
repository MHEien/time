import { syncGithub } from "../../actions";
import { api } from "@/trpc/server";
import { NextResponse } from "next/server";
import { env } from "@/env";
export async function GET() {

const user = await api.user.get.query();

if (!user) throw new Error('User not found');

  const response = await syncGithub();
  return NextResponse.redirect(env.NEXT_PUBLIC_APP_URL + '/dashboard/github');
}
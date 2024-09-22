"use server";
import { api } from "@/trpc/server";

export async function syncOutlookCalendar() {
  const response = await api.outlookCalendar.fetchEvents.query({});
  return response;
}


export async function getGithubData() {
  const issues = await api.github.myIssues.query({});
  const prs = await api.github.myPRs.query({});
  const commits = await api.github.myCommits.query({});

  console.log("Issues:", issues);
  console.log("PRs:", prs);
  console.log("Commits:", commits);

  return { issues, prs, commits };
}

export async function integrateExistingUserWithOauthAccount(provider: string, providerId: string) {
  
  const user = await api.user.get.query();

  if (!user) throw new Error('User not found');

  const oauthAccount = await api.integrationTokens.addOauthAccount.mutate({
    userId: user.id,
    username: user.email,
    provider,
    providerId,
    accessToken: '',
    refreshToken: undefined,
    expiresAt: undefined,
  });

  return oauthAccount;
}
import { generateId } from "lucia";
import type { ProtectedTRPCContext } from "../../trpc";
import type {
  MyGithubCommitsInput,
  MyGithubIssuesInput,
  MyGithubPRsInput,
} from "./github.input";
import { githubCommits, githubIssues, githubPullRequests, oauthAccounts  } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { Octokit } from "@octokit/rest";
import { db } from "@/server/db";

export const myGithubPRs = async (ctx: ProtectedTRPCContext, input: MyGithubPRsInput) => {
  return ctx.db.query.githubPullRequests.findMany({
    where: (table, { eq }) => eq(table.userId, ctx.user.id),
    offset: (input.page - 1) * input.perPage,
    limit: input.perPage,
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });
};

export const myGithubIssues = async (ctx: ProtectedTRPCContext, input: MyGithubIssuesInput) => {
  return ctx.db.query.githubIssues.findMany({
    where: (table, { eq }) => eq(table.userId, ctx.user.id),
    offset: (input.page - 1) * input.perPage,
    limit: input.perPage,
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });
};

export const myGithubCommits = async (ctx: ProtectedTRPCContext, input: MyGithubCommitsInput) => {
  return ctx.db.query.githubCommits.findMany({
    where: (table, { eq }) => eq(table.userId, ctx.user.id),
    offset: (input.page - 1) * input.perPage,
    limit: input.perPage,
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });
};

export async function fetchGitHubData(ctx: ProtectedTRPCContext) {
  const githubAccount = await ctx.db.query.oauthAccounts.findFirst({
    where: and(
      eq(oauthAccounts.userId, ctx.user.id),
      eq(oauthAccounts.provider, 'github')
    ),
  });

  if (!githubAccount) throw new Error('No GitHub account linked');
  
  const octokit = new Octokit({ auth: githubAccount.accessToken });

  const threeWeeksAgo = new Date();
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

  const githubUser = await octokit.users.getAuthenticated();

  const { data: events } = await octokit.activity.listEventsForAuthenticatedUser({
    username: githubUser.data.login,
    since: threeWeeksAgo.toISOString(),
    per_page: 100,
  });

  const recentRepos = new Set<string>();
  for (const event of events) {
    if (event.created_at && new Date(event.created_at) < threeWeeksAgo) break;
    if (event.repo) {
      recentRepos.add(event.repo.name);
    }
  }

  const summary = {
    totalIssues: 0,
    totalPullRequests: 0,
    totalCommits: 0,
    reposProcessed: 0
  };

  for (const repoFullName of recentRepos) {
    const [owner, repo] = repoFullName?.split('/') ?? [];

    if (!owner || !repo) {
      continue;
    }

    summary.reposProcessed++;

    // Fetch issues
    const { data: issues } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'all',
      since: threeWeeksAgo.toISOString(),
    });

    for (const issue of issues) {
      if (!issue.pull_request) { // Ensure it's not a PR
        await db.insert(githubIssues).values({
          id: generateId(15),
          userId: ctx.user.id,
          title: issue.title ?? '',
          body: issue.body ?? '',
          status: issue.state,
          createdAt: new Date(issue.created_at),
          updatedAt: new Date(issue.updated_at),
          githubId: BigInt(issue.number),
          githubUrl: issue.html_url ?? '',
        }).onConflictDoUpdate({
          target: [githubIssues.githubId, githubIssues.userId],
          set: {
            title: issue.title ?? '',
            body: issue.body ?? '',
            status: issue.state,
            updatedAt: new Date(issue.updated_at),
            githubUrl: issue.html_url ?? '',
          }
        });
        summary.totalIssues++;
      }
    }

    // Fetch pull requests
    const { data: prs } = await octokit.pulls.list({
      owner,
      repo,
      state: 'all',
      sort: 'updated',
      direction: 'desc',
    });

    for (const pr of prs) {
      if (new Date(pr.updated_at) >= threeWeeksAgo) {
        await db.insert(githubPullRequests).values({
          id: generateId(15),
          userId: ctx.user.id,
          title: pr.title,
          body: pr.body ?? '',
          status: pr.state,
          createdAt: new Date(pr.created_at),
          updatedAt: new Date(pr.updated_at),
          githubId: BigInt(pr.number),
          githubUrl: pr.html_url,
        }).onConflictDoUpdate({
          target: [githubPullRequests.githubId, githubPullRequests.userId],
          set: {
            title: pr.title,
            body: pr.body ?? '',
            status: pr.state,
            updatedAt: new Date(pr.updated_at),
            githubUrl: pr.html_url,
          }
        });
        summary.totalPullRequests++;
      }
    }

    // Fetch commits
    const { data: commits } = await octokit.repos.listCommits({
      owner,
      repo,
      since: threeWeeksAgo.toISOString(),
      per_page: 100,
    });

    for (const commit of commits) {
      const authorDate = commit.commit.author?.date ? new Date(commit.commit.author.date) : new Date();
      await db.insert(githubCommits).values({
        id: generateId(15),
        userId: ctx.user.id,
        message: commit.commit.message,
        sha: commit.sha,
        createdAt: authorDate,
        githubUrl: commit.html_url ?? '',
      }).onConflictDoUpdate({
        target: [githubCommits.sha, githubCommits.userId],
        set: {
          message: commit.commit.message,
          createdAt: authorDate,
          githubUrl: commit.html_url ?? '',
        }
      });
      summary.totalCommits++;
    }
  }

  return summary;
}
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import * as inputs from "./github.input";
import * as services from "./github.service";

export const githubRouter = createTRPCRouter({
  myPRs: protectedProcedure
    .input(inputs.myGithubPRsSchema)
    .query(({ ctx, input }) => services.myGithubPRs(ctx, input)),

  myIssues: protectedProcedure
    .input(inputs.myGithubIssuesSchema)
    .query(({ ctx, input }) => services.myGithubIssues(ctx, input)),

  myCommits: protectedProcedure
    .input(inputs.myGithubCommitsSchema)
    .query(({ ctx, input }) => services.myGithubCommits(ctx, input)),
  fetchData: protectedProcedure
    .input(inputs.fetchGithubDataSchema)
    .mutation(({ ctx }) => services.fetchGitHubData(ctx)),
});
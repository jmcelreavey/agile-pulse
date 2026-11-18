import { protectedProcedure } from "~/server/api/procedures";
import {
  GetJiraSprintIssuesSchema,
  GetJiraSprintsSchema,
  LinkJiraAccountSchema,
  LinkJiraProjectSchema,
  SyncJiraSprintSchema,
  UnlinkJiraProjectSchema,
} from "~/server/api/schemas/jira";
import { createTRPCRouter } from "~/server/api/trpc";
import { NotAuthorisedError } from "~/server/errors/NotAuthorisedError";
import { AutoConfigureJiraFromOAuthUseCase } from "~/server/logic/jira/AutoConfigureJiraFromOAuthUseCase";
import { GetJiraConnectionStatusUseCase } from "~/server/logic/jira/GetJiraConnectionStatusUseCase";
import { GetJiraProjectsUseCase } from "~/server/logic/jira/GetJiraProjectsUseCase";
import { GetJiraSprintIssuesUseCase } from "~/server/logic/jira/GetJiraSprintIssuesUseCase";
import { GetJiraSprintsUseCase } from "~/server/logic/jira/GetJiraSprintsUseCase";
import { LinkJiraAccountUseCase } from "~/server/logic/jira/LinkJiraAccountUseCase";
import { LinkJiraProjectUseCase } from "~/server/logic/jira/LinkJiraProjectUseCase";
import { SyncJiraSprintUseCase } from "~/server/logic/jira/SyncJiraSprintUseCase";
import { UnlinkJiraAccountUseCase } from "~/server/logic/jira/UnlinkJiraAccountUseCase";
import { UnlinkJiraProjectUseCase } from "~/server/logic/jira/UnlinkJiraProjectUseCase";

export const jiraRouter = createTRPCRouter({
  // Auto-configure Jira from OAuth
  autoConfigureFromOAuth: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new NotAuthorisedError("User session not found");
    }

    const autoConfigureJira = new AutoConfigureJiraFromOAuthUseCase(
      ctx.db,
      ctx.session.user
    );
    return await autoConfigureJira.execute();
  }),

  // Link user's Jira account
  linkAccount: protectedProcedure
    .input(LinkJiraAccountSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new NotAuthorisedError("User session not found");
      }

      const linkJiraAccount = new LinkJiraAccountUseCase(
        ctx.db,
        ctx.session.user
      );
      return await linkJiraAccount.execute(input);
    }),

  // Get user's Jira connection status
  getConnectionStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new NotAuthorisedError("User session not found");
    }

    const getConnectionStatus = new GetJiraConnectionStatusUseCase(
      ctx.db,
      ctx.session.user
    );
    return await getConnectionStatus.execute();
  }),

  // Get available Jira projects for linking
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new NotAuthorisedError("User session not found");
    }

    const getJiraProjects = new GetJiraProjectsUseCase(
      ctx.db,
      ctx.session.user
    );
    return await getJiraProjects.execute();
  }),

  // Link project with Jira project
  linkProject: protectedProcedure
    .input(LinkJiraProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const linkJiraProject = new LinkJiraProjectUseCase(ctx.db);
      return await linkJiraProject.execute(input);
    }),

  // Get sprints for a Jira project
  getSprints: protectedProcedure
    .input(GetJiraSprintsSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new NotAuthorisedError("User session not found");
      }

      const getJiraSprints = new GetJiraSprintsUseCase(
        ctx.db,
        ctx.session.user
      );
      return await getJiraSprints.execute(input);
    }),

  // Get issues for a sprint
  getSprintIssues: protectedProcedure
    .input(GetJiraSprintIssuesSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new NotAuthorisedError("User session not found");
      }

      const getJiraSprintIssues = new GetJiraSprintIssuesUseCase(
        ctx.db,
        ctx.session.user
      );
      return await getJiraSprintIssues.execute(input);
    }),

  // Sync sprint with Jira data
  syncSprint: protectedProcedure
    .input(SyncJiraSprintSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new NotAuthorisedError("User session not found");
      }

      const syncJiraSprint = new SyncJiraSprintUseCase(
        ctx.db,
        ctx.session.user
      );
      return await syncJiraSprint.execute(input);
    }),

  // Unlink Jira account
  unlinkAccount: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new NotAuthorisedError("User session not found");
    }

    const unlinkJiraAccount = new UnlinkJiraAccountUseCase(
      ctx.db,
      ctx.session.user
    );
    return await unlinkJiraAccount.execute();
  }),

  // Unlink project from Jira
  unlinkProject: protectedProcedure
    .input(UnlinkJiraProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const unlinkJiraProject = new UnlinkJiraProjectUseCase(ctx.db);
      return await unlinkJiraProject.execute(input);
    }),
});

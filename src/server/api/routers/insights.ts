import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { integrations } from "~/env";
import { customerProtectedProcedure, protectedProcedure } from "~/server/api/procedures";
import { createTRPCRouter } from "~/server/api/trpc";
import { ApiTokenUseCase } from "~/server/logic/insights/ApiTokenUseCase";
import { DigestUseCase } from "~/server/logic/insights/DigestUseCase";
import { LoadSprintChartUseCase } from "~/server/logic/insights/LoadSprintChartUseCase";
import { ShareLinkUseCase } from "~/server/logic/insights/ShareUseCases";
import { SprintInsightsUseCase } from "~/server/logic/insights/SprintInsightsUseCase";
import { LinkTaskUseCase } from "~/server/logic/insights/SyncUseCases";
import { GetCustomerSprintDetailsUseCase } from "~/server/logic/customer/GetCustomerSprintDetailsUseCase";
import { isTimeOff } from "~/shared/logic/insights/types";
import { markdownToHtml } from "~/utils/markdown-converter";

const sprintInput = z.object({ sprintId: z.number().positive() });

export const insightsRouter = createTRPCRouter({
  integrations: protectedProcedure.query(() => integrations),

  forecast: protectedProcedure.input(sprintInput).query(({ ctx, input }) => new SprintInsightsUseCase(ctx.db).forecast(input.sprintId)),
  explainForecast: protectedProcedure
    .input(sprintInput)
    .mutation(({ ctx, input }) => new SprintInsightsUseCase(ctx.db).explainForecast(input.sprintId)),
  standup: protectedProcedure.input(sprintInput).query(({ ctx, input }) => new SprintInsightsUseCase(ctx.db).standup(input.sprintId)),
  sendStandup: protectedProcedure.input(sprintInput).mutation(async ({ ctx, input }) => {
    const { slack, email } = await new DigestUseCase(ctx.db).deliver(input.sprintId);
    return { slack, email };
  }),
  retro: protectedProcedure.input(sprintInput).query(({ ctx, input }) => new SprintInsightsUseCase(ctx.db).retro(input.sprintId)),
  weeklyUpdate: protectedProcedure.input(sprintInput).query(({ ctx, input }) => new SprintInsightsUseCase(ctx.db).weeklyUpdate(input.sprintId)),
  postWeeklyUpdate: protectedProcedure
    .input(sprintInput.extend({ markdown: z.string().min(10).max(10_000) }))
    .mutation(async ({ ctx, input }) => {
      const sprint = await ctx.db.sprint.findUnique({ where: { id: input.sprintId }, select: { projectId: true } });
      if (!sprint) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.developerComment.create({
        data: { userId: ctx.session.user.id, projectId: sprint.projectId, sprintId: input.sprintId, content: markdownToHtml(input.markdown) },
        select: { id: true },
      });
    }),
  planPreview: protectedProcedure
    .input(sprintInput.extend({ backlog: z.string().min(3).max(20_000) }))
    .mutation(({ ctx, input }) => new SprintInsightsUseCase(ctx.db).planPreview(input.sprintId, input.backlog)),

  links: protectedProcedure.input(sprintInput).query(async ({ ctx, input }) => {
    const chart = await new LoadSprintChartUseCase(ctx.db).execute({ sprintId: input.sprintId, withHistory: false });
    const tasks = [...chart.current.lanes.flatMap((lane) => lane.tasks.map((task) => ({ ...task, member: lane.member }))), ...chart.current.unassigned.map((task) => ({ ...task, member: null }))];
    return tasks
      .filter((task) => !isTimeOff(task))
      .map((task) => ({ ...task, links: chart.links.filter((link) => link.taskKey === task.key) }));
  }),
  addLink: protectedProcedure
    .input(z.object({ sprintTaskId: z.number().positive(), url: z.url().max(500) }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await new LinkTaskUseCase(ctx.db).add(input);
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Could not link" });
      }
    }),
  removeLink: protectedProcedure.input(z.object({ id: z.number().positive() })).mutation(({ ctx, input }) => new LinkTaskUseCase(ctx.db).remove(input)),

  shareLinks: protectedProcedure.input(sprintInput).query(({ ctx, input }) => new ShareLinkUseCase(ctx.db).list(input.sprintId)),
  createShareLink: protectedProcedure.input(sprintInput).mutation(({ ctx, input }) => new ShareLinkUseCase(ctx.db).create(input.sprintId, ctx.session.user.id)),
  revokeShareLink: protectedProcedure.input(z.object({ id: z.number().positive() })).mutation(({ ctx, input }) => new ShareLinkUseCase(ctx.db).revoke(input.id)),

  apiTokens: protectedProcedure.query(({ ctx }) => new ApiTokenUseCase(ctx.db).list(ctx.session.user.id)),
  createApiToken: protectedProcedure
    .input(z.object({ name: z.string().trim().min(1).max(60) }))
    .mutation(({ ctx, input }) => new ApiTokenUseCase(ctx.db).create(ctx.session.user.id, input.name)),
  revokeApiToken: protectedProcedure
    .input(z.object({ id: z.number().positive() }))
    .mutation(({ ctx, input }) => new ApiTokenUseCase(ctx.db).revoke(ctx.session.user.id, input.id)),

  /** The customer portal's view: the drafted weekly update and ETA, after the usual access check. */
  customerOutlook: customerProtectedProcedure
    .input(z.object({ projectId: z.number().positive(), sprintId: z.number().positive() }))
    .query(async ({ ctx, input }) => {
      await new GetCustomerSprintDetailsUseCase(ctx.db).execute({ customerId: ctx.session.user.id, ...input });
      const update = await new SprintInsightsUseCase(ctx.db).weeklyUpdate(input.sprintId);
      return { markdown: update.markdown, eta: update.eta };
    }),
});

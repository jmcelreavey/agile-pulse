import { z } from "zod";
import { protectedProcedure } from "~/server/api/procedures";
import {
    DeleteChangelogSchema,
    ExportChangelogPdfSchema,
    GenerateChangelogSchema,
    GetAllChangelogsSchema,
    GetOneChangelogSchema,
    GetSharingHistorySchema,
    ShareChangelogEmailSchema,
    ShareChangelogSchema,
    UpdateChangelogSchema,
} from "~/server/api/schemas/changelog";
import { createTRPCRouter } from "~/server/api/trpc";
import { DeleteChangelogUseCase } from "~/server/logic/changelog/DeleteChangelogUseCase";
import { ExportChangelogPdfUseCase } from "~/server/logic/changelog/ExportChangelogPdfUseCase";
import { GenerateChangelogUseCase } from "~/server/logic/changelog/GenerateChangelogUseCase";
import { GetAllChangelogsUseCase } from "~/server/logic/changelog/GetAllChangelogsUseCase";
import { GetOneChangelogUseCase } from "~/server/logic/changelog/GetOneChangelogUseCase";
import { GetSharingHistoryUseCase } from "~/server/logic/changelog/GetSharingHistoryUseCase";
import { PreviewChangelogPdfUseCase } from "~/server/logic/changelog/PreviewChangelogPdfUseCase";
import { SaveChangelogUseCase } from "~/server/logic/changelog/SaveChangelogUseCase";
import { ShareChangelogEmailUseCase } from "~/server/logic/changelog/ShareChangelogEmailUseCase";
import { UpdateChangelogUseCase } from "~/server/logic/changelog/UpdateChangelogUseCase";
import { type ChangelogTone } from "~/utils/ai-content-generator";

export const changelogRouter = createTRPCRouter({
  generate: protectedProcedure
    .input(GenerateChangelogSchema)
    .mutation(async ({ ctx, input }) => {
      const generateChangelog = new GenerateChangelogUseCase(ctx.db);

      const result = await generateChangelog.execute({
        sprintId: input.sprintId,
        taskIds: input.taskIds,
        tone: input.tone as ChangelogTone,
        releaseVersion: input.releaseVersion,
      });

      return result;
    }),
  save: protectedProcedure
    .input(
      GenerateChangelogSchema.extend({
        content: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const saveChangelog = new SaveChangelogUseCase(ctx.db, ctx.session.user);

      const result = await saveChangelog.execute({
        sprintId: input.sprintId,
        content: input.content,
        tone: input.tone,
        taskIds: input.taskIds,
        releaseVersion: input.releaseVersion,
      });

      return result;
    }),
  shareEmail: protectedProcedure
    .input(ShareChangelogEmailSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("User not authenticated");
      }

      const shareChangelogEmail = new ShareChangelogEmailUseCase(
        ctx.db,
        ctx.session.user
      );

      const result = await shareChangelogEmail.execute({
        sprintId: input.sprintId,
        content: input.content,
        customerIds: input.customerIds,
        projectName: input.projectName,
        sprintName: input.sprintName,
      });

      return result;
    }),
  exportPdf: protectedProcedure
    .input(ExportChangelogPdfSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("User not authenticated");
      }

      const exportChangelogPdf = new ExportChangelogPdfUseCase(
        ctx.db,
        ctx.session.user
      );

      const result = await exportChangelogPdf.execute({
        sprintId: input.sprintId,
        content: input.content,
        projectName: input.projectName,
        sprintName: input.sprintName,
      });

      return result;
    }),

  previewPdf: protectedProcedure
    .input(ExportChangelogPdfSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("User not authenticated");
      }

      const previewChangelogPdf = new PreviewChangelogPdfUseCase(
        ctx.db,
        ctx.session.user
      );

      const result = await previewChangelogPdf.execute({
        sprintId: input.sprintId,
        content: input.content,
        projectName: input.projectName,
        sprintName: input.sprintName,
      });

      return result;
    }),

  share: protectedProcedure
    .input(ShareChangelogSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("User not authenticated");
      }

      const results: Array<{ type: string; result: unknown }> = [];

      // Handle email sharing
      if (
        input.emailCustomers &&
        input.customerIds &&
        input.customerIds.length > 0
      ) {
        const shareChangelogEmail = new ShareChangelogEmailUseCase(
          ctx.db,
          ctx.session.user
        );
        const emailResult = await shareChangelogEmail.execute({
          sprintId: input.sprintId,
          content: input.content,
          customerIds: input.customerIds,
          projectName: input.projectName,
          sprintName: input.sprintName,
        });
        results.push({ type: "email", result: emailResult });
      }

      // Handle PDF export
      if (input.exportPdf) {
        const exportChangelogPdf = new ExportChangelogPdfUseCase(
          ctx.db,
          ctx.session.user
        );
        const pdfResult = await exportChangelogPdf.execute({
          sprintId: input.sprintId,
          content: input.content,
          projectName: input.projectName,
          sprintName: input.sprintName,
        });
        results.push({ type: "pdf", result: pdfResult });
      }

      return {
        success: true,
        results,
        message: `Changelog shared successfully via ${results
          .map((r) => r.type)
          .join(" and ")}`,
      };
    }),

  // CRUD Operations for Changelog Management
  getOne: protectedProcedure
    .input(GetOneChangelogSchema)
    .query(async ({ ctx, input }) => {
      const getOneChangelog = new GetOneChangelogUseCase(ctx.db);
      const changelog = await getOneChangelog.execute(input);
      return changelog;
    }),

  getAll: protectedProcedure
    .input(GetAllChangelogsSchema)
    .query(async ({ ctx, input }) => {
      const getAllChangelogs = new GetAllChangelogsUseCase(ctx.db);
      const result = await getAllChangelogs.execute({
        ...input,
        domain: ctx.session?.user.domain,
      });
      return result;
    }),

  update: protectedProcedure
    .input(UpdateChangelogSchema)
    .mutation(async ({ ctx, input }) => {
      const updateChangelog = new UpdateChangelogUseCase(ctx.db);
      const changelog = await updateChangelog.execute(
        input,
        ctx.session?.user.domain
      );
      return changelog;
    }),

  delete: protectedProcedure
    .input(DeleteChangelogSchema)
    .mutation(async ({ ctx, input }) => {
      const deleteChangelog = new DeleteChangelogUseCase(ctx.db);
      const result = await deleteChangelog.execute(
        input,
        ctx.session?.user.domain
      );
      return result;
    }),

  getSharingHistory: protectedProcedure
    .input(GetSharingHistorySchema)
    .query(async ({ ctx, input }) => {
      const getSharingHistory = new GetSharingHistoryUseCase(ctx.db);
      const history = await getSharingHistory.execute(
        input,
        ctx.session?.user.domain
      );
      return history;
    }),
});

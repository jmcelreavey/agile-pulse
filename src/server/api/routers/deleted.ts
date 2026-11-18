import { protectedProcedure } from "~/server/api/procedures";
import {
  GetDeletedRecordSchema,
  RestoreDeletedRecordSchema,
} from "~/server/api/schemas/deleted";
import { createTRPCRouter } from "~/server/api/trpc";
import { GetDeletedRecordsUseCase } from "~/server/logic/deleted/GetDeletedRecordsUseCase";
import { RestoreDeletedRecordsUseCase } from "~/server/logic/deleted/RestoreDeletedRecordsUseCase";

export const deletedRouter = createTRPCRouter({
  getDeletedRecords: protectedProcedure
    .input(GetDeletedRecordSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("User session required");
      }
      const getDeletedRecords = new GetDeletedRecordsUseCase(
        ctx.db,
        ctx.session.user
      );
      const deletedRecords = await getDeletedRecords.execute({
        source: input.source,
        sourceRelationId: input.sourceRelationId,
      });
      return deletedRecords;
    }),
  restoreDeletedRecords: protectedProcedure
    .input(RestoreDeletedRecordSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("User session required");
      }
      const restoreDeletedRecords = new RestoreDeletedRecordsUseCase(
        ctx.db,
        ctx.session.user
      );
      const deletedRecords = await restoreDeletedRecords.execute({
        source: input.source,
        id: input.id,
      });
      return deletedRecords;
    }),
});

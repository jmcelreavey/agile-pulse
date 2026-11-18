import { protectedProcedure } from "~/server/api/procedures";
import {
  CreateSprintSnapshotSchema,
  GetSprintSnapshotSchema,
} from "~/server/api/schemas/snapshot";
import { createTRPCRouter } from "~/server/api/trpc";
import { CreateSprintSnapshotUseCase } from "~/server/logic/snapshot/CreateSprintSnapshotUseCase";
import { GetSprintSnapshotUseCase } from "~/server/logic/snapshot/GetSprintSnapshotUseCase";

export const snapshotRouter = createTRPCRouter({
  getSprintSnapshots: protectedProcedure
    .input(GetSprintSnapshotSchema)
    .query(async ({ ctx, input }) => {
      const getSnapshots = new GetSprintSnapshotUseCase(ctx.db);
      const snapshots = await getSnapshots.execute(input);
      return snapshots;
    }),
  createSprintSnapshot: protectedProcedure
    .input(CreateSprintSnapshotSchema)
    .mutation(async ({ ctx, input }) => {
      const createSnapshot = new CreateSprintSnapshotUseCase(ctx.db);
      const snapshot = await createSnapshot.execute(input);
      return snapshot;
    }),
});

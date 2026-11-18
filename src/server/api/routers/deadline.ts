import { protectedProcedure } from "~/server/api/procedures";
import { GetAllDeadlinesSchema } from "~/server/api/schemas/deadline";
import { createTRPCRouter } from "~/server/api/trpc";
import { GetAllDeadlinesUseCase } from "~/server/logic/deadline/GetAllDeadlinesUseCase";

export const deadlineRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(GetAllDeadlinesSchema)
    .query(async ({ ctx, input }) => {
      const getAllDeadlines = new GetAllDeadlinesUseCase(ctx.db);
      const deadlines = await getAllDeadlines.execute(input);
      return deadlines;
    }),
});

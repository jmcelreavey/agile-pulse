import { protectedProcedure } from "~/server/api/procedures";
import { GetAllTasksSchema, GetOneTaskSchema } from "~/server/api/schemas/task";
import { createTRPCRouter } from "~/server/api/trpc";
import { GetAllTasksUseCase } from "~/server/logic/task/GetAllTaskUseCase";
import { GetOneTaskUseCase } from "~/server/logic/task/GetOneTaskUseCase";

export const taskRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(GetAllTasksSchema)
    .query(async ({ ctx, input }) => {
      const getAllTasks = new GetAllTasksUseCase(ctx.db);
      const tasks = await getAllTasks.execute(input);
      return tasks;
    }),
  getOne: protectedProcedure
    .input(GetOneTaskSchema)
    .query(async ({ ctx, input }) => {
      const getOneTask = new GetOneTaskUseCase(ctx.db);
      const task = await getOneTask.execute(input);
      return task;
    }),
});

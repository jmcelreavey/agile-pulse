import { Prisma } from "~/generated/prisma/client";
import { type GetAllTasksInputType } from "~/server/api/schemas/task";
import {
  UseCase,
  type getInputType,
  type getReturnType,
} from "~/server/logic/useCase";
import { type State } from "~/shared/types/State";

export class GetAllTasksUseCase extends UseCase {
  async execute(input: GetAllTasksInputType) {
    const { projectId = -1, sprintId = -1, limit = 10, search } = input;

    let WhereClause = Prisma.sql`
      WHERE "Task"."snapshotId" IS NULL AND "Task"."deletedRecordId" IS NULL
    `;

    if (search) {
      WhereClause = Prisma.sql`
        ${WhereClause}
        AND "Task"."name" LIKE ${`%${search}%`}
      `;
    }

    const rawQuery = Prisma.sql`
        SELECT DISTINCT "Task"."id", "Task"."name", "Task"."state", "Task"."updatedAt", "Task"."description"
        FROM "Task"
        LEFT JOIN "SprintTask" ON "Task"."id" = "SprintTask"."taskId"
        LEFT JOIN "Sprint" ON "SprintTask"."sprintId" = "Sprint"."id"
        ${WhereClause}
        ORDER BY 
          CASE WHEN "SprintTask"."sprintId" = ${sprintId} THEN 0 ELSE 1 END,
          CASE WHEN "Sprint"."projectId" = ${projectId} THEN 0 ELSE 1 END,
          "Task"."updatedAt" DESC
        LIMIT ${limit};
      `;

    const tasks = await this.db.$queryRaw<
      {
        id: number;
        name: string;
        state: State;
        updatedAt: Date;
        description: string;
      }[]
    >(rawQuery);

    return tasks;
  }
}

export type GetAllTasksUseCaseType = getReturnType<GetAllTasksUseCase>;
export type GetAllTasksUseCaseInput = getInputType<GetAllTasksUseCase>;

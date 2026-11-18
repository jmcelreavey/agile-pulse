import { Prisma } from "~/generated/prisma/client";
import { type GetAllDeadlinesInputType } from "~/server/api/schemas/deadline";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class GetAllDeadlinesUseCase extends UseCase {
  async execute(input: GetAllDeadlinesInputType) {
    const { projectId = -1, sprintId = -1, limit = 10, search } = input;

    let WhereClause = Prisma.sql`
        WHERE "Deadline"."snapshotId" IS NULL AND "Deadline"."deletedRecordId" IS NULL
      `;

    if (search) {
      WhereClause = Prisma.sql`
        ${WhereClause}
        AND "Deadline"."name" LIKE ${`%${search}%`}
      `;
    }

    const rawQuery = Prisma.sql`
      SELECT DISTINCT 
        "Deadline"."id",
        "Deadline"."name",
        "Deadline"."description",
        "Deadline"."colour",
        "SprintDeadline"."sprintId",
        "SprintDeadline"."id" as "sprintDeadlineId",
        "SprintDeadline"."day"
      FROM "Deadline"
      LEFT JOIN "SprintDeadline" ON "Deadline"."id" = "SprintDeadline"."deadlineId"
      LEFT JOIN "Sprint" ON "SprintDeadline"."sprintId" = "Sprint"."id"
      ${WhereClause}
      GROUP BY Deadline.name
      ORDER BY 
        CASE WHEN "SprintDeadline"."sprintId" = ${sprintId} THEN 0 ELSE 1 END,
        CASE WHEN "Sprint"."projectId" = ${projectId} THEN 0 ELSE 1 END,
        "Deadline"."updatedAt" DESC
      LIMIT ${limit};
    `;

    const deadlines = await this.db.$queryRaw<
      {
        id: number;
        name: string;
        description: string | null;
        colour: string;
        sprintId: number | null;
        sprintDeadlineId: number | null;
        day: number | null;
      }[]
    >(rawQuery);

    const flattenedDeadlines = deadlines.map((d) => ({
      id: d.sprintDeadlineId,
      sprintId: d.sprintId,
      day: d.day,
      name: d.name,
      description: d.description ?? undefined,
      colour: d.colour,
    }));

    return flattenedDeadlines;
  }
}

export type GetSprintDeadlinesUseCaseType =
  getReturnType<GetAllDeadlinesUseCase>;
export type GetSprintDeadlinesUseCaseInput = Parameters<
  GetAllDeadlinesUseCase["execute"]
>[0];

import { Prisma } from "~/generated/prisma/client";
import { type GetAllSprintsInputType } from "~/server/api/schemas/sprint";
import {
  UseCase,
  type getInputType,
  type getReturnType,
} from "~/server/logic/useCase";
import { type State } from "~/shared/types/State";

export class GetAllSprintsUseCase extends UseCase {
  async execute(input: GetAllSprintsInputType) {
    const { projectId = -1, limit = 10, search } = input;

    let WhereClause = Prisma.sql`
        WHERE "Sprint"."snapshotId" IS NULL AND "Sprint"."deletedRecordId" IS NULL
      `;

    if (search) {
      WhereClause = Prisma.sql`
        ${WhereClause}
        AND "Sprint"."reference" LIKE ${`%${search}%`}
      `;
    }

    const rawQuery = Prisma.sql`
      SELECT DISTINCT "Sprint"."id", "Sprint"."reference", "Sprint"."createdAt"
      FROM "Sprint"
      LEFT JOIN "Project" ON "Sprint"."projectId" = "Project"."id"
      ${WhereClause}
      ORDER BY 
        CASE WHEN "Project"."id" = ${projectId} THEN 0 ELSE 1 END,
        "Sprint"."updatedAt" DESC
      LIMIT ${limit};
    `;

    const sprints = await this.db.$queryRaw<
      {
        id: number;
        reference: string;
        days: number;
        state: State;
      }[]
    >(rawQuery);

    return sprints;
  }
}

export type GetAllSprintsType = getReturnType<GetAllSprintsUseCase>;
export type GetAllSprintsInput = getInputType<GetAllSprintsUseCase>;

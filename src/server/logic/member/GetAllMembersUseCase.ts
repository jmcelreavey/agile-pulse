import { Prisma } from "~/generated/prisma/client";
import { type GetAllMembersInputType } from "~/server/api/schemas/member";
import {
  UseCase,
  type getInputType,
  type getReturnType,
} from "~/server/logic/useCase";

export class GetAllMembersUseCase extends UseCase {
  async execute(input: GetAllMembersInputType) {
    const { projectId = -1, sprintId = -1, limit = 10, search } = input;

    let WhereClause = Prisma.sql`
        WHERE "Member"."snapshotId" IS NULL AND "Member"."deletedRecordId" IS NULL
      `;

    if (search) {
      WhereClause = Prisma.sql`
        ${WhereClause}
        AND "Member"."name" LIKE ${`%${search}%`}
      `;
    }

    const rawQuery = Prisma.sql`
      SELECT DISTINCT "Member"."id", "Member"."name", "Member"."createdAt"
      FROM "Member"
      LEFT JOIN "SprintMember" ON "Member"."id" = "SprintMember"."memberId"
      LEFT JOIN "Sprint" ON "SprintMember"."sprintId" = "Sprint"."id"
      LEFT JOIN "Project" ON "Sprint"."projectId" = "Project"."id"
      ${WhereClause}
      ORDER BY 
        CASE WHEN "Project"."id" = ${projectId} THEN 0 ELSE 1 END,
        CASE WHEN "SprintMember"."sprintId" = ${sprintId} THEN 0 ELSE 1 END,
        "Member"."createdAt" DESC
      LIMIT ${limit};
    `;

    const members = await this.db.$queryRaw<
      {
        id: number;
        name: string;
        createdAt: Date;
      }[]
    >(rawQuery);

    return members;
  }
}

export type GetAllMembersUseCaseType = getReturnType<GetAllMembersUseCase>;
export type GetAllMembersUseCaseInput = getInputType<GetAllMembersUseCase>;

import { type GetAllChangelogsInputType } from "~/server/api/schemas/changelog";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class GetAllChangelogsUseCase extends UseCase {
  async execute(input: GetAllChangelogsInputType) {
    interface ChangelogWhereClause {
      sprintId?: number;
      sprint?: {
        projectId?: number;
        project?: {
          domain?: string;
        };
      };
      isPublished?: boolean;
    }

    const where: ChangelogWhereClause = {};

    if (input.sprintId) {
      where.sprintId = input.sprintId;
    } else if (input.projectId) {
      where.sprint = { projectId: input.projectId };
    }

    if (input.isPublished !== undefined) {
      where.isPublished = input.isPublished;
    }

    // Add domain-based access control
    if (!input.sprintId && !input.projectId && input.domain) {
      where.sprint = {
        project: {
          domain: input.domain,
        },
      };
    }

    const [changelogs, total] = await Promise.all([
      this.db.changelog.findMany({
        where,
        select: {
          id: true,
          content: true,
          tone: true,
          version: true,
          createdAt: true,
          updatedAt: true,
          sprintId: true,
          isPublished: true,
          taskIds: true,
          sharedAt: true,
          sharedViaEmail: true,
          exportedToPdf: true,
          sprint: {
            select: {
              id: true,
              reference: true,
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              sharingHistory: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: input.limit || 20,
        skip: input.offset || 0,
      }),
      this.db.changelog.count({ where }),
    ]);

    const limit = input.limit || 20;
    const offset = input.offset || 0;

    return {
      data: changelogs,
      total,
      hasMore: offset + limit < total,
    };
  }
}

export type GetAllChangelogsUseCaseReturnType =
  getReturnType<GetAllChangelogsUseCase>;

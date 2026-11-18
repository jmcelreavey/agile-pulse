import { type GetOneChangelogInputType } from "~/server/api/schemas/changelog";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class GetOneChangelogUseCase extends UseCase {
  async execute(input: GetOneChangelogInputType) {
    if (!input.id && !input.sprintId) {
      throw new Error("Either id or sprintId must be provided");
    }

    const changelog = await this.db.changelog.findFirst({
      where: input.id ? { id: input.id } : { sprintId: input.sprintId },
      include: {
        sprint: {
          include: {
            project: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sharingHistory: {
          include: {
            customer: true,
            sharedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return changelog;
  }
}

export type GetOneChangelogUseCaseReturnType =
  getReturnType<GetOneChangelogUseCase>;

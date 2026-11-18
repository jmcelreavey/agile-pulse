import { type GetSprintDeadlinesInputType } from "~/server/api/schemas/sprint";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class GetSprintDeadlinesUseCase extends UseCase {
  async execute(input: GetSprintDeadlinesInputType) {
    const deadlines = await this.db.sprintDeadline.findMany({
      where: {
        sprintId: input.sprintId,
      },
      select: {
        sprintId: true,
        id: true,
        day: true,
        deadline: {
          select: {
            id: true,
            name: true,
            description: true,
            colour: true,
          },
        },
      },
      orderBy: [
        {
          sprintId: input.sprintId ? "asc" : undefined,
        },
        {
          deadline: {
            updatedAt: "desc",
          },
        },
      ],
    });

    const flattenedDeadlines = deadlines.map((t) => {
      return {
        id: t.id,
        deadlineId: t.deadline.id,
        sprintId: t.sprintId,
        day: t.day,
        name: t.deadline.name,
        description: t.deadline.description ?? undefined,
        colour: t.deadline.colour,
      };
    });

    return flattenedDeadlines;
  }
}

export type GetSprintDeadlinesUseCaseType =
  getReturnType<GetSprintDeadlinesUseCase>;
export type GetSprintDeadlinesUseCaseInput = Parameters<
  GetSprintDeadlinesUseCase["execute"]
>[0];

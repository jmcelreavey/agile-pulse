import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class GetNextSprintUseCase extends UseCase {
  async execute(input: { id: number }) {
    const currentSprint = await this.db.sprint.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        startedAt: true,
        projectId: true,
      },
    });

    if (!currentSprint) {
      throw new RecordNotFoundError("Sprint not found");
    }

    if (!currentSprint.startedAt) {
      return false;
    }

    const sprint = await this.db.sprint.findFirst({
      where: {
        startedAt: {
          gt: currentSprint.startedAt,
        },
        projectId: currentSprint.projectId,
      },
      select: {
        id: true,
      },
      orderBy: {
        startedAt: "asc",
      },
    });

    if (!sprint) {
      return false;
    }

    return {
      id: sprint.id,
    };
  }
}

export type GetNextSprintUseCaseType = getReturnType<GetNextSprintUseCase>;
export type GetNextSprintUseCaseInput = Parameters<
  GetNextSprintUseCase["execute"]
>[0];

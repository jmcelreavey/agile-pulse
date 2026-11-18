import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class GetPreviousSprintUseCase extends UseCase {
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
        completedAt: {
          lt: currentSprint.startedAt,
        },
        projectId: currentSprint.projectId,
      },
      select: {
        id: true,
      },
      orderBy: {
        completedAt: "desc",
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

export type GetPreviousSprintUseCaseType =
  getReturnType<GetPreviousSprintUseCase>;
export type GetPreviousSprintUseCaseInput = Parameters<
  GetPreviousSprintUseCase["execute"]
>[0];

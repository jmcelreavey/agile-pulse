import { type ReopenSprintInputType } from "~/server/api/schemas/sprint";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { State } from "~/shared/types/State";

export class ReopenSprintUseCase extends UseCase {
  async execute(input: ReopenSprintInputType) {
    const sprint = await this.db.sprint.update({
      where: { id: input.id },
      data: {
        state: State.IN_PROGRESS,
        completedAt: null,
      },
    });

    if (!sprint) {
      throw new RecordNotFoundError("Sprint not found");
    }

    return sprint;
  }
}

export type ReopenSprintUseCaseType = getReturnType<ReopenSprintUseCase>;

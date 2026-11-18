import { type ReopenProjectInputType } from "~/server/api/schemas/project";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { State } from "~/shared/types/State";

export class ReopenProjectUseCase extends UseCase {
  async execute(input: ReopenProjectInputType) {
    const project = await this.db.project.update({
      where: { id: input.id },
      data: {
        state: State.IN_PROGRESS,
        completedAt: null,
      },
    });

    if (!project) {
      throw new RecordNotFoundError("Project not found");
    }

    return project;
  }
}

export type ReopenProjectUseCaseType = getReturnType<ReopenProjectUseCase>;

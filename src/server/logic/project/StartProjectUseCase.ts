import { type StartProjectInputType } from "~/server/api/schemas/project";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { GetProjectStateUseCase } from "~/server/logic/project/GetProjectStateUseCase";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { State } from "~/shared/types/State";

export class StartProjectUseCase extends UseCase {
  async execute(input: StartProjectInputType) {
    const getProjectState = new GetProjectStateUseCase(this.db);
    const state = await getProjectState.execute({
      id: input.id,
      state: State.IN_PROGRESS,
      startedAt: input.startedAt,
    });

    const project = await this.db.project.update({
      where: { id: input.id },
      data: {
        ...state,
      },
    });

    if (!project) {
      throw new RecordNotFoundError("Project not found");
    }

    return project;
  }
}

export type StartProjectUseCaseType = getReturnType<StartProjectUseCase>;
export type StartProjectInput = Parameters<StartProjectUseCase["execute"]>[0];

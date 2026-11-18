import { type CompleteProjectInputType } from "~/server/api/schemas/project";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { GetProjectStateUseCase } from "~/server/logic/project/GetProjectStateUseCase";
import { type getReturnType, UseCase } from "~/server/logic/useCase";
import { State } from "~/shared/types/State";

export class CompleteProjectUseCase extends UseCase {
  async execute(input: CompleteProjectInputType) {
    const getProjectState = new GetProjectStateUseCase(this.db);
    const state = await getProjectState.execute({
      id: input.id,
      state: State.COMPLETED,
      completedAt: input.completedAt,
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

export type CompleteProjectUseCaseType = getReturnType<CompleteProjectUseCase>;
export type CompleteProjectInput = Parameters<
  CompleteProjectUseCase["execute"]
>[0];

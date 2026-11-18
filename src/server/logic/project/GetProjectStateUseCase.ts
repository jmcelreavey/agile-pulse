import { GetProjectStateUtil } from "~/shared/logic/project/GetProjectStateUtil";

import { type GetProjectStateInputType } from "~/server/api/schemas/project";
import { type getReturnType, UseCase } from "~/server/logic/useCase";

export class GetProjectStateUseCase extends UseCase {
  async execute(input: GetProjectStateInputType) {
    const previousState = input.id
      ? await this.db.project.findFirst({
          where: { id: input.id },
          select: { state: true },
        })
      : undefined;

    const state = GetProjectStateUtil(
      input.state,
      previousState?.state,
      input.startedAt,
      input.completedAt
    );

    return state;
  }
}

export type GetProjectStateUseCaseType = getReturnType<GetProjectStateUseCase>;
export type GetProjectStateUseCaseInput = Parameters<
  GetProjectStateUseCase["execute"]
>[0];
